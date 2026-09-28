// ─── Cenas de cita (Date night) ─────────────────────────────────────────────
// Cena del sábado para los dos, en doble ración (la otra mitad, el domingo:
// cena o comida). Aquí el presupuesto no manda y la carne roja en la cena
// está permitida. Raciones por persona; la app escala la base (pasta, arroz,
// patata…) a las kcal de cada uno como en el resto de comidas.
// `reheat`: 'good' = aguanta y está igual o mejor al día siguiente;
//           'fresh' = mejor hacer la segunda mitad el domingo.
// Los postres van en el hueco de la merienda (sábado y domingo).
// No entran en la semana inteligente de lunes a viernes (`date: true`).

const D = (name, items, extra = {}) => ({ name, meals: ['cena', 'comida'], items, date: true, ...extra })
const S = (name, items, extra = {}) => ({ name, meals: ['merienda'], items, date: true, dessert: true, ...extra })
const g = grams => ({ grams }), u = units => ({ units }), ml = v => ({ ml: v }), pinch = {}

export const DATE_DISHES = {
  'date-pepperoni-pizza': D('Homemade pepperoni pizza', [
    { k: 'flour', p: g(150) }, { k: 'yeast', p: pinch }, { k: 'evoo', p: ml(10) }, { k: 'passata', p: ml(80) },
    { k: 'mozzarella', p: g(100) }, { k: 'pepperoni', p: g(40) }, { k: 'oregano', p: pinch },
  ], { reheat: 'good', note: 'Dough the afternoon before (or 2 h before). Bake 250 °C, 10–12 min.' }),
  'date-spinach-ravioli-butter-sage': D('Spinach & cheese ravioli, butter, sage & parmesan', [
    { k: 'ravioli-spinach', p: g(300) }, { k: 'butter', p: g(15) }, { k: 'parmesan', p: g(15) }, { k: 'sage', p: pinch }, { k: 'black-pepper', p: pinch },
  ], { reheat: 'good', note: 'Brown the butter with the sage, toss the ravioli in it.' }),
  'date-burrata-ravioli-lemon': D('Burrata & lemon ravioli, brown butter & parmesan', [
    { k: 'ravioli-burrata', p: g(300) }, { k: 'butter', p: g(15) }, { k: 'parmesan', p: g(10) }, { k: 'lemon', p: u(0.25) }, { k: 'black-pepper', p: pinch },
  ], { reheat: 'good', note: 'A little lemon zest on top at the end.' }),
  'date-striploin-pepper-sauce': D('Striploin steak, pepper cream sauce, potatoes & asparagus', [
    { k: 'striploin', p: g(285) }, { k: 'potato', p: g(300) }, { k: 'asparagus', p: g(120) }, { k: 'butter', p: g(10) },
    { k: 'heavy-cream', p: ml(40) }, { k: 'black-pepper', p: pinch }, { k: 'garlic', p: pinch }, { k: 'evoo', p: ml(10) },
  ], { reheat: 'fresh', note: 'Best fresh: keep two steaks raw in the fridge and cook them on Sunday.' }),
  'date-carbonara': D('Spaghetti carbonara', [
    { k: 'pasta-dimartino', p: g(125) }, { k: 'eggs', p: u(1.5) }, { k: 'bacon', p: g(50) }, { k: 'parmesan', p: g(25) }, { k: 'black-pepper', p: pinch },
  ], { reheat: 'fresh', note: 'Dries out when reheated: make the second half fresh on Sunday (10 min).' }),
  'date-beef-lasagna': D('Beef lasagna', [
    { k: 'lasagna-sheets', p: g(90) }, { k: 'ground-beef', p: g(150) }, { k: 'passata', p: ml(120) }, { k: 'yellow-onion', p: g(40) },
    { k: 'carrot', p: g(40) }, { k: 'whole-milk', p: g(100) }, { k: 'butter', p: g(10) }, { k: 'flour', p: g(10) },
    { k: 'mozzarella', p: g(50) }, { k: 'parmesan', p: g(15) }, { k: 'evoo', p: ml(10) },
  ], { reheat: 'good', note: 'Even better the next day. One tray for Saturday and Sunday.' }),
  'date-zucchini-lasagna': D('Zucchini lasagna (no pasta)', [
    { k: 'zucchini-a1', p: g(250) }, { k: 'ground-beef', p: g(150) }, { k: 'passata', p: ml(120) }, { k: 'yellow-onion', p: g(40) },
    { k: 'ricotta', p: g(60) }, { k: 'mozzarella', p: g(60) }, { k: 'parmesan', p: g(15) }, { k: 'evoo', p: ml(10) },
  ], { reheat: 'good', note: 'Salt the zucchini slices 10 min and pat dry so it isn’t watery.' }),
  'date-garlic-shrimp-pasta': D('Garlic shrimp pasta with white wine', [
    { k: 'pasta-dimartino', p: g(125) }, { k: 'shrimp', p: g(150) }, { k: 'garlic', p: pinch }, { k: 'butter', p: g(10) },
    { k: 'evoo', p: ml(15) }, { k: 'white-wine', p: ml(40) }, { k: 'fresh-parsley', p: g(5) }, { k: 'lemon', p: u(0.25) },
  ], { reheat: 'fresh', note: 'Shrimp gets rubbery reheated: cook the second half on Sunday (8 min).' }),
  'date-lemon-butter-salmon': D('Lemon butter salmon, rice & asparagus', [
    { k: 'salmon-fillet', p: g(180) }, { k: 'rice', p: g(80) }, { k: 'asparagus', p: g(120) }, { k: 'butter', p: g(15) },
    { k: 'lemon', p: u(0.25) }, { k: 'garlic', p: pinch },
  ], { reheat: 'fresh', note: 'Bake the second fillet on Sunday (12 min); the rice keeps.' }),
  'date-chicken-mushroom-risotto': D('Chicken & mushroom risotto with parmesan', [
    { k: 'arborio', p: g(100) }, { k: 'chicken-breast', p: g(130) }, { k: 'mushrooms', p: g(150) }, { k: 'parmesan', p: g(25) },
    { k: 'butter', p: g(20) }, { k: 'white-wine', p: ml(50) }, { k: 'yellow-onion', p: g(40) },
  ], { reheat: 'good', note: 'Reheat with a splash of water or broth so it stays creamy.' }),
  'date-gourmet-burger': D('Gourmet burger, cheddar & bacon, with potato wedges', [
    { k: 'ground-beef', p: g(180) }, { k: 'brioche-buns', p: u(1) }, { k: 'cheddar', p: g(25) }, { k: 'bacon', p: g(20) },
    { k: 'lettuce', p: {} }, { k: 'tomato', p: g(50) }, { k: 'potato', p: g(200) }, { k: 'evoo', p: ml(10) },
  ], { reheat: 'fresh', note: 'Shape all four patties on Saturday; cook two on Sunday.' }),
  'date-gnocchi-pesto-chicken': D('Gnocchi al pesto with chicken & tomatoes', [
    { k: 'gnocchi', p: g(300) }, { k: 'pesto', p: g(40) }, { k: 'chicken-breast', p: g(120) }, { k: 'tomato', p: g(100) }, { k: 'parmesan', p: g(15) },
  ], { reheat: 'good', note: 'Pan-fry the gnocchi until golden before adding the pesto.' }),
}

