// Typing Speed: type the words shown for 60 seconds. Score is words per minute.
Hub.register('typing', (api) => {
  const TIME = 60;
  const pool = WORDS.five.concat(WORDS.all.filter(w => w.length <= 8));
  const words = Array.from({ length: 400 }, () => U.pick(pool));
  const ok = [];
  let idx = 0, correctChars = 0, typedWords = 0, errors = 0, time = TIME, started = false, done = false;

  const box = api.dom();
  box.style.maxWidth = '640px';
  const timer = api.el('div', { class: 'big', text: TIME + 's' });
  const text = api.el('div', { style: { fontSize: '22px', lineHeight: '1.7', background: '#141b45', borderRadius: '14px', padding: '16px 18px', width: '100%', minHeight: '120px', maxHeight: '170px', overflow: 'hidden', color: '#8f99c4', wordBreak: 'break-word' } });
  const input = api.el('input', { type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', placeholder: 'Start typing…', 'aria-label': 'Type here' });
  const info = api.el('div', { class: 'muted', text: 'Type each word and press space. The timer starts with your first key.' });
  [timer, text, input, info].forEach(e => box.appendChild(e));

  function render() {
    text.innerHTML = '';
    for (let i = Math.max(0, idx - 3); i < Math.min(words.length, idx + 30); i++) {
      const s = document.createElement('span');
      s.textContent = words[i] + ' ';
      if (i < idx) s.style.color = ok[i] ? '#2ee59d' : '#ff5c7a';
      if (i === idx) {
        s.style.color = '#fff';
        s.style.background = words[i].startsWith(input.value.trim()) ? '#2a3570' : '#6b2440';
        s.style.borderRadius = '6px';
        s.style.padding = '0 4px';
      }
      text.appendChild(s);
    }
  }
  const wpm = () => Math.round((correctChars / 5) / (((TIME - time) || 1) / 60));
  function finishWord() {
    const v = input.value.trim();
    input.value = '';
    if (!v) return;
    ok[idx] = v === words[idx];
    if (ok[idx]) { correctChars += words[idx].length + 1; api.sfx('click'); } else { errors++; api.sfx('bad'); }
    typedWords++;
    idx++;
    api.setScore(wpm());
    render();
  }
  api.on(input, 'input', () => {
    if (done) return;
    if (!started) { started = true; info.textContent = ''; }
    if (input.value.endsWith(' ')) finishWord(); else render();
  });
  api.on(input, 'keydown', e => { if (e.key === 'Enter') { e.preventDefault(); finishWord(); } });
  api.every(100, () => {
    if (!started || done) return;
    time = Math.max(0, time - .1);
    timer.textContent = Math.ceil(time) + 's';
    api.setScore(wpm());
    if (time <= 0) {
      done = true;
      input.disabled = true;
      const acc = typedWords ? Math.round((typedWords - errors) / typedWords * 100) : 0;
      api.end({ win: true, title: wpm() + ' WPM', msg: acc + '% accuracy · ' + (typedWords - errors) + ' correct words', emoji: '⌨️', score: wpm() });
    }
  });
  render();
  api.after(100, () => input.focus());
});
