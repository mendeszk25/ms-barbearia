-- MS Barbearia — Supabase/Postgres production schema
-- Multi-service booking with interval collision protection.
-- Execute in the Supabase SQL editor. Review real service durations/business hours before production.

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
  service_id uuid references public.services(id), -- legacy/compatibility: first selected service
  appointment_date date not null,
  appointment_time time not null,
  appointment_end_time time,
  total_price numeric(10,2),
  total_duration_minutes integer,
  status text not null default 'confirmed' check (status in ('confirmed','completed','cancelled')),
  created_at timestamptz not null default now()
);

-- Migration-safe additions for projects created with the previous schema.
alter table public.appointments add column if not exists appointment_end_time time;
alter table public.appointments add column if not exists total_price numeric(10,2);
alter table public.appointments add column if not exists total_duration_minutes integer;
alter table public.appointments alter column service_id drop not null;

create table if not exists public.appointment_services (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  service_id uuid not null references public.services(id),
  price_at_booking numeric(10,2) not null check (price_at_booking >= 0),
  duration_minutes_at_booking integer not null check (duration_minutes_at_booking > 0),
  created_at timestamptz not null default now(),
  unique(appointment_id, service_id)
);
create index if not exists appointment_services_appointment_idx on public.appointment_services(appointment_id);
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
-- Durations must be reviewed by the barber before production; Luzes uses the explicit 60-minute example from this revision.
insert into public.services(name,description,price,duration_minutes,active) values
  ('Corte','Incluindo sobrancelha',20.00,30,true),
  ('Barba',null,15.00,30,true),
  ('Combo','Cabelo + barba',30.00,30,true),
  ('Pigmentação',null,15.00,30,true),
  ('Relaxamento','Dependendo do tamanho do cabelo',10.00,30,true),
  ('Pezinho',null,10.00,30,true),
  ('Luzes',null,60.00,60,true),
  ('Nevou','Dependendo do tamanho do cabelo',80.00,30,true)
on conflict do nothing;

-- Backfill old single-service appointments so the new model is compatible with existing data.
insert into public.appointment_services(appointment_id,service_id,price_at_booking,duration_minutes_at_booking)
select a.id,s.id,s.price,s.duration_minutes
from public.appointments a
join public.services s on s.id=a.service_id
where a.service_id is not null
on conflict (appointment_id,service_id) do nothing;

update public.appointments a
set total_price = coalesce(a.total_price,x.total_price),
    total_duration_minutes = coalesce(a.total_duration_minutes,x.total_duration),
    appointment_end_time = coalesce(a.appointment_end_time,(a.appointment_time + make_interval(mins => x.total_duration))::time)
from (
  select appointment_id,sum(price_at_booking)::numeric(10,2) total_price,sum(duration_minutes_at_booking)::integer total_duration
  from public.appointment_services group by appointment_id
) x
where x.appointment_id=a.id;

update public.appointments
set total_duration_minutes=coalesce(total_duration_minutes,30),
    total_price=coalesce(total_price,0),
    appointment_end_time=coalesce(appointment_end_time,(appointment_time + interval '30 minutes')::time)
where total_duration_minutes is null or total_price is null or appointment_end_time is null;

alter table public.appointments alter column total_price set not null;
alter table public.appointments alter column total_duration_minutes set not null;
alter table public.appointments alter column appointment_end_time set not null;

-- Replace the old start-time-only guard with a true interval overlap guard.
drop index if exists public.no_double_booking;
do $$
begin
  alter table public.appointments
    add constraint appointments_no_time_overlap
    exclude using gist (
      tsrange(appointment_date + appointment_time, appointment_date + appointment_end_time, '[)') with &&
    ) where (status <> 'cancelled');
exception
  when duplicate_object then null;
end $$;

alter table public.services enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_services enable row level security;
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

drop policy if exists "admin manage appointment services" on public.appointment_services;
create policy "admin manage appointment services" on public.appointment_services for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin manage hours" on public.business_hours;
create policy "admin manage hours" on public.business_hours for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin manage blocked slots" on public.blocked_slots;
create policy "admin manage blocked slots" on public.blocked_slots for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin manage blocked dates" on public.blocked_dates;
create policy "admin manage blocked dates" on public.blocked_dates for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin read admin users" on public.admin_users;
create policy "admin read admin users" on public.admin_users for select using (public.is_admin());

