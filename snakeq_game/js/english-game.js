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
      bgMusic: new Audio("../sounds/bg-music.mp3"),
    }

    this.soundEnabled = true
    this.musicEnabled = true

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
      "appleA-pink",
      "appleB-yellow",
      "appleC-blue",
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
    const soundBtn = document.getElementById("sound-btn")
    soundBtn.textContent = this.soundEnabled ? "🔊" : "🔇"
    soundBtn.classList.toggle("active", this.soundEnabled)
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled
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
    this.playAgainBtn = document.getElementById("play-again-btn")
    this.menuBtn = document.getElementById("menu-btn")
    this.restartConfirm = document.getElementById("restart-confirm")
    this.confirmRestartBtn = document.getElementById("confirm-restart")
    this.cancelRestartBtn = document.getElementById("cancel-restart")
    this.timerDisplay = document.getElementById("timer-display")
    this.timerValue = document.getElementById("timer-value")
    this.optionsContainer = document.getElementById("options-display")

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

    if (this.currentQuestion) {
      this.questionElement.textContent = this.currentQuestion.question
      this.updateOptionsDisplay()
    }
  }

  updateOptionsDisplay() {
    if (!this.optionsContainer || !this.currentQuestion) return

    this.optionsContainer.innerHTML = ""

    this.currentQuestion.options.forEach((option, index) => {
      const optionDiv = document.createElement("div")
      optionDiv.className = "option-item"

      const appleIcon = document.createElement("div")
      appleIcon.className = "apple-icon"

      // Use specific colored apple sprites
      const appleImg = document.createElement("img")
      const appleColors = ["appleA-pink.png", "appleB-yellow.png", "appleC-blue.png"]
      appleImg.src = `../assets/${appleColors[index] || "apple.png"}`
      appleImg.alt = String.fromCharCode(65 + index) // A, B, C
      appleImg.className = "apple-sprite"

      const letterLabel = document.createElement("span")
      letterLabel.className = "apple-letter"
      letterLabel.textContent = String.fromCharCode(65 + index) // A, B, C

      appleIcon.appendChild(appleImg)
      appleIcon.appendChild(letterLabel)

      const optionText = document.createElement("span")
      optionText.className = "option-text"
      optionText.textContent = option

      optionDiv.appendChild(appleIcon)
      optionDiv.appendChild(optionText)
      this.optionsContainer.appendChild(optionDiv)
    })
  }

  generateQuestion() {
    const difficulty = this.gameSettings.difficulty
    const questionTypes = ["synonym", "antonym", "definition", "spelling"]
    const questionType = questionTypes[Math.floor(Math.random() * questionTypes.length)]

    const wordSets = {
      easy: {
        synonym: [
          { word: "happy", correct: "joyful", wrong: ["sad", "angry", "tired"] },
          { word: "big", correct: "large", wrong: ["small", "tiny", "little"] },
          { word: "fast", correct: "quick", wrong: ["slow", "lazy", "tired"] },
          { word: "smart", correct: "clever", wrong: ["dumb", "silly", "lazy"] },
        ],
        antonym: [
          { word: "hot", correct: "cold", wrong: ["warm", "cool", "mild"] },
          { word: "up", correct: "down", wrong: ["over", "under", "above"] },
          { word: "good", correct: "bad", wrong: ["nice", "great", "fine"] },
          { word: "light", correct: "dark", wrong: ["bright", "clear", "white"] },
        ],
        definition: [
          { word: "cat", correct: "a small furry pet", wrong: ["a big dog", "a bird", "a fish"] },
          {
            word: "book",
            correct: "something to read",
            wrong: ["something to eat", "something to wear", "something to drive"],
          },
        ],
        spelling: [
          { word: "friend", correct: "friend", wrong: ["freind", "frend", "freand"] },
          { word: "school", correct: "school", wrong: ["scool", "schol", "skool"] },
        ],
      },
      medium: {
        synonym: [
          { word: "beautiful", correct: "gorgeous", wrong: ["ugly", "plain", "simple"] },
          { word: "difficult", correct: "challenging", wrong: ["easy", "simple", "basic"] },
          { word: "ancient", correct: "old", wrong: ["new", "modern", "recent"] },
        ],
        antonym: [
          { word: "expand", correct: "contract", wrong: ["grow", "increase", "enlarge"] },
          { word: "victory", correct: "defeat", wrong: ["win", "success", "triumph"] },
        ],
        definition: [
          {
            word: "telescope",
            correct: "device to see far objects",
            wrong: ["device to hear sounds", "device to cook food", "device to clean"],
          },
        ],
        spelling: [
          { word: "necessary", correct: "necessary", wrong: ["neccessary", "necesary", "neccesary"] },
          { word: "beautiful", correct: "beautiful", wrong: ["beatiful", "beutiful", "beautifull"] },
        ],
      },
      hard: {
        synonym: [
          { word: "ubiquitous", correct: "everywhere", wrong: ["rare", "hidden", "absent"] },
          { word: "meticulous", correct: "careful", wrong: ["careless", "sloppy", "rushed"] },
        ],
        antonym: [
          { word: "benevolent", correct: "malevolent", wrong: ["kind", "generous", "helpful"] },
          { word: "ephemeral", correct: "permanent", wrong: ["temporary", "brief", "short"] },
        ],
        definition: [
          { word: "serendipity", correct: "pleasant surprise", wrong: ["bad luck", "planned event", "boring moment"] },
        ],
        spelling: [
          { word: "accommodate", correct: "accommodate", wrong: ["accomodate", "acomodate", "acommodate"] },
          { word: "definitely", correct: "definitely", wrong: ["definately", "definitly", "definetly"] },
        ],
      },
    }

    const difficultyWords = wordSets[difficulty][questionType]
    const selectedWord = difficultyWords[Math.floor(Math.random() * difficultyWords.length)]

    let question, correctAnswer, options

    switch (questionType) {
      case "synonym":
        question = `What is a synonym for "${selectedWord.word}"?`
        correctAnswer = selectedWord.correct
        options = [correctAnswer, ...selectedWord.wrong]
        break
      case "antonym":
        question = `What is the opposite of "${selectedWord.word}"?`
        correctAnswer = selectedWord.correct
        options = [correctAnswer, ...selectedWord.wrong]
        break
      case "definition":
        question = `What is a "${selectedWord.word}"?`
        correctAnswer = selectedWord.correct
        options = [correctAnswer, ...selectedWord.wrong]
        break
      case "spelling":
        question = `How do you spell "${selectedWord.word}"?`
        correctAnswer = selectedWord.correct
        options = [correctAnswer, ...selectedWord.wrong]
        break
      default:
        question = `What is a synonym for "happy"?`
        correctAnswer = "joyful"
        options = ["joyful", "sad", "angry", "tired"]
    }

    // Shuffle options
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[options[i], options[j]] = [options[j], options[i]]
    }

    return { question, correctAnswer, options }
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
      this.startTimer()
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

    if (moved && this.waitingForMove) {
      this.waitingForMove = false
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
        value: option,
        letter: String.fromCharCode(65 + index), // A, B, C
        color: ["pink", "yellow", "blue"][index] || "red",
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
        letter: String.fromCharCode(65 + this.apples.length), // A, B, C
        color: ["pink", "yellow", "blue"][this.apples.length] || "red",
        isCorrect: randomOption === this.currentQuestion.correctAnswer,
      })
    }
  }

  showGameOver() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval)
    }

    this.gameOverTitle.textContent = this.gameState === "won" ? "You Won! 🎉" : "Game Over 💀"
    this.gameOverTitle.className = this.gameState === "won" ? "won" : "lost"
    this.finalScoreElement.textContent = `Final Score: ${this.score}`
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

    // Pixel-style notification box
    this.ctx.fillStyle = type === "correct" ? "#32cd32" : "#ff4444"
    this.ctx.fillRect(this.CANVAS_WIDTH / 2 - 120, 40, 240, 60)

    // Pixel border
    this.ctx.strokeStyle = "#000"
    this.ctx.lineWidth = 4
    this.ctx.strokeRect(this.CANVAS_WIDTH / 2 - 120, 40, 240, 60)

    // Inner border
    this.ctx.strokeStyle = "#fff"
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(this.CANVAS_WIDTH / 2 - 118, 42, 236, 56)

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
        const prevSegment = this.snake[index - 1]
        const tailDir = { x: prevSegment.x - segment.x, y: prevSegment.y - segment.y }

        let tailSprite = this.sprites.SnakeTail // default up
        if (tailDir.x === 1) tailSprite = this.sprites.SnakeTailRight
        else if (tailDir.x === -1) tailSprite = this.sprites.SnakeTailLeft
        else if (tailDir.y === 1) tailSprite = this.sprites.SnakeTailDown

        if (tailSprite && tailSprite.complete) {
          this.ctx.drawImage(tailSprite, x, y, this.GRID_SIZE, this.GRID_SIZE)
        } else {
          // Fallback to colored rectangle
          this.ctx.fillStyle = "#228b22"
          this.ctx.fillRect(x, y, this.GRID_SIZE, this.GRID_SIZE)
        }
      } else {
        const bodySprite = this.sprites.SnakeBody
        if (bodySprite && bodySprite.complete) {
          this.ctx.drawImage(bodySprite, x, y, this.GRID_SIZE, this.GRID_SIZE)
        } else {
          // Fallback to colored rectangle
          this.ctx.fillStyle = "#228b22"
          this.ctx.fillRect(x, y, this.GRID_SIZE, this.GRID_SIZE)

          // Pixel border for body
          this.ctx.strokeStyle = "#000"
          this.ctx.lineWidth = 1
          this.ctx.strokeRect(x, y, this.GRID_SIZE, this.GRID_SIZE)
        }
      }
    })

    this.apples.forEach((apple) => {
      const x = apple.x * this.GRID_SIZE
      const y = apple.y * this.GRID_SIZE

      // Use colored apple sprite based on letter
      let appleSprite
      if (apple.letter === "A") appleSprite = this.sprites["appleA-pink"]
      else if (apple.letter === "B") appleSprite = this.sprites["appleB-yellow"]
      else if (apple.letter === "C") appleSprite = this.sprites["appleC-blue"]
      else appleSprite = this.sprites.apple

      if (appleSprite && appleSprite.complete) {
        this.ctx.drawImage(appleSprite, x, y, this.GRID_SIZE, this.GRID_SIZE)
      } else {
        // Fallback to colored rectangle
        const colors = { pink: "#ff69b4", yellow: "#ffd700", blue: "#4169e1", red: "#ff4444" }
        this.ctx.fillStyle = colors[apple.color] || "#ff4444"
        this.ctx.fillRect(x, y, this.GRID_SIZE, this.GRID_SIZE)

        this.ctx.strokeStyle = "#000"
        this.ctx.lineWidth = 2
        this.ctx.strokeRect(x, y, this.GRID_SIZE, this.GRID_SIZE)
      }

      // Draw letter on apple
      this.ctx.fillStyle = "#fff"
      const fontSize = Math.max(8, Math.floor(this.GRID_SIZE * 0.4))
      this.ctx.font = `${fontSize}px "Press Start 2P", monospace`
      this.ctx.textAlign = "center"
      this.ctx.textBaseline = "middle"

      // Text shadow for pixel effect
      this.ctx.fillStyle = "#000"
      this.ctx.fillText(apple.letter, x + this.GRID_SIZE / 2 + 1, y + this.GRID_SIZE / 2 + 1)

      this.ctx.fillStyle = "#fff"
      this.ctx.fillText(apple.letter, x + this.GRID_SIZE / 2, y + this.GRID_SIZE / 2)
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
}

document.addEventListener("DOMContentLoaded", () => {
  new SnakeEnglishGame()
})
