# GameNest · Mini Games

A collection of **100 free mini games** that run in the browser on laptops and phones. It's plain HTML, CSS and JavaScript, so there's no build step, no install and no tracking.

Each game appears once. Games with several modes (difficulty, board size, 1 or 2 players) open a picker, so Sudoku is one card with Easy / Medium / Hard, not three.

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
| 🕹️ Arcade (31) | Snake, Breakout, Pong, Flappy Wings, Alien Invaders, Asteroid Blaster, Dino Dash, Block Drop, Whack-a-Mole, Sky Hop, Road Cross, Cave Flyer, Stack Tower, Fruit Catcher, Dodge Orbs, Aim Trainer, Highway Racer, Bubble Shooter, Hoops, Fruit Slice, Pac-Maze, Moon Lander, Missile Defense, Air Hockey, Piano Tiles, Balloon Pop, Slingshot, Mini Golf, Plinko, Turret Defense, Fruit Merge |
| 🧩 Puzzle (22) | 2048, Sudoku, Minesweeper, Sliding Puzzle, Lights Out, Memory Match, Flood It, Tower of Hanoi, Box Pusher, Maze Runner, Pipe Connect, Gem Swap, Collapse, Nonogram, Peg Solitaire, Water Sort, Unblock, N-Queens, Binary Puzzle, Knight's Tour, Ice Slide, Block Fit |
| ♟️ Board (10) | Tic-Tac-Toe, Connect Four, Reversi, Checkers, Gomoku, Dots and Boxes, Mancala, Chess, Battleship, Snakes & Ladders. All have a CPU opponent, and most have a 2-player mode |
| 🃏 Cards & Dice (11) | Solitaire, Blackjack, Higher or Lower, Pig Dice, Rock Paper Scissors, Lucky Slots, Video Poker, Yahtzee, War, Roulette, Crazy Eights |
| 🔤 Word (11) | Word Guess, Hangman, Word Scramble, Typing Speed, Word Search, Word Hunt, Word Rain, Spelling Bee, General Trivia, Science Quiz, World Capitals |
| 🧠 Brain (15) | Simon Says, Code Breaker, Quick Math, Reaction Time, Color Match, Number Memory, Number Hunt, Pattern Memory, Colour Clash, N-Back, Chimp Memory, Odd Colour Out, Quick Count, Number Sequence, Make 24 |

Every game has:

- **Keyboard, mouse and touch controls.** On-screen buttons appear automatically on touch devices.
- **Best scores**, saved on the device.
- **Pause, restart, how-to-play, sound toggle and fullscreen.**
- A responsive layout that scales to fit any screen.

The home page has search, categories, favorites and a "continue playing" row.

### Accounts

`login.html` has **Sign in** and **Create account** tabs, plus **Play as guest**. Accounts are stored in the browser's `localStorage` on that device (passwords are salted PBKDF2 hashes), so there is no server and no sync between devices. Each account keeps its own best scores, favorites and recent games. Guest data stays in the default slot, so scores saved before accounts existed are still there.

### Online play (two accounts, anywhere in the world)

Ten turn-based games can be played between two people on different devices: Tic-Tac-Toe, Connect Four, Reversi, Checkers, Gomoku, Dots and Boxes, Mancala, Pig Dice, Snakes & Ladders and Chess. Open a game and choose **🌐 Play online with a friend**.

- **Invite an account:** sign in, type your friend's username and press Invite. If they have GameNest open and are signed in, they get a popup and can Accept or Decline.
- **Invite by link:** copy the link and send it by any chat app. It works for anyone, signed in or not.
- Either player can ask for a **rematch**. If someone leaves, the other is told.

How it works: there is no game server. Browsers connect directly (WebRTC) using the free public PeerJS broker for the handshake (`js/peerjs.min.js` is vendored). Both browsers run the same game with the same random seed, and each click is sent to the other side. Only the player whose turn it is can click, and the other copy replays the click in the same order, so the two games stay identical (`js/net.js`). A game opts in by setting `api.turnOf = () => 0 | 1`, and optionally `api.busy` (ignore clicks while animating) and `api.canon` (if it shows the board from the other side). Dice use `api.randi` so both sides roll the same numbers.

Limits worth knowing:
- Accounts are still stored in each browser, with no central account database. A username identifies you to your friend, but nothing proves who owns it, so treat it as a nickname, not a login. Real accounts that follow you across devices need a backend such as Firebase or Supabase.
- Invites by username only reach a friend who currently has the site open and is signed in. Use the link otherwise.
- Real-time games (Pong, Air Hockey) and Battleship (hidden boards) are not online yet.
- Very strict networks (some school or corporate firewalls) can block peer-to-peer connections.

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
js/registry.js      the first set of games, their modes and how-to text
js/registry_more.js the newer games (same format)
js/groups.js        names each game and its modes; builds the one-card-per-game catalog
js/net.js           online play: invites, rooms, click syncing (uses js/peerjs.min.js)
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

2. Add an entry in `js/registry_more.js` with `Hub.add('mygame', 'my-id', 'Name', 'arcade', '🎮', ['#c1', '#c2'], 'Short description', 'How to play')`.
