window.onload = function() {
    var DEBUG = false;

    var game = new Phaser.Game(1000, 600, Phaser.AUTO, 'canvas', {preload: preload, create: create, update: update }, false, false);
    var background;

    var enemies;
    var enemiesGoingRight;
    var enemyBullets;
    var ufo;
    var ufoBullets;

    var cursors;
    var spaceBar;
    var K;
    var ctrl;

    var player;
    var playerBullets;
    var nextShootTime;

    var DIR_LEFT = -1;
    var DIR_RIGHT = 1;

    var scoreTextBox;
    var score;

    var maxEnemies;

    var livesTextBox;
    var playerLives;
    var livesIcons;

    var winningText;

    var splashScreen = {};
    var playerName;

    var victoryMessages = [
        "FLASH FOREVER!",
        "FLASH!\nSAVIOR OF THE\nUNIVERSE!",
        "KISS MY FLASH!",
        "MAY THE FLASH\nBE WITH YOU!"
    ];

    var turn;
    var FRAME_SKIP = 5;

    var levelTextBox;
    var level;
    var gameover;
    var gameStarted;

    function preload () {
        game.load.image('player', 'assets/pure_defender_2.png');
        game.load.image('disk', 'assets/evil_disk_lords.png');
        game.load.image('floppy', 'assets/evil_floppy_lords.png');
        game.load.image('bullet', 'assets/bullet_usb.png');
        game.load.image('disk_bullet', 'assets/disk.png');
        game.load.image('ufo_bullet', 'assets/bullet_ufo.png');
        game.load.image('background', 'assets/backdrop.jpg');

        game.load.spritesheet('explosion', 'assets/explosion.png', 36, 36, 18);
        game.load.spritesheet('ufo', 'assets/ufo.png', 64, 50);

        game.load.audio('explosion', ['sounds/explosion.wav']);
        game.load.audio('enemy_killed', ['sounds/invaderkilled.wav']);
        game.load.audio('bullet_sound', ['sounds/shoot.wav']);
    }

    function setUpGame() {

        background = game.add.tileSprite(0, 0, game.world.width, game.world.height, 'background');

        gameover = false;
        playerLives = 5;
        score = 0;
        nextShootTime = 0;
        level = 0;
        turn = 0;
        livesIcons = [];

        destroySplashScreen();
        gameStarted = true;
        cursors = game.input.keyboard.createCursorKeys();
        spaceBar = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
        K = game.input.keyboard.addKey(Phaser.Keyboard.K);
        ctrl = game.input.keyboard.addKey(Phaser.Keyboard.CONTROL);

        // Actors

        player = game.add.sprite(game.world.centerX, game.world.height - 10, 'player');
        player.scale.set(1.5, 1.5);
        player.anchor.setTo(0.5, 0.5);
        game.physics.arcade.enable(player);
        player.body.collideWorldBounds = true;

        enemies = game.add.group();
        enemies.enableBody = true;
        enemies.physicsBodyType = Phaser.Physics.ARCADE;

        createEnemies(level);

        // Bullets
        playerBullets = game.add.group();
        playerBullets.enableBody = true;
        playerBullets.physicsBodyType = Phaser.Physics.ARCADE;

        enemyBullets = game.add.group();
        enemyBullets.enableBody = true;
        enemyBullets.physicsBodyType = Phaser.Physics.ARCADE;

        ufoBullets = game.add.group();
        ufoBullets.enableBody = true;
        ufoBullets.physicsBodyType = Phaser.Physics.ARCADE;

        initializeBullets();


        // Game UI

        scoreTextBox = game.add.text(2, 2, 'Score: 0', {font: "32px 'Retro',sans-serif", fill: '#FFF'});
        livesTextBox = game.add.text(game.world.width - 160, 20, 'Lives:', {
            font: "32px 'Retro',sans-serif",
            fill: '#FFF'
        });
        livesTextBox.anchor.setTo(1, 0.5);
        levelTextBox = game.add.text(game.world.centerX + 20, 20, 'Level: 1', {font: "32px 'Retro',sans-serif", fill: '#FFF'});
        levelTextBox.anchor.setTo(1, 0.5);

        initializeLivesIcons();
    }

    function destroySplashScreen() {
        splashScreen.startButton.kill();
    }

    function create () {
        background = game.add.tileSprite(0, 0, game.world.width, game.world.height, 'background');
        displaySplashScreen();
    }

    function displaySplashScreen() {

        splashScreen.startButton = game.add.text(game.world.centerX, 300, "START", {
            font: "64px 'Retro',sans-serif",
            fill: "#080",
            backgroundColor: "#1D1"
        });
        splashScreen.startButton.anchor.setTo(0.5, 0.5);
        splashScreen.startButton.inputEnabled = true;

        splashScreen.startButton.events.onInputDown.add(setUpGame);
    }

    function initializeLivesIcons() {
        for (var i = 0; i < playerLives; i++) {
            var currentLifeSprite = game.add.sprite(game.world.width - 30 * (playerLives - i - 1), 20, 'player');
            currentLifeSprite.anchor.setTo(1, 0.5);
            currentLifeSprite.scale.set(0.75, 0.75);
            livesIcons.push(currentLifeSprite);
        }
    }

    function update () {
        if (gameStarted) {
            game.physics.arcade.overlap(playerBullets, enemies, enemyBlowUp, null, this);
            game.physics.arcade.overlap(enemyBullets, player, playerBlowUp, null, this);
            game.physics.arcade.overlap(playerBullets, enemyBullets, bulletBlowUp, null, this);

            game.physics.arcade.overlap(playerBullets, ufo, ufoBlowUp, null, this);
            game.physics.arcade.overlap(ufoBullets, player, playerBlowUp, null, this);
            game.physics.arcade.overlap(playerBullets, ufoBullets, bulletBlowUp, null, this);

            if (DEBUG) {
                game.debug.body(player, "#ffffff", false);
                game.debug.body(ufo, '#ffffff', false);
                enemies.forEachAlive(game.debug.body, game.debug, "#ffffff", false);
                playerBullets.forEachAlive(game.debug.body, game.debug, "#ffffff", false);
                enemyBullets.forEachAlive(game.debug.body, game.debug, "#ffffff", false);
                ufoBullets.forEachAlive(game.debug.body, game.debug, "#ff0000", false);

                if (ctrl.isDown && K.isDown) {
                    enemies.forEachAlive(enemyKill, this);
                }
            }

            if (!gameover) {
                updatePlayer();
                updateEnemies();
            }
        }
    }

// PLAYER LOGIC

    function updatePlayer() {
        var PLAYER_SPEED = 200;
        player.body.velocity.x = 0;
        if (!gameover) {
            if (cursors.left.isDown) {
                player.body.velocity.x = DIR_LEFT * PLAYER_SPEED;
            } else if (cursors.right.isDown) {
                player.body.velocity.x = DIR_RIGHT * PLAYER_SPEED;
            }
            if (spaceBar.isDown) {
                playerShoot(player.x - 6, player.y - 44, -300);
            }
        }
    }

    function playerShoot() {
        if (game.time.now > nextShootTime) {
            var shoot = game.add.audio('bullet_sound');
            shoot.play();
            shootBullet(player.x - 6, player.y - 44, -200, playerBullets);
            nextShootTime = game.time.now + 900;
        }
    }

// ENEMY LOGIC

    function createEnemies(level) {

        initializeUfo();

        var numRows = 11;
        var numCols = 5;
        for (var rowPos = 0; rowPos < numRows; rowPos++) {
            for (var colPos = 0; colPos < numCols; colPos++) {
                var x = 60 * rowPos + 50;
                var y = 50 * colPos + 15 * level + 50;
                var spriteImage = colPos < 2 ? 'floppy' : 'disk';
                var currEnemy = enemies.create(x, y, spriteImage);
                if (spriteImage === 'floppy') {
                    currEnemy.scale.set(0.8, 0.8);
                } else {
                    currEnemy.scale.set(0.75, 0.75);
                }
                currEnemy.anchor.setTo(0.5, 0.5);
                game.physics.arcade.enable(currEnemy);
                currEnemy.body.velocity.x = DIR_RIGHT * 60;
            }
        }
        maxEnemies = numRows * numCols;
        enemiesGoingRight = true;
    }

    function updateEnemies() {
        turn++;
        FRAME_SKIP = calculateFrameSkip();
        if (turn % FRAME_SKIP === 1) {
            stopEnemies();
        } else if (turn % FRAME_SKIP === 0) {
            updateEnemySpeed();
        } else if (turn > 10000) {
            turn = 0;
        }
        enemyShoot();
        maybeReverseDirection();

        if (ufo.alive) {
            ufoShoot();
        }
        else {
            ufoSpawn();
        }
    }

    function calculateFrameSkip() {
        var aliveEnemies = enemies.countLiving();
        if (aliveEnemies > maxEnemies/2) {
            return 5;
        } else if (aliveEnemies > maxEnemies/3) {
            return 4;
        } else if (aliveEnemies > maxEnemies/4) {
            return 3;
        } else {
            return 2;
        }

    }

    function maybeReverseDirection() {
        var bounds = enemies.getBounds();
        if (enemiesGoingRight) {
            var right = bounds.right;
            if (right >= game.world.bounds.right - 10) {
                reverseEnemyDirection();
                dropDown();
            }
        } else {
            var left = bounds.left;
            if (left <= game.world.bounds.left + 10) {
                reverseEnemyDirection();
                dropDown();
            }
        }
    }

    function reverseEnemyDirection() {
        enemiesGoingRight = !enemiesGoingRight;
        enemies.forEach(function(enemy) {
            enemy.body.velocity.x = -enemy.body.velocity.x;
        });
    }

    function dropDown() {
        enemies.forEach(function(enemy) {
            enemy.y = enemy.y + 15;
        });
        if (enemies.getBounds().bottom >= player.top - 5) {
            gameOver();
        }
    }

    function stopEnemies() {
        enemies.forEach(function (enemy) {
            enemy.body.velocity.x = 0;
        });
    }

    function enemyShoot() {
        var enemy;
        if (!gameover && game.time.now % 103 == 0) {
            enemy = Phaser.Math.getRandom(enemies.children.filter(function(e) {
                return e.alive;
            }));
            shootBullet(enemy.x, enemy.y, 100, enemyBullets);
        }
    }

    function updateEnemySpeed() {
        var aliveEnemies = enemies.countLiving();
        var MAX_SPEED = 750;
        var quotient = 1 - (aliveEnemies/maxEnemies);
        var diff = maxEnemies - aliveEnemies;
        var newSpeed = (160*quotient + 60);
        if (aliveEnemies <= 3) {
            newSpeed = MAX_SPEED/aliveEnemies;
        }

        newSpeed = newSpeed * FRAME_SKIP;
        if (!enemiesGoingRight) {
            newSpeed = -newSpeed;
        }
        enemies.forEach(function(enemy) {
            enemy.body.velocity.x = newSpeed;
        });
    }

// UFO LOGIC

    function initializeUfo() {
        ufo = game.add.sprite(-200, -200, 'ufo');
        ufo.exists = false;
        ufo.alive = false;
        ufo.visible = false;
    }

    function ufoSpawn() {
        if (turn % 999 === 0) {
            ufo = game.add.sprite(game.world.width, 50, 'ufo');
            ufo.name = "ufo";
            ufo.exists = true;
            ufo.alive = true;
            ufo.visible = true;
            ufo.anchor.setTo(0.5, 0.5);
            ufo.animations.add('ufoAnimation');
            ufo.play('ufoAnimation', 4, true, false);
            game.physics.arcade.enable(ufo);
            ufo.body.velocity.x = -60;
            ufo.checkWorldBounds = true;
            ufo.events.onOutOfBounds.add(spriteKill, this);
        }
    }

    function ufoShoot() {
        if (!gameover && game.time.now % 153 == 0) {
            shootBullet(ufo.x, ufo.y, 250, ufoBullets);
        }
    }

    function ufoBlowUp(ufo, bullet) {
        enemyBlowUp(bullet, ufo);
    }

// BULLET LOGIC

    function initializeBullets() {
        var playerBulletMax = 10;
        var enemyBulletMax = 5;
        for (var i = 0; i < playerBulletMax; i++) {
            spawnBullet(i, playerBullets, 'bullet');
        }
        for (var i = 0; i < enemyBulletMax; i++) {
            spawnBullet(i, enemyBullets, 'disk_bullet');
            spawnBullet(i, ufoBullets, 'ufo_bullet');
        }
    }

    function shootBullet(spriteX, spriteY, velocity, bulletGroup) {
        var bullet = bulletGroup.getFirstExists(false);
        if (bullet) {
            bullet.reset(spriteX, spriteY);
            bullet.body.velocity.y = velocity;
        }
    }

    function spawnBullet(count, bulletGroup, icon) {
        var bullet = bulletGroup.create(-50,-50, icon);
        bullet.name = icon + " " + count;
        bullet.exists = false;
        bullet.visible = false;
        bullet.checkWorldBounds = true;
        bullet.events.onOutOfBounds.add(spriteKill, this);
    }

    // COLLISION DETECTION

    function bulletBlowUp(playerBullet, enemyBullet) {
        spriteKill(enemyBullet);
        spriteKill(playerBullet);

        var factor;
        if (enemyBullet.key === 'ufo_bullet') {
            factor = 1.2;
        }
        else {
            factor = 0.5;
        }
        explodeEnemyAnimation(playerBullet, factor, updateScore(enemyBullet));
    }

    function playerBlowUp(player, bullet) {
        clearAllEnemyBullets();
        explodePlayerAnimation();
        spriteKill(bullet);
        playerKill();
    }

    function playerKill() {
        playerLives = playerLives - 1;
        spriteKill(livesIcons[playerLives]);
        if (playerLives > 0) {
            player.x = 100;
        } else {
            spriteKill(player);
            gameOver();
        }
    }

    function clearAllEnemyBullets() {
        enemyBullets.forEachAlive(function(bullet) {
            spriteKill(bullet);
        });
        ufoBullets.forEachAlive(function(bullet) {
            spriteKill(bullet);
        })
    }

    function enemyBlowUp(bullet, enemy) {
        var factor;
        spriteKill(bullet);
        enemyKill(enemy);
        if (enemy.key === 'ufo') {
            factor = 2;
        }
        else {
            factor = 1;
        }
        explodeEnemyAnimation(enemy, factor, updateScore(enemy));
    }

    function spriteKill(sprite) {
        sprite.kill();
    }

    function enemyKill(enemy) {
        spriteKill(enemy);
        if (enemies.countLiving() === 0) {
            displayWinningText();
        }
    }

// ANIMATION

    function explodeAnimation(x, y, scale) {
        var explosion;
        explosion = game.add.sprite(x, y, 'explosion');
        explosion.scale.set(scale, scale);
        explosion.anchor.setTo(0.5, 0.5);
        explosion.animations.add('boom');
        explosion.play('boom', 30, false, true);
    }

    function scoreAnimation(x, y, value) {
        var scoreText = game.add.text(x, y, '+' + value, { font: "12px 'Retro',sans-serif", fill: '#00FF00' });
        scoreText.anchor.setTo(0.5, 0.5);
        scoreText.shadowColor = "#FF0000";
        scoreText.shadowOffsetX = 1;
        scoreText.shadowOffsetY = 1;

        game.time.events.add(500, scoreText.destroy, scoreText);
    }

    function explodePlayerAnimation() {
        var explosionSound = game.add.audio('explosion');
        explosionSound.play();
        explodeAnimation(player.x, player.y, 3);
        for (var i = -1; i < 2; i++){
            for (var j = -1; j < 2; j ++) {
                explodeAnimation(player.x+17*i, player.y+17*j, 0.5);
            }
        }
    }

    function explodeEnemyAnimation(enemy, scaleFactor, score) {
        var enemyExplosionSound = game.add.audio('enemy_killed');
        enemyExplosionSound.play();

        explodeAnimation(enemy.x, enemy.y, scaleFactor);
        scoreAnimation(enemy.x, enemy.y, score);
    }

// GENERAL GAME LOGIC

    function getScore(killed) {
        switch(killed.key) {
            case "ufo":
                return Math.floor(Math.random() * 200 + 201);
            case "ufo_bullet":
                return 20;
            case "floppy":
                return 200;
            case "disk":
                return 100;
            case "disk_bullet":
                return 10;
            default:
                return 0;
        }
    }

    function updateScore(killed) {
        var killScore = getScore(killed);
        score += killScore;
        scoreTextBox.text = 'Score: ' + score;
        return killScore;
    }

    function gameOver() {
        clearAllEnemyBullets(); //because fuck dying at the end
        var gameOverText = game.add.text(game.world.centerX, game.world.centerY, 'GAME OVER', { font: "64px 'Retro',sans-serif", fill: '#F00' });
        gameOverText.anchor.setTo(0.5, 0.5);

        splashScreen.startButton = game.add.text(game.world.centerX, 400, "PLAY AGAIN", {
            font: "64px 'Retro',sans-serif",
            fill: "#080",
            backgroundColor: "#1D1"
        });
        splashScreen.startButton.anchor.setTo(0.5, 0.5);
        splashScreen.startButton.inputEnabled = true;
        splashScreen.startButton.events.onInputDown.add(setUpGame);

        player.body.velocity.x = 0;
        stopEnemies();
        gameover = true;
    }

    function displayWinningText() {
        clearAllEnemyBullets();
        spriteKill(ufo);
        player.body.velocity.x = 0;
        var victoryString = victoryMessages[Math.floor(Math.random() * victoryMessages.length)];
        winningText = game.add.text(game.world.centerX, game.world.centerY, victoryString, { font: "64px 'Retro',sans-serif", fill : '#F3742F', align: 'center'});
        winningText.anchor.setTo(0.5, 0.5);
        gameover = true;
        var timer = game.time.create(1000, false);
        timer.add(3000, startNewLevel, this, null);
        timer.start();
    }

    function startNewLevel() {
        level += 1;
        levelTextBox.text = "Level: " + (level + 1);
        gameover = false;
        enemies.forEachDead(function(deadEnemy) {
            enemies.remove(deadEnemy, true);
        });
        createEnemies(level);
        player.x = game.world.centerX;
        winningText.kill();
    }

};
