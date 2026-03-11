export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.setCollideWorldBounds(true);
        this.setBounce(0);
        
        // Physics config
        this.body.setSize(12, 16);
        this.body.setOffset(2, 0);
        
        // States
        this.SPEED = 140; // Aumentado (era 120)
        this.JUMP_VELOCITY = -320; // Aumentado (era -280)
        this.canDoubleJump = false;
        this.isAttacking = false;
        this.isBlocking = false;
        this.hp = 100;
        
        // Input Controls
        this.cursors = scene.input.keyboard.createCursorKeys();
        const kb = scene.input.keyboard;
        this.keys = {
            W: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            A: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            S: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            D: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            Z: kb.addKey(Phaser.Input.Keyboard.KeyCodes.Z),
            J: kb.addKey(Phaser.Input.Keyboard.KeyCodes.J),
            X: kb.addKey(Phaser.Input.Keyboard.KeyCodes.X),
            K: kb.addKey(Phaser.Input.Keyboard.KeyCodes.K),
        };
        
        // Weapon Hitbox
        this.weaponHitbox = scene.add.circle(0, 0, 12, 0xffffff, 0);
        scene.physics.add.existing(this.weaponHitbox);
        this.weaponHitbox.body.setAllowGravity(false);
        this.weaponHitbox.body.enable = false;
    }

    update() {
        if (this.isAttacking) {
            this.setVelocityX(0);
            this.updateWeaponPosition();
            return;
        }

        const blockDown = this.keys.X.isDown || this.keys.K.isDown;
        if (blockDown && (this.body.blocked.down || this.body.touching.down)) {
            this.isBlocking = true;
            this.setVelocityX(0);
            this.setTint(0x8888ff);
        } else {
            this.isBlocking = false;
            this.clearTint();
        }

        // Movements
        const left = this.cursors.left.isDown || this.keys.A.isDown;
        const right = this.cursors.right.isDown || this.keys.D.isDown;
        
        if (!this.isBlocking) {
            if (left) {
                this.setVelocityX(-this.SPEED);
                this.setFlipX(true);
            } else if (right) {
                this.setVelocityX(this.SPEED);
                this.setFlipX(false);
            } else {
                this.setVelocityX(0);
            }
        }
        
        // Jumping
        const jumpJustDown = Phaser.Input.Keyboard.JustDown(this.cursors.space) || Phaser.Input.Keyboard.JustDown(this.keys.W) || Phaser.Input.Keyboard.JustDown(this.cursors.up);
        const isGrounded = this.body.blocked.down || this.body.touching.down;
        
        if (isGrounded) {
             this.canDoubleJump = true;
        }
        
        if (jumpJustDown && !this.isBlocking) {
             if (isGrounded) {
                 this.setVelocityY(this.JUMP_VELOCITY);
             } else if (this.canDoubleJump) {
                 this.setVelocityY(this.JUMP_VELOCITY * 0.9);
                 this.canDoubleJump = false;
             }
        }
        
        // Combat
        const attackJustDown = Phaser.Input.Keyboard.JustDown(this.keys.Z) || Phaser.Input.Keyboard.JustDown(this.keys.J);

        if (attackJustDown && !this.isBlocking && isGrounded) {
             this.startAttack();
        }
    }

    startAttack() {
        this.isAttacking = true;
        this.weaponHitbox.body.enable = true;
        this.updateWeaponPosition();
        
        const offset = this.flipX ? -16 : 16;
        const sword = this.scene.add.sprite(this.x + offset, this.y, 'sword');
        sword.setFlipX(this.flipX);
        
        this.scene.time.delayedCall(150, () => {
             this.isAttacking = false;
             this.weaponHitbox.body.enable = false;
             sword.destroy();
        });
    }

    updateWeaponPosition() {
        const offset = this.flipX ? -12 : 12;
        this.weaponHitbox.x = this.x + offset;
        this.weaponHitbox.y = this.y;
    }

    takeDamage(amount, enemyX) {
        if (this.isBlocking) {
            amount = amount * 0.2; // 80% damage reduction
            const pushDir = this.x < enemyX ? -1 : 1;
            this.setVelocityX(pushDir * 150);
            this.setVelocityY(-100);
        } else {
            this.setTint(0xff0000);
            this.scene.time.delayedCall(200, () => this.clearTint());
            this.scene.cameras.main.shake(100, 0.01);
            const pushDir = this.x < enemyX ? -1 : 1;
            this.setVelocityX(pushDir * 200);
            this.setVelocityY(-150);
        }
        
        this.hp -= amount;
        this.scene.updateHP(this.hp);
        
        if (this.hp <= 0) {
            this.scene.restartGame();
        }
    }
}
