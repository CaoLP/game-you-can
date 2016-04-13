var server = 'http://192.168.1.13:3250';

var qrcode = new QRCode("qrcode");
var roomURL = "http://192.168.1.13:3250/";
function makeCode(elText, gameCode) {
	if (elText.length == 0) {
		alert("Input a text");
		return;
	}
	qrcode.makeCode(elText + '#' + gameCode);
}
var w_width = window.innerWidth;
var w_height = window.innerHeight;
// Create our 'main' state that will contain the game
var mainState = {
	preload: function () {
		// Load the player sprite
		game.load.image("background", "assets/bg.png");
		game.load.image('pipe', 'assets/pipe.png');
		game.load.atlasJSONHash('player', 'assets/player.png', 'assets/player.json');
		game.load.atlasJSONHash('crocodile', 'assets/crocodile.png', 'assets/crocodile.json');
	},
	upKey: null,
	downKey: null,
	speed: 100,
	drop: -100,
	swim_speed: 4,
	create: function () {
		// Change the background color of the game to blue
		//game.stage.backgroundColor = '#71c5cf';
		game.stage.backgroundColor = '#172527';
		// Set the physics system
		game.physics.startSystem(Phaser.Physics.ARCADE);

		this.background = game.add.tileSprite(0, w_height/5, w_width, game.cache.getImage('background').height, "background");


		// Display the player at the position x=100 and y=245
		//this.player = game.add.sprite(200, w_height/2 + 30, 'player');

		//crocodile
		this.player = game.add.sprite(200, w_height/2 + 40, 'player', 'player/player-01.png');
		this.player.scale.setTo(0.5,0.5);
		this.player.animations.add('swim');
		this.player.animations.play('swim', 4, true);


		//crocodile
		this.crocodile = game.add.sprite(0, w_height/2, 'crocodile', 'crocodile/bite/0001.png');
		this.crocodile.animations.add('bite');
		//this.crocodile.animations.add('bite', Phaser.Animation.generateFrameNames('crocodile/bite/', 1, 2, '', 4), 10, true, false);
		this.crocodile.animations.play('bite', 2, true);

		// Add physics to the player
		// Needed for: movements, gravity, collisions, etc.
		game.physics.arcade.enable(this.player);
		game.physics.arcade.enable(this.crocodile);

		// Add gravity to the player to make it fall
		this.player.body.gravity.x = 0;
		var self = this;

		// Call the 'jump' function when the spacekey is hit
		var spaceKey = game.input.keyboard.addKey(
			Phaser.Keyboard.SPACEBAR);
		spaceKey.onDown.add(this.run, this);
		var FakeButton = document.getElementById('fake-btn');
		FakeButton.addEventListener("click", function (event) {
			self.run();
		}, false);
	},

	update: function () {
		this.background.tilePosition.x -= 0.5;
		// If the player is out of the screen (too high or too low)
		// Call the 'restartGame' function
		if(this.swim_speed > 4)
			this.swim_speed --;
		this.player.animations.currentAnim.speed = this.swim_speed;

		game.physics.arcade.overlap(
			this.player, this.crocodile, this.gameLose, null, this);

		if (this.player.x < 0)
			this.gameLose();
		if (this.player.x > window.innerWidth) {
			this.gameWin();
		}

	},
	run: function () {
		if (this.player.body.gravity.x == 0) {
			this.player.body.gravity.x = this.drop;
		}
		this.speed += 1;
		this.player.body.velocity.x = this.speed;
		if(this.swim_speed < 16){
			this.swim_speed+=2;
			this.player.animations.currentAnim.speed = this.swim_speed;
		}
	},
	newGame: function () {
		this.create();
		game.state.start('main');
	},
// Restart the game
	restartGame: function () {
		// Start the 'main' state, which restarts the game
		game.state.start('main');
	},
	gameWin: function () {
		var text = game.add.text(window.innerWidth / 2, window.innerHeight / 2, 'You Win [Press SPACE to restart]', 64);
		text.anchor.x = 0.5;
		text.anchor.y = 0.5;
		game.paused = true;
		var spaceKey = game.input.keyboard.addKey(
			Phaser.Keyboard.SPACEBAR);
		spaceKey.onDown.add(function () {
			game.paused = false;
			game.state.restart(true, true);
		}, this);
	},
	gameLose: function () {
		var text = game.add.text(window.innerWidth / 2, window.innerHeight / 2, 'You Lose [Press SPACE to restart]', 64);
		text.anchor.x = 0.5;
		text.anchor.y = 0.5;
		game.paused = true;
		var spaceKey = game.input.keyboard.addKey(
			Phaser.Keyboard.SPACEBAR);
		spaceKey.onDown.add(function () {
			game.paused = false;
			this.restartGame();
		}, this);
	}
};
// If client is an Android Phone
if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
	$('#controller').show();
	var gameCode = window.location.hash.substr(1);
	var socket = io.connect(server);
	var button;
	// When server replies with initial welcome...
	socket.on('welcome', function (data) {
		// Send 'controller' device type with our entered game code
		socket.emit("device", {"type": "controller", "gameCode": gameCode});
	});
	// When game code is validated, we can begin playing...
	socket.on("connected", function (data) {
		$( "#press-me" ).bind( "tap", function( e ){
			socket.emit("accelerate", {'accelerate': true});
		});

		//button = document.getElementById("press-me");
		//// Prevent touchmove event from cancelling the 'touchend' event above
		//button.addEventListener("click", function (event) {
		//	socket.emit("accelerate", {'accelerate': true});
		//}, false);

	});
	socket.on("fail", function () {
		alert("Failed to connect");
	});

} else {
	var socket = io.connect(server);

	// When initial welcome message, reply with 'game' device type
	socket.on('welcome', function (data) {
		socket.emit("device", {"type": "game"});
	});

	// We receive our game code to show the user
	socket.on("initialize", function (gameCode) {
		makeCode(roomURL, gameCode);
	});
	socket.on("connected", function (data) {
		$('#pc').show();
		game.state.add('main', mainState, true);
	});
	// When the phone is touched, accelerate the vehicle
	socket.on("accelerate", function (accelerate) {
		console.log(accelerate);
		$("#fake-btn").click();
	});

}
var resetEvent = function (key) {
	$(document).trigger(
		$.Event('keyup', {
			which: key,
			keyCode: key
		})
	);
};
var forward = function () {
	$(document).trigger($.Event('keydown', {
		which: 32,
		keyCode: 32
	}));
};
var game = new Phaser.Game(window.innerWidth, window.innerHeight);
