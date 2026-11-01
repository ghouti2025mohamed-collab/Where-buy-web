-- Where Buy Web: public profiles, social posts, 24-hour stories, private chat and WebRTC signaling.
-- Review your existing RLS policies before applying this migration to production.

create extension if not exists pgcrypto;

-- Public profile card: only fields intentionally published by the account owner belong here.
create table if not exists public.public_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default 'مستخدم Where Buy',
  phone text,
  avatar_url text,
  bio text,
  role text default 'customer',
  updated_at timestamptz not null default now()
);

insert into public.public_profiles (id, full_name, role)
select p.id, coalesce(nullif(p.full_name, ''), 'مستخدم Where Buy'), coalesce(p.role, 'customer')
from public.profiles p
on conflict (id) do nothing;

alter table public.public_profiles enable row level security;
drop policy if exists "Public profile cards are visible to authenticated users" on public.public_profiles;
create policy "Public profile cards are visible to authenticated users"
  on public.public_profiles for select to anon, authenticated using (true);
drop policy if exists "Users create their own public profile" on public.public_profiles;
create policy "Users create their own public profile"
  on public.public_profiles for insert to authenticated with check (auth.uid() = id);
drop policy if exists "Users update their own public profile" on public.public_profiles;
create policy "Users update their own public profile"
  on public.public_profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text,
  media_url text,
  media_type text check (media_type in ('image', 'video') or media_type is null),
  product_id uuid references public.products(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint social_posts_has_content check (nullif(trim(coalesce(content, '')), '') is not null or media_url is not null or product_id is not null)
);
create index if not exists social_posts_created_at_idx on public.social_posts (created_at desc);
create index if not exists social_posts_user_id_idx on public.social_posts (user_id, created_at desc);
alter table public.social_posts enable row level security;
drop policy if exists "Authenticated users read social posts" on public.social_posts;
create policy "Authenticated users read social posts" on public.social_posts for select to anon, authenticated using (true);
drop policy if exists "Users publish their own posts" on public.social_posts;
create policy "Users publish their own posts" on public.social_posts for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users update their own posts" on public.social_posts;
create policy "Users update their own posts" on public.social_posts for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users delete their own posts" on public.social_posts;
create policy "Users delete their own posts" on public.social_posts for delete to authenticated using (auth.uid() = user_id);

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  media_url text not null,
  media_type text not null check (media_type in ('image', 'video')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);
create index if not exists stories_expiry_idx on public.stories (expires_at desc);
create index if not exists stories_user_created_idx on public.stories (user_id, created_at desc);
alter table public.stories enable row level security;
drop policy if exists "Authenticated users read active stories" on public.stories;
create policy "Authenticated users read active stories" on public.stories for select to anon, authenticated using (expires_at > now());
drop policy if exists "Users publish their own stories" on public.stories;
create policy "Users publish their own stories" on public.stories for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users delete their own stories" on public.stories;
create policy "Users delete their own stories" on public.stories for delete to authenticated using (auth.uid() = user_id);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  member_one uuid not null references auth.users(id) on delete cascade,
  member_two uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversations_distinct_members check (member_one <> member_two),
  constraint conversations_sorted_members check (member_one < member_two),
  constraint conversations_unique_pair unique (member_one, member_two)
);
create index if not exists conversations_member_one_idx on public.conversations(member_one, updated_at desc);
create index if not exists conversations_member_two_idx on public.conversations(member_two, updated_at desc);
alter table public.conversations enable row level security;
drop policy if exists "Conversation members can read conversations" on public.conversations;
create policy "Conversation members can read conversations" on public.conversations for select to authenticated
  using (auth.uid() = member_one or auth.uid() = member_two);

