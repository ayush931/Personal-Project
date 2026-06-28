import Phaser from 'phaser';
import { GAME_ITEMS } from '../../lib/items';

export default class WorldScene extends Phaser.Scene {
  private player: Phaser.GameObjects.Container | null = null;
  private otherPlayers: Map<string, Phaser.GameObjects.Container> = new Map();
  private cursorKeys: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private wasdKeys: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  } | null = null;
  
  // Game properties passed from React
  private socket: any;
  private activeMapName = 'Town Square';
  private playerUsername = 'Citizen';
  private playerAvatar: any = {};
  private activeTheme = 'cyberpunk';
  private initialPlayersList: any[] = [];
  
  // Portals layout for map switching
  private portals: Phaser.GameObjects.Rectangle[] = [];

  constructor() {
    super('WorldScene');
  }

  init(data: { socket: any; mapName: string; username: string; avatar: any; theme?: string; initialPlayers?: any[] }) {
    this.socket = data.socket;
    this.activeMapName = data.mapName || 'Town Square';
    this.playerUsername = data.username || 'Citizen';
    this.activeTheme = data.theme || 'cyberpunk';
    this.initialPlayersList = data.initialPlayers || [];
    
    try {
      this.playerAvatar = typeof data.avatar === 'string' ? JSON.parse(data.avatar) : data.avatar;
    } catch (e) {
      this.playerAvatar = data.avatar || {};
    }
  }

  create() {
    this.physics.world.setBounds(0, 0, 1200, 900);
    this.cameras.main.setBounds(0, 0, 1200, 900);

    // Draw the Map Ground, Structures, and Portals
    this.drawMapLayout();

    // Create Keyboard Inputs
    if (this.input.keyboard) {
      this.cursorKeys = this.input.keyboard.createCursorKeys();
      this.wasdKeys = this.input.keyboard.addKeys({
        W: Phaser.Input.Keyboard.KeyCodes.W,
        A: Phaser.Input.Keyboard.KeyCodes.A,
        S: Phaser.Input.Keyboard.KeyCodes.S,
        D: Phaser.Input.Keyboard.KeyCodes.D
      }) as any;

      // Disable event prevention for W, A, S, D so typing works normally in any inputs
      this.input.keyboard.removeCapture([
        Phaser.Input.Keyboard.KeyCodes.W,
        Phaser.Input.Keyboard.KeyCodes.A,
        Phaser.Input.Keyboard.KeyCodes.S,
        Phaser.Input.Keyboard.KeyCodes.D
      ]);
    }

    // Spawn Main Player
    this.spawnPlayer();

    // Spawn Initial Other Players
    if (this.initialPlayersList && this.initialPlayersList.length > 0) {
      this.initialPlayersList.forEach((p) => {
        this.addOtherPlayer(p);
      });
    }

    // Set up Socket listeners
    this.setupNetworkEvents();
  }

  update() {
    if (!this.player) return;

    // Freeze character movement if the user is typing in any input field or textarea
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || (activeEl as HTMLElement).isContentEditable)) {
      const body = this.player.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(0);
      return;
    }

    const speed = 200;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0);

    let moving = false;
    let animation = 'idle';

    // Keyboard controls
    if (this.cursorKeys && this.wasdKeys) {
      if (this.cursorKeys.left.isDown || this.wasdKeys.A.isDown) {
        body.setVelocityX(-speed);
        moving = true;
      } else if (this.cursorKeys.right.isDown || this.wasdKeys.D.isDown) {
        body.setVelocityX(speed);
        moving = true;
      }

      if (this.cursorKeys.up.isDown || this.wasdKeys.W.isDown) {
        body.setVelocityY(-speed);
        moving = true;
      } else if (this.cursorKeys.down.isDown || this.wasdKeys.S.isDown) {
        body.setVelocityY(speed);
        moving = true;
      }
    }

    // Update animations state
    if (moving) {
      animation = 'walk';
    }

    // Sync coordinates with Socket.io server
    if (this.socket) {
      this.socket.emit('player_move', {
        x: this.player.x,
        y: this.player.y,
        animation
      });
    }

    // Check portals overlap for map transitions
    this.portals.forEach((portal) => {
      if (this.player && Phaser.Geom.Intersects.RectangleToRectangle(
        this.player.getBounds(),
        portal.getBounds()
      )) {
        const destination = portal.getData('destination');
        if (destination) {
          // Switch map triggers
          this.socket.emit('switch_map', { targetMap: destination });
        }
      }
    });
  }

  private drawMapLayout() {
    const graphics = this.add.graphics();

    // Map themes styles configuration
    let groundColor = 0x22c55e; // Green grass default
    let pathColor = 0xeab308; // Yellow sandbox
    let gridColor = 0x15803d;
    let portalColor = 0xff00ff;

    if (this.activeTheme === 'lavender') {
      portalColor = 0xfb7185; // soft pink rose portal
      if (this.activeMapName === 'Beach') {
        groundColor = 0xe8dff5; // Lavender sand
        pathColor = 0xa78bfa; // Soft purple tide
        gridColor = 0xd6c7f5;
      } else if (this.activeMapName === 'Arcade') {
        groundColor = 0x1c1736; // Twilight purple
        pathColor = 0xf472b6; // Neon pink line
        gridColor = 0x2e2754;
      } else if (this.activeMapName === 'Cafe') {
        groundColor = 0x4a3b5c; // Plum wood floor
        pathColor = 0xf3e8ff; // Lavender wood planks
        gridColor = 0x332542;
      } else {
        groundColor = 0x2e1a47; // Violet night grass
        pathColor = 0xc084fc; // Lilac gravel path
        gridColor = 0x1e0d30;
      }
    } else {
      // Cyberpunk Retro (Original)
      portalColor = 0xff00ff;
      if (this.activeMapName === 'Beach') {
        groundColor = 0xfef08a; // Golden sand
        pathColor = 0x38bdf8; // Blue ocean
        gridColor = 0xeab308;
      } else if (this.activeMapName === 'Arcade') {
        groundColor = 0x0f172a; // Dark slate cyber
        pathColor = 0x7e22ce; // Purple stripes
        gridColor = 0x1e293b;
      } else if (this.activeMapName === 'Cafe') {
        groundColor = 0x78350f; // Brown wooden floors
        pathColor = 0xfef3c7; // Wooden panels
        gridColor = 0x451a03;
      } else {
        groundColor = 0x22c55e;
        pathColor = 0xeab308;
        gridColor = 0x15803d;
      }
    }

    // Ground fill
    graphics.fillStyle(groundColor, 1);
    graphics.fillRect(0, 0, 1200, 900);

    // Decorative gridlines
    graphics.lineStyle(2, gridColor, 0.15);
    for (let x = 0; x < 1200; x += 40) {
      graphics.lineBetween(x, 0, x, 900);
    }
    for (let y = 0; y < 900; y += 40) {
      graphics.lineBetween(0, y, 1200, y);
    }

    // Pathways
    graphics.fillStyle(pathColor, 0.4);
    graphics.fillRect(200, 0, 120, 900);
    graphics.fillRect(0, 400, 1200, 120);

    // Obstacles / Solid structures
    const walls = this.physics.add.staticGroup();
    
    // Draw decorative walls programmatically
    graphics.fillStyle(0x334155, 1); // Dark slate block
    graphics.fillRect(100, 100, 80, 80);
    const wallObject = this.add.rectangle(140, 140, 80, 80);
    walls.add(wallObject);

    // Title HUD label inside scene
    this.add.text(20, 20, `📍 Map Area: ${this.activeMapName}`, {
      fontFamily: 'Courier',
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    }).setScrollFactor(0);

    // Exit Portals (Walk into these Rectangles to teleport to adjacent maps)
    const lobbyPortal = this.add.rectangle(1180, 460, 40, 100, portalColor, 0.4);
    this.physics.add.existing(lobbyPortal, true);
    lobbyPortal.setData('destination', this.activeMapName === 'Town Square' ? 'Beach' : 'Town Square');
    this.portals.push(lobbyPortal);

    // Interactive details (e.g. Bonfires, stage, pool)
    if (this.activeMapName === 'Beach') {
      // Ocean wave layer
      graphics.fillStyle(0x0284c7, 0.7);
      graphics.fillRect(0, 0, 1200, 150);
    }
    if (this.activeMapName === 'Town Square') {
      // Bonfire circle
      graphics.fillStyle(0xd97706, 0.8);
      graphics.fillCircle(600, 450, 24);
    }
  }

  private spawnPlayer() {
    this.player = this.createAvatarContainer(
      this.playerUsername,
      this.playerAvatar,
      500,
      450,
      true
    );
    this.physics.add.existing(this.player);
    (this.player.body as Phaser.Physics.Arcade.Body)
      .setCollideWorldBounds(true)
      .setSize(32, 48)
      .setOffset(-16, -24);

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
  }

  private createAvatarContainer(
    username: string,
    avatar: any,
    x: number,
    y: number,
    isLocal: boolean
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // Avatar Graphics Drawing Layers
    const graphics = this.add.graphics();

    // Colors configs
    const avatarObj = avatar || {};
    const getAssetColor = (itemId: string, defaultColor: string) => {
      if (!itemId) return defaultColor;
      const item = GAME_ITEMS[itemId];
      return item?.assetData?.color || defaultColor;
    };

    const skin = avatarObj.skin || '#ffd1a9';
    const hairColor = getAssetColor(avatarObj.hair, '#8b4513');
    const shirtColor = getAssetColor(avatarObj.shirt, '#3b82f6');
    const pantsColor = getAssetColor(avatarObj.pants, '#1e293b');
    const shoesColor = getAssetColor(avatarObj.shoes, '#ffffff');

    // 1. Shadow
    graphics.fillStyle(0x000000, 0.2);
    graphics.fillEllipse(0, 18, 28, 12);

    // 2. Wings/Backpack (Back layer)
    const backpackColor = avatarObj.backpack && avatarObj.backpack !== 'none' ? getAssetColor(avatarObj.backpack, '#ee82ee') : null;
    if (backpackColor) {
      graphics.fillStyle(Phaser.Display.Color.HexStringToColor(backpackColor).color, 0.7);
      graphics.fillRect(-22, -8, 12, 8);
      graphics.fillRect(10, -8, 12, 8);
    }

    // 3. Legs/Shoes
    graphics.fillStyle(Phaser.Display.Color.HexStringToColor(shoesColor).color, 1);
    graphics.fillRect(-10, 12, 6, 6);
    graphics.fillRect(4, 12, 6, 6);

    // 4. Body T-shirt / Pants
    graphics.fillStyle(Phaser.Display.Color.HexStringToColor(pantsColor).color, 1);
    graphics.fillRect(-10, 2, 20, 10);
    graphics.fillStyle(Phaser.Display.Color.HexStringToColor(shirtColor).color, 1);
    graphics.fillRect(-10, -10, 20, 12);

    // 5. Head/Skin
    graphics.fillStyle(Phaser.Display.Color.HexStringToColor(skin).color, 1);
    graphics.fillCircle(0, -22, 10);

    // 6. Hair
    graphics.fillStyle(Phaser.Display.Color.HexStringToColor(hairColor).color, 1);
    graphics.fillRect(-11, -31, 22, 10);

    // 7. Eyes Details
    graphics.fillStyle(0x000000, 1);
    graphics.fillRect(-5, -24, 2, 2);
    graphics.fillRect(3, -24, 2, 2);

    // 8. Hat
    const hatColor = avatarObj.hat && avatarObj.hat !== 'hat_none' ? getAssetColor(avatarObj.hat, '#ffd700') : null;
    if (hatColor) {
      graphics.fillStyle(Phaser.Display.Color.HexStringToColor(hatColor).color, 1);
      graphics.fillTriangle(-14, -32, 14, -32, 0, -48);
    }

    // 9. Glasses
    const glassesColor = avatarObj.glasses && avatarObj.glasses !== 'glasses_none' ? getAssetColor(avatarObj.glasses, '#ff00ff') : null;
    if (glassesColor) {
      graphics.fillStyle(Phaser.Display.Color.HexStringToColor(glassesColor).color, 0.85);
      graphics.fillRect(-8, -26, 16, 4);
    }

    // 10. Hand Accessory
    const accessoryColor = avatarObj.accessory && avatarObj.accessory !== 'accessory_none' ? getAssetColor(avatarObj.accessory, '#c0c0c0') : null;
    if (accessoryColor) {
      graphics.lineStyle(3, Phaser.Display.Color.HexStringToColor(accessoryColor).color, 1);
      graphics.lineBetween(-14, 8, -20, -12); // Held in hand
    }

    container.add(graphics);

    // Add Name Tag Text Overlay
    const nameTag = this.add.text(0, -46, username, {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: isLocal ? '#ffff00' : '#ffffff',
      backgroundColor: '#00000099',
      padding: { x: 5, y: 2 }
    }).setOrigin(0.5, 0.5);

    container.add(nameTag);

    return container;
  }

  private setupNetworkEvents() {
    if (!this.socket) return;

    // Clean up any existing listeners on the socket
    this.socket.off('player_emote');
    this.socket.off('chat_message');

    // Handle Emote Speech Bubble Drawing
    this.socket.on('player_emote', (data: { socketId: string; type: string; content: string }) => {
      let target: Phaser.GameObjects.Container | null = null;
      if (this.socket.id === data.socketId) {
        target = this.player;
      } else {
        target = this.otherPlayers.get(data.socketId) || null;
      }

      if (target) {
        this.drawSpeechBubble(target, data.content);
      }
    });

    // Handle Chat Messages Speech Bubble drawing inside Phaser
    this.socket.on('chat_message', (data: { socketId: string; content: string }) => {
      let target: Phaser.GameObjects.Container | null = null;
      if (this.socket.id === data.socketId) {
        target = this.player;
      } else {
        target = this.otherPlayers.get(data.socketId) || null;
      }

      if (target) {
        this.drawSpeechBubble(target, data.content);
      }
    });

    // Clean up on shutdown
    this.events.once('shutdown', () => {
      if (this.socket) {
        this.socket.off('player_emote');
        this.socket.off('chat_message');
      }
    });
  }

  updateOtherPlayers(players: any[]) {
    // 1. Identify which players need to be removed
    const currentSocketIds = new Set(players.map(p => p.socketId));
    this.otherPlayers.forEach((container, socketId) => {
      if (!currentSocketIds.has(socketId)) {
        container.destroy();
        this.otherPlayers.delete(socketId);
      }
    });

    // 2. Add or update players
    players.forEach((p) => {
      // Don't draw our own player container as an "other" player
      if (p.username === this.playerUsername || (this.socket && this.socket.id === p.socketId)) return;

      const other = this.otherPlayers.get(p.socketId);
      if (!other) {
        this.addOtherPlayer(p);
      } else {
        // Update position smoothly if moved
        if (other.x !== p.x || other.y !== p.y) {
          this.tweens.add({
            targets: other,
            x: p.x,
            y: p.y,
            duration: 100
          });
        }
      }
    });
  }

  private addOtherPlayer(p: any) {
    if (this.otherPlayers.has(p.socketId)) return;
    
    let avatarData = {};
    try {
      avatarData = typeof p.avatar === 'string' ? JSON.parse(p.avatar) : p.avatar;
    } catch (e) {
      avatarData = {};
    }

    const other = this.createAvatarContainer(
      p.username,
      avatarData,
      p.x,
      p.y,
      false
    );

    // Make other player characters interactive to allow pointer interactions
    other.setSize(32, 48);
    other.setInteractive(new Phaser.Geom.Rectangle(-16, -24, 32, 48), Phaser.Geom.Rectangle.Contains);

    other.on('pointerover', () => {
      other.setScale(1.05);
      this.game.canvas.style.cursor = 'pointer';
    });

    other.on('pointerout', () => {
      other.setScale(1.0);
      this.game.canvas.style.cursor = 'default';
    });

    other.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.stopPropagation();
      this.handlePlayerClick(p);
    });
    
    this.otherPlayers.set(p.socketId, other);
  }

  private handlePlayerClick(player: any) {
    const event = new CustomEvent('phaser-player-click', {
      detail: {
        socketId: player.socketId,
        username: player.username,
        id: player.id,
        level: player.level,
        badge: player.badge
      }
    });
    window.dispatchEvent(event);
  }

  private drawSpeechBubble(parent: Phaser.GameObjects.Container, text: string) {
    // Remove existing bubble if any
    const oldBubble = parent.getData('bubble');
    if (oldBubble) oldBubble.destroy();

    const bubbleContainer = this.add.container(0, -64);
    
    // Fit text width
    const textObject = this.add.text(0, 0, text, {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#000000',
      wordWrap: { width: 140 }
    }).setOrigin(0.5, 0.5);

    const bgWidth = Math.max(40, textObject.width + 12);
    const bgHeight = textObject.height + 10;

    let strokeColor = 0x9d4edd;
    if (this.activeTheme === 'lavender') strokeColor = 0xa78bfa;

    const bgBubble = this.add.rectangle(0, 0, bgWidth, bgHeight, 0xffffff, 1)
      .setStrokeStyle(2, strokeColor)
      .setOrigin(0.5, 0.5);

    bubbleContainer.add(bgBubble);
    bubbleContainer.add(textObject);
    parent.add(bubbleContainer);
    parent.setData('bubble', bubbleContainer);

    // Auto-destroy after 3 seconds with nice fade-out
    this.time.delayedCall(3000, () => {
      if (this.sys.isActive() && bubbleContainer) {
        this.tweens.add({
          targets: bubbleContainer,
          alpha: 0,
          y: -74,
          duration: 300,
          onComplete: () => {
            bubbleContainer.destroy();
            parent.setData('bubble', null);
          }
        });
      }
    });
  }
}
