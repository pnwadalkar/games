# GameNest · Mini Games

A collection of **104 free mini games** that run in the browser on laptops and phones. It's plain HTML, CSS and JavaScript, so there's no build step, no install and no tracking.

## Play

Open `index.html` in a browser, or host the folder on any static host (GitHub Pages works out of the box).

To run it locally:

```sh
python -m http.server 8000
# then open http://localhost:8000
```

## What's inside

| Category | Games |
|---|---|
| 🕹️ Arcade (27) | Snake ×4, Breakout ×2, Pong ×3 (incl. 2-player), Flappy Wings ×2, Alien Invaders, Asteroid Blaster, Dino Dash, Block Drop ×2, Whack-a-Mole ×2, Sky Hop, Road Cross, Cave Flyer, Stack Tower, Fruit Catcher, Dodge Orbs, Aim Trainer, Highway Racer, Bubble Shooter |
| 🧩 Puzzle (37) | 2048 ×4, Sudoku ×3, Minesweeper ×3, Sliding puzzles ×3, Lights Out ×2, Memory ×4, Flood It ×3, Tower of Hanoi ×3, Box Pusher (12 Sokoban levels), Maze Runner ×3, Pipe Connect ×3, Gem Swap, Collapse, Nonogram ×2, Peg Solitaire |
| ♟️ Board (15) | Tic-Tac-Toe ×3, Connect Four ×2, Reversi ×2, Checkers ×2, Gomoku ×2, Dots and Boxes ×2, Mancala ×2. All have a CPU opponent, and most have a 2-player mode |
| 🃏 Cards & Dice (7) | Solitaire (draw 1 / draw 3), Blackjack, Higher or Lower, Pig Dice ×2, Rock Paper Scissors |
| 🔤 Word (6) | Word Guess, Hangman, Word Scramble, Typing Speed, Word Search ×2 |
| 🧠 Brain (12) | Simon ×2, Code Breaker ×2, Quick Math ×2, Reaction Time, Color Match, Number Memory, Number Hunt ×2, Pattern Memory |

Every game has:

- **Keyboard, mouse and touch controls.** On-screen buttons appear automatically on touch devices.
- **Best scores**, saved on the device.
- **Pause, restart, how-to-play, sound toggle and fullscreen.**
- A responsive layout that scales to fit any screen.

The home page has search, categories, favorites and a "continue playing" row.

### Accounts

`login.html` has **Sign in** and **Create account** tabs, plus **Play as guest**. Accounts are stored in the browser's `localStorage` on that device (passwords are salted PBKDF2 hashes), so there is no server and no sync between devices. Each account keeps its own best scores, favorites and recent games. Guest data stays in the default slot, so scores saved before accounts existed are still there.

### 2.5D look

`js/fx3d.js` wraps the canvas 2D context so every game gets depth without per-game changes: shapes get an extruded shadow and a glossy bevel, circles get sphere shading, thick strokes become tubes, and background fills get a vignette plus a perspective floor. Games can also call `U.box`, `U.cyl`, `U.blob` and `U.shade` (in `js/engine.js`) for true extruded blocks, pipes and contact shadows. It switches itself off on slow devices, and `?flat=1` turns it off by hand. Dense grid games (Sudoku, Nonogram, Word Search, Number Hunt, Number Memory) skip it.

## Project layout

```
index.html          home page (catalog)
play.html           game player shell
css/style.css       base styles
css/fx.css          2.5D polish, account menu and login styles
login.html          sign in / create account
js/login.js         login page logic
js/fx3d.js          2.5D canvas effects
js/core.js          accounts, per-user storage + catalog helpers
js/registry.js      the list of games, their variants and how-to text
js/hub.js           home page logic
js/engine.js        player runtime: canvas scaling, input, touch pad, scores, sound, overlays
games/*.js          one file per game engine (variants share an engine)
games/_words.js     word lists for the word games
```

### Adding a game

1. Create `games/mygame.js`:

   ```js
   Hub.register('mygame', (api, opt) => {
     const c = api.canvas(480, 640);          // fixed logical size, auto-scaled
     api.controls('dpad');                     // touch buttons (dpad, lr, lr+a, a, ...)
     api.onKey(k => { /* 'left' | 'right' | 'up' | 'down' | 'a' | 'b' */ });
     api.loop(dt => { /* update */ }, () => { /* draw on c.ctx */ });
     // api.setScore(n); api.end({ win, msg, score });
   });
   ```

2. Add an entry in `js/registry.js` with `Hub.add('mygame', 'my-id', 'Name', 'arcade', '🎮', ['#c1', '#c2'], 'Short description', 'How to play')`.
