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
  }
]
