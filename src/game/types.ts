export type Position = {x: number; y: number};

export const directions = ['UP', 'DOWN', 'LEFT', 'RIGHT'] as const;
export type Direction = (typeof directions)[number];

export type Control = Direction | 'PAUSE' | 'EXIT';
