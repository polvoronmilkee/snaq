class SnakeMathGame {
  constructor() {
    // Game constants
    this.GRID_SIZE = 20
    this.CANVAS_WIDTH = 600
    this.CANVAS_HEIGHT = 400
    this.GRID_WIDTH = this.CANVAS_WIDTH / this.GRID_SIZE
    this.GRID_HEIGHT = this.CANVAS_HEIGHT / this.GRID_SIZE

    // Game state
    this.snake = [{ x: 10, y: 10 }]
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

    // DOM elements
    this.canvas = document.getElementById("gameCanvas")
    this.ctx = this.canvas.getContext("2d")
    this.scoreElement = document.getElementById("score")
    this.livesElement = document.getElementById("lives")
    this.correctElement = document.getElementById("correct")
    this.questionElement = document.getElementById("question")
    this.gameOverlay = document.getElementById("gameOverlay")
    this.gameOverTitle = document.getElementById("gameOverTitle")
    this.finalScore = document.getElementById("finalScore")
    this.playAgainBtn = document.getElementById("playAgainBtn")

    this.init()
  }

  init() {
    this.setupEventListeners()
    this.generateNewQuestion()
    this.updateHUD()
    this.gameLoop()
  }

  setupEventListeners() {
    // Keyboard controls
    document.addEventListener("keydown", (e) => {
      if (!this.gameRunning) return

      switch (e.key) {
        case "ArrowUp":
          if (this.direction.y === 0) this.direction = { x: 0, y: -1 }
          break
        case "ArrowDown":
          if (this.direction.y === 0) this.direction = { x: 0, y: 1 }
          break
        case "ArrowLeft":
          if (this.direction.x === 0) this.direction = { x: -1, y: 0 }
          break
        case "ArrowRight":
          if (this.direction.x === 0) this.direction = { x: 1, y: 0 }
          break
      }
    })

    // Play again button
    this.playAgainBtn.addEventListener("click", () => {
      this.resetGame()
    })
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
        x = Math.floor(Math.random() * this.GRID_WIDTH)
        y = Math.floor(Math.random() * this.GRID_HEIGHT)
      } while (usedPositions.has(`${x},${y}`) || this.snake.some((segment) => segment.x === x && segment.y === y))

      usedPositions.add(`${x},${y}`)
      newApples.push({
        x,
        y,
        value: option,
        isCorrect: option === question.correctAnswer,
      })
    })

    this.apples = newApples
  }

  generateNewQuestion() {
    this.currentQuestion = this.generateQuestion()
    this.generateApples(this.currentQuestion)
    this.questionElement.textContent = this.currentQuestion.question
  }

  updateHUD() {
    this.scoreElement.textContent = this.score
    this.livesElement.textContent = this.lives
    this.correctElement.textContent = this.correctAnswers
  }

  moveSnake() {
    const newSnake = [...this.snake]
    const head = { ...newSnake[0] }

    // Move head
    head.x += this.direction.x
    head.y += this.direction.y

    if (head.x < 0) head.x = this.GRID_WIDTH - 1
    if (head.x >= this.GRID_WIDTH) head.x = 0
    if (head.y < 0) head.y = this.GRID_HEIGHT - 1
    if (head.y >= this.GRID_HEIGHT) head.y = 0

    // Check self collision
    if (newSnake.some((segment) => segment.x === head.x && segment.y === head.y)) {
      this.endGame("lost")
      return
    }

    newSnake.unshift(head)

    // Check apple collision
    const eatenApple = this.apples.find((apple) => apple.x === head.x && apple.y === head.y)
    if (eatenApple) {
      if (eatenApple.isCorrect) {
        this.score += 10
        this.correctAnswers++
        this.snakeFace = "happy"
        this.showNotification("Correct! +10 points", "correct")

        if (this.correctAnswers >= 10) {
          this.endGame("won")
          return
        }

        this.generateNewQuestion()
        // Don't pop tail - snake grows!
      } else {
        this.score = Math.max(0, this.score - 5)
        this.lives--
        this.snakeFace = "disgust"
        this.showNotification("Wrong! -5 points", "wrong")

        if (this.lives <= 0) {
          this.endGame("lost")
          return
        }

        newSnake.pop() // Remove tail - snake doesn't grow
      }
      this.updateHUD()
    } else {
      newSnake.pop()
      if (this.snakeFace !== "dead") {
        this.snakeFace = "normal"
      }
    }

    this.snake = newSnake
  }

  showNotification(message, type) {
    this.notification = { message, type }
    this.notificationTimer = 60 // Show for 60 frames (about 1 second at 150ms per frame)
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
        this.drawSnakeFace(segment.x * this.GRID_SIZE, segment.y * this.GRID_SIZE)
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

    if (this.notification && this.notificationTimer > 0) {
      this.drawNotification()
      this.notificationTimer--
    }
  }

  drawSnakeFace(x, y) {
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

    switch (this.snakeFace) {
      case "happy":
        // Smile
        this.ctx.arc(centerX, centerY + 1, 4, 0, Math.PI)
        break
      case "disgust":
        // Frown
        this.ctx.arc(centerX, centerY + 5, 4, Math.PI, 0)
        break
      case "dead":
        // X eyes
        this.ctx.fillStyle = "red"
        this.ctx.fillRect(centerX - eyeOffset, centerY - 3, eyeSize, eyeSize)
        this.ctx.fillRect(centerX + eyeOffset - eyeSize, centerY - 3, eyeSize, eyeSize)
        // Dead mouth (straight line)
        this.ctx.moveTo(centerX - 3, centerY + 2)
        this.ctx.lineTo(centerX + 3, centerY + 2)
        break
      default:
        // Normal mouth (small line)
        this.ctx.moveTo(centerX - 2, centerY + 2)
        this.ctx.lineTo(centerX + 2, centerY + 2)
    }

    this.ctx.stroke()
  }

  drawNotification() {
    const { message, type } = this.notification

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

  gameLoop() {
    if (!this.gameRunning) return

    this.moveSnake()
    this.draw()

    setTimeout(() => {
      this.gameLoop()
    }, 150)
  }

  endGame(state) {
    this.gameState = state
    this.gameRunning = false
    if (state === "lost") {
      this.snakeFace = "dead"
    }

    this.gameOverTitle.textContent = state === "won" ? "You Won! 🎉" : "Game Over 💀"
    this.gameOverTitle.className = state === "won" ? "won" : "lost"
    this.finalScore.textContent = `Final Score: ${this.score}`
    this.gameOverlay.style.display = "flex"
  }

  resetGame() {
    this.snake = [{ x: 10, y: 10 }]
    this.direction = { x: 1, y: 0 }
    this.score = 0
    this.lives = 3
    this.correctAnswers = 0
    this.gameState = "playing"
    this.gameRunning = true
    this.snakeFace = "normal"
    this.notification = null
    this.notificationTimer = 0

    this.generateNewQuestion()
    this.updateHUD()
    this.gameOverlay.style.display = "none"
    this.gameLoop()
  }
}

window.addEventListener("DOMContentLoaded", () => {
  new SnakeMathGame()
})