-- Public availability returns intervals only, never client names/phones/services.
create or replace function public.get_occupied_ranges(p_date date)
returns table(start_time time,end_time time)
language sql
security definer
set search_path = public
as $$
  select a.appointment_time,a.appointment_end_time
  from public.appointments a
  where a.appointment_date=p_date and a.status<>'cancelled'
  union all
  select b.time,(b.time + interval '30 minutes')::time
  from public.blocked_slots b
  where b.date=p_date;
$$;
revoke all on function public.get_occupied_ranges(date) from public;
grant execute on function public.get_occupied_ranges(date) to anon, authenticated;

-- Kept for backwards compatibility with older clients.
create or replace function public.get_occupied_slots(p_date date)
returns table(appointment_time time)
language sql
security definer
set search_path = public
as $$
  select start_time from public.get_occupied_ranges(p_date);
$$;
revoke all on function public.get_occupied_slots(date) from public;
grant execute on function public.get_occupied_slots(date) to anon, authenticated;

-- Atomic multi-service booking RPC.
create or replace function public.book_appointment_multi(
  p_name text,
  p_phone text,
  p_services uuid[],
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
  service_count integer;
  total_duration integer;
  booking_total numeric(10,2);
  start_ts timestamp := p_date + p_time;
  end_ts timestamp;
  first_service uuid;
  distinct_service_count integer;
begin
  if trim(coalesce(p_name,''))='' or trim(coalesce(p_phone,''))='' then
    raise exception 'invalid_customer_data';
  end if;
  if p_services is null or cardinality(p_services)=0 then
    raise exception 'service_unavailable';
  end if;

  select count(*),sum(duration_minutes)::integer,sum(price)::numeric(10,2)
  into service_count,total_duration,booking_total
  from public.services
  where id=any(p_services) and active=true;
  first_service := p_services[1];

  select count(distinct x) into distinct_service_count from unnest(p_services) as x;
  if service_count<>cardinality(p_services) or service_count<>distinct_service_count then
    raise exception 'service_unavailable';
  end if;

  -- Combo cannot coexist with Corte or Barba.
  if exists(select 1 from public.services where id=any(p_services) and lower(name)='combo')
     and exists(select 1 from public.services where id=any(p_services) and lower(name) in ('corte','barba')) then
    raise exception 'redundant_combo';
  end if;

  end_ts := start_ts + make_interval(mins => total_duration);

  if exists(select 1 from public.blocked_dates where date=p_date) then
    raise exception 'slot_unavailable';
  end if;

  select * into hours_row from public.business_hours where day_of_week=dow and active=true;
  if not found
     or p_time<hours_row.opening_time
     or end_ts>(p_date + hours_row.closing_time) then
    raise exception 'slot_unavailable';
  end if;

  if exists(
    select 1 from public.blocked_slots b
    where b.date=p_date
      and tsrange(start_ts,end_ts,'[)') && tsrange(p_date+b.time,p_date+b.time+interval '30 minutes','[)')
  ) then
    raise exception 'slot_unavailable';
  end if;

  if exists(
    select 1 from public.appointments a
    where a.appointment_date=p_date and a.status<>'cancelled'
      and tsrange(start_ts,end_ts,'[)') && tsrange(p_date+a.appointment_time,p_date+a.appointment_end_time,'[)')
  ) then
    raise exception 'slot_unavailable';
  end if;

  insert into public.appointments(
    customer_name,customer_phone,service_id,appointment_date,appointment_time,appointment_end_time,total_price,total_duration_minutes
  ) values(
    trim(p_name),trim(p_phone),first_service,p_date,p_time,end_ts::time,booking_total,total_duration
  ) returning id into new_id;

  insert into public.appointment_services(appointment_id,service_id,price_at_booking,duration_minutes_at_booking)
  select new_id,s.id,s.price,s.duration_minutes
  from public.services s
  where s.id=any(p_services);

  return new_id;
exception
  when exclusion_violation then
    raise exception 'slot_unavailable';
end;
$$;
revoke all on function public.book_appointment_multi(text,text,uuid[],date,time) from public;
grant execute on function public.book_appointment_multi(text,text,uuid[],date,time) to anon, authenticated;

-- Legacy single-service wrapper.
create or replace function public.book_appointment(
  p_name text,
  p_phone text,
  p_service uuid,
  p_date date,
  p_time time
) returns uuid
language sql
security definer
set search_path = public
as $$
  select public.book_appointment_multi(p_name,p_phone,array[p_service],p_date,p_time);
$$;
revoke all on function public.book_appointment(text,text,uuid,date,time) from public;
grant execute on function public.book_appointment(text,text,uuid,date,time) to anon, authenticated;

-- No public SELECT policy is created for appointments, appointment_services,
-- blocked_slots or blocked_dates. Client identity/full agenda remain private.
