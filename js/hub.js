// Home page: category chips, search, favorites, recently played and one card per game.
// Games with several modes (difficulty, size, 1 or 2 players) open a mode picker first.
(function () {
  'use strict';
  const Hub = window.Hub;
  const $ = id => document.getElementById(id);
  const GROUPS = Hub.groups;
  let cat = Hub.LS.get('cat', 'all');
  let favs = Hub.LS.get('favs', []);

  $('count').textContent = GROUPS.length;
  Hub.mountUser($('user'));

  const inCat = (G, c) => c === 'all' || G.cat === c || (c === '2p' && G.twoP);
  // Favorites and recents are stored as game or mode ids; fold them into unique games.
  const toGroups = ids => {
    const out = [];
    ids.forEach(id => { const G = Hub.groupOf(id); if (G && !out.includes(G)) out.push(G); });
    return out;
  };
  const isFav = G => favs.some(id => Hub.groupOf(id) === G);
  const playUrl = id => 'play.html?g=' + encodeURIComponent(id);

  function bestOf(G) {
    return G.variants.length === 1 ? Hub.bestText(G.variants[0]) : '';
  }

  function openPicker(G) {
    const box = $('pickBody');
    box.innerHTML = '';
    const head = document.createElement('div');
    head.className = 'pick-head';
    head.style.setProperty('--c1', G.c1); head.style.setProperty('--c2', G.c2);
    head.innerHTML = '<span class="pe"></span><div><h2></h2><p></p></div>';
    head.querySelector('.pe').textContent = G.icon;
    head.querySelector('h2').textContent = G.name;
    head.querySelector('p').textContent = G.desc;
    box.appendChild(head);
    const lbl = document.createElement('div');
    lbl.className = 'pick-lbl'; lbl.textContent = 'Choose a mode';
    box.appendChild(lbl);
    const list = document.createElement('div');
    list.className = 'pick-list';
    G.variants.forEach(v => {
      const a = document.createElement('a');
      a.className = 'vopt'; a.href = playUrl(v.id);
      a.innerHTML = '<span class="vn"></span><span class="vb"></span><span class="go">▶</span>';
      a.querySelector('.vn').textContent = v.vlabel;
      a.querySelector('.vb').textContent = Hub.bestText(v);
      list.appendChild(a);
    });
    box.appendChild(list);
    $('pick').hidden = false;
    const first = list.querySelector('a');
    if (first) first.focus({ preventScroll: true });
  }
  const closePicker = () => { $('pick').hidden = true; };
  $('pickClose').onclick = closePicker;
  $('pick').addEventListener('click', e => { if (e.target === $('pick')) closePicker(); });
  window.addEventListener('keydown', e => { if (e.key === 'Escape') closePicker(); });

  function openGame(G) {
    if (G.variants.length === 1) location.href = playUrl(G.variants[0].id);
    else openPicker(G);
  }

  function card(G) {
    const a = document.createElement('a');
    a.className = 'card';
    a.href = G.variants.length === 1 ? playUrl(G.variants[0].id) : '#' + G.id;
    a.style.setProperty('--c1', G.c1);
    a.style.setProperty('--c2', G.c2);
    const c = Hub.CATS.find(x => x.id === G.cat);
    a.innerHTML =
      '<div class="thumb"><span class="emo"></span><span class="badge"></span><span class="modes"></span></div>' +
      '<div class="meta"><div class="name"></div><div class="sub"></div></div>' +
      '<button class="fav" aria-label="Favorite">★</button>';
    a.querySelector('.emo').textContent = G.icon;
    a.querySelector('.badge').textContent = c ? c.name : '';
    const m = a.querySelector('.modes');
    if (G.variants.length > 1) m.textContent = G.variants.length + ' modes'; else m.remove();
    a.querySelector('.name').textContent = G.name;
    a.querySelector('.sub').textContent = bestOf(G) || G.desc;
    const fb = a.querySelector('.fav');
    fb.classList.toggle('on', isFav(G));
    fb.title = isFav(G) ? 'Remove from favorites' : 'Add to favorites';
    fb.onclick = e => {
      e.preventDefault(); e.stopPropagation();
      favs = isFav(G) ? favs.filter(id => Hub.groupOf(id) !== G) : [G.id].concat(favs);
      Hub.LS.set('favs', favs);
      render();
    };
    a.onclick = e => { if (e.target.closest('.fav')) return; e.preventDefault(); openGame(G); };
    return a;
  }

  function renderChips() {
    const box = $('chips');
    box.innerHTML = '';
    Hub.CATS.forEach(c => {
      const n = GROUPS.filter(G => inCat(G, c.id)).length;
      const b = document.createElement('button');
      b.className = 'chip' + (c.id === cat ? ' on' : '');
      b.innerHTML = '<span></span><span></span><b></b>';
      b.children[0].textContent = c.icon;
      b.children[1].textContent = c.name;
      b.children[2].textContent = n;
      b.onclick = () => { cat = c.id; Hub.LS.set('cat', cat); renderChips(); render(); };
      box.appendChild(b);
    });
  }

  function fillRow(sec, row, list) {
    $(sec).hidden = !list.length || !!$('q').value.trim();
    const el = $(row);
    el.innerHTML = '';
    list.forEach(G => el.appendChild(card(G)));
  }

  function render() {
    const q = $('q').value.trim().toLowerCase();
    fillRow('recentSec', 'recent', toGroups(Hub.LS.get('recent', [])).slice(0, 10));
    fillRow('favSec', 'favs', toGroups(favs));
    const list = GROUPS.filter(G => inCat(G, cat) && (!q || G.search.includes(q)));
    const grid = $('grid');
    grid.innerHTML = '';
    list.forEach(G => grid.appendChild(card(G)));
    $('empty').hidden = list.length > 0;
    const c = Hub.CATS.find(x => x.id === cat);
    $('listTitle').textContent = q ? 'Results' : (cat === 'all' ? 'All games' : c.icon + ' ' + c.name);
    $('listCount').textContent = list.length + ' game' + (list.length === 1 ? '' : 's');
  }

  $('q').addEventListener('input', render);
  $('random').onclick = () => {
    const pool = GROUPS.filter(G => inCat(G, cat));
    const G = pool[Math.floor(Math.random() * pool.length)];
    location.href = playUrl(G.variants[0].id); // a random game opens in its first mode
  };
  window.addEventListener('pageshow', () => { favs = Hub.LS.get('favs', []); render(); });

  renderChips();
  render();
  // index.html#sudoku opens that game's mode picker directly
  const deep = Hub.groups.find(G => G.id === decodeURIComponent(location.hash.slice(1)));
  if (deep && deep.variants.length > 1) openPicker(deep);
})();
