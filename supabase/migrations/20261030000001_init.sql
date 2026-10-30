-- D & T Escort Service portal: schema, row level security, triggers.
-- Run once in Supabase: SQL Editor > New query > paste > Run.
-- Every table has RLS enabled. Roles: owner, admin (staff), driver.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- enums
create type public.app_role as enum ('owner', 'admin', 'driver');
create type public.load_status as enum ('draft','booked','assigned','in_progress','delivered','run_sheet_submitted','invoiced','paid','cancelled');
create type public.driver_status as enum ('needs_load','on_load','vacation','other');
create type public.escort_position as enum ('lead','chase','high_pole','steer','route_survey','third_car');
create type public.party_type as enum ('broker','direct','other','not_set');
create type public.yes_no_unset as enum ('yes','no','not_set');
create type public.run_sheet_status as enum ('draft','submitted','approved');
create type public.invoice_status as enum ('draft','sent','delivered','viewed','failed','partial','paid','overdue','void');
create type public.charge_type as enum ('miles','day_rate','mini','no_go');

-- ---------------------------------------------------------------- core
create table public.roles (
  role public.app_role primary key,
  description text not null
);
insert into public.roles values
  ('owner','Full access, user management, financial reports, audit log'),
  ('admin','Dispatch: loads, drivers, customers, invoices'),
  ('driver','Own profile, loads, run sheets, pay and notifications');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'driver',
  full_name text not null default '',
  email text not null default '',
  phone text,
  must_change_password boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- helpers
create or replace function public.my_role() returns public.app_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and active
$$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('owner','admin') from public.profiles where id = auth.uid() and active), false)
$$;

create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'owner' from public.profiles where id = auth.uid() and active), false)
$$;

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ---------------------------------------------------------------- drivers
create table public.drivers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles(id) on delete set null,
  full_name text not null,
  phone text,
  email text,
  home_address text,
  emergency_contact_name text,
  emergency_contact_phone text,
  employment_type text not null default 'contractor' check (employment_type in ('contractor','employee')),
  start_date date,
  active boolean not null default true,
  status public.driver_status,
  status_note text,
  status_updated_at timestamptz,
  positions public.escort_position[] not null default '{}',
  split_pct numeric(5,2) not null default 40 check (split_pct between 0 and 100),
  license_state text,
  license_class text,
  license_expires date,
  equipment jsonb not null default '{}'::jsonb,
  payment_method text check (payment_method in ('cashapp','zelle','direct_deposit','check','other')),
  payment_handle_last4 text check (payment_handle_last4 is null or length(payment_handle_last4) <= 4),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger drivers_touch before update on public.drivers for each row execute function public.touch_updated_at();

create or replace function public.my_driver_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.drivers where profile_id = auth.uid()
$$;

-- Sensitive fields. No direct table access: read/write only through the
-- audited functions below (owner/admin).
create table public.driver_private (
  driver_id uuid primary key references public.drivers(id) on delete cascade,
  dob date,
  license_number text,
  vin text,
  updated_at timestamptz not null default now()
);

