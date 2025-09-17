function $id(id) { return document.getElementById(id) }

class SnakeMathGame {
  constructor() {

        
    this.gameSettings = JSON.parse(localStorage.getItem("gameSettings"))

    // Skin system
    this.selectedSkin = this.gameSettings.selectedSkin
    this.selectedAccessory = this.gameSettings.selectedAccessory

    this.setDifficultySettings()

    this.CANVAS_WIDTH = 800
    this.CANVAS_HEIGHT = 480
    this.GRID_WIDTH = Math.floor(this.CANVAS_WIDTH / this.GRID_SIZE)
    this.GRID_HEIGHT = Math.floor(this.CANVAS_HEIGHT / this.GRID_SIZE)

    const canvasContainer = document.querySelector(".canvas-container");
    const selectedTile = this.gameSettings.selectedTile || 'Tile';
    canvasContainer.style.backgroundImage = `url(../../assets/images/tiles/${selectedTile}.png)`
    
    const soundPath = (this.gameSettings.selectedSkin === "volt") ? "../../assets/images/snake-skins/volt_snake/sounds" : "../../assets/sounds"

    this.sounds = {
      biteApple: new Audio(`${soundPath}/bite-apple.mp3`),
      snakeTurns: new Audio(`${soundPath}/snake-turns.mp3`),
      snakeDies: new Audio(`${soundPath}/snake-dies.mp3`),
      snakeLosesLife: new Audio(`${soundPath}/snake-loses-life.mp3`),
      correct: new Audio(`${soundPath}/correct.mp3`),
      bgMusic: new Audio(`${soundPath}/bg-music.mp3`),
      youWon: new Audio("../../assets/sounds/good-job.mp3"),
      click: new Audio(`${soundPath}/click.mp3`),
      countdown: new Audio(`${soundPath}/countdown.mp3`),
      shift: new Audio(`${soundPath}/shift.mp3`),
      pause: new Audio(`${soundPath}/pause.mp3`),
      bossApple: new Audio("../../assets/sounds/bossApple.mp3"),
    }

    this.sounds.bgMusic.volume = (this.gameSettings.selectedSkin === "volt") ? 0.6 : 1
    this.sounds.shift.volume = (this.gameSettings.selectedSkin === "volt") ? 0.1 : 1
    this.sounds.bgMusic.loop = true;
    this.sounds.click.volume = 0.5
    this.sounds.bossApple.volume = 0.3

    this.soundEnabled = localStorage.getItem("soundEnabled") !== "false" // default true
    this.musicEnabled = localStorage.getItem("musicEnabled") !== "false"

    // Load snake sprites
    this.sprites = {}
    this.loadSprites()

    // Game state
    this.snake = []
    this.direction = { x: 1, y: 0 }
    this.apples = []
    this.gameRunning = true
    this.gameState = "playing"
    this.score = 0
    this.lives = 5
    this.correctAnswers = 0
    this.targetAnswers = this.gameSettings.mode === "endless" ? "♾️" : 10
    this.currentQuestion = null
    this.snakeFace = "normal"
    this.notification = null
    this.notificationTimer = 0
    this.waitingForMove = true
    this.paused = false
    this.showConfirm = false
    this.inputLocked = false
    this.countdownActive = false
    this.escMenuActive = false

    // Speed control
    this.speedLevel = 5; // Default speed level (1-10)
    this.speedMultipliers = [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 1.0, 1.2, 1.5, 2.0]; // Speed multipliers for levels 1-10

    // Boss challenge state (Endless mode)
    this.inBossChallenge = false
    this.bossAppleSpawned = false
    this.nextBossAt = 10 // spawn boss after this many correct answers, then every +10
    // Endless rewards: every N correct answers grant life or shield
    this.lifeRewardInterval = 10
    this.nextLifeRewardAt = 10

    // Minimum spawn distance for apples from the snake head (in grid cells)
    // Helps prevent immediate accidental collisions after eating
    this.minAppleDistanceFromHead = 4

    this.baseSpeed = this.difficultySettings.baseSpeed
    this.speed = this.baseSpeed
    this.speedIncrement = this.difficultySettings.speedIncrease

    this.pauseTimer = 0
    this.isPausedForEvent = false
    this.countdownActive = false

    // Timer for timed mode
    this.timeLeft = 60
    this.timerInterval = null

    // Animation
    this.lastFrameTime = 0
    this.moveAccumulator = 0

    // Statistics tracking for achievements
    this.sessionStats = {
      applesEaten: 0,
      correctAnswers: 0,
      startTime: Date.now(),
      perfectGame: true // Track if no wrong answers in this session
    }
    this.gameLoopId = null

    // Sprint (temporary speed boost)
    const isVoltSkin = this.selectedSkin === "volt"
    this.sprint = {
      active: false,
      energy: 1,            // 0..1 current stamina
      maxEnergy: isVoltSkin ? 1.1 : 1, // +10% max energy for volt skin
      drainPerSecond: isVoltSkin ? 1.02 : 1.2,  // -15% drain for volt skin (1.2 * 0.85 = 1.02)
      regenPerSecond: isVoltSkin ? 0.207 : 0.18, // +15% regen for volt skin (0.18 * 1.15 = 0.207)
      multiplier: 1.8       // speed multiplier while sprinting
    }

    // Shield state
    this.hasShield = false          // player currently protected?
    this.shieldPickup = null        // {x,y} pickup position if spawned
    this.shieldSpawned = false      // ensure only one spawn per game

    // Self-bite immunity (prevents repeated self-bite for a short window)
    this.selfBiteImmunityTimer = 0   // seconds remaining
    this.selfBiteImmunityDuration = 2.5

    // Sprint bar UI rectangle
    this.sprintBar = { x: 16, y: 16, width: 160, height: 14 }

    this.initDOM()
    this.init()
  }

  loadSprites() {
    const skinPath = `../../assets/images/snake-skins/${this.selectedSkin}_snake`
    const accessoryPath = `../../assets/images/accessory/${this.selectedAccessory}`
    const spritePaths = {
      // Snake movement sprites (using selected skin)
      "SnakeHead": `${skinPath}/SnakeHead.png`,
      "SnakeHeadLeft": `${skinPath}/SnakeHeadLeft.png`,
      "SnakeHeadRight": `${skinPath}/SnakeHeadRight.png`,
      "SnakeHeadDown": `${skinPath}/SnakeHeadDown.png`,
      "SnakeHeadCorner1": `${skinPath}/SnakeHeadCorner1.png`,
      "SnakeHeadCorner2": `${skinPath}/SnakeHeadCorner2.png`,
      "SnakeHeadCorner3": `${skinPath}/SnakeHeadCorner3.png`,
      "SnakeHeadCorner4": `${skinPath}/SnakeHeadCorner4.png`,
      "SnakeHeadCorner5": `${skinPath}/SnakeHeadCorner5.png`,
      "SnakeHeadCorner6": `${skinPath}/SnakeHeadCorner6.png`,
      "SnakeHeadCorner7": `${skinPath}/SnakeHeadCorner7.png`,
      "SnakeHeadCorner8": `${skinPath}/SnakeHeadCorner8.png`,
      "SnakeBody": `${skinPath}/SnakeBody.png`,
      "SnakeBodyDown": `${skinPath}/SnakeBodyDown.png`,
      "SnakeBodyLeft": `${skinPath}/SnakeBodyLeft.png`,
      "SnakeBodyRight": `${skinPath}/SnakeBodyRight.png`,
      "SnakeTail": `${skinPath}/SnakeTail.png`,
      "SnakeTailDown": `${skinPath}/SnakeTailDown.png`,
      "SnakeTailLeft": `${skinPath}/SnakeTailLeft.png`,
      "SnakeTailRight": `${skinPath}/SnakeTailRight.png`,
      "SnakeCornerLeftDown": `${skinPath}/SnakeCornerLeftDown.png`,
      "SnakeCornerLeftUp": `${skinPath}/SnakeCornerLeftUp.png`,
      "SnakeCornerRightDown": `${skinPath}/SnakeCornerRightDown.png`,
      "SnakeCornerRightUp": `${skinPath}/SnakeCornerRightUp.png`,
      // Accessory sprites
      "Accessory" : `${accessoryPath}.png`,
      "AccessoryLeft" : `${accessoryPath}Left.png`,
      "AccessoryRight" : `${accessoryPath}Right.png`,
      "AccessoryDown" : `${accessoryPath}Down.png`,
      // Apple sprites
      "apple": "../../assets/images/apples/apple.png",
      // Icon sprites
      "shield": "../../assets/images/icons/shield.png",
      "skipApple" : "../../assets/images/apples/appleC-blue.png",
    }

    Object.entries(spritePaths).forEach(([name, path]) => {
      this.sprites[name] = new Image()
      this.sprites[name].src = path
    })
  }


  playSound(soundName) {
    if (this.soundEnabled && this.sounds[soundName]) {
      this.sounds[soundName].currentTime = 0;
      this.sounds[soundName].play().catch((e) => { })
    }
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled
    localStorage.setItem("soundEnabled", this.soundEnabled.toString())

    const soundBtn = $id("sound-btn")
    soundBtn.textContent = this.soundEnabled ? "🔊" : "🔇"
    soundBtn.classList.toggle("active", this.soundEnabled)
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled
    localStorage.setItem("musicEnabled", this.musicEnabled.toString())

    const musicBtn = $id("music-btn")
    musicBtn.textContent = this.musicEnabled ? "🎵" : "🤫"
    musicBtn.classList.toggle("active", this.musicEnabled)

    if (this.musicEnabled) {
      this.sounds.bgMusic.loop = true;
      this.sounds.bgMusic.play().catch((e) => { })
    } else {
      this.sounds.bgMusic.pause();
    }
  }

