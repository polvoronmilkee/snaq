import scienceSets from "../../shared/gamesQuestions/science-question.js"
import { generateQuestion } from "../../shared/utils/questionsUtils.js"

function $id(id) { return document.getElementById(id) }
class SnakeScienceGame {
    constructor() {
        // Game constants
        this.gameSettings = JSON.parse(localStorage.getItem("gameSettings")) || {
            mode: "quiz",
            difficulty: "easy",
            selectedSkin: "green"
        }

        // Skin system
        this.selectedSkin = this.gameSettings.selectedSkin || "green"

        this.setDifficultySettings()

        this.CANVAS_WIDTH = 800
        this.CANVAS_HEIGHT = 480
        this.GRID_WIDTH = Math.floor(this.CANVAS_WIDTH / this.GRID_SIZE)
        this.GRID_HEIGHT = Math.floor(this.CANVAS_HEIGHT / this.GRID_SIZE)

        const canvasContainer = document.querySelector(".canvas-container");

        canvasContainer.style.backgroundImage = (this.gameSettings.selectedSkin === "volt") ? `url(../../assets/images/snake-skins/volt_snake/Tile.png)` : `url("../../assets/images/icons/Tile.png")`;

        const soundPath = (this.gameSettings.selectedSkin === "volt") ? "../../assets/images/snake-skins/volt_snake/sounds" : "../../assets/sounds"

        this.sounds = {
            biteApple: new Audio(`${soundPath}/bite-apple.mp3`),
            snakeTurns: new Audio(`${soundPath}/snake-turns.mp3`),
            snakeDies: new Audio(`${soundPath}/snake-dies.mp3`),
            snakeLosesLife: new Audio(`${soundPath}/snake-loses-life.mp3`),
            correct: new Audio(`${soundPath}/correct.mp3`),
            bgMusic: new Audio(`${soundPath}/bg-music.mp3`),
            youWon: new Audio(`${soundPath}/good-job.mp3`),
            click: new Audio(`${soundPath}/click.mp3`),
            countdown: new Audio(`${soundPath}/countdown.mp3`),
            shift: new Audio(`${soundPath}/shift.mp3`),
            pause: new Audio(`${soundPath}/pause.mp3`)
        }

        this.sounds.bgMusic.volume = (this.gameSettings.selectedSkin === "volt") ? 0.6 : 1
        this.sounds.shift.volume = (this.gameSettings.selectedSkin === "volt") ? 0.1 : 1
        this.sounds.bgMusic.loop = true;
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
        this.inputLocked = false
        this.countdownActive = false
        this.escMenuActive = false

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
        this.gameLoopId = null

        // to track questions that have been used already
        this.usedWords = this.usedWords || {
            easy: { biology: [], physics: [], chemistry: [], earth: [] },
            medium: { biology: [], physics: [], chemistry: [], earth: [] },
            hard: { biology: [], physics: [], chemistry: [], earth: [] },
        };

        // Sprint (temporary speed boost)
        const isVoltSkin = this.selectedSkin === "volt"
        this.sprint = {
            active: false,
            energy: 1,
            maxEnergy: isVoltSkin ? 1.1 : 1, // +10% max energy for volt skin
            drainPerSecond: isVoltSkin ? 1.02 : 1.2, // -15% drain for volt skin (1.2 * 0.85 = 1.02)
            regenPerSecond: isVoltSkin ? 0.207 : 0.18, // +15% regen for volt skin (0.18 * 1.15 = 0.207)
            multiplier: 1.8
        }

        // Shield (one-time wrong-answer protection)
        this.hasShield = false
        this.shieldPickup = null
        this.shieldSpawned = false

        // Sprint bar UI rectangle (pixels)
        this.sprintBar = { x: 16, y: 16, width: 160, height: 14 }

        this.initDOM()
        this.init()
    }


