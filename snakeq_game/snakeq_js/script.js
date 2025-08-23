// Game Manager
class GameManager {
  constructor() {
    this.screens = {
      mainMenu: document.getElementById('main-menu'),
      gameOptions: document.getElementById('game-options'),
      gameScreen: document.getElementById('game-screen'),
      settingsScreen: document.getElementById('settings-screen')
    };
    
    this.currentGame = null;
    this.settings = {
      sound: true,
      music: true,
      controls: 'both',
      difficulty: 'medium'
    };
    
    this.init()
  }
  
  init() {
    this.bindEvents()
    this.loadSettings()
  }
  
  bindEvents() {
    // Main menu buttons
    document.getElementById('play-btn').addEventListener('click', () => this.showScreen('gameOptions'));
    document.getElementById('settings-btn').addEventListener('click', () => this.showScreen('settingsScreen'));
    document.getElementById('quit-btn').addEventListener('click', () => window.close());
    
    // Game options buttons
    document.getElementById('back-to-menu').addEventListener('click', () => this.showScreen('mainMenu'));
    document.getElementById('start-game').addEventListener('click', () => this.startGame());
    
    // Mode selection
    document.getElementById('mathModeBtn').addEventListener('click', () => this.selectMode('math'));
    document.getElementById('englishModeBtn').addEventListener('click', () => this.selectMode('english'));
    
    // Difficulty selection
    document.querySelectorAll('.difficulty-buttons .option-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.selectDifficulty(e.target.dataset.difficulty));
    });
    
    // Settings screen buttons
    document.getElementById('back-from-settings').addEventListener('click', () => this.showScreen('mainMenu'));
    document.getElementById('save-settings').addEventListener('click', () => this.saveSettings());
    
    // Game screen buttons
    document.getElementById('pause-btn').addEventListener('click', () => this.pauseGame());
    document.getElementById('menu-btn').addEventListener('click', () => this.showPauseMenu());
    
    // Pause menu buttons
    document.getElementById('resume-btn').addEventListener('click', () => this.resumeGame());
    document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
    document.getElementById('settings-game-btn').addEventListener('click', () => this.showScreen('settingsScreen'));
    document.getElementById('quit-game-btn').addEventListener('click', () => this.quitToMenu());
    
    // Game over buttons
    document.getElementById('play-again-btn').addEventListener('click', () => this.restartGame());
    document.getElementById('main-menu-btn').addEventListener('click', () => this.quitToMenu());
    
