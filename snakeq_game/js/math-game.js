document.addEventListener("keydown", (e) => {
  // Stop page from scrolling when using arrow keys
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
    e.preventDefault()
  }

  // Your game controls here
  switch (e.key) {
    case "ArrowUp":
      // move up
      break
    case "ArrowDown":
      // move down
      break
    case "ArrowLeft":
      // move left
      break
    case "ArrowRight":
      // move right
      break
  }
})


class SnakeMathGame {
  constructor() {
    // Game constants
    this.gameSettings = JSON.parse(localStorage.getItem("gameSettings")) || {
      mode: "quiz",
      difficulty: "easy",
    }

    this.setDifficultySettings()

    this.CANVAS_WIDTH = 800
    this.CANVAS_HEIGHT = 480
    this.GRID_WIDTH = Math.floor(this.CANVAS_WIDTH / this.GRID_SIZE)
    this.GRID_HEIGHT = Math.floor(this.CANVAS_HEIGHT / this.GRID_SIZE)

    this.sounds = {
      biteApple: new Audio("../sounds/bite-apple.mp3"),
      snakeTurns: new Audio("../sounds/snake-turns.mp3"),
      snakeDies: new Audio("../sounds/snake-dies.mp3"),
      snakeLosesLife: new Audio("../sounds/snake-loses-life.mp3"),
      correct: new Audio("../sounds/correct.mp3"),
      youWon: new Audio("../sounds/you-won.mp3"),
      bgMusic: new Audio("../sounds/music.mp3"),
      click: new Audio("../sounds/click.mp3"),
      countdown: new Audio("../sounds/countdown.mp3"),
    }

    this.sounds.bgMusic.volume = 0.2
    this.sounds.bgMusic.loop = true
    this.sounds.click.volume = 0.5

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
    this.lives = 3
    this.correctAnswers = 0
    this.targetAnswers = this.gameSettings.mode === "endless" ? "♾️" : 10
    this.currentQuestion = null
    this.snakeFace = "normal"
    this.notification = null
    this.notificationTimer = 0
    this.waitingForMove = true
    this.paused = false
    this.showConfirm = false

    this.baseSpeed = this.difficultySettings.baseSpeed
    this.speed = this.baseSpeed
    this.speedIncrement = this.difficultySettings.speedIncrease

    this.pauseTimer = 0
    this.isPausedForEvent = false

    // Timer for timed mode
    this.timeLeft = 60
    this.timerInterval = null

    // Animation
    this.lastFrameTime = 0
    this.moveAccumulator = 0
    this.gameLoopId = null

    this.initDOM()
    this.init()
  }

  loadSprites() {
    const spriteNames = [
      "SnakeHead",
      "SnakeHeadLeft",
      "SnakeHeadRight",
      "SnakeHeadDown",
      "SnakeBody", // Added SnakeBody sprite
      "SnakeTail",
      "SnakeTailLeft",
      "SnakeTailRight",
      "SnakeTailDown",
      "SnakeBodyLeft",
      "SnakeBodyRight",
      "SnakeCornerLeftDown",
      "SnakeCornerRightUp",
      "SnakeCornerLeftUp",
      "SnakeCornerRightDown",
      "apple",

    ]

    spriteNames.forEach((name) => {
      this.sprites[name] = new Image()
      this.sprites[name].src = `../assets/${name}.png`
    })
  }


  playSound(soundName) {
    if (this.soundEnabled && this.sounds[soundName]) {
      this.sounds[soundName].currentTime = 0
      this.sounds[soundName].play().catch((e) => console.log("Audio play failed:", e))
    }
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled
    localStorage.setItem("soundEnabled", this.soundEnabled.toString())

    const soundBtn = document.getElementById("sound-btn")
    soundBtn.textContent = this.soundEnabled ? "🔊" : "🔇"
    soundBtn.classList.toggle("active", this.soundEnabled)
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled
    localStorage.setItem("musicEnabled", this.musicEnabled.toString())

    const musicBtn = document.getElementById("music-btn")
    musicBtn.textContent = this.musicEnabled ? "🎵" : "🔇"
    musicBtn.classList.toggle("active", this.musicEnabled)

    if (this.musicEnabled) {
      this.sounds.bgMusic.loop = true
      this.sounds.bgMusic.play().catch((e) => console.log("Music play failed:", e))
    } else {
      this.sounds.bgMusic.pause()
    }
  }

