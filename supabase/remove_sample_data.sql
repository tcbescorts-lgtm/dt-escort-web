-- Removes everything created by seed_sample_data.sql (all ids start with a0/b0/c0 0000000-0000-4000-8000).
delete from public.loads where id::text like 'c0000000-0000-4000-8000-%';
delete from public.drivers where id::text like 'b0000000-0000-4000-8000-%';
delete from public.customers where id::text like 'a0000000-0000-4000-8000-%';
