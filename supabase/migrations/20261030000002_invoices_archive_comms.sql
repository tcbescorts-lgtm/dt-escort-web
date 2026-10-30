-- 2026-10-30 (2): invoice archive + INV0001 numbering, Quo call/text inbox, structured payment info.

-- ---------------------------------------------------------------- invoices
alter table public.invoices
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references public.profiles(id),
  add column if not exists archive_reason text;

-- Numbers look like INV0001, INV0002, ...
alter table public.invoices alter column number set default ('INV' || lpad(nextval('public.invoice_no_seq')::text, 4, '0'));

-- Archive (soft delete) with typed confirmation. Staff only; keeps payments and history.
create or replace function public.archive_invoice(p_id uuid, p_confirm text, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
declare n text;
begin
  if not public.is_staff() then raise exception 'Not allowed'; end if;
  select number into n from public.invoices where id = p_id;
  if n is null then raise exception 'Invoice not found'; end if;
  if upper(trim(p_confirm)) <> upper(n) then raise exception 'Type the invoice number exactly to confirm'; end if;
  update public.invoices set archived_at = now(), archived_by = auth.uid(), archive_reason = nullif(trim(p_reason), '') where id = p_id;
  -- the load can be invoiced again
  update public.loads l set status = 'run_sheet_submitted'
   where l.id = (select load_id from public.invoices where id = p_id) and l.status = 'invoiced';
end $$;
revoke execute on function public.archive_invoice(uuid, text, text) from public, anon;
grant execute on function public.archive_invoice(uuid, text, text) to authenticated;

create or replace function public.restore_invoice(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'Not allowed'; end if;
  update public.invoices set archived_at = null, archived_by = null, archive_reason = null where id = p_id;
end $$;
revoke execute on function public.restore_invoice(uuid) from public, anon;
grant execute on function public.restore_invoice(uuid) to authenticated;

-- ---------------------------------------------------------------- Quo inbox
create table if not exists public.comms (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'quo',
  external_id text not null,
  event_type text not null,
  kind text not null check (kind in ('message','call','missed_call','voicemail')),
  direction text,
  from_number text,
  to_number text,
  body text,
  duration_seconds int,
  recording_url text,
  status text,
  occurred_at timestamptz not null default now(),
  driver_id uuid references public.drivers(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  read_at timestamptz,
  payload jsonb,
  created_at timestamptz not null default now(),
  unique (provider, external_id, event_type)
);
create index if not exists comms_occurred_idx on public.comms (occurred_at desc);
alter table public.comms enable row level security;
drop policy if exists comms_staff on public.comms;
create policy comms_staff on public.comms for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- Link the number to a driver or customer, then alert the office.
create or replace function public.on_comm() returns trigger
language plpgsql security definer set search_path = public as $$
declare other text; digits text; who text;
begin
  other := case when coalesce(new.direction,'incoming') = 'outgoing' then new.to_number else new.from_number end;
  digits := right(regexp_replace(coalesce(other,''), '\D', '', 'g'), 10);
  if length(digits) = 10 then
    select id, full_name into new.driver_id, who from public.drivers where right(regexp_replace(coalesce(phone,''), '\D', '', 'g'), 10) = digits limit 1;
    if new.driver_id is null then
      select id, company into new.customer_id, who from public.customers
       where right(regexp_replace(coalesce(phone,''), '\D', '', 'g'), 10) = digits
          or right(regexp_replace(coalesce(billing_phone,''), '\D', '', 'g'), 10) = digits limit 1;
    end if;
  end if;
  if coalesce(new.direction,'incoming') <> 'outgoing' then
    perform public.notify_staff('comm',
      case new.kind when 'message' then 'Text from ' when 'missed_call' then 'Missed call from ' when 'voicemail' then 'Voicemail from ' else 'Call from ' end || coalesce(who, other, 'unknown'),
      left(coalesce(new.body, ''), 140), '/portal/messages');
  end if;
  return new;
end $$;
drop trigger if exists comms_before_insert on public.comms;
create trigger comms_before_insert before insert on public.comms for each row execute function public.on_comm();

-- ---------------------------------------------------------------- payment info shown on invoices
insert into public.settings(key, value) values
  ('payment_info', '{"zelle":"","cashapp":"","check_payable":"D & T Escort Service LLC","check_mail":"3897 I-55 S, Jackson, MS 39212","ach_bank":"","ach_routing":"","ach_account":"","ach_name":"D & T Escort Service LLC","online_fee_note":"","other":""}')
on conflict (key) do nothing;
