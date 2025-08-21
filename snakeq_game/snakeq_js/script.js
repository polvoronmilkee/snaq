class SnakeMathGame {
  constructor() {
    // Game constants
    this.GRID_SIZE = 25
    this.CANVAS_WIDTH = 650
    this.CANVAS_HEIGHT = 350
    this.GRID_WIDTH = Math.floor(this.CANVAS_WIDTH / this.GRID_SIZE)
    this.GRID_HEIGHT = Math.floor(this.CANVAS_HEIGHT / this.GRID_SIZE)

    // Game state
    this.snake = []
    this.direction = { x: 1, y: 0 }
    this.apples = []
    this.gameRunning = true
    this.gameState = "playing" // "playing", "won", "lost"
    this.score = 0
    this.lives = 3
    this.correctAnswers = 0
    this.currentQuestion = null
    this.snakeFace = "normal" // "normal", "happy", "disgust", "dead"
    this.notification = null
    this.notificationTimer = 0
    this.waitingForMove = true
    this.paused = false
    this.showConfirm = false
    this.speed = 6
    this.pauseTimer = 0
    this.isPausedForEvent = false

    // Animation
    this.lastFrameTime = 0
    this.moveAccumulator = 0
    this.gameLoopId = null

    // DOM elements
    this.canvas = document.getElementById("game-canvas")
    this.ctx = this.canvas.getContext("2d")
    this.scoreElement = document.getElementById("score-value")
    this.livesElement = document.getElementById("lives-value")
    this.correctElement = document.getElementById("correct-value")
    this.questionElement = document.getElementById("question-display")
    this.gameOverOverlay = document.getElementById("game-over-overlay")
    this.gameOverTitle = document.getElementById("game-over-title")
    this.finalScoreElement = document.getElementById("final-score")
    this.playAgainBtn = document.getElementById("play-again-btn")
    this.restartConfirm = document.getElementById("restart-confirm")
    this.confirmRestartBtn = document.getElementById("confirm-restart")
    this.cancelRestartBtn = document.getElementById("cancel-restart")

    this.init()
  }

  init() {
    this.initGame()
    this.bindEvents()
    this.gameLoop()
  }

  bindEvents() {
    document.addEventListener("keydown", (e) => this.handleKeyDown(e))
    this.playAgainBtn.addEventListener("click", () => this.showRestartConfirm())
    this.confirmRestartBtn.addEventListener("click", () => this.confirmRestart())
    this.cancelRestartBtn.addEventListener("click", () => this.cancelRestart())
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

  generateQuestion() {
    const operations = ["+", "-", "*"]
    const operation = operations[Math.floor(Math.random() * operations.length)]

    let num1, num2, correctAnswer, question

    switch (operation) {
      case "+":
        num1 = Math.floor(Math.random() * 20) + 1
        num2 = Math.floor(Math.random() * 20) + 1
        correctAnswer = num1 + num2
        question = `${num1} + ${num2} = ?`
        break
      case "-":
        num1 = Math.floor(Math.random() * 20) + 10
        num2 = Math.floor(Math.random() * num1) + 1
        correctAnswer = num1 - num2
        question = `${num1} - ${num2} = ?`
        break
      case "*":
        num1 = Math.floor(Math.random() * 10) + 1
        num2 = Math.floor(Math.random() * 10) + 1
        correctAnswer = num1 * num2
        question = `${num1} × ${num2} = ?`
        break
      default:
        correctAnswer = 5
        question = "2 + 3 = ?"
    }

    // Generate wrong options
    const options = [correctAnswer]
    while (options.length < 4) {
      const wrongAnswer = correctAnswer + Math.floor(Math.random() * 10) - 5
      if (wrongAnswer > 0 && !options.includes(wrongAnswer)) {
        options.push(wrongAnswer)
      }
    }

    // Shuffle options
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[options[i], options[j]] = [options[j], options[i]]
    }

    return { question, correctAnswer, options }
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
    this.speed = 6

    this.updateUI()
    this.hideOverlays()
  }

  updateUI() {
    console.log("[v0] Updating UI - Lives:", this.lives, "Score:", this.score, "Correct:", this.correctAnswers)
    this.scoreElement.textContent = this.score
    this.livesElement.textContent = this.lives
    this.correctElement.textContent = this.correctAnswers
    this.questionElement.textContent = this.currentQuestion ? this.currentQuestion.question : "Loading..."
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
    this.initGame()
  }

  cancelRestart() {
    this.restartConfirm.classList.add("hidden")
  }

  moveSnake() {
    const newSnake = [...this.snake]
    const head = { ...newSnake[0] }

    // Move head
    head.x += this.direction.x
    head.y += this.direction.y

    // Wrap around edges
    if (head.x < 0) head.x = this.GRID_WIDTH - 1
    if (head.x >= this.GRID_WIDTH) head.x = 0
    if (head.y < 0) head.y = this.GRID_HEIGHT - 1
    if (head.y >= this.GRID_HEIGHT) head.y = 0

    if (newSnake.some((segment) => segment.x === head.x && segment.y === head.y)) {
      this.lives--
      this.snakeFace = "disgust"
      this.showNotification("Self-bite! -1 life. Get ready!", "wrong")

      // Remove one tail segment if snake has more than one segment
      if (this.snake.length > 1) {
        this.snake.pop()
      }

      this.isPausedForEvent = true
      this.pauseTimer = 150 // 2 seconds at 60fps

      this.updateUI()
      return // Don't continue with normal movement this frame
    }

    newSnake.unshift(head)

    // Check apple collision
    const eatenApple = this.apples.find((apple) => apple.x === head.x && apple.y === head.y)
    if (eatenApple) {
      if (eatenApple.isCorrect) {
        this.score += 10
        this.correctAnswers++

        // Speed scaling
        if (this.correctAnswers % 3 === 0 && this.correctAnswers > 0) {
          this.speed++
        }

        if (this.correctAnswers >= 10) {
          this.gameState = "won"
          this.gameRunning = false
          this.showGameOver()
          return
        }

        this.snakeFace = "happy"
        this.showNotification("Correct! +10 points", "correct")

        this.currentQuestion = this.generateQuestion()
        this.apples = this.generateApples(this.currentQuestion)

         // 1.5 seconds at 60fps

        // Don't pop tail - snake grows
      } else {
        this.score = Math.max(0, this.score - 5)
        this.lives--

        if (this.lives <= 0) {
          this.gameState = "lost"
          this.gameRunning = false
          this.snakeFace = "dead"
          // Set lives to 0 when game is over
          this.lives = 0
          this.updateUI()
          this.showGameOver()
          return
        }

        this.snakeFace = "disgust"
        this.showNotification("Wrong! -5 points, -1 life. Get ready!", "wrong")

        if (this.snake.length > 1) {
          this.snake.pop() // Remove one tail segment
        }

        this.apples = this.apples.filter((apple) => apple !== eatenApple)

        this.addNewApple()

        this.isPausedForEvent = true
        this.pauseTimer = 150 // 1.5 seconds at 60fps

        this.updateUI()
        newSnake.pop() // Remove tail for normal movement
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

    // Mark existing apple positions as used
    this.apples.forEach((apple) => {
      usedPositions.add(`${apple.x},${apple.y}`)
    })

    // Mark snake positions as used
    this.snake.forEach((segment) => {
      usedPositions.add(`${segment.x},${segment.y}`)
    })

    // Generate a new apple with a random value from current question options
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
    this.gameOverTitle.textContent = this.gameState === "won" ? "You Won! 🎉" : "Game Over 💀"
    this.gameOverTitle.className = this.gameState === "won" ? "won" : "lost"
    this.finalScoreElement.textContent = `Final Score: ${this.score}`
    this.gameOverOverlay.classList.remove("hidden")
  }

  drawSnakeFace(x, y, face) {
    const centerX = x + this.GRID_SIZE / 2
    const centerY = y + this.GRID_SIZE / 2

    this.ctx.fillStyle = "white"

    // Eyes
    const eyeSize = 2
    const eyeOffset = 4
    this.ctx.fillRect(centerX - eyeOffset, centerY - 3, eyeSize, eyeSize)
    this.ctx.fillRect(centerX + eyeOffset - eyeSize, centerY - 3, eyeSize, eyeSize)

    // Mouth based on face state
    this.ctx.strokeStyle = "white"
    this.ctx.lineWidth = 1
    this.ctx.beginPath()

    switch (face) {
      case "happy":
        this.ctx.arc(centerX, centerY + 1, 4, 0, Math.PI)
        break
      case "disgust":
        this.ctx.arc(centerX, centerY + 5, 4, Math.PI, 0)
        break
      case "dead":
        this.ctx.fillStyle = "red"
        this.ctx.fillRect(centerX - eyeOffset, centerY - 3, eyeSize, eyeSize)
        this.ctx.fillRect(centerX + eyeOffset - eyeSize, centerY - 3, eyeSize, eyeSize)
        this.ctx.moveTo(centerX - 3, centerY + 2)
        this.ctx.lineTo(centerX + 3, centerY + 2)
        break
      default:
        this.ctx.moveTo(centerX - 2, centerY + 2)
        this.ctx.lineTo(centerX + 2, centerY + 2)
    }

    this.ctx.stroke()
  }

  drawNotification(notification) {
    const { message, type } = notification

    // Background
    this.ctx.fillStyle = type === "correct" ? "rgba(34, 197, 94, 0.9)" : "rgba(239, 68, 68, 0.9)"
    this.ctx.fillRect(this.CANVAS_WIDTH / 2 - 100, 50, 200, 40)

    // Border
    this.ctx.strokeStyle = type === "correct" ? "#22c55e" : "#ef4444"
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(this.CANVAS_WIDTH / 2 - 100, 50, 200, 40)

    // Text
    this.ctx.fillStyle = "white"
    this.ctx.font = "14px monospace"
    this.ctx.textAlign = "center"
    this.ctx.textBaseline = "middle"
    this.ctx.fillText(message, this.CANVAS_WIDTH / 2, 70)
  }

  draw() {
    // Clear canvas
    this.ctx.fillStyle = "#1a1a1a"
    this.ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT)

    // Draw grid
    this.ctx.strokeStyle = "#333"
    this.ctx.lineWidth = 1
    for (let x = 0; x <= this.CANVAS_WIDTH; x += this.GRID_SIZE) {
      this.ctx.beginPath()
      this.ctx.moveTo(x, 0)
      this.ctx.lineTo(x, this.CANVAS_HEIGHT)
      this.ctx.stroke()
    }
    for (let y = 0; y <= this.CANVAS_HEIGHT; y += this.GRID_SIZE) {
      this.ctx.beginPath()
      this.ctx.moveTo(0, y)
      this.ctx.lineTo(this.CANVAS_WIDTH, y)
      this.ctx.stroke()
    }

    // Draw snake
    this.ctx.fillStyle = "#4ade80"
    this.snake.forEach((segment, index) => {
      this.ctx.fillRect(
        segment.x * this.GRID_SIZE + 1,
        segment.y * this.GRID_SIZE + 1,
        this.GRID_SIZE - 2,
        this.GRID_SIZE - 2,
      )

      if (index === 0) {
        this.ctx.fillStyle = "#22c55e"
        this.ctx.fillRect(
          segment.x * this.GRID_SIZE + 3,
          segment.y * this.GRID_SIZE + 3,
          this.GRID_SIZE - 6,
          this.GRID_SIZE - 6,
        )
        this.drawSnakeFace(segment.x * this.GRID_SIZE, segment.y * this.GRID_SIZE, this.snakeFace)
        this.ctx.fillStyle = "#4ade80"
      }
    })

    // Draw apples
    this.apples.forEach((apple) => {
      this.ctx.fillStyle = "#ef4444"
      this.ctx.fillRect(
        apple.x * this.GRID_SIZE + 1,
        apple.y * this.GRID_SIZE + 1,
        this.GRID_SIZE - 2,
        this.GRID_SIZE - 2,
      )

      this.ctx.fillStyle = "white"
      this.ctx.font = "12px monospace"
      this.ctx.textAlign = "center"
      this.ctx.textBaseline = "middle"
      this.ctx.fillText(
        apple.value.toString(),
        apple.x * this.GRID_SIZE + this.GRID_SIZE / 2,
        apple.y * this.GRID_SIZE + this.GRID_SIZE / 2,
      )
    })

    // Draw notification
    if (this.notification && this.notificationTimer > 0) {
      this.drawNotification(this.notification)
      this.notificationTimer--
    }

    if (this.paused || this.isPausedForEvent) {
      this.ctx.fillStyle = "rgba(0,0,0,0.6)"
      this.ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT)
      this.ctx.fillStyle = "white"
      this.ctx.font = "24px monospace"
      this.ctx.textAlign = "center"
      this.ctx.textBaseline = "middle"

      if (this.isPausedForEvent) {
        const secondsLeft = Math.ceil(this.pauseTimer / 60)
        this.ctx.fillText(`GET READY! ${secondsLeft}`, this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT / 2)
      } else {
        this.ctx.fillText("PAUSED", this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT / 2)
      }
    }
  }

  gameLoop(timestamp = 0) {
    if (!this.gameRunning) return

    const delta = (timestamp - this.lastFrameTime) / 1000
    this.lastFrameTime = timestamp

    if (this.isPausedForEvent) {
      this.pauseTimer--
      if (this.pauseTimer <= 0) {
        this.isPausedForEvent = false
        this.pauseTimer = 0
      }
    }

    // Update only when not paused and player started moving
    if (!this.waitingForMove && !this.paused && !this.isPausedForEvent) {
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

  handleKeyDown(e) {
    const key = e.key.toLowerCase()
    const code = e.code

    // If confirm overlay is visible, only allow Esc or Enter
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

    // Space to pause
    if (code === "Space" || key === " ") {
      e.preventDefault()
      this.paused = !this.paused
      return
    }

    // R to restart
    if (code === "KeyR" || key === "r") {
      this.showRestartConfirm()
      return
    }

    // Movement controls: WASD + Arrow keys
    switch (code) {
      case "KeyW":
      case "ArrowUp":
        if (!this.paused && this.direction.y === 0) {
          this.direction = { x: 0, y: -1 }
          moved = true
        }
        break
      case "KeyS":
      case "ArrowDown":
        if (!this.paused && this.direction.y === 0) {
          this.direction = { x: 0, y: 1 }
          moved = true
        }
        break
      case "KeyA":
      case "ArrowLeft":
        if (!this.paused && this.direction.x === 0) {
          this.direction = { x: -1, y: 0 }
          moved = true
        }
        break
      case "KeyD":
      case "ArrowRight":
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
}

class SnakeEnglishGame extends SnakeMathGame {
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

    const q = questions[Math.floor(Math.random() * questions.length)]

    // Shuffle options
    const shuffled = [...q.options];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return { question: q.question, correctAnswer: q.correctAnswer, options: shuffled };
  }
}

let currentGame = null

function startGame(mode) {
  // Remove any previous game instance
  if (currentGame) {
    cancelAnimationFrame(currentGame.gameLoopId)
  }

  // Start the selected game mode
  if (mode === "math") {
    currentGame = new SnakeMathGame()
    document.getElementById("mathModeBtn").classList.add("active")
    document.getElementById("englishModeBtn").classList.remove("active")
  } else if (mode === "english") {
    currentGame = new SnakeEnglishGame()
    document.getElementById("englishModeBtn").classList.add("active")
    document.getElementById("mathModeBtn").classList.remove("active")
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Attach event listeners to mode buttons
  document.getElementById("mathModeBtn").addEventListener("click", () => startGame("math"))
  document.getElementById("englishModeBtn").addEventListener("click", () => startGame("english"))
  
  // Start with math mode by default
  startGame("math")
})