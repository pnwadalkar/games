// Shared namespace, storage and catalog helpers used by both the hub and the player.
(function () {
  'use strict';
  const Hub = window.Hub = window.Hub || {};

  Hub.LS = {
    get(k, d) {
      try { const v = localStorage.getItem('mg:' + k); return v == null ? d : JSON.parse(v); }
      catch (e) { return d; }
    },
    set(k, v) {
      try { localStorage.setItem('mg:' + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ }
    }
  };

  Hub.CATS = [
    { id: 'all', name: 'All', icon: '🎮' },
    { id: 'arcade', name: 'Arcade', icon: '🕹️' },
    { id: 'puzzle', name: 'Puzzle', icon: '🧩' },
    { id: 'board', name: 'Board', icon: '♟️' },
    { id: 'cards', name: 'Cards & Dice', icon: '🃏' },
    { id: 'word', name: 'Word', icon: '🔤' },
    { id: 'brain', name: 'Brain', icon: '🧠' },
    { id: '2p', name: '2 Players', icon: '👥' }
  ];

  // Game engines register a factory: Hub.register(engineId, (api, options) => { ... })
  Hub.factories = {};
  Hub.register = (id, factory) => { Hub.factories[id] = factory; };

  Hub.GAMES = [];
  // add(engine, id, name, cat, icon, [c1, c2], desc, how, extra)
  Hub.add = function (engine, id, name, cat, icon, colors, desc, how, extra) {
    Hub.GAMES.push(Object.assign({
      engine, id, name, cat, icon, c1: colors[0], c2: colors[1], desc, how,
      opt: {}, best: 'high', label: 'Score'
    }, extra || {}));
  };
  Hub.find = id => Hub.GAMES.find(g => g.id === id);

  Hub.bestText = function (g) {
    const b = Hub.LS.get('best:' + g.id, null);
    if (b == null || g.best === 'none') return '';
    return (g.best === 'low' ? 'Best ' : 'Best ') + Hub.fmt(b, g.fmt);
  };
  Hub.fmt = function (v, fmt) {
    if (fmt === 'time') {
      const s = Math.round(v * 10) / 10;
      if (s < 60) return s.toFixed(1) + 's';
      const m = Math.floor(s / 60);
      return m + ':' + String(Math.floor(s % 60)).padStart(2, '0');
    }
    if (fmt === 'ms') return Math.round(v) + 'ms';
    return String(v);
  };
})();