export const DATE_DESSERTS = {
  'dessert-tiramisu': S('Tiramisù', [
    { k: 'mascarpone', p: g(60) }, { k: 'ladyfingers', p: g(25) }, { k: 'eggs', p: u(0.5) }, { k: 'sugar', p: g(15) },
    { k: 'espresso', p: pinch }, { k: 'cocoa', p: g(3) },
  ], { note: 'Make it Friday night or Saturday morning: it needs 4+ h in the fridge.' }),
  'dessert-cheesecake': S('Cheesecake', [
    { k: 'cream-cheese', p: g(70) }, { k: 'digestive-biscuits', p: g(25) }, { k: 'butter', p: g(8) }, { k: 'sugar', p: g(15) },
    { k: 'eggs', p: u(0.4) }, { k: 'heavy-cream', p: ml(15) },
  ], { note: 'Bake in the morning; it needs to set in the fridge.' }),
  'dessert-strawberries-chocolate': S('Strawberries with melted dark chocolate', [
    { k: 'strawberries', p: g(150) }, { k: 'dark-chocolate', p: g(30) },
  ], { note: '5 minutes. The lightest one.' }),
  'dessert-chocolate-lava-cake': S('Chocolate lava cake', [
    { k: 'dark-chocolate', p: g(40) }, { k: 'butter', p: g(20) }, { k: 'eggs', p: u(1) }, { k: 'sugar', p: g(15) }, { k: 'flour', p: g(10) },
  ], { note: 'Prepare the ramekins ahead; bake 10–12 min right before eating.' }),
}
