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
  }
]
