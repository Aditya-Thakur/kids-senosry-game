// Catalog of all mini-games shown on the home screen.
// Each entry maps to a module in src/games/ that exports mount(container).

export const GAMES = [
  {
    id: 'sensory-swipe',
    name: 'Sensory Swipe',
    icon: '🌈',
    description: 'Swipe to paint sparkly trails of light.',
    category: 'touch',
    load: () => import('../games/sensorySwipe.js'),
  },
  {
    id: 'bubble-pop',
    name: 'Bubble Pop Garden',
    icon: '🫧',
    description: 'Tap floating bubbles to pop gentle surprises.',
    category: 'touch',
    load: () => import('../games/bubblePopGarden.js'),
  },
  {
    id: 'animal-sounds',
    name: 'Animal Sound Tap',
    icon: '🐮',
    description: 'Tap friendly animals to hear them talk.',
    category: 'sound',
    load: () => import('../games/animalSoundTap.js'),
  },
  {
    id: 'shape-feeder',
    name: 'Shape Feeder',
    icon: '🟣',
    description: 'Feed shapes to a happy little monster.',
    category: 'vision',
    load: () => import('../games/shapeFeeder.js'),
  },
  {
    id: 'color-rain',
    name: 'Color Rain',
    icon: '🎨',
    description: 'Catch falling color drops and paint the sky.',
    category: 'vision',
    load: () => import('../games/colorRain.js'),
  },
  {
    id: 'peekaboo',
    name: 'Peekaboo Friends',
    icon: '🐻',
    description: 'Tap to find friends hiding behind clouds.',
    category: 'parent-child',
    load: () => import('../games/peekabooFriends.js'),
  },
];

export function getGame(id) {
  return GAMES.find((g) => g.id === id) || null;
}
