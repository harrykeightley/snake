import {
  System,
  Intention,
  Util,
  World,
  ReservedKeys,
  EntityID,
  RealEntity,
  ReservedStages,
} from '@persephia/chaos-engine';
import * as PIXI from 'pixi.js';
import {Position} from './types';
import {Keys, Stages} from './keys';

const PIXELS = 360;

export const graphicsPlugin = (world: World): World => {
  return world
    .addSystem(initialisePixi, ReservedStages.START_UP)
    .addSystem(clearSquares)
    .addSystem(renderSquares, Stages.GRAPHICS);
};

const initialisePixi: System = async () => {
  const app = new PIXI.Application<HTMLCanvasElement>({
    width: PIXELS,
    height: PIXELS,
  });
  document.getElementById('canvas')?.appendChild(app.view);

  return new Intention().addResource(Keys.resources.PIXI, app);
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

const renderSquares: System = async world => {
  const components = world.query<[EntityID, Position]>([
    ReservedKeys.ID,
    Keys.components.POSITION,
  ]);
  const entities = components.map(Util.first) as EntityID[];
  const positions = components.map(Util.second) as Position[];
  const ids: RealEntity[] = entities.map(id => ({exists: true, id}));

  const head = world.getResource<Position>(Keys.resources.HEAD)!;
  const food = world.getResource<Position>(Keys.resources.FOOD)!;
  const app = world.getResource<PIXI.Application>(Keys.resources.PIXI)!;
  const bounds = world.getResource<Position>(Keys.resources.BOUNDS)!;

  const colour = (position: Position) => {
    if (position === head) return 'white';
    if (position === food) return 'pink';
    return 'green';
  };

  app.start();
  const squares = positions.map(pos =>
    renderSquare(app, bounds, new PIXI.Color(colour(pos)), pos)
  );
  renderSquare(app, bounds, new PIXI.Color(colour(food)), food);
  return new Intention().setComponents(Keys.components.SQUARE, squares, ids);
};

const clearSquares: System = async world => {
  const app = world.getResource<PIXI.Application>(Keys.resources.PIXI)!;
  app.stage.removeChildren();
  return new Intention().deleteAllComponentsOfName(Keys.components.SQUARE);
};
