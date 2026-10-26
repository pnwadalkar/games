// Shared word lists for the word games.
window.WORDS = (function () {
  const five = (
    'about above actor acute admit adopt adult after again agent agree ahead alarm album alert alike alive allow alone along ' +
    'alter among anger angle angry apart apple apply arena argue arise array aside asset audio avoid award aware badly baker ' +
    'basic beach began begin being below bench birth black blade blame blank blind block blood board boost booth bound brain ' +
    'brand bread break breed brief bring broad broke brown build built buyer cable candy carry catch cause chain chair chart ' +
    'chase cheap check chest chief child chose civil claim class clean clear click climb clock close cloud coach coast could ' +
    'count court cover craft crash cream crime cross crowd crown curve cycle daily dance dealt death delay depth doing doubt ' +
    'dozen draft drama drawn dream dress drink drive drove eager early earth eight elite empty enemy enjoy enter entry equal ' +
    'error event every exact exist extra faith false fault field fifth fifty fight final first flash fleet floor fluid focus ' +
    'force forth forty found frame frank fresh front fruit fully funny giant given glass globe going grace grade grand grant ' +
    'grass great green gross group grown guard guess guest guide happy heart heavy horse hotel house human ideal image index ' +
    'inner input issue joint judge juice knife knock known label large laser later laugh layer learn lease least leave legal ' +
    'lemon level light limit local logic loose lower lucky lunch magic major maker march match maybe mayor meant media metal ' +
    'might minor minus mixed model money month moral motor mount mouse mouth movie music never night noise north novel nurse ' +
    'occur ocean offer often order other outer owner paint panel paper party peace phase phone photo piano piece pilot pitch ' +
    'place plain plane plant plate point pound power press price pride prime print prior prize proof proud prove queen quick ' +
    'quiet quite radio raise range rapid ratio reach ready refer right rival river robot rough round route royal rural scale ' +
    'scene scope score sense serve seven shape share sharp sheet shelf shell shift shirt shock shoot short shown sight skill ' +
    'sleep slide small smart smile smoke solid solve sorry sound south space spare speak speed spend split spoke sport staff ' +
    'stage stake stand start state steam steel stick still stock stone stood store storm story strip stuck study stuff style ' +
    'sugar super sweet table taken taste teach teeth thank theft theme there thick thing think third those three threw throw ' +
    'tight tired title today topic total touch tough tower track trade train treat trend trial truck truly trust truth twice ' +
    'under union unity until upper upset urban usual valid value video virus visit vital voice waste watch water wheel where ' +
    'which while white whole woman world worry worse worth would wound write wrong wrote young youth zebra tiger bloom flame ' +
    'frost grape honey jelly koala llama mango melon olive panda peach pearl quilt raven salad snack spice tulip vivid whale ' +
    'yacht cabin camel charm cider coral daisy eagle fable feast flute ghost glove hippo igloo jolly karma latch maple medal ' +
    'noble orbit otter parka plaza polar quest robin scarf shark sheep skate slope snail spark sunny swirl sword tempo toast ' +
    'torch trail tribe vapor waltz witch yeast zesty'
  ).split(' ').filter(w => w.length === 5);

  const cats = {
    Animals: 'elephant giraffe kangaroo dolphin penguin octopus squirrel butterfly crocodile hedgehog flamingo cheetah gorilla hamster leopard lobster panther peacock rabbit raccoon reindeer scorpion seahorse tortoise walrus zebra buffalo camel donkey falcon jaguar koala lizard monkey ostrich parrot pelican salmon spider turtle vulture',
    Food: 'banana cherry coconut grapefruit lemon mango orange papaya pineapple raspberry strawberry watermelon avocado blueberry broccoli carrot cucumber garlic lettuce mushroom onion potato pumpkin spinach tomato sandwich pancake spaghetti burrito chocolate cookie cupcake noodle pretzel waffle',
    Countries: 'argentina australia brazil canada denmark egypt finland france germany greece iceland india ireland italy jamaica japan kenya mexico morocco nepal norway peru poland portugal spain sweden thailand turkey vietnam',
    Sports: 'archery badminton baseball basketball bowling boxing cricket cycling fencing football golf hockey karate rowing rugby skating skiing soccer surfing swimming tennis volleyball wrestling',
    Science: 'algorithm battery computer database electron galaxy gravity internet keyboard laptop magnet molecule network oxygen planet printer processor quantum robot satellite software telescope universe volcano',
    Jobs: 'architect astronaut baker carpenter chef dentist doctor engineer farmer firefighter journalist lawyer mechanic musician nurse pilot plumber scientist teacher waiter'
  };
  const byCat = {};
  for (const k in cats) byCat[k] = cats[k].split(' ');
  return { five, cats: byCat, all: [].concat(...Object.values(byCat)) };
})();