-- Internal rating / performance notes: office only (drivers can't read this table).
create table public.driver_internal (
  driver_id uuid primary key references public.drivers(id) on delete cascade,
  performance_notes text,
  updated_at timestamptz not null default now()
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.drivers(id) on delete cascade,
  year int, make text, model text, color text,
  plate text, plate_state text,
  registration_expires date,
  inspection_date date,
  created_at timestamptz not null default now()
);

create table public.certifications (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.drivers(id) on delete cascade,
  kind text not null check (kind in ('pevo','state_certification','pilot_car_permit','insurance','other')),
  state text,
  issuer text,           -- e.g. insurance provider
  number text,
  issued_on date,
  expires_on date,
  file_path text,
  created_at timestamptz not null default now()
);

create table public.driver_documents (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.drivers(id) on delete cascade,
  doc_type text not null check (doc_type in ('w9','agreement','insurance_certificate','license','certification','vehicle_registration','other')),
  file_path text not null,
  file_name text not null,
  expires_on date,
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.driver_status_history (
  id bigint generated always as identity primary key,
  driver_id uuid not null references public.drivers(id) on delete cascade,
  status public.driver_status not null,
  note text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- customers
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  contact_name text,
  phone text,
  email text,
  type public.party_type not null default 'not_set',
  billing_email text,
  billing_contact text,
  billing_phone text,
  payment_terms text,
  quick_pay public.yes_no_unset not null default 'not_set',
  qp_fee_pct numeric(5,2),
  avg_days_to_pay numeric(6,1), -- maintained from payments
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger customers_touch before update on public.customers for each row execute function public.touch_updated_at();
create index on public.customers (lower(company));

create table public.customer_rate_cards (
  customer_id uuid primary key references public.customers(id) on delete cascade,
  per_mile numeric(10,2),
  day_rate numeric(10,2),
  no_go numeric(10,2),
  overnight numeric(10,2),
  flat_rate numeric(10,2),
  mini_run numeric(10,2),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- loads
create sequence public.load_no_seq start 1001;

create table public.loads (
  id uuid primary key default gen_random_uuid(),
  load_no text not null unique default ('L-' || nextval('public.load_no_seq')),
  status public.load_status not null default 'booked',
  booked_by text,
  customer_id uuid references public.customers(id),
  invoice_customer_id uuid references public.customers(id),
  invoice_email text,
  invoice_type public.party_type not null default 'not_set',
  billing_contact text,
  billing_phone text,
  quick_pay public.yes_no_unset not null default 'not_set',
  qp_fee_pct numeric(5,2),
  paid_by text check (paid_by is null or paid_by in ('cashapp','zelle','direct_deposit','ach','check','stripe','other')),
  payment_terms text,
  truck_driver_name text,
  truck_driver_phone text,
  trucking_company text,
  truck_number text,
  pickup text,
  dropoff text,
  load_date date,
  est_miles numeric(10,1),
  empty_at text,
  order_no text,
  height text, width text, length text, weight text,
  rate_per_mile numeric(10,2),
  rate_day numeric(10,2),
  rate_overnight numeric(10,2),
  rate_no_go numeric(10,2),
  rate_mini numeric(10,2),
  rate_flat numeric(10,2),
  remarks text,
  raw_notes text,
  on_time boolean,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger loads_touch before update on public.loads for each row execute function public.touch_updated_at();
create index on public.loads (status);
create index on public.loads (load_date);

create table public.load_positions (
  load_id uuid not null references public.loads(id) on delete cascade,
  position public.escort_position not null,
  primary key (load_id, position)
);

create table public.load_assignments (
  id uuid primary key default gen_random_uuid(),
  load_id uuid not null references public.loads(id) on delete cascade,
  driver_id uuid not null references public.drivers(id) on delete cascade,
  position public.escort_position,
  acknowledged_at timestamptz,
  created_at timestamptz not null default now(),
  unique (load_id, driver_id)
);

-- ---------------------------------------------------------------- run sheets
create table public.driver_settlements (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.drivers(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  cash_advances numeric(10,2) not null default 0,
  status text not null default 'open' check (status in ('open','paid')),
  paid_on date,
  method text,
  reference text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.run_sheets (
  id uuid primary key default gen_random_uuid(),
  load_id uuid not null references public.loads(id) on delete cascade,
  driver_id uuid not null references public.drivers(id) on delete cascade,
  status public.run_sheet_status not null default 'draft',
  invoice_date date,
  load_number text,
  trucking_company text,
  truck_number text,
  trailer_number text,
  truck_driver_name text,
  truck_driver_phone text,
  invoice_email text,
  start_location text,
  end_location text,
  load_description text,
  height text, width text, length text, weight text,
  positions public.escort_position[] not null default '{}',
  rate_per_mile numeric(10,2),
  rate_day numeric(10,2),
  rate_mini numeric(10,2),
  rate_overnight numeric(10,2),
  rate_no_go numeric(10,2),
  gas_amount numeric(10,2) not null default 0,
  include_gas boolean not null default false,
  -- computed by the app (src/lib/runsheet.ts) and re-checked on approval
  total_miles numeric(10,1) not null default 0,
  amount_mileage numeric(10,2) not null default 0,
  amount_day numeric(10,2) not null default 0,
  amount_mini numeric(10,2) not null default 0,
  amount_overnight numeric(10,2) not null default 0,
  amount_no_go numeric(10,2) not null default 0,
  total_due numeric(10,2) not null default 0,
  notes text,
  -- optional extras (enabled in Settings)
  odometer_start numeric(10,1), odometer_end numeric(10,1),
  time_start timestamptz, time_end timestamptz,
  wait_minutes int,
  tolls numeric(10,2), lodging numeric(10,2), per_diem numeric(10,2),
  incident_report text,
  route_deviation text,
  permits text,
  police_escort boolean,
  equipment_checked boolean,
  gps_start jsonb, gps_end jsonb,
  driver_signature text, customer_signature text,
  customer_rating int check (customer_rating between 1 and 5),
  dispute boolean not null default false,
  admin_comment text,
  driver_split_pct numeric(5,2), -- snapshot when approved
  settlement_id uuid references public.driver_settlements(id) on delete set null,
  submitted_at timestamptz,
  approved_at timestamptz,
  approved_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (load_id, driver_id)
);
create trigger run_sheets_touch before update on public.run_sheets for each row execute function public.touch_updated_at();

create table public.run_sheet_legs (
  id uuid primary key default gen_random_uuid(),
  run_sheet_id uuid not null references public.run_sheets(id) on delete cascade,
  seq int not null default 0,
  charged_as public.charge_type not null default 'miles',
  overnight boolean not null default false,
  leg_date date,
  miles numeric(10,1) not null default 0,
  start_location text,
  end_location text
);

create table public.run_sheet_files (
  id uuid primary key default gen_random_uuid(),
  run_sheet_id uuid not null references public.run_sheets(id) on delete cascade,
  kind text not null check (kind in ('receipt','fuel','lodging','photo','delivery_ticket','other')),
  file_path text not null,
  file_name text not null,
  created_at timestamptz not null default now()
);

create table public.run_sheet_events (
  id bigint generated always as identity primary key,
  run_sheet_id uuid not null references public.run_sheets(id) on delete cascade,
  actor uuid references public.profiles(id),
  event text not null,   -- saved, submitted, approved, comment, dispute
  comment text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- invoices
create sequence public.invoice_no_seq start 1001;

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  number text not null unique default ('DT-' || nextval('public.invoice_no_seq')),
  load_id uuid references public.loads(id) on delete set null,
  run_sheet_id uuid references public.run_sheets(id) on delete set null,
  customer_id uuid references public.customers(id),
  bill_to_name text not null default '',
  bill_to_email text,
  issue_date date not null default current_date,
  due_date date,
  status public.invoice_status not null default 'draft',
  subtotal numeric(12,2) not null default 0,
  qp_fee numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  amount_paid numeric(12,2) not null default 0,
  notes text,
  public_token uuid not null default gen_random_uuid() unique,
  stripe_payment_link_id text,
  stripe_payment_link_url text,
  resend_email_id text,
  sent_at timestamptz,
  viewed_at timestamptz,
  paid_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger invoices_touch before update on public.invoices for each row execute function public.touch_updated_at();

create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  seq int not null default 0,
  kind text not null check (kind in ('mileage','day_rate','mini_run','overnight','no_go','gas','tolls','lodging','adjustment','qp_fee','flat_rate')),
  description text not null default '',
  qty numeric(10,2) not null default 1,
  rate numeric(10,2) not null default 0,
  amount numeric(12,2) not null default 0
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  method text not null check (method in ('ach','zelle','cashapp','check','stripe','direct_deposit','other')),
  paid_on date not null default current_date,
  reference text,
  source text not null default 'manual' check (source in ('manual','stripe')),
  recorded_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.email_events (
  id bigint generated always as identity primary key,
  invoice_id uuid references public.invoices(id) on delete cascade,
  resend_email_id text,
  type text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- ops
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.notifications (user_id, read_at);

create table public.todos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  assigned_to uuid references public.profiles(id),
  due_on date,
  done_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  keys jsonb not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- compliance
create table public.consent_log (
  id bigint generated always as identity primary key,
  subject_email text,
  purpose text not null,
  granted boolean not null,
  source text not null,
  created_at timestamptz not null default now()
);

create table public.deletion_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  scope text not null,
  details text,
  status text not null default 'received' check (status in ('received','verifying','completed','rejected')),
  verified_at timestamptz,
  completed_at timestamptz,
  due_by date not null default (current_date + 30),
  handled_by uuid references public.profiles(id),
  notes text,
  created_at timestamptz not null default now()
);

create table public.suppression_list (
  email text primary key,
  reason text not null default 'unsubscribed',
  created_at timestamptz not null default now()
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor uuid,
  action text not null,
  table_name text,
  record_id text,
  detail jsonb,
  created_at timestamptz not null default now()
);
create index on public.audit_log (created_at desc);

create table public.login_attempts (
  id bigint generated always as identity primary key,
  email text not null,
  success boolean not null,
  created_at timestamptz not null default now()
);
create index on public.login_attempts (lower(email), created_at desc);

-- ---------------------------------------------------------------- audit + notify
create or replace function public.audit_row() returns trigger
language plpgsql security definer set search_path = public as $$
declare rid text; d jsonb;
begin
  rid := coalesce((case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end)->>'id',
                  (case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end)->>'driver_id');
  if tg_op = 'UPDATE' then
    select jsonb_object_agg(n.key, n.value) into d
    from jsonb_each(to_jsonb(new)) n
    join jsonb_each(to_jsonb(old)) o using (key)
    where n.value is distinct from o.value and n.key not in ('updated_at');
  elsif tg_op = 'INSERT' then d := null;
  end if;
  insert into public.audit_log(actor, action, table_name, record_id, detail)
  values (auth.uid(), lower(tg_op), tg_table_name, rid, d);
  return coalesce(new, old);
end $$;

create trigger audit_loads after insert or update or delete on public.loads for each row execute function public.audit_row();
create trigger audit_invoices after insert or update or delete on public.invoices for each row execute function public.audit_row();
create trigger audit_payments after insert or update or delete on public.payments for each row execute function public.audit_row();
create trigger audit_drivers after insert or update or delete on public.drivers for each row execute function public.audit_row();
create trigger audit_customers after insert or update or delete on public.customers for each row execute function public.audit_row();
create trigger audit_run_sheets after update of status, total_due, approved_at on public.run_sheets for each row execute function public.audit_row();
create trigger audit_profiles after insert or update or delete on public.profiles for each row execute function public.audit_row();
create trigger audit_settlements after insert or update on public.driver_settlements for each row execute function public.audit_row();

-- in-app notification helper (security definer so triggers can notify anyone)
create or replace function public.notify(p_user uuid, p_kind text, p_title text, p_body text, p_link text)
returns void language sql security definer set search_path = public as $$
  insert into public.notifications(user_id, kind, title, body, link) values (p_user, p_kind, p_title, p_body, p_link)
$$;

create or replace function public.notify_staff(p_kind text, p_title text, p_body text, p_link text)
returns void language sql security definer set search_path = public as $$
  insert into public.notifications(user_id, kind, title, body, link)
  select id, p_kind, p_title, p_body, p_link from public.profiles where role in ('owner','admin') and active
$$;
revoke execute on function public.notify(uuid,text,text,text,text) from public, anon, authenticated;
revoke execute on function public.notify_staff(text,text,text,text) from public, anon, authenticated;

create or replace function public.on_assignment() returns trigger
language plpgsql security definer set search_path = public as $$
declare l record; uid uuid;
begin
  select * into l from public.loads where id = new.load_id;
  select profile_id into uid from public.drivers where id = new.driver_id;
  if uid is not null then
    perform public.notify(uid, 'load_assigned', 'New load ' || l.load_no,
      coalesce(l.pickup,'?') || ' to ' || coalesce(l.dropoff,'?') || coalesce(' on ' || to_char(l.load_date,'Mon DD'),''),
      '/driver/loads/' || l.id);
  end if;
  if l.status in ('draft','booked') then update public.loads set status = 'assigned' where id = l.id; end if;
  return new;
end $$;
create trigger load_assignment_notify after insert on public.load_assignments for each row execute function public.on_assignment();

create or replace function public.on_run_sheet_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare l record; dname text;
begin
  if new.status = 'submitted' and (old.status is distinct from 'submitted') then
    select load_no into l from public.loads where id = new.load_id;
    select full_name into dname from public.drivers where id = new.driver_id;
    perform public.notify_staff('run_sheet_submitted', 'Run sheet submitted: ' || l.load_no,
      coalesce(dname,'A driver') || ' submitted a run sheet.', '/portal/run-sheets/' || new.id);
    update public.loads set status = 'run_sheet_submitted' where id = new.load_id and status not in ('invoiced','paid','cancelled');
  end if;
  return new;
end $$;
create trigger run_sheet_notify after update on public.run_sheets for each row execute function public.on_run_sheet_change();

create or replace function public.on_invoice_status() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status and new.status in ('delivered','failed','paid','viewed') then
    perform public.notify_staff('invoice_' || new.status, 'Invoice ' || new.number || ' ' || new.status,
      new.bill_to_name || ': $' || to_char(new.total, 'FM999,999,990.00'), '/portal/invoices/' || new.id);
  end if;
  if new.status = 'paid' and old.status is distinct from 'paid' and new.load_id is not null then
    update public.loads set status = 'paid' where id = new.load_id;
  end if;
  return new;
end $$;
create trigger invoice_status_notify after update on public.invoices for each row execute function public.on_invoice_status();

create or replace function public.on_deletion_request() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.notify_staff('deletion_request', 'Data deletion request', new.name || ' <' || new.email || '>', '/portal/settings/deletion');
  return new;
end $$;
create trigger deletion_request_notify after insert on public.deletion_requests for each row execute function public.on_deletion_request();

-- payments keep invoice amount_paid / status in sync
create or replace function public.on_payment() returns trigger
language plpgsql security definer set search_path = public as $$
declare inv_id uuid; paid numeric; tot numeric;
begin
  inv_id := coalesce(new.invoice_id, old.invoice_id);
  select coalesce(sum(amount),0) into paid from public.payments where invoice_id = inv_id;
  select total into tot from public.invoices where id = inv_id;
  update public.invoices set amount_paid = paid,
    status = case when paid >= tot and tot > 0 then 'paid'::invoice_status
                  when paid > 0 then 'partial'::invoice_status
                  else status end,
    paid_at = case when paid >= tot and tot > 0 then coalesce(paid_at, now()) else paid_at end
  where id = inv_id;
  return coalesce(new, old);
end $$;
create trigger payment_sync after insert or update or delete on public.payments for each row execute function public.on_payment();

-- ---------------------------------------------------------------- RPCs
-- Driver sets own status (also logs history).
create or replace function public.set_my_status(p_status public.driver_status, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare d uuid := public.my_driver_id();
begin
  if d is null then raise exception 'not a driver'; end if;
  update public.drivers set status = p_status, status_note = nullif(trim(p_note),''), status_updated_at = now() where id = d;
  insert into public.driver_status_history(driver_id, status, note) values (d, p_status, nullif(trim(p_note),''));
end $$;

-- Staff sets a driver's status.
create or replace function public.set_driver_status(p_driver uuid, p_status public.driver_status, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'not allowed'; end if;
  update public.drivers set status = p_status, status_note = nullif(trim(p_note),''), status_updated_at = now() where id = p_driver;
  insert into public.driver_status_history(driver_id, status, note) values (p_driver, p_status, nullif(trim(p_note),''));
end $$;

create or replace function public.acknowledge_load(p_load uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.load_assignments set acknowledged_at = coalesce(acknowledged_at, now())
  where load_id = p_load and driver_id = public.my_driver_id();
  if not found then raise exception 'not assigned'; end if;
end $$;

-- Audited access to sensitive driver fields (owner/admin only).
create or replace function public.get_driver_private(p_driver uuid)
returns table (dob date, license_number text, vin text)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'not allowed'; end if;
  insert into public.audit_log(actor, action, table_name, record_id) values (auth.uid(), 'view_sensitive', 'driver_private', p_driver::text);
  return query select dp.dob, dp.license_number, dp.vin from public.driver_private dp where dp.driver_id = p_driver;
end $$;

create or replace function public.set_driver_private(p_driver uuid, p_dob date, p_license text, p_vin text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'not allowed'; end if;
  insert into public.driver_private(driver_id, dob, license_number, vin, updated_at)
  values (p_driver, p_dob, nullif(trim(p_license),''), nullif(trim(p_vin),''), now())
  on conflict (driver_id) do update set dob = excluded.dob, license_number = excluded.license_number, vin = excluded.vin, updated_at = now();
  insert into public.audit_log(actor, action, table_name, record_id) values (auth.uid(), 'edit_sensitive', 'driver_private', p_driver::text);
end $$;

create or replace function public.mark_notifications_read(p_ids uuid[] default null)
returns void language sql security definer set search_path = public as $$
  update public.notifications set read_at = now()
  where user_id = auth.uid() and read_at is null and (p_ids is null or id = any(p_ids))
$$;

-- ---------------------------------------------------------------- views
-- One row per run sheet: the driver-runs math from the business's tracking sheet.
--   QP fee = load total x QP%  (only when the load is quick pay)
--   Driver pay = (load total - QP fee - gas) x driver split %
--   Profit = load total - driver pay - gas - QP fee
create or replace view public.driver_runs with (security_invoker = true) as
select
  rs.id as run_sheet_id,
  rs.driver_id,
  d.full_name as driver_name,
  rs.load_id,
  l.load_no,
  coalesce(rs.invoice_date, l.load_date) as run_date,
  array_to_string(rs.positions, ', ') as positions,
  coalesce(rs.start_location, l.pickup) || ' to ' || coalesce(rs.end_location, l.dropoff) as location,
  rs.total_due as load_total,
  case when rs.include_gas then rs.gas_amount else 0 end as gas,
  case when l.quick_pay = 'yes' then round(rs.total_due * coalesce(l.qp_fee_pct,0) / 100, 2) else 0 end as qp_fee,
  coalesce(rs.driver_split_pct, d.split_pct) as split_pct,
  round((rs.total_due
        - case when l.quick_pay = 'yes' then round(rs.total_due * coalesce(l.qp_fee_pct,0) / 100, 2) else 0 end
        - case when rs.include_gas then rs.gas_amount else 0 end)
        * coalesce(rs.driver_split_pct, d.split_pct) / 100, 2) as driver_pay,
  c.type as client_type,
  c.company,
  i.number as invoice_no,
  rs.status,
  rs.settlement_id
from public.run_sheets rs
join public.drivers d on d.id = rs.driver_id
join public.loads l on l.id = rs.load_id
left join public.customers c on c.id = l.customer_id
left join lateral (select number from public.invoices where run_sheet_id = rs.id and status <> 'void' order by created_at desc limit 1) i on true
where rs.status in ('submitted','approved');

create or replace view public.expiring_items with (security_invoker = true) as
select d.id as driver_id, d.full_name, 'Driver license' as item, d.license_expires as expires_on from public.drivers d where d.license_expires is not null and d.active
union all
select c.driver_id, d.full_name,
  case c.kind when 'pevo' then 'PEVO certification' when 'state_certification' then coalesce(c.state,'') || ' certification'
              when 'pilot_car_permit' then coalesce(c.state,'') || ' pilot car permit' when 'insurance' then 'Insurance' else 'Certification' end,
  c.expires_on
from public.certifications c join public.drivers d on d.id = c.driver_id where c.expires_on is not null and d.active
union all
select v.driver_id, d.full_name, 'Vehicle registration', v.registration_expires from public.vehicles v join public.drivers d on d.id = v.driver_id where v.registration_expires is not null and d.active
union all
select dd.driver_id, d.full_name, initcap(replace(dd.doc_type,'_',' ')), dd.expires_on from public.driver_documents dd join public.drivers d on d.id = dd.driver_id where dd.expires_on is not null and d.active;

-- ---------------------------------------------------------------- RLS
alter table public.roles enable row level security;
alter table public.profiles enable row level security;
alter table public.settings enable row level security;
alter table public.drivers enable row level security;
alter table public.driver_private enable row level security;
alter table public.driver_internal enable row level security;
alter table public.vehicles enable row level security;
alter table public.certifications enable row level security;
alter table public.driver_documents enable row level security;
alter table public.driver_status_history enable row level security;
alter table public.customers enable row level security;
alter table public.customer_rate_cards enable row level security;
alter table public.loads enable row level security;
alter table public.load_positions enable row level security;
alter table public.load_assignments enable row level security;
alter table public.driver_settlements enable row level security;
alter table public.run_sheets enable row level security;
alter table public.run_sheet_legs enable row level security;
alter table public.run_sheet_files enable row level security;
alter table public.run_sheet_events enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payments enable row level security;
alter table public.email_events enable row level security;
alter table public.notifications enable row level security;
alter table public.todos enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.consent_log enable row level security;
alter table public.deletion_requests enable row level security;
alter table public.suppression_list enable row level security;
alter table public.audit_log enable row level security;
alter table public.login_attempts enable row level security; -- no policies: service role only

create policy roles_read on public.roles for select to authenticated using (true);

create policy profiles_self on public.profiles for select to authenticated using (id = auth.uid() or public.is_staff());
create policy profiles_owner_write on public.profiles for update to authenticated using (public.is_owner()) with check (public.is_owner());

create policy settings_read on public.settings for select to authenticated using (true);
create policy settings_staff_write on public.settings for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- drivers
create policy drivers_staff on public.drivers for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy drivers_self_read on public.drivers for select to authenticated using (profile_id = auth.uid());
-- driver_private: no policies on purpose (functions only)

create policy driver_internal_staff on public.driver_internal for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy vehicles_staff on public.vehicles for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy vehicles_self on public.vehicles for select to authenticated using (driver_id = public.my_driver_id());

create policy certs_staff on public.certifications for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy certs_self on public.certifications for select to authenticated using (driver_id = public.my_driver_id());

create policy docs_staff on public.driver_documents for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy docs_self_read on public.driver_documents for select to authenticated using (driver_id = public.my_driver_id());
create policy docs_self_insert on public.driver_documents for insert to authenticated with check (driver_id = public.my_driver_id());

create policy status_hist_staff on public.driver_status_history for select to authenticated using (public.is_staff());
create policy status_hist_self on public.driver_status_history for select to authenticated using (driver_id = public.my_driver_id());

-- customers: staff; drivers can read the company on loads they're assigned to
create policy customers_staff on public.customers for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy customers_driver on public.customers for select to authenticated using (
  exists (select 1 from public.loads l join public.load_assignments a on a.load_id = l.id
          where l.customer_id = customers.id and a.driver_id = public.my_driver_id()));
create policy ratecards_staff on public.customer_rate_cards for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- loads
create policy loads_staff on public.loads for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy loads_driver on public.loads for select to authenticated using (
  exists (select 1 from public.load_assignments a where a.load_id = loads.id and a.driver_id = public.my_driver_id()));
create policy load_positions_staff on public.load_positions for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy load_positions_driver on public.load_positions for select to authenticated using (
  exists (select 1 from public.load_assignments a where a.load_id = load_positions.load_id and a.driver_id = public.my_driver_id()));
create policy assignments_staff on public.load_assignments for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy assignments_self on public.load_assignments for select to authenticated using (driver_id = public.my_driver_id());

-- run sheets: drivers create/edit their own while draft; submit moves to 'submitted'; only staff approve
create policy rs_staff on public.run_sheets for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy rs_self_read on public.run_sheets for select to authenticated using (driver_id = public.my_driver_id());
create policy rs_self_insert on public.run_sheets for insert to authenticated with check (
  driver_id = public.my_driver_id() and status in ('draft','submitted')
  and exists (select 1 from public.load_assignments a where a.load_id = run_sheets.load_id and a.driver_id = public.my_driver_id()));
create policy rs_self_update on public.run_sheets for update to authenticated
  using (driver_id = public.my_driver_id() and status = 'draft')
  with check (driver_id = public.my_driver_id() and status in ('draft','submitted') and approved_at is null and settlement_id is null);

create policy legs_staff on public.run_sheet_legs for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy legs_self_read on public.run_sheet_legs for select to authenticated using (
  exists (select 1 from public.run_sheets r where r.id = run_sheet_legs.run_sheet_id and r.driver_id = public.my_driver_id()));
create policy legs_self_write on public.run_sheet_legs for all to authenticated
  using (exists (select 1 from public.run_sheets r where r.id = run_sheet_legs.run_sheet_id and r.driver_id = public.my_driver_id() and r.status = 'draft'))
  with check (exists (select 1 from public.run_sheets r where r.id = run_sheet_legs.run_sheet_id and r.driver_id = public.my_driver_id() and r.status = 'draft'));

create policy rsfiles_staff on public.run_sheet_files for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy rsfiles_self on public.run_sheet_files for select to authenticated using (
  exists (select 1 from public.run_sheets r where r.id = run_sheet_files.run_sheet_id and r.driver_id = public.my_driver_id()));
create policy rsfiles_self_insert on public.run_sheet_files for insert to authenticated with check (
  exists (select 1 from public.run_sheets r where r.id = run_sheet_files.run_sheet_id and r.driver_id = public.my_driver_id() and r.status = 'draft'));

create policy rsevents_staff on public.run_sheet_events for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy rsevents_self on public.run_sheet_events for select to authenticated using (
  exists (select 1 from public.run_sheets r where r.id = run_sheet_events.run_sheet_id and r.driver_id = public.my_driver_id()));
create policy rsevents_self_insert on public.run_sheet_events for insert to authenticated with check (
  actor = auth.uid() and exists (select 1 from public.run_sheets r where r.id = run_sheet_events.run_sheet_id and r.driver_id = public.my_driver_id()));

-- money
create policy settle_staff on public.driver_settlements for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy settle_self on public.driver_settlements for select to authenticated using (driver_id = public.my_driver_id());
create policy invoices_staff on public.invoices for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy invoice_items_staff on public.invoice_items for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy payments_staff on public.payments for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy email_events_staff on public.email_events for select to authenticated using (public.is_staff());

-- ops
create policy notif_self on public.notifications for select to authenticated using (user_id = auth.uid());
create policy notif_self_update on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy todos_staff on public.todos for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy push_self on public.push_subscriptions for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- compliance
create policy consent_staff on public.consent_log for select to authenticated using (public.is_staff());
create policy deletion_staff on public.deletion_requests for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy suppression_staff on public.suppression_list for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy audit_owner on public.audit_log for select to authenticated using (public.is_owner());

-- views run with the caller's rights (security_invoker), so RLS above applies.
grant select on public.driver_runs, public.expiring_items to authenticated;

-- ---------------------------------------------------------------- storage
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('driver-docs', 'driver-docs', false, 10485760, array['application/pdf','image/jpeg','image/png','image/webp','image/heic']),
  ('run-sheet-files', 'run-sheet-files', false, 10485760, array['application/pdf','image/jpeg','image/png','image/webp','image/heic'])
on conflict (id) do nothing;

-- Files are stored under "<driver_id>/..." so a driver can only touch their own folder.
create policy storage_staff_all on storage.objects for all to authenticated
  using (bucket_id in ('driver-docs','run-sheet-files') and public.is_staff())
  with check (bucket_id in ('driver-docs','run-sheet-files') and public.is_staff());
create policy storage_driver_read on storage.objects for select to authenticated
  using (bucket_id in ('driver-docs','run-sheet-files') and (storage.foldername(name))[1] = public.my_driver_id()::text);
create policy storage_driver_insert on storage.objects for insert to authenticated
  with check (bucket_id in ('driver-docs','run-sheet-files') and (storage.foldername(name))[1] = public.my_driver_id()::text);

-- ---------------------------------------------------------------- defaults
insert into public.settings(key, value) values
  ('company', '{"name":"D & T Escort Service LLC","address":"3897 I-55 S, Jackson, MS 39212","phone":"(601) 706-3404","email":"dtescortservice@gmail.com"}'),
  ('booked_by', '["Jim","Boss"]'),
  ('positions', '["lead","chase","high_pole","steer","route_survey","third_car"]'),
  ('default_rates', '{"per_mile":null,"day_rate":null,"overnight":null,"no_go":null,"mini_run":null,"flat_rate":null}'),
  ('payment_instructions', '{"text":"Pay by ACH, Zelle or CashApp. Contact dispatch for account details, or use the online payment link on this invoice."}'),
  ('invoice_terms_days', '14'),
  ('run_sheet_extras', '{"photos":true,"signatures":true,"odometer":true,"times":true,"wait_time":true,"tolls":true,"lodging":true,"incident":true,"route_deviation":true,"permits":true,"police_escort":true,"equipment_check":true,"gps":false,"per_diem":false,"customer_rating":true}'),
  ('email_templates', '{"invoice_subject":"Invoice {{number}} from D & T Escort Service","invoice_body":"Hello {{name}},\n\nYour invoice {{number}} for load {{load}} is attached. Total due: {{total}}, due {{due}}.\n\nView or pay online: {{link}}\n\nThank you,\nD & T Escort Service LLC"}')
on conflict (key) do nothing;

-- ---------------------------------------------------------------- new users
-- Profiles are created from the metadata the server sets when an owner/admin
-- creates the account (role, full_name). Self sign-up is disabled in Supabase.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, role, full_name, email, phone, must_change_password)
  values (new.id,
          coalesce((new.raw_user_meta_data->>'role')::public.app_role, 'driver'),
          coalesce(new.raw_user_meta_data->>'full_name', ''),
          coalesce(new.email, ''),
          new.raw_user_meta_data->>'phone',
          coalesce((new.raw_user_meta_data->>'must_change_password')::boolean, true))
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
