import Player from './Player.js';
import Enemy from './Enemy.js';

class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    preload() {
        this.load.image('hero', 'assets/hero.svg');
        this.load.image('skull', 'assets/skull.svg');
        this.load.image('tile', 'assets/tile.svg');
        this.load.image('coin', 'assets/coin.svg');
        this.load.image('banner', 'assets/banner.svg');
        this.load.image('sword', 'assets/sword.svg');
    }

    create() {
        this.cameras.main.setBackgroundColor('#1a0f2e'); // Night theme
        
        // Parallax background
        this.stars = this.add.graphics();
        this.stars.fillStyle(0xffffff, 0.8);
        for(let i=0; i<80; i++) {
            this.stars.fillPoint(Phaser.Math.Between(0, 800), Phaser.Math.Between(0, 224), Phaser.Math.Between(1, 2));
        }
        this.stars.setScrollFactor(0.1);

        this.mountains = this.add.graphics();
        this.mountains.fillStyle(0x3a2e4d, 1);
        this.mountains.beginPath();
        this.mountains.moveTo(0, 224);
        this.mountains.lineTo(80, 80);
        this.mountains.lineTo(200, 224);
        this.mountains.lineTo(350, 50);
        this.mountains.lineTo(550, 224);
        this.mountains.lineTo(700, 100);
        this.mountains.lineTo(800, 180);
        this.mountains.lineTo(800, 224);
        this.mountains.fillPath();
        this.mountains.setScrollFactor(0.3);

        this.coinsCollected = 0;

        // Platform group
        this.platforms = this.physics.add.staticGroup();
        this.createLevel();

        // Player
        this.player = new Player(this, 32, 100, 'hero');
        
        // Enemies group
        this.enemies = this.physics.add.group();
        this.createEnemies();

        // Coins
        this.coins = this.physics.add.group();
        this.createCoins();

        // Banner
        // Banner layout placed manually based on the layout
        this.banner = this.physics.add.staticSprite(750, 48, 'banner');

        // Collisions
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.enemies, this.platforms);
        this.physics.add.collider(this.coins, this.platforms);

        // Player vs Enemy overlaps
        this.physics.add.overlap(this.player, this.enemies, this.hitPlayer, null, this);
        this.physics.add.overlap(this.player.weaponHitbox, this.enemies, this.hitEnemy, null, this);
        
        // Collectibles overlaps
        this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);
        this.physics.add.overlap(this.player, this.banner, this.reachGoal, null, this);

        // UI
        this.hpText = this.add.text(8, 8, 'HP: 100', { fontSize: '10px', fill: '#ff4444', backgroundColor: '#000' });
        this.coinText = this.add.text(8, 20, 'Moedas: 0', { fontSize: '10px', fill: '#ffff00', backgroundColor: '#000' });
        this.hpText.setScrollFactor(0);
        this.coinText.setScrollFactor(0);
        this.hpText.setDepth(10);
        this.coinText.setDepth(10);

        // Camera follow
        this.physics.world.setBounds(0, 0, 800, 224);
        this.cameras.main.setBounds(0, 0, 800, 224);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    }

    createLevel() {
        const layout = [
            "                                                  ",
            "                                                  ",
            "                                         B        ",
            "                                       XXXX       ",
            "         C            C                           ",
            "        XXXXX        XXX             XXXX         ",
            "                                                  ",
            "                                                  ",
            "                 E                                ",
            "            XXXXXXXXXXXX                          ",
            "                                                  ",
            "   C  E                           E               ",
            "XXXXXXXXXXXXXXXXX    XXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
            "XXXXXXXXXXXXXXXXX    XXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        ];

        this.platforms.clear(true, true);
        
        for (let y = 0; y < layout.length; y++) {
            for (let x = 0; x < layout[y].length; x++) {
                const px = x * 16 + 8;
                const py = y * 16 + 8;
                const char = layout[y][x];
                
                if (char === 'X') {
                    this.platforms.create(px, py, 'tile');
                } else if (char === 'E') {
                    this.enemySpawns = this.enemySpawns || [];
                    this.enemySpawns.push({x: px, y: py});
                } else if (char === 'C') {
                    this.coinSpawns = this.coinSpawns || [];
                    this.coinSpawns.push({x: px, y: py});
                } else if (char === 'B') {
                    this.bannerSpawn = {x: px, y: py - 8}; // Adjusting height for banner
                }
            }
        }
        
        // Replace absolute banner pos with parsed position
        if (this.bannerSpawn) {
             this.banner = this.physics.add.staticSprite(this.bannerSpawn.x, this.bannerSpawn.y, 'banner');
        }
    }

    createEnemies() {
        if(this.enemySpawns) {
            this.enemySpawns.forEach(p => {
                const enemy = new Enemy(this, p.x, p.y, 'skull');
                this.enemies.add(enemy);
            });
        }
    }

    createCoins() {
        if(this.coinSpawns) {
            this.coinSpawns.forEach(p => {
                const coin = this.physics.add.sprite(p.x, p.y, 'coin');
                coin.body.setAllowGravity(false);
                this.tweens.add({
                    targets: coin,
                    y: p.y - 4,
                    duration: 1000,
                    yoyo: true,
                    repeat: -1
                });
                this.coins.add(coin);
            });
        }
    }

    update() {
        this.player.update();
        
        this.enemies.children.iterate((child) => {
            if(child && child.active) child.update();
        });

        // Fall in pit
        if (this.player.y > 224) {
            this.restartGame();
        }
    }

    hitPlayer(player, enemy) {
        if (!player.isInvulnerable && enemy.active) {
            player.takeDamage(20, enemy.x);
            player.isInvulnerable = true;
            player.setAlpha(0.5);
            this.time.delayedCall(1000, () => {
                player.isInvulnerable = false;
                player.setAlpha(1);
            });
        }
    }

    hitEnemy(weapon, enemy) {
        if (this.player.isAttacking && enemy.active) {
            enemy.die();
        }
    }

    collectCoin(player, coin) {
        coin.destroy();
        this.coinsCollected += 1;
        this.coinText.setText('Moedas: ' + this.coinsCollected);
    }

    reachGoal(player, banner) {
        // Only trigger once
        if (this.hasReachedGoal) return;
        this.hasReachedGoal = true;
        
        const winText = this.add.text(this.cameras.main.scrollX + 100, 100, 'NÍVEL COMPLETO!', { fontSize: '24px', fill: '#0f0', backgroundColor: '#000' });
        winText.setScrollFactor(0);
        winText.setDepth(20);
        
        this.player.setTint(0x00ff00);
        this.time.delayedCall(3000, () => {
            this.restartGame();
        });
    }

    updateHP(hp) {
        this.hpText.setText('HP: ' + Math.max(0, hp));
    }

    restartGame() {
        this.scene.restart();
    }
}

const config = {
    type: Phaser.AUTO,
    width: 400,
    height: 224,
    parent: 'game-container',
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 600 },
            debug: false
        }
    },
    scene: GameScene,
    scale: {
        zoom: Phaser.Scale.MAX_ZOOM,
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

const game = new Phaser.Game(config);
