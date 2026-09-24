-- MS Barbearia — Supabase/Postgres production schema
-- Execute in the Supabase SQL editor. Configure business_hours manually before opening booking in production.

create extension if not exists pgcrypto;

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  duration_minutes integer not null default 30 check (duration_minutes > 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index if not exists services_name_unique on public.services (lower(name));

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text not null,
  service_id uuid not null references public.services(id),
  appointment_date date not null,
  appointment_time time not null,
  status text not null default 'confirmed' check (status in ('confirmed','completed','cancelled')),
  created_at timestamptz not null default now()
);
create unique index if not exists no_double_booking
  on public.appointments (appointment_date, appointment_time)
  where status <> 'cancelled';
create index if not exists appointments_date_idx on public.appointments(appointment_date);

create table if not exists public.business_hours (
  id uuid primary key default gen_random_uuid(),
  day_of_week integer not null check (day_of_week between 0 and 6),
  opening_time time not null,
  closing_time time not null,
  slot_interval integer not null default 30 check (slot_interval > 0),
  active boolean not null default true,
  unique(day_of_week)
);

create table if not exists public.blocked_slots (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  time time not null,
  reason text,
  unique(date,time)
);

create table if not exists public.blocked_dates (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  reason text
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Confirmed services/prices supplied for the project.
insert into public.services(name,description,price,duration_minutes,active) values
  ('Corte','Incluindo sobrancelha',20.00,30,true),
  ('Barba',null,15.00,30,true),
  ('Combo','Cabelo + barba',30.00,30,true),
  ('Pigmentação',null,15.00,30,true),
  ('Relaxamento','Dependendo do tamanho do cabelo',10.00,30,true),
  ('Pezinho',null,10.00,30,true),
  ('Luzes',null,60.00,30,true),
  ('Nevou','Dependendo do tamanho do cabelo',80.00,30,true)
on conflict do nothing;

alter table public.services enable row level security;
alter table public.appointments enable row level security;
alter table public.business_hours enable row level security;
alter table public.blocked_slots enable row level security;
alter table public.blocked_dates enable row level security;
alter table public.admin_users enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from public.admin_users where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Public can read only non-sensitive operational data.
drop policy if exists "public read active services" on public.services;
create policy "public read active services" on public.services for select using (active = true or public.is_admin());

drop policy if exists "public read hours" on public.business_hours;
create policy "public read hours" on public.business_hours for select using (true);

-- Admin policies.
drop policy if exists "admin manage services" on public.services;
create policy "admin manage services" on public.services for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin manage appointments" on public.appointments;
create policy "admin manage appointments" on public.appointments for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin manage hours" on public.business_hours;
create policy "admin manage hours" on public.business_hours for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin manage blocked slots" on public.blocked_slots;
create policy "admin manage blocked slots" on public.blocked_slots for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin manage blocked dates" on public.blocked_dates;
create policy "admin manage blocked dates" on public.blocked_dates for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin read admin users" on public.admin_users;
create policy "admin read admin users" on public.admin_users for select using (public.is_admin());

-- Public availability: returns only times, never client names or phones.
create or replace function public.get_occupied_slots(p_date date)
returns table(appointment_time time)
language sql
security definer
set search_path = public
as $$
  select a.appointment_time
  from public.appointments a
  where a.appointment_date = p_date and a.status <> 'cancelled'
  union
  select b.time from public.blocked_slots b where b.date = p_date;
$$;
revoke all on function public.get_occupied_slots(date) from public;
grant execute on function public.get_occupied_slots(date) to anon, authenticated;

-- Atomic booking RPC. The unique partial index is the final double-booking guard.
create or replace function public.book_appointment(
  p_name text,
  p_phone text,
  p_service uuid,
  p_date date,
  p_time time
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  dow integer := extract(dow from p_date)::integer;
  hours_row public.business_hours%rowtype;
begin
  if trim(coalesce(p_name,'')) = '' or trim(coalesce(p_phone,'')) = '' then
    raise exception 'invalid_customer_data';
  end if;

  if not exists(select 1 from public.services where id = p_service and active = true) then
    raise exception 'service_unavailable';
  end if;

  if exists(select 1 from public.blocked_dates where date = p_date) then
    raise exception 'slot_unavailable';
  end if;

  select * into hours_row from public.business_hours where day_of_week = dow and active = true;
  if not found or p_time < hours_row.opening_time or p_time >= hours_row.closing_time then
    raise exception 'slot_unavailable';
  end if;

  if exists(select 1 from public.blocked_slots where date = p_date and time = p_time) then
    raise exception 'slot_unavailable';
  end if;

  insert into public.appointments(customer_name,customer_phone,service_id,appointment_date,appointment_time)
  values(trim(p_name),trim(p_phone),p_service,p_date,p_time)
  returning id into new_id;

  return new_id;
exception
  when unique_violation then
    raise exception 'slot_unavailable';
end;
$$;
revoke all on function public.book_appointment(text,text,uuid,date,time) from public;
grant execute on function public.book_appointment(text,text,uuid,date,time) to anon, authenticated;

-- No public SELECT policy is created for appointments, blocked_slots or blocked_dates.
-- Client identity and the full agenda stay private to authenticated admins.
