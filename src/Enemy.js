export default class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.body.setSize(12, 14);
        this.body.setOffset(2, 2);
        
        this.speed = 30;
        this.direction = 1; 
        
        this.setVelocityX(this.speed * this.direction);
    }

    update() {
        if (!this.active) return;
        
        // Simple patroll logic turning on block
        if (this.body.blocked.right) {
            this.direction = -1;
            this.setFlipX(true); // Assuming original stares left/right appropriately
        } else if (this.body.blocked.left) {
            this.direction = 1;
            this.setFlipX(false);
        }
        
        this.setVelocityX(this.speed * this.direction);
    }

    die() {
        this.body.enable = false;
        this.setTint(0xff0000);
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            y: this.y - 20,
            duration: 300,
            onComplete: () => this.destroy()
        });
    }
}
