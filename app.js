/*
 HexGL Phone Controller Demo
 rdevitt@artandlogic.com
 */

// Dependencies
var express = require('express');
var http = require('http');
var io = require('socket.io');
var crypto = require('crypto');

// Set up our app with Express framework
var app = express();

// Create our HTTP server
var server = http.createServer(app);

// Configure the app's document root to be HexGl/
app.use(
	"/",
	express.static("public/")
);

// Tell Socket.io to pay attention
io = io.listen(server);

// Tell HTTP Server to begin listening for connections on port 3250
server.listen(3250);

// Sockets object to save game code -> socked associations
var socketCodes = {};

// When a client connects...
io.sockets.on('connection', function(socket)
{
	// Confirm the connection
	socket.emit("welcome", {});
	console.log('welcome');

	// Receive the client device type
	socket.on("device", function(device)
	{
		console.log('device');
		console.log(device);
		// if client is a browser game
		if(device.type == "game")
		{
			// Generate a code
			var gameCode = crypto.randomBytes(3).toString('hex');

			// Ensure uniqueness
			while(gameCode in socketCodes)
			{
				gameCode = crypto.randomBytes(3).toString('hex');
			}

			// Store game code -> socket association
			socketCodes[gameCode] = io.sockets.sockets[socket.id];
			socket.gameCode = gameCode;

			// Tell game client to initialize
			//  and show the game code to the user
			socket.emit("initialize", gameCode);
		}
		// if client is a phone controller
		else if(device.type == "controller")
		{
			console.log('controller');
			// if game code is valid...
			if(device.gameCode in socketCodes)
			{
				// save the game code for controller commands
				socket.gameCode = device.gameCode;

				// initialize the controller
				socket.emit("connected", {});

				// start the game
				socketCodes[device.gameCode].emit("connected", {});
			}
			// else game code is invalid,
			//  send fail message and disconnect
			else
			{
				socket.emit("fail", {});
				socket.disconnect();
			}
		}
	});

	// send accelerate command to game client
	socket.on("accelerate", function(data)
	{
		var bAccelerate = data.accelerate;
		if(socket.gameCode && socket.gameCode in socketCodes)
		{
			console.log(bAccelerate);
			socketCodes[socket.gameCode].emit("accelerate",
				bAccelerate);
		}
	});

	// send turn command to game client
	socket.on("turn", function(data)
	{
		if(socket.gameCode && socket.gameCode in socketCodes)
		{
			socketCodes[socket.gameCode].emit("turn", data.turn);
		}
	});
});

// When a client disconnects...
io.sockets.on('disconnect', function(socket)
{
	// remove game code -> socket association on disconnect
	if(socket.gameCode && socket.gameCode in socketCodes)
	{
		delete socketCodes[socket.gameCode];
	}
});