    // ESC key for pause menu
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.screens.gameScreen.classList.contains('active')) {
        if (document.getElementById('pause-menu').classList.contains('hidden')) {
          this.showPauseMenu();
        } else {
          this.resumeGame();
        }
      }
    });
  }
  
  showScreen(screenName) {
    // Hide all screens
    Object.values(this.screens).forEach(screen => {
      screen.classList.add('hidden');
      screen.classList.remove('active');
    });
    
    // Show requested screen
    this.screens[screenName].classList.remove('hidden');
    this.screens[screenName].classList.add('active');
    
    // Special handling for game screen
    if (screenName === 'gameScreen' && this.currentGame) {
      this.currentGame.paused = false;
      this.currentGame.gameLoop();
    }
  }
  
  selectMode(mode) {
    document.getElementById('mathModeBtn').classList.toggle('active', mode === 'math');
    document.getElementById('englishModeBtn').classList.toggle('active', mode === 'english');
    this.mode = mode;
  }
  
  selectDifficulty(difficulty) {
    document.querySelectorAll('.difficulty-buttons .option-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.difficulty === difficulty);
    });
    this.settings.difficulty = difficulty;
  }
  
  startGame() {
    if (!this.mode) {
      this.selectMode('math'); // Default to math mode
    }
    
    // Determine speed based on difficulty
    let speed;
    switch(this.settings.difficulty) {
      case 'easy': speed = 4; break;
      case 'medium': speed = 6; break;
      case 'hard': speed = 8; break;
      default: speed = 6;
    }
    
    // Create the appropriate game instance
    if (this.mode === 'math') {
      this.currentGame = new SnakeMathGame(speed);
    } else {
      this.currentGame = new SnakeEnglishGame(speed);
    }
    
    this.showScreen('gameScreen');
  }
  
  pauseGame() {
    if (this.currentGame) {
      this.currentGame.paused = !this.currentGame.paused;
      if (!this.currentGame.paused) {
        this.currentGame.gameLoop();
      }
    }
  }
  
  showPauseMenu() {
    if (this.currentGame && this.currentGame.gameRunning) {
      this.currentGame.paused = true;
      document.getElementById('pause-menu').classList.remove('hidden');
    }
  }
  
  resumeGame() {
    if (this.currentGame) {
      this.currentGame.paused = false;
      document.getElementById('pause-menu').classList.add('hidden');
      this.currentGame.gameLoop();
    }
  }
  
  restartGame() {
    if (this.currentGame) {
      this.currentGame.initGame();
      document.getElementById('game-over-overlay').classList.add('hidden');
      document.getElementById('pause-menu').classList.add('hidden');
      this.currentGame.paused = false;
      this.currentGame.gameLoop();
    }
  }
  
  quitToMenu() {
    if (this.currentGame) {
      cancelAnimationFrame(this.currentGame.gameLoopId);
      this.currentGame = null;
    }
    document.getElementById('game-over-overlay').classList.add('hidden');
    document.getElementById('pause-menu').classList.add('hidden');
    this.showScreen('mainMenu');
  }
  
  loadSettings() {
    const savedSettings = localStorage.getItem('snakeGameSettings');
    if (savedSettings) {
      this.settings = {...this.settings, ...JSON.parse(savedSettings)};
    }
    
    // Apply settings to UI
    document.getElementById('sound-toggle').checked = this.settings.sound;
    document.getElementById('music-toggle').checked = this.settings.music;
    document.getElementById('controls-select').value = this.settings.controls;
    
    // Set difficulty button active state
    this.selectDifficulty(this.settings.difficulty);
  }
  
  saveSettings() {
    this.settings.sound = document.getElementById('sound-toggle').checked;
    this.settings.music = document.getElementById('music-toggle').checked;
    this.settings.controls = document.getElementById('controls-select').value;
    
    localStorage.setItem('snakeGameSettings', JSON.stringify(this.settings));
    this.showScreen('mainMenu');
  }
}

// Base Game Class
class SnakeGame {
  constructor(speed = 6) {
    // Game constants
    this.GRID_SIZE = 25;
    this.CANVAS_WIDTH = 650;
    this.CANVAS_HEIGHT = 350;
    this.GRID_WIDTH = Math.floor(this.CANVAS_WIDTH / this.GRID_SIZE);
    this.GRID_HEIGHT = Math.floor(this.CANVAS_HEIGHT / this.GRID_SIZE);
    this.speed = speed;

    // Game state
    this.snake = [];
    this.direction = { x: 1, y: 0 };
    this.apples = [];
    this.gameRunning = true;
    this.gameState = "playing"; // "playing", "won", "lost"
    this.score = 0;
    this.lives = 3;
    this.correctAnswers = 0;
    this.currentQuestion = null;
    this.snakeFace = "normal"; // "normal", "happy", "disgust", "dead"
    this.notification = null;
    this.notificationTimer = 0;
    this.waitingForMove = true;
    this.paused = false;
    this.showConfirm = false;
    this.pauseTimer = 0;
    this.isPausedForEvent = false;
    this.lastCountdownUpdate = 0;
    this.countdownValue = 0;

    // Animation
    this.lastFrameTime = 0;
    this.moveAccumulator = 0;
    this.gameLoopId = null;

    // DOM elements
    this.canvas = document.getElementById("game-canvas");
    this.ctx = this.canvas.getContext("2d");
    this.scoreElement = document.getElementById("score-value");
    this.livesElement = document.getElementById("lives-value");
    this.correctElement = document.getElementById("correct-value");
    this.questionElement = document.getElementById("question-display");
    this.gameOverOverlay = document.getElementById("game-over-overlay");
    this.gameOverTitle = document.getElementById("game-over-title");
    this.finalScoreElement = document.getElementById("final-score");

    this.init();
  }

  init() {
    this.initGame();
    this.bindEvents();
    this.gameLoop();
  }

  bindEvents() {
    document.addEventListener("keydown", (e) => this.handleKeyDown(e));
  }

  randInt(max) {
    return Math.floor(Math.random() * max);
  }

  getRandomPosition() {
    return {
      x: this.randInt(this.GRID_WIDTH),
      y: this.randInt(this.GRID_HEIGHT),
    };
  }

