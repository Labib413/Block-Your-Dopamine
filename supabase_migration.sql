
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table
create table if not exists public.user_profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique,
  full_name text,
  username text unique,
  gender text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Academic Subjects Table
create table if not exists public.subjects (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  progress integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Academic Chapters Table
create table if not exists public.chapters (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  subject_id uuid references public.subjects on delete cascade not null,
  name text not null,
  is_completed boolean default false,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Focus Logs Table
create table if not exists public.focus_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  subject_id uuid references public.subjects on delete set null,
  duration_minutes integer not null,
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  status text -- e.g., 'completed', 'interrupted'
);

-- Enable Realtime
alter publication supabase_realtime add table public.subjects;
alter publication supabase_realtime add table public.chapters;
alter publication supabase_realtime add table public.focus_logs;

-- Set up basic RLS (Row Level Security)
alter table public.user_profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.chapters enable row level security;
alter table public.focus_logs enable row level security;

-- Policies
create policy "Users can view own profile" on public.user_profiles for select using (auth.uid() = id);
create policy "Users can view own subjects" on public.subjects for all using (auth.uid() = user_id);
create policy "Users can view own chapters" on public.chapters for all using (auth.uid() = user_id);
create policy "Users can view own focus logs" on public.focus_logs for all using (auth.uid() = user_id);

-- 5. Detox Sessions Table
create table if not exists public.detox_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  duration_minutes integer not null,
  app_name text,
  started_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Health Logs Table
create table if not exists public.health_daily_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  water_liters numeric(3,1),
  sleep_hours numeric(3,1),
  mood_score integer,
  tracked_date date default current_date
);

-- 7. Personal Tasks/Habits Table
create table if not exists public.personal_tasks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  is_completed boolean default false,
  due_date date
);

-- Enable Realtime for new tables
alter publication supabase_realtime add table public.detox_sessions;
alter publication supabase_realtime add table public.health_daily_logs;
alter publication supabase_realtime add table public.personal_tasks;

-- Set up RLS for new tables
alter table public.detox_sessions enable row level security;
alter table public.health_daily_logs enable row level security;
alter table public.personal_tasks enable row level security;

-- Policies for new tables
create policy "Users can view own detox sessions" on public.detox_sessions for all using (auth.uid() = user_id);
create policy "Users can view own health logs" on public.health_daily_logs for all using (auth.uid() = user_id);
create policy "Users can view own personal tasks" on public.personal_tasks for all using (auth.uid() = user_id);
