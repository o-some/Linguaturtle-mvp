export const assets = Object.freeze({
  characters: {
    tula: {
      fallback: '🐢',
      poses: {
        waving: 'assets/creative/tula_waving.webp',
        profile: 'assets/creative/tula_profile.webp',
        neutral: 'assets/creative/tula_neutral_front.webp',
        happy: 'assets/creative/tula_happy.webp',
        thinking: 'assets/creative/tula_thinking.webp',
        listening: 'assets/creative/tula_listening.webp'
      }
    }
  },
  backgrounds: {
    home: {
      tropicalBay: 'assets/creative/home_tropical_bay.webp',
      interior: 'assets/creative/home_tula_house_interior.webp'
    },
    worlds: {
      garden: 'assets/creative/world_sun_bay.webp',
      animals: 'assets/creative/world_jungle_trail.webp'
    }
  },
  island: {
    overview: 'assets/creative/map_turtle_island_overview.webp'
  },
  cards: {
    neutralBack: 'assets/creative/card_back_neutral.webp'
  }
});

export function assetOrFallback(path, fallback = '') {
  return path || fallback;
}
