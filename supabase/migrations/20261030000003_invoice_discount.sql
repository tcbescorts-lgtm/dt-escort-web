-- 2026-10-30 (3): invoice discount (percent or fixed amount), stored on the invoice and printed as its own line.
alter table public.invoices
  add column if not exists discount_type text check (discount_type in ('percent','amount')),
  add column if not exists discount_value numeric(12,2);

alter table public.invoice_items drop constraint if exists invoice_items_kind_check;
alter table public.invoice_items add constraint invoice_items_kind_check
  check (kind in ('mileage','day_rate','mini_run','overnight','no_go','gas','tolls','lodging','adjustment','qp_fee','flat_rate','discount'));
