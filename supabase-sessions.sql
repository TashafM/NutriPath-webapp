-- Free session requests from the website form. Safe to run again: it only adds what is missing.
create table if not exists session_requests (
  id bigint generated always as identity primary key,
  name text not null,
  phone text not null, -- +91 followed by a 10-digit mobile number
  email text,
  goal text,
  preferred_time text,
  message text,
  ip text, -- used for rate limiting
  created_at timestamptz not null default now()
);

-- No policies: only the server (service role key) can read or write.
alter table session_requests enable row level security;

-- Speeds up the rate-limit checks in app/api/session/route.js.
create index if not exists session_requests_ip_created on session_requests (ip, created_at);
create index if not exists session_requests_phone_created on session_requests (phone, created_at);

notify pgrst, 'reload schema';

-- Follow-up tracking (admin panel > Free sessions).
alter table session_requests
  add column if not exists status text not null default 'new' check (status in ('new', 'contacted', 'call_later', 'not_interested')),
  add column if not exists follow_up_on date, -- set when status is 'call_later'
  add column if not exists admin_note text,
  add column if not exists updated_at timestamptz;

notify pgrst, 'reload schema';
