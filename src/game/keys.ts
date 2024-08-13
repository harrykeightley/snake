export const Keys = {
  components: {
    FOOD: 'food',
    POSITION: 'position',
    BODY: 'body',
    SQUARE: 'square',
  },
  events: {
    TICK: 'tick',
    RAW_KEYS: 'raw-keys',
    CONTROLS: 'controls',
  },
  resources: {
    PIXI: 'pixi',
    LENGTH: 'length',
    HEAD: 'head',
    DIRECTION: 'direction',
    BOUNDS: 'bounds',
    TIMER: 'timer',
    FOOD: 'food',
  },
} as const;

export const Stages = {
  GRAPHICS: 'graphics',
} as const;