  getRandomDirection() {
    const dirs = [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
    ];
    return dirs[Math.floor(Math.random() * dirs.length)];
  }

  generateQuestion() {
    // To be implemented by child classes
    return { question: "Default question", correctAnswer: 0, options: [0, 0, 0, 0] };
  }

  generateApples(question) {
    const newApples = [];
    const usedPositions = new Set();

    question.options.forEach((option) => {
      let x, y;
      do {
        x = this.randInt(this.GRID_WIDTH);
        y = this.randInt(this.GRID_HEIGHT);
      } while (usedPositions.has(`${x},${y}`) || this.snake.some((segment) => segment.x === x && segment.y === y));

      usedPositions.add(`${x},${y}`);
      newApples.push({
        x,
        y,
        value: option,
        isCorrect: option === question.correctAnswer,
      });
    });

    return newApples;
  }

  showNotification(message, type) {
    this.notification = { message, type };
    this.notificationTimer = 60;
  }

  initGame() {
    this.snake = [this.getRandomPosition()];
    this.direction = this.getRandomDirection();
    this.currentQuestion = this.generateQuestion();
    this.apples = this.generateApples(this.currentQuestion);
    this.score = 0;
    this.lives = 3;
    this.correctAnswers = 0;
    this.gameState = "playing";
    this.gameRunning = true;
    this.snakeFace = "normal";
    this.notification = null;
    this.notificationTimer = 0;
    this.waitingForMove = true;
    this.paused = false;
    this.pauseTimer = 0;
    this.isPausedForEvent = false;
    this.lastCountdownUpdate = 0;
    this.countdownValue = 0;

    this.updateUI();
    this.hideOverlays();
  }

  updateUI() {
    this.scoreElement.textContent = this.score;
    this.livesElement.textContent = this.lives;
    this.correctElement.textContent = this.correctAnswers;
    this.questionElement.textContent = this.currentQuestion ? this.currentQuestion.question : "Loading...";
  }

  hideOverlays() {
    this.gameOverOverlay.classList.add("hidden");
  }

  moveSnake() {
    const newSnake = [...this.snake];
    const head = { ...newSnake[0] };

    // Move head
    head.x += this.direction.x;
    head.y += this.direction.y;

    // Wrap around edges
    if (head.x < 0) head.x = this.GRID_WIDTH - 1;
    if (head.x >= this.GRID_WIDTH) head.x = 0;
    if (head.y < 0) head.y = this.GRID_HEIGHT - 1;
    if (head.y >= this.GRID_HEIGHT) head.y = 0;

    if (newSnake.some((segment) => segment.x === head.x && segment.y === head.y)) {
      this.lives--;
      this.snakeFace = "disgust";
      this.showNotification("Self-bite! -1 life. Get ready!", "wrong");

      // Remove one tail segment if snake has more than one segment
      if (this.snake.length > 1) {
        this.snake.pop();
      }

      this.isPausedForEvent = true;
      this.pauseTimer = 180; // 3 seconds at 60fps
      this.countdownValue = 3;
      this.lastCountdownUpdate = performance.now();

      this.updateUI();
      return; // Don't continue with normal movement this frame
    }

    newSnake.unshift(head);

    // Check apple collision
    const eatenApple = this.apples.find((apple) => apple.x === head.x && apple.y === head.y);
    if (eatenApple) {
      if (eatenApple.isCorrect) {
        this.score += 10;
        this.correctAnswers++;

        if (this.correctAnswers >= 10) {
          this.gameState = "won";
          this.gameRunning = false;
          this.showGameOver();
          return;
        }

        this.snakeFace = "happy";
        this.showNotification("Correct! +10 points. Get ready!", "correct");

        this.currentQuestion = this.generateQuestion();
        this.apples = this.generateApples(this.currentQuestion);

        this.isPausedForEvent = true;
        this.pauseTimer = 180; // 3 seconds at 60fps
        this.countdownValue = 3;
        this.lastCountdownUpdate = performance.now();

        // Don't pop tail - snake grows
        } else {
          this.score = Math.max(0, this.score - 5);
          this.lives--;

          if (this.lives <= 0) {
            this.gameState = "lost";
            this.gameRunning = false;
            this.snakeFace = "dead";
            // Set lives to 0 when game is over
            this.lives = 0;
            this.updateUI();
            this.showGameOver();
            return;
          }

          this.snakeFace = "disgust";
          this.showNotification("Wrong! -5 points, -1 life. Get ready!", "wrong");

          if (this.snake.length > 1) {
            this.snake.pop(); // Remove one tail segment
          }

          this.apples = this.apples.filter((apple) => apple !== eatenApple);

          this.addNewApple();

          this.isPausedForEvent = true;
          this.pauseTimer = 180; // 3 seconds at 60fpc
          this.countdownValue = 3;
          this.lastCountdownUpdate = performance.now();

          this.updateUI();
          newSnake.pop(); // Remove tail for normal movement
        }
    } else {
        newSnake.pop();
        if (this.snakeFace !== "dead") {
          this.snakeFace = "normal";
        }
    }

    this.snake = newSnake;
    this.updateUI();
  }

