// Sign in / register page.
(function () {
  'use strict';
  const Hub = window.Hub, $ = id => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  // Only same-site relative pages are allowed as a redirect target.
  const next = /^[\w-]+\.html(\?[\w=&%.-]*)?$/.test(params.get('next') || '') ? params.get('next') : './';
  let mode = params.get('mode') === 'register' ? 'up' : 'in', busy = false;

  if (Hub.Auth.current()) { location.replace(next); return; }

  function setMode(m) {
    mode = m;
    const up = m === 'up';
    $('tabIn').classList.toggle('on', !up); $('tabUp').classList.toggle('on', up);
    $('tabIn').setAttribute('aria-selected', String(!up)); $('tabUp').setAttribute('aria-selected', String(up));
    $('pw2Row').hidden = !up;
    $('title').textContent = up ? 'Create your account' : 'Welcome back';
    $('sub').textContent = up ? 'Pick a username and password to save your progress.' : 'Sign in to keep your scores, favorites and recent games.';
    $('go').textContent = up ? 'Create account' : 'Sign in';
    $('pw').autocomplete = up ? 'new-password' : 'current-password';
    $('err').textContent = '';
  }

  $('tabIn').onclick = () => setMode('in');
  $('tabUp').onclick = () => setMode('up');
  $('eye').onclick = () => {
    const show = $('pw').type === 'password';
    $('pw').type = show ? 'text' : 'password';
    if (mode === 'up') $('pw2').type = $('pw').type;
    $('eye').setAttribute('aria-label', show ? 'Hide password' : 'Show password');
  };
  $('guest').onclick = e => { e.preventDefault(); location.href = next; };

  $('form').addEventListener('submit', async e => {
    e.preventDefault();
    if (busy) return;
    const name = $('user').value, pw = $('pw').value;
    if (!name.trim() || !pw) { $('err').textContent = 'Enter a username and password.'; return; }
    if (mode === 'up' && pw !== $('pw2').value) { $('err').textContent = 'Passwords do not match.'; return; }
    busy = true; $('go').disabled = true; $('err').textContent = '';
    try {
      if (mode === 'up') await Hub.Auth.register(name, pw); else await Hub.Auth.login(name, pw);
      location.href = next;
    } catch (ex) {
      $('err').textContent = ex.message;
      busy = false; $('go').disabled = false;
    }
  });

  setMode(mode);
  $('user').focus();
})();