  initDOM() {
    this.canvas = $id("game-canvas")
    this.ctx = this.canvas.getContext("2d")
    this.scoreElement = $id("score-value")
    this.livesElement = $id("lives-value")
    this.correctElement = $id("correct-value")
    this.targetElement = $id("target-value")
    this.questionElement = $id("question-display")
    this.gameOverOverlay = $id("game-over-overlay")
    this.gameOverTitle = $id("game-over-title")
    this.finalScoreElement = $id("final-score")
    this.finalCorrectElement = $id("final-correct")
    this.correctAnswerDisplay = $id("correct-answer-display")
    this.playAgainBtn = $id("play-again-btn")
    this.menuBtn = $id("menu-btn")
    this.restartConfirm = $id("restart-confirm")
    this.playAgainConfirm = $id("play-again-confirm")
    this.playAgainConfirmBtn = $id("confirm-play-again")
    this.cancelPlayAgain = $id("cancel-play-again")
    this.confirmRestartBtn = $id("confirm-restart")
    this.cancelRestartBtn = $id("cancel-restart")
    this.timerDisplay = $id("timer-display")
    this.timerValue = $id("timer-value")
    this.restartBtn= $id("restart-btn")

    // Speed control elements
    this.speedSlider = $id("speed-slider");
    this.speedValueButton = $id("speed-value-button");
    this.speedControlButton = $id("speed-control-button");
    this.speedSliderContainer = $id("speed-slider-container");

    this.heartsContainer = $id("hearts-container")
    this.helpBtn = $id("help-btn")
    this.helpBtnEsc = $id("help-btn-esc"); // ESC menu button
    this.soundBtn = $id("sound-btn")
    this.musicBtn = $id("music-btn")
    this.instructionsModal = $id("instructions-modal")
    this.closeInstructionsBtn = $id("close-instructions")
    this.aboutBtn = $id("about-btn")
    this.aboutModal = $id("about-modal")
    this.closeAbout = $id("close-about")
    this.backToMenuConfirm = $id("back-to-menu-confirm");
    this.confirmBackMenuBtn = $id("confirm-back-menu");
    this.cancelBackMenuBtn = $id("cancel-back-menu");
    this.backToMenu = $id("back-to-menu");
    this.initDpad();
  

    if (this.questionElement) {
      this.questionElement.style.fontSize = "18px"
      this.questionElement.style.lineHeight = "1.4"
    }
  }

  init() {
    this.initGame()
    this.bindEvents()
    this.gameLoop()

    this.initializeAudioStates()
  }

