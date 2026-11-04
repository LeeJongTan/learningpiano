'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { stripTypeScriptTypes } = require('node:module');
const vm = require('node:vm');

const edge = stripTypeScriptTypes(readFileSync(require.resolve('../supabase/functions/username-auth/index.ts'), 'utf8'))
  .replace(/^import .*\n/, '');

function edgeFixture() {
  const users = new Map();
  const calls = [];
  let handle, limited = false;
  const createClient = (_, key) => {
    if (key === 'server-only') return {
      rpc: async (_, data) => {
        calls.push(data);
        return { data: limited ? null : data.p_username + '@accounts.phim.invalid' };
      },
      auth: { admin: { createUser: async data => {
        if (users.has(data.email)) return { error: { code: 'email_exists' } };
        users.set(data.email, data);
        return { error: null };
      } } },
    };
    assert.equal(key, 'browser-key');
    return { auth: { signInWithPassword: async ({email,password}) => {
      if (users.get(email)?.password !== password) return { data: {}, error: {code:'invalid_credentials'} };
      return { data: { session: { access_token:'access', refresh_token:'refresh', user:{email} } } };
    } } };
  };
  const values = { SUPABASE_URL:'https://test.invalid', SUPABASE_PUBLISHABLE_KEYS:'{"default":"browser-key"}',
    SUPABASE_SECRET_KEYS:'{"default":"server-only"}' };
  vm.runInNewContext(edge, { Response, TextEncoder, createClient,
    Deno: { env:{get:key=>values[key]}, serve: fn=>{ handle=fn; } } });
  const send = (action, username, password, key='browser-key') => handle(new Request('https://test.invalid', {
    method:'POST', headers:{apikey:key}, body:JSON.stringify({action,username,password}),
  }));
  return { send, calls, users, limit:()=>{ limited=true; } };
}

test('username signup and login use Supabase Auth and return only the session tokens', async () => {
  const {send,users} = edgeFixture();
  assert.equal((await send('signup','piano_123','demo-pw-123')).status,201);
  const account = users.get('piano_123@accounts.phim.invalid');
  assert.equal(account.email_confirm,true);
  assert.equal(account.app_metadata.phim_username,'piano_123');
  assert.equal((await send('signup','piano_123','demo-pw-abc')).status,409);
  assert.equal((await send('login','piano_123','wrong')).status,401);
  assert.deepEqual(await (await send('login','piano_123','demo-pw-123')).json(),{access_token:'access',refresh_token:'refresh'});
});

test('edge rejects bad keys, invalid usernames and passwords, and blocks requests over quota', async () => {
  const {send,calls,users,limit} = edgeFixture();
  assert.equal((await send('signup','piano_123','demo-pw-123','bad-key')).status,401);
  assert.equal((await send('signup','a@b.example','demo-pw-123')).status,400);
  assert.equal((await send('signup','piano_123','short')).status,400);
  assert.equal((await send('signup','piano_123','é'.repeat(37))).status,400);
  assert.equal(calls.length,0);
  limit();
  assert.equal((await send('signup','piano_123','demo-pw-123')).status,429);
  assert.equal(users.size,0);
});
