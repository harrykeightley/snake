import {
  SystemResults,
  World,
  Plugins,
  Util,
  System,
  requireEvents,
  Entity,
} from '@persephia/chaos-engine';
const {Timer, createTimerResourceSystem} = Plugins.timer;
import {Position, Direction, Keys} from './types';
import {graphicsPlugin} from './graphics';
import {equals} from 'ramda';

const randomInt = (max: number) => {
  return Math.floor(max * Math.random());
};

const createPosition = (x: number, y: number): Position => ({x, y});

const deltas: Record<Direction, Position> = {
  UP: createPosition(0, -1),
  LEFT: createPosition(-1, 0),
  RIGHT: createPosition(1, 0),
  DOWN: createPosition(0, 1),
};

const bounds = createPosition(10, 10);

const addPosition = (position: Position, delta: Position): Position => {
  const {x, y} = position;
  const {x: dx, y: dy} = delta;
  return {x: x + dx, y: y + dy};
};

const wrapBounds = (bounds: Position, position: Position): Position => {
  const {x, y} = position;
  const {x: boundsX, y: boundsY} = bounds;
  return {x: x % boundsX, y: y % boundsY};
};

// Systems
const tick = createTimerResourceSystem(Keys.TIMER);
const requireTick = requireEvents(['tick']);

let shout: System = world => {
  console.log('BEGIN SHOUT');
  console.log('TICK');
  console.log('components:', world.components);
  console.log('events: ', world.events);
  const components = world.query<[Entity, Position]>(['id', Keys.POSITION]);
  console.log('Positions: ', components);

  console.log('END SHOUT');
};
shout = requireTick(shout);

const addInitialData: System = world => {
  const ids = world.createEntities(2);
  const food = createPosition(2, 4);
  return (
    new SystemResults()
      .add(['resources', Keys.BOUNDS], bounds)
      .add(['resources', Keys.TIMER], new Timer(1000, 'tick'))
      .add(['resources', Keys.LENGTH], 2)
      .add<Position>(['resources', Keys.HEAD], createPosition(2, 1))
      .add<Direction>(['resources', Keys.DIRECTION], 'DOWN')
      .add<Position>(
        ['components', Keys.POSITION],
        [createPosition(1, 1), createPosition(2, 1)],
        ids
      )
      .add<number>(['components', Keys.BODY], [1, 0], ids)
      //food
      .add<Position>(['resources', Keys.FOOD], food)
      .add<Position>(['components', Keys.POSITION], food)
  );
};

let moveHead: System = world => {
  let head = world.getResource<Position>(Keys.HEAD)!;
  const bounds = world.getResource<Position>(Keys.BOUNDS)!;
  const direction = world.getResource<Direction>(Keys.DIRECTION)!;

  const id = world.createEntity();

  head = addPosition(head, deltas[direction]);
  head = wrapBounds(bounds, head);

  console.log('Move head');
  console.log('New head id: ', id);
  return new SystemResults()
    .set(['resources', Keys.HEAD], head)
    .set(['components', Keys.POSITION], head, id)
    .set(['components', Keys.BODY], 0, id)
    .update<number>(['components', Keys.BODY], n => n + 1);
};
moveHead = requireTick(moveHead);

let moveTail: System = world => {
  const length = world.getResourceOr<number>(1, Keys.LENGTH);
  // Get all entities with id and body copmonents
  const components = world.query<[number, number]>(['id', Keys.BODY]);
  const toRemove = components
    .filter(([_, body]) => body >= length)
    .map(Util.first) as number[];

  console.log('Move tail');
  console.log('Move tail to remove: ', toRemove);

  return new SystemResults()
    .delete(['components', Keys.BODY], undefined, toRemove)
    .delete(['components', Keys.POSITION], undefined, toRemove)
    .delete(['components', 'id'], undefined, toRemove);
};
moveTail = requireTick(moveTail);

let foodCollision: System = world => {
  const head = world.getResource<Position>(Keys.HEAD)!;
  const food = world.getResource<Position>(Keys.FOOD)!;

  const results = new SystemResults();
  if (equals(head, food)) {
    results.add(['events', 'dinner'], 'ATE');
  }
  return results;
};
foodCollision = requireTick(foodCollision);

let eat: System = world => {
  const components = world.query<[Position, number]>([
    Keys.POSITION,
    Keys.BODY,
  ]);
  const takenPositions = components.map(Util.first) as Position[];
  const generatePotentialFood = (): Position => {
    const {x, y} = bounds;
    return {x: randomInt(x), y: randomInt(y)};
  };

  let food = generatePotentialFood();
  while (takenPositions.some(position => equals(position, food))) {
    food = generatePotentialFood();
  }

  return new SystemResults()
    .update<number>(['resources', Keys.LENGTH], n => n + 1)
    .set<Position>(['resources', Keys.FOOD], food);
};
eat = requireEvents(['dinner'], eat);

/**
 * Runs through animation frames
 */
const runWorld = (world: World) => {
  if (world.isFinished()) {
    return world.applyStage('tear-down');
  }
  requestAnimationFrame(() => runWorld(world.step()));
};

export const playGame = () => {
  let world = new World()
    .addPlugin(Plugins.corePlugin)
    .addSystem(addInitialData, 'start-up')
    .addSystem(tick)
    .addSystem(moveHead)
    .addSystemDependency(moveHead, tick)
    .addSystem(moveTail)
    .addSystemDependency(moveTail, moveHead)
    .addSystem(foodCollision)
    .addSystemDependency(foodCollision, moveHead)
    .addSystem(eat)
    .addSystemDependency(eat, foodCollision)
    .addSystem(shout)
    .addSystemDependency(shout, tick)
    .addPlugin(graphicsPlugin);

  console.log('Res before startup', world.resources);
  world = world.applyStage('start-up');
  console.log('HELLO: ', world.resources);
  runWorld(world);
};
