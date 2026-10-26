// Home page: category chips, search, favorites, recently played and the game grid.
(function () {
  'use strict';
  const Hub = window.Hub;
  const $ = id => document.getElementById(id);
  const GAMES = Hub.GAMES;
  let cat = Hub.LS.get('cat', 'all');
  let favs = Hub.LS.get('favs', []);

  $('count').textContent = GAMES.length;

  const inCat = (g, c) => c === 'all' || g.cat === c || (c === '2p' && g.twoP);

  function card(g) {
    const a = document.createElement('a');
    a.className = 'card';
    a.href = 'play.html?g=' + encodeURIComponent(g.id);
    a.style.setProperty('--c1', g.c1);
    a.style.setProperty('--c2', g.c2);
    const c = Hub.CATS.find(x => x.id === g.cat);
    const best = Hub.bestText(g);
    a.innerHTML =
      '<div class="thumb"><span class="emo"></span><span class="badge"></span></div>' +
      '<div class="meta"><div class="name"></div><div class="sub"></div></div>' +
      '<button class="fav" aria-label="Favorite">★</button>';
    a.querySelector('.emo').textContent = g.icon;
    a.querySelector('.badge').textContent = c ? c.name : '';
    a.querySelector('.name').textContent = g.name;
    a.querySelector('.sub').textContent = best || g.desc;
    const fb = a.querySelector('.fav');
    fb.classList.toggle('on', favs.includes(g.id));
    fb.title = favs.includes(g.id) ? 'Remove from favorites' : 'Add to favorites';
    fb.onclick = e => {
      e.preventDefault();
      e.stopPropagation();
      favs = favs.includes(g.id) ? favs.filter(x => x !== g.id) : [g.id].concat(favs);
      Hub.LS.set('favs', favs);
      render();
    };
    return a;
  }

  function renderChips() {
    const box = $('chips');
    box.innerHTML = '';
    Hub.CATS.forEach(c => {
      const n = GAMES.filter(g => inCat(g, c.id)).length;
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

  function fillRow(sec, row, ids) {
    const list = ids.map(Hub.find).filter(Boolean);
    $(sec).hidden = !list.length || !!$('q').value.trim();
    const el = $(row);
    el.innerHTML = '';
    list.forEach(g => el.appendChild(card(g)));
  }

  function render() {
    const q = $('q').value.trim().toLowerCase();
    fillRow('recentSec', 'recent', Hub.LS.get('recent', []));
    fillRow('favSec', 'favs', favs);
    const list = GAMES.filter(g => inCat(g, cat) &&
      (!q || (g.name + ' ' + g.desc + ' ' + g.cat + ' ' + (g.tags || '')).toLowerCase().includes(q)));
    const grid = $('grid');
    grid.innerHTML = '';
    list.forEach(g => grid.appendChild(card(g)));
    $('empty').hidden = list.length > 0;
    const c = Hub.CATS.find(x => x.id === cat);
    $('listTitle').textContent = q ? 'Results' : (cat === 'all' ? 'All games' : c.icon + ' ' + c.name);
    $('listCount').textContent = list.length + ' game' + (list.length === 1 ? '' : 's');
  }

  $('q').addEventListener('input', render);
  $('random').onclick = () => {
    const pool = GAMES.filter(g => inCat(g, cat));
    const g = pool[Math.floor(Math.random() * pool.length)];
    location.href = 'play.html?g=' + encodeURIComponent(g.id);
  };
  window.addEventListener('pageshow', () => { favs = Hub.LS.get('favs', []); render(); });

  renderChips();
  render();
})();
