import {
  World,
  Plugins,
  Util,
  System,
  requireEvents,
  Entity,
  ReservedKeys,
  Intention,
  RealEntity,
  ReservedStages,
} from '@persephia/chaos-engine';
const {Timer, createTimerSystemForResource} = Plugins.timer;
import {Position, Direction, Control} from './types';
import {equals} from 'ramda';
import {Keys} from './keys';
import {addPosition, createPosition, DELTAS, wrapBounds} from './lib/position';
import {randomInt} from './lib/utils';
import {updateControllerEvents} from './controls';

export const snakePlugin = (world: World): World => {
  return world
    .addSystem(addInitialData, ReservedStages.START_UP)
    .addSystem(tick)
    .addSystem(changeDirection)
    .addSystemDependency(changeDirection, updateControllerEvents)
    .addSystem(exit)
    .addSystemDependency(exit, updateControllerEvents)
    .addSystem(moveHead)
    .addSystemDependency(moveHead, tick)
    .addSystemDependency(moveHead, changeDirection)
    .addSystem(foodCollision)
    .addSystemDependency(foodCollision, moveHead)
    .addSystem(eat)
    .addSystemDependency(eat, foodCollision)
    .addSystem(moveTail)
    .addSystemDependency(moveTail, moveHead)
    .addSystemDependency(moveTail, eat)
    .addSystem(shout)
    .addSystemDependency(shout, tick);
};

/**
 * A system that will run the timer stored in the TIMER resource, and emit tick events.
 */
const tick = createTimerSystemForResource(Keys.resources.TIMER, 'tick');

/**
 * A helper which forces a system to only be run after a tick event is received.
 */
const requireTick = (system: System) =>
  requireEvents([Keys.events.TICK], system);

/**
 * A logging system.
 */
let shout: System = async world => {
  console.log('BEGIN SHOUT');
  console.log('TICK');
  console.log('components:', world.components);
  console.log('events: ', world.events);
  const components = world.query<[Entity, Position]>([
    ReservedKeys.ID,
    Keys.components.POSITION,
  ]);
  console.log('resources: ', world.resources);

  console.log('Positions: ', components);
  console.log('END SHOUT');
};
shout = requireTick(shout);

/**
 * Adds everything that we need at the beginning to run the game.
 */
const addInitialData: System = async () => {
  const food = createPosition(2, 4);

  const BOUNDS = createPosition(10, 10);
  const intention = new Intention()
    .addResource(Keys.resources.BOUNDS, BOUNDS)
    .addResource(Keys.resources.TIMER, new Timer(1000, Keys.events.TICK))
    .addResource(Keys.resources.LENGTH, 2)
    .addResource(Keys.resources.HEAD, createPosition(2, 1))
    .addResource<Direction>(Keys.resources.DIRECTION, 'DOWN');

  const ids = intention.createIDs(2);

  return intention
    .addComponents(
      Keys.components.POSITION,
      [createPosition(1, 1), createPosition(2, 1)],
      ids
    )
    .addComponents<number>(Keys.components.BODY, [1, 0], ids)
    .addResource(Keys.resources.FOOD, food);
};

let moveHead: System = async world => {
  let head = world.getResource<Position>(Keys.resources.HEAD)!;
  const bounds = world.getResource<Position>(Keys.resources.BOUNDS)!;
  const direction = world.getResource<Direction>(Keys.resources.DIRECTION)!;

  head = addPosition(head, DELTAS[direction]);
  head = wrapBounds(bounds, head);

  // Example of using a bundle instead of adding the components individually
  const headBundle = {
    [Keys.components.POSITION]: head,
    [Keys.components.BODY]: 0,
  };

  const intention = new Intention()
    .setResource(Keys.resources.HEAD, head)
    .updateAllComponents<number>(Keys.components.BODY, n => n + 1)
    .addBundle(headBundle);

  return intention;
};
moveHead = requireTick(moveHead);

let moveTail: System = async world => {
  const length = world.getResourceOr<number>(2, Keys.resources.LENGTH);
  // Get all entities with id and body copmonents
  const components = world.query<[number, number]>([
    ReservedKeys.ID,
    Keys.components.BODY,
  ]);

  console.log(components);

  const toRemove = components
    .filter(([_, body]) => body >= length)
    .map(Util.first) as number[];

  const ids: RealEntity[] = toRemove.map(id => ({exists: true, id}));
  return new Intention()
    .deleteComponents(Keys.components.POSITION, ids)
    .deleteComponents(Keys.components.BODY, ids);
};
moveTail = requireTick(moveTail);

let foodCollision: System = async world => {
  const head = world.getResource<Position>(Keys.resources.HEAD)!;
  const food = world.getResource<Position>(Keys.resources.FOOD)!;

  let results = new Intention();
  if (equals(head, food)) {
    results = results.addEvent('dinner', 'ATE');
  }
  return results;
};
foodCollision = requireTick(foodCollision);

let eat: System = async world => {
  const components = world.query<[Position, number]>([
    Keys.components.POSITION,
    Keys.components.BODY,
  ]);
  const takenPositions = components.map(Util.first) as Position[];
  const generatePotentialFood = (): Position => {
    const {x, y} = world.getResource<Position>(Keys.resources.BOUNDS)!;
    return {x: randomInt(x), y: randomInt(y)};
  };

  let food = generatePotentialFood();
  while (takenPositions.some(position => equals(position, food))) {
    food = generatePotentialFood();
  }

  return new Intention()
    .updateResource<number>(Keys.resources.LENGTH, n => n + 1)
    .setResource<Position>(Keys.resources.FOOD, food);
};
eat = requireEvents(['dinner'], eat);

const changeDirection: System = async world => {
  const controllerEvents = world.getEvents<Control>(Keys.events.CONTROLS);

  const isDirection = (control: Control): control is Direction => {
    if (control === 'EXIT' || control === 'PAUSE') return false;
    return true;
  };
  const valid = controllerEvents.filter(isDirection);
  if (valid.length === 0) return;

  // Throw away all but the last
  const direction = valid[valid.length - 1];

  return new Intention().setResource(Keys.resources.DIRECTION, direction);
};

const exit: System = async world => {
  const controllerEvents = world.getEvents<Control>(Keys.events.CONTROLS);

  if (controllerEvents.some(control => control === 'EXIT')) {
    console.log('EXITING');
    return new Intention().setResource(ReservedKeys.GAME_SHOULD_QUIT, true);
  }
};
