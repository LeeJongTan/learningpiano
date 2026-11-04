begin;

create schema phim_auth_private;
revoke all on schema phim_auth_private from public, anon, authenticated;
grant usage on schema phim_auth_private to service_role;

create table phim_auth_private.username_secret (
  singleton boolean primary key default true check (singleton),
  secret bytea not null
);
insert into phim_auth_private.username_secret (secret) values (extensions.gen_random_bytes(32));

create table phim_auth_private.request_counts (
  bucket timestamptz not null,
  scope text not null,
  requests integer not null,
  primary key (bucket, scope)
);

grant select on phim_auth_private.username_secret to service_role;
grant select, insert, update, delete on phim_auth_private.request_counts to service_role;

create function public.phim_username_auth_request(p_action text, p_username text, p_ip text)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  alias_key bytea;
  request_bucket timestamptz;
  ip_scope text;
  allowed integer;
begin
  if p_action is null or p_action not in ('signup', 'login')
     or p_username is null or p_username !~ '^[a-z0-9_]{3,24}$' then
    return null;
  end if;

  select secret into strict alias_key from phim_auth_private.username_secret;
  request_bucket := date_bin('15 minutes', now(), timestamptz '2026-01-01 00:00:00+00');
  ip_scope := p_action || ':' || encode(extensions.hmac(convert_to(left(coalesce(p_ip, 'unknown'), 128), 'UTF8'), alias_key, 'sha256'), 'hex');

  insert into phim_auth_private.request_counts as counts values (request_bucket, ip_scope, 1)
  on conflict (bucket, scope) do update set requests = counts.requests + 1
    where counts.requests < case p_action when 'signup' then 4 else 20 end
  returning requests into allowed;
  if allowed is null then return null; end if;

  insert into phim_auth_private.request_counts as counts values (request_bucket, p_action, 1)
  on conflict (bucket, scope) do update set requests = counts.requests + 1
    where counts.requests < case p_action when 'signup' then 40 else 400 end
  returning requests into allowed;
  if allowed is null then return null; end if;

  delete from phim_auth_private.request_counts where bucket < request_bucket - interval '1 hour';
  return encode(extensions.hmac(convert_to(p_username, 'UTF8'), alias_key, 'sha256'), 'hex') || '@accounts.phim.invalid';
end;
$$;

revoke all on function public.phim_username_auth_request(text, text, text) from public, anon, authenticated;
grant execute on function public.phim_username_auth_request(text, text, text) to service_role;

commit;