    loadSprites() {
        const skinPath = `../../assets/images/snake-skins/${this.selectedSkin}_snake`
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
            // Apple sprites
            "apple": "../../assets/images/apples/apple.png",
            "appleA-pink": "../../assets/images/apples/appleA-pink.png",
            "appleB-yellow": "../../assets/images/apples/appleB-yellow.png",
            "appleC-blue": "../../assets/images/apples/appleC-blue.png",
            // Icon sprites
            "shield": "../../assets/images/icons/shield.png"
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
        soundBtn.textContent = this.soundEnabled ? "" : ""
        soundBtn.classList.toggle("active", this.soundEnabled)
    }

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled
        localStorage.setItem("musicEnabled", this.musicEnabled.toString())

        const musicBtn = $id("music-btn")
        musicBtn.textContent = this.musicEnabled ? "" : ""
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
        this.playAgainBtn = $id("play-again-btn")
        this.playAgainConfirm = $id("play-again-confirm")
        this.playAgainConfirmBtn = $id("confirm-play-again")
        this.cancelPlayAgain = $id("cancel-play-again")
        this.menuBtn = $id("menu-btn")
        this.restartConfirm = $id("restart-confirm")
        this.confirmRestartBtn = $id("confirm-restart")
        this.cancelRestartBtn = $id("cancel-restart")
        this.timerDisplay = $id("timer-display")
        this.timerValue = $id("timer-value")
        this.optionsContainer = $id("options-display")
        this.heartsContainer = $id("hearts-container")
        this.helpBtn = $id("help-btn")
        this.helpBtnEsc = $id("help-btn-esc")
        this.soundBtn = $id("sound-btn")
        this.musicBtn = $id("music-btn")
        this.instructionsModal = $id("instructions-modal")
        this.closeInstructionsBtn = $id("close-instructions")
        this.aboutBtn = $id("about-btn")
        this.aboutModal = $id("about-modal")
        this.closeAbout = $id("close-about")
        this.backToMenuConfirm = $id("back-to-menu-confirm")
        this.confirmBackMenuBtn = $id("confirm-back-menu")
        this.cancelBackMenuBtn = $id("cancel-back-menu")
        this.backToMenu = $id("back-to-menu")
        this.initDpad()