create or replace function public.create_direct_conversation(other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid := auth.uid();
  first_member uuid;
  second_member uuid;
  conversation_id uuid;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if other_user_id is null or other_user_id = current_user_id then raise exception 'Invalid conversation member'; end if;
  if not exists (select 1 from auth.users u where u.id = other_user_id) then raise exception 'User not found'; end if;
  first_member := least(current_user_id, other_user_id);
  second_member := greatest(current_user_id, other_user_id);
  insert into public.conversations(member_one, member_two)
    values (first_member, second_member)
    on conflict (member_one, member_two) do update set updated_at = public.conversations.updated_at
    returning id into conversation_id;
  return conversation_id;
end;
$$;
revoke all on function public.create_direct_conversation(uuid) from public;
grant execute on function public.create_direct_conversation(uuid) to authenticated;

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text,
  media_path text,
  media_type text check (media_type in ('image', 'video') or media_type is null),
  created_at timestamptz not null default now(),
  constraint messages_has_body_or_media check (nullif(trim(coalesce(body, '')), '') is not null or media_path is not null)
);
create index if not exists messages_conversation_created_idx on public.messages(conversation_id, created_at asc);
alter table public.messages enable row level security;
drop policy if exists "Conversation members can read messages" on public.messages;
create policy "Conversation members can read messages" on public.messages for select to authenticated using (
  exists (select 1 from public.conversations c where c.id = conversation_id and auth.uid() in (c.member_one, c.member_two))
);
drop policy if exists "Members can send messages as themselves" on public.messages;
create policy "Members can send messages as themselves" on public.messages for insert to authenticated with check (
  auth.uid() = sender_id and exists (select 1 from public.conversations c where c.id = conversation_id and auth.uid() in (c.member_one, c.member_two))
);

create or replace function public.bump_conversation_updated_at()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.conversations set updated_at = now() where id = new.conversation_id;
  return new;
end;
$$;
drop trigger if exists messages_bump_conversation on public.messages;
create trigger messages_bump_conversation after insert on public.messages
for each row execute function public.bump_conversation_updated_at();

-- WebRTC signaling is stored briefly as small JSON events; actual media travels peer-to-peer.
create table if not exists public.call_signals (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('offer', 'answer', 'ice', 'hangup', 'reject')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists call_signals_conversation_created_idx on public.call_signals(conversation_id, created_at desc);
alter table public.call_signals enable row level security;
drop policy if exists "Conversation members read call signals" on public.call_signals;
create policy "Conversation members read call signals" on public.call_signals for select to authenticated using (
  exists (select 1 from public.conversations c where c.id = conversation_id and auth.uid() in (c.member_one, c.member_two))
);
drop policy if exists "Conversation members send call signals" on public.call_signals;
create policy "Conversation members send call signals" on public.call_signals for insert to authenticated with check (
  auth.uid() = sender_id and exists (select 1 from public.conversations c where c.id = conversation_id and auth.uid() in (c.member_one, c.member_two))
);

-- Public story/post media and private chat attachments use separate buckets.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('social-media', 'social-media', true, 104857600, array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/quicktime','video/webm'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chat-media', 'chat-media', false, 104857600, array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/quicktime','video/webm'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can view social media" on storage.objects;
create policy "Anyone can view social media" on storage.objects for select using (bucket_id = 'social-media');
drop policy if exists "Users upload their own social media" on storage.objects;
create policy "Users upload their own social media" on storage.objects for insert to authenticated with check (bucket_id = 'social-media' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Users update their own social media" on storage.objects;
create policy "Users update their own social media" on storage.objects for update to authenticated using (bucket_id = 'social-media' and (storage.foldername(name))[1] = auth.uid()::text) with check (bucket_id = 'social-media' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Users delete their own social media" on storage.objects;
create policy "Users delete their own social media" on storage.objects for delete to authenticated using (bucket_id = 'social-media' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Members read chat attachments" on storage.objects;
create policy "Members read chat attachments" on storage.objects for select to authenticated using (
  bucket_id = 'chat-media' and exists (
    select 1 from public.conversations c
    where c.id::text = (storage.foldername(name))[1]
      and auth.uid() in (c.member_one, c.member_two)
  )
);
drop policy if exists "Members upload chat attachments" on storage.objects;
create policy "Members upload chat attachments" on storage.objects for insert to authenticated with check (
  bucket_id = 'chat-media' and exists (
    select 1 from public.conversations c
    where c.id::text = (storage.foldername(name))[1]
      and auth.uid() in (c.member_one, c.member_two)
      and (storage.foldername(name))[2] = auth.uid()::text
  )
);
drop policy if exists "Owners delete chat attachments" on storage.objects;
create policy "Owners delete chat attachments" on storage.objects for delete to authenticated using (
  bucket_id = 'chat-media' and (storage.foldername(name))[2] = auth.uid()::text
);

-- Enable Postgres Changes for live feed, chat and call signaling, without duplicate publication entries.
do $$
declare tbl text;
begin
  foreach tbl in array array['social_posts','stories','messages','call_signals'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = tbl
    ) then
      execute format('alter publication supabase_realtime add table public.%I', tbl);
    end if;
  end loop;
exception when undefined_object then
  raise notice 'Publication supabase_realtime was not found; enable Realtime for social_posts, stories, messages and call_signals in Supabase Dashboard.';
end;
$$;
