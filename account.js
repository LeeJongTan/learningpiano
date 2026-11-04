'use strict';

const pianoAccount = (() => {
  const table = 'phim_lesson_completions';
  const callback = new URL('./', location.href);
  let client, user, mode = 'login', message = '', busy = false;
  let syncStatus = '', lastSynced = '', syncing = false, queued = false;
  let generation = 0;
  let fullLessonAccess = false;

  const redirectTo = action => {
    const url = new URL(callback);
    url.searchParams.set('account', action);
    return url.href;
  };

  function page() {
    return `<div class="account-layout">
      <section class="account-intro">
        <img src="./assets/piano-logo.png" alt="" width="54" height="77">
        <p class="eyebrow">phím. · ${t('account')}</p>
        <h1>${t('accountHeadline')}</h1>
        <p>${t('accountIntro')}</p>
        <a class="section-link" href="#learn">${t('accountKeepLearning')} ${icon('arrow')}</a>
      </section>
      <section class="profile-card account-card">
        ${user && mode !== 'recovery' ? signedIn() : form()}
        <p id="account-message" role="status">${message ? t(message) : ''}</p>
      </section>
    </div>`;
  }

  function signedIn() {
    return `<h2>${t('accountSignedIn')}</h2>
      <p class="account-email">${escapeHTML(user.app_metadata?.phim_username || user.email || '')}</p>
      <p>${t('accountDevice')}</p>
      <p class="account-sync" data-account-sync role="status">${syncStatus ? t(syncStatus) : ''}</p>
      <div class="account-actions">
        <button class="button" data-account-action="sync">${t('accountSync')}</button>
        ${readLearner(STORAGE_KEY).completed.length ? `<button class="button soft" data-account-action="import">${t('accountImport')}</button>` : ''}
        <a href="#profile" class="button secondary">${t('profile')}</a>
        <button class="button secondary" data-account-action="logout">${t('accountLogout')}</button>
      </div>`;
  }

  function form() {
    const byUsername = mode === 'login' || mode === 'signup';
    const title = {login:'accountLogin', legacy:'accountLegacyLogin', signup:'accountSignup', reset:'accountReset', recovery:'accountNewPassword'}[mode];
    return `<h2>${t(title)}</h2>
      <p>${t(mode === 'signup' ? 'accountUsernameHint' : mode === 'reset' ? 'accountEmailHint' : 'accountFormHint')}</p>
      <form id="account-form" method="post">
        ${byUsername ? `<label for="account-username">${t('accountUsername')}</label>
          <input id="account-username" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="24" required>`
        : mode !== 'recovery' ? `<label for="account-email">Email</label>
          <input id="account-email" type="email" name="email" autocomplete="username" maxlength="254" required>` : ''}
        ${mode !== 'reset' ? `<label for="account-password">${t('accountPassword')}</label>
          <div class="account-password"><input id="account-password" type="password" name="password" autocomplete="${mode === 'signup' || mode === 'recovery' ? 'new-password' : 'current-password'}" ${mode === 'signup' || mode === 'recovery' ? 'minlength="8"' : ''} required>
          <button type="button" class="button secondary" data-account-action="password" aria-pressed="false">${t('accountShow')}</button></div>` : ''}
        <button type="submit" class="button account-submit" ${busy || !client ? 'disabled' : ''}>${t(busy ? 'accountWorking' : mode === 'reset' ? 'accountSend' : mode === 'recovery' ? 'accountUpdate' : title)}</button>
      </form>
      ${mode === 'login' ? `<div class="account-links"><button class="text-button" data-account-mode="signup">${t('accountSignup')}</button>
      <button class="text-button" data-account-mode="legacy">${t('accountLegacyLogin')}</button></div>` :
      mode === 'legacy' ? `<div class="account-links"><button class="text-button" data-account-mode="login">${t('accountBack')}</button>
      <button class="text-button" data-account-mode="reset">${t('accountReset')}</button></div>` :
      mode === 'recovery' ? '' : `<button class="text-button" data-account-mode="login">${t('accountBack')}</button>`}`;
  }

  function refresh() {
    if (route === 'account') render();
  }

  function showMessage(key) {
    message = key;
    const status = $('#account-message');
    if (status) status.textContent = key ? t(key) : '';
  }

  function showSync(key) {
    syncStatus = key;
    $$('[data-account-sync]').forEach(el => { el.textContent = t(key); });
  }

  const signature = ids => [...ids].sort((a,b) => a-b).join(',');

  async function sync(force = false) {
    if (!user || mode === 'recovery' || learnerAccountId !== user.id) return;
    const ids = [...state.completed];
    if (!force && signature(ids) === lastSynced) return;
    if (syncing) { queued = true; return; }
    syncing = true;
    const owner = user.id;
    const version = generation;
    showSync('accountSyncing');
    try {
      if (ids.length) {
        const {error} = await client.from(table).upsert(
          ids.map(lesson_id => ({user_id: owner, lesson_id})),
          {onConflict:'user_id,lesson_id', ignoreDuplicates:true}
        );
        if (error) throw error;
      }
      const {data, error} = await client.from(table).select('lesson_id').eq('user_id', owner);
      if (error) throw error;
      if (version !== generation) return;
      const cloud = data.map(row => row.lesson_id).filter(id => Number.isInteger(id) && id >= 1 && id <= COURSE_TOTAL);
      lastSynced = signature(cloud);
      mergeAccountProgress(cloud);
      showSync('accountSynced');
    } catch {
      if (version === generation) {
        lastSynced = signature(ids);
        showSync('accountSyncError');
      }
    } finally {
      syncing = false;
      if (queued) { queued = false; void sync(true); }
    }
  }

  async function loadLessonAccess(owner, version) {
    try {
      const {data, error} = await client.from('phim_full_lesson_access')
        .select('user_id').eq('user_id', owner).maybeSingle();
      if (version !== generation || error || data?.user_id !== owner) return;
      fullLessonAccess = true;
      if (!activeLesson && ['home', 'learn'].includes(route)) render();
      const lessonLink = location.hash.match(/^#lesson-(\d+)$/);
      if (lessonLink && !activeLesson) openLesson(Number(lessonLink[1]));
    } catch {
      // Use the standard lesson order if the grant cannot be verified.
    }
  }

  function receiveSession(event, session) {
    const next = session?.user || null;
    if (event === 'PASSWORD_RECOVERY') mode = 'recovery';
    else if (!next && mode === 'recovery') mode = 'login';
    if (next?.id !== user?.id) {
      generation++;
      fullLessonAccess = false;
      lastSynced = '';
      syncStatus = '';
      user = next;
      switchLearner(next?.id || null);
      if (next) void loadLessonAccess(next.id, generation);
    } else {
      user = next;
    }
    if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY' || event === 'SIGNED_OUT') refresh();
    if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') void sync(true);
  }

  async function init() {
    const action = new URL(location.href).searchParams.get('account');
    if (action === 'reset' || action === 'confirm') {
      location.hash = 'account';
    }
    showMessage('accountConnecting');
    try {
      const {createClient} = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm');
      const {url, key} = window.PHIM_ACCOUNT_CONFIG;
      client = createClient(url, key, {auth:{flowType:'pkce', storageKey:'phim-auth-v1'}});
      client.auth.onAuthStateChange((event, session) => {
        // Let the SDK release its auth lock before querying the Data API.
        setTimeout(() => {
          receiveSession(event, session);
          if (event === 'INITIAL_SESSION' && message === 'accountConnecting') {
            showMessage(action && !session ? 'accountLinkExpired' : '');
          }
        }, 0);
      });
      const {error} = await client.auth.initialize();
      if (error && action) showMessage('accountLinkExpired');
      if (action) {
        const clean = new URL(location.href);
        clean.searchParams.delete('account');
        history.replaceState(null, '', clean);
      }
      refresh();
    } catch {
      client = null;
      showMessage('accountUnavailable');
      refresh();
    }
  }

  function errorMessage(error) {
    if (error.code === 'invalid_credentials') return 'accountInvalid';
    if (error.code === 'invalid_username') return 'accountUsernameInvalid';
    if (error.code === 'username_taken') return 'accountUsernameTaken';
    if (error.code === 'invalid_password') return 'accountPasswordLength';
    if (error.code === 'email_not_confirmed') return 'accountUnverified';
    if (error.code === 'over_email_send_rate_limit' || error.status === 429) return 'accountRate';
    if (error.code === 'email_address_not_authorized' || error.code === 'email_provider_disabled') return 'accountMailBlocked';
    if (error.code === 'weak_password') return 'accountWeak';
    return 'accountFailed';
  }

  async function usernameRequest(action, username, password) {
    if (!/^[a-z0-9_]{3,24}$/.test(username)) throw {code:'invalid_username'};
    const {url, key} = window.PHIM_ACCOUNT_CONFIG;
    const response = await fetch(url + '/functions/v1/username-auth', {
      method:'POST',
      headers:{apikey:key, 'Content-Type':'application/json'},
      body:JSON.stringify({action, username, password}),
    });
    const data = await response.json();
    if (!response.ok) throw {code:data.code, status:response.status};
    return data;
  }

  document.addEventListener('submit', async event => {
    if (event.target.id !== 'account-form') return;
    event.preventDefault();
    if (!client || busy) return;
    const fields = new FormData(event.target);
    const email = String(fields.get('email') || '').trim();
    const username = String(fields.get('username') || '').trim().toLowerCase();
    const password = String(fields.get('password') || '');
    const action = mode;
    const submit = event.target.querySelector('[type=submit]');
    busy = true;
    submit.disabled = true;
    showMessage('accountWorking');
    try {
      let response;
      if (action === 'signup' || action === 'login') {
        if (action === 'signup') {
          await usernameRequest('signup', username, password);
          mode = 'login';
          showMessage('accountCreated');
          return;
        }
        const tokens = await usernameRequest('login', username, password);
        response = await client.auth.setSession(tokens);
      }
      else if (action === 'reset') response = await client.auth.resetPasswordForEmail(email,{redirectTo:redirectTo('reset')});
      else if (action === 'recovery') response = await client.auth.updateUser({password});
      else response = await client.auth.signInWithPassword({email,password});
      if (response.error) throw response.error;
      if (action === 'recovery') { mode = 'login'; void sync(true); }
      if (action === 'reset') mode = 'legacy';
      showMessage(action === 'recovery' ? 'accountUpdated' :
        action === 'reset' ? 'accountCheckMail' : 'accountWelcome');
      const field = event.target.querySelector('[name=password]');
      if (field) field.value = '';
    } catch (error) {
      showMessage(action === 'legacy' && error.code === 'invalid_credentials' ? 'accountLegacyInvalid' : errorMessage(error));
    } finally {
      busy = false;
      if (action !== mode) {
        refresh();
        const usernameField = $('#account-username');
        if (action === 'signup' && usernameField) {
          usernameField.value = username;
          $('#account-password')?.focus();
        }
      }
      submit.disabled = false;
    }
  });

  document.addEventListener('click', async event => {
    const tab = event.target.closest('[data-account-mode]');
    if (tab && !busy) {
      mode = tab.dataset.accountMode;
      showMessage('');
      refresh();
      $('#account-username, #account-email')?.focus();
      return;
    }
    const button = event.target.closest('[data-account-action]');
    if (!button) return;
    const action = button.dataset.accountAction;
    if (action === 'password') {
      const field = $('#account-password');
      const shown = field.type === 'password';
      field.type = shown ? 'text' : 'password';
      button.setAttribute('aria-pressed', String(shown));
      button.textContent = t(shown ? 'accountHide' : 'accountShow');
    } else if (action === 'import' && user) {
      mergeAccountProgress(readLearner(STORAGE_KEY).completed);
      void sync(true);
    } else if (action === 'sync') {
      void sync(true);
    } else if (action === 'logout' && user) {
      button.disabled = true;
      try {
        const {error} = await client.auth.signOut({scope:'local'});
        if (error) throw error;
        mode = 'login';
        showMessage('accountSignedOut');
      } catch { showMessage('accountFailed'); }
      finally { button.disabled = false; }
    }
  });

  window.addEventListener('online', () => void sync(true));
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) void sync(true);
  });

  return {page, init, sync, hasFullLessonAccess: () => fullLessonAccess && user?.id === learnerAccountId};
})();