  addNewApple() {
    const usedPositions = new Set();

    // Mark existing apple positions as used
    this.apples.forEach((apple) => {
      usedPositions.add(`${apple.x},${apple.y}`);
    });

    // Mark snake positions as used
    this.snake.forEach((segment) => {
      usedPositions.add(`${segment.x},${segment.y}`);
    });

    // Generate a new apple with a random value from current question options
    const availableOptions = this.currentQuestion.options.filter(
        (option) => !this.apples.some((apple) => apple.value === option),
    );

    if (availableOptions.length > 0) {
        const randomOption = availableOptions[Math.floor(Math.random() * availableOptions.length)];

        let x, y;
        do {
            x = this.randInt(this.GRID_WIDTH);
            y = this.randInt(this.GRID_HEIGHT);
        } while (usedPositions.has(`${x},${y}`));

        this.apples.push({
            x,
            y,
            value: randomOption,
            isCorrect: randomOption === this.currentQuestion.correctAnswer,
        });
    }
}

showGameOver() {
    this.gameOverTitle.textContent = this.gameState === "won" ? "You Won! 🎉" : "Game Over 💀";
    this.gameOverTitle.className = this.gameState === "won" ? "won" : "lost";
    this.finalScoreElement.textContent = `Final Score: ${this.score}`;
    this.gameOverOverlay.classList.remove("hidden");
}

drawSnakeFace(x, y, face) {
    const centerX = x + this.GRID_SIZE / 2;
    const centerY = y + this.GRID_SIZE / 2;

    this.ctx.fillStyle = "white";

    // Eyes
    const eyeSize = 2;
    const eyeOffset = 4;
    this.ctx.fillRect(centerX - eyeOffset, centerY - 3, eyeSize, eyeSize);
    this.ctx.fillRect(centerX + eyeOffset - eyeSize, centerY - 3, eyeSize, eyeSize);

    // Mouth based on face state
    this.ctx.strokeStyle = "white";
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();

    switch (face) {
      case "happy":
        this.ctx.arc(centerX, centerY + 1, 4, 0, Math.PI);
        break;
      case "disgust":
        this.ctx.arc(centerX, centerY + 5, 4, Math.PI, 0);
          break;
      case "dead":
        this.ctx.fillStyle = "red";
        this.ctx.fillRect(centerX - eyeOffset, centerY - 3, eyeSize, eyeSize);
        this.ctx.fillRect(centerX + eyeOffset - eyeSize, centerY - 3, eyeSize, eyeSize);
        this.ctx.moveTo(centerX - 3, centerY + 2);
        this.ctx.lineTo(centerX + 3, centerY + 2);
          break;
      default:
        this.ctx.moveTo(centerX - 2, centerY + 2);
        this.ctx.lineTo(centerX + 2, centerY + 2);
    }

    this.ctx.stroke();
  }

  drawNotification(notification) {
    const { message, type } = notification;

    // Background
    this.ctx.fillStyle = type === "correct" ? "rgba(34, 197, 94, 0.9)" : "rgba(239, 68, 68, 0.9)";
    this.ctx.fillRect(this.CANVAS_WIDTH / 2 - 100, 50, 200, 40);

    // Border
    this.ctx.strokeStyle = type === "correct" ? "#22c55e" : "#ef4444";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(this.CANVAS_WIDTH / 2 - 100, 50, 200, 40);

    // Text
    this.ctx.fillStyle = "white";
    this.ctx.font = "14px monospace";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(message, this.CANVAS_WIDTH / 2, 70);
  }