  initializeAudioStates() {
    const soundBtn = $id("sound-btn")
    const musicBtn = $id("music-btn")

    if (soundBtn) {
      soundBtn.textContent = this.soundEnabled ? "🔊" : "🔇"
      soundBtn.classList.toggle("active", this.soundEnabled)
    }

    if (musicBtn) {
      musicBtn.textContent = this.musicEnabled ? "🎵" : "🤫"
      musicBtn.classList.toggle("active", this.musicEnabled)

      if (this.musicEnabled) {
        this.sounds.bgMusic.loop = true;
        this.sounds.bgMusic.play().catch((e) => { })
      }
    }

    document.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (this.soundEnabled && this.sounds.click) {
          this.sounds.click.currentTime = 0; // restart if spam clicked
          this.sounds.click.play();
        }
      })
    })

  }


  bindEvents() {
    document.addEventListener("keydown", (e) => this.handleKeyDown(e))
    document.addEventListener("keyup", (e) => this.handleKeyUp(e))

    this.backToMenu.addEventListener("click", () => {
      this.playSound("click");
      this.backToMenuConfirm.classList.remove("hidden");
      this.paused = true;

    });

    this.confirmBackMenuBtn.addEventListener("click", () => {
      this.playSound("click");
      window.location.href = "../../index.html";
    });

    this.cancelBackMenuBtn.addEventListener("click", () => {
      this.playSound("click");
      this.backToMenuConfirm.classList.add("hidden");
      this.paused = false
    });
    this.playAgainBtn.addEventListener("click", () => {
      this.playSound("click")
      this.playAgainConfirm.classList.remove("hidden");
    })

    this.menuBtn.addEventListener("click", () => {
      this.playSound("click")
      this.backToMenuConfirm.classList.remove("hidden")
      this.paused = true
    })
    this.playAgainConfirmBtn.addEventListener("click", () => {
      this.playSound("click")
      this.playAgainConfirm.classList.add("hidden")
      this.gameOverOverlay.classList.add("hidden")
      this.confirmRestart()
    })
    this.confirmRestartBtn.addEventListener("click", () => {
      this.playSound("click")
      this.confirmRestart()
    })
    this.cancelRestartBtn.addEventListener("click", () => {
      this.playSound("click")
      this.cancelRestart()
    })
    this.cancelPlayAgain.addEventListener("click", () => {
      this.playSound("click")
      this.playAgainConfirm.classList.add("hidden");
    });
    this.helpBtnEsc.addEventListener("click", () => {
      this.playSound("click")
      $id("esc-menu").classList.add("hidden");
      this.showInstructions()
    })
    this.helpBtn.addEventListener("click", () => this.showInstructions())


    this.soundBtn.addEventListener("click", () => this.toggleSound())
    this.musicBtn.addEventListener("click", () => this.toggleMusic())
    this.restartBtn.addEventListener("click", () => this.showRestartConfirm())
    this.closeInstructionsBtn.addEventListener("click", () => {
      this.playSound("click")
      this.hideInstructions()
    })

    // Initialize speed control
    this.initSpeedControl();

    // Close instructions modal when clicking outside
    this.instructionsModal.addEventListener("click", (e) => {
      if (e.target === this.instructionsModal) {
        this.hideInstructions()
      }
    })

    // NEW: ESC menu event listeners - use event delegation
    document.addEventListener('click', (e) => {
      if (e.target.id === 'resume-btn') {
        this.playSound("click");
        this.hideEscMenu();
      } else if (e.target.id === 'settings-btn') {
        this.playSound("click");
        this.hideEscMenu();
      } else if (e.target.id === 'main-menu-btn') {
        this.playSound("click");
        this.hideEscMenu();
        this.backToMenuConfirm.classList.remove("hidden");
        this.paused = true;
      }
    });

        // ✅ Pause button
    const pauseBtn = document.getElementById("pause-btn");
        pauseBtn.addEventListener("click", () => {
            this.playSound( );
            this.togglePause();
        });


  }

    togglePause() {
      this.paused = !this.paused;
      this.playSound("click");

      // Change button symbol
      const btn = document.getElementById("pause-btn");
      btn.textContent = this.paused ? "▶" : "❚❚";

      console.log(this.paused ? "⏸ Game Paused" : "▶ Game Resumed");

    }


  showEscMenu() {
    if (this.gameRunning && !this.paused && !this.countdownActive &&
      this.restartConfirm.classList.contains("hidden")) {
      this.escMenuActive = true;
      this.paused = true;
      $id("esc-menu").classList.remove("hidden");
    }
  }

  hideEscMenu() {
    this.escMenuActive = false;
    this.paused = false;
    $id("esc-menu").classList.add("hidden");
    try {
      this.speedSliderContainer.classList.remove('expanded');
      this.speedControlButton && this.speedControlButton.classList.remove('expanded');
      setTimeout(() => {
        this.speedSliderContainer.style.display = 'none';
      }, 360);
    } catch (e) {}
  }

  showInstructions() {
    try {
      this.instructionsModal.classList.remove('hidden');
      this.instructionsModal.offsetHeight;
      this.instructionsModal.classList.add('show');
    } catch (e) {}
  }

  hideInstructions() {
    try {
      this.instructionsModal.classList.remove('show');
      setTimeout(() => {
        this.instructionsModal.classList.add('hidden');
      }, 300);
    } catch (e) {}
  }

  initSpeedControl() {
    // Guard DOM
    if (!this.speedSlider || !this.speedValueButton || !this.speedSliderContainer || !this.speedControlButton) {
      return;
    }

    // Set initial values
    this.speedSlider.value = this.speedLevel;
    this.speedValueButton.textContent = this.speedLevel;

    // Ensure initial collapsed state and button state (hidden by default)
    this.speedSliderContainer.classList.remove('expanded');
    this.speedSliderContainer.style.display = 'none';
    this.speedControlButton.classList.remove('expanded');

    // Button click toggles slider visibility using CSS class for transition
    this.speedControlButton.addEventListener('click', () => {
      this.playSound("click");
      const isExpanded = this.speedSliderContainer.classList.contains('expanded');

      if (!isExpanded) {
        this.speedSliderContainer.style.display = 'flex';
        // force reflow
        // eslint-disable-next-line no-unused-expressions
        this.speedSliderContainer.offsetHeight;
        this.speedSliderContainer.classList.add('expanded');
        this.speedControlButton.classList.add('expanded');
      } else {
          this.speedSliderContainer.classList.remove('expanded');
          this.speedControlButton.classList.remove('expanded');
          setTimeout(() => {
            this.speedSliderContainer.style.display = 'none';
          }, 360);
      }
    });

    // Slider changes update speed
    this.speedSlider.addEventListener('input', (e) => {
      this.speedLevel = parseInt(e.target.value, 10);
      this.speedValueButton.textContent = this.speedLevel;
      this.updateSnakeSpeed();
    });
  }

  updateSnakeSpeed() {
    // Apply speed multiplier to base speed
    const speedMultiplier = this.speedMultipliers[this.speedLevel - 1];
    this.speed = this.baseSpeed * speedMultiplier;
  }

  updateGameSpeed() {
    if (this.speedValueButton) {
      this.speedValueButton.textContent = this.speedLevel;
    }
  }

  updateUI() {
    this.scoreElement.textContent = this.score
    this.correctElement.textContent = this.correctAnswers
    // Show label only while the boss apple is visible; once eaten (inBossChallenge), show equation
    if (this.bossAppleSpawned && !this.inBossChallenge) {
      this.questionElement.textContent = "Boss Challenge"
    } else {
      this.questionElement.textContent = this.currentQuestion ? this.currentQuestion.question : "Loading..."
    }

    // Update hearts display
    const hearts = this.heartsContainer.querySelectorAll(".heart")
    hearts.forEach((heart, index) => {
      if (index < this.lives) {
        heart.classList.add("filled")
        heart.classList.remove("empty")
      } else {
        heart.classList.remove("filled")
        heart.classList.add("empty")
      }
    })
    this.updateShieldUI();
  }

  initDpad() {
    const controls = {
        "btn-up": "w",
        "btn-down": "s",
        "btn-left": "a",
        "btn-right": "d",
    };

    Object.entries(controls).forEach(([id, key]) => {
        const btn = document.getElementById(id);
        if (!btn) return;

        btn.addEventListener("click", () => {
            this.handleKeyDown({
                key: key,
                code: key.toUpperCase(), // simulate KeyW, KeyS, etc.
                preventDefault: () => {}, 
                repeat: false
            });
        });
    });
}


  generateQuestion() {
    const difficulty = this.gameSettings.difficulty;

    // Difficulty settings
    const settings = {
      easy: { range: 10, maxMult: 5, allowDiv: false },
      medium: { range: 50, maxMult: 12, allowDiv: true },
      hard: { range: 100, maxMult: 20, allowDiv: true }
    };

    const { range, maxMult, allowDiv } = settings[difficulty] || settings.easy;

    // Pick operation
    const operations = allowDiv ? ["+", "-", "*", "/"] : ["+", "-", "*"];
    const operation = operations[Math.floor(Math.random() * operations.length)];

    let num1, num2, correctAnswer, question;

    switch (operation) {
      case "+":
        num1 = Math.floor(Math.random() * range) + 1;
        num2 = Math.floor(Math.random() * range) + 1;
        correctAnswer = num1 + num2;
        question = `${num1} + ${num2} = ?`;
        break;

      case "-":
        num1 = Math.floor(Math.random() * range) + 1;
        num2 = Math.floor(Math.random() * num1) + 1; // ensures non-negative
        correctAnswer = num1 - num2;
        question = `${num1} - ${num2} = ?`;
        break;

      case "*":
        num1 = Math.floor(Math.random() * maxMult) + 1;
        num2 = Math.floor(Math.random() * maxMult) + 1;
        correctAnswer = num1 * num2;
        question = `${num1} × ${num2} = ?`;
        break;

      case "/":
        num2 = Math.floor(Math.random() * maxMult) + 1;
        correctAnswer = Math.floor(Math.random() * maxMult) + 1;
        num1 = num2 * correctAnswer; // ensures clean division
        question = `${num1} ÷ ${num2} = ?`;
        break;

      default:
        correctAnswer = 5;
        question = "2 + 3 = ?";
    }

    const options = new Set([correctAnswer]);

    while (options.size < 4) {
      let wrongAnswer;

      switch (Math.floor(Math.random() * 4)) {
        case 0: // near miss
          wrongAnswer = correctAnswer + (Math.floor(Math.random() * 5) - 2);
          break;
        case 1: // off by factor
          wrongAnswer = correctAnswer * (Math.random() > 0.5 ? 2 : 0.5);
          break;
        case 2: // operand swap (common mistake)
          wrongAnswer = num1 + num2; // works as distractor in non-addition
          break;
        default: // random within difficulty range
          wrongAnswer = Math.floor(Math.random() * (range * 2)) + 1;
      }

      // Keep answers valid
      if (
        Number.isInteger(wrongAnswer) &&
        wrongAnswer > 0 &&
        wrongAnswer !== correctAnswer
      ) {
        options.add(wrongAnswer);
      }
    }

    // Convert to array and shuffle
    const shuffledOptions = Array.from(options);
    for (let i = shuffledOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
    }

    return { question, correctAnswer, options: shuffledOptions };
  }


  initGame() {
    const headPosition = this.getRandomPosition()

    // Keep head at least 1 cell away from edges
    if (headPosition.x === 0) headPosition.x = 1
    if (headPosition.x === this.GRID_WIDTH - 1) headPosition.x = this.GRID_WIDTH - 2
    if (headPosition.y === 0) headPosition.y = 1
    if (headPosition.y === this.GRID_HEIGHT - 1) headPosition.y = this.GRID_HEIGHT - 2

    // Pick a random direction for the snake to face
    const directions = [
      { x: 1, y: 0 },   // right
      { x: -1, y: 0 },  // left
      { x: 0, y: 1 },   // down
      { x: 0, y: -1 }   // up
    ]
    this.direction = directions[Math.floor(Math.random() * directions.length)]

    // Place tail behind the head, opposite to direction
    const tailPosition = {
      x: headPosition.x - this.direction.x,
      y: headPosition.y - this.direction.y
    }

    this.snake = [headPosition, tailPosition]

    this.currentQuestion = this.generateQuestion()
    this.apples = this.generateApples(this.currentQuestion)
    this.score = 0
    this.lives = 5
    this.correctAnswers = 0
    this.gameState = "playing"
    this.gameRunning = true
    this.snakeFace = "normal"
    this.notification = null
    this.notificationTimer = 0
    this.waitingForMove = true
    this.paused = false
    this.inputLocked = false
    this.speed = this.baseSpeed

    // Setup timer for timed mode
    if (this.gameSettings.mode === "timed") {
      this.timeLeft = 60
      this.timerDisplay.style.display = "block"
      this.startCountdown(() => {
        this.startTimer()
      })
    } else {
      this.timerDisplay.style.display = "none"
    }


    // Set target based on mode
    if (this.gameSettings.mode === "endless") {
      this.targetElement.textContent = "♾️"
      this.targetElement.style.fontSize = "15px"
    } else {
      this.targetElement.textContent = this.targetAnswers
    }

    // Reset sprint state each new game
    this.sprint.active = false
    this.sprint.energy = this.sprint.maxEnergy

    // Reset shield state each new game
    this.hasShield = false
    this.shieldPickup = null
    this.shieldSpawned = false

    // Reset self-bite immunity
    this.selfBiteImmunityTimer = 0

    // Reset boss challenge state
    this.inBossChallenge = false
    this.bossAppleSpawned = false
    this.nextBossAt = 5

    // Reset endless rewards
    this.lifeRewardInterval = 10
    this.nextLifeRewardAt = 10

    this.updateUI()
    this.hideOverlays()
    this.updateShieldUI();
  }

  startTimer() {
    this.isPausedForEvent = true;

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    this.timerInterval = setInterval(() => {
      if (!this.paused) {
        this.timeLeft--;
        this.timerValue.textContent = this.timeLeft;

        if (this.timeLeft <= 0) {
          this.gameState = "lost";
          this.gameRunning = false;
          this.showGameOver();
          clearInterval(this.timerInterval);
        }
      }
    }, 1000);
  }

