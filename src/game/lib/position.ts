import {Direction, Position} from '../types';
import {mod} from './utils';

export const createPosition = (x: number, y: number): Position => ({x, y});

export const DELTAS: Record<Direction, Position> = {
  UP: createPosition(0, -1),
  LEFT: createPosition(-1, 0),
  RIGHT: createPosition(1, 0),
  DOWN: createPosition(0, 1),
};

export const addPosition = (position: Position, delta: Position): Position => {
  const {x, y} = position;
  const {x: dx, y: dy} = delta;
  return {x: x + dx, y: y + dy};
};
export const wrapBounds = (bounds: Position, position: Position): Position => {
  const {x, y} = position;
  const {x: boundsX, y: boundsY} = bounds;
  return {x: mod(x, boundsX), y: mod(y, boundsY)};
};
