// Two deliberately portioned versions. Each row is [ingredient, regular, more filling].
// Weights are in grams, whole produce uses kitchen fractions and spices use a pinch.
export const CAFE_SNACKS = [
  {
    id: 'blueberry-ripple', name: 'Blueberry ripple parfait', taste: 'Sweet', minutes: 10,
    description: 'Thick Greek yogurt, a dark ribbon of blueberries and toasted almond crunch.',
    items: [['greek-yogurt',200,250],['blueberries',90,120],['almonds',20,30],['oats',20,35]],
    steps: ['Simmer the frozen blueberries with a splash of water, following the pack directions, until syrupy. Cool before layering.',
      'Toast the oats and chopped almonds in a dry pan until fragrant. Spoon the yogurt and berries into a glass in alternating layers. Add the crunch just before eating.'],
    prep: '10 min active + cooling', travel: 'Pack the cold jar with an ice pack. Carry the topping separately.'
  },
  {
    id: 'salmon-ribbons', name: 'Smoked salmon & cucumber tartine', taste: 'Savory', minutes: 6,
    description: 'Crisp sourdough, fork-whipped ricotta, folds of salmon and cool cucumber ribbons.',
    items: [['sourdough-bread',75,105],['ricotta',65,90],['smoked-salmon',55,75],['cucumber',60,80]],
    steps: ['Toast the sourdough. Beat the ricotta briefly with a fork, then spread it right to the edges.',
      'Peel the cucumber into ribbons. Fold the salmon loosely over the ricotta and tuck the cucumber between the folds.'],
    travel: 'Pack the salmon, ricotta and cucumber chilled, with the toast separately. Assemble at lunch or snack time.'
  },
  {
    id: 'mandarin-stracciatella', name: 'Mandarin stracciatella cup', taste: 'Sweet', minutes: 5,
    description: 'A spoonable ricotta cream with juicy mandarin and shavings of dark chocolate.',
    items: [['ricotta',100,140],['greek-yogurt',80,110],['mandarin',95,130],['dark-chocolate',15,22]],
    steps: ['Beat the ricotta and yogurt with a fork. Finely chop the chocolate chips, then fold half the shards into the cream.',
      'Spoon into a little glass or bowl. Arrange peeled mandarin segments on one side and scatter the remaining chocolate on the other.'],
    travel: 'Use a small lidded pot and an ice pack.'
  },
  {
    id: 'tomato-melt', name: 'Tomato & blistered mozzarella toast', taste: 'Savory', minutes: 12,
    description: 'A bubbling mozzarella top, ripe tomato at the edges and a crisp sourdough base.',
    items: [['sourdough-bread',80,110],['tomato',90,120],['mozzarella',65,90],['basil',1,1]],
    steps: ['Toast the bread first so the middle stays crisp. Slice the tomato and pat it dry.',
      'Overlap tomato and mozzarella on the toast. Grill under the broiler until the cheese bubbles, watching closely. Finish with a pinch of dried basil.']
  },
  {
    id: 'apple-walnut-toast', name: 'Brown-butter apple & walnut toast', taste: 'Sweet', minutes: 12,
    description: 'Warm cinnamon apple fanned over ricotta, finished with craggy walnut pieces.',
    items: [['sourdough-bread',60,85],['ricotta',65,90],['apple',0.5,1],['butter',5,7],['cinnamon',1,1],['walnuts',15,20]],
    steps: ['Slice the apple thinly. Warm the butter until it smells nutty, then add the apple and cinnamon. Cook until the slices soften.',
      'Toast the bread, spread with ricotta and lay the warm apple slices across it. Break the walnuts over the top.']
  },
  {
    id: 'lemon-feta', name: 'Lemon feta dip with sourdough soldiers', taste: 'Savory', minutes: 7,
    description: 'Tangy fork-mashed feta, lemon zest, hot toast fingers and crisp cucumber spears.',
    items: [['feta-cow',45,60],['greek-yogurt',100,140],['lemon',0.25,0.25],['sourdough-bread',65,90],['cucumber',90,120]],
    steps: ['Mash the feta and yogurt with a fork. Add lemon zest and squeeze in the juice a little at a time.',
      'Toast the sourdough and cut it into fingers. Spoon the dip into a shallow bowl, swirl with the back of the spoon and serve the cucumber spears alongside.'],
    travel: 'Pack the dip and cucumber chilled. Wrap the dry toast separately.'
  },
  {
    id:'strawberry-cheesecake-oats', name:'Strawberry cheesecake overnight oats', taste:'Sweet', minutes:10,
    description:'A cool, creamy jar with ricotta, lemon zest and a bright strawberry layer.',
    items:[['oats',40,55],['greek-yogurt',140,180],['ricotta',50,70],['strawberries',100,130],['lemon',0.25,0.25],['honey',8,12]],
    steps:['Cook the frozen strawberries according to their pack directions, then crush and cool. Stir the oats with yogurt, ricotta, honey and lemon zest. Add a splash of water if very thick.',
      'Layer into a jar with the berries. Refrigerate overnight so the oats soften.'],
    prep:'10 min active + overnight', travel:'Keep the jar chilled with an ice pack.'
  },
  {
    id:'banana-almond-toast', name:'Banana, almond butter & chocolate toast', taste:'Sweet', minutes:5,
    description:'Golden toast, overlapping banana coins and fine dark chocolate shavings.',
    items:[['sourdough-bread',65,90],['almond-butter',25,35],['banana',90,120],['dark-chocolate',10,15],['cinnamon',1,1]],
    steps:['Toast the bread and spread the almond butter while it is still warm. Slice the banana into coins.',
      'Overlap the banana slices on top, shave over the chocolate and finish with a pinch of cinnamon.'],
    travel:'Wrap the toast separately and bring a whole banana to slice when eating.'
  },
  {
    id:'lemon-blueberry-ricotta', name:'Lemon ricotta & blueberry tartine', taste:'Sweet', minutes:10,
    description:'Creamy ricotta, glossy blueberries and curls of lemon on crisp toast.',
    items:[['sourdough-bread',65,90],['ricotta',100,130],['blueberries',80,110],['lemon',0.25,0.25],['honey',8,12]],
    steps:['Simmer the frozen blueberries according to their pack directions until syrupy. Stir honey and lemon zest into the ricotta with a fork.',
      'Toast the bread, spread with the ricotta and spoon the warm blueberry compote across the middle.'],
    travel:'Cool and pack the ricotta and compote with an ice pack. Carry the toast separately.'
  },
  {
    id:'cocoa-hazelnut-pot', name:'Chocolate & toasted hazelnut pot', taste:'Sweet', minutes:7,
    description:'Thick cocoa yogurt with toasted hazelnut pieces and chocolate curls.',
    items:[['greek-yogurt',220,280],['cocoa',10,12],['hazelnuts',20,30],['dark-chocolate',15,20],['honey',8,12]],
    steps:['Toast the hazelnuts in a dry pan, cool slightly and chop. Stir the cocoa and honey into the yogurt until smooth.',
      'Spoon into a small bowl, make a swirl with the spoon and finish with the hazelnuts and shaved chocolate.'],
    travel:'Keep the pot chilled and carry the nuts separately for crunch.'
  },
  {
    id:'strawberry-yogurt-bark', name:'Strawberry & dark chocolate yogurt bark', taste:'Sweet', minutes:12,
    description:'Frozen creamy shards with a strawberry ripple, almond crunch and dark chocolate.',
    items:[['greek-yogurt',220,280],['strawberries',100,130],['almonds',20,30],['dark-chocolate',15,20],['honey',8,12]],
    steps:['Cook the frozen strawberries following the pack directions, crush and cool. Stir honey into the yogurt and spread it about 1 cm thick on baking paper.',
      'Swirl the berries through the yogurt, scatter chopped almonds and drizzle melted chocolate. Freeze until solid, about 3–4 hours, then break into pieces. The listed ingredients make one serving.'],
    prep:'12 min active + 3–4 h freezing'
  },
  {
    id:'apple-crumble-cup', name:'Warm apple crumble & yogurt cup', taste:'Sweet', minutes:15,
    description:'Soft cinnamon apples, thick yogurt and a golden oat-and-walnut crumble.',
    items:[['apple',1,1.5],['greek-yogurt',170,220],['oats',25,35],['walnuts',15,20],['butter',5,7],['cinnamon',1,1]],
    steps:['Dice the apple and soften in a pan with cinnamon and a splash of water. In another pan, toast the oats and chopped walnuts in the butter until fragrant.',
      'Spoon the yogurt into a glass, layer the warm apple over it and top with the crisp crumble.'],
    travel:'Cool the apple first, pack with the yogurt and an ice pack, and keep the crumble separate.'
  },
  {
    id:'avocado-egg-toast', name:'Avocado fan & egg tartine', taste:'Savory', minutes:13,
    description:'Fanned avocado, egg wedges and lemon on a thick slice of golden toast.',
    items:[['sourdough-bread',65,90],['avocado',0.5,0.75],['eggs',1,2],['lemon',0.25,0.25],['black-pepper',1,1]],
    steps:['Hard-boil the eggs, then cool, peel and cut into wedges. Toast the bread.',
      'Slice the avocado and fan it across the toast. Add the egg wedges, a squeeze of lemon and black pepper.'],
    prep:'13 min · 5 if eggs are boiled', travel:'Pack the egg and avocado chilled with lemon. Assemble on the toast when eating.'
  },
  {
    id:'caprese-skewers', name:'Caprese bites & sourdough fingers', taste:'Savory', minutes:8,
    description:'Tomato and mozzarella bites with basil and crisp toast fingers for dipping.',
    items:[['tomato',130,170],['mozzarella',70,95],['sourdough-bread',55,80],['evoo',5,7],['basil',1,1]],
    steps:['Cut the tomato and mozzarella into bite-size pieces. Thread onto small picks or arrange alternately on a plate.',
      'Toast the sourdough and cut into fingers. Spoon the olive oil over the tomato and cheese and finish with a pinch of dried basil.'],
    travel:'Pack the tomato and cheese with an ice pack, keeping the toast dry and separate.'
  },
  {
    id:'cucumber-feta-toast', name:'Cucumber ribbons & whipped feta toast', taste:'Savory', minutes:6,
    description:'Tangy feta cream and delicate cucumber ribbons with a lemon finish.',
    items:[['sourdough-bread',70,100],['feta-cow',45,60],['greek-yogurt',80,110],['cucumber',100,130],['lemon',0.25,0.25],['black-pepper',1,1]],
    steps:['Mash the feta with yogurt, lemon zest and a little lemon juice until spreadable. Toast the bread.',
      'Peel the cucumber into ribbons and pat dry. Spread the feta cream on the toast, fold the ribbons over it and add black pepper.'],
    travel:'Pack the spread and cucumber chilled and carry the toast separately.'
  },
  {
    id:'roasted-pepper-ricotta', name:'Golden pepper & ricotta tartine', taste:'Savory', minutes:25,
    description:'Sweet roasted pepper strips draped over ricotta and crisp sourdough.',
    items:[['sourdough-bread',70,100],['ricotta',100,135],['yellow-pepper',130,170],['evoo',5,7],['basil',1,1]],
    steps:['Cut the pepper into strips, coat with the olive oil and roast at 220°C until tender and lightly browned, about 20 minutes.',
      'Toast the bread and spread with ricotta. Drape the pepper strips over the top and finish with dried basil.'],
    prep:'5 min active + 20 min roasting', travel:'Cool and pack the peppers and ricotta chilled. Assemble on separately packed toast.'
  },
  {
    id:'zucchini-egg-cups', name:'Zucchini & mozzarella egg cups', taste:'Savory', minutes:25,
    description:'Small golden egg cups with a soft cheese center and buttery sourdough alongside.',
    items:[['eggs',2,3],['zucchini',80,110],['mozzarella',35,50],['sourdough-bread',40,60],['butter',5,7]],
    steps:['Heat the oven to 190°C. Grate the zucchini and squeeze out its water. Beat the eggs and fold in the zucchini and diced mozzarella.',
      'Use a little of the butter to grease 2–3 muffin wells. Fill with the mixture and bake until fully set, about 18–22 minutes. Serve all the cups with toast and the remaining butter.'],
    prep:'5 min active + 20 min baking', travel:'Cool the egg cups, then pack with an ice pack. Wrap the toast separately.'
  },
  {
    id:'mushroom-ricotta-toast', name:'Golden mushrooms on ricotta toast', taste:'Savory', minutes:12,
    description:'Buttery, golden-edged mushrooms over cool ricotta and crisp toast.',
    items:[['sourdough-bread',75,105],['ricotta',100,130],['mushrooms',130,170],['butter',7,10],['black-pepper',1,1]],
    steps:['Slice the mushrooms. Cook them in a hot pan with the butter until their liquid evaporates and the edges turn golden. Season with black pepper.',
      'Toast the bread and spread with ricotta. Pile the warm mushrooms on top just before eating.']
  },
  {
    id: "ricotta-crepes",
    name: "Lemon ricotta crêpes",
    taste: "Sweet",
    minutes: 20,
    description: "Thin folded crêpes with lemon ricotta and a spoon of warm blueberries.",
    items: [["flour", 40, 55], ["eggs", 1, 1], ["whole-milk", 90, 110], ["ricotta", 60, 85], ["blueberries", 60, 80], ["lemon", 0.25, 0.25], ["butter", 5, 7]],
    steps: [
      "Whisk flour, egg and milk into a smooth batter. Rest for 5 minutes. Cook thin crêpes in a pan with the butter, turning once.",
      "Simmer the frozen blueberries following the pack directions. Mix ricotta with lemon zest, fill the crêpes and fold into quarters. Spoon the berries alongside."
    ],
    prep: "20 min",
  },
  {
    id: "strawberry-chia",
    name: "Strawberry coconut chia glass",
    taste: "Sweet",
    minutes: 10,
    description: "A pale coconut chia pudding with ruby strawberry compote and toasted coconut.",
    items: [["chia", 25, 32], ["coconut-milk", 70, 90], ["greek-yogurt", 120, 150], ["strawberries", 100, 130], ["shredded-coconut", 8, 12], ["honey", 8, 10]],
    steps: [
      "Stir chia, coconut milk, yogurt and honey thoroughly. Stir again after 10 minutes, then chill for at least 3 hours.",
      "Cook the frozen strawberries according to the pack directions, crush and cool. Layer over the pudding and finish with dry-toasted coconut."
    ],
    prep: "10 min active + 3 h chilling",
    travel: "Carry chilled with an ice pack; keep the coconut topping separate.",
  },
  {
    id: "mandarin-baked-oats",
    name: "Mandarin chocolate baked oat ramekin",
    taste: "Sweet",
    minutes: 25,
    description: "A warm little oat cake with dark chocolate pockets and fresh mandarin.",
    items: [["oats", 45, 60], ["eggs", 1, 1], ["greek-yogurt", 100, 140], ["dark-chocolate", 15, 20], ["mandarin", 80, 110], ["honey", 8, 10]],
    steps: [
      "Heat the oven to 180°C. Grind the oats into flour, then stir in the egg, yogurt and honey. Fold in chopped chocolate.",
      "Spoon into an ovenproof ramekin and bake for 20–25 minutes until the center is fully set. Top with peeled mandarin segments."
    ],
    prep: "5 min active + 25 min baking",
  },
  {
    id: "lemon-cheesecake",
    name: "Little lemon ricotta cheesecake",
    taste: "Sweet",
    minutes: 30,
    description: "A softly set individual cheesecake with lemon zest and blueberry compote.",
    items: [["ricotta", 120, 160], ["greek-yogurt", 80, 110], ["eggs", 1, 1], ["honey", 12, 16], ["lemon", 0.25, 0.25], ["blueberries", 70, 100]],
    steps: [
      "Heat the oven to 165°C. Whisk ricotta, yogurt, egg, honey and lemon zest until smooth. Pour into a small ovenproof ramekin.",
      "Bake for 25–35 minutes until fully set. Cool, then refrigerate. Cook the frozen blueberries following their pack directions and cool before spooning over the cheesecake."
    ],
    prep: "10 min active + baking and cooling",
    travel: "Pack the chilled ramekin with an ice pack.",
  },
  {
    id: "apple-rose-tartlet",
    name: "Apple rose & almond tartlet",
    taste: "Sweet",
    minutes: 40,
    description: "A little free-form tart with an apple-slice rose and almond butter filling.",
    items: [["flour", 40, 55], ["butter", 12, 16], ["greek-yogurt", 25, 35], ["apple", 0.5, 1], ["almond-butter", 15, 20], ["cinnamon", 1, 1], ["honey", 6, 8]],
    steps: [
      "Rub cold butter into the flour. Stir in yogurt to make a dough, adding a teaspoon of water if needed. Chill for 10 minutes, then roll into a small circle.",
      "Heat the oven to 190°C. Slice the apple very thinly and soften briefly in a pan with water. Spread almond butter on the dough, overlap the apple slices in a spiral and fold the edge inward. Brush with honey, dust with cinnamon and bake 25–30 minutes until golden."
    ],
    prep: "15 min active + chilling and baking",
  },
  {
    id: "chocolate-almond-truffles",
    name: "Cocoa almond truffles & yogurt",
    taste: "Sweet",
    minutes: 12,
    description: "Small cocoa-dusted almond bites with a thick vanilla yogurt dip.",
    items: [["almond-butter", 25, 35], ["oats", 25, 35], ["cocoa", 8, 10], ["honey", 12, 16], ["greek-yogurt", 140, 180], ["vanilla", 1, 1]],
    steps: [
      "Grind the oats finely. Mix with almond butter, honey and most of the cocoa, adding a teaspoon of water if needed. Roll into 3–4 small balls and dust with the remaining cocoa.",
      "Stir vanilla into the yogurt and serve in a small bowl alongside the truffles. Chill the bites for a firmer texture."
    ],
    prep: "12 min",
    travel: "Pack bites and yogurt separately with an ice pack.",
  },
  {
    id: "salmon-tea-sandwiches",
    name: "Salmon & cucumber tea fingers",
    taste: "Savory",
    minutes: 8,
    description: "Neat little sourdough fingers with salmon, lemon ricotta and fine cucumber.",
    items: [["sourdough-bread", 75, 100], ["ricotta", 65, 85], ["smoked-salmon", 55, 75], ["cucumber", 70, 100], ["lemon", 0.25, 0.25]],
    steps: [
      "Slice the bread thinly. Mix the ricotta with lemon zest. Slice cucumber very thinly and pat it dry.",
      "Spread the ricotta, layer cucumber and salmon, close the sandwiches and cut into neat fingers. Use all the weighed bread, including any offcuts."
    ],
    prep: "8 min",
    travel: "Keep chilled in a small box with an ice pack.",
  },
  {
    id: "zucchini-galette",
    name: "Zucchini ribbon & ricotta galette",
    taste: "Savory",
    minutes: 40,
    description: "A crisp free-form pastry with lemon ricotta and folded zucchini ribbons.",
    items: [["flour", 45, 60], ["butter", 12, 16], ["greek-yogurt", 30, 40], ["ricotta", 65, 85], ["zucchini", 100, 140], ["lemon", 0.25, 0.25], ["basil", 1, 1]],
    steps: [
      "Rub cold butter into the flour. Stir in yogurt and a little water to form dough. Chill for 10 minutes. Heat the oven to 200°C.",
      "Roll into a small circle. Spread ricotta mixed with lemon zest and basil over the center. Add thin zucchini ribbons, fold in the edges and bake for 25–30 minutes until the base is crisp and the zucchini is tender."
    ],
    prep: "15 min active + chilling and baking",
  },
  {
    id: "feta-pepper-pancakes",
    name: "Golden feta & pepper pancakes",
    taste: "Savory",
    minutes: 18,
    description: "Three little savory pancakes with sweet pepper, feta and lemon yogurt.",
    items: [["flour", 40, 55], ["eggs", 1, 1], ["whole-milk", 60, 80], ["feta-cow", 35, 45], ["yellow-pepper", 80, 110], ["greek-yogurt", 70, 100], ["butter", 5, 7], ["lemon", 0.25, 0.25]],
    steps: [
      "Dice the pepper finely and soften in a pan with a little water. Whisk flour, egg and milk, then fold in the pepper and crumbled feta.",
      "Cook small pancakes in the butter, turning until golden and fully cooked. Mix yogurt with lemon zest and serve alongside."
    ],
    prep: "18 min",
    travel: "Cool the pancakes and pack with the yogurt and an ice pack.",
  },
  {
    id: "cheddar-crackers",
    name: "Cheddar shortbread & tomato ricotta",
    taste: "Savory",
    minutes: 30,
    description: "Little golden cheese biscuits with cool ricotta and fresh tomato.",
    items: [["flour", 40, 55], ["cheddar", 35, 45], ["butter", 12, 16], ["ricotta", 55, 75], ["tomato", 100, 140], ["black-pepper", 1, 1]],
    steps: [
      "Heat the oven to 180°C. Rub butter into flour, add finely grated cheddar and a little cold water to bind. Roll thinly, cut into small squares and prick with a fork.",
      "Bake 15–20 minutes until golden and crisp. Serve all the biscuits with ricotta, chopped tomato and black pepper."
    ],
    prep: "10 min active + 20 min baking",
    travel: "Keep the biscuits dry; pack ricotta and tomato separately with an ice pack.",
  },
  {
    id: "egg-ricotta-tartine",
    name: "Soft scrambled egg & ricotta tartine",
    taste: "Savory",
    minutes: 10,
    description: "Soft folds of egg over lemon ricotta, with warm sourdough and tomato.",
    items: [["sourdough-bread", 65, 90], ["eggs", 2, 3], ["ricotta", 50, 70], ["butter", 5, 7], ["tomato", 80, 110], ["lemon", 0.25, 0.25]],
    steps: [
      "Toast the sourdough. Mix ricotta with a little lemon zest and spread on the toast.",
      "Beat the eggs. Melt the butter over low heat and gently fold the eggs with a spatula until fully set but still soft. Spoon over the toast and serve with sliced tomato."
    ],
    prep: "10 min",
  },
  {
    id: "warm-caprese-peppers",
    name: "Roasted pepper caprese boats",
    taste: "Savory",
    minutes: 30,
    description: "Golden pepper halves filled with tomato and mozzarella, with crisp toast.",
    items: [["yellow-pepper", 160, 220], ["mozzarella", 70, 95], ["tomato", 100, 140], ["sourdough-bread", 50, 70], ["evoo", 5, 7], ["basil", 1, 1]],
    steps: [
      "Heat the oven to 200°C. Halve and deseed the pepper, brush with olive oil and roast cut-side up for 15 minutes.",
      "Fill with chopped tomato and mozzarella, add dried basil and roast another 10–15 minutes until bubbling. Serve with toasted sourdough."
    ],
    prep: "10 min active + 25 min roasting",
  },
  {
    id: "mini-focaccia",
    collection: "Spanish & Italian",
    name: "Rosemary focaccia with mozzarella & roasted tomato",
    taste: "Savory",
    minutes: 30,
    description: "A dimpled mini focaccia with rosemary, bubbling mozzarella and roasted tomato.",
    items: [["flour", 60, 80], ["yeast", 1, 1], ["evoo", 8, 10], ["rosemary", 1, 1], ["mozzarella", 40, 55], ["tomato", 80, 110], ["salt", 1, 1]],
    steps: [
      "Mix flour, a pinch of salt and 1 g dry yeast with water equal to three quarters of the flour weight. Fold in half the olive oil, cover and leave somewhere warm until puffy, about 90–120 minutes.",
      "Oil a small baking dish with the remaining oil. Stretch the dough into it and rest for 30 minutes. Heat the oven to 220°C. Dimple the dough, add rosemary and sliced tomato, then bake for about 18 minutes. Add mozzarella and bake another 5–7 minutes until the base is cooked and the cheese bubbles."
    ],
    prep: "15 min active + 2–3 h proving + baking",
    travel: "Cool before packing. Keep chilled with an ice pack and warm again if possible.",
  },
  {
    id: "tortilla-bocadillo",
    collection: "Spanish & Italian",
    name: "Little bocadillo de tortilla",
    taste: "Savory",
    minutes: 25,
    description: "A golden potato tortilla tucked into crisp sourdough, just as it is.",
    items: [["sourdough-bread", 60, 80], ["potato", 110, 150], ["eggs", 1, 2], ["evoo", 7, 10], ["salt", 1, 1]],
    steps: [
      "Slice the potato finely. Soften in a small covered pan with the olive oil and a splash of water, stirring occasionally, until fully tender. Let excess water evaporate.",
      "Beat the egg and fold in the potato. Cook in a small nonstick pan over low heat, turning carefully, until fully set. Split the bread and tuck the tortilla inside."
    ],
    prep: "25 min",
    travel: "Cool the tortilla, then pack the sandwich with an ice pack.",
  },
  {
    id: "pan-tomate-ricotta",
    collection: "Spanish & Italian",
    name: "Pan con tomate, ricotta & ham",
    taste: "Savory",
    minutes: 7,
    description: "Crisp bread rubbed with juicy tomato, topped with ricotta and soft folds of ham.",
    items: [["sourdough-bread", 70, 95], ["tomato", 100, 130], ["ricotta", 65, 90], ["cooked-ham", 45, 65], ["evoo", 5, 7]],
    steps: [
      "Toast the bread. Grate the tomato and spread the pulp over the toast. Drizzle with the olive oil.",
      "Add small spoonfuls of ricotta and loose folds of cooked ham. Serve immediately while the bread is crisp."
    ],
    prep: "7 min",
    travel: "Pack the ham, ricotta and tomato chilled. Carry dry toast separately and assemble when eating.",
  },
  {
    id: "zucchini-piadina",
    collection: "Spanish & Italian",
    name: "Zucchini, mozzarella & lemon piadina",
    taste: "Savory",
    minutes: 22,
    description: "A folded flatbread with golden zucchini, melted mozzarella and lemon zest.",
    items: [["flour", 55, 75], ["evoo", 7, 9], ["zucchini", 100, 140], ["mozzarella", 55, 75], ["lemon", 0.25, 0.25], ["salt", 1, 1]],
    steps: [
      "Mix flour with a pinch of salt, half the oil and enough warm water to make a soft dough. Knead briefly and rest covered for 10 minutes. Slice the zucchini thinly and cook with the remaining oil until golden.",
      "Roll the dough thinly. Cook in a hot dry pan, turning until both sides have brown spots and no raw dough remains. Add zucchini, mozzarella and lemon zest, fold in half and warm gently until the cheese melts."
    ],
    prep: "22 min",
    travel: "Cool, pack chilled with an ice pack and reheat if possible.",
  },
  {
    id: "roasted-grape-crostini",
    collection: "Spanish & Italian",
    name: "Roasted grape, ricotta & walnut crostini",
    taste: "Savory",
    minutes: 25,
    description: "Jammy roasted grapes over creamy ricotta, with toasted walnuts on sourdough.",
    items: [["sourdough-bread", 65, 90], ["grapes", 100, 140], ["ricotta", 85, 115], ["walnuts", 15, 20], ["rosemary", 1, 1]],
    steps: [
      "Heat the oven to 200°C. Put the washed grapes in a small baking dish with rosemary and a teaspoon of water. Roast for 15–20 minutes until softened and juicy.",
      "Toast the bread and walnuts separately. Spread the ricotta over the toast, spoon over the grapes and scatter the chopped walnuts."
    ],
    prep: "10 min active + 20 min roasting",
    travel: "Cool the grapes and carry them and the ricotta chilled. Keep bread and walnuts separate.",
  },
  {
    id: "mini-vegetable-coca",
    collection: "Spanish & Italian",
    name: "Mini coca de verduras",
    taste: "Savory",
    minutes: 35,
    description: "A thin crisp olive-oil base with roasted golden pepper, zucchini and tomato.",
    items: [["flour", 55, 75], ["evoo", 10, 13], ["yellow-pepper", 80, 110], ["zucchini", 70, 100], ["tomato", 60, 90], ["rosemary", 1, 1], ["salt", 1, 1]],
    steps: [
      "Heat the oven to 210°C. Mix flour with a pinch of salt, half the olive oil and enough water to form a firm dough. Rest covered for 10 minutes. Slice the vegetables thinly and pat the tomato dry.",
      "Roll the dough very thinly on baking paper. Arrange the vegetables over it, brush with the remaining oil and sprinkle with rosemary. Bake 25–30 minutes until the base is crisp and the vegetables are tender."
    ],
    prep: "15 min active + 25–30 min baking",
  },
  {
    id: "tiramisu-cup",
    collection: "Spanish & Italian",
    name: "Little tiramisù cream cup",
    taste: "Sweet",
    minutes: 12,
    description: "Coffee-soaked toast layers, mascarpone yogurt cream and a fine cocoa veil.",
    items: [["sourdough-bread", 40, 55], ["mascarpone", 35, 45], ["greek-yogurt", 140, 180], ["espresso", 1, 1], ["cocoa", 5, 7], ["honey", 8, 10]],
    steps: [
      "Toast the bread lightly, cool and cut into small pieces. Prepare one small espresso and let it cool. Stir mascarpone, yogurt and honey into a smooth cream.",
      "Dip the bread briefly in the espresso. Layer with the cream in a small glass, finish with sifted cocoa and chill for at least an hour."
    ],
    prep: "12 min active + 1 h chilling",
    travel: "Carry chilled with an ice pack.",
  },
  {
    id: "orange-olive-oil-cake",
    collection: "Spanish & Italian",
    name: "Orange, almond & olive-oil cakelet",
    taste: "Sweet",
    minutes: 30,
    description: "An individual golden cake with orange zest, almonds and olive oil.",
    items: [["flour", 30, 40], ["almonds", 15, 20], ["eggs", 1, 1], ["greek-yogurt", 65, 85], ["orange", 60, 80], ["evoo", 7, 9], ["honey", 12, 16]],
    steps: [
      "Heat the oven to 175°C. Grind the almonds finely. Separate the egg. Whisk the yolk with honey, oil, yogurt, orange zest and the juice squeezed from the weighed orange flesh. Fold in flour and ground almonds.",
      "Beat the egg white to soft peaks and fold it through gently. Pour into a small ovenproof dish and bake for 20–25 minutes until set and a skewer comes out clean."
    ],
    prep: "10 min active + 25 min baking",
  },
  {
    id: "baked-ricotta-strawberry",
    collection: "Spanish & Italian",
    name: "Lemon baked ricotta with strawberries",
    taste: "Sweet",
    minutes: 30,
    description: "A warm individual ricotta custard with glossy strawberry compote.",
    items: [["ricotta", 120, 155], ["greek-yogurt", 80, 110], ["eggs", 1, 1], ["lemon", 0.25, 0.25], ["honey", 10, 14], ["strawberries", 100, 130]],
    steps: [
      "Heat the oven to 170°C. Beat ricotta, yogurt, egg, honey and lemon zest until smooth. Spoon into an ovenproof ramekin.",
      "Bake for 25–30 minutes until fully set. Cook the frozen strawberries according to their pack directions and spoon over the ricotta. Serve warm or cool and refrigerate."
    ],
    prep: "10 min active + 30 min baking",
    travel: "Cool and carry chilled with an ice pack.",
  },
  {
    id: "torrija-classic",
    collection: "Spanish & Italian",
    name: "María’s cinnamon & orange torrija",
    taste: "Sweet",
    minutes: 20,
    description: "A thick golden torrija with orange-infused milk, cinnamon and a little honey.",
    items: [["sourdough-bread", 65, 90], ["whole-milk", 90, 120], ["eggs", 1, 1], ["orange", 50, 70], ["cinnamon", 1, 1], ["butter", 6, 8], ["honey", 8, 12], ["greek-yogurt", 70, 100]],
    steps: [
      "Warm the milk with cinnamon and zest from the orange, then cool slightly. Put thick, slightly stale bread in a small dish and slowly spoon over all the milk. Give it time to absorb.",
      "Beat the egg and coat the soaked bread, using all of it. Cook in the butter over medium-low heat, turning gently, until golden outside and fully cooked inside. Drizzle with honey, dust with cinnamon and serve with yogurt and the remaining orange flesh."
    ],
    prep: "20 min",
  },
  {
    id: "torrija-berries",
    collection: "Spanish & Italian",
    name: "Torrija with warm berries & yogurt",
    taste: "Sweet",
    minutes: 22,
    description: "A custardy golden torrija with thick yogurt and warm blueberry compote.",
    items: [["sourdough-bread", 65, 90], ["whole-milk", 90, 120], ["eggs", 1, 1], ["cinnamon", 1, 1], ["butter", 6, 8], ["honey", 8, 12], ["greek-yogurt", 80, 110], ["blueberries", 70, 100]],
    steps: [
      "Cook the frozen blueberries with a splash of water according to the pack directions. Warm the milk with cinnamon, then cool slightly. Slowly spoon all the milk over thick, slightly stale bread and let it absorb.",
      "Beat the egg and coat the bread with all of it. Cook in the butter over medium-low heat until golden on both sides and fully cooked inside. Serve with yogurt, blueberry compote and a drizzle of honey."
    ],
    prep: "22 min",
  },
]
