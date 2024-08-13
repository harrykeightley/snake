import {World, Plugins, ReservedStages} from '@persephia/chaos-engine';
import {graphicsPlugin} from './graphics';
import {controlsPlugin} from './controls';
import {snakePlugin} from './snake';

/**
 * Runs through animation frames
 */
const runWorld = async (world: World) => {
  if (world.isFinished()) {
    return await world.applyStage(ReservedStages.TEAR_DOWN);
  }
  await world.step();
  requestAnimationFrame(() => runWorld(world));
};

export const playGame = async () => {
  const world = new World()
    .addPlugin(Plugins.corePlugin)
    .addPlugin(graphicsPlugin)
    .addPlugin(controlsPlugin)
    .addPlugin(snakePlugin);

  await world.applyStage(ReservedStages.START_UP);
  return runWorld(world);
};