  initDOM() {
    this.canvas = document.getElementById("game-canvas")
    this.ctx = this.canvas.getContext("2d")
    this.scoreElement = document.getElementById("score-value")
    this.livesElement = document.getElementById("lives-value")
    this.correctElement = document.getElementById("correct-value")
    this.targetElement = document.getElementById("target-value")
    this.questionElement = document.getElementById("question-display")
    this.gameOverOverlay = document.getElementById("game-over-overlay")
    this.gameOverTitle = document.getElementById("game-over-title")
    this.finalScoreElement = document.getElementById("final-score")
    this.finalCorrectElement = document.getElementById("final-correct")
    this.playAgainBtn = document.getElementById("play-again-btn")
    this.menuBtn = document.getElementById("menu-btn")
    this.restartConfirm = document.getElementById("restart-confirm")
    this.confirmRestartBtn = document.getElementById("confirm-restart")
    this.cancelRestartBtn = document.getElementById("cancel-restart")
    this.timerDisplay = document.getElementById("timer-display")
    this.timerValue = document.getElementById("timer-value")
    this.heartsContainer = document.getElementById("hearts-container")
    this.helpBtn = document.getElementById("help-btn")
    this.soundBtn = document.getElementById("sound-btn")
    this.musicBtn = document.getElementById("music-btn")
    this.instructionsModal = document.getElementById("instructions-modal")
    this.closeInstructionsBtn = document.getElementById("close-instructions")
  }

  init() {
    this.initGame()
    this.bindEvents()
    this.gameLoop()
    this.initializeAudioStates()
  }