  draw() {
    // Clear canvas
    this.ctx.fillStyle = "#1a1a1a";
    this.ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);

    // Draw grid
    this.ctx.strokeStyle = "#333";
    this.ctx.lineWidth = 1;
    for (let x = 0; x <= this.CANVAS_WIDTH; x += this.GRID_SIZE) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.CANVAS_HEIGHT);
      this.ctx.stroke();
    }
    for (let y = 0; y <= this.CANVAS_HEIGHT; y += this.GRID_SIZE) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.CANVAS_WIDTH, y);
      this.ctx.stroke();
    }

    // Draw snake
    this.ctx.fillStyle = "#4ade80";
    this.snake.forEach((segment, index) => {
      this.ctx.fillRect(
        segment.x * this.GRID_SIZE + 1,
        segment.y * this.GRID_SIZE + 1,
        this.GRID_SIZE - 2,
        this.GRID_SIZE - 2,
      );

      if (index === 0) {
        this.ctx.fillStyle = "#22c55e";
        this.ctx.fillRect(
          segment.x * this.GRID_SIZE + 3,
          segment.y * this.GRID_SIZE + 3,
          this.GRID_SIZE - 6,
          this.GRID_SIZE - 6,
        );
        this.drawSnakeFace(segment.x * this.GRID_SIZE, segment.y * this.GRID_SIZE, this.snakeFace);
        this.ctx.fillStyle = "#4ade80";
      }
    });

    // Draw apples
    this.apples.forEach((apple) => {
      this.ctx.fillStyle = "#ef4444";
      this.ctx.fillRect(
        apple.x * this.GRID_SIZE + 1,
        apple.y * this.GRID_SIZE + 1,
        this.GRID_SIZE - 2,
        this.GRID_SIZE - 2,
      );

      this.ctx.fillStyle = "white";
      this.ctx.font = "12px monospace";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(
        apple.value.toString(),
        apple.x * this.GRID_SIZE + this.GRID_SIZE / 2,
        apple.y * this.GRID_SIZE + this.GRID_SIZE / 2,
      );
    });

    // Draw notification
    if (this.notification && this.notificationTimer > 0) {
      this.drawNotification(this.notification);
      this.notificationTimer--;
    }

    if (this.paused || this.isPausedForEvent) {
      this.ctx.fillStyle = "rgba(0,0,0,0.6)";
      this.ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
      this.ctx.fillStyle = "white";
      this.ctx.font = "24px monospace";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";

      if (this.isPausedForEvent) {
        // Update countdown value every second
        const now = performance.now();
        if (now - this.lastCountdownUpdate >= 1000) {
          this.countdownValue--;
          this.lastCountdownUpdate = now;
        }
        
        if (this.countdownValue > 0) {
          this.ctx.fillText(`GET READY! ${this.countdownValue}`, this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT / 2);
        } else {
          this.ctx.fillText("GO!", this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT / 2);
        }
      } else {
        this.ctx.fillText("PAUSED", this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT / 2);
      }
    }
  }

  gameLoop(timestamp = 0) {
    if (!this.gameRunning) return;

    const delta = (timestamp - this.lastFrameTime) / 1000;
    this.lastFrameTime = timestamp;

    if (this.isPausedForEvent) {
      this.pauseTimer--;
      if (this.pauseTimer <= 0) {
          this.isPausedForEvent = false;
          this.pauseTimer = 0;
          this.countdownValue = 0;
        }
      }

    // Update only when not paused and player started moving
    if (!this.waitingForMove && !this.paused && !this.isPausedForEvent) {
      this.moveAccumulator += delta;
      const moveInterval = 1 / this.speed;

      while (this.moveAccumulator >= moveInterval) {
        this.moveSnake();
        this.moveAccumulator -= moveInterval;
      }
    }

    this.draw();
    this.gameLoopId = requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
  }

  handleKeyDown(e) {
    const key = e.key.toLowerCase();
    const code = e.code;

    // If game is over, only allow R for restart or ESC for menu
    if (!this.gameRunning) {
      if (code === "KeyR" || key === "r") {
        this.initGame();
        return;
      }
      if (code === "Escape") {
        // This will be handled by the GameManager
        return;
      }
      return;
    }

    let moved = false;

    // Space to pause
    if (code === "Space" || key === " ") {
      e.preventDefault();
      this.paused = !this.paused;
      if (!this.paused) {
          this.gameLoop();
      }
      return;
    }

    // R to restart
    if (code === "KeyR" || key === "r") {
      this.initGame();
      return;
    }

    // WASD and Arrow keys movement
    switch (key) {
      case "w":
      case "arrowup":
        if (!this.paused && this.direction.y === 0) {
            this.direction = { x: 0, y: -1 };
            moved = true;
        }
        break;
      case "s":
      case "arrowdown":
        if (!this.paused && this.direction.y === 0) {
            this.direction = { x: 0, y: 1 };
            moved = true;
        }
        break;
      case "a":
      case "arrowleft":
        if (!this.paused && this.direction.x === 0) {
          this.direction = { x: -1, y: 0 };
          moved = true;
        }
        break;
      case "d":
      case "arrowright":
        if (!this.paused && this.direction.x === 0) {
          this.direction = { x: 1, y: 0 };
          moved = true;
        }
        break;
    }

    if (moved && this.waitingForMove) {
      this.waitingForMove = false;
    }
  }
}

