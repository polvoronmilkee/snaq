class SnakeEnglishGame {
  constructor() {
    // Game settings from localStorage
    this.gameSettings = JSON.parse(localStorage.getItem("gameSettings")) || {
      mode: "quiz",
      difficulty: "easy",
    }

    this.setDifficultySettings()

    this.CANVAS_WIDTH = 800
    this.CANVAS_HEIGHT = 480
    this.GRID_WIDTH = Math.floor(this.CANVAS_WIDTH / this.GRID_SIZE)
    this.GRID_HEIGHT = Math.floor(this.CANVAS_HEIGHT / this.GRID_SIZE)

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
    this.pauseTimer = 0
    this.isPausedForEvent = false

    this.baseSpeed = this.difficultySettings.baseSpeed
    this.speed = this.baseSpeed

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

  setDifficultySettings() {
    const difficultyConfig = {
      easy: {
        gridSize: 40, // Small grid for easy gameplay
        baseSpeed: 3, // Slow speed
        speedIncrease: 0.2,
      },
      medium: {
        gridSize: 50, // Larger grid size
        baseSpeed: 5, // Medium speed
        speedIncrease: 0.4,
      },
      hard: {
        gridSize: 90, // Really small grid for maximum challenge - smaller space
        baseSpeed: 4, // Starts moderate but increases progressively
        speedIncrease: 0.6,
      },
    }

    this.difficultySettings = difficultyConfig[this.gameSettings.difficulty]
    this.GRID_SIZE = this.difficultySettings.gridSize
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
            { word: "happy", synonym: "glad", others: ["sad", "angry"]},
            { word: "big", synonym: "large", others: ["small", "tiny"] },
            { word: "fast", synonym: "quick", others: ["slow", "lazy"] },
            { word: "smart", synonym: "clever", others: ["dumb", "silly", "weak"] },
          ],
          medium: [
            { word: "beautiful", synonym: "gorgeous", others: ["ugly", "plain",] },
            { word: "difficult", synonym: "hard", others: ["easy", "simple"] },
            { word: "ancient", synonym: "old", others: ["new", "modern"] },
            { word: "enormous", synonym: "huge", others: ["tiny", "small"] },
          ],
          hard: [
            { word: "meticulous", synonym: "careful", others: ["careless", "sloppy"] },
            { word: "ubiquitous", synonym: "everywhere", others: ["rare", "hidden"] },
            { word: "ephemeral", synonym: "temporary", others: ["permanent", "lasting"] },
            { word: "perspicacious", synonym: "insightful", others: ["confused", "blind"] },
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
            { word: "hot", antonym: "cold", others: ["warm", "cool"] },
            { word: "up", antonym: "down", others: ["left", "right"] },
            { word: "day", antonym: "night", others: ["noon", "dawn"] },
            { word: "good", antonym: "bad", others: ["nice", "okay"] },
          ],
          medium: [
            { word: "expand", antonym: "shrink", others: ["grow", "stretch"] },
            { word: "brave", antonym: "coward", others: ["bold", "strong"] },
            { word: "accept", antonym: "reject", others: ["take", "grab"] },
            { word: "create", antonym: "destroy", others: ["make", "build"] },
          ],
          hard: [
            { word: "abundant", antonym: "scarce", others: ["plenty", "rich"] },
            { word: "benevolent", antonym: "malicious", others: ["kind", "gentle"] },
            { word: "conceal", antonym: "reveal", others: ["hide", "cover"] },
            { word: "deteriorate", antonym: "improve", others: ["worsen", "decay"] },
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
            { correct: "friend", wrong: ["freind", "frend"] },
            { correct: "because", wrong: ["becuase", "becase"] },
            { correct: "school", wrong: ["scool", "schol",] },
            { correct: "people", wrong: ["peopel", "peple"] },
          ],
          medium: [
            { correct: "necessary", wrong: ["neccessary", "necesary"] },
            { correct: "beautiful", wrong: ["beatiful",  "beautifull"] },
            { correct: "separate", wrong: ["seperate", "separete", ] },
            { correct: "definitely", wrong: ["definitly", "definetely"] },
          ],
          hard: [
            { correct: "accommodate", wrong: ["accomodate", "acommodate"] },
            { correct: "embarrass", wrong: ["embarass", "embbarrass"] },
            { correct: "occurrence", wrong: ["occurence", "occurrance"] },
            { correct: "privilege", wrong: ["priviledge",  "privilige"] },
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
            { question: "I ___ going to school", correct: "am", wrong: ["is", "are"] },
            { question: "She ___ a book", correct: "reads", wrong: ["read", "reading"]},
            { question: "They ___ happy", correct: "are", wrong: ["is", "am",] },
            { question: "He ___ tall", correct: "is", wrong: ["are", "am"] },
          ],
          medium: [
            { question: "I have ___ this before", correct: "done", wrong: ["did", "do"] },
            { question: "She ___ been here", correct: "has", wrong: ["have", "had",] },
            { question: "If I ___ you...", correct: "were", wrong: ["was", "am"] },
            { question: "He ___ working yesterday", correct: "was", wrong: ["were", "is", ] },
          ],
          hard: [
            { question: "I wish I ___ there", correct: "were", wrong: ["was", "am"] },
            { question: "___ you mind?", correct: "Would", wrong: ["Will", "Do"] },
            { question: "I ___ rather stay", correct: "would", wrong: ["will", "should"] },
            { question: "Had I known, I ___ come", correct: "would have", wrong: ["will have", "had"] },
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

    const colors = ["#FFD700", "#FF69B4", "#0b3c98ff"] // Yellow, Pink, Green
    const colorNames = ["Yellow", "Pink", "Blue"]
    const optionsWithColors = options.slice(0, 3).map((option, index) => ({
      text: option,
      color: colors[index],
      colorName: colorNames[index],
      letter: String.fromCharCode(65 + index), // A, B, C
    }))

    return { question, correctAnswer, options: optionsWithColors }
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
        color: option.color,
        colorName: option.colorName,
        text: option.text,
        isCorrect: option.text === question.correctAnswer,
      })
    })

    return newApples
  }

  showNotification(message, type) {
    this.notification = { message, type }
    this.notificationTimer = 60
  }

  initGame() {
    if (this.gameLoopId) {
      cancelAnimationFrame(this.gameLoopId)
      this.gameLoopId = null
    }

    if (this.timerInterval) {
      clearInterval(this.timerInterval)
      this.timerInterval = null
    }

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
    this.isPausedForEvent = false
    this.pauseTimer = 0

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

    this.gameLoop()
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
        e.preventDefault() // Prevent page scroll
        if (!this.paused && this.direction.y === 0) {
          this.direction = { x: 0, y: -1 }
          moved = true
        }
        break
      case "s":
      case "arrowdown":
        e.preventDefault() // Prevent page scroll
        if (!this.paused && this.direction.y === 0) {
          this.direction = { x: 0, y: 1 }
          moved = true
        }
        break
      case "a":
      case "arrowleft":
        e.preventDefault() // Prevent page scroll
        if (!this.paused && this.direction.x === 0) {
          this.direction = { x: -1, y: 0 }
          moved = true
        }
        break
      case "d":
      case "arrowright":
        e.preventDefault() // Prevent page scroll
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

    if (this.currentQuestion) {
      let questionHTML = `<div class="question-text">${this.currentQuestion.question}</div>`
      questionHTML += '<div class="options-container">'

      this.currentQuestion.options.forEach((option) => {
        const colorClass =
          option.colorName.toLowerCase() === "yellow"
            ? "apple-yellow"
            : option.colorName.toLowerCase() === "pink"
              ? "apple-pink"
              : "apple-blue"

        questionHTML += `<div class="option-item">
          <div class="apple-icon ${colorClass}">${option.letter}</div>
          <span class="option-text">${option.text}</span>
        </div>`
      })

      questionHTML += "</div>"
      this.questionElement.innerHTML = questionHTML
    } else {
      this.questionElement.innerHTML = "Loading..."
    }
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
    this.gameRunning = false
    if (this.gameLoopId) {
      cancelAnimationFrame(this.gameLoopId)
    }
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
      if (eatenApple.text === this.currentQuestion.correctAnswer) {
        this.score += 10
        this.correctAnswers++

        if (this.correctAnswers % 3 === 0 && this.correctAnswers > 0) {
          if (this.gameSettings.difficulty === "hard") {
            // Progressive speed increase for hard mode
            this.speed += this.difficultySettings.speedIncrease
          } else {
            this.speed += this.difficultySettings.speedIncrease
          }
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
      (option) => !this.apples.some((apple) => apple.text === option.text),
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
        color: randomOption.color,
        colorName: randomOption.colorName,
        text: randomOption.text,
        isCorrect: randomOption.text === this.currentQuestion.correctAnswer,
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

    const eyeSize = 3 // Increased from 2
    const eyeOffset = 6 // Increased from 4
    this.ctx.fillRect(centerX - eyeOffset, centerY - 4, eyeSize, eyeSize)
    this.ctx.fillRect(centerX + eyeOffset - eyeSize, centerY - 4, eyeSize, eyeSize)

    this.ctx.strokeStyle = "white"
    this.ctx.lineWidth = 2 // Increased from 1
    this.ctx.beginPath()

    switch (face) {
      case "happy":
        this.ctx.arc(centerX, centerY + 2, 6, 0, Math.PI) // Increased radius from 4 to 6
        break
      case "disgust":
        this.ctx.arc(centerX, centerY + 8, 6, Math.PI, 0) // Adjusted positioning
        break
      case "dead":
        this.ctx.fillStyle = "red"
        this.ctx.fillRect(centerX - eyeOffset, centerY - 4, eyeSize, eyeSize)
        this.ctx.fillRect(centerX + eyeOffset - eyeSize, centerY - 4, eyeSize, eyeSize)
        this.ctx.moveTo(centerX - 4, centerY + 3)
        this.ctx.lineTo(centerX + 4, centerY + 3)
        break
      default:
        this.ctx.moveTo(centerX - 3, centerY + 3)
        this.ctx.lineTo(centerX + 3, centerY + 3)
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

  drawAppleIcon(x, y, color, letter) {
    const centerX = x + this.GRID_SIZE / 2
    const centerY = y + this.GRID_SIZE / 2
    const size = Math.min(this.GRID_SIZE - 4) // Adaptive size based on grid

    this.ctx.fillStyle = color
    this.ctx.beginPath()

    // Apple body (rounded rectangle with curves)
    const appleWidth = size * 0.8
    const appleHeight = size * 0.9
    const appleX = centerX - appleWidth / 2
    const appleY = centerY - appleHeight / 2 + size * 0.1

    // Create apple shape using bezier curves
    this.ctx.beginPath()
    this.ctx.moveTo(appleX + appleWidth * 0.5, appleY)
    this.ctx.bezierCurveTo(
      appleX + appleWidth * 0.2,
      appleY,
      appleX,
      appleY + appleHeight * 0.3,
      appleX,
      appleY + appleHeight * 0.6,
    )
    this.ctx.bezierCurveTo(
      appleX,
      appleY + appleHeight * 0.9,
      appleX + appleWidth * 0.2,
      appleY + appleHeight,
      appleX + appleWidth * 0.5,
      appleY + appleHeight,
    )
    this.ctx.bezierCurveTo(
      appleX + appleWidth * 0.8,
      appleY + appleHeight,
      appleX + appleWidth,
      appleY + appleHeight * 0.9,
      appleX + appleWidth,
      appleY + appleHeight * 0.6,
    )
    this.ctx.bezierCurveTo(
      appleX + appleWidth,
      appleY + appleHeight * 0.3,
      appleX + appleWidth * 0.8,
      appleY,
      appleX + appleWidth * 0.5,
      appleY,
    )
    this.ctx.fill()

    // Apple stem
    this.ctx.fillStyle = "#8B4513"
    const stemWidth = Math.max(2, size * 0.05)
    this.ctx.fillRect(centerX - stemWidth / 2, centerY - size * 0.5, stemWidth, size * 0.2)

    // Apple leaf
    this.ctx.fillStyle = "#228B22"
    this.ctx.beginPath()
    this.ctx.ellipse(centerX + size * 0.15, centerY - size * 0.4, size * 0.1, size * 0.05, Math.PI / 4, 0, 2 * Math.PI)
    this.ctx.fill()

    // Letter inside apple
    this.ctx.fillStyle = "white"
    this.ctx.font = `bold ${Math.max(14, size * 0.4)}px Arial`
    this.ctx.textAlign = "center"
    this.ctx.textBaseline = "middle"
    this.ctx.strokeStyle = "rgba(0,0,0,0.3)"
    this.ctx.lineWidth = Math.max(1, size * 0.02)
    this.ctx.strokeText(letter, centerX, centerY + size * 0.05)
    this.ctx.fillText(letter, centerX, centerY + size * 0.05)
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
        const headPadding = Math.max(2, Math.floor(this.GRID_SIZE * 0.1))
        this.ctx.fillRect(
          segment.x * this.GRID_SIZE + headPadding,
          segment.y * this.GRID_SIZE + headPadding,
          this.GRID_SIZE - headPadding * 2,
          this.GRID_SIZE - headPadding * 2,
        )
        this.drawSnakeFace(segment.x * this.GRID_SIZE, segment.y * this.GRID_SIZE, this.snakeFace)
        this.ctx.fillStyle = "#4ade80"
      }
    })

    this.apples.forEach((apple) => {
      // Find the corresponding letter for this apple
      const option = this.currentQuestion.options.find((opt) => opt.text === apple.text)
      const letter = option ? option.letter : "?"

      this.drawAppleIcon(apple.x * this.GRID_SIZE, apple.y * this.GRID_SIZE, apple.color, letter)
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