handleKeyDown(e) {
  const key = e.key.toLowerCase();
  const code = e.code;

  // Prevent all key actions when ESC menu is active, except ESC itself
  if (this.escMenuActive && key !== "escape") {
    e.preventDefault();
    return;
  }

  // Prevent snake from moving during countdown
  if (this.countdownActive) {
    e.preventDefault();
    return;
  }

  if (code === "ArrowUp" || code === "ArrowDown" || code === "ArrowLeft" || code === "ArrowRight") {
    e.preventDefault();
  }

  // Ignore auto-repeat when holding a key
  if (e.repeat) return;

  if (!this.restartConfirm.classList.contains("hidden")) {
    if (code === "Escape") {
      this.cancelRestart();
    } else if (code === "Enter") {
      this.confirmRestart();
    }
    return;
  }

  if (!this.gameRunning && key !== "r") return;

  let moved = false;

  // Pause toggle
  if (code === "Space" || key === " ") {
    e.preventDefault();
    this.paused = !this.paused;

    if (this.soundEnabled) {
      this.sounds.pause.currentTime = 0;
      this.sounds.pause.play();
    }
    return;
  }

  if (code === "KeyR" || key === "r") {
    this.showRestartConfirm();
    return;
  }

  // Sprint activation with Shift (left or right)
  if ((code === "ShiftLeft" || code === "ShiftRight") && !this.paused) {
    if (this.sprint.energy > 0) {
      this.sprint.active = true;
    }

    if (this.soundEnabled) {
      this.sounds.shift.currentTime = 0;
      this.sounds.shift.play();
    }

    return;
  }

  
        // Handle ESC key for menu
        if (code === "Escape" || key === "escape") {
            e.preventDefault();
            if (this.escMenuActive) {
                this.hideEscMenu();
            } else {
                this.showEscMenu();
            }
            return;
        }



    // If an input has already been processed for this move window, ignore further movement keys
    const isMovementKey = ["w", "arrowup", "s", "arrowdown", "a", "arrowleft", "d", "arrowright"].includes(key)
    if (this.inputLocked && isMovementKey) return

    // Handle ESC key for menu
    if (code === "Escape" || key === "escape") {
      e.preventDefault();
      if (this.escMenuActive) {
        this.hideEscMenu();
      } else {
        this.showEscMenu();
      }
      return;
    }

    // WASD and Arrow key movement
    switch (key) {
      case "w":
      case "arrowup":
        if (!this.paused && this.direction.y === 0) {
          this.direction = { x: 0, y: -1 }
          moved = true
        }
        break
      case "s":
      case "arrowdown":
        if (!this.paused && this.direction.y === 0) {
          this.direction = { x: 0, y: 1 }
          moved = true
        }
        break
      case "a":
      case "arrowleft":
        if (!this.paused && this.direction.x === 0) {
          this.direction = { x: -1, y: 0 }
          moved = true
        }
        break
      case "d":
      case "arrowright":
        if (!this.paused && this.direction.x === 0) {
          this.direction = { x: 1, y: 0 }
          moved = true
        }
        break
      case "escape":
        e.preventDefault();
        if (this.escMenuActive) {
          this.hideEscMenu();
        } else {
          this.showEscMenu();
        }
        break;
    }

    if (moved) {
      this.inputLocked = true
      this.playSound("snakeTurns")
      if (this.waitingForMove) {
        this.waitingForMove = false
      }
    }
  }

  handleKeyUp(e) {
    const code = e.code
    if (code === "ShiftLeft" || code === "ShiftRight") {
      this.sprint.active = false
    }
  }

  randInt(max) {
    return Math.floor(Math.random() * max)
  }

  getRandomPosition() {
    return {
      x: this.randInt(this.GRID_WIDTH),
      y: this.randInt(this.GRID_HEIGHT),
    }
  }

  getRandomDirection() {
    const dirs = [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
    ]
    return dirs[Math.floor(Math.random() * dirs.length)]
  }

  generateApples(question) {
    const newApples = []
    const usedPositions = new Set()

    question.options.forEach((option) => {
      let x, y
      do {
        x = this.randInt(this.GRID_WIDTH)
        y = this.randInt(this.GRID_HEIGHT)
      } while (
        usedPositions.has(`${x},${y}`) ||
        this.snake.some((segment) => segment.x === x && segment.y === y) ||
        this.cellIntersectsRect(x, y, this.sprintBar) ||
        this.isCellTooCloseToHead(x, y, this.minAppleDistanceFromHead)
      )

      usedPositions.add(`${x},${y}`)
      newApples.push({
        x,
        y,
        value: option,
        isCorrect: option === question.correctAnswer,
      })
    })

    return newApples
  }

  // Boss apple spawns a single special apple labeled "BOSS". When eaten, it
  // switches the game to a multi-operator hard question until solved.
  spawnBossApple() {
    if (this.bossAppleSpawned || this.inBossChallenge) return;

    const usedPositions = new Set();
    this.apples.forEach((a) => {
      const w = a.width || 1;
      const h = a.height || 1;
      for (let dx = 0; dx < w; dx++) {
        for (let dy = 0; dy < h; dy++) {
          usedPositions.add(`${a.x + dx},${a.y + dy}`);
        }
      }
    });
    this.snake.forEach((s) => usedPositions.add(`${s.x},${s.y}`));
    if (this.shieldPickup) usedPositions.add(`${this.shieldPickup.x},${this.shieldPickup.y}`);

    // Try to find a valid position for the boss apple (2x2)
    let bx, by, attempts = 0;
    const maxAttempts = 100; // Prevent infinite loops
    
    do {
      if (attempts++ > maxAttempts) {
        console.warn('Could not find valid position for boss apple');
        return; // Give up if we can't find a valid position
      }
      
      bx = this.randInt(Math.max(1, this.GRID_WIDTH - 1));
      by = this.randInt(Math.max(1, this.GRID_HEIGHT - 1));
      
      // Check if all 4 cells of the 2x2 boss apple are available
      const cells = [
        `${bx},${by}`, 
        `${bx + 1},${by}`, 
        `${bx},${by + 1}`, 
        `${bx + 1},${by + 1}`
      ];
      
      const isPositionValid = cells.every(cell => !usedPositions.has(cell)) &&
        !this.cellIntersectsRect(bx, by, this.sprintBar) &&
        !this.isCellTooCloseToHead(bx, by, Math.max(3, this.minAppleDistanceFromHead));
        
      if (isPositionValid) break;
    } while (true);

    // Add the boss apple
    this.apples.push({
      x: bx, 
      y: by,
      value: 'BOSS',
      isCorrect: false,
      type: 'boss',
      width: 2, 
      height: 2
    });

    this.bossAppleSpawned = true;
    this.showNotification('SnaQ boss apple appeared!', 'correct');
  }
  
  // Spawn a skip apple during boss challenge
  spawnSkipApple() {
    if (!this.inBossChallenge) return;
    
    const usedPositions = new Set();
    this.apples.forEach((a) => {
      usedPositions.add(`${a.x},${a.y}`);
    });
    this.snake.forEach((s) => usedPositions.add(`${s.x},${s.y}`));
    if (this.shieldPickup) usedPositions.add(`${this.shieldPickup.x},${this.shieldPickup.y}`);

    // Find a valid position for the skip apple
    let sx, sy, attempts = 0;
    const maxAttempts = 50;
    
    do {
      if (attempts++ > maxAttempts) {
        console.warn('Could not find valid position for skip apple');
        return; // Give up if we can't find a valid position
      }
      
      sx = this.randInt(this.GRID_WIDTH);
      sy = this.randInt(this.GRID_HEIGHT);
      
      if (!usedPositions.has(`${sx},${sy}`) && 
          !this.cellIntersectsRect(sx, sy, this.sprintBar) &&
          !this.isCellTooCloseToHead(sx, sy, this.minAppleDistanceFromHead)) {
        break;
      }
    } while (true);

    // Add the skip apple
    this.apples.push({
      x: sx, 
      y: sy,
      value: 'SKIP',
      isCorrect: false,
      type: 'skip',
      width: 1,
      height: 1
    });
    
    this.showNotification('Skip apple appeared!', 'correct');
  }


  // Create a hard 3-4 term expression with multiple operators and parentheses
  generateBossQuestion() {

    const ops = ['+', '-', '*'] // avoid division to keep integer results predictable
    const randIn = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

    // Build between 3 and 5 numbers
    const termsCount = randIn(4, 5) // 4-5 numbers → 3-4 operators
    const nums = Array.from({ length: termsCount }, () => randIn(1, 12))
    const operators = Array.from({ length: termsCount - 1 }, () => ops[this.randInt(ops.length)])

    // Randomly add one set of parentheses around a sub-range
    let open = this.randInt(termsCount - 1)
    let close = randIn(open + 1, termsCount - 1)

    // Build expression string with parentheses
    let expr = ''
    for (let i = 0; i < termsCount; i++) {
      const isOpen = i === open
      const isClose = i === close
      if (isOpen) expr += '('
      expr += nums[i]
      if (isClose) expr += ')'
      if (i < operators.length) expr += ` ${operators[i]} `
    }

    // Evaluate safely using Function
    let correctAnswer
    try {
      // eslint-disable-next-line no-new-func
      correctAnswer = Number(Function(`"use strict"; return (${expr});`)())
    } catch (e) {
      // Fallback simple expression if something goes wrong
      expr = '1 + 2 * 3 - 1'
      correctAnswer = 1 + 2 * 3 - 1
    }

    // Build option set around the result
    const options = new Set([correctAnswer])
    const variance = [1, 2, 3, 4, 5, -1, -2, -3]
    while (options.size < 4) {
      const delta = variance[this.randInt(variance.length)]
      options.add(correctAnswer + delta)
    }

    // Shuffle options
    const shuffled = Array.from(options)
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    return { question: `${expr} = ?`, correctAnswer, options: shuffled }
  }

  showNotification(message, type) {
    this.notification = { message, type }
    this.notificationTimer = 75
  }

  hideOverlays() {
    this.gameOverOverlay.classList.add("hidden")
    this.restartConfirm.classList.add("hidden")
  }
  showPlayAgainConfirm() {
    this.restartConfirm.classList.remove("hidden")
  }
  showRestartConfirm() {
    this.restartConfirm.classList.remove("hidden")
  }

  confirmRestart() {
    this.restartConfirm.classList.add("hidden")
    if (this.gameLoopId) {
      cancelAnimationFrame(this.gameLoopId)
      this.gameLoopId = null
    }
    if (this.timerInterval) {
      clearInterval(this.timerInterval)
      this.timerInterval = null
    }
    this.gameRunning = false

    // Reset game state completely
    setTimeout(() => {
      this.gameRunning = true
      this.initGame()
      this.gameLoop()
    }, 100)
  }

  cancelRestart() {
    this.restartConfirm.classList.add("hidden")
  }

  moveSnake() {
    if (this.isCountdownActive) return  // 🚫 don’t move while countdown is running
    const newSnake = [...this.snake]
    const head = { ...newSnake[0] }

    head.x += this.direction.x
    head.y += this.direction.y

    if (head.x < 0) head.x = this.GRID_WIDTH - 1
    if (head.x >= this.GRID_WIDTH) head.x = 0
    if (head.y < 0) head.y = this.GRID_HEIGHT - 1
    if (head.y >= this.GRID_HEIGHT) head.y = 0

    // Self-collision handling with temporary immunity
    if (newSnake.some((segment) => segment.x === head.x && segment.y === head.y)) {
      // If currently immune, allow passing through self without penalty once per frame
      if (this.selfBiteImmunityTimer > 0) {
        // Proceed without penalty (acts like body is intangible during immunity)
      } else {
        this.lives--

        this.playSound("snakeLosesLife")

        if (this.lives <= 0) {
          this.gameState = "lost"
          this.gameRunning = false
          this.snakeFace = "dead"
          this.playSound("snakeDies")
          this.showGameOver()
          return
        }

        this.snakeFace = "disgust"
        this.showNotification("Self-bite! -1 life", "wrong")

        if (this.snake.length > 1) {
          this.snake.pop()
        }

        // Spawn shield pickup if eligible after losing a life
        this.spawnShieldIfEligible()

        // Start immunity window to avoid repeated instant self-bites
        this.selfBiteImmunityTimer = this.selfBiteImmunityDuration

        this.updateUI()
        this.inputLocked = false
        return
      }
    }

    newSnake.unshift(head)

    // Collect shield pickup if present at head
    if (this.shieldPickup && head.x === this.shieldPickup.x && head.y === this.shieldPickup.y) {
      this.hasShield = true
      this.shieldPickup = null
      this.playSound("correct")
      this.showNotification("Shield acquired!✨", "correct")
    }

    const eatenApple = this.getAppleAt(head.x, head.y)
    if (eatenApple) {
      // Handle different apple types
      if (eatenApple.type === 'boss') {
        // Handle boss apple - start boss challenge
        this.playSound("bossApple")
        this.apples = this.apples.filter((a) => a !== eatenApple)
        this.inBossChallenge = true
        this.bossAppleSpawned = false
        this.currentQuestion = this.generateBossQuestion()
        this.apples = this.generateApples(this.currentQuestion)
        
        // Spawn a skip apple for the boss challenge
        this.spawnSkipApple()
        
        this.showNotification("Boss Challenge! Find the skip apple if you get stuck.", "correct")
        this.snake = newSnake
        this.updateUI()
        this.inputLocked = false
        return
      } 
      else if (eatenApple.type === 'skip') {
        // Handle skip apple - end boss challenge
        this.apples = this.apples.filter(a => a.type !== 'boss' && a.type !== 'skip')
        this.inBossChallenge = false
        this.bossAppleSpawned = false
        this.showNotification("Boss skipped!", "correct")
        this.currentQuestion = this.generateQuestion()
        this.apples = this.generateApples(this.currentQuestion)
        this.snake = newSnake
        this.updateUI()
        this.inputLocked = false
        return
      }

      if (eatenApple.isCorrect) {
        this.score += 10
        this.correctAnswers++
        this.addToTotalPoints(10) // Add points to total points system

        // Track statistics for achievements
        this.sessionStats.applesEaten++
        this.sessionStats.correctAnswers++

        this.playSound("correct")
        this.playSound("biteApple")

        if (this.gameSettings.difficulty === "hard") {
          this.speed += this.speedIncrement
        } else if (this.correctAnswers % 3 === 0 && this.correctAnswers > 0) {
          this.speed += this.speedIncrement
        }

        if (this.gameSettings.mode !== "endless" && this.correctAnswers >= this.targetAnswers) {
          this.gameState = "won"
          this.gameRunning = false
          this.snakeFace = "happy"
          this.playSound("youWon")
          this.showGameOver()
          this.inputLocked = false
          return
        }

        // If inside boss challenge, grant bonus and exit boss mode
        if (this.inBossChallenge) {
          this.snakeFace = "happy"
          this.score += 50 // extra bonus for boss (total +25)
          this.addToTotalPoints(50) // Add bonus points to total
          this.showNotification("+50 points!!", "correct")
          this.inBossChallenge = false
          this.currentQuestion = this.generateQuestion()
          this.apples = this.generateApples(this.currentQuestion)
        } else {
          this.snakeFace = "happy"
          this.showNotification("Correct! +10 points", "correct")
          this.currentQuestion = this.generateQuestion()
          this.apples = this.generateApples(this.currentQuestion)
        }

        // Consider spawning next boss apple in endless mode
        if (
          this.gameSettings.mode === 'endless' &&
          !this.inBossChallenge &&
          !this.bossAppleSpawned &&
          this.correctAnswers >= this.nextBossAt
        ) {
          this.apples = []
          this.spawnBossApple()
          this.nextBossAt += 5
        }

        if (eatenApple.type === 'boss') {
          this.playSound("bossApple");
          this.apples = this.apples.filter((a) => a !== eatenApple);
          this.inBossChallenge = true;
          this.bossAppleSpawned = false;
          this.currentQuestion = this.generateBossQuestion();
          this.apples = this.generateApples(this.currentQuestion);
          this.showNotification("Boss!!!", "correct");

          // Spawn a Skip apple somewhere on the grid
          const usedPositions = new Set();
          this.snake.forEach((s) => usedPositions.add(`${s.x},${s.y}`));
          this.apples.forEach((a) => usedPositions.add(`${a.x},${a.y}`));

          let sx, sy;
          do {
            sx = this.randInt(this.GRID_WIDTH - 1);
            sy = this.randInt(this.GRID_HEIGHT - 1);
          } while (
            usedPositions.has(`${sx},${sy}`) ||
            this.isCellTooCloseToHead(sx, sy, this.minAppleDistanceFromHead)
          );

          this.apples.push({
            x: sx,
            y: sy,
            value: 'SKIP',
            isCorrect: false,
            type: 'skip'
          });

          // Grow snake by one like a normal apple pickup
          this.snake = newSnake;
          this.updateUI();
          this.inputLocked = false;
          return;
        }


        // Endless reward: every 10 correct answers -> +1 life, or shield if full
        if (this.gameSettings.mode === 'endless' && this.correctAnswers >= this.nextLifeRewardAt) {
          // Determine max lives (default 5)
          const maxLives = this.maxLives || 5
          if (this.lives < maxLives) {
            this.lives = Math.min(maxLives, this.lives + 1)
            if (this.sounds?.goodJob) this.playSound('goodJob')
            this.showNotification('Extra life! ❤️', 'correct')
          } else if (!this.hasShield) {
            this.hasShield = true
            if (this.sounds?.goodJob) this.playSound('goodJob')
            this.showNotification('Shield granted!✨', 'correct')
          } else {
            // Already full life and shield: small score bonus
            this.score += 10
            this.addToTotalPoints(10) // Add bonus points to total
            this.showNotification('Bonus +10 points', 'correct')
          }
          this.updateUI()
          this.nextLifeRewardAt += this.lifeRewardInterval
        }
      } else {
        // WRONG ANSWER
        if (this.hasShield) {
          // Shield blocks the penalty once
          this.hasShield = false
          this.updateShieldUI();
          this.snakeFace = "normal"
          this.showNotification("Shield saved you!✨", "correct")

          // Remove the eaten wrong apple and replace with a new option
          this.apples = this.apples.filter((apple) => apple !== eatenApple)
          this.addNewApple()

          this.updateUI()
          // Keep length the same (consume cell but no growth)
          newSnake.pop()
        } else {
          this.score = Math.max(0, this.score - 5)
          this.lives--

          // Track that this is no longer a perfect game
          this.sessionStats.perfectGame = false

          this.playSound("snakeLosesLife")

          if (this.lives <= 0) {
            this.gameState = "lost"
            this.gameRunning = false
            this.snakeFace = "dead"
            this.playSound("snakeDies")
            this.showGameOver()
            return
          }

          this.snakeFace = "disgust"
          this.showNotification("Wrong! -5 points, -1 life", "wrong")

          if (this.snake.length > 1) {
            this.snake.pop()
          }

          this.apples = this.apples.filter((apple) => apple !== eatenApple)
          this.addNewApple()

          // After losing a life, see if we should spawn the shield pickup
          this.spawnShieldIfEligible()

          this.updateUI()
          newSnake.pop()
        }
      }
    } else {
      newSnake.pop()
      if (this.snakeFace !== "dead") {
        this.snakeFace = "normal"
      }
    }

    this.snake = newSnake
    this.updateUI()
    // Unlock input after completing a move step
    this.inputLocked = false
  }

  updateShieldUI() {
    const shieldIndicator = $id('shield-indicator');
    if (shieldIndicator) {
      if (this.hasShield) {
        shieldIndicator.innerHTML = '<img src="../../assets/images/icons/shield.png" class="shield-icon" alt="Shield">';
      } else {
        shieldIndicator.innerHTML = '';
      }
    }
  }

  addNewApple() {
    const usedPositions = new Set()

    this.apples.forEach((apple) => {
      usedPositions.add(`${apple.x},${apple.y}`)
    })

    this.snake.forEach((segment) => {
      usedPositions.add(`${segment.x},${segment.y}`)
    })

    // Prevent spawning on an existing shield pickup
    if (this.shieldPickup) {
      usedPositions.add(`${this.shieldPickup.x},${this.shieldPickup.y}`)
    }

    const availableOptions = this.currentQuestion.options.filter(
      (option) => !this.apples.some((apple) => apple.value === option),
    )

    if (availableOptions.length > 0) {
      const randomOption = availableOptions[Math.floor(Math.random() * availableOptions.length)]

      let x, y
      do {
        x = this.randInt(this.GRID_WIDTH)
        y = this.randInt(this.GRID_HEIGHT)
      } while (
        usedPositions.has(`${x},${y}`) ||
        this.cellIntersectsRect(x, y, this.sprintBar) ||
        this.isCellTooCloseToHead(x, y, this.minAppleDistanceFromHead)
      )

      this.apples.push({
        x,
        y,
        value: randomOption,
        isCorrect: randomOption === this.currentQuestion.correctAnswer,
      })
    }
  }

  // Return apple occupying a position; supports 2x2 boss apple cells
  getAppleAt(gridX, gridY) {
    // Ensure gridX and gridY are within bounds
    if (gridX < 0 || gridX >= this.GRID_WIDTH || gridY < 0 || gridY >= this.GRID_HEIGHT) {
      return null;
    }
    
    return this.apples.find((apple) => {
      const w = apple.width || 1;
      const h = apple.height || 1;
      
      // Check if the given grid position is within the apple's bounds
      return gridX >= apple.x && 
             gridX < apple.x + w && 
             gridY >= apple.y && 
             gridY < apple.y + h;
    });
  }

  // Spawn shield pickup if player has exactly 1 life and no shield spawned yet
  spawnShieldIfEligible() {
    if (this.lives === 1 && !this.shieldSpawned && !this.hasShield && !this.shieldPickup) {
      const used = new Set()
      this.snake.forEach((s) => used.add(`${s.x},${s.y}`))
      this.apples.forEach((a) => used.add(`${a.x},${a.y}`))
      let x, y
      do {
        x = this.randInt(this.GRID_WIDTH)
        y = this.randInt(this.GRID_HEIGHT)
      } while (used.has(`${x},${y}`))
      this.shieldPickup = { x, y }
      this.shieldSpawned = true
      this.showNotification("Shield appeared!✨", "correct")
    }
  }

  showGameOver() {
    // Stop timer
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    // Play appropriate sound
    if (this.gameState === "won") {
      this.playSound("youWon");
      // this.playSound("goodJob")
    } else {
      this.playSound("snakeDies");
    }

    // Update HUD values
    if (this.scoreElement) this.scoreElement.textContent = this.score;
    if (this.livesElement) this.livesElement.textContent = this.lives;
    if (this.correctElement) this.correctElement.textContent = this.correctAnswers;

    // Update hearts in background
    if (this.heartsContainer) {
      const hearts = this.heartsContainer.querySelectorAll(".heart");
      hearts.forEach((heart, index) => {
        if (index < this.lives) {
          heart.classList.add("filled");
          heart.classList.remove("empty");
        } else {
          heart.classList.remove("filled");
          heart.classList.add("empty");
        }
      });
    }


    // Show Game Over screen
    if (this.gameOverTitle && this.finalScoreElement && this.gameOverOverlay) {

      this.gameOverTitle.textContent =
        this.gameState === "won" ? "You Won! 🎉" : "Game Over 💀";

      // Toggle classes for styling
      this.gameOverTitle.classList.remove("won", "lost");
      this.gameOverTitle.classList.add(this.gameState === "won" ? "won" : "lost");

      // Update final stats
      const maxLives = this.maxLives || 5; // fallback if not defined

      this.finalScoreElement.textContent = `Final Score: ${this.score}`;
      if (this.finalCorrectElement) {
        this.finalCorrectElement.innerHTML = `Corrects: ${this.correctAnswers}/${this.targetAnswers === Infinity ? '<span class="big-infinity">♾️</span>' : this.targetAnswers}`;
      }
      
      // Display the correct answer for the last question
      if (this.correctAnswerDisplay && this.currentQuestion) {
        this.correctAnswerDisplay.textContent = `The correct answer is ${this.currentQuestion.correctAnswer}`;
      }
      
      // Show the overlay
      this.gameOverOverlay.classList.remove("hidden");

      // Submit score to the leaderboard
      const username = localStorage.getItem('playerUsername');
      if (username && window.LeaderboardManager) {
        const leaderboardManager = new window.LeaderboardManager();
        leaderboardManager.submitScore(username, this.score, 'math');
      }

      // Submit statistics for achievements
      this.submitGameStatistics();
    }
  }


  drawPixelSnakeFace(x, y, face) {
    const centerX = x + this.GRID_SIZE / 2
    const centerY = y + this.GRID_SIZE / 2

    // Pixel eyes
    this.ctx.fillStyle = "#000"
    const eyeSize = Math.max(2, Math.floor(this.GRID_SIZE / 8))
    const eyeOffset = Math.max(4, Math.floor(this.GRID_SIZE / 4))

    this.ctx.fillRect(centerX - eyeOffset, centerY - 4, eyeSize, eyeSize)
    this.ctx.fillRect(centerX + eyeOffset - eyeSize, centerY - 4, eyeSize, eyeSize)

    // Pixel mouth
    this.ctx.fillStyle = "#000"
    switch (face) {
      case "happy":
        // Smile - pixel style
        this.ctx.fillRect(centerX - 3, centerY + 2, 2, 2)
        this.ctx.fillRect(centerX - 1, centerY + 3, 2, 2)
        this.ctx.fillRect(centerX + 1, centerY + 2, 2, 2)
        break
      case "disgust":
        // Frown - pixel style
        this.ctx.fillRect(centerX - 3, centerY + 4, 2, 2)
        this.ctx.fillRect(centerX - 1, centerY + 3, 2, 2)
        this.ctx.fillRect(centerX + 1, centerY + 4, 2, 2)
        break
      case "dead":
        // X eyes
        this.ctx.fillStyle = "#ff0000"
        this.ctx.fillRect(centerX - eyeOffset, centerY - 4, eyeSize, eyeSize)
        this.ctx.fillRect(centerX + eyeOffset - eyeSize, centerY - 4, eyeSize, eyeSize)
        // Straight line mouth
        this.ctx.fillStyle = "#000"
        this.ctx.fillRect(centerX - 4, centerY + 2, 8, 2)
        break
      default:
        // Normal mouth - straight line
        this.ctx.fillRect(centerX - 3, centerY + 2, 6, 2)
    }
  }

  drawPixelNotification(notification) {
    const { message, type } = notification

    // Pixel-style notification box
    this.ctx.fillStyle = type === "correct" ? "#32cd32" : "#ff4444"
    this.ctx.fillRect(this.CANVAS_WIDTH / 2 - 150, 40, 300, 60)

    // Pixel border
    this.ctx.strokeStyle = "#000"
    this.ctx.lineWidth = 4
    this.ctx.strokeRect(this.CANVAS_WIDTH / 2 - 150, 40, 300, 60)

    // Inner border
    this.ctx.strokeStyle = "#fff"
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(this.CANVAS_WIDTH / 2 - 148, 42, 296, 56)

    // Pixel text with shadow
    this.ctx.font = "10px 'Press Start 2P', monospace"
    this.ctx.textAlign = "center"
    this.ctx.textBaseline = "middle"

    this.ctx.fillStyle = "#000"
    this.ctx.fillText(message, this.CANVAS_WIDTH / 2 + 1, 71)
    this.ctx.fillStyle = "#fff"
    this.ctx.fillText(message, this.CANVAS_WIDTH / 2, 70)
  }

  draw() {
    // Set pixelated rendering
    this.ctx.imageSmoothingEnabled = false

    this.ctx.clearRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT)

    // Draw snake using sprites
    this.snake.forEach((segment, index) => {
      const x = segment.x * this.GRID_SIZE
      const y = segment.y * this.GRID_SIZE

      if (index === 0) {
        // ===== HEAD =====
        const next = this.snake[index + 1];
        const dirNext = { x: next.x - segment.x, y: next.y - segment.y };

        let outOfBoundX;
        if (dirNext.x === - (this.GRID_WIDTH - 1) || dirNext.x === 1) outOfBoundX = 1; else if (dirNext.x === this.GRID_WIDTH - 1 || dirNext.x === -1) outOfBoundX = -1;

        let outOfBoundY;
        if (dirNext.y === - (this.GRID_HEIGHT - 1) || dirNext.y === 1) outOfBoundY = 1; else if (dirNext.y === this.GRID_HEIGHT - 1 || dirNext.y === -1) outOfBoundY = -1;


        let headSprite = this.sprites.SnakeHead;  // default (North)
        let accessorySprite = this.sprites.Accessory;

        if (this.direction.x === 1) { // Facing East

          if (outOfBoundY === 1) { // Going North turning East
            headSprite = this.sprites.SnakeHeadCorner4;
          } else if (outOfBoundY === -1) { // Going South turning East
            headSprite = this.sprites.SnakeHeadCorner6
          } else { //Straight going East;
            headSprite = this.sprites.SnakeHeadRight;
          }
          accessorySprite = this.sprites.AccessoryRight;
        } else if (this.direction.x === -1) { // Facing West

          if (outOfBoundY === 1) { // Going North turning West
            headSprite = this.sprites.SnakeHeadCorner8;
          } else if (outOfBoundY === -1) { // Going South turning West
            headSprite = this.sprites.SnakeHeadCorner2;
          } else { //Straight going West
            headSprite = this.sprites.SnakeHeadLeft;
          }
          accessorySprite = this.sprites.AccessoryLeft;
        } else if (this.direction.y === 1) { // Facing South

          if (outOfBoundX === 1) { // Going East turning South
            headSprite = this.sprites.SnakeHeadCorner7;
          } else if (outOfBoundX === -1) { // Going West turning South
            headSprite = this.sprites.SnakeHeadCorner3;
          } else { //Straight going West
            headSprite = this.sprites.SnakeHeadDown;
          }
          accessorySprite = this.sprites.AccessoryDown;

        } else { // Facing North

          if (outOfBoundX === 1) { // Going East turning North
            headSprite = this.sprites.SnakeHeadCorner1
          } else if (outOfBoundX === -1) { // Going West turning North
            headSprite = this.sprites.SnakeHeadCorner5
          } else { //Straight going North
            headSprite = this.sprites.SnakeHead;
          }
          accessorySprite = this.sprites.Accessory;
        }

        if (headSprite?.complete && headSprite.naturalWidth > 0) {
          this.ctx.drawImage(headSprite, x, y, this.GRID_SIZE, this.GRID_SIZE);
        } else {
          // Fallback head rendering
          this.ctx.fillStyle = "#32cd32";
          this.ctx.fillRect(x, y, this.GRID_SIZE, this.GRID_SIZE);
          this.drawPixelSnakeFace(x, y, this.snakeFace);
        }
        
        if (accessorySprite?.complete && accessorySprite.naturalWidth > 0) {
          this.ctx.drawImage(accessorySprite, x, y, this.GRID_SIZE, this.GRID_SIZE);
        }
      } else if (index === this.snake.length - 1) {
        // ===== TAIL =====
        const prev = this.snake[index - 1];
        const dirPrev = { x: segment.x - prev.x, y: segment.y - prev.y };

        let outOfBoundPrevX;
        if (dirPrev.x === - (this.GRID_WIDTH - 1) || dirPrev.x === 1) outOfBoundPrevX = 1; else if (dirPrev.x === this.GRID_WIDTH - 1 || dirPrev.x === -1) outOfBoundPrevX = -1;

        let outOfBoundPrevY;
        if (dirPrev.y === - (this.GRID_HEIGHT - 1) || dirPrev.y === 1) outOfBoundPrevY = 1; else if (dirPrev.y === this.GRID_HEIGHT - 1 || dirPrev.y === -1) outOfBoundPrevY = -1;

        let tailSprite = this.sprites.SnakeTail; // default (North)
        if (outOfBoundPrevX === -1) tailSprite = this.sprites.SnakeTailRight;
        else if (outOfBoundPrevX === 1) tailSprite = this.sprites.SnakeTailLeft;
        else if (outOfBoundPrevY === -1) tailSprite = this.sprites.SnakeTailDown;
        else tailSprite = this.sprites.SnakeTail;

        if (tailSprite?.complete && tailSprite.naturalWidth > 0) {
          this.ctx.drawImage(tailSprite, x, y, this.GRID_SIZE, this.GRID_SIZE);
        } else {
          this.ctx.fillStyle = "#228b22";
          this.ctx.fillRect(x, y, this.GRID_SIZE, this.GRID_SIZE);
        }
      } else {
        // ===== BODY =====
        const prev = this.snake[index - 1];
        const next = this.snake[index + 1];

        const dirPrev = { x: segment.x - prev.x, y: segment.y - prev.y };
        const dirNext = { x: next.x - segment.x, y: next.y - segment.y };

        let outOfBoundPrevX;
        if (dirPrev.x === - (this.GRID_WIDTH - 1) || dirPrev.x === 1) outOfBoundPrevX = 1; else if (dirPrev.x === this.GRID_WIDTH - 1 || dirPrev.x === -1) outOfBoundPrevX = -1;

        let outOfBoundPrevY;
        if (dirPrev.y === - (this.GRID_HEIGHT - 1) || dirPrev.y === 1) outOfBoundPrevY = 1; else if (dirPrev.y === this.GRID_HEIGHT - 1 || dirPrev.y === -1) outOfBoundPrevY = -1;

        let outOfBoundNextX;
        if (dirNext.x === - (this.GRID_WIDTH - 1) || dirNext.x === 1) outOfBoundNextX = 1; else if (dirNext.x === this.GRID_WIDTH - 1 || dirNext.x === -1) outOfBoundNextX = -1;

        let outOfBoundNextY;
        if (dirNext.y === - (this.GRID_HEIGHT - 1) || dirNext.y === 1) outOfBoundNextY = 1; else if (dirNext.y === this.GRID_HEIGHT - 1 || dirNext.y === -1) outOfBoundNextY = -1;

        let bodySprite;

        // Straight segments
        if (dirPrev.x === dirNext.x) {
          // horizontal
          bodySprite = (dirPrev.x !== 0) ? this.sprites.SnakeBodyRight : this.sprites.SnakeBody;
        } else if (dirPrev.y === dirNext.y) {
          // vertical
          bodySprite = (dirPrev.y !== 0) ? this.sprites.SnakeBody : this.sprites.SnakeBodyRight;
        } else {
          // ===== CORNERS =====
          if (
            (outOfBoundNextY === -1 && outOfBoundPrevX === -1) ||
            (outOfBoundNextX === 1 && outOfBoundPrevY === 1)
          ) {
            bodySprite = this.sprites.SnakeCornerLeftDown;

          } else if (
            (outOfBoundNextY === -1 && outOfBoundPrevX === 1) ||
            (outOfBoundNextX === -1 && outOfBoundPrevY === 1)
          ) {
            bodySprite = this.sprites.SnakeCornerRightDown;
          } else if (
            (outOfBoundNextY === 1 && outOfBoundPrevX === -1) ||
            (outOfBoundNextX === 1 && outOfBoundPrevY === -1)
          ) {
            bodySprite = this.sprites.SnakeCornerLeftUp;
          } else if (
            (outOfBoundNextY === 1 && outOfBoundPrevX === 1) ||
            (outOfBoundNextX === -1 && outOfBoundPrevY === -1)
          ) {
            bodySprite = this.sprites.SnakeCornerRightUp;
          }
        }

        // Draw body
        if (bodySprite?.complete && bodySprite.naturalWidth > 0) {
          this.ctx.drawImage(bodySprite, x, y, this.GRID_SIZE, this.GRID_SIZE);
        } else {
          this.ctx.fillStyle = "#006400";
          this.ctx.fillRect(x, y, this.GRID_SIZE, this.GRID_SIZE);
        }
      }

    });

    // Use shield pickup icon if present
    if (this.shieldPickup) {
      const px = this.shieldPickup.x * this.GRID_SIZE
      const py = this.shieldPickup.y * this.GRID_SIZE

      const shieldSprite = this.sprites["shield"]
      this.ctx.drawImage(shieldSprite, px, py, this.GRID_SIZE, this.GRID_SIZE)
    }


    this.apples.forEach((apple) => {
      const x = apple.x * this.GRID_SIZE
      const y = apple.y * this.GRID_SIZE

      

        const appleSprite = 
    apple.type === 'skip'
      ? this.sprites.skipApple
      : this.sprites.apple;

      const drawW = (apple.width || 1) * this.GRID_SIZE
      const drawH = (apple.height || 1) * this.GRID_SIZE

      if (appleSprite && appleSprite.complete && appleSprite.naturalWidth > 0) {
        this.ctx.drawImage(appleSprite, x, y, drawW, drawH)
      } else {
        // Fallback to red rectangle if sprite not loaded
        this.ctx.fillStyle = "#ff4444"
        this.ctx.fillRect(x, y, drawW, drawH)

        // Pixel border
        this.ctx.strokeStyle = "#000"
        this.ctx.lineWidth = 2
        this.ctx.strokeRect(x, y, drawW, drawH)
      }

      // Draw label on top of apple
      const fontSize = Math.max(8, Math.floor(this.GRID_SIZE * 0.3))
      this.ctx.font = `${fontSize}px "Press Start 2P", monospace`
      this.ctx.textAlign = "center"
      this.ctx.textBaseline = "middle"

      let displayText
      if (apple.type === 'boss') {
        // Boss apple label
        displayText = 'BOSS'
        // Glow outline
        this.ctx.strokeStyle = '#ffd700'
        this.ctx.lineWidth = 3
        this.ctx.strokeRect(x + 1, y + 1, drawW - 2, drawH - 2)
      } else {
        displayText = apple.value.toString()
      }

      const centerX = x + drawW / 2
      const centerY = y + drawH / 2
      const maxLength = Math.floor(((apple.width || 1) * this.GRID_SIZE) / 6)
      if (displayText.length > maxLength) {
        displayText = displayText.substring(0, maxLength - 1) + '.'
      }

      // Text shadow for pixel effect
      this.ctx.fillStyle = '#000'
      this.ctx.fillText(displayText, centerX + 1, centerY + 1)

      this.ctx.fillStyle = '#fff'
      this.ctx.fillText(displayText, centerX, centerY)
    })

    if (this.notification && this.notificationTimer > 0) {
      this.drawPixelNotification(this.notification)
      this.notificationTimer--
    }

    if (this.paused) {
      this.ctx.fillStyle = "rgba(0,0,0,0.8)"
      this.ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT)

      this.ctx.fillStyle = "#fff"
      this.ctx.font = "16px 'Press Start 2P', monospace"
      this.ctx.textAlign = "center"
      this.ctx.textBaseline = "middle"

      this.ctx.fillStyle = "#000"
      this.ctx.fillText("PAUSED", this.CANVAS_WIDTH / 2 + 2, this.CANVAS_HEIGHT / 2 + 2)
      this.ctx.fillStyle = "#fff"
      this.ctx.fillText("PAUSED", this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT / 2)
    }

    if (!this.paused) {
      const marginDown = 20
      const bar = this.sprintBar
      const barY = bar.y + marginDown
      this.ctx.fillStyle = "#222"
      this.ctx.fillRect(bar.x, bar.y, bar.width, bar.height)
      this.ctx.strokeStyle = "#000"
      this.ctx.lineWidth = 3
      this.ctx.strokeRect(bar.x, bar.y, bar.width, bar.height)
      const fillWidth = Math.floor(bar.width * (this.sprint.energy / this.sprint.maxEnergy))
      this.ctx.fillStyle = this.sprint.active ? "#ffd166" : "#06d6a0"
      this.ctx.fillRect(bar.x, bar.y, fillWidth, bar.height)
      this.ctx.strokeStyle = "#fff"
      this.ctx.lineWidth = 1
      this.ctx.strokeRect(bar.x + 2, bar.y + 2, bar.width - 4, bar.height - 4)
      this.ctx.font = "10px 'Press Start 2P', monospace"
      this.ctx.textAlign = "left"
      this.ctx.textBaseline = "bottom"
      this.ctx.fillStyle = "#000"
      this.ctx.fillText("SPRINT", bar.x + 7, barY - 5.4)
      this.ctx.fillStyle = "#fff"
      this.ctx.fillText("SPRINT", bar.x + 6, barY - 7)
    }
  }

  gameLoop(timestamp = 0) {
    if (!this.gameRunning) return

    const delta = (timestamp - this.lastFrameTime) / 1000
    this.lastFrameTime = timestamp

    // Update sprint energy each frame
    if (!this.paused) {
      if (this.sprint.active) {
        this.sprint.energy -= this.sprint.drainPerSecond * delta
        if (this.sprint.energy <= 0) {
          this.sprint.energy = 0
          this.sprint.active = false
        }
      } else {
        this.sprint.energy += this.sprint.regenPerSecond * delta
        if (this.sprint.energy > this.sprint.maxEnergy) this.sprint.energy = this.sprint.maxEnergy
      }
    }

    // Tick down self-bite immunity timer
    if (this.selfBiteImmunityTimer > 0) {
      this.selfBiteImmunityTimer -= delta
      if (this.selfBiteImmunityTimer < 0) this.selfBiteImmunityTimer = 0
    }

    if (!this.waitingForMove && !this.paused) {
      this.moveAccumulator += delta
      const speedMultiplier = this.speedMultipliers[this.speedLevel - 1] || 1.0;
      const baseSpeed = this.speed * speedMultiplier;
      const effectiveSpeed = baseSpeed * (this.sprint.active && this.sprint.energy > 0 ? this.sprint.multiplier : 1)
      const moveInterval = 1 / effectiveSpeed

      while (this.moveAccumulator >= moveInterval) {
        this.moveSnake()
        this.moveAccumulator -= moveInterval
      }
    }

    this.draw()
    this.gameLoopId = requestAnimationFrame((timestamp) => this.gameLoop(timestamp))
  }

  setDifficultySettings() {
    const difficultyConfig = {
      easy: {
        gridSize: 40,
        baseSpeed: 5.5,
        speedIncrease: 0.35,
      },
      medium: {
        gridSize: 40,
        baseSpeed: 6.3,
        speedIncrease: 0.55,
      },
      hard: {
        gridSize: 40,
        baseSpeed: 7.5,
        speedIncrease: 0.65,
      },
    }

    this.difficultySettings = difficultyConfig[this.gameSettings.difficulty]
    this.GRID_SIZE = this.difficultySettings.gridSize
  }

  startCountdown(callback) {
    this.isCountdownActive = true  // lock movement
    this.countdownActive = true;
    this.showCountdown(() => {
      this.isCountdownActive = false // unlock after countdown
      if (callback) callback()
    })
  }

  showCountdown(callback) {
    this.countdownActive = true;
    const countdownOverlay = document.createElement("div")
    countdownOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      font-family: 'Press Start 2P', monospace;
    `

    const countdownNumber = document.createElement("div")
    countdownNumber.style.cssText = `
      font-size: 72px;
      color: #32cd32;
      text-align: center;
      text-shadow: 4px 4px 0px #000;
    `
    countdownNumber.textContent = "3"

    countdownOverlay.appendChild(countdownNumber)
    document.body.appendChild(countdownOverlay)

    this.playSound("countdown")

    let count = 3
    const countdownInterval = setInterval(() => {
      count--
      if (count > 0) {
        countdownNumber.textContent = count
      } else if (count === 0) {
        countdownNumber.textContent = "GO!"
        countdownNumber.style.color = "#ff4444"
      } else {
        clearInterval(countdownInterval)
        countdownOverlay.remove()
        this.countdownActive = false;
        if (callback) callback()
      }
    }, 1000)
  }

  // Helper: check if a grid cell intersects a pixel rect
  cellIntersectsRect(gridX, gridY, rect) {
    const cellX = gridX * this.GRID_SIZE
    const cellY = gridY * this.GRID_SIZE
    const cellW = this.GRID_SIZE
    const cellH = this.GRID_SIZE
    const rX2 = rect.x + rect.width
    const rY2 = rect.y + rect.height
    const cX2 = cellX + cellW
    const cY2 = cellY + cellH
    return !(cX2 <= rect.x || rX2 <= cellX || cY2 <= rect.y || rY2 <= cellY)
  }

  // Helper: ensure apples don't spawn too close to the snake's head
  // Uses wrap-aware distance since the board wraps at edges
  isCellTooCloseToHead(gridX, gridY, minDistance) {
    if (!this.snake || this.snake.length === 0) return false
    const head = this.snake[0]
    const dx = Math.abs(gridX - head.x)
    const dy = Math.abs(gridY - head.y)
    // wrap-aware (toroidal) distance on each axis
    const wrapDx = Math.min(dx, this.GRID_WIDTH - dx)
    const wrapDy = Math.min(dy, this.GRID_HEIGHT - dy)
    const manhattan = wrapDx + wrapDy
    return manhattan <= (minDistance ?? 2)
  }

  addToTotalPoints(points) {
    // Add points to the total points system for skin purchases
    const currentTotal = parseInt(localStorage.getItem("totalPoints")) || 0
    const newTotal = currentTotal + points
    localStorage.setItem("totalPoints", newTotal.toString())
  }

  submitGameStatistics() {
    // Calculate play time in milliseconds
    const totalPlayTime = Date.now() - this.sessionStats.startTime;
    
    // Prepare statistics
    const stats = {
      applesEaten: this.sessionStats.applesEaten,
      correctAnswers: this.sessionStats.correctAnswers,
      gamesPlayed: 1,
      perfectGames: (this.sessionStats.perfectGame && this.gameState === "won") ? 1 : 0,
      totalPlayTime: totalPlayTime
    };

    console.log('=== MATH GAME STATISTICS SUBMISSION ===');
    console.log('Session stats:', this.sessionStats);
    console.log('Game state:', this.gameState);
    console.log('Prepared stats:', stats);

    // Try to save to localStorage first as a fallback
    try {
      const existingStats = JSON.parse(localStorage.getItem("gameStats")) || {};
      const updatedStats = {
        totalApplesEaten: (existingStats.totalApplesEaten || 0) + stats.applesEaten,
        correctAnswers: (existingStats.correctAnswers || 0) + stats.correctAnswers,
        gamesPlayed: (existingStats.gamesPlayed || 0) + stats.gamesPlayed,
        perfectGames: (existingStats.perfectGames || 0) + stats.perfectGames,
        totalPlayTime: (existingStats.totalPlayTime || 0) + stats.totalPlayTime
      };
      
      localStorage.setItem("gameStats", JSON.stringify(updatedStats));
      console.log('Statistics saved to localStorage:', updatedStats);
    } catch (e) {
      console.error('Failed to save stats to localStorage:', e);
    }

    // Try to post message to parent/opener
    try {
      if (window.parent && window.parent !== window) {
        console.log('Posting message to parent window...');
        window.parent.postMessage({
          type: 'gameStatistics',
          stats: stats
        }, '*');
      } else if (window.opener && !window.opener.closed) {
        console.log('Posting message to opener window...');
        window.opener.postMessage({
          type: 'gameStatistics',
          stats: stats
        }, '*');
      } else {
        console.log('No parent or opener window found');
      }
    } catch (e) {
      console.error('Error posting message:', e);
    }
    
    // Also update the landing page if it's in the same window (for testing)
    try {
      if (window.landingPageInstance) {
        console.log('Updating landing page instance directly');
        window.landingPageInstance.updateGameStats(stats);
      }
    } catch (e) {
      console.error('Error updating landing page instance:', e);
    }
  }
}

function checkZoomLevel() {
  if (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    return;
  }

  // Calculate zoom (innerWidth / outerWidth is more accurate across browsers)
  const zoom = (window.outerWidth / window.innerWidth) * 100;

  const modal = document.getElementById("zoom-warning");
  
  if (zoom >= 100) {
    modal.style.display = "flex"; // show popup
  } else {
    modal.style.display = "none"; // hide popup
  }
}


const settingsBtn = document.getElementById("settings-btn");
const settingsMenu = document.getElementById("settings-menu");

settingsBtn.addEventListener("click", () => {
    settingsMenu.classList.toggle("hidden");
});


// Close button
document.getElementById("close-zoom-warning").addEventListener("click", () => {
  document.getElementById("zoom-warning").style.display = "none";
});

// Run check on load and whenever window is resized
window.addEventListener("load", checkZoomLevel);
window.addEventListener("resize", checkZoomLevel);
const aboutModal = document.getElementById("about-modal");
const closeAbout = document.getElementById("close-about");
const aboutBtn = document.getElementById("about-btn");

if (aboutBtn) {
  aboutBtn.addEventListener("click", () => {
    aboutModal.classList.remove("hidden");
  });
}

if (closeAbout) {
  closeAbout.addEventListener("click", () => {
    aboutModal.classList.add("hidden");
  });
}

// Make the D-pad draggable
const dpad = document.getElementById("dpad");

let isDragging = false;
let offsetX, offsetY;

dpad.addEventListener("mousedown", (e) => {
  isDragging = true;
  offsetX = e.clientX - dpad.getBoundingClientRect().left;
  offsetY = e.clientY - dpad.getBoundingClientRect().top;
});

document.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  dpad.style.left = e.clientX - offsetX + "px";
  dpad.style.top = e.clientY - offsetY + "px";
  dpad.style.right = "auto";  // so right/bottom don’t override
  dpad.style.bottom = "auto";
});

document.addEventListener("mouseup", () => {
  isDragging = false;
});

document.addEventListener("DOMContentLoaded", () => {
  console.log('DOMContentLoaded - Initializing game...');
  const game = new SnakeMathGame()
  
  // Always show the tutorial when the game loads
  console.log('Setting up tutorial...');
  // Small delay to ensure all elements are rendered
  setTimeout(() => {
    console.log('Creating MiniTutorial instance...');
    const miniTutorial = new MiniTutorial(game);
    // Pause the game during tutorial
    if (game.gameState === 'playing') {
      console.log('Pausing game for tutorial...');
      game.togglePause();
    }
  }, 1000);
})
