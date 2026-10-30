-- RLS tests: run after stubs.sql + migration on a scratch database.
-- Each check raises an exception on failure; success prints "ALL RLS TESTS PASSED".
revoke execute on function public.notify(uuid,text,text,text,text) from authenticated;
revoke execute on function public.notify_staff(text,text,text,text) from authenticated;

insert into auth.users(id, email, raw_user_meta_data) values
 ('00000000-0000-0000-0000-00000000000a','owner@test.dev','{"role":"owner","full_name":"Test Owner"}'),
 ('00000000-0000-0000-0000-00000000000b','admin@test.dev','{"role":"admin","full_name":"Test Admin"}'),
 ('00000000-0000-0000-0000-00000000000c','d1@test.dev','{"role":"driver","full_name":"Sample Driver One"}'),
 ('00000000-0000-0000-0000-00000000000d','d2@test.dev','{"role":"driver","full_name":"Sample Driver Two"}');

insert into public.drivers(id, profile_id, full_name, split_pct) values
 ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000c','Sample Driver One',40),
 ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-00000000000d','Sample Driver Two',50);
insert into public.driver_private(driver_id, dob, license_number) values ('10000000-0000-0000-0000-000000000001','1980-01-01','TEST123');
insert into public.driver_internal(driver_id, performance_notes) values ('10000000-0000-0000-0000-000000000001','internal only');
insert into public.customers(id, company, type) values ('20000000-0000-0000-0000-000000000001','Test Broker Co','broker');
insert into public.customer_rate_cards(customer_id, per_mile, day_rate) values ('20000000-0000-0000-0000-000000000001', 2.00, 800);
insert into public.loads(id, customer_id, pickup, dropoff, quick_pay, qp_fee_pct) values
 ('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Jackson, MS','Houston, TX','yes',5),
 ('30000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','Mobile, AL','Dallas, TX','no',null);
insert into public.load_assignments(load_id, driver_id) values ('30000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001');

do $$ begin
  if (select status from public.loads where id='30000000-0000-0000-0000-000000000001') <> 'assigned' then raise exception 'assignment should set status assigned'; end if;
  if not exists (select 1 from public.notifications n where n.user_id='00000000-0000-0000-0000-00000000000c' and kind='load_assigned') then raise exception 'driver not notified'; end if;
end $$;

-- ---------- as driver one
set role authenticated;
set request.jwt.sub = '00000000-0000-0000-0000-00000000000c';
do $$ declare n int; begin
  select count(*) into n from public.loads; if n <> 1 then raise exception 'driver1 should see 1 load, saw %', n; end if;
  select count(*) into n from public.drivers; if n <> 1 then raise exception 'driver1 should see only own driver row, saw %', n; end if;
  select count(*) into n from public.customer_rate_cards; if n <> 0 then raise exception 'driver must not see rate cards'; end if;
  select count(*) into n from public.driver_private; if n <> 0 then raise exception 'driver must not see private fields'; end if;
  select count(*) into n from public.driver_internal; if n <> 0 then raise exception 'driver must not see performance notes'; end if;
  select count(*) into n from public.customers; if n <> 1 then raise exception 'driver should see customer of assigned load'; end if;
  select count(*) into n from public.audit_log; if n <> 0 then raise exception 'driver must not read audit log'; end if;
  begin perform * from public.get_driver_private('10000000-0000-0000-0000-000000000001'); raise exception 'driver read private!';
  exception when others then if sqlerrm = 'driver read private!' then raise; end if; end;
end $$;
select public.set_my_status('needs_load', null);
select public.acknowledge_load('30000000-0000-0000-0000-000000000001');
insert into public.run_sheets(id, load_id, driver_id, total_due) values ('40000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001', 3525);
insert into public.run_sheet_legs(run_sheet_id, charged_as, miles) values ('40000000-0000-0000-0000-000000000001','day_rate',0);
do $$ begin
  -- cannot create a run sheet for a load not assigned
  begin insert into public.run_sheets(load_id, driver_id) values ('30000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001'); raise exception 'unassigned insert allowed!';
  exception when others then if sqlerrm = 'unassigned insert allowed!' then raise; end if; end;
  -- cannot approve own run sheet
  begin update public.run_sheets set status='approved' where id='40000000-0000-0000-0000-000000000001'; raise exception 'self-approve allowed!';
  exception when others then if sqlerrm = 'self-approve allowed!' then raise; end if; end;
