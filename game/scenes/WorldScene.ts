import Phaser from 'phaser';

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
  
  // Portals layout for map switching
  private portals: Phaser.GameObjects.Rectangle[] = [];

  constructor() {
    super('WorldScene');
  }

  init(data: { socket: any; mapName: string; username: string; avatar: any; theme?: string }) {
    this.socket = data.socket;
    this.activeMapName = data.mapName || 'Town Square';
    this.playerUsername = data.username || 'Citizen';
    this.activeTheme = data.theme || 'cyberpunk';
    
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
    const skin = avatar.skin || '#ffd1a9';
    const hair = '#8b4513';
    const shirt = '#3b82f6';
    const pants = '#1e293b';

    // 1. Shadow
    graphics.fillStyle(0x000000, 0.2);
    graphics.fillEllipse(0, 18, 28, 12);

    // 2. Legs/Shoes
    graphics.fillStyle(0xffffff, 1); // white sneakers
    graphics.fillRect(-10, 12, 6, 6);
    graphics.fillRect(4, 12, 6, 6);

    // 3. Body T-shirt / Pants
    graphics.fillStyle(Phaser.Display.Color.HexStringToColor(pants).color, 1);
    graphics.fillRect(-10, 2, 20, 10);
    graphics.fillStyle(Phaser.Display.Color.HexStringToColor(shirt).color, 1);
    graphics.fillRect(-10, -10, 20, 12);

    // 4. Head/Skin
    graphics.fillStyle(Phaser.Display.Color.HexStringToColor(skin).color, 1);
    graphics.fillCircle(0, -22, 10);

    // 5. Hair
    graphics.fillStyle(Phaser.Display.Color.HexStringToColor(hair).color, 1);
    graphics.fillRect(-11, -31, 22, 10);

    // 6. Eyes Details
    graphics.fillStyle(0x000000, 1);
    graphics.fillRect(-5, -24, 2, 2);
    graphics.fillRect(3, -24, 2, 2);

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

    // Receive initial players coordinates list
    this.socket.on('players_in_map', (players: any[]) => {
      // Clear existing sprites first
      this.otherPlayers.forEach((sprite) => sprite.destroy());
      this.otherPlayers.clear();

      players.forEach((p) => {
        this.addOtherPlayer(p);
      });
    });

    // Handle new player entering map
    this.socket.on('player_joined', (p: any) => {
      this.addOtherPlayer(p);
    });

    // Handle player coordinates sync
    this.socket.on('player_moved', (data: { socketId: string; x: number; y: number }) => {
      const other = this.otherPlayers.get(data.socketId);
      if (other) {
        // Use smooth tween interpolation instead of sudden teleporting
        this.tweens.add({
          targets: other,
          x: data.x,
          y: data.y,
          duration: 100
        });
      }
    });

    // Handle player exit
    this.socket.on('player_left', (data: { socketId: string }) => {
      const other = this.otherPlayers.get(data.socketId);
      if (other) {
        other.destroy();
        this.otherPlayers.delete(data.socketId);
      }
    });

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
    
    this.otherPlayers.set(p.socketId, other);
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