  initializeAudioStates() {
    const soundBtn = document.getElementById("sound-btn")
    const musicBtn = document.getElementById("music-btn")

    if (soundBtn) {
      soundBtn.textContent = this.soundEnabled ? "🔊" : "🔇"
      soundBtn.classList.toggle("active", this.soundEnabled)
    }

    if (musicBtn) {
      musicBtn.textContent = this.musicEnabled ? "🎵" : "🔇"
      musicBtn.classList.toggle("active", this.musicEnabled)

      if (this.musicEnabled) {
        this.sounds.bgMusic.loop = true
        this.sounds.bgMusic.play().catch((e) => console.log("Music play failed:", e))
      }
    }

    document.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
        if (this.soundEnabled && this.sounds.click) {
        this.sounds.click.currentTime = 0 // restart if spam clicked
        this.sounds.click.play()
        }
    })
    })

  }


  bindEvents() {
    document.addEventListener("keydown", (e) => this.handleKeyDown(e))

    this.playAgainBtn.addEventListener("click", () => {
      this.playSound("click")
      this.showRestartConfirm()
    })
    this.menuBtn.addEventListener("click", () => {
      this.playSound("click")
      window.location.href = "../index.html"
    })
    this.confirmRestartBtn.addEventListener("click", () => {
      this.playSound("click")
      this.confirmRestart()
    })
    this.cancelRestartBtn.addEventListener("click", () => {
      this.playSound("click")
      this.cancelRestart()
    })

    this.helpBtn.addEventListener("click", () => {
      this.playSound("click")
      this.showInstructions()
    })
    this.soundBtn.addEventListener("click", () => this.toggleSound())
    this.musicBtn.addEventListener("click", () => this.toggleMusic())
    this.closeInstructionsBtn.addEventListener("click", () => {
      this.playSound("click")
      this.hideInstructions()
    })

    // Close instructions modal when clicking outside
    this.instructionsModal.addEventListener("click", (e) => {
      if (e.target === this.instructionsModal) {
        this.hideInstructions()
      }
    })
  }

  showInstructions() {
    this.instructionsModal.classList.remove("hidden")
  }

  hideInstructions() {
    this.instructionsModal.classList.add("hidden")
  }

  updateUI() {
    this.scoreElement.textContent = this.score
    this.correctElement.textContent = this.correctAnswers
    this.questionElement.textContent = this.currentQuestion ? this.currentQuestion.question : "Loading..."

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
  }

  generateQuestion() {
  const difficulty = this.gameSettings.difficulty;
  
  // Difficulty settings
  const settings = {
    easy:   { range: 10,  maxMult: 5,   allowDiv: false },
    medium: { range: 50,  maxMult: 12,  allowDiv: true  },
    hard:   { range: 100, maxMult: 20,  allowDiv: true  }
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

  // ✅ Generate wrong options
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
    this.snake = [this.getRandomPosition()]
    this.direction = this.getRandomDirection()
    this.currentQuestion = this.generateQuestion()
    this.apples = this.generateApples(this.currentQuestion)
    this.score = 0
    this.lives = 3
    this.correctAnswers = 0
    this.gameState = "playing"
    this.gameRunning = true
    this.snakeFace = "normal"
    this.notification = null
    this.notificationTimer = 0
    this.waitingForMove = true
    this.paused = false
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

    this.updateUI()
    this.hideOverlays()
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      this.timeLeft--
      this.timerValue.textContent = this.timeLeft

      if (this.timeLeft <= 0) {
        this.gameState = "lost"
        this.gameRunning = false
        this.showGameOver()
        clearInterval(this.timerInterval)
      }
    }, 1000)
  }

  handleKeyDown(e) {
    const key = e.key.toLowerCase()
    const code = e.code

    if (code === "ArrowUp" || code === "ArrowDown" || code === "ArrowLeft" || code === "ArrowRight") {
      e.preventDefault()
    }

    if (!this.restartConfirm.classList.contains("hidden")) {
      if (code === "Escape") {
        this.cancelRestart()
      } else if (code === "Enter") {
        this.confirmRestart()
      }
      return
    }

    if (!this.gameRunning && key !== "r") return

    let moved = false

    if (code === "Space" || key === " ") {
      e.preventDefault()
      this.paused = !this.paused
      return
    }

    if (code === "KeyR" || key === "r") {
      this.showRestartConfirm()
      return
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
    }

    if (moved) {
      this.playSound("snakeTurns")
      if (this.waitingForMove) {
        this.waitingForMove = false
      }
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
      } while (usedPositions.has(`${x},${y}`) || this.snake.some((segment) => segment.x === x && segment.y === y))

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

  showNotification(message, type) {
    this.notification = { message, type }
    this.notificationTimer = 60
  }

  hideOverlays() {
    this.gameOverOverlay.classList.add("hidden")
    this.restartConfirm.classList.add("hidden")
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

    if (newSnake.some((segment) => segment.x === head.x && segment.y === head.y)) {
      this.lives--
      this.snakeFace = "disgust"
      this.showNotification("Self-bite! -1 life", "wrong")

      this.playSound("snakeLosesLife")

      if (this.snake.length > 1) {
        this.snake.pop()
      }

      this.updateUI()
      return
    }

    newSnake.unshift(head)

    const eatenApple = this.apples.find((apple) => apple.x === head.x && apple.y === head.y)
    if (eatenApple) {
      if (eatenApple.isCorrect) {
        this.score += 10
        this.correctAnswers++

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
          return
        }

        this.snakeFace = "happy"
        this.showNotification("Correct! +10 points", "correct")

        this.currentQuestion = this.generateQuestion()
        this.apples = this.generateApples(this.currentQuestion)
      } else {
        this.score = Math.max(0, this.score - 5)
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
        this.showNotification("Wrong! -5 points, -1 life", "wrong")


        if (this.snake.length > 1) {
          this.snake.pop()
        }

        this.apples = this.apples.filter((apple) => apple !== eatenApple)
        this.addNewApple()

        this.updateUI()
        newSnake.pop()
      }
    } else {
      newSnake.pop()
      if (this.snakeFace !== "dead") {
        this.snakeFace = "normal"
      }
    }

    this.snake = newSnake
    this.updateUI()
  }

  addNewApple() {
    const usedPositions = new Set()

    this.apples.forEach((apple) => {
      usedPositions.add(`${apple.x},${apple.y}`)
    })

    this.snake.forEach((segment) => {
      usedPositions.add(`${segment.x},${segment.y}`)
    })

    const availableOptions = this.currentQuestion.options.filter(
      (option) => !this.apples.some((apple) => apple.value === option),
    )

    if (availableOptions.length > 0) {
      const randomOption = availableOptions[Math.floor(Math.random() * availableOptions.length)]

      let x, y
      do {
        x = this.randInt(this.GRID_WIDTH)
        y = this.randInt(this.GRID_HEIGHT)
      } while (usedPositions.has(`${x},${y}`))

      this.apples.push({
        x,
        y,
        value: randomOption,
        isCorrect: randomOption === this.currentQuestion.correctAnswer,
      })
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
    const maxLives = this.maxLives || 3; // fallback if not defined

    this.finalScoreElement.textContent = `Final Score: ${this.score}`;
    if (this.finalCorrectElement) {
    this.finalCorrectElement.innerHTML = `Corrects: ${this.correctAnswers}/${this.targetAnswers === Infinity ? '<span class="big-infinity">♾️</span>' : this.targetAnswers}`;
    }
    // Show the overlay
    this.gameOverOverlay.classList.remove("hidden");
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
    this.ctx.fillRect(this.CANVAS_WIDTH /2 - 150, 40, 300, 60)

    // Pixel border
    this.ctx.strokeStyle = "#000"
    this.ctx.lineWidth = 4
    this.ctx.strokeRect(this.CANVAS_WIDTH /2 - 150, 40, 300, 60)

    // Inner border
    this.ctx.strokeStyle = "#fff"
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(this.CANVAS_WIDTH /  2 - 148, 42, 296, 56)

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
        // Snake head - choose sprite based on direction
        let headSprite = this.sprites.SnakeHead // default up
        if (this.direction.x === 1) headSprite = this.sprites.SnakeHeadRight
        else if (this.direction.x === -1) headSprite = this.sprites.SnakeHeadLeft
        else if (this.direction.y === 1) headSprite = this.sprites.SnakeHeadDown

        if (headSprite && headSprite.complete) {
          this.ctx.drawImage(headSprite, x, y, this.GRID_SIZE, this.GRID_SIZE)
        } else {
          // Fallback to colored rectangle
          this.ctx.fillStyle = "#32cd32"
          this.ctx.fillRect(x, y, this.GRID_SIZE, this.GRID_SIZE)
          this.drawPixelSnakeFace(x, y, this.snakeFace)
        }
      } else if (index === this.snake.length - 1) {
        // TAIL
        const prevSegment = this.snake[index - 1]
        const tailDir = { x: prevSegment.x - segment.x, y: prevSegment.y - segment.y }

        let tailSprite = this.sprites.SnakeTail // default up
        if (tailDir.x === 1) tailSprite = this.sprites.SnakeTailRight
        else if (tailDir.x === -1) tailSprite = this.sprites.SnakeTailLeft
        else if (tailDir.y === 1) tailSprite = this.sprites.SnakeTailDown

        if (tailSprite?.complete) {
          this.ctx.drawImage(tailSprite, x, y, this.GRID_SIZE, this.GRID_SIZE)
        } else {
          // Fallback to colored rectangle
          this.ctx.fillStyle = "#228b22"
          this.ctx.fillRect(x, y, this.GRID_SIZE, this.GRID_SIZE)
        }
      } else {
      // ===== BODY =====
        const prev = this.snake[index - 1];
        const next = this.snake[index + 1];

        const dirPrev = { x: segment.x - prev.x, y: segment.y - prev.y };
        const dirNext = { x: next.x - segment.x, y: next.y - segment.y };

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
            (dirPrev.x === -1 && dirNext.y === -1) || // left → up
            (dirPrev.y === 1 && dirNext.x === 1)    // down → right
          ) {
            bodySprite = this.sprites.SnakeCornerLeftDown;
          } else if (
            (dirPrev.x === 1 && dirNext.y === -1) ||  // right → up
            (dirPrev.y === 1 && dirNext.x === -1)     // down → left
          ) {
            bodySprite = this.sprites.SnakeCornerRightDown;
          } else if (
            (dirPrev.x === -1 && dirNext.y === 1) ||  // left → down
            (dirPrev.y === -1 && dirNext.x === 1)     // up → right
          ) {
            bodySprite = this.sprites.SnakeCornerLeftUp;
          } else if (
            (dirPrev.x === 1 && dirNext.y === 1) ||   // right → down
            (dirPrev.y === -1 && dirNext.x === -1)      // up → left
          ) {
            bodySprite = this.sprites.SnakeCornerRightUp;
          }
        }

        // Draw body
        if (bodySprite?.complete) {
          this.ctx.drawImage(bodySprite, x, y, this.GRID_SIZE, this.GRID_SIZE);
        } else {
          this.ctx.fillStyle = "#006400";
          this.ctx.fillRect(x, y, this.GRID_SIZE, this.GRID_SIZE);
        }
      }

      });


    this.apples.forEach((apple) => {
      const x = apple.x * this.GRID_SIZE
      const y = apple.y * this.GRID_SIZE

      const appleSprite = this.sprites.apple

      if (appleSprite && appleSprite.complete) {
        this.ctx.drawImage(appleSprite, x, y, this.GRID_SIZE, this.GRID_SIZE)
      } else {
        // Fallback to red rectangle if sprite not loaded
        this.ctx.fillStyle = "#ff4444"
        this.ctx.fillRect(x, y, this.GRID_SIZE, this.GRID_SIZE)

        // Pixel border
        this.ctx.strokeStyle = "#000"
        this.ctx.lineWidth = 2
        this.ctx.strokeRect(x, y, this.GRID_SIZE, this.GRID_SIZE)
      }

      // Draw answer text on top of apple
      this.ctx.fillStyle = "#fff"
      const fontSize = Math.max(8, Math.floor(this.GRID_SIZE * 0.3))
      this.ctx.font = `${fontSize}px "Press Start 2P", monospace`
      this.ctx.textAlign = "center"
      this.ctx.textBaseline = "middle"

      let displayText = apple.value.toString()
      const maxLength = Math.floor(this.GRID_SIZE / 6)
      if (displayText.length > maxLength) {
        displayText = displayText.substring(0, maxLength - 1) + "."
      }

      // Text shadow for pixel effect
      this.ctx.fillStyle = "#000"
      this.ctx.fillText(displayText, x + this.GRID_SIZE / 2 + 1, y + this.GRID_SIZE / 2 + 1)

      this.ctx.fillStyle = "#fff"
      this.ctx.fillText(displayText, x + this.GRID_SIZE / 2, y + this.GRID_SIZE / 2)
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
  }

  gameLoop(timestamp = 0) {
    if (!this.gameRunning) return

    const delta = (timestamp - this.lastFrameTime) / 1000
    this.lastFrameTime = timestamp

    if (!this.waitingForMove && !this.paused) {
      this.moveAccumulator += delta
      const moveInterval = 1 / this.speed

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
        baseSpeed: 3,
        speedIncrease: 0.35,
      },
      medium: {
        gridSize: 40,
        baseSpeed: 4,
        speedIncrease: 0.55,
      },
      hard: {
        gridSize: 50,
        baseSpeed: 4.5,
        speedIncrease: 0.65,
      },
    }

    this.difficultySettings = difficultyConfig[this.gameSettings.difficulty]
    this.GRID_SIZE = this.difficultySettings.gridSize
  }

  startCountdown(callback) {
    this.isCountdownActive = true  // lock movement

     // play countdown sound effect
    if (this.soundEnabled && this.sounds.countdown) {
      this.sounds.countdown.currentTime = 0
      this.sounds.countdown.play()
        .catch(e => console.log("Countdown sound failed:", e))
    }
    
    this.showCountdown(() => {
      this.isCountdownActive = false // unlock after countdown
      if (callback) callback()
    })
  }

  showCountdown(callback) {
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
        if (callback) callback()
      }
    }, 1000)
  }
}

    const copyrightModal = document.getElementById("copyright-modal");
    const closeCopyright = document.getElementById("close-copyright");
    const copyrightBtn = document.getElementById("copyright-btn"); // You can place a button in header/footer

    if (copyrightBtn) {
    copyrightBtn.addEventListener("click", () => {
        copyrightModal.classList.remove("hidden");
    });
    }

    if (closeCopyright) {
    closeCopyright.addEventListener("click", () => {
        copyrightModal.classList.add("hidden");
    });
    }


document.addEventListener("DOMContentLoaded", () => {
  new SnakeMathGame()
})
