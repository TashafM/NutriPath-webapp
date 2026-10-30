-- Run once in Supabase: SQL Editor > New query.
create table orders (
  id bigint generated always as identity primary key,
  razorpay_order_id text unique not null,
  user_id uuid references auth.users,
  plan text not null,
  amount integer not null, -- INR
  status text not null default 'created', -- created | paid
  payment_id text,
  email text,
  contact text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

-- The server (service role key) can do anything; logged-in users can only read their own orders.
alter table orders enable row level security;
create policy "Users read own orders" on orders for select to authenticated using ((select auth.uid()) = user_id);

-- Link each order to its plan by ID, so renaming a plan keeps clients' active plans.
-- Run after supabase-plans.sql. Safe to run again.
alter table orders add column if not exists plan_id bigint references plans (id) on delete set null;
update orders o set plan_id = p.id from plans p where o.plan_id is null and o.plan = p.title;
notify pgrst, 'reload schema';
