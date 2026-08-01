export const assets = Object.freeze({
  characters: {
    tula: {
      fallback: '🐢',
      poses: {
        welcome: './assets/illustrations/tula/welcome.webp',
        learning: './assets/illustrations/tula/learning.webp',
        celebrating: './assets/illustrations/tula/celebrating.webp',
        thinking: './assets/illustrations/tula/thinking.webp',
        sleeping: './assets/illustrations/tula/sleeping.webp'
      }
    }
  },
  island: {
    overview: './assets/illustrations/island/turtle-island.webp',
    library: './assets/illustrations/island/library.webp',
    forest: './assets/illustrations/island/forest.webp',
    garden: './assets/illustrations/island/garden.webp',
    harbour: './assets/illustrations/island/harbour.webp',
    boutique: './assets/illustrations/island/boutique.webp',
    home: './assets/illustrations/island/home.webp',
    castle: './assets/illustrations/island/castle.webp'
  },
  rewards: {
    shell: './assets/illustrations/rewards/shell.webp',
    chest: './assets/illustrations/rewards/chest.webp',
    star: './assets/illustrations/rewards/star.webp'
  }
});

export function assetOrFallback(path, fallback = '') {
  return path || fallback;
}
