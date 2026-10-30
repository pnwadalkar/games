// Quiz: ten multiple-choice questions, faster answers score more. Question banks: trivia, science, capitals (easy / all).
Hub.register('quiz', (api, o) => {
  const BANKS = {
    trivia: [
      ['Which is the largest planet in our solar system?', 'Jupiter', 'Saturn', 'Neptune', 'Earth'], ['How many continents are there?', '7', '5', '6', '8'],
      ['Which is the largest ocean?', 'Pacific', 'Atlantic', 'Indian', 'Arctic'], ['Who wrote Romeo and Juliet?', 'William Shakespeare', 'Charles Dickens', 'Mark Twain', 'Jane Austen'],
      ['How many sides does a hexagon have?', '6', '5', '7', '8'], ['Which gas do plants absorb from the air?', 'Carbon dioxide', 'Oxygen', 'Nitrogen', 'Helium'],
      ['Which animal is the fastest on land?', 'Cheetah', 'Lion', 'Horse', 'Greyhound'], ['What is the chemical symbol for gold?', 'Au', 'Ag', 'Gd', 'Go'],
      ['In which year did the Titanic sink?', '1912', '1905', '1920', '1898'], ['Who painted the Mona Lisa?', 'Leonardo da Vinci', 'Michelangelo', 'Raphael', 'Picasso'],
      ['Which river is traditionally considered the longest?', 'The Nile', 'The Amazon', 'The Yangtze', 'The Mississippi'], ['What is the smallest prime number?', '2', '1', '3', '0'],
      ['How many players per side are on the field in soccer?', '11', '9', '10', '12'], ['What is the hardest natural substance?', 'Diamond', 'Gold', 'Iron', 'Quartz'],
      ['Which planet is known as the Red Planet?', 'Mars', 'Venus', 'Mercury', 'Jupiter'], ['How many strings does a standard guitar have?', '6', '4', '5', '8'],
      ['At what temperature does water boil, in °C?', '100', '90', '120', '212'], ['Which is the largest mammal?', 'Blue whale', 'African elephant', 'Giraffe', 'Hippopotamus'],
      ['What is the main language spoken in Brazil?', 'Portuguese', 'Spanish', 'English', 'French'], ['Who is credited with inventing the telephone?', 'Alexander Graham Bell', 'Thomas Edison', 'Nikola Tesla', 'Guglielmo Marconi'],
      ['How many colours are in a rainbow?', '7', '6', '8', '5'], ['Which mountain is the tallest above sea level?', 'Mount Everest', 'K2', 'Kilimanjaro', 'Denali'],
      ['What is the currency of Japan?', 'Yen', 'Won', 'Yuan', 'Dollar'], ['An angle of exactly 90° is called…', 'A right angle', 'An acute angle', 'An obtuse angle', 'A straight angle'],
      ['Which instrument has 88 keys?', 'Piano', 'Organ', 'Accordion', 'Harp'], ['How many minutes are in a day?', '1440', '1240', '1640', '2400'],
      ['Which bird is a symbol of peace?', 'Dove', 'Eagle', 'Swan', 'Owl'], ['Who wrote the Harry Potter books?', 'J.K. Rowling', 'J.R.R. Tolkien', 'Roald Dahl', 'C.S. Lewis'],
      ['Which sport is played at Wimbledon?', 'Tennis', 'Cricket', 'Golf', 'Badminton'], ['What do bees make?', 'Honey', 'Silk', 'Milk', 'Syrup'],
      ['What is the Roman numeral for 50?', 'L', 'C', 'X', 'D'], ['Water freezes at what temperature in °F?', '32', '0', '12', '100'],
      ['In which country is the Great Pyramid of Giza?', 'Egypt', 'Mexico', 'Peru', 'Sudan'], ['Which fruit is dried to make raisins?', 'Grapes', 'Plums', 'Figs', 'Cherries'],
      ['How many bones does an adult human have?', '206', '186', '256', '306'], ['The Statue of Liberty was a gift from which country?', 'France', 'England', 'Spain', 'Italy'],
      ['Mixing blue and yellow makes which colour?', 'Green', 'Purple', 'Orange', 'Brown'], ['Which is the largest hot desert?', 'Sahara', 'Gobi', 'Kalahari', 'Arabian']
    ],
    science: [
      ['What is the chemical formula for water?', 'H₂O', 'CO₂', 'O₂', 'HO'], ['Which planet is closest to the Sun?', 'Mercury', 'Venus', 'Earth', 'Mars'],
      ['What force pulls objects towards Earth?', 'Gravity', 'Magnetism', 'Friction', 'Inertia'], ['Which part of a cell is the "powerhouse"?', 'Mitochondria', 'Nucleus', 'Ribosome', 'Chloroplast'],
      ['Which gas do we need to breathe?', 'Oxygen', 'Helium', 'Hydrogen', 'Nitrogen'], ['How fast does light travel (roughly)?', '300,000 km/s', '3,000 km/s', '30,000 km/s', '3,000,000 km/s'],
      ['What is at the centre of an atom?', 'The nucleus', 'An electron', 'An orbit', 'A shell'], ['Which of these is NOT a state of matter?', 'Sound', 'Solid', 'Liquid', 'Gas'],
      ['Which organ pumps blood around the body?', 'Heart', 'Lung', 'Liver', 'Kidney'], ['What do plants use to make food from sunlight?', 'Photosynthesis', 'Respiration', 'Digestion', 'Pollination'],
      ['What is the chemical symbol for sodium?', 'Na', 'So', 'S', 'Sd'], ['How many planets are in our solar system?', '8', '9', '7', '10'],
      ['Which mammal lays eggs?', 'Platypus', 'Kangaroo', 'Bat', 'Dolphin'], ['What is the study of earthquakes called?', 'Seismology', 'Meteorology', 'Astronomy', 'Ecology'],
      ['Which of these is a noble gas?', 'Neon', 'Oxygen', 'Chlorine', 'Hydrogen'], ['What colour does litmus paper turn in acid?', 'Red', 'Blue', 'Green', 'Yellow'],
      ['What is the largest organ of the human body?', 'Skin', 'Liver', 'Brain', 'Heart'], ['What is the unit of electrical resistance?', 'Ohm', 'Volt', 'Watt', 'Ampere'],
      ['What is the boiling point of water in Kelvin?', '373 K', '273 K', '473 K', '100 K'], ['What is at the centre of our solar system?', 'The Sun', 'Sirius', 'Polaris', 'Betelgeuse'],
      ['Which galaxy do we live in?', 'The Milky Way', 'Andromeda', 'Whirlpool', 'Triangulum'], ['What does DNA stand for?', 'Deoxyribonucleic acid', 'Diribonucleic acid', 'Dioxynucleic acid', 'Deoxyribose nitrogen acid'],
      ['Which vitamin does the skin make from sunlight?', 'Vitamin D', 'Vitamin C', 'Vitamin A', 'Vitamin B12'], ['Rock formed from cooled lava is called…', 'Igneous', 'Sedimentary', 'Metamorphic', 'Fossil'],
      ['Which blood cells fight infection?', 'White blood cells', 'Red blood cells', 'Platelets', 'Plasma'], ['Sound travels fastest through…', 'Solids', 'Liquids', 'Gases', 'A vacuum'],
      ['What is the chemical symbol for iron?', 'Fe', 'Ir', 'In', 'I'], ['What is a baby kangaroo called?', 'A joey', 'A cub', 'A calf', 'A pup'],
      ['How many chromosomes do humans normally have?', '46', '23', '44', '48'], ['Which star is closest to Earth after the Sun?', 'Proxima Centauri', 'Sirius', 'Vega', 'Polaris']
    ]
  };
  const EASY = 'France|Paris,Germany|Berlin,Italy|Rome,Spain|Madrid,the United Kingdom|London,Japan|Tokyo,China|Beijing,India|New Delhi,Russia|Moscow,Brazil|Brasília,Canada|Ottawa,Australia|Canberra,Egypt|Cairo,Mexico|Mexico City,Argentina|Buenos Aires,South Korea|Seoul,Turkey|Ankara,Greece|Athens,Portugal|Lisbon,the Netherlands|Amsterdam,Sweden|Stockholm,Norway|Oslo,Poland|Warsaw,Thailand|Bangkok,Kenya|Nairobi,South Africa|Pretoria,Peru|Lima,Cuba|Havana,Ireland|Dublin,Austria|Vienna';
  const HARD = 'Nigeria|Abuja,Morocco|Rabat,Ghana|Accra,Ethiopia|Addis Ababa,Tanzania|Dodoma,Algeria|Algiers,Chile|Santiago,Colombia|Bogotá,Venezuela|Caracas,Ecuador|Quito,Bolivia|Sucre,Uruguay|Montevideo,Pakistan|Islamabad,Bangladesh|Dhaka,Vietnam|Hanoi,the Philippines|Manila,Indonesia|Jakarta,Malaysia|Kuala Lumpur,Iran|Tehran,Iraq|Baghdad,Saudi Arabia|Riyadh,Jordan|Amman,Finland|Helsinki,Denmark|Copenhagen,Switzerland|Bern,Belgium|Brussels,Czechia|Prague,Hungary|Budapest,Romania|Bucharest,Ukraine|Kyiv,New Zealand|Wellington,Nepal|Kathmandu,Mongolia|Ulaanbaatar,Kazakhstan|Astana,Afghanistan|Kabul,Iceland|Reykjavik,Croatia|Zagreb,Serbia|Belgrade,Jamaica|Kingston,Panama|Panama City';
  const caps = (o.hard ? EASY + ',' + HARD : EASY).split(',').map(s => s.split('|'));
  let bank = BANKS[o.bank];
  if (!bank) {
    const allCaps = caps.map(x => x[1]);
    bank = caps.map(([country, cap]) => {
      const wrong = U.shuffle(allCaps.filter(x => x !== cap)).slice(0, 3);
      return ['What is the capital of ' + country + '?', cap, ...wrong];
    });
  }
  const qs = U.shuffle(bank.slice()).slice(0, 10);
  const SEC = 12;
  let qi = 0, score = 0, right = 0, tLeft = SEC, locked = false, timer = null;

  const box = api.dom();
  box.style.maxWidth = '520px';
  const head = api.el('div', { style: { display: 'flex', justifyContent: 'space-between', width: '100%', fontWeight: '800', color: '#9fb2ff' } });
  const prog = api.el('span'), sc = api.el('span');
  head.appendChild(prog); head.appendChild(sc);
  const bar = api.el('div', { style: { width: '100%', height: '10px', borderRadius: '6px', background: '#1b2250', overflow: 'hidden', boxShadow: 'inset 0 2px 4px rgba(0,0,0,.4)' } });
  const fill = api.el('div', { style: { height: '100%', width: '100%', background: 'linear-gradient(90deg,#2ee59d,#ffd23f)', transition: 'width .1s linear' } });
  bar.appendChild(fill);
  const qEl = api.el('div', { style: { fontSize: 'clamp(20px,4.6vw,26px)', fontWeight: '800', textAlign: 'center', lineHeight: '1.3', minHeight: '84px', display: 'grid', placeItems: 'center', padding: '10px 6px' } });
  const opts = api.el('div', { style: { display: 'grid', gap: '10px', width: '100%' } });
  [head, bar, qEl, opts].forEach(e => box.appendChild(e));

  function show() {
    const q = qs[qi];
    prog.textContent = 'Question ' + (qi + 1) + ' / ' + qs.length; sc.textContent = 'Score ' + score;
    qEl.textContent = q[0]; opts.innerHTML = ''; locked = false; tLeft = SEC;
    U.shuffle(q.slice(1).map((t, i) => ({ t, ok: i === 0 }))).forEach((a, i) => {
      const b = api.el('button', { class: 'btn', style: { padding: '15px 16px', fontSize: '17px', textAlign: 'left', width: '100%' } });
      b.textContent = (i + 1) + '.  ' + a.t;
      b.dataset.ok = a.ok ? '1' : '';
      b.onclick = () => answer(b, a.ok);
      opts.appendChild(b);
    });
  }
  function answer(btn, ok) {
    if (locked) return;
    locked = true;
    [...opts.children].forEach(b => { if (b.dataset.ok) { b.style.background = '#1f9d55'; b.style.borderColor = '#2ee59d'; } b.disabled = true; });
    if (ok) { const pts = 10 + Math.ceil(tLeft); score += pts; right++; api.setScore(score); api.sfx('coin'); sc.textContent = 'Score ' + score; }
    else if (btn) { btn.style.background = '#b3263f'; btn.style.borderColor = '#ff5c7a'; api.sfx('bad'); }
    api.after(ok ? 750 : 1200, () => {
      qi++;
      if (qi >= qs.length) { clearInterval(timer); api.end({ win: true, title: right + ' of ' + qs.length + ' correct', msg: right >= 8 ? 'Brilliant!' : right >= 5 ? 'Nice work!' : 'Keep practising!', score, emoji: '🧠' }); }
      else show();
    });
  }
  timer = api.every(100, () => {
    if (locked || api.over) return;
    tLeft -= .1; fill.style.width = Math.max(0, tLeft / SEC * 100) + '%';
    if (tLeft <= 0) answer(null, false);
  });
  api.on(window, 'keydown', e => { if (/^[1-4]$/.test(e.key) && !locked) { const b = opts.children[+e.key - 1]; if (b) b.click(); } });
  api.status('Press 1–4 or tap an answer');
  show();
});
