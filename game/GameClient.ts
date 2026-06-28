import Phaser from 'phaser';
import WorldScene from './scenes/WorldScene';

export interface GameConfigData {
  containerId: string;
  socket: any;
  mapName: string;
  username: string;
  avatar: any;
  theme?: string;
}

export function startPhaserGame(configData: GameConfigData): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: '100%',
    height: '100%',
    parent: configData.containerId,
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false
      }
    },
    scene: [WorldScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    }
  };

  const game = new Phaser.Game(config);

  // Pass initialization data to the first scene once boot completes
  game.events.once('ready', () => {
    game.scene.start('WorldScene', {
      socket: configData.socket,
      mapName: configData.mapName,
      username: configData.username,
      avatar: configData.avatar,
      theme: configData.theme
    });
  });

  return game;
}
