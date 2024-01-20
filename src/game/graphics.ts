import {
  Entity,
  System,
  SystemResults,
  Util,
  World,
} from '@persephia/chaos-engine';
import * as PIXI from 'pixi.js';
import {Keys, Position} from './types';

const PIXELS = 360;

export const graphicsPlugin = (world: World): World => {
  return world
    .addSystem(initialisePixi, 'start-up')
    .addSystem(clearSquares)
    .addSystem(renderSquares, 'graphics');
};

const initialisePixi: System = () => {
  const app = new PIXI.Application<HTMLCanvasElement>({
    width: PIXELS,
    height: PIXELS,
  });
  document.getElementById('canvas')?.appendChild(app.view);

  return new SystemResults().add(['resources', 'app'], app);
};

const renderSquare = (
  app: PIXI.Application,
  bounds: Position,
  colour: PIXI.Color,
  position: Position
) => {
  const pixelsPerCell = 36;
  const {x, y} = position;
  const square = new PIXI.Graphics();
  square.beginFill(colour);
  square.drawRect(
    x * pixelsPerCell,
    y * pixelsPerCell,
    pixelsPerCell,
    pixelsPerCell
  );
  square.endFill();
  app.stage.addChild(square);
  return square;
};

const renderSquares: System = world => {
  const components = world.query<[Entity, Position]>(['id', Keys.POSITION]);
  const ids = components.map(Util.first) as Entity[];
  const positions = components.map(Util.second) as Position[];

  const head = world.getResource<Position>(Keys.HEAD)!;
  const food = world.getResource<Position>(Keys.FOOD)!;
  const app = world.getResource<PIXI.Application>('app')!;
  const bounds = world.getResource<Position>(Keys.BOUNDS)!;

  const colour = (position: Position) => {
    if (position === head) return 'white';
    if (position === food) return 'pink';
    return 'green';
  };

  app.start();
  const squares = positions.map(pos =>
    renderSquare(app, bounds, new PIXI.Color(colour(pos)), pos)
  );
  return new SystemResults().set(['components', 'square'], squares, ids);
};

const clearSquares: System = world => {
  const app = world.getResource<PIXI.Application>('app')!;

  const components = world.query<[Entity, PIXI.Graphics]>(['id', 'square']);
  const ids = components.map(Util.first) as Entity[];

  app.stage.removeChildren();
  return new SystemResults().delete(['components', 'square'], undefined, ids);
};
