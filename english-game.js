class SnakeEnglishGame {
  constructor() {
    // Game constants
    this.GRID_SIZE = 25
    this.CANVAS_WIDTH = 650
    this.CANVAS_HEIGHT = 350
    this.GRID_WIDTH = Math.floor(this.CANVAS_WIDTH / this.GRID_SIZE)
    this.GRID_HEIGHT = Math.floor(this.CANVAS_HEIGHT / this.GRID_SIZE)

    // Game settings from localStorage
    this.gameSettings = JSON.parse(localStorage.getItem("gameSettings")) || {
      mode: "quiz",
      difficulty: "easy",
    }

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
    this.speed = 6
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
  }

  init() {
    this.initGame()
    this.bindEvents()
    this.gameLoop()
  }

  bindEvents() {
    document.addEventListener("keydown", (e) => this.handleKeyDown(e))
    this.playAgainBtn.addEventListener("click", () => this.showRestartConfirm())
    this.menuBtn.addEventListener("click", () => (window.location.href = "index.html"))
    this.confirmRestartBtn.addEventListener("click", () => this.confirmRestart())
    this.cancelRestartBtn.addEventListener("click", () => this.cancelRestart())
  }

  generateQuestion() {
    const difficulty = this.gameSettings.difficulty

    const questionTypes = ["synonym", "antonym", "spelling", "grammar"]
    const type = questionTypes[Math.floor(Math.random() * questionTypes.length)]

    let question, correctAnswer, options

    switch (type) {
      case "synonym":
        const synonymPairs = {
          easy: [
            { word: "happy", synonym: "glad", others: ["sad", "angry", "tired"] },
            { word: "big", synonym: "large", others: ["small", "tiny", "short"] },
            { word: "fast", synonym: "quick", others: ["slow", "lazy", "calm"] },
            { word: "smart", synonym: "clever", others: ["dumb", "silly", "weak"] },
          ],
          medium: [
            { word: "beautiful", synonym: "gorgeous", others: ["ugly", "plain", "boring"] },
            { word: "difficult", synonym: "hard", others: ["easy", "simple", "clear"] },
            { word: "ancient", synonym: "old", others: ["new", "modern", "fresh"] },
            { word: "enormous", synonym: "huge", others: ["tiny", "small", "mini"] },
          ],
          hard: [
            { word: "meticulous", synonym: "careful", others: ["careless", "sloppy", "rushed"] },
            { word: "ubiquitous", synonym: "everywhere", others: ["rare", "hidden", "absent"] },
            { word: "ephemeral", synonym: "temporary", others: ["permanent", "lasting", "eternal"] },
            { word: "perspicacious", synonym: "insightful", others: ["confused", "blind", "ignorant"] },
          ],
        }

        const synonymData = synonymPairs[difficulty]
        const randomSynonym = synonymData[Math.floor(Math.random() * synonymData.length)]
        question = `Synonym of "${randomSynonym.word}"?`
        correctAnswer = randomSynonym.synonym
        options = [correctAnswer, ...randomSynonym.others]
        break

      case "antonym":
        const antonymPairs = {
          easy: [
            { word: "hot", antonym: "cold", others: ["warm", "cool", "mild"] },
            { word: "up", antonym: "down", others: ["left", "right", "over"] },
            { word: "day", antonym: "night", others: ["noon", "dawn", "dusk"] },
            { word: "good", antonym: "bad", others: ["nice", "okay", "fine"] },
          ],
          medium: [
            { word: "expand", antonym: "shrink", others: ["grow", "stretch", "widen"] },
            { word: "brave", antonym: "coward", others: ["bold", "strong", "tough"] },
            { word: "accept", antonym: "reject", others: ["take", "grab", "hold"] },
            { word: "create", antonym: "destroy", others: ["make", "build", "form"] },
          ],
          hard: [
            { word: "abundant", antonym: "scarce", others: ["plenty", "rich", "full"] },
            { word: "benevolent", antonym: "malicious", others: ["kind", "gentle", "caring"] },
            { word: "conceal", antonym: "reveal", others: ["hide", "cover", "mask"] },
            { word: "deteriorate", antonym: "improve", others: ["worsen", "decay", "decline"] },
          ],
        }

        const antonymData = antonymPairs[difficulty]
        const randomAntonym = antonymData[Math.floor(Math.random() * antonymData.length)]
        question = `Antonym of "${randomAntonym.word}"?`
        correctAnswer = randomAntonym.antonym
        options = [correctAnswer, ...randomAntonym.others]
        break

      case "spelling":
        const spellingWords = {
          easy: [
            { correct: "friend", wrong: ["freind", "frend", "freand"] },
            { correct: "because", wrong: ["becuase", "becase", "becouse"] },
            { correct: "school", wrong: ["scool", "schol", "skool"] },
            { correct: "people", wrong: ["peopel", "peple", "poeple"] },
          ],
          medium: [
            { correct: "necessary", wrong: ["neccessary", "necesary", "neccesary"] },
            { correct: "beautiful", wrong: ["beatiful", "beutiful", "beautifull"] },
            { correct: "separate", wrong: ["seperate", "separete", "seprate"] },
            { correct: "definitely", wrong: ["definately", "definitly", "definetely"] },
          ],
          hard: [
            { correct: "accommodate", wrong: ["accomodate", "acomodate", "acommodate"] },
            { correct: "embarrass", wrong: ["embarass", "embarras", "embbarrass"] },
            { correct: "occurrence", wrong: ["occurence", "occurance", "occurrance"] },
            { correct: "privilege", wrong: ["priviledge", "privelege", "privilige"] },
          ],
        }

        const spellingData = spellingWords[difficulty]
        const randomSpelling = spellingData[Math.floor(Math.random() * spellingData.length)]
        question = `Correct spelling?`
        correctAnswer = randomSpelling.correct
        options = [correctAnswer, ...randomSpelling.wrong]
        break

      case "grammar":
        const grammarQuestions = {
          easy: [
            { question: "I ___ going to school", correct: "am", wrong: ["is", "are", "be"] },
            { question: "She ___ a book", correct: "reads", wrong: ["read", "reading", "readed"] },
            { question: "They ___ happy", correct: "are", wrong: ["is", "am", "be"] },
            { question: "He ___ tall", correct: "is", wrong: ["are", "am", "be"] },
          ],
          medium: [
            { question: "I have ___ this before", correct: "done", wrong: ["did", "do", "doing"] },
            { question: "She ___ been here", correct: "has", wrong: ["have", "had", "having"] },
            { question: "If I ___ you...", correct: "were", wrong: ["was", "am", "are"] },
            { question: "He ___ working", correct: "was", wrong: ["were", "is", "are"] },
          ],
          hard: [
            { question: "I wish I ___ there", correct: "were", wrong: ["was", "am", "be"] },
            { question: "___ you mind?", correct: "Would", wrong: ["Will", "Do", "Are"] },
            { question: "I ___ rather stay", correct: "would", wrong: ["will", "should", "could"] },
            { question: "Had I known, I ___ come", correct: "would have", wrong: ["will have", "had", "would"] },
          ],
        }

        const grammarData = grammarQuestions[difficulty]
        const randomGrammar = grammarData[Math.floor(Math.random() * grammarData.length)]
        question = randomGrammar.question
        correctAnswer = randomGrammar.correct
        options = [correctAnswer, ...randomGrammar.wrong]
        break
    }

    // Shuffle options
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[options[i], options[j]] = [options[j], options[i]]
    }

    return { question, correctAnswer, options }
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

    if (this.gameSettings.mode === "timed") {
      this.timeLeft = 60
      this.timerDisplay.style.display = "block"
      this.startTimer()
    } else {
      this.timerDisplay.style.display = "none"
    }

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

  updateUI() {
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
    if (this.timerInterval) {
      clearInterval(this.timerInterval)
    }
    this.initGame()
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
      this.showNotification("Self-bite! -1 life. Get ready!", "wrong")

      if (this.snake.length > 1) {
        this.snake.pop()
      }

      this.isPausedForEvent = true
      this.pauseTimer = 150

      this.updateUI()
      return
    }

    newSnake.unshift(head)

    const eatenApple = this.apples.find((apple) => apple.x === head.x && apple.y === head.y)
    if (eatenApple) {
      if (eatenApple.isCorrect) {
        this.score += 10
        this.correctAnswers++

        if (this.correctAnswers % 3 === 0 && this.correctAnswers > 0) {
          this.speed++
        }

        if (this.gameSettings.mode !== "endless" && this.correctAnswers >= this.targetAnswers) {
          this.gameState = "won"
          this.gameRunning = false
          this.showGameOver()
          return
        }

        this.snakeFace = "happy"
        this.showNotification("Correct! +10 points. Get ready!", "correct")

        this.currentQuestion = this.generateQuestion()
        this.apples = this.generateApples(this.currentQuestion)

        this.isPausedForEvent = true
        this.pauseTimer = 90
      } else {
        this.score = Math.max(0, this.score - 5)
        this.lives--

        if (this.lives <= 0) {
          this.gameState = "lost"
          this.gameRunning = false
          this.snakeFace = "dead"
          this.showGameOver()
          return
        }

        this.snakeFace = "disgust"
        this.showNotification("Wrong! -5 points, -1 life. Get ready!", "wrong")

        if (this.snake.length > 1) {
          this.snake.pop()
        }

        this.apples = this.apples.filter((apple) => apple !== eatenApple)
        this.addNewApple()

        this.isPausedForEvent = true
        this.pauseTimer = 150

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
    if (this.timerInterval) {
      clearInterval(this.timerInterval)
    }

    this.gameOverTitle.textContent = this.gameState === "won" ? "You Won! 🎉" : "Game Over 💀"
    this.gameOverTitle.className = this.gameState === "won" ? "won" : "lost"
    this.finalScoreElement.textContent = `Final Score: ${this.score}`
    this.gameOverOverlay.classList.remove("hidden")
  }

  drawSnakeFace(x, y, face) {
    const centerX = x + this.GRID_SIZE / 2
    const centerY = y + this.GRID_SIZE / 2

    this.ctx.fillStyle = "white"

    const eyeSize = 2
    const eyeOffset = 4
    this.ctx.fillRect(centerX - eyeOffset, centerY - 3, eyeSize, eyeSize)
    this.ctx.fillRect(centerX + eyeOffset - eyeSize, centerY - 3, eyeSize, eyeSize)

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

    this.ctx.fillStyle = type === "correct" ? "rgba(34, 197, 94, 0.9)" : "rgba(239, 68, 68, 0.9)"
    this.ctx.fillRect(this.CANVAS_WIDTH / 2 - 100, 50, 200, 40)

    this.ctx.strokeStyle = type === "correct" ? "#22c55e" : "#ef4444"
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(this.CANVAS_WIDTH / 2 - 100, 50, 200, 40)

    this.ctx.fillStyle = "white"
    this.ctx.font = "14px monospace"
    this.ctx.textAlign = "center"
    this.ctx.textBaseline = "middle"
    this.ctx.fillText(message, this.CANVAS_WIDTH / 2, 70)
  }

  draw() {
    this.ctx.fillStyle = "#1a1a1a"
    this.ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT)

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

    this.apples.forEach((apple) => {
      this.ctx.fillStyle = "#ef4444"
      this.ctx.fillRect(
        apple.x * this.GRID_SIZE + 1,
        apple.y * this.GRID_SIZE + 1,
        this.GRID_SIZE - 2,
        this.GRID_SIZE - 2,
      )

      this.ctx.fillStyle = "white"
      this.ctx.font = "10px monospace"
      this.ctx.textAlign = "center"
      this.ctx.textBaseline = "middle"

      // Handle long text by truncating
      let displayText = apple.value.toString()
      if (displayText.length > 8) {
        displayText = displayText.substring(0, 6) + ".."
      }

      this.ctx.fillText(
        displayText,
        apple.x * this.GRID_SIZE + this.GRID_SIZE / 2,
        apple.y * this.GRID_SIZE + this.GRID_SIZE / 2,
      )
    })

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
}

document.addEventListener("DOMContentLoaded", () => {
  new SnakeEnglishGame()
})
