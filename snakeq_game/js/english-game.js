class SnakeEnglishGame {
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
    }

    this.soundEnabled = localStorage.getItem("soundEnabled") !== "false" // default true
    this.musicEnabled = localStorage.getItem("musicEnabled") === "true"

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
    this.targetAnswers = this.gameSettings.mode === "endless" ? Number.POSITIVE_INFINITY : 10
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
      "SnakeBody",
      "SnakeTail",
      "SnakeTailLeft",
      "SnakeTailRight",
      "SnakeTailDown",
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
    this.optionsElement = document.getElementById("options-display")
    this.gameOverOverlay = document.getElementById("game-over-overlay")
    this.gameOverTitle = document.getElementById("game-over-title")
    this.finalScoreElement = document.getElementById("final-score")
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
  }

  bindEvents() {
    document.addEventListener("keydown", (e) => this.handleKeyDown(e))
    this.playAgainBtn.addEventListener("click", () => this.showRestartConfirm())
    this.menuBtn.addEventListener("click", () => (window.location.href = "../index.html"))
    this.confirmRestartBtn.addEventListener("click", () => this.confirmRestart())
    this.cancelRestartBtn.addEventListener("click", () => this.cancelRestart())

    this.helpBtn.addEventListener("click", () => this.showInstructions())
    this.soundBtn.addEventListener("click", () => this.toggleSound())
    this.musicBtn.addEventListener("click", () => this.toggleMusic())
    this.closeInstructionsBtn.addEventListener("click", () => this.hideInstructions())

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

    // Update options display
    if (this.currentQuestion && this.optionsElement) {
      this.optionsElement.innerHTML = ""
      this.currentQuestion.options.forEach((option, index) => {
        const letter = String.fromCharCode(65 + index) // A, B, C
        const optionDiv = document.createElement("div")
        optionDiv.className = "option-item"
        optionDiv.innerHTML = `
          <span class="option-letter ${this.getAppleColor(index)}">${letter}</span>
          <span class="option-text">${option}</span>
        `
        this.optionsElement.appendChild(optionDiv)
      })
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
  }

  getAppleColor(index) {
    const colors = ["red-apple", "green-apple", "blue-apple", "yellow-apple"]
    return colors[index] || "red-apple"
  }

  generateQuestion() {
    const difficulty = this.gameSettings.difficulty
    const questionTypes = ["vocabulary", "grammar", "reading"]
    const type = questionTypes[Math.floor(Math.random() * questionTypes.length)]

    let question, correctAnswer, options

    switch (type) {
      case "vocabulary":
        const vocabQuestions = this.getVocabularyQuestions(difficulty)
        const vocabQ = vocabQuestions[Math.floor(Math.random() * vocabQuestions.length)]
        question = vocabQ.question
        correctAnswer = vocabQ.correct
        options = vocabQ.options
        break
      case "grammar":
        const grammarQuestions = this.getGrammarQuestions(difficulty)
        const grammarQ = grammarQuestions[Math.floor(Math.random() * grammarQuestions.length)]
        question = grammarQ.question
        correctAnswer = grammarQ.correct
        options = grammarQ.options
        break
      case "reading":
        const readingQuestions = this.getReadingQuestions(difficulty)
        const readingQ = readingQuestions[Math.floor(Math.random() * readingQuestions.length)]
        question = readingQ.question
        correctAnswer = readingQ.correct
        options = readingQ.options
        break
      default:
        question = "What is the synonym of 'happy'?"
        correctAnswer = "joyful"
        options = ["joyful", "sad", "angry", "tired"]
    }

    // Shuffle options
    const shuffledOptions = [...options]
    for (let i = shuffledOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]]
    }

    return { question, correctAnswer, options: shuffledOptions }
  }

  getVocabularyQuestions(difficulty) {
    const easy = [
      {
        question: "What is the synonym of 'big'?",
        correct: "large",
        options: ["large", "small", "tiny", "short"],
      },
      {
        question: "What is the antonym of 'hot'?",
        correct: "cold",
        options: ["cold", "warm", "cool", "freezing"],
      },
      {
        question: "What does 'happy' mean?",
        correct: "joyful",
        options: ["joyful", "sad", "angry", "tired"],
      },
    ]

    const medium = [
      {
        question: "What is the synonym of 'magnificent'?",
        correct: "splendid",
        options: ["splendid", "ordinary", "terrible", "small"],
      },
      {
        question: "What is the antonym of 'abundant'?",
        correct: "scarce",
        options: ["scarce", "plenty", "many", "numerous"],
      },
      {
        question: "What does 'persevere' mean?",
        correct: "persist",
        options: ["persist", "quit", "start", "ignore"],
      },
    ]

    const hard = [
      {
        question: "What is the synonym of 'ubiquitous'?",
        correct: "omnipresent",
        options: ["omnipresent", "rare", "absent", "limited"],
      },
      {
        question: "What is the antonym of 'ephemeral'?",
        correct: "permanent",
        options: ["permanent", "temporary", "brief", "fleeting"],
      },
      {
        question: "What does 'perspicacious' mean?",
        correct: "perceptive",
        options: ["perceptive", "confused", "ignorant", "careless"],
      },
    ]

    return difficulty === "easy" ? easy : difficulty === "medium" ? medium : hard
  }

  getGrammarQuestions(difficulty) {
    const easy = [
      {
        question: "Choose the correct verb: 'She ___ to school every day.'",
        correct: "goes",
        options: ["goes", "go", "going", "gone"],
      },
      {
        question: "Which is correct: 'I have ___ apples.'",
        correct: "two",
        options: ["two", "to", "too", "2nd"],
      },
    ]

    const medium = [
      {
        question: "Choose the correct form: 'If I ___ rich, I would travel.'",
        correct: "were",
        options: ["were", "was", "am", "be"],
      },
      {
        question: "Which is correct: 'The book ___ on the table.'",
        correct: "lies",
        options: ["lies", "lays", "laying", "lying"],
      },
    ]

    const hard = [
      {
        question: "Choose the correct subjunctive: 'I wish I ___ there yesterday.'",
        correct: "had been",
        options: ["had been", "was", "were", "have been"],
      },
      {
        question: "Which is correct: 'Neither of the students ___ ready.'",
        correct: "is",
        options: ["is", "are", "were", "have"],
      },
    ]

    return difficulty === "easy" ? easy : difficulty === "medium" ? medium : hard
  }

  getReadingQuestions(difficulty) {
    const easy = [
      {
        question: "In 'The cat sat on the mat', what did the cat do?",
        correct: "sat",
        options: ["sat", "ran", "jumped", "slept"],
      },
    ]

    const medium = [
      {
        question: "What is the main idea of a paragraph about recycling benefits?",
        correct: "environmental protection",
        options: ["environmental protection", "waste creation", "pollution increase", "resource depletion"],
      },
    ]

    const hard = [
      {
        question: "What literary device is used in 'The wind whispered secrets'?",
        correct: "personification",
        options: ["personification", "metaphor", "simile", "alliteration"],
      },
    ]

    return difficulty === "easy" ? easy : difficulty === "medium" ? medium : hard
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
      this.showCountdown(() => {
        this.startTimer()
      })
    } else {
      this.timerDisplay.style.display = "none"
    }

    // Set target based on mode
    if (this.gameSettings.mode === "endless") {
      this.targetElement.textContent = "∞"
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
    const colors = ["#ff4444", "#44ff44", "#4444ff", "#ffff44"] // Red, Green, Blue, Yellow

    question.options.forEach((option, index) => {
      let x, y
      do {
        x = this.randInt(this.GRID_WIDTH)
        y = this.randInt(this.GRID_HEIGHT)
      } while (usedPositions.has(`${x},${y}`) || this.snake.some((segment) => segment.x === x && segment.y === y))

      usedPositions.add(`${x},${y}`)
      newApples.push({
        x,
        y,
        value: String.fromCharCode(65 + index), // A, B, C, D
        originalValue: option,
        isCorrect: option === question.correctAnswer,
        color: colors[index] || colors[0],
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
    const colors = ["#ff4444", "#44ff44", "#4444ff", "#ffff44"]

    this.apples.forEach((apple) => {
      usedPositions.add(`${apple.x},${apple.y}`)
    })

    this.snake.forEach((segment) => {
      usedPositions.add(`${segment.x},${segment.y}`)
    })

    const availableOptions = this.currentQuestion.options.filter(
      (option) => !this.apples.some((apple) => apple.originalValue === option),
    )

    if (availableOptions.length > 0) {
      const randomOption = availableOptions[Math.floor(Math.random() * availableOptions.length)]
      const optionIndex = this.currentQuestion.options.indexOf(randomOption)

      let x, y
      do {
        x = this.randInt(this.GRID_WIDTH)
        y = this.randInt(this.GRID_HEIGHT)
      } while (usedPositions.has(`${x},${y}`))

      this.apples.push({
        x,
        y,
        value: String.fromCharCode(65 + optionIndex),
        originalValue: randomOption,
        isCorrect: randomOption === this.currentQuestion.correctAnswer,
        color: colors[optionIndex] || colors[0],
      })
    }
  }

  showGameOver() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval)
    }

    // Update the score and lives in the HUD to reflect final state
    this.scoreElement.textContent = this.score
    this.livesElement.textContent = this.lives
    this.correctElement.textContent = this.correctAnswers

    // Update hearts display in background
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

    this.gameOverTitle.textContent = this.gameState === "won" ? "You Won! 🎉" : "Game Over 💀"
    this.gameOverTitle.className = this.gameState === "won" ? "won" : "lost"
    this.finalScoreElement.textContent = `Final Score: ${this.score} | Lives Lost: ${3 - this.lives}/3`
    this.gameOverOverlay.classList.remove("hidden")
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
        this.ctx.fillRect(centerX - 3, centerY + 2, 2, 2)
        this.ctx.fillRect(centerX - 1, centerY + 3, 2, 2)
        this.ctx.fillRect(centerX + 1, centerY + 2, 2, 2)
        break
      case "disgust":
        this.ctx.fillRect(centerX - 3, centerY + 4, 2, 2)
        this.ctx.fillRect(centerX - 1, centerY + 3, 2, 2)
        this.ctx.fillRect(centerX + 1, centerY + 4, 2, 2)
        break
      case "dead":
        this.ctx.fillStyle = "#ff0000"
        this.ctx.fillRect(centerX - eyeOffset, centerY - 4, eyeSize, eyeSize)
        this.ctx.fillRect(centerX + eyeOffset - eyeSize, centerY - 4, eyeSize, eyeSize)
        this.ctx.fillStyle = "#000"
        this.ctx.fillRect(centerX - 4, centerY + 2, 8, 2)
        break
      default:
        this.ctx.fillRect(centerX - 3, centerY + 2, 6, 2)
    }
  }

  drawPixelNotification(notification) {
    const { message, type } = notification

    this.ctx.fillStyle = type === "correct" ? "#32cd32" : "#ff4444"
    this.ctx.fillRect(this.CANVAS_WIDTH / 2 - 120, 40, 240, 60)

    this.ctx.strokeStyle = "#000"
    this.ctx.lineWidth = 4
    this.ctx.strokeRect(this.CANVAS_WIDTH / 2 - 120, 40, 240, 60)

    this.ctx.strokeStyle = "#fff"
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(this.CANVAS_WIDTH / 2 - 118, 42, 236, 56)

    this.ctx.font = "10px 'Press Start 2P', monospace"
    this.ctx.textAlign = "center"
    this.ctx.textBaseline = "middle"

    this.ctx.fillStyle = "#000"
    this.ctx.fillText(message, this.CANVAS_WIDTH / 2 + 1, 71)
    this.ctx.fillStyle = "#fff"
    this.ctx.fillText(message, this.CANVAS_WIDTH / 2, 70)
  }

  draw() {
    this.ctx.imageSmoothingEnabled = false
    this.ctx.clearRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT)

    // Draw snake using sprites
    this.snake.forEach((segment, index) => {
      const x = segment.x * this.GRID_SIZE
      const y = segment.y * this.GRID_SIZE

      if (index === 0) {
        let headSprite = this.sprites.SnakeHead
        if (this.direction.x === 1) headSprite = this.sprites.SnakeHeadRight
        else if (this.direction.x === -1) headSprite = this.sprites.SnakeHeadLeft
        else if (this.direction.y === 1) headSprite = this.sprites.SnakeHeadDown

        if (headSprite && headSprite.complete) {
          this.ctx.drawImage(headSprite, x, y, this.GRID_SIZE, this.GRID_SIZE)
        } else {
          this.ctx.fillStyle = "#32cd32"
          this.ctx.fillRect(x, y, this.GRID_SIZE, this.GRID_SIZE)
          this.drawPixelSnakeFace(x, y, this.snakeFace)
        }
      } else if (index === this.snake.length - 1) {
        const prevSegment = this.snake[index - 1]
        const tailDir = { x: prevSegment.x - segment.x, y: prevSegment.y - segment.y }

        let tailSprite = this.sprites.SnakeTail
        if (tailDir.x === 1) tailSprite = this.sprites.SnakeTailRight
        else if (tailDir.x === -1) tailSprite = this.sprites.SnakeTailLeft
        else if (tailDir.y === 1) tailSprite = this.sprites.SnakeTailDown

        if (tailSprite && tailSprite.complete) {
          this.ctx.drawImage(tailSprite, x, y, this.GRID_SIZE, this.GRID_SIZE)
        } else {
          this.ctx.fillStyle = "#228b22"
          this.ctx.fillRect(x, y, this.GRID_SIZE, this.GRID_SIZE)
        }
      } else {
        const bodySprite = this.sprites.SnakeBody
        if (bodySprite && bodySprite.complete) {
          this.ctx.drawImage(bodySprite, x, y, this.GRID_SIZE, this.GRID_SIZE)
        } else {
          this.ctx.fillStyle = "#228b22"
          this.ctx.fillRect(x, y, this.GRID_SIZE, this.GRID_SIZE)
          this.ctx.strokeStyle = "#000"
          this.ctx.lineWidth = 1
          this.ctx.strokeRect(x, y, this.GRID_SIZE, this.GRID_SIZE)
        }
      }
    })

    // Draw colored apples
    this.apples.forEach((apple) => {
      const x = apple.x * this.GRID_SIZE
      const y = apple.y * this.GRID_SIZE

      // Draw colored apple
      this.ctx.fillStyle = apple.color
      this.ctx.fillRect(x, y, this.GRID_SIZE, this.GRID_SIZE)

      this.ctx.strokeStyle = "#000"
      this.ctx.lineWidth = 2
      this.ctx.strokeRect(x, y, this.GRID_SIZE, this.GRID_SIZE)

      // Draw letter on apple
      this.ctx.fillStyle = "#fff"
      const fontSize = Math.max(8, Math.floor(this.GRID_SIZE * 0.4))
      this.ctx.font = `${fontSize}px "Press Start 2P", monospace`
      this.ctx.textAlign = "center"
      this.ctx.textBaseline = "middle"

      this.ctx.fillStyle = "#000"
      this.ctx.fillText(apple.value, x + this.GRID_SIZE / 2 + 1, y + this.GRID_SIZE / 2 + 1)
      this.ctx.fillStyle = "#fff"
      this.ctx.fillText(apple.value, x + this.GRID_SIZE / 2, y + this.GRID_SIZE / 2)
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
        gridSize: 25,
        baseSpeed: 3,
        speedIncrease: 0.2,
      },
      medium: {
        gridSize: 40,
        baseSpeed: 5,
        speedIncrease: 0.4,
      },
      hard: {
        gridSize: 15,
        baseSpeed: 4,
        speedIncrease: 0.6,
      },
    }

    this.difficultySettings = difficultyConfig[this.gameSettings.difficulty]
    this.GRID_SIZE = this.difficultySettings.gridSize
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

document.addEventListener("DOMContentLoaded", () => {
  new SnakeEnglishGame()
})
