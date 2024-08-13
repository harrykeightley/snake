import {
  Intention,
  ReservedStages,
  System,
  World,
} from '@persephia/chaos-engine';
import {Keys} from './keys';
import {Control, Direction} from './types';

const keyToControl: Record<string, Control> = {
  w: 'UP',
  a: 'LEFT',
  s: 'DOWN',
  d: 'RIGHT',
  ArrowUp: 'UP',
  ArrowLeft: 'LEFT',
  ArrowDown: 'DOWN',
  ArrowRight: 'RIGHT',
  x: 'EXIT',
} as const;

export const controlsPlugin = (world: World): World => {
  return world
    .addSystem(captureKeys, ReservedStages.START_UP)
    .addSystem(updateRawEvents)
    .addSystem(updateControllerEvents)
    .addSystemDependency(updateControllerEvents, updateRawEvents);
};

let rawEvents: KeyboardEvent[] = [];

const captureKeys: System = async () => {
  console.log('setup keys');
  window.addEventListener('keydown', event => {
    console.log(event);
    rawEvents.push(event);
  });
};

export const updateRawEvents: System = async () => {
  const result = new Intention().addEvents(Keys.events.RAW_KEYS, [
    ...rawEvents,
  ]);
  rawEvents = [];
  return result;
};

export const updateControllerEvents: System = async world => {
  const rawKeyEvents = world.getEvents<KeyboardEvent>(Keys.events.RAW_KEYS);
  const valid = rawKeyEvents.filter(event =>
    Object.keys(keyToControl).includes(event.key)
  );

  if (valid.length === 0) return;

  const controls = valid.map(event => keyToControl[event.key]);
  return new Intention().addEvents(Keys.events.CONTROLS, controls);
};
