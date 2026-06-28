-- Analytics: privacy-first page view tracking.
-- visitor_id is a daily-rotating SHA-256 hash of (IP + User-Agent + date),
-- so cross-day tracking is impossible and no raw IP is ever stored.

-- 1. Table
create table public.page_views (
  id          bigint generated always as identity primary key,
  visitor_id  text        not null,
  page_path   text        not null default '/',
  referrer    text,
  device_type text        not null default 'desktop',
  browser     text,
  country     text,
  created_at  timestamptz not null default now()
);

-- 2. RLS — deny direct access; edge function writes via service_role
alter table public.page_views enable row level security;

create policy "deny_direct_access" on public.page_views
  as restrictive for all
  to anon, authenticated
  using (false);

revoke all on table public.page_views from anon, authenticated;

-- 3. Check constraints — defense in depth mirroring edge function validation
alter table public.page_views
  add constraint pv_visitor_id_len   check (char_length(visitor_id) between 1 and 128),
  add constraint pv_page_path_len    check (char_length(page_path) between 1 and 500),
  add constraint pv_referrer_len     check (referrer is null or char_length(referrer) <= 500),
  add constraint pv_device_type_vals check (device_type in ('desktop', 'mobile', 'tablet')),
  add constraint pv_browser_len      check (browser is null or char_length(browser) <= 100),
  add constraint pv_country_len      check (country is null or char_length(country) = 2);

-- 4. Indexes for the analytics RPC functions
create index pv_created_at_idx        on public.page_views (created_at);
create index pv_visitor_id_idx        on public.page_views (visitor_id);
create index pv_created_at_path_idx   on public.page_views (created_at, page_path);

-- 5. Manual cleanup note:
-- DELETE FROM page_views WHERE created_at < now() - interval '90 days';
-- Run manually or via a scheduled pg_cron job to keep the table lean.

-- ============================================================
-- 6. Analytics RPC functions (security definer — callable only
--    through the service_role key used by the edge function).
-- ============================================================

-- Summary: total views + unique visitors
create or replace function public.analytics_summary(since timestamptz)
returns table(total_views bigint, unique_visitors bigint)
language sql stable security definer set search_path = public
as $$
  select count(*)::bigint, count(distinct visitor_id)::bigint
  from page_views where created_at >= since;
$$;

-- Views grouped by day
create or replace function public.analytics_views_by_day(since timestamptz)
returns table(date date, views bigint, uniques bigint)
language sql stable security definer set search_path = public
as $$
  select created_at::date as date, count(*)::bigint, count(distinct visitor_id)::bigint
  from page_views where created_at >= since
  group by 1 order by 1;
$$;

-- Views grouped by hour of day
create or replace function public.analytics_views_by_hour(since timestamptz)
returns table(hour int, views bigint)
language sql stable security definer set search_path = public
as $$
  select extract(hour from created_at)::int, count(*)::bigint
  from page_views where created_at >= since
  group by 1 order by 1;
$$;

-- Top pages
create or replace function public.analytics_top_pages(since timestamptz, lim int default 10)
returns table(path text, views bigint, uniques bigint)
language sql stable security definer set search_path = public
as $$
  select page_path, count(*)::bigint, count(distinct visitor_id)::bigint
  from page_views where created_at >= since
  group by 1 order by 2 desc limit lim;
$$;

-- Top referrers
create or replace function public.analytics_top_referrers(since timestamptz, lim int default 10)
returns table(referrer text, views bigint)
language sql stable security definer set search_path = public
as $$
  select coalesce(referrer, 'Direct'), count(*)::bigint
  from page_views where created_at >= since
  group by 1 order by 2 desc limit lim;
$$;

-- Device breakdown
create or replace function public.analytics_devices(since timestamptz)
returns table(device_type text, views bigint)
language sql stable security definer set search_path = public
as $$
  select device_type, count(*)::bigint
  from page_views where created_at >= since
  group by 1 order by 2 desc;
$$;

-- Browser breakdown
create or replace function public.analytics_browsers(since timestamptz, lim int default 10)
returns table(browser text, views bigint)
language sql stable security definer set search_path = public
as $$
  select coalesce(browser, 'Unknown'), count(*)::bigint
  from page_views where created_at >= since
  group by 1 order by 2 desc limit lim;
$$;

-- Country breakdown
create or replace function public.analytics_countries(since timestamptz, lim int default 10)
returns table(country text, views bigint)
language sql stable security definer set search_path = public
as $$
  select coalesce(country, 'Unknown'), count(*)::bigint
  from page_views where created_at >= since
  group by 1 order by 2 desc limit lim;
$$;

-- Recent visitors (individual visits for a 'live' view)
create or replace function public.analytics_recent_visitors(since timestamptz, lim int default 50)
returns table(visitor_id text, page_path text, referrer text, device_type text, browser text, country text, visited_at timestamptz)
language sql stable security definer set search_path = public
as $$
  select visitor_id, page_path, referrer, device_type, browser, country, created_at
  from page_views where created_at >= since
  order by created_at desc limit lim;
$$;

-- 7. Revoke execute from public/anon/authenticated — only service_role
--    (used by the analytics edge function) can call these.
revoke execute on function public.analytics_summary(timestamptz) from public, anon, authenticated;
revoke execute on function public.analytics_views_by_day(timestamptz) from public, anon, authenticated;
revoke execute on function public.analytics_views_by_hour(timestamptz) from public, anon, authenticated;
revoke execute on function public.analytics_top_pages(timestamptz, int) from public, anon, authenticated;
revoke execute on function public.analytics_top_referrers(timestamptz, int) from public, anon, authenticated;
revoke execute on function public.analytics_devices(timestamptz) from public, anon, authenticated;
revoke execute on function public.analytics_browsers(timestamptz, int) from public, anon, authenticated;
revoke execute on function public.analytics_countries(timestamptz, int) from public, anon, authenticated;
revoke execute on function public.analytics_recent_visitors(timestamptz, int) from public, anon, authenticated;
