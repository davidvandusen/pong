/**
 * @projectDescription Pong: The classic game, written in Javascript
 * @author  David VanDusen
 * @version 0.3.2
 */
define(["domReady", "helper/bindable", "helper/sound", "helper/keyboard"], function (domReady, Bindable, Sound, keyboard) {
	"use strict";

	/**
	 * PONG is the global namespace for all the objects and events used
	 * throughout the game. It is an instance of Bindable, which provides
	 * methods to bind and trigger events on the object.
	 */
	var PONG = new Bindable();

	/**
	 * PONG.config contains all the configurable variables in the program.
	 */
	PONG.config = {
		gameTitle : "PONG",
		fps : 60,
		goalDelay : 1000,
		resetDelay : 5000,
		gamePoint : 11,
		background : "#000000",
		foreground : "#ffffff",
		ball : {
			size : 0.015,
			angleRestriction : Math.PI * 2 / 3,
			minVelocity: 0.4,
			maxVelocity: 0.6
		},
		paddle : {
			offset : 0.1,
			speed : 0.85,
			width : 0.0175,
			height : 0.07
		},
		net : {
			width : 0.003,
			dashHeight : 0.03,
			dashHeightRatio : 2.25
		},
		scores : {
			top : 0.05,
			fontSize : 0.2,
			fontFace : "'Agency FB', 'Courier New', Courier, monospace"
		},
		modal : {
			containerId : "container",
			clearId : "clear-button",
			clearText : "[X] CLEAR TOP SCORES"
		},
		highScores : {
			maxNum : 5,
			prompt : "NEW HIGH SCORE!\nENTER YOUR NAME: ",
			heading : "TOP SCORES:\n"
		},
		hub : {
			left : 0.015,
			top : 0.94,
			fontSize : 0.04,
			fontFace : "'Courier New', Courier, monospace",
			startMsg : "INSERT COIN"
		},
		controls : {
			description : "PRESS ENTER TO BEGIN\nP1: SHIFT=UP CTRL=DOWN\nP2: ↑=UP ↓=DOWN",
			keycodes : {
				start : 13,
				players : [
					{
						raise : 16,
						lower : 17
					},
					{
						raise : 38,
						lower : 40
					}
				]
			}
		}
	};

	/**
	 * When the init event is fired, the main game loop is started. An
	 * interval is set to trigger the tick event for each frame of the game.
	 * The simulation and drawing are bound to this tick event.
	 */
	PONG.bind("init", function initGame() {
		PONG.triggerEvent("reset");
		window.setInterval(function () { PONG.triggerEvent("tick"); }, 1000 / PONG.config.fps);
	});

	/**
	 * The enter key triggers the event that starts the game.
	 */
	PONG.bind("init", function bindStartKey() {
		document.addEventListener("keypress", function (evt) {
			if (evt.keyCode !== PONG.config.controls.keycodes.start) { return; }
			if (PONG.gamePhase !== PONG.gamePhases.title) { return; }
			PONG.triggerEvent("start");
		}, false);
	});

	/**
	 * PONG.gamePhase reflects the overall state of the program.
	 */
	PONG.gamePhases = {
		setup : -1,
		title : 0,
		gameplay : 1,
		gameover : 2
	};
	PONG.gamePhase = PONG.gamePhases.setup;
	PONG.bind("reset", function setPhase() { PONG.gamePhase = PONG.gamePhases.title; });
	PONG.bind("start", function setPhase() { PONG.gamePhase = PONG.gamePhases.gameplay; });
	PONG.bind("gameOver", function setPhase() { PONG.gamePhase = PONG.gamePhases.gameover; });

	/**
	 * PONG.startTime stores the time that the gameplay started.
	 */
	PONG.startTime = 0;
	PONG.bind("start", function startTimer() { PONG.startTime = new Date(); });

	/**
	 * PONG.endTime stores the time that the game was won.
	 */
	PONG.endTime = 0;
	PONG.bind("gameOver", function endTimer() { PONG.endTime = new Date(); });

	/**
	 * PONG.ball represents the ping-pong ball object.
	 */
	PONG.ball = {
		size : PONG.config.ball.size,
		angleRestriction : PONG.config.ball.angleRestriction,
		minVelocity : PONG.config.ball.minVelocity,
		maxVelocity : PONG.config.ball.maxVelocity,
		x : 0,
		y : 0,
		a : 0,
		velocity : 0,
		inMotion : false,
		width : function () { return this.size; },
		height : function () { return this.size * PONG.canvas.aspectRatio(); },
		top : function () { return this.y - (this.height() / 2); },
		right : function () { return this.x + (this.width() / 2); },
		bottom : function () { return this.y + (this.width() / 2); },
		left : function () { return this.x - (this.height() / 2); },
		dx : function () { return this.velocity / PONG.config.fps * Math.cos(this.a); },
		dy : function () { return this.velocity / PONG.config.fps * Math.sin(this.a) * -1; },
		setAngle : function (a) {
			while (a < 0) {
				a += 2 * Math.PI;
			}
			while (a > 2 * Math.PI) {
				a -= 2 * Math.PI;
			}
			this.a = a;
		},
		reflectX : function () { this.setAngle(-1 * this.a); },
		start : function () { this.inMotion = true; },
		stop : function () { this.inMotion = false; },
		move : function () {
			if (!this.inMotion) { return; }
			this.x += this.dx();
			this.y += this.dy();
		},
		randomVelocity : function () {
			this.velocity = (this.maxVelocity - this.minVelocity) * Math.random() + this.minVelocity;
		},
		serve : function (service) {
			var a;
			a = (Math.PI / 2) + (Math.random() * this.angleRestriction) + (Math.PI - this.angleRestriction) / 2;
			this.randomVelocity();
			this.y = Math.random() * (1 - 2 * this.size) + this.size;
			this.x = Math.random() * 0.5;
			service = (service === 0 || service === 1) ? service : 0;
			switch (service) {
			case 0:
				if (a > Math.PI * 0.5 && a < Math.PI * 1.5) {
					a += Math.PI;
				}
				break;
			case 1:
				this.x += 0.5;
				if (a < Math.PI * 0.5 || a > Math.PI * 1.5) {
					a += Math.PI;
				}
				break;
			}
			this.setAngle(a);
			this.start();
		}
	};

	/**
	 * When the start event is fired, a coin toss determines who serves.
	 */
	PONG.bind("start", function service() {
		window.setTimeout(function () { PONG.ball.serve(Math.round(Math.random())); }, PONG.config.goalDelay);
	});

	/**
	 * When the bounce event is fired, the ball gets reflected across the
	 * x-axis.
	 */
	PONG.bind("bounce", function bounce() { PONG.ball.reflectX(); });

	/**
	 * When the hit event is fired, the ball gets returned to the other
	 * player. The angle that it is returned at is dependent on where on the
	 * paddle the ball hit. If the ball hits closer to the center of the
	 * paddle, it is reflected closer to the x-axis, or closer to the y-axis
	 * if it hits close to the ends.
	 */
	PONG.bind("hit", function hit() {
		PONG.ball.randomVelocity();
		if (PONG.ball.dx() > 0) {
			PONG.ball.setAngle(Math.PI + (PONG.ball.y - PONG.players[1].paddle.y) / (PONG.players[1].paddle.height + 2 * PONG.ball.height()) * Math.PI);
			return;
		}
		if (PONG.ball.dx() < 0) {
			PONG.ball.setAngle((PONG.players[0].paddle.y - PONG.ball.y) / (PONG.players[0].paddle.height + 2 * PONG.ball.height()) * Math.PI);
			return;
		}
	});

	/**
	 * PONG.Paddle is a constructor for each player's paddle.
	 */
	PONG.Paddle = function (x) {
		this.speed = PONG.config.paddle.speed / PONG.config.fps;
		this.width = PONG.config.paddle.width;
		this.height = PONG.config.paddle.height;
		this.x = x;
		this.y = 0.5;
	};
	PONG.Paddle.prototype.top = function () { return this.y - (this.height / 2); };
	PONG.Paddle.prototype.right = function () { return this.x + (this.width  / 2); };
	PONG.Paddle.prototype.bottom = function () { return this.y + (this.height / 2); };
	PONG.Paddle.prototype.left = function () { return this.x - (this.width  / 2); };
	PONG.Paddle.prototype.reset = function () { this.y = 0.5; };
	PONG.Paddle.prototype.raise = function () {
		if (PONG.gamePhase !== PONG.gamePhases.gameplay) { return; }
		var y = this.y - this.speed;
		this.y = (y < 0) ? 0 : y;
	};
	PONG.Paddle.prototype.lower  = function () {
		if (PONG.gamePhase !== PONG.gamePhases.gameplay) { return; }
		var y = this.y + this.speed;
		this.y = (y > 1) ? 1 : y;
	};

	/**
	 * PONG.Player is a constructor for the player objects.
	 */
	PONG.Player = function (name, x) {
		this.name = name;
		this.score = 0;
		this.paddle = new PONG.Paddle(x);
	};

	/**
	 * PONG.players is an array containing two objects - one for each player.
	 */
	PONG.players = [
		new PONG.Player("Player 1", PONG.config.paddle.offset),
		new PONG.Player("Player 2", 1 - PONG.config.paddle.offset)
	];

	/**
	 * When the reset event is fired, the players' paddles and scores are reset.
	 */
	PONG.bind("reset", function resetPlayers() {
		var i;
		for (i = 0; i < PONG.players.length; i++) {
			PONG.players[i].paddle.reset();
			PONG.players[i].score = 0;
		}
	});

	/**
	 * When the tick event is fired, the simulation is run. While the game is
	 * running, it fires events depending on the position and trajectory of
	 * the ball. If one of either players' control keys are down, the
	 * appropriate paddle is moved.
	 */
	PONG.bind("tick", function simulate() {
		if (PONG.gamePhase !== PONG.gamePhases.gameplay) { return; }
		var i;
		for (i = 0; i < PONG.players.length; i++) {
			if (keyboard.downKeys[PONG.config.controls.keycodes.players[i].raise]
				&& !(keyboard.downKeys[PONG.config.controls.keycodes.players[i].lower])
			) {
				PONG.players[i].paddle.raise();
			}
			if (keyboard.downKeys[PONG.config.controls.keycodes.players[i].lower]
				&& !(keyboard.downKeys[PONG.config.controls.keycodes.players[i].raise])
			) {
				PONG.players[i].paddle.lower();
			}
		}
		if (PONG.ball.inMotion) {
			if ((PONG.ball.dx() > 0
					&& PONG.ball.right()  > PONG.players[1].paddle.left()
					&& PONG.ball.right()  < PONG.players[1].paddle.right()
					&& PONG.ball.bottom() > PONG.players[1].paddle.top()
					&& PONG.ball.top()    < PONG.players[1].paddle.bottom())
				|| (PONG.ball.dx() < 0
					&& PONG.ball.left()   > PONG.players[0].paddle.left()
					&& PONG.ball.left()   < PONG.players[0].paddle.right()
					&& PONG.ball.bottom() > PONG.players[0].paddle.top()
					&& PONG.ball.top()    < PONG.players[0].paddle.bottom())
			) {
				PONG.triggerEvent("hit");
			}
			if ((PONG.ball.dy() < 0 && PONG.ball.top() < 0)
				|| (PONG.ball.dy() > 0 && PONG.ball.bottom() > 1)
			) {
				PONG.triggerEvent("bounce");
			}
			if (PONG.ball.right() > 1 || PONG.ball.left() < 0) {
				PONG.triggerEvent("goal");
			}
			PONG.ball.move();
		}
	});

	/**
	 * When the goal event is fired, the ball is stopped. The scoring player
	 * is determined and awarded a point. If the scoring player has enough
	 * points to win the game and has at least two points more than their
	 * opponenet, the gameOver event is fired. Otherwise the ball is served
	 * again from their side of the table.
	 */
	PONG.bind("goal", function goal() {
		var player;
		PONG.ball.stop();
		player = (PONG.ball.dx() > 0) ? 0 : 1;
		PONG.players[player].score++;
		if (PONG.players[player].score >= PONG.config.gamePoint
			&& Math.abs(PONG.players[0].score - PONG.players[1].score) >= 2
		) {
			PONG.triggerEvent("gameOver");
		} else {
			window.setTimeout(function () { PONG.ball.serve(player); }, PONG.config.goalDelay);
		}
	});

	/**
	 * PONG.highScores handles the storage and retrieval of the high scores.
	 */
	PONG.highScores = {
		highScores : "[]",
		scores : function () {
			var scores;
			try {
				scores = window.localStorage.getItem("PONG.highScores");
			} catch (e) {
				scores = this.highScores;
			}
			if (scores) {
				scores = JSON.parse(scores);
				scores = scores.sort(function (a, b) { return (a.score - b.score); });
				return scores;
			} else {
				return [];
			}
		},
		add : function (n, s) {
			var scores = this.scores();
			if (!this.isHighScore(s)) { return; }
			if (scores.length >= PONG.config.highScores.maxNum) {
				scores.pop();
			}
			scores.push({
				name : n,
				score : s
			});
			try {
				window.localStorage.setItem("PONG.highScores", JSON.stringify(scores));
			} catch (e) {
				this.highScores = JSON.stringify(scores);
			}
		},
		isHighScore : function (s) {
			var scores = this.scores();
			if (scores.length >= PONG.config.highScores.maxNum) {
				return (s < scores[scores.length - 1].score);
			} else {
				return true;
			}
		},
		clear : function () {
			try {
				window.localStorage.setItem("PONG.highScores", "[]");
			} catch (e) {
				this.highScores = "[]";
			}
			PONG.triggerEvent("reset");
		}
	};

	/**
	 * When the scoreSubmit event is fired, the new high score is saved and
	 * the game is reset.
	 */
	PONG.bind("scoreSubmit", function scoreSubmit() {
		var name, score;
		score = (PONG.endTime - PONG.startTime) / 1000;
		name = PONG.modal.elements.playerInput.value;
		PONG.highScores.add(name, score);
		PONG.triggerEvent("reset");
	});

	/**
	 * PONG.modal manages the display of the modal windows used in the game.
	 */
	PONG.modal = {
		elements : {
			container : document.createElement("div"),
			inner : document.createElement("div"),
			header : document.createElement("h1"),
			controls : document.createElement("pre"),
			leaders : document.createElement("pre"),
			time : document.createElement("pre"),
			highscore : document.createElement("pre"),
			clear : document.createElement("pre"),
			playerInput : document.createElement("input")
		},
		empty : function () {
			while (this.elements.inner.hasChildNodes()) {
				this.elements.inner.removeChild(this.elements.inner.firstChild);
			}
		},
		show : function () { this.elements.container.className = "show"; },
		hide : function () { this.elements.container.className = "hide"; },
		highScores : function () {
			var i, scores;
			this.hide();
			this.empty();
			scores = PONG.highScores.scores();
			this.elements.header.innerHTML = PONG.config.gameTitle;
			this.elements.inner.appendChild(this.elements.header);
			this.elements.controls.innerHTML = PONG.config.controls.description;
			this.elements.inner.appendChild(this.elements.controls);
			if (scores.length) {
				this.elements.leaders.innerHTML = PONG.config.highScores.heading;
				for (i = 0; i < scores.length; i++) {
					this.elements.leaders.innerHTML += (i + 1) + ". " + scores[i].name + " - " + scores[i].score + " SECONDS\n";
				}
				this.elements.inner.appendChild(this.elements.leaders);
				this.elements.inner.appendChild(this.elements.clear);
			}
			this.show();
		},
		winnerDialog : function () {
			var score, player;
			this.hide();
			this.empty();
			score = (PONG.endTime - PONG.startTime) / 1000;
			player = (PONG.players[0].score > PONG.players[1].score) ? 0 : 1;
			this.elements.header.innerHTML = PONG.players[player].name + " WINS";
			this.elements.inner.appendChild(this.elements.header);
			this.elements.time.innerHTML = "IN " + score + " SECONDS";
			this.elements.inner.appendChild(this.elements.time);
			if (PONG.highScores.isHighScore(score)) {
				this.elements.highscore.innerHTML = PONG.config.highScores.prompt;
				this.elements.highscore.appendChild(this.elements.playerInput);
				this.elements.inner.appendChild(this.elements.highscore);
				this.elements.playerInput.value = "";
				this.elements.playerInput.focus();
			} else {
				window.setTimeout(function () { PONG.triggerEvent("reset"); }, PONG.config.resetDelay);
			}
			this.show();
		}
	};

	/**
	 * Varioius elements of the UI have attributes and event listeners
	 * added during setup.
	 */
	PONG.modal.elements.container.id = PONG.config.modal.containerId;
	PONG.modal.elements.clear.id = PONG.config.modal.clearId;
	PONG.modal.elements.clear.innerHTML = PONG.config.modal.clearText;
	PONG.modal.elements.clear.addEventListener("click", function () { PONG.highScores.clear(); }, false);
	PONG.modal.elements.playerInput.setAttribute("size", 3);
	PONG.modal.elements.playerInput.setAttribute("maxlength", 3);
	PONG.modal.elements.playerInput.addEventListener("keyup", function (evt) {
		PONG.modal.elements.playerInput.value = PONG.modal.elements.playerInput.value.toUpperCase();
		if (PONG.modal.elements.playerInput.value.length >= 3) {
			PONG.triggerEvent("scoreSubmit");
		}
	}, true);

	/**
	 * Various events trigger displaying or hiding certain dialogs.
	 */
	PONG.bind("start", function hideModal() { PONG.modal.hide(); });
	PONG.bind("reset", function showHighScores() { PONG.modal.highScores(); });
	PONG.bind("gameOver", function showWinnerDialog() { PONG.modal.winnerDialog(); });

	/**
	 * When the init event is fired, the modal container is assembled and
	 * inserted into the document.
	 */
	PONG.bind("init", function initModal() {
		PONG.modal.elements.container.appendChild(PONG.modal.elements.inner);
		document.body.appendChild(PONG.modal.elements.container);
	});

	/**
	 * PONG.canvas contains the HTML canvas element and associated methods.
	 */
	PONG.canvas = {
		el : document.createElement("canvas"),
		aspectRatio : function () { return this.el.width / this.el.height; },
		resize : function () {
			this.el.width = window.innerWidth;
			this.el.height = window.innerHeight;
		}
	};

	/**
	 * When the init event is fired, the window's resize event is bound to the
	 * PONG.canvas.resize function and it is called once to initialize the
	 * size of the canvas.
	 */
	PONG.bind("init", function initCanvas() {
		PONG.canvas.resize();
		document.body.appendChild(PONG.canvas.el);
		window.addEventListener("resize", function () { PONG.canvas.resize(); }, false);
	});

	/**
	 * PONG.ctx is the drawing context for the canvas.
	 */
	PONG.ctx = PONG.canvas.el.getContext("2d");

	/**
	 * PONG.draw is a collection of functions that draw various game elements
	 * to the canvas.
	 */
	PONG.draw = {
		rect : function (left, top, width, height) {
			PONG.ctx.beginPath();
			PONG.ctx.rect(left * PONG.canvas.el.width, top * PONG.canvas.el.height, width * PONG.canvas.el.width, height * PONG.canvas.el.height);
			PONG.ctx.closePath();
			PONG.ctx.fill();
		},
		table : function () {
			PONG.ctx.fillStyle = PONG.config.background;
			PONG.draw.rect(0, 0, 1, 1);
		},
		net : function () {
			var i, top, left, height, width, dashHeight, dashHeightRatio;
			width = PONG.config.net.width;
			dashHeight = PONG.config.net.dashHeight;
			dashHeightRatio = PONG.config.net.dashHeightRatio;
			PONG.ctx.fillStyle = PONG.config.foreground;
			for (i = dashHeight / dashHeightRatio; i < 1; i += dashHeight) {
				height = dashHeight / dashHeightRatio;
				left = 0.5 - (width / 2);
				top = i;
				PONG.draw.rect(left, top, width, height);
			}
		},
		scores : function () {
			var i, value, left, top;
			top = PONG.config.scores.top * PONG.canvas.el.height;
			PONG.ctx.fillStyle = PONG.config.foreground;
			PONG.ctx.font = (PONG.config.scores.fontSize * PONG.canvas.el.height) + "px" + PONG.config.scores.fontFace;
			PONG.ctx.textBaseline = "top";
			for (i = 0; i < PONG.players.length; i++) {
				value = PONG.players[i].score;
				left = (i * 0.5 + 0.25) * PONG.canvas.el.width - (PONG.ctx.measureText(value).width / 2);
				PONG.ctx.fillText(value, left, top);
			}
		},
		hub : function () {
			if (PONG.gamePhase !== PONG.gamePhases.title && PONG.gamePhase !== PONG.gamePhases.gameplay) { return; }
			var value, time, left, top;
			left = PONG.config.hub.left * PONG.canvas.el.width;
			top = PONG.config.hub.top * PONG.canvas.el.height;
			PONG.ctx.fillStyle = PONG.config.foreground;
			PONG.ctx.font = (PONG.config.hub.fontSize * PONG.canvas.el.height) + "px" + PONG.config.hub.fontFace;
			PONG.ctx.textBaseline = "top";
			switch (PONG.gamePhase) {
			case PONG.gamePhases.title:
				time = new Date() / 1000;
				time = (time - Math.floor(time)) * 1000;
				value = (time > 500) ? PONG.config.hub.startMsg : "";
				break;
			case PONG.gamePhases.gameplay:
				time = new Date() - PONG.startTime;
				value = time;
				break;
			}
			PONG.ctx.fillText(value, left, top);
		},
		paddles : function () {
			var i;
			PONG.ctx.fillStyle = PONG.config.foreground;
			for (i = 0; i < PONG.players.length; i++) {
				PONG.draw.rect(PONG.players[i].paddle.left(), PONG.players[i].paddle.top(), PONG.players[i].paddle.width, PONG.players[i].paddle.height);
			}
		},
		ball : function () {
			if (!PONG.ball.inMotion) { return; }
			PONG.ctx.fillStyle = PONG.config.foreground;
			PONG.draw.rect(PONG.ball.left(), PONG.ball.top(), PONG.ball.width(), PONG.ball.height());
		}
	};

	/**
	 * When the tick event is fired, the game elements are rendered to the
	 * canvas.
	 */
	PONG.bind("tick", function draw() {
		PONG.draw.table();
		PONG.draw.net();
		PONG.draw.scores();
		PONG.draw.hub();
		PONG.draw.paddles();
		PONG.draw.ball();
	});

	/**
	 * PONG.sounds is an object containing Sound objects. Each child object
	 * has a play() method, which can be bound to events.
	 */
	PONG.sounds = {
		goal : new Sound("sounds/goal.ogg", "sounds/goal.mp3", "sounds/goal.wav"),
		wall : new Sound("sounds/wall.ogg", "sounds/wall.mp3", "sounds/wall.wav"),
		paddle : new Sound("sounds/paddle.ogg", "sounds/paddle.mp3", "sounds/paddle.wav")
	};

	/**
	 * Sounds are bound to various events.
	 */
	PONG.bind("goal", function playGoal() { PONG.sounds.goal.play(); });
	PONG.bind("bounce", function playWall() { PONG.sounds.wall.play(); });
	PONG.bind("hit", function playPaddle() { PONG.sounds.paddle.play(); });

	/**
	 * When the DOM is ready, the init event is fired.
	 */
	domReady(function () { PONG.triggerEvent("init"); });

});