end $$;
update public.run_sheets set status='submitted', submitted_at=now() where id='40000000-0000-0000-0000-000000000001';
do $$ declare n int; begin
  -- after submit, driver can no longer edit
  update public.run_sheets set total_due = 1 where id='40000000-0000-0000-0000-000000000001';
  get diagnostics n = row_count; if n <> 0 then raise exception 'driver edited submitted sheet'; end if;
end $$;

-- ---------- as driver two
set request.jwt.sub = '00000000-0000-0000-0000-00000000000d';
do $$ declare n int; begin
  select count(*) into n from public.loads; if n <> 0 then raise exception 'driver2 sees loads'; end if;
  select count(*) into n from public.run_sheets; if n <> 0 then raise exception 'driver2 sees run sheets'; end if;
  select count(*) into n from public.driver_runs; if n <> 0 then raise exception 'driver2 sees driver runs'; end if;
  select count(*) into n from public.notifications; if n <> 0 then raise exception 'driver2 sees others notifications'; end if;
  select count(*) into n from public.customers; if n <> 0 then raise exception 'driver2 sees customers'; end if;
end $$;

-- ---------- as admin
set request.jwt.sub = '00000000-0000-0000-0000-00000000000b';
do $$ declare n int; r record; begin
  select count(*) into n from public.loads; if n <> 2 then raise exception 'admin should see all loads'; end if;
  if not exists (select 1 from public.notifications where kind='run_sheet_submitted') then raise exception 'admin not notified of submit'; end if;
  perform * from public.get_driver_private('10000000-0000-0000-0000-000000000001');
  select * into r from public.driver_runs where run_sheet_id='40000000-0000-0000-0000-000000000001';
  -- 3525 total, QP 5% = 176.25, no gas, split 40% => (3525-176.25)*0.4 = 1339.50
  if r.qp_fee <> 176.25 or r.driver_pay <> 1339.50 then raise exception 'driver run math wrong: qp % pay %', r.qp_fee, r.driver_pay; end if;
  select count(*) into n from public.audit_log; if n <> 0 then raise exception 'admin must not read audit log (owner only)'; end if;
end $$;
update public.run_sheets set status='approved', approved_at=now() where id='40000000-0000-0000-0000-000000000001';
insert into public.invoices(id, load_id, run_sheet_id, customer_id, bill_to_name, total) values ('50000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Test Broker Co',3525);
insert into public.payments(invoice_id, amount, method) values ('50000000-0000-0000-0000-000000000001', 1000, 'zelle');
do $$ begin if (select status from public.invoices where id='50000000-0000-0000-0000-000000000001') <> 'partial' then raise exception 'partial payment status'; end if; end $$;
insert into public.payments(invoice_id, amount, method) values ('50000000-0000-0000-0000-000000000001', 2525, 'ach');
do $$ begin
  if (select status from public.invoices where id='50000000-0000-0000-0000-000000000001') <> 'paid' then raise exception 'paid status'; end if;
  if (select status from public.loads where id='30000000-0000-0000-0000-000000000001') <> 'paid' then raise exception 'load should be paid'; end if;
end $$;
do $$ begin
  begin update public.profiles set role='owner' where id='00000000-0000-0000-0000-00000000000b';
    if (select role from public.profiles where id='00000000-0000-0000-0000-00000000000b') = 'owner' then raise exception 'admin promoted self!'; end if;
  end;
end $$;

-- ---------- as owner
set request.jwt.sub = '00000000-0000-0000-0000-00000000000a';
do $$ declare n int; begin
  select count(*) into n from public.audit_log where action = 'view_sensitive'; if n < 1 then raise exception 'sensitive view not audited'; end if;
  select count(*) into n from public.audit_log; if n < 5 then raise exception 'owner should see audit log'; end if;
end $$;

-- ---------- anonymous
set request.jwt.sub = '';
set role anon;
do $$ declare n int; begin
  select count(*) into n from public.loads; if n <> 0 then raise exception 'anon sees loads'; end if;
  select count(*) into n from public.invoices; if n <> 0 then raise exception 'anon sees invoices'; end if;
  select count(*) into n from public.profiles; if n <> 0 then raise exception 'anon sees profiles'; end if;
end $$;
reset role;
select 'ALL RLS TESTS PASSED';
