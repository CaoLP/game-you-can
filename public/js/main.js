var server = 'http://192.168.1.200:3250';

var qrcode = new QRCode("qrcode");
var roomURL = "http://192.168.1.200:3250/";
function makeCode(elText, gameCode) {
	if (elText.length == 0) {
		alert("Input a text");
		return;
	}
	qrcode.makeCode(elText + '#' + gameCode);
}

// Create our 'main' state that will contain the game
var mainState = {
	preload: function () {
		// Load the bird sprite
		game.load.image('bird', 'assets/bird.png');
		game.load.image('pipe', 'assets/pipe.png');
		game.load.atlasJSONHash('crocodile', 'assets/crocodile.png', 'assets/crocodile.json');
	},
	upKey: null,
	downKey: null,
	speed: 100,
	drop: -100,
	create: function () {
		// Change the background color of the game to blue
		game.stage.backgroundColor = '#71c5cf';

		// Set the physics system
		game.physics.startSystem(Phaser.Physics.ARCADE);

		// Display the bird at the position x=100 and y=245
		this.bird = game.add.sprite(100, 245, 'bird');


		//crocodile
		this.crocodile = game.add.sprite(100, 245, 'crocodile', 'crocodile/bite/0001.png');
		this.crocodile.animations.add('bite', Phaser.Animation.generateFrameNames('crocodile/bite/', 1, 2, '', 4), 10, true, false);
		this.crocodile.animations.play('bite');

		// Add physics to the bird
		// Needed for: movements, gravity, collisions, etc.
		game.physics.arcade.enable(this.bird);

		// Add gravity to the bird to make it fall
		this.bird.body.gravity.x = 0;
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
		// If the bird is out of the screen (too high or too low)
		// Call the 'restartGame' function
		if (this.bird.x < 0)
			this.restartGame();
		if (this.bird.x > window.innerWidth) {
			this.gameWin();
		}
	},
	run: function () {
		if (this.bird.body.gravity.x == 0) {
			this.bird.body.gravity.x = this.drop;
		}
		this.speed += 1;
		this.bird.body.velocity.x = this.speed;
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
		var text = game.add.text(window.innerWidth / 2, window.innerHeight / 2, 'You Win', 64);
		text.anchor.x = 0.5;
		text.anchor.y = 0.5;
		game.paused = true;
		var spaceKey = game.input.keyboard.addKey(
			Phaser.Keyboard.SPACEBAR);
		spaceKey.onDown.add(function () {
			game.paused = false;
			game.state.restart(true, true);
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
game.state.add('main', mainState, true);
