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
        listening: 'assets/creative/tula_listening.webp',
        speaking: 'assets/creative/tula_speaking.webp',
        surprised: 'assets/creative/tula_surprised.webp',
        sleeping: 'assets/creative/tula_sleeping.webp',
        celebrating: 'assets/creative/tula_celebrating.webp'
      }
    }
  },
  backgrounds: {
    home: {
      cinematic: 'assets/creative-v2/home_cinematic_island.webp',
      tropicalBay: 'assets/creative/home_tropical_bay.webp',
      interior: 'assets/creative/home_tula_house_interior.webp'
    },
    worlds: {
      garden: 'assets/creative/world_garden.webp',
      library: 'assets/creative/world_library.webp',
      animals: 'assets/creative/world_jungle_trail.webp',
      home: 'assets/creative/world_sun_bay.webp',
      family: 'assets/creative/world_coral_reef.webp',
      body: 'assets/creative/world_crystal_cove.webp',
      travel: 'assets/creative/world_desert_oasis.webp',
      actions: 'assets/creative/world_ice_peak.webp',
      harbor: 'assets/creative/world_harbor.webp',
      castle: 'assets/creative/world_castle.webp'
    }
  },
  island: {
    overview: 'assets/creative/map_turtle_island_overview.webp'
  },
  cards: {
    neutralBack: 'assets/creative/card_back_neutral.webp',
    modes: {
      explore: 'assets/creative/mode_words_discover.webp',
      listening: 'assets/creative/mode_listening_adventure.webp',
      sentence: 'assets/creative/mode_sentence_workshop.webp',
      speaking: 'assets/creative/mode_speech_trainer.webp',
      stories: 'assets/creative/mode_stories.webp',
      memory: 'assets/creative/mode_memory.webp',
      speed: 'assets/creative/mode_golden_minute.webp'
    }
  },
  rewards: {
    currencyShell: 'assets/creative/reward_shell_pearl.webp',
    xpStar: 'assets/creative/reward_star_xp.webp',
    streak: 'assets/creative/reward_streak_flame.webp',
    chests: {
      bronze: 'assets/creative/reward_chest_bronze.webp',
      silver: 'assets/creative/reward_chest_silver.webp',
      gold: 'assets/creative/reward_chest_gold.webp',
      jewel: 'assets/creative/reward_chest_jewel.webp'
    }
  }
});

export function assetOrFallback(path, fallback = '') {
  return path || fallback;
}