        if (this.questionElement) {
            this.questionElement.style.fontSize = "15px"
            this.questionElement.style.lineHeight = "1.4"
        }
    }

    init() {
        this.initGame()
        this.bindEvents()
        this.gameLoop()
        this.initializeAudioStates()

        // Ensure countdown doesn't get stuck
        setTimeout(() => {
            this.ensureCountdownComplete();
        }, 5000); // After 5 seconds, force countdown to complete
    }

    initializeAudioStates() {
        const soundBtn = $id("sound-btn")
        const musicBtn = $id("music-btn")

        if (soundBtn) {
            soundBtn.textContent = this.soundEnabled ? "🔊" : "🔇"
            soundBtn.classList.toggle("active", this.soundEnabled)
        }

        if (musicBtn) {
            musicBtn.textContent = this.musicEnabled ? "🎵" : "🔇"
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
        // Keyup to stop sprint
        document.addEventListener("keyup", (e) => {
            if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
                this.sprint.active = false
            }
        })
        this.playAgainBtn.addEventListener("click", () => {
            this.playSound("click")
            this.playAgainConfirm.classList.remove("hidden");
        })
        this.playAgainConfirmBtn.addEventListener("click", () => {
            this.playSound("click")
            this.playAgainConfirm.classList.add("hidden")
            this.gameOverOverlay.classList.add("hidden")
            this.confirmRestart()
        })
        this.cancelPlayAgain.addEventListener("click", () => {
            this.playSound("click")
            this.playAgainConfirm.classList.add("hidden");
        });
        this.backToMenu.addEventListener("click", () => {
            this.playSound("click")
            this.backToMenuConfirm.classList.remove("hidden")
            this.paused = true
        })

        this.confirmBackMenuBtn.addEventListener("click", () => {
            this.playSound("click")
            window.location.href = "../../index.html"
        })

        this.cancelBackMenuBtn.addEventListener("click", () => {
            this.playSound("click")
            this.backToMenuConfirm.classList.add("hidden")
            this.paused = false
        })

        this.menuBtn.addEventListener("click", () => {
            this.playSound("click")
            this.backToMenuConfirm.classList.remove("hidden")
            this.paused = true
        })
        this.confirmRestartBtn.addEventListener("click", () => this.confirmRestart())
        this.cancelRestartBtn.addEventListener("click", () => this.cancelRestart())
        this.helpBtn.addEventListener("click", () => this.showInstructions())
        this.soundBtn.addEventListener("click", () => this.toggleSound())
        this.musicBtn.addEventListener("click", () => this.toggleMusic())
        this.closeInstructionsBtn.addEventListener("click", () => this.hideInstructions())
        this.helpBtnEsc.addEventListener("click", () => {
            this.playSound("click")
            this.showInstructions()
        })
        // Close instructions modal when clicking outside
        this.instructionsModal.addEventListener("click", (e) => {
            if (e.target === this.instructionsModal) {
                this.hideInstructions()
            }
        })

        document.addEventListener('click', (e) => {
            if (e.target.id === 'resume-btn') {
                this.playSound("click");
                this.hideEscMenu();
            } else if (e.target.id === 'settings-btn') {
                this.playSound("click");
                this.showNotification("Settings feature coming soon!", "correct");
                this.hideEscMenu();
            } else if (e.target.id === 'main-menu-btn') {
                this.playSound("click");
                this.hideEscMenu();
                this.backToMenuConfirm.classList.remove("hidden");
                this.paused = true;
            }
        });
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
            appleImg.src = `../../assets/images/apples/${appleColors[index] || "apple.png"}`
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
            // Make answers larger and more readable
            optionText.style.fontSize = "15px"
            optionText.style.lineHeight = "1.4"
            optionText.style.fontWeight = "600"

            optionDiv.appendChild(appleIcon)
            optionDiv.appendChild(optionText)
            this.optionsContainer.appendChild(optionDiv)
        })
    }

    

    initGame() {
        const headPosition = this.getRandomPosition()
        const questionTypes = ["biology", "physics", "chemistry", "earth"]

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
        this.currentQuestion = generateQuestion(  
            scienceSets,
            questionTypes,
            this.gameSettings,
            this.usedWords)
            
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
        this.inputLocked = false
        this.speed = this.baseSpeed

        // Setup timer for timed mode
        if (this.gameSettings.mode === "timed") {
            this.timeLeft = 60
            this.timerDisplay.style.display = "flex"
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

        // Reset sprint and shield
        this.sprint.active = false
        this.sprint.energy = this.sprint.maxEnergy
        this.hasShield = false
        this.shieldPickup = null
        this.shieldSpawned = false

        this.updateUI()
        this.hideOverlays()
        this.updateShieldUI();

    
    }

    startTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        this.timerInterval = setInterval(() => {
            if (!this.paused) {  // Only decrement if not paused
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
        const key = e.key.toLowerCase()
        const code = e.code

        if (this.escMenuActive && key !== "escape") {
            e.preventDefault();
            return;
        }

        if (this.countdownActive) {
            e.preventDefault();
            return;
        }

        if (code === "ArrowUp" || code === "ArrowDown" || code === "ArrowLeft" || code === "ArrowRight") {
            e.preventDefault()
        }

        if (e.repeat) return

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
            this.sounds.pause.currentTime = 0;
            this.sounds.pause.play();
            return
        }

        if (code === "KeyR" || key === "r") {
            this.showRestartConfirm()
            return
        }

        // Sprint activation (hold Shift)
        if ((code === "ShiftLeft" || code === "ShiftRight") && !this.paused) {
            if (this.sprint.energy > 0) this.sprint.active = true

            this.sounds.shift.currentTime = 0;
            this.sounds.shift.play();
            return
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

        const isMovementKey = ["w", "arrowup", "s", "arrowdown", "a", "arrowleft", "d", "arrowright"].includes(key)
        if (this.inputLocked && isMovementKey) return

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
            } while (
                usedPositions.has(`${x},${y}`) ||
                this.snake.some((segment) => segment.x === x && segment.y === y) ||
                this.cellIntersectsRect(x, y, this.sprintBar)
            )

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
        this.notificationTimer = 75
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

    ensureCountdownComplete() {
        // If countdown gets stuck, force it to complete
        if (this.countdownActive) {
            const overlay = $id("countdown-overlay");
            if (overlay) {
                overlay.remove();
            }
            this.isCountdownActive = false;
            this.countdownActive = false;

            // Start the timer if in timed mode
            if (this.gameSettings.mode === "timed") {
                this.startTimer();
            }
        }
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

        // Collect shield pickup if present at head
        if (this.shieldPickup && head.x === this.shieldPickup.x && head.y === this.shieldPickup.y) {
            this.hasShield = true
            this.shieldPickup = null
            this.showNotification("Shield acquired! ✨", "correct")
        }

        const eatenApple = this.apples.find((apple) => apple.x === head.x && apple.y === head.y)
        if (eatenApple) {
            if (eatenApple.isCorrect) {
                this.score += 10
                this.correctAnswers++
                this.addToTotalPoints(10) // Add points to total points system

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

                const questionTypes = ["biology", "physics", "chemistry", "earth"]
                this.currentQuestion = generateQuestion(
                    scienceSets,
                    questionTypes,
                    this.gameSettings,
                    this.usedWords
                )
                this.apples = this.generateApples(this.currentQuestion)
            } else {
                // Wrong answer: shield blocks once
                if (this.hasShield) {
                    this.hasShield = false
                    this.updateShieldUI();
                    this.snakeFace = "normal"
                    this.showNotification("Shield saved you!✨", "correct")
                    // Remove the eaten wrong apple and replace
                    this.apples = this.apples.filter((apple) => apple !== eatenApple)
                    this.addNewApple()
                    this.updateUI()
                    newSnake.pop()
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

                    // Spawn shield when reaching 1 life (only once)
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
        // If apples already exist, do nothing (prevent duplicates)
        if (this.apples.length > 0) return

        const usedPositions = new Set()
        this.snake.forEach((segment) => {
            usedPositions.add(`${segment.x},${segment.y}`)
        })

        // Prevent overlap with shield and sprint bar
        if (this.shieldPickup) usedPositions.add(`${this.shieldPickup.x},${this.shieldPickup.y}`)

        // Take up to 4 options from the current question
        const options = this.currentQuestion.options.slice(0, 4)

        options.forEach((option, index) => {
            let x, y
            do {
                x = this.randInt(this.GRID_WIDTH)
                y = this.randInt(this.GRID_HEIGHT)
            } while (usedPositions.has(`${x},${y}`) || this.cellIntersectsRect(x, y, this.sprintBar))

            usedPositions.add(`${x},${y}`)

            this.apples.push({
                x,
                y,
                value: option,
                letter: String.fromCharCode(65 + index), // A, B, C, D
                color: ["pink", "yellow", "blue", "red"][index],
                isCorrect: option === this.currentQuestion.correctAnswer,
            })
        })
    }

    // Spawn shield pickup when lives reach 1, only once per game
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
            // Update the title
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
        this.ctx.imageSmoothingEnabled = false

        this.ctx.clearRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT)

        // Draw snake using sprites
        this.snake.forEach((segment, index) => {
            const x = segment.x * this.GRID_SIZE;
            const y = segment.y * this.GRID_SIZE;

            if (index === 0) {
                // ===== HEAD =====
                const next = this.snake[index + 1];
                const dirNext = { x: next.x - segment.x, y: next.y - segment.y };

                let outOfBoundX;
                if (dirNext.x === - (this.GRID_WIDTH - 1) || dirNext.x === 1) outOfBoundX = 1; else if (dirNext.x === this.GRID_WIDTH - 1 || dirNext.x === -1) outOfBoundX = -1;

                let outOfBoundY;
                if (dirNext.y === - (this.GRID_HEIGHT - 1) || dirNext.y === 1) outOfBoundY = 1; else if (dirNext.y === this.GRID_HEIGHT - 1 || dirNext.y === -1) outOfBoundY = -1;


                let headSprite = this.sprites.SnakeHead;  // default (North)

                if (this.direction.x === 1) { // Facing East

                    if (outOfBoundY === 1) { // Going North turning East
                        headSprite = this.sprites.SnakeHeadCorner4
                    } else if (outOfBoundY === -1) { // Going South turning East
                        headSprite = this.sprites.SnakeHeadCorner6
                    } else { //Straight going East
                        headSprite = this.sprites.SnakeHeadRight;
                    }
                } else if (this.direction.x === -1) { // Facing West

                    if (outOfBoundY === 1) { // Going North turning West
                        headSprite = this.sprites.SnakeHeadCorner8
                    } else if (outOfBoundY === -1) { // Going South turning West
                        headSprite = this.sprites.SnakeHeadCorner2
                    } else { //Straight going West
                        headSprite = this.sprites.SnakeHeadLeft;
                    }
                } else if (this.direction.y === 1) { // Facing South

                    if (outOfBoundX === 1) { // Going East turning South
                        headSprite = this.sprites.SnakeHeadCorner7
                    } else if (outOfBoundX === -1) { // Going West turning South
                        headSprite = this.sprites.SnakeHeadCorner3
                    } else { //Straight going West
                        headSprite = this.sprites.SnakeHeadDown;
                    }

                } else { // Facing North

                    if (outOfBoundX === 1) { // Going East turning North
                        headSprite = this.sprites.SnakeHeadCorner1
                    } else if (outOfBoundX === -1) { // Going West turning North
                        headSprite = this.sprites.SnakeHeadCorner5
                    } else { //Straight going North
                        headSprite = this.sprites.SnakeHead;
                    }
                }

                if (headSprite?.complete && headSprite) {
                    this.ctx.drawImage(headSprite, x, y, this.GRID_SIZE, this.GRID_SIZE);
                } else {
                    this.ctx.fillStyle = "#32cd32";
                    this.ctx.fillRect(x, y, this.GRID_SIZE, this.GRID_SIZE);
                    this.drawPixelSnakeFace(x, y, this.snakeFace);
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

                if (tailSprite?.complete) {
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
                if (bodySprite?.complete) {
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

        // Sprint/stamina bar (only show when not paused)
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

        // Update sprint energy
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

        if (!this.waitingForMove && !this.paused) {
            this.moveAccumulator += delta
            const effectiveSpeed = this.speed * (this.sprint.active && this.sprint.energy > 0 ? this.sprint.multiplier : 1)
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
                baseSpeed: 5,
                speedIncrease: 0.35,
            },
            medium: {
                gridSize: 40,
                baseSpeed: 5.5,
                speedIncrease: 0.55,
            },
            hard: {
                gridSize: 40,
                baseSpeed: 6,
                speedIncrease: 0.65,
            },
        }

        this.difficultySettings = difficultyConfig[this.gameSettings.difficulty]
        this.GRID_SIZE = this.difficultySettings.gridSize
    }

    startCountdown(callback) {
        this.isCountdownActive = true  // lock movement
        this.countdownActive = true

        // play countdown sound effect
        if (this.soundEnabled && this.sounds.countdown) {
            this.sounds.countdown.currentTime = 0;
            this.sounds.countdown.play()
                .catch(e => { });
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
        countdownOverlay.id = "countdown-overlay"

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
                this.playSound("countdownGo")
            } else {
                clearInterval(countdownInterval)
                countdownOverlay.remove()
                this.isCountdownActive = false
                this.countdownActive = false
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

    addToTotalPoints(points) {
        // Add points to the total points system for skin purchases
        const currentTotal = parseInt(localStorage.getItem("totalPoints")) || 0
        const newTotal = currentTotal + points
        localStorage.setItem("totalPoints", newTotal.toString())
    }
}

function checkZoomLevel() {
  // 🚫 Skip check for mobile devices
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

// Close button
document.getElementById("close-zoom-warning").addEventListener("click", () => {
  document.getElementById("zoom-warning").style.display = "none";
});

// Run check on load and whenever window is resized
window.addEventListener("load", checkZoomLevel);
window.addEventListener("resize", checkZoomLevel);


const aboutModal = $id("about-modal");
const closeAbout = $id("close-about");
const aboutBtn = $id("about-btn");

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


const copyrightModal = $id("copyright-modal");
const closeCopyright = $id("close-copyright");
const copyrightBtn = $id("copyright-btn");

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
    new SnakeScienceGame()
})