// Math Game Class
class SnakeMathGame extends SnakeGame {
  generateQuestion() {
    const operations = ["+", "-", "*"];
    const operation = operations[Math.floor(Math.random() * operations.length)];

    let num1, num2, correctAnswer, question;

    switch (operation) {
      case "+":
        num1 = Math.floor(Math.random() * 20) + 1;
        num2 = Math.floor(Math.random() * 20) + 1;
        correctAnswer = num1 + num2;
        question = `${num1} + ${num2} = ?`;
        break;
      case "-":
        num1 = Math.floor(Math.random() * 20) + 10;
        num2 = Math.floor(Math.random() * num1) + 1;
        correctAnswer = num1 - num2;
        question = `${num1} - ${num2} = ?`;
        break;
      case "*":
        num1 = Math.floor(Math.random() * 10) + 1;
        num2 = Math.floor(Math.random() * 10) + 1;
        correctAnswer = num1 * num2;
        question = `${num1} × ${num2} = ?`;
        break;
      default:
        correctAnswer = 5;
        question = "2 + 3 = ?";
    }

    // Generate wrong options
    const options = [correctAnswer];
    while (options.length < 4) {
      const wrongAnswer = correctAnswer + Math.floor(Math.random() * 10) - 5;
      if (wrongAnswer > 0 && !options.includes(wrongAnswer)) {
        options.push(wrongAnswer);
      }
    }

    // Shuffle options
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }

    return { question, correctAnswer, options };
  }
}

// English Game Class
class SnakeEnglishGame extends SnakeGame {
  generateQuestion() {
  const questions = [
      { question: "Plural of 'cat'?", correctAnswer: "cats", options: ["cats", "catz", "cates", "cati"] },
      { question: "Opposite of 'hot'?", correctAnswer: "cold", options: ["cold", "warm", "fire", "burn"] },
      { question: "Synonym of 'happy'?", correctAnswer: "joyful", options: ["joyful", "angry", "tired", "sad"] },
      { question: "Fill the blank: 'I ___ to school.'", correctAnswer: "go", options: ["go", "goed", "going", "goes"] },
      { question: "Past tense of 'eat'?", correctAnswer: "ate", options: ["ate", "eaten", "eated", "eating"] },
      { question: "Which is a color?", correctAnswer: "blue", options: ["blue", "blow", "blew", "bloom"] },
      { question: "Which word is spelled correctly?", correctAnswer: "receive", options: ["receive", "recieve", "receve", "receiv"] },
      { question: "Antonym of 'brave'?", correctAnswer: "cowardly", options: ["cowardly", "fearless", "bold", "heroic"] },
      { question: "Homophone for 'flower'?", correctAnswer: "flour", options: ["flour", "floor", "flaw", "flare"] },
      { question: "Complete: 'The quick brown fox jumps over the ___ dog.'", correctAnswer: "lazy", options: ["lazy", "sleepy", "tired", "old"] },
    ];

    const q = questions[Math.floor(Math.random() * questions.length)];

    // Shuffle options
    const shuffled = [...q.options];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return { question: q.question, correctAnswer: q.correctAnswer, options: shuffled };
  }
}

// Initialize the game manager when the page loads
document.addEventListener("DOMContentLoaded", () => {
  new GameManager();
});