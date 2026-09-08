-- Run once in Supabase SQL Editor before importing the prepared CSV.
-- This standalone table does not change any tables from the earlier plan.
create table public.pulsepoint_observations (
  county_fips text not null check (county_fips ~ '^[0-9]{5}$'),
  county_name text not null,
  state_abbr text not null,
  measure_code text not null,
  year integer not null,
  data_value_type text not null check (data_value_type in ('Crude prevalence','Age-adjusted prevalence')),
  value numeric check (value between 0 and 100),
  low numeric,
  high numeric,
  is_sample boolean not null default false,
  primary key (county_fips, measure_code, year, data_value_type)
);
alter table public.pulsepoint_observations enable row level security;
revoke all on public.pulsepoint_observations from anon, authenticated;
grant select on public.pulsepoint_observations to anon, authenticated;
create policy "Read public county observations"
on public.pulsepoint_observations for select
to anon, authenticated using (true);
-- Public visitors can read CDC estimates but cannot insert, update or delete.
-- Do not import private patient records into this public table.
