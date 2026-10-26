// Game catalog. Each entry: engine file, id, name, category, icon, gradient, description, how-to, extras.
// Several entries share one engine with different options (size, difficulty, 2-player).
(function () {
  'use strict';
  const A = Hub.add;
  const K = '<b>Keys:</b> ', T = '<br><b>Touch:</b> ';
  const TIME = { best: 'low', fmt: 'time', label: 'Time' }, MOVES = { best: 'low', label: 'Moves' };
  const NONE = { best: 'none' };
  const two = x => Object.assign({ twoP: true, best: 'none' }, x);

  // ---------- Arcade ----------
  A('snake', 'snake', 'Snake', 'arcade', '🐍', ['#1fa463', '#0b6e4f'], 'Eat, grow, and don\'t bite yourself.',
    K + 'arrows / WASD to turn.' + T + 'swipe or use the D-pad.', { opt: { speed: 8 }, tags: 'classic retro' });
  A('snake', 'snake-wrap', 'Snake: No Walls', 'arcade', '🐍', ['#27c4a8', '#0f5d78'], 'Classic snake where the edges wrap around.',
    K + 'arrows / WASD.' + T + 'swipe or D-pad. Leave one side, appear on the other.', { opt: { wrap: true, speed: 9 } });
  A('snake', 'snake-turbo', 'Snake Turbo', 'arcade', '⚡', ['#ff8a3d', '#d6336c'], 'Every apple makes the snake faster.',
    K + 'arrows / WASD.' + T + 'swipe or D-pad.', { opt: { speed: 9, accel: true } });
  A('snake', 'snake-maze', 'Snake Maze', 'arcade', '🧱', ['#5a6599', '#2b2f6b'], 'Snake with walls in the way.',
    K + 'arrows / WASD.' + T + 'swipe or D-pad. Avoid the grey walls.', { opt: { speed: 8, maze: true } });
  A('breakout', 'breakout', 'Breakout', 'arcade', '🧱', ['#7c5cff', '#00a2ff'], 'Smash every brick with the ball.',
    K + '← → move, Space to launch. Mouse also works.' + T + 'drag to move the paddle, tap to launch.', { tags: 'arkanoid bricks' });
  A('breakout', 'breakout-pro', 'Breakout Pro', 'arcade', '💥', ['#ff5c7a', '#7c5cff'], 'Smaller paddle, faster ball.',
    K + '← → move, Space to launch.' + T + 'drag the paddle, tap to launch.', { opt: { hard: true } });
  A('pong', 'pong', 'Pong', 'arcade', '🏓', ['#00d4ff', '#2b59c3'], 'Classic paddle duel against the computer. First to 7.',
    K + '← → or mouse to move.' + T + 'drag anywhere to move your paddle.', { opt: { ai: 'easy' }, tags: 'tennis' });
  A('pong', 'pong-pro', 'Pong Pro', 'arcade', '🏓', ['#ff5c7a', '#2b2f6b'], 'Pong against a sharp, predictive CPU.',
    K + '← → or mouse.' + T + 'drag to move.', { opt: { ai: 'hard' } });
  A('pong', 'pong-2p', 'Pong: 2 Players', 'arcade', '🏓', ['#ffc94d', '#ff5c7a'], 'Two players on one device. First to 7.',
    K + 'bottom ← →, top A / D.' + T + 'each player drags on their half of the screen.', two({ opt: { twoP: true } }));
  A('flappy', 'flappy', 'Flappy Wings', 'arcade', '🐤', ['#3a8dde', '#7ee26f'], 'Flap through the pipes.',
    K + 'Space / ↑ to flap.' + T + 'tap anywhere.', { tags: 'bird' });
  A('flappy', 'flappy-hard', 'Flappy Wings Hard', 'arcade', '🐥', ['#2f9a3d', '#155e75'], 'Narrower gaps, faster pipes.',
    K + 'Space / ↑ to flap.' + T + 'tap anywhere.', { opt: { hard: true } });
  A('invaders', 'invaders', 'Alien Invaders', 'arcade', '👾', ['#2b1055', '#7597de'], 'Defend Earth from waves of aliens.',
    K + '← → move, Space to fire.' + T + 'drag to move — you fire automatically while touching.', { tags: 'space shooter' });
  A('asteroids', 'asteroids', 'Asteroid Blaster', 'arcade', '☄️', ['#141e30', '#4b6cb7'], 'Rotate, thrust and blast space rocks.',
    K + '← → rotate, ↑ thrust, Space fire.' + T + 'use the on-screen buttons.', { tags: 'space shooter' });
  A('runner', 'runner', 'Dino Dash', 'arcade', '🦖', ['#f8cdda', '#1d2b64'], 'Endless runner: jump cacti, duck birds.',
    K + 'Space / ↑ jump, ↓ duck.' + T + 'tap to jump, drag down to duck.', { label: 'Distance', tags: 'runner dinosaur' });
  A('blocks', 'blocks', 'Block Drop', 'arcade', '🟦', ['#4d7cff', '#b06cff'], 'Fit falling blocks together and clear lines.',
    K + '← → move, ↑ rotate, ↓ soft drop, Space hard drop.' + T + 'tap to rotate, drag to move, flick down to drop.', { tags: 'tetris falling blocks' });
  A('blocks', 'blocks-turbo', 'Block Drop Turbo', 'arcade', '🟥', ['#ff5c7a', '#ff8a3d'], 'Falling blocks starting at level 6.',
    K + '← → move, ↑ rotate, ↓ soft drop, Space hard drop.' + T + 'tap rotate, drag move, flick down.', { opt: { startLevel: 6 } });
  A('whack', 'whack', 'Whack-a-Mole', 'arcade', '🔨', ['#4ea64a', '#8b5a2b'], 'Bop moles for 30 seconds. Avoid bombs!',
    'Click / tap the moles. Golden moles are worth 5. Bombs cost 5.');
  A('whack', 'whack-frenzy', 'Whack Frenzy', 'arcade', '🐹', ['#ffcf3f', '#3f8f3a'], 'A 4×4 field with faster moles.',
    'Click / tap the moles. Golden moles are worth 5. Bombs cost 5.', { opt: { n: 4, fast: true } });
  A('skyhop', 'skyhop', 'Sky Hop', 'arcade', '🐣', ['#56ccf2', '#2f80ed'], 'Bounce ever higher on the platforms.',
    K + '← → steer.' + T + 'hold the left or right half of the screen. Blue platforms move, brown ones break, springs launch you.', { label: 'Height', tags: 'doodle jump' });
  A('roadcross', 'roadcross', 'Road Cross', 'arcade', '🐔', ['#5fbf4a', '#2f7fd6'], 'Hop across busy roads and rivers.',
    K + 'arrows to hop.' + T + 'tap to hop forward, swipe to move any direction. Ride logs across water; don\'t fall behind!', { label: 'Rows', tags: 'frogger crossy' });
  A('cave', 'cave', 'Cave Flyer', 'arcade', '🚁', ['#3b2a5c', '#7c5cff'], 'Fly through a narrowing cave.',
    K + 'hold Space / ↑ to rise.' + T + 'hold anywhere to rise, release to fall.', { label: 'Distance', tags: 'helicopter' });
  A('stack', 'stack', 'Stack Tower', 'arcade', '🏗️', ['#f093fb', '#f5576c'], 'Drop blocks to build the tallest tower.',
    K + 'Space to drop.' + T + 'tap to drop. Overhangs get sliced off; perfect drops grow the block back.');
  A('catcher', 'catcher', 'Fruit Catcher', 'arcade', '🧺', ['#ffb86b', '#ff6b8b'], 'Catch the fruit, dodge the bombs.',
    K + '← →.' + T + 'drag the basket. Missing fruit or catching a bomb costs a life.');
  A('dodge', 'dodge', 'Dodge Orbs', 'arcade', '🔵', ['#0a0e26', '#00a2ff'], 'Survive as long as you can.',
    K + 'arrows / WASD.' + T + 'drag anywhere (your dot moves with your finger, offset so you can see it). Grab 💎 for bonus points.');
  A('aim', 'aim', 'Aim Trainer', 'arcade', '🎯', ['#ff5c7a', '#ff8a3d'], 'Hit as many targets as you can in 30 seconds.',
    'Click / tap targets before they vanish. Bullseyes score 3.', { label: 'Hits' });
  A('racer', 'racer', 'Highway Racer', 'arcade', '🏎️', ['#3a3f55', '#00d4ff'], 'Weave through traffic at rising speed.',
    K + '← →.' + T + 'drag or use the buttons. Coins give bonus points.', { tags: 'car driving' });
  A('bubble', 'bubble', 'Bubble Shooter', 'arcade', '🫧', ['#00d4ff', '#b06cff'], 'Match 3 bubbles of a colour to pop them.',
    K + '← → aim, Space shoot, X swap.' + T + 'drag to aim, release to shoot. Every 6 misses a new row drops.', { tags: 'puzzle bobble' });

  // ---------- Puzzle ----------
  const h2048 = K + 'arrows / WASD.' + T + 'swipe. Equal tiles merge.';
  A('g2048', '2048', '2048', 'puzzle', '🔢', ['#edc22e', '#f65e3b'], 'Merge tiles to reach 2048.', h2048, { opt: { n: 4 } });
  A('g2048', '2048-mini', '2048 Mini 3×3', 'puzzle', '🔢', ['#f2b179', '#776e65'], 'Tiny board, big challenge.', h2048, { opt: { n: 3 } });
  A('g2048', '2048-5', '2048 Big 5×5', 'puzzle', '🔢', ['#f59563', '#7c5cff'], 'More room to plan big merges.', h2048, { opt: { n: 5 } });
  A('g2048', '2048-6', '2048 Huge 6×6', 'puzzle', '🔢', ['#f67c5f', '#2b59c3'], 'A giant board for marathon runs.', h2048, { opt: { n: 6 } });
  const hSud = 'Fill every row, column and 3×3 box with 1–9.<br>' + K + '1–9 to enter, arrows to move, N notes, Z undo, H hint.' + T + 'tap a cell then a number.';
  A('sudoku', 'sudoku-easy', 'Sudoku Easy', 'puzzle', '✏️', ['#56ab2f', '#a8e063'], 'Relaxed Sudoku with lots of clues.', hSud, Object.assign({ opt: { clues: 40 } }, TIME));
  A('sudoku', 'sudoku-medium', 'Sudoku Medium', 'puzzle', '✏️', ['#2193b0', '#6dd5ed'], 'A balanced Sudoku challenge.', hSud, Object.assign({ opt: { clues: 32 } }, TIME));
  A('sudoku', 'sudoku-hard', 'Sudoku Hard', 'puzzle', '✏️', ['#cc2b5e', '#753a88'], 'Few clues. Notes recommended.', hSud, Object.assign({ opt: { clues: 26 } }, TIME));
  const hMine = 'Numbers show how many mines touch a square.<br><b>Mouse:</b> left-click dig, right-click flag, click a number to clear around it.' + T + 'tap to dig, long-press to flag, or switch to 🚩 mode.';
  A('minesweeper', 'mines-easy', 'Minesweeper Easy', 'puzzle', '💣', ['#5b6fd6', '#2b2f6b'], '9×9 with 10 mines.', hMine, Object.assign({ opt: { w: 9, h: 9, mines: 10 } }, TIME));
  A('minesweeper', 'mines-medium', 'Minesweeper Medium', 'puzzle', '💣', ['#2b59c3', '#ff5c7a'], '16×16 with 40 mines.', hMine, Object.assign({ opt: { w: 16, h: 16, mines: 40 } }, TIME));
  A('minesweeper', 'mines-expert', 'Minesweeper Expert', 'puzzle', '💣', ['#ff5c7a', '#2b1055'], '30×16 with 99 mines.', hMine, Object.assign({ opt: { w: 30, h: 16, mines: 99 } }, TIME));
  const hSlide = 'Put the tiles in order 1, 2, 3… with the gap last.<br>' + K + 'arrows slide a tile into the gap.' + T + 'tap a tile in line with the gap.';
  A('slide', 'slide-8', '8 Puzzle', 'puzzle', '🧩', ['#11998e', '#38ef7d'], 'Sliding puzzle on a 3×3 board.', hSlide, Object.assign({ opt: { n: 3 } }, MOVES));
  A('slide', 'slide-15', '15 Puzzle', 'puzzle', '🧩', ['#4776e6', '#8e54e9'], 'The classic 4×4 sliding puzzle.', hSlide, Object.assign({ opt: { n: 4 } }, MOVES));
  A('slide', 'slide-24', '24 Puzzle', 'puzzle', '🧩', ['#ee0979', '#ff6a00'], 'A tough 5×5 sliding puzzle.', hSlide, Object.assign({ opt: { n: 5 } }, MOVES));
  const hLO = 'Tapping a light flips it and its 4 neighbours. Turn every light off.';
  A('lightsout', 'lightsout', 'Lights Out', 'puzzle', '💡', ['#f7971e', '#ffd200'], 'Switch off all the lights on a 5×5 grid.', hLO, Object.assign({ opt: { n: 5 } }, MOVES));
  A('lightsout', 'lightsout-7', 'Lights Out 7×7', 'puzzle', '🔦', ['#ffd200', '#2b2f6b'], 'A bigger, trickier grid of lights.', hLO, Object.assign({ opt: { n: 7 } }, MOVES));
  const hMem = 'Flip two cards at a time. Find every matching pair in as few moves as you can.';
  A('memory', 'memory-food', 'Memory: Snacks', 'puzzle', '🍕', ['#ff9966', '#ff5e62'], '6 pairs of tasty cards.', hMem, Object.assign({ opt: { pairs: 6, theme: 'food' } }, MOVES));
  A('memory', 'memory-animals', 'Memory: Animals', 'puzzle', '🐶', ['#f6d365', '#fda085'], '8 pairs of animal cards.', hMem, Object.assign({ opt: { pairs: 8, theme: 'animals' } }, MOVES));
  A('memory', 'memory-sports', 'Memory: Sports', 'puzzle', '⚽', ['#43cea2', '#185a9d'], '10 pairs of sports cards.', hMem, Object.assign({ opt: { pairs: 10, theme: 'sports' } }, MOVES));
  A('memory', 'memory-space', 'Memory: Space', 'puzzle', '🚀', ['#0f2027', '#2c5364'], '12 pairs — a real memory workout.', hMem, Object.assign({ opt: { pairs: 12, theme: 'space' } }, MOVES));
  const hFlood = 'Pick colours to grow your region from the top-left corner until the whole board is one colour.<br>' + K + 'number keys pick colours.';
  A('flood', 'flood-small', 'Flood It Mini', 'puzzle', '🌊', ['#00c6ff', '#0072ff'], '10×10 board in 20 moves.', hFlood, Object.assign({ opt: { n: 10, colors: 6, max: 20 } }, MOVES));
  A('flood', 'flood', 'Flood It', 'puzzle', '🌊', ['#00d4ff', '#7c5cff'], '14×14 board in 25 moves.', hFlood, Object.assign({ opt: { n: 14, colors: 6, max: 25 } }, MOVES));
  A('flood', 'flood-big', 'Flood It Mega', 'puzzle', '🌊', ['#7c5cff', '#ff5cc8'], '18×18 board in 33 moves.', hFlood, Object.assign({ opt: { n: 18, colors: 6, max: 33 } }, MOVES));
  const hHanoi = 'Move the whole tower to the right-hand peg. Move one disc at a time and never place a bigger disc on a smaller one.<br>Tap a peg to pick up its top disc, then tap where to put it. ' + K + '1 2 3.';
  A('hanoi', 'hanoi-4', 'Tower of Hanoi', 'puzzle', '🗼', ['#ff9a9e', '#a18cd1'], 'The classic puzzle with 4 discs.', hHanoi, Object.assign({ opt: { discs: 4 } }, MOVES));
  A('hanoi', 'hanoi-5', 'Tower of Hanoi 5', 'puzzle', '🗼', ['#a18cd1', '#5b3fd9'], '5 discs — 31 moves at best.', hHanoi, Object.assign({ opt: { discs: 5 } }, MOVES));
  A('hanoi', 'hanoi-7', 'Tower of Hanoi 7', 'puzzle', '🗼', ['#5b3fd9', '#141e30'], '7 discs — a true test of patience.', hHanoi, Object.assign({ opt: { discs: 7 } }, MOVES));
  A('sokoban', 'sokoban', 'Box Pusher', 'puzzle', '📦', ['#d9a05b', '#5b4b8a'], '12 Sokoban levels: push every box onto a target.',
    'You can push boxes but never pull them.<br>' + K + 'arrows to move, U / Z undo, R reset level.' + T + 'swipe or tap next to the player.', { label: 'Level', tags: 'sokoban warehouse' });
  const hMaze = 'Reach the flag. You keep running along corridors until the next junction.<br>' + K + 'arrows / WASD.' + T + 'swipe or D-pad.';
  A('maze', 'maze-small', 'Maze Runner', 'puzzle', '🌀', ['#11998e', '#2b2f6b'], 'Escape a fresh 10×10 maze.', hMaze, Object.assign({ opt: { n: 10 } }, TIME));
  A('maze', 'maze-medium', 'Maze Runner XL', 'puzzle', '🌀', ['#38ef7d', '#11998e'], 'A winding 18×18 maze.', hMaze, Object.assign({ opt: { n: 18 } }, TIME));
  A('maze', 'maze-large', 'Maze Runner XXL', 'puzzle', '🌀', ['#7c5cff', '#11998e'], 'A huge 28×28 labyrinth.', hMaze, Object.assign({ opt: { n: 28 } }, TIME));
  const hPipes = 'Tap tiles to rotate them. Connect every pipe to the yellow source with no open ends. Right-click rotates backwards.';
  A('pipes', 'pipes-5', 'Pipe Connect', 'puzzle', '🚰', ['#00b4db', '#0083b0'], 'Join all pipes on a 5×5 grid.', hPipes, Object.assign({ opt: { n: 5 } }, MOVES));
  A('pipes', 'pipes-7', 'Pipe Connect 7×7', 'puzzle', '🚰', ['#0083b0', '#2b2f6b'], 'A bigger plumbing puzzle.', hPipes, Object.assign({ opt: { n: 7 } }, MOVES));
  A('pipes', 'pipes-9', 'Pipe Connect 9×9', 'puzzle', '🚰', ['#2b2f6b', '#00d4ff'], 'The full plumber challenge.', hPipes, Object.assign({ opt: { n: 9 } }, MOVES));
  A('gems', 'gems', 'Gem Swap', 'puzzle', '💎', ['#b06cff', '#00d4ff'], 'Match-3: line up gems in 30 moves.',
    'Swap two neighbouring gems to make a line of 3 or more. Chains score combo multipliers.' + T + 'drag a gem toward its neighbour, or tap two gems.', { tags: 'match 3 candy jewels' });
  A('collapse', 'collapse', 'Collapse', 'puzzle', '🟨', ['#ffc94d', '#ff5c7a'], 'Clear groups of matching blocks.',
    'Tap a group of 2+ touching blocks of the same colour. Bigger groups score much more. Clearing the board gives +1000.', { tags: 'samegame' });
  const hNono = 'The numbers say how many filled cells are in each run in that row or column, in order.<br><b>Mouse:</b> left fill, right cross. Drag to paint.' + T + 'switch between Fill and Cross mode with the button.';
  A('nonogram', 'nonogram-5', 'Nonogram 5×5', 'puzzle', '🖼️', ['#00c9ff', '#92fe9d'], 'Picture logic puzzle — beginner size.', hNono, Object.assign({ opt: { n: 5 } }, TIME));
  A('nonogram', 'nonogram-10', 'Nonogram 10×10', 'puzzle', '🖼️', ['#92fe9d', '#7c5cff'], 'Picture logic puzzle — full size.', hNono, Object.assign({ opt: { n: 10 } }, TIME));
  A('pegs', 'pegs', 'Peg Solitaire', 'puzzle', '📍', ['#00d4ff', '#6b4423'], 'Jump pegs until only one remains.',
    'Tap a peg, then tap an empty hole two spaces away (in a straight line) to jump over and remove the middle peg. Finish with one peg — ideally in the centre.', { best: 'low', label: 'Pegs' });

  // ---------- Board ----------
  A('tictactoe', 'tictactoe', 'Tic-Tac-Toe', 'board', '❌', ['#00d4ff', '#ff5c7a'], 'Three in a row against an unbeatable CPU.',
    'You are X. Tap a square (or press 1–9). Can you force a draw?', Object.assign({ opt: { ai: 'hard' } }, NONE));
  A('tictactoe', 'tictactoe-easy', 'Tic-Tac-Toe Easy', 'board', '⭕', ['#2ee59d', '#00d4ff'], 'A friendlier CPU that makes mistakes.',
    'You are X. Tap a square (or press 1–9).', Object.assign({ opt: { ai: 'easy' } }, NONE));
  A('tictactoe', 'tictactoe-2p', 'Tic-Tac-Toe 2P', 'board', '❌', ['#ff5c7a', '#ffc94d'], 'Play a friend on the same device.',
    'Take turns tapping squares. Starting player alternates each game.', two({ opt: { twoP: true } }));
  A('connect4', 'connect4', 'Connect Four', 'board', '🔴', ['#2f4bd6', '#ff5c7a'], 'Drop discs to connect four before the CPU.',
    'Tap a column to drop your red disc.<br>' + K + '← → choose, Space / ↓ drop.', Object.assign({ opt: { depth: 5 } }, NONE));
  A('connect4', 'connect4-2p', 'Connect Four 2P', 'board', '🟡', ['#ffc94d', '#2f4bd6'], 'Connect four with a friend.',
    'Take turns tapping a column. First to four in a row (any direction) wins.', two({ opt: { twoP: true } }));
  A('reversi', 'reversi', 'Reversi', 'board', '⚫', ['#1e8a4c', '#15172b'], 'Outflank and flip the CPU\'s discs.',
    'Place a disc so it traps a line of the opponent\'s discs between yours — they flip to your colour. Dots show legal moves. Most discs at the end wins.', Object.assign({ opt: { depth: 3 }, tags: 'othello' }, NONE));
  A('reversi', 'reversi-2p', 'Reversi 2P', 'board', '⚪', ['#f4f5ff', '#1e8a4c'], 'Othello for two players.',
    'Black moves first. Trap the opponent\'s discs to flip them.', two({ opt: { twoP: true }, tags: 'othello' }));
  A('checkers', 'checkers', 'Checkers', 'board', '🔴', ['#8a5a35', '#e63950'], 'Classic draughts against the CPU.',
    'Tap a piece, then its destination. Captures are mandatory and multi-jumps continue. Reach the far side to crown a king ♛.', Object.assign({ opt: { depth: 5 }, tags: 'draughts' }, NONE));
  A('checkers', 'checkers-2p', 'Checkers 2P', 'board', '⚫', ['#22253a', '#8a5a35'], 'Draughts for two on one device.',
    'Red moves first. Captures are mandatory.', two({ opt: { twoP: true }, tags: 'draughts' }));
  A('gomoku', 'gomoku', 'Gomoku', 'board', '⚫', ['#d9a85b', '#7a5428'], 'Five in a row on a 15×15 board.',
    'Tap an intersection to place a stone. Get exactly five (or more) in a row before the CPU.', Object.assign({ tags: 'five in a row renju' }, NONE));
  A('gomoku', 'gomoku-2p', 'Gomoku 2P', 'board', '⚪', ['#7a5428', '#d9a85b'], 'Five in a row with a friend.',
    'Take turns placing stones. First to five in a row wins.', two({ opt: { twoP: true } }));
  A('dots', 'dots', 'Dots and Boxes', 'board', '🔲', ['#00d4ff', '#2b2f6b'], 'Close boxes to score — beat the CPU.',
    'Tap between two dots to draw a line. Completing a box scores a point and gives you another turn.', Object.assign({ opt: { n: 4 } }, NONE));
  A('dots', 'dots-2p', 'Dots and Boxes 2P', 'board', '🔳', ['#ff5c7a', '#00d4ff'], 'A 5×5 dots battle for two.',
    'Take turns drawing lines. Close a box to score and go again.', two({ opt: { n: 5, twoP: true } }));
  A('mancala', 'mancala', 'Mancala', 'board', '🪨', ['#8f5a2f', '#ffc94d'], 'Sow seeds and capture — Kalah rules vs CPU.',
    'Tap one of your pits (bottom row) to sow its seeds counter-clockwise. Land in your store (right) to go again. Land in an empty pit of yours to capture the opposite pit.', Object.assign({ tags: 'kalah' }, NONE));
  A('mancala', 'mancala-2p', 'Mancala 2P', 'board', '🪨', ['#ffc94d', '#7a4a25'], 'Kalah for two players.',
    'Player 1 owns the bottom row and right store; Player 2 the top row and left store.', two({ opt: { twoP: true }, tags: 'kalah' }));

  // ---------- Cards & Dice ----------
  A('solitaire', 'solitaire', 'Solitaire', 'cards', '🂡', ['#1f8a55', '#0c4a2c'], 'Klondike, draw one.',
    'Build the four foundations from Ace to King. In the columns, stack down in alternating colours. Only Kings go in empty columns.<br>Tap a card to auto-move it, or drag it. Tap the deck to draw.', Object.assign({ opt: { draw: 1 }, tags: 'klondike patience' }, MOVES));
  A('solitaire', 'solitaire-3', 'Solitaire Draw 3', 'cards', '🂮', ['#0c4a2c', '#5b3fd9'], 'Klondike with three-card draws.',
    'Same rules as Solitaire, but the deck deals three cards at a time.', Object.assign({ opt: { draw: 3 }, tags: 'klondike patience' }, MOVES));
  A('blackjack', 'blackjack', 'Blackjack', 'cards', '🃏', ['#1f8a55', '#ffc94d'], 'Beat the dealer to 21. Start with 100 chips.',
    'Hit to take a card, Stand to stop, Double to double your bet for exactly one more card. Dealer stands on 17. Blackjack pays 3:2.<br>' + K + 'Space deal, H hit, S stand, D double.', { label: 'Chips', tags: '21 casino' });
  A('hilo', 'hilo', 'Higher or Lower', 'cards', '🎴', ['#123a6b', '#2ee59d'], 'Guess if the next card is higher or lower.',
    'Aces are high. Equal cards are a free pass. One wrong guess ends the streak.<br>' + K + '↑ higher, ↓ lower.', { label: 'Streak' });
  A('pig', 'pig', 'Pig Dice', 'cards', '🎲', ['#ff8ac0', '#3b1f4f'], 'Push your luck dice race to 100 vs CPU.',
    'Roll to add to your turn total, Hold to bank it. Roll a 1 and you lose the turn total!', NONE);
  A('pig', 'pig-2p', 'Pig Dice 2P', 'cards', '🐷', ['#3b1f4f', '#ff8ac0'], 'Push-your-luck dice for two.',
    'Take turns rolling. Hold to bank points; a 1 wipes your turn. First to 100.', two({ opt: { twoP: true } }));
  A('rps', 'rps', 'Rock Paper Scissors', 'cards', '✌️', ['#ff8a3d', '#7c5cff'], 'Beat a CPU that learns your habits.',
    'First to 5 wins the match. The CPU tracks your patterns — stay unpredictable!<br>' + K + '1 2 3 or R P S.', { label: 'Streak' });

  // ---------- Word ----------
  A('wordguess', 'wordguess', 'Word Guess', 'word', '🟩', ['#2fa866', '#c9a227'], 'Find the hidden 5-letter word in 6 tries.',
    'Green = right letter, right spot. Yellow = in the word, wrong spot. Grey = not in the word. Any 5 letters count as a guess.', { label: 'Streak', deps: ['_words'], tags: 'wordle' });
  A('hangman', 'hangman', 'Hangman', 'word', '🪢', ['#5d6799', '#ffc94d'], 'Guess the word one letter at a time.',
    'Pick letters to reveal the word. Six wrong guesses and it\'s over. The category is shown at the top.', { label: 'Streak', deps: ['_words'] });
  A('scramble', 'scramble', 'Word Scramble', 'word', '🔀', ['#7c5cff', '#00d4ff'], 'Unscramble words against the clock.',
    'Tap letters (or type) to spell the word. 90 seconds. Skipping costs 5 points.', { deps: ['_words'], tags: 'anagram' });
  A('typing', 'typing', 'Typing Speed', 'word', '⌨️', ['#141e30', '#7c5cff'], 'How many words per minute can you type?',
    'Type each word and press Space. 60 seconds — accuracy counts.', { label: 'WPM', deps: ['_words'], tags: 'wpm keyboard' });
  const hWS = 'Drag across the letters to circle a hidden word. Words can run in any straight line.';
  A('wordsearch', 'wordsearch', 'Word Search', 'word', '🔍', ['#f4f5ff', '#7c5cff'], 'Find 8 themed words hidden in the grid.',
    'Drag across letters to select a word. Words run right, down or diagonally.', Object.assign({ opt: { n: 10, count: 8, easy: true }, deps: ['_words'] }, TIME));
  A('wordsearch', 'wordsearch-hard', 'Word Search Pro', 'word', '🔎', ['#7c5cff', '#ff5cc8'], '10 words in any direction, even backwards.',
    hWS, Object.assign({ opt: { n: 12, count: 10 }, deps: ['_words'] }, TIME));

  // ---------- Brain ----------
  A('simon', 'simon', 'Simon Says', 'brain', '🔴', ['#2ee59d', '#ff5c7a'], 'Repeat the growing colour sequence.',
    'Watch the pads light up, then tap them in the same order.<br>' + K + 'arrow keys or 1–4.', { label: 'Round' });
  A('simon', 'simon-fast', 'Simon Says Fast', 'brain', '🟡', ['#ffc94d', '#00a2ff'], 'Simon at double speed.',
    'Watch the pads light up, then tap them in the same order.', { label: 'Round', opt: { fast: true } });
  A('mastermind', 'mastermind', 'Code Breaker', 'brain', '🔐', ['#b06cff', '#ff5c7a'], 'Crack the 4-colour code in 10 guesses.',
    'After each guess: a white pin = right colour in the right place, grey pin = right colour in the wrong place. No colour repeats.<br>' + K + '1–6 colours, Backspace, Enter.', { best: 'low', label: 'Guesses', tags: 'mastermind' });
  A('mastermind', 'mastermind-dup', 'Code Breaker Pro', 'brain', '🔏', ['#ff5c7a', '#2b1055'], 'Colours can repeat in the code.',
    'Same as Code Breaker, but the secret code may use a colour more than once.', { best: 'low', label: 'Guesses', opt: { dup: true }, tags: 'mastermind' });
  A('quickmath', 'quickmath', 'Quick Math', 'brain', '➕', ['#7c5cff', '#2ea866'], 'Solve sums for 60 seconds.',
    'Tap the right answer (or press 1–4). Wrong answers cost 3 seconds. Problems get harder as you go.', { label: 'Correct' });
  A('quickmath', 'quickmath-hard', 'Quick Math Pro', 'brain', '✖️', ['#ff8a3d', '#7c5cff'], 'Harder sums from the very start.',
    'Tap the right answer (or press 1–4). Wrong answers cost 3 seconds.', { label: 'Correct', opt: { hard: true } });
  A('reaction', 'reaction', 'Reaction Time', 'brain', '⚡', ['#27ae60', '#c0392b'], 'How fast are your reflexes?',
    'Wait for green, then tap as fast as you can. Tapping early doesn\'t count. Average of 5 tries.', { best: 'low', fmt: 'ms', label: 'Avg', hideScore: true });
  A('colormatch', 'colormatch', 'Color Match', 'brain', '🎨', ['#ff4d6d', '#3d8bff'], 'Stroop test: meaning vs ink colour.',
    'Does the word\'s meaning match the colour it\'s printed in? Tap Yes or No (← / →). Wrong answers cost a point. 45 seconds.', { tags: 'stroop' });
  A('numbermemory', 'numbermemory', 'Number Memory', 'brain', '🔢', ['#00a2ff', '#2b2f6b'], 'Remember longer and longer numbers.',
    'Memorise the number before it disappears, then type it in. Two lives.', { label: 'Digits' });
  A('schulte', 'schulte', 'Number Hunt', 'brain', '🔍', ['#11998e', '#ffc94d'], 'Tap 1 to 25 in order, fast.',
    'Find and tap the numbers in order from 1. Train your peripheral vision.', Object.assign({ opt: { n: 5 }, tags: 'schulte' }, TIME));
  A('schulte', 'schulte-6', 'Number Hunt 6×6', 'brain', '🔎', ['#ffc94d', '#11998e'], 'Tap 1 to 36 in order.',
    'Find and tap the numbers in order from 1.', Object.assign({ opt: { n: 6 }, tags: 'schulte' }, TIME));
  A('visualmemory', 'visualmemory', 'Pattern Memory', 'brain', '🧩', ['#f5f6ff', '#5b3fd9'], 'Remember which tiles lit up.',
    'Tiles flash briefly — tap them all. Three wrong taps costs a life. The grid grows as you level up.', { label: 'Level' });
})();
