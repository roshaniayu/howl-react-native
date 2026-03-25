export type AmbienceId = 1 | 2 | 3;

export type AmbienceOption = {
  id: AmbienceId;
  title: string;
  bgImage: number;
  charImage: number;
  sound: number;
  visuals: {
    home: {
      backgroundBottom: number;
      backgroundHeight: `${number}%`;
      characterBottom: number;
      characterHeight: `${number}%`;
    };
    setAmbience: {
      backgroundHeight: `${number}%`;
      backgroundBottom: number;
      characterHeight: `${number}%`;
      characterBottom: number;
      characterTranslateX: number;
    };
  };
  floatAnimation: {
    sceneryLift: number;
    sceneryUpDuration: number;
    sceneryDownDuration: number;
    characterLift: number;
    characterUpDuration: number;
    characterDownDuration: number;
  };
};

const ambience1Bg = require('@/assets/ambiences/backgrounds/ambience-1-bg.png');
const ambience1Char = require('@/assets/ambiences/characters/ambience-1-char.png');
const ambience2Bg = require('@/assets/ambiences/backgrounds/ambience-2-bg.png');
const ambience2Char = require('@/assets/ambiences/characters/ambience-2-char.png');
const ambience3Bg = require('@/assets/ambiences/backgrounds/ambience-3-bg.png');
const ambience3Char = require('@/assets/ambiences/characters/ambience-3-char.png');

export const AMBIENCE_OPTIONS: AmbienceOption[] = [
  {
    id: 1,
    title: 'Merry Go Round of Life',
    bgImage: ambience1Bg,
    charImage: ambience1Char,
    sound: require('@/assets/audio/ambience-1-sound.m4a'),
    visuals: {
      home: {
        backgroundBottom: -240,
        backgroundHeight: '70%',
        characterBottom: -260,
        characterHeight: '60%',
      },
      setAmbience: {
        backgroundHeight: '100%',
        backgroundBottom: -320,
        characterHeight: '100%',
        characterBottom: -350,
        characterTranslateX: 0,
      },
    },
    floatAnimation: {
      sceneryLift: 110,
      sceneryUpDuration: 5000,
      sceneryDownDuration: 4000,
      characterLift: 100,
      characterUpDuration: 4400,
      characterDownDuration: 3600,
    },
  },
  {
    id: 2,
    title: 'Path of the Wind',
    bgImage: ambience2Bg,
    charImage: ambience2Char,
    sound: require('@/assets/audio/ambience-2-sound.m4a'),
    visuals: {
      home: {
        backgroundBottom: 0,
        backgroundHeight: '68%',
        characterBottom: -160,
        characterHeight: '58%',
      },
      setAmbience: {
        backgroundHeight: '100%',
        backgroundBottom: -10,
        characterHeight: '100%',
        characterBottom: -260,
        characterTranslateX: 0,
      },
    },
    floatAnimation: {
      sceneryLift: 110,
      sceneryUpDuration: 6000,
      sceneryDownDuration: 5000,
      characterLift: 100,
      characterUpDuration: 5400,
      characterDownDuration: 4600,
    },
  },
  {
    id: 3,
    title: 'The Name of Life',
    bgImage: ambience3Bg,
    charImage: ambience3Char,
    sound: require('@/assets/audio/ambience-3-sound.m4a'),
    visuals: {
      home: {
        backgroundBottom: -160,
        backgroundHeight: '72%',
        characterBottom: -120,
        characterHeight: '62%',
      },
      setAmbience: {
        backgroundHeight: '100%',
        backgroundBottom: -240,
        characterHeight: '100%',
        characterBottom: -270,
        characterTranslateX: 0,
      },
    },
    floatAnimation: {
      sceneryLift: 30,
      sceneryUpDuration: 6200,
      sceneryDownDuration: 5200,
      characterLift: 20,
      characterUpDuration: 4400,
      characterDownDuration: 3600,
    },
  },
];

export function parseAmbienceId(value: string | undefined): AmbienceId | null {
  if (value === '1' || value === '2' || value === '3') {
    return Number(value) as AmbienceId;
  }

  return null;
}

export function getAmbienceById(id: AmbienceId): AmbienceOption {
  return AMBIENCE_OPTIONS.find((ambience) => ambience.id === id) ?? AMBIENCE_OPTIONS[0];
}
