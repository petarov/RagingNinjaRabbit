/**
 * Raging Ninja Rabbit - 2D RPG demo
 * https://github.com/petarov/RagingNinjaRabbit
 */

define(["src/config.js"], function(config) {

    // character animation 
    Crafty.c('CharAnims', {
        CharAnims: function() {
            var animSpeed = 200;
            // setup animations sequences
            this.requires("SpriteAnimation, Grid, Collision")
            .reel("walk_left", animSpeed, [ [0, 96], [32, 96], [64, 96] ])
            .reel("walk_right", animSpeed, [ [0, 144], [32, 144], [64, 144] ])
            .reel("walk_up", animSpeed, [ [0, 48], [32, 48], [64, 48] ])
            .reel("walk_down", animSpeed, [ [0, 0], [32, 0], [64, 0] ]);
        return this;
        }
    });
    
    // Teleport to room
    Crafty.bind("Teleport", function(portal) {
        _Globals.player.currentRoom.fromPortal = portal.id;
        _Globals.player.currentRoom.name = 'room' + portal.toRoom;
        _Globals.player.currentRoom.toPortal = portal.toPortal;
        
        Crafty("2D").each(function () {this.destroy();}) 

        Crafty.scene('game');
    }); 

    function Player(x, y, map) {
        var self = this;

        self.x = x;
        self.y = y;
        self.map = map;
        // console.log(map);
        self.items = [];
    }

    Player.prototype.init = function() {
        var self = this;

        // create character
        var entity = Crafty.e("2D, " + config.screen.render + ", player, CharAnims, Multiway, MouseFace")
        .attr({
            move: {left: false, right: false, up: false, down: false},
            x: this.x, y: this.y, z: 1,
            speed: 2.5,
            moving: false,
            goal: {reached: true, x: 0, y: 0}
        })
        .CharAnims()
        .bind("EnterFrame", function() {

            if (!this.goal.reached) {

                var x = this.x;
                var y = this.y;
                var oldx = x;
                var oldy = y;
                var cx = this.x + this.w / 2;
                var cy = this.y + this.h / 2;

                if (Math.abs(cx - this.goal.x) > 0.75) {
                    if (cx < this.goal.x) {
                        x += this.speed;
                    } else if (cx > this.goal.x) {
                        x -= this.speed;
                    }
                }

                if (Math.abs(cy - this.goal.y) > 0.95) {
                    if (cy < this.goal.y) {
                        y += this.speed;
                    } else if (cy > this.goal.y) {
                        y -= this.speed;
                    }
                }

                this.moving = true;

                var distx = this.goal.x - cx;
                var disty = this.goal.y - cy;
                if ((distx * distx + disty * disty) < 100) {
                    this.goal.reached = true;           
                }

                this.attr({x: x, y: y});

                // Hit obstacle
                if( this.hit('Obstacle') ) {
                    this.goal.reached = true;

                    this.attr({x: oldx, y: oldy});
                }

                // Hit portal
                var portals = this.hit('Portal');
                if (portals) {
                    this.goal.reached = true;

                    //console.log('portal %s', portals[0].obj.tiledprops.toPortal);
                    var portal = portals[0].obj.tiledprops;

                    if (portal.code) {
                        // TODO: pin required
                        Crafty.trigger('ShowMsg', 'Door is locked!');
                    } else {
                        Crafty.trigger('Teleport', portal);
                    }
                }

                // Hit item
                var potions = this.hit('Potion');
                if (potions) {
                    var col = potions[0].obj;
                    var potion = col.tiledprops;

                    // remove tile
                    var sprite = self.map.getTile(Math.floor(potion.spriteY), Math.floor(potion.spriteX), 'Tiles 2');
                    sprite.destroy();
                    // remove collision object
                    col.destroy();
                }
            }

            // If moving, adjust the proper animation and facing
            if (this.moving) {
                var anim = null;
                switch(this.getDirection()) {
                case this._directions.left:
                    anim = 'walk_left';
                    break;
                case this._directions.right:
                    anim = 'walk_right';
                    break;
                case this._directions.up:
                    anim = 'walk_up';
                    break;
                case this._directions.down:
                    anim = 'walk_down';
                    break;
                }

                if (anim) {
                    if (!this.isPlaying(anim))
                        this.animate(anim, -1); 
                }

                this.moving = false;
            } else {
                this.pauseAnimation();
            }
            
        })
        .bind("MouseUp", function(event) {
            this.goal.x = event.realX;
            this.goal.y = event.realY;
            this.goal.reached = false;
        })
        //.multiway(2, {W: -90, S: 90, D: 0, A: 180})
        .collision( [4, 30], [28, 30], [28, 48], [4, 48]);  

        this.entity = entity;
    };

    Player.prototype.getEntity = function() {
        return this.entity;
    };

    return {
        create: function(x, y, map) {
            return new Player(x, y, map);
        }
    };

});