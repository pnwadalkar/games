// More games. Same format as registry.js: A(engine, id, name, category, icon, [c1, c2], description, how-to, extras).
(function () {
  'use strict';
  const A = Hub.add;
  const K = '<b>Keys:</b> ', T = '<br><b>Touch:</b> ';
  const TIME = { best: 'low', fmt: 'time', label: 'Time' };
  const NONE = { best: 'none' };
  const two = x => Object.assign({ twoP: true, best: 'none' }, x);

  // ---------- Arcade ----------
  A('fruitslice', 'fruitslice', 'Fruit Slice', 'arcade', '🍉', ['#ff7a45', '#c2185b'], 'Swipe through flying fruit. Skip the bombs.',
    '<b>Mouse / touch:</b> drag across the fruit to slice it. Slicing 3 or more in one swipe gives a combo bonus. Bombs end the game; three dropped fruits do too.', { tags: 'ninja slash' });
  A('pacmaze', 'pacmaze', 'Pac-Maze', 'arcade', '🟡', ['#3b5bff', '#0b1a6b'], 'Eat every dot and outrun the ghosts.',
    K + 'arrows / WASD.' + T + 'swipe or use the D-pad. Big dots let you eat the ghosts for a few seconds.', { tags: 'pacman' });
  A('lander', 'lander', 'Moon Lander', 'arcade', '🚀', ['#5b5f97', '#1b1e4a'], 'Land gently on the pad before the fuel runs out.',
    K + '← → rotate, ↑ / Space thrust.' + T + 'use the on-screen buttons. Land slowly and upright on the green pad.', { tags: 'space rocket' });
  A('missile', 'missile', 'Missile Defense', 'arcade', '🛰️', ['#7b2ff7', '#f107a3'], 'Shoot down incoming missiles and save your cities.',
    '<b>Mouse / touch:</b> tap where you want an interceptor to explode. Each base has limited ammo.', { tags: 'missile command' });
  A('airhockey', 'airhockey', 'Air Hockey', 'arcade', '🏒', ['#1aa0e8', '#0f4c81'], 'Slide the mallet and slam the puck into the goal. First to 7.',
    '<b>Mouse / touch:</b> move your mallet (bottom half). Hit the puck into the top goal.', Object.assign({ opt: {}, tags: 'table' }, NONE));
  A('airhockey', 'airhockey-hard', 'Air Hockey Hard', 'arcade', '🏒', ['#ff5c7a', '#7c1d6f'], 'A faster, sharper computer opponent.',
    '<b>Mouse / touch:</b> move your mallet (bottom half). Hit the puck into the top goal.', Object.assign({ opt: { hard: true } }, NONE));
  A('tiles', 'tiles', 'Piano Tiles', 'arcade', '🎹', ['#f4f6ff', '#6a7bd1'], 'Tap only the dark tiles. Do not miss one.',
    K + 'D F J K for the four lanes.' + T + 'tap the dark tiles, lowest first. The speed keeps climbing.', { tags: 'rhythm music' });
  A('balloons', 'balloons', 'Balloon Pop', 'arcade', '🎈', ['#59b8ff', '#ff4d6d'], 'Pop the balloons before they float away.',
    '<b>Mouse / touch:</b> tap balloons. Popping the same colour in a row builds a combo. Spiky balloons cost you hearts.', { tags: 'pop' });
  A('slingshot', 'slingshot', 'Slingshot', 'arcade', '🐷', ['#7ec850', '#2b7a3d'], 'Fling the ball and knock out every target.',
    '<b>Mouse / touch:</b> drag the ball back, then let go. A dotted line shows the first part of the flight.', { tags: 'angry birds catapult' });
  A('minigolf', 'minigolf', 'Mini Golf', 'arcade', '⛳', ['#2f8a45', '#1d5a2e'], 'Nine holes of putting. Fewest strokes wins.',
    '<b>Mouse / touch:</b> drag back from the ball to aim and set power, then release.', { best: 'low', label: 'Strokes', tags: 'putt' });
  A('plinko', 'plinko', 'Plinko', 'arcade', '🪙', ['#7c4dff', '#20104a'], 'Drop chips through the pegs into the big prizes.',
    K + '← → move, Space to drop.' + T + 'tap where you want to drop. You get 10 chips.', { tags: 'pachinko drop' });
  A('turret', 'turret', 'Turret Defense', 'arcade', '🧟', ['#4aa84a', '#10180f'], 'Hold the line against waves of creeping zombies.',
    '<b>Mouse / touch:</b> aim and hold to fire. <b>Keys:</b> ← → rotate, Space to shoot.', { tags: 'zombie shooter' });
  A('fruitmerge', 'fruitmerge', 'Fruit Merge', 'arcade', '🍉', ['#ff9f1c', '#e63946'], 'Drop fruit in the jar. Matching pairs merge into bigger fruit.',
    K + '← → move, Space to drop.' + T + 'tap where to drop. Do not let the pile reach the dotted line.', { tags: 'suika watermelon' });

  A('hoops', 'hoops', 'Hoops', 'arcade', '🏀', ['#ff8a2a', '#3a2a6b'], 'Flick the ball into the basket before the buzzer.',
    '<b>Mouse / touch:</b> drag the ball back and let go. A dotted line shows the shot. The hoop starts moving once you score a few.', { tags: 'basketball shoot' });

  // ---------- Puzzle ----------
  A('watersort', 'watersort', 'Water Sort', 'puzzle', '🧪', ['#00b4d8', '#3a0ca3'], 'Pour the liquids until every tube is one colour.',
    '<b>Mouse / touch:</b> tap a tube, then tap where to pour. You can only pour onto the same colour or an empty tube. Levels get harder.', { label: 'Levels', tags: 'sort pour' });
  const UN = '<b>Mouse / touch:</b> drag the blocks along their lanes. Slide the red block to the exit on the right. Fewer moves is better.';
  A('unblock', 'unblock-easy', 'Unblock Easy', 'puzzle', '🚗', ['#ff6b6b', '#8a3b2a'], 'Slide the cars out of the way to free the red one.', UN, Object.assign({ opt: { blocks: 6, steps: 60 }, tags: 'rush hour traffic' }, { best: 'low', label: 'Moves' }));
  A('unblock', 'unblock-medium', 'Unblock Medium', 'puzzle', '🚗', ['#ff6b6b', '#8a3b2a'], 'Slide the cars out of the way to free the red one.', UN, { opt: { blocks: 8, steps: 140 }, best: 'low', label: 'Moves' });
  A('unblock', 'unblock-hard', 'Unblock Hard', 'puzzle', '🚗', ['#ff6b6b', '#8a3b2a'], 'Slide the cars out of the way to free the red one.', UN, { opt: { blocks: 10, steps: 260 }, best: 'low', label: 'Moves' });
  const NQ = '<b>Mouse / touch:</b> tap a square to place or remove a queen. No two queens may share a row, column or diagonal.';
  A('nqueens', 'nqueens-6', 'N-Queens 6×6', 'puzzle', '♛', ['#9d4edd', '#3c096c'], 'Place queens so none can attack another.', NQ, Object.assign({ opt: { n: 6 }, tags: 'chess queens' }, TIME));
  A('nqueens', 'nqueens-8', 'N-Queens 8×8', 'puzzle', '♛', ['#9d4edd', '#3c096c'], 'Place queens so none can attack another.', NQ, Object.assign({ opt: { n: 8 } }, TIME));
  A('nqueens', 'nqueens-10', 'N-Queens 10×10', 'puzzle', '♛', ['#9d4edd', '#3c096c'], 'Place queens so none can attack another.', NQ, Object.assign({ opt: { n: 10 } }, TIME));
  const BN = '<b>Mouse / touch:</b> tap a cell to cycle blank → 0 → 1. No more than two of the same number in a row or column, each row and column has equal 0s and 1s, and no two rows or columns match.';
  A('binary', 'binary-6', 'Binary Puzzle 6×6', 'puzzle', '🔟', ['#00c9a7', '#005f73'], 'Fill the grid with 0s and 1s using three simple rules.', BN, Object.assign({ opt: { n: 6, keep: .42 }, tags: 'takuzu binairo' }, TIME));
  A('binary', 'binary-8', 'Binary Puzzle 8×8', 'puzzle', '🔟', ['#00c9a7', '#005f73'], 'Fill the grid with 0s and 1s using three simple rules.', BN, Object.assign({ opt: { n: 8, keep: .4 } }, TIME));
  A('binary', 'binary-10', 'Binary Puzzle 10×10', 'puzzle', '🔟', ['#00c9a7', '#005f73'], 'Fill the grid with 0s and 1s using three simple rules.', BN, Object.assign({ opt: { n: 10, keep: .38 } }, TIME));
  const KT = '<b>Mouse / touch:</b> pick any square to start, then move the knight in an L-shape to a square you have not visited. Visit every square. Undo if you get stuck.';
  A('knights', 'knights-5', "Knight's Tour 5×5", 'puzzle', '♞', ['#e9c46a', '#8a5a2a'], 'Visit every square exactly once with the knight.', KT, Object.assign({ opt: { n: 5 }, tags: 'chess' }, TIME));
  A('knights', 'knights-6', "Knight's Tour 6×6", 'puzzle', '♞', ['#e9c46a', '#8a5a2a'], 'Visit every square exactly once with the knight.', KT, Object.assign({ opt: { n: 6 } }, TIME));
  A('knights', 'knights-8', "Knight's Tour 8×8", 'puzzle', '♞', ['#e9c46a', '#8a5a2a'], 'Visit every square exactly once with the knight.', KT, Object.assign({ opt: { n: 8 } }, TIME));
  A('iceslide', 'iceslide', 'Ice Slide', 'puzzle', '🐧', ['#74c0fc', '#1c4a7a'], 'Slide across the ice and stop on the flag. Plan your moves.',
    K + 'arrows / WASD.' + T + 'swipe or use the D-pad. You keep sliding until you hit a rock or the edge. You only get a few moves per level.', { label: 'Levels', tags: 'penguin' });
  A('tenten', 'tenten', 'Block Fit', 'puzzle', '🧱', ['#7c5cff', '#22205a'], 'Fit the pieces on the board and clear full lines.',
    '<b>Mouse / touch:</b> drag a piece onto the board. Filling a whole row or column clears it. The game ends when none of your pieces fit.', { tags: '1010 tetris blocks' });

  // ---------- Board ----------
  const CH = '<b>Mouse / touch:</b> tap a piece, then a highlighted square. You play white. Castling and en passant are left out; pawns promote to queens.';
  A('chess', 'chess-easy', 'Chess Easy', 'board', '♟️', ['#8d6e63', '#3e2723'], 'Chess against a gentle computer.', CH, Object.assign({ opt: { depth: 1 }, tags: 'kings' }, NONE));
  A('chess', 'chess-medium', 'Chess Medium', 'board', '♟️', ['#8d6e63', '#3e2723'], 'Chess against a thinking computer.', CH, Object.assign({ opt: { depth: 2 } }, NONE));
  A('chess', 'chess-hard', 'Chess Hard', 'board', '♟️', ['#8d6e63', '#3e2723'], 'Chess against a stronger computer.', CH, Object.assign({ opt: { depth: 3 } }, NONE));
  A('chess', 'chess-2p', 'Chess 2P', 'board', '♟️', ['#8d6e63', '#3e2723'], 'Two players, one board.', CH, two({ opt: { twoP: true, depth: 1 } }));
  A('battleship', 'battleship', 'Battleship', 'board', '🚢', ['#1a75bc', '#071e3d'], 'Sink the enemy fleet before they sink yours.',
    '<b>Mouse / touch:</b> shuffle your fleet and press Start, then tap squares in the top grid to fire. A hit lets you fire again.', Object.assign({ opt: {}, tags: 'ships naval' }, NONE));
  A('battleship', 'battleship-hard', 'Battleship Hard', 'board', '🚢', ['#1a75bc', '#071e3d'], 'The computer hunts in a smarter pattern.',
    '<b>Mouse / touch:</b> shuffle your fleet and press Start, then tap squares in the top grid to fire. A hit lets you fire again.', Object.assign({ opt: { hard: true } }, NONE));
  const SL = '<b>Mouse / touch:</b> tap (or press Space) to roll. Ladders take you up, snakes slide you down. You need an exact roll to land on 100, and a 6 gives another turn.';
  A('snakesladders', 'snakesladders', 'Snakes & Ladders', 'board', '🐍', ['#f4a261', '#2a9d8f'], 'Race a computer to square 100.', SL, Object.assign({ opt: {}, tags: 'dice race' }, NONE));
  A('snakesladders', 'snakesladders-2p', 'Snakes & Ladders 2P', 'board', '🪜', ['#f4a261', '#2a9d8f'], 'Two players, one device.', SL, two({ opt: { twoP: true } }));

  // ---------- Cards & Dice ----------
  A('slots', 'slots', 'Lucky Slots', 'cards', '🎰', ['#e0245e', '#3a0d4a'], 'Spin the reels. Line up three for a big win.',
    K + 'Space to spin, ↑ to raise the bet.' + T + 'pick a bet and tap SPIN. You start with 100 credits and play until you run out.', { label: 'Peak', tags: 'casino jackpot' });
  A('videopoker', 'videopoker', 'Video Poker', 'cards', '🂡', ['#0f6b3a', '#073a20'], 'Jacks or Better. Hold the best cards and draw.',
    K + 'Space to deal / draw, 1–5 to hold.' + T + 'tap cards to hold them. Each hand costs 5 credits.', { label: 'Peak', tags: 'poker casino' });
  A('yahtzee', 'yahtzee', 'Yahtzee', 'cards', '🎲', ['#2a9d8f', '#16423c'], 'Roll five dice and score thirteen categories.',
    '<b>Mouse / touch:</b> roll, tap dice to hold them, roll up to three times, then tap a row to score it.', { tags: 'dice' });
  A('war', 'war', 'War', 'cards', '⚔️', ['#2b9348', '#0b3d20'], 'Flip cards. Higher card wins both. Ties mean war.',
    K + 'Space to flip.' + T + 'tap FLIP, or turn on Auto to watch the whole war.', Object.assign({ tags: 'cards' }, NONE));
  A('roulette', 'roulette', 'Roulette', 'cards', '🎡', ['#c1121f', '#14090b'], 'Place your chips and spin the wheel.',
    '<b>Mouse / touch:</b> pick a chip value, tap the table to bet, then SPIN. Numbers pay 35 to 1, dozens 2 to 1, and colours and halves 1 to 1.', { label: 'Peak', tags: 'casino wheel' });
  A('crazy8', 'crazy8', 'Crazy Eights', 'cards', '8️⃣', ['#1b9aaa', '#0b3d4a'], 'Match the suit or number. Eights are wild.',
    '<b>Mouse / touch:</b> tap a card that matches the top card by suit or rank. No playable card? Tap the deck to draw. First to empty their hand wins.', Object.assign({ tags: 'uno' }, NONE));

  // ---------- Word ----------
  const WH = '<b>Mouse / touch:</b> drag across touching letters (diagonals count) and let go to submit. Words must be 3+ letters and are checked against our word list.';
  A('wordhunt', 'wordhunt', 'Word Hunt 4×4', 'word', '🔠', ['#f9a826', '#b5541c'], 'Drag across letters to find hidden words.', WH, { opt: { n: 4 }, deps: ['_words'], tags: 'boggle' });
  A('wordhunt', 'wordhunt-5', 'Word Hunt 5×5', 'word', '🔠', ['#f9a826', '#b5541c'], 'Drag across letters to find hidden words.', WH, { opt: { n: 5 }, deps: ['_words'] });
  A('wordrain', 'wordrain', 'Word Rain', 'word', '🌧️', ['#4361ee', '#10163a'], 'Type the falling words before they land.',
    '<b>Keys:</b> just type. A word disappears when you finish it. Space or Enter clears what you typed.' + T + 'tap the play field to open the keyboard.', { deps: ['_words'], tags: 'typing falling' });
  A('spellbee', 'spellbee', 'Spelling Bee', 'word', '🐝', ['#ffd23f', '#f08c00'], 'Make words from seven letters. Always use the centre one.',
    K + 'type letters, Enter to submit, Backspace to delete.' + T + 'tap the hexagons. Words need 4+ letters and the gold centre letter. Pangrams use all seven letters.', { deps: ['_words'], tags: 'hive' });
  A('quiz', 'quiz-trivia', 'General Trivia', 'word', '❓', ['#7b2ff7', '#2c1370'], 'Ten questions on everything from animals to art.',
    K + '1–4 to answer.' + T + 'tap an answer. The faster you answer, the more points you get.', { opt: { bank: 'trivia' }, group: 'quiz-trivia', tags: 'quiz questions' });
  A('quiz', 'quiz-science', 'Science Quiz', 'word', '🔬', ['#06d6a0', '#064e3b'], 'Ten questions on space, the body and chemistry.',
    K + '1–4 to answer.' + T + 'tap an answer. The faster you answer, the more points you get.', { opt: { bank: 'science' }, group: 'quiz-science', tags: 'quiz questions' });
  A('quiz', 'quiz-capitals', 'World Capitals', 'word', '🌍', ['#118ab2', '#073b4c'], 'Name the capital city of countries around the world.',
    K + '1–4 to answer.' + T + 'tap an answer. The faster you answer, the more points you get.', { opt: { bank: 'capitals' }, group: 'quiz-capitals', tags: 'geography quiz' });
  A('quiz', 'quiz-capitals-hard', 'World Capitals (all)', 'word', '🌍', ['#118ab2', '#073b4c'], 'Seventy countries, including the tricky ones.',
    K + '1–4 to answer.' + T + 'tap an answer. The faster you answer, the more points you get.', { opt: { bank: 'capitals', hard: true }, group: 'quiz-capitals', tags: 'geography quiz' });

  // ---------- Brain ----------
  A('stroop', 'stroop', 'Colour Clash', 'brain', '🎨', ['#ff5c7a', '#3a86ff'], 'The word says one colour, the ink is another. Tap the ink.',
    K + '1–4 to answer.' + T + 'tap the button for the colour the word is printed in, not the word itself. 45 seconds.', { tags: 'stroop' });
  const NB = '<b>Mouse / touch:</b> a square lights up every two seconds. Press MATCH (or M) when it is in the same place as N steps ago.';
  A('nback', 'nback-1', 'N-Back 1', 'brain', '🧩', ['#5e60ce', '#2a2a6e'], 'Spot the square that matches the previous one.', NB, { opt: { n: 1 }, tags: 'memory working' });
  A('nback', 'nback-2', 'N-Back 2', 'brain', '🧩', ['#5e60ce', '#2a2a6e'], 'Spot the square that matches two steps back.', NB, { opt: { n: 2 } });
  A('nback', 'nback-3', 'N-Back 3', 'brain', '🧩', ['#5e60ce', '#2a2a6e'], 'Spot the square that matches three steps back.', NB, { opt: { n: 3 } });
  A('chimp', 'chimp', 'Chimp Memory', 'brain', '🐵', ['#b5651d', '#4a2a0a'], 'Remember where the numbers were, then tap them in order.',
    '<b>Mouse / touch:</b> memorise the numbers. After you tap 1 the rest turn blank, so tap them in order from memory. Three lives.', { label: 'Level', tags: 'number memory' });
  A('oddone', 'oddone', 'Odd Colour Out', 'brain', '👁️', ['#ff6b6b', '#c2185b'], 'One tile is a slightly different shade. Find it fast.',
    '<b>Mouse / touch:</b> tap the tile that looks different. The grid grows and the difference shrinks. Wrong taps cost time and a life.', { tags: 'colour eyes' });
  A('estimate', 'estimate', 'Quick Count', 'brain', '👀', ['#4cc9f0', '#3a0ca3'], 'Dots flash for a second. How many were there?',
    K + '1–4 to answer.' + T + 'tap the number you think matches. Three mistakes and it is over.', { tags: 'counting dots' });
  A('sequence', 'sequence', 'Number Sequence', 'brain', '🔢', ['#06d6a0', '#073b4c'], 'Spot the pattern and pick the next number.',
    K + '1–4 to answer.' + T + 'tap the answer. Right answers add 3 seconds, wrong ones cost 5.', { tags: 'pattern maths' });
  A('math24', 'math24', 'Make 24', 'brain', '🧮', ['#f72585', '#3a0ca3'], 'Combine four numbers with + − × ÷ to make 24.',
    '<b>Mouse / touch:</b> tap a number, an operator, then another number. Repeat until one number is left. Three skips. 3 minutes.', { tags: '24 game maths' });

  // @@END
})();
