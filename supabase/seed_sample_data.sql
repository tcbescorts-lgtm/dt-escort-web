-- OPTIONAL clearly-fake sample data for trying the portal. Never shown on the public site.
-- Every sample record is named "SAMPLE" so it is easy to spot. Remove it all with
-- supabase/remove_sample_data.sql before going live with real work.
-- Sample drivers have no sign-in; to test the driver app, create a driver from the portal instead.

insert into public.customers (id, company, contact_name, phone, email, type, billing_email, payment_terms, quick_pay, qp_fee_pct, notes) values
 ('a0000000-0000-4000-8000-000000000001', 'SAMPLE Broker Co', 'Pat Example', '(555) 010-0101', 'pat@example.com', 'broker', 'billing@example.com', '2 weeks', 'yes', 5, 'Fake sample customer'),
 ('a0000000-0000-4000-8000-000000000002', 'SAMPLE Heavy Haul Inc', 'Sam Example', '(555) 010-0202', 'sam@example.com', 'direct', 'ap@example.com', 'pay at drop', 'no', null, 'Fake sample customer');
insert into public.customer_rate_cards (customer_id, per_mile, day_rate, no_go, overnight, flat_rate, mini_run) values
 ('a0000000-0000-4000-8000-000000000001', 2.00, 800, 250, 125, null, 350),
 ('a0000000-0000-4000-8000-000000000002', 1.85, 750, 250, 125, null, 300);

insert into public.drivers (id, full_name, phone, email, status, positions, split_pct, license_state, license_expires, notes) values
 ('b0000000-0000-4000-8000-000000000001', 'SAMPLE Driver A', '(555) 010-1001', 'driver.a@example.com', 'needs_load', '{lead,chase}', 40, 'MS', current_date + 25, 'Fake sample driver'),
 ('b0000000-0000-4000-8000-000000000002', 'SAMPLE Driver B', '(555) 010-1002', 'driver.b@example.com', 'on_load', '{chase,high_pole}', 50, 'LA', current_date + 200, 'Fake sample driver');
insert into public.certifications (driver_id, kind, state, number, expires_on) values
 ('b0000000-0000-4000-8000-000000000001', 'pevo', null, 'SAMPLE-123', current_date + 45),
 ('b0000000-0000-4000-8000-000000000002', 'state_certification', 'TX', 'SAMPLE-456', current_date + 5);

insert into public.loads (id, status, booked_by, customer_id, invoice_customer_id, invoice_email, quick_pay, qp_fee_pct, pickup, dropoff, load_date, est_miles, rate_per_mile, rate_day, rate_overnight, rate_no_go, truck_driver_name, truck_driver_phone, trucking_company, truck_number, height, width, length, weight, remarks) values
 ('c0000000-0000-4000-8000-000000000001', 'assigned', 'Jim', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'billing@example.com', 'yes', 5, 'Jackson, MS', 'Houston, TX', current_date + 2, 430, 2.00, 800, 125, 250, 'SAMPLE Trucker', '(555) 010-2001', 'SAMPLE Trucking', '42', '14''6"', '16''', '120''', '180,000 lbs', 'Sample load'),
 ('c0000000-0000-4000-8000-000000000002', 'booked', 'Boss', 'a0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002', 'ap@example.com', 'no', null, 'Mobile, AL', 'Dallas, TX', current_date + 5, 560, 1.85, 750, 125, 250, null, null, null, null, null, null, null, null, 'Sample load');
insert into public.load_positions (load_id, position) values
 ('c0000000-0000-4000-8000-000000000001', 'chase'), ('c0000000-0000-4000-8000-000000000002', 'lead');
insert into public.load_assignments (load_id, driver_id, position) values
 ('c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'chase');
