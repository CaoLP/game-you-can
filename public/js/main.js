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
var w_width = window.innerWidth;
var w_height = window.innerHeight;
var player_speed = 10;
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
	speed: 10,
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

		player_speed = 10;
		this.drop =  -100;
		this.swim_speed = 4;

		// Add gravity to the player to make it fall
		this.player.body.gravity.x = 0;
		var self = this;

		// Call the 'jump' function when the spacekey is hit
		var spaceKey = game.input.keyboard.addKey(
			Phaser.Keyboard.SPACEBAR);
		spaceKey.onDown.add(this.run, this);
		var FakeButton = document.getElementById('fake-btn');
			var FakeButtonClone = FakeButton.cloneNode(true);
		FakeButtonClone.addEventListener("click", function (event) {
			self.run();
		}, false);
		FakeButton.parentNode.replaceChild(FakeButtonClone, FakeButton);

	},

	update: function () {
		this.background.tilePosition.x -= 0.5;
		// If the player is out of the screen (too high or too low)
		// Call the 'restartGame' function
		if(this.swim_speed > 4)
			this.swim_speed --;
		if(player_speed > 10)
			player_speed-=2;
		//if(player_speed < 10) player_speed = 10;


		this.player.animations.currentAnim.speed = this.swim_speed;

		//game.physics.arcade.overlap(
		//	this.player, this.crocodile, this.gameLose, null, this);

		if (this.player.x < 90)
			this.gameLose();
		if (this.player.x > window.innerWidth) {
			this.gameWin();
		}

	},
	run: function () {
		if (this.player.body.gravity.x == 0) {
			this.player.body.gravity.x = this.drop;
		}
		//player_speed += player_speed*0.1;
		this.player.body.velocity.x = player_speed;
		if(this.swim_speed < 16){
			this.swim_speed += 2;
			this.player.animations.currentAnim.speed = this.swim_speed;
		}
		console.log([player_speed,this.swim_speed]);
	},
	newGame: function () {
		this.create();
		game.state.start('main');
	},
// Restart the game
	restartGame: function () {
		// Start the 'main' state, which restarts the game
		player_speed = 10;
		this.drop =  -100;
		this.swim_speed = 4;
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
			this.restartGame();
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
$('#guide').hide();
// If client is an Android Phone
if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
	$('#controller').show();
	var gameCode = window.location.hash.substr(1, 6);
	var socket = io.connect(server);
	var button;
	var y;
	var controller = document.getElementById('cllr');
	var ctx = controller.getContext('2d');
	ctx.fillStyle = "white";
	ctx.strokeStyle = "green";
	ctx.lineWidth = "1";

	ctx.fillRect(80, 100, 40, 150);
	ctx.strokeRect(80, 100 ,40, 150);


	ctx.fillRect(240, 100, 40, 150);
	ctx.strokeRect(240, 100 ,40, 150);

	// When server replies with initial welcome...
	socket.on('welcome', function (data) {
		// Send 'controller' device type with our entered game code
		socket.emit("device", {"type": "controller", "gameCode": gameCode});
	});
	// When game code is validated, we can begin playing...
	socket.on("connected", function (data) {
		$( "#press-me" ).bind( "tap", function( e ){
			socket.emit("accelerate", {'accelerate': 20});
		});

		controller.addEventListener("touchstart", function (event) {
		}, false);
		controller.addEventListener("touchmove", function (event) {
			event.preventDefault();
			var pt = getMouse(event, controller);

			console.log( pt.x);
			ctx.fillStyle = "red";
			if(pt.x >=60 && pt.x <=140 && pt.y >= 100 && pt.y <= 250){
				ctx.fillRect(80, 100, 40, pt.y-100);
				y = pt.y;
			}

			if(pt.x >=220 && pt.x <=400 && pt.y >= 100 && pt.y <= 250){
				ctx.fillRect(240, 100, 40, pt.y-100);
				y = pt.y;
			}

		}, false);
		controller.addEventListener("touchend", function (event) {
			ctx.fillStyle = "white";
			ctx.fillRect(80, 100, 40, 150);
			ctx.fillRect(240, 100, 40, 150);
			socket.emit("accelerate", {'accelerate': y/10});
		}, false);

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
	$('#guide').show();
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
		$('#guide').hide();
		$('#qrcode').hide();
		game.state.add('main', mainState, true);
	});
	// When the phone is touched, accelerate the vehicle
	socket.on("accelerate", function (accelerate) {
		console.log(accelerate);
		player_speed += accelerate;
		$("#fake-btn").click();
	});
	var game = new Phaser.Game(window.innerWidth, window.innerHeight);
}
function getMouse(e, canvas) {
	var html = document.body.parentNode,
	htmlTop = html.offsetTop,
	htmlLeft = html.offsetLeft;

	var stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingLeft'], 10) || 0;
	var stylePaddingTop = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingTop'], 10) || 0;
	var styleBorderLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderLeftWidth'], 10) || 0;
	var styleBorderTop = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderTopWidth'], 10) || 0;

	var element = canvas,
		offsetX = 0,
		offsetY = 0,
		mx, my;

	// Compute the total offset. It's possible to cache this if you want
	if (element.offsetParent !== undefined) {
		do {
			offsetX += element.offsetLeft;
			offsetY += element.offsetTop;
		} while ((element = element.offsetParent));
	}

	// Add padding and border style widths to offset
	// Also add the <html> offsets in case there's a position:fixed bar (like the stumbleupon bar)
	// This part is not strictly necessary, it depends on your styling
	offsetX += stylePaddingLeft + styleBorderLeft + htmlLeft;
	offsetY += stylePaddingTop + styleBorderTop + htmlTop;

	mx = e.changedTouches[0].pageX - offsetX;
	my = e.changedTouches[0].pageY - offsetY;

	// We return a simple javascript object with x and y defined
	return {
		x: mx,
		y: my
	};
};