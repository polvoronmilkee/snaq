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
    youWon: new Audio("../sounds/you-won.mp3"),
    click: new Audio("../sounds/click.mp3"),
    countdown: new Audio("../sounds/countdown.mp3") 
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

    // to track questions that have been used already
    this.usedWords = this.usedWords || {
    easy: { synonym: [], antonym: [], definition: [], spelling: [] },
    medium: { synonym: [], antonym: [], definition: [], spelling: [] },
    hard: { synonym: [], antonym: [], definition: [], spelling: [] },
    };

    // Sprint (temporary speed boost)
    this.sprint = {
    active: false,
    energy: 1,
    maxEnergy: 1,
    drainPerSecond: 1.2,
    regenPerSecond: 0.18,
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
    this.optionsContainer = document.getElementById("options-display")
    this.heartsContainer = document.getElementById("hearts-container")
    this.helpBtn = document.getElementById("help-btn")
    this.soundBtn = document.getElementById("sound-btn")
    this.musicBtn = document.getElementById("music-btn")
    this.instructionsModal = document.getElementById("instructions-modal")
    this.closeInstructionsBtn = document.getElementById("close-instructions")

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
    // Keyup to stop sprint
    document.addEventListener("keyup", (e) => {
    if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
        this.sprint.active = false
    }
    })
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
    // Make answers larger and more readable
    optionText.style.fontSize = "20px"
    optionText.style.lineHeight = "1.4"
    optionText.style.fontWeight = "600"

    optionText.style.fontSize = "15px"
    optionText.style.lineHeight = "1.4"
    optionText.style.fontWeight = "600"

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
            { word: "angry", correct: "furious", wrong: ["happy", "calm", "joyful"] },
            { word: "easy", correct: "simple", wrong: ["difficult", "hard", "complex"] },
            { word: "strong", correct: "powerful", wrong: ["weak", "fragile", "small"] },
            { word: "brave", correct: "courageous", wrong: ["scared", "timid", "weak"] },
            { word: "quiet", correct: "silent", wrong: ["loud", "noisy", "talkative"] },
            { word: "beautiful", correct: "gorgeous", wrong: ["ugly", "plain", "boring"] },
        ],
        antonym: [
            { word: "hot", correct: "cold", wrong: ["warm", "cool", "mild"] },
            { word: "up", correct: "down", wrong: ["over", "under", "above"] },
            { word: "good", correct: "bad", wrong: ["nice", "great", "fine"] },
            { word: "light", correct: "dark", wrong: ["bright", "clear", "white"] },
            { word: "happy", correct: "sad", wrong: ["joyful", "excited", "glad"] },
            { word: "big", correct: "small", wrong: ["large", "huge", "gigantic"] },
            { word: "fast", correct: "slow", wrong: ["quick", "rapid", "swift"] },
            { word: "strong", correct: "weak", wrong: ["powerful", "mighty", "sturdy"] },
            { word: "young", correct: "old", wrong: ["new", "fresh", "recent"] },
            { word: "near", correct: "far", wrong: ["close", "next", "adjacent"] },
        ],
        definition: [
            { word: "cat", correct: "a small furry pet", wrong: ["a big dog", "a bird", "a fish"] },
            { word: "book", correct: "something to read", wrong: ["something to eat", "something to wear", "something to drive"] },
            { word: "apple", correct: "a type of fruit", wrong: ["a vegetable", "a tool", "a drink"] },
            { word: "chair", correct: "something to sit on", wrong: ["something to sleep on", "something to write with", "something to wear"] },
            { word: "river", correct: "a flowing body of water", wrong: ["a mountain", "a tree", "a road"] },
            { word: "car", correct: "a vehicle for transport", wrong: ["a building", "a computer", "a tool"] },
            { word: "shoe", correct: "something worn on the foot", wrong: ["something worn on the hand", "a hat", "a glove"] },
            { word: "pencil", correct: "something used to write", wrong: ["something used to eat", "something used to paint", "something used to clean"] },
            { word: "dog", correct: "a domesticated animal", wrong: ["a wild animal", "a bird", "a fish"] },
            { word: "tree", correct: "a plant with a trunk and branches", wrong: ["a flower", "a bush", "a rock"] },
        ],
        spelling: [
            { word: "friend", correct: "friend", wrong: ["freind", "frend", "freand"] },
            { word: "school", correct: "school", wrong: ["scool", "schol", "skool"] },
            { word: "apple", correct: "apple", wrong: ["aple", "appel", "appl"] },
            { word: "house", correct: "house", wrong: ["hous", "houes", "hoose"] },
            { word: "computer", correct: "computer", wrong: ["computor", "compter", "comuter"] },
            { word: "beautiful", correct: "beautiful", wrong: ["beatiful", "beutiful", "beautifull"] },
            { word: "library", correct: "library", wrong: ["libary", "librery", "liberry"] },
            { word: "holiday", correct: "holiday", wrong: ["holidy", "holoday", "holidey"] },
            { word: "together", correct: "together", wrong: ["togther", "toether", "togehter"] },
            { word: "because", correct: "because", wrong: ["becuase", "becase", "becouse"] },
        ]

    },
        medium: {
        synonym: [
            { word: "beautiful", correct: "gorgeous", wrong: ["ugly", "plain", "simple"] },
            { word: "difficult", correct: "challenging", wrong: ["easy", "simple", "basic"] },
            { word: "ancient", correct: "old", wrong: ["new", "modern", "recent"] },
            { word: "quick", correct: "swift", wrong: ["slow", "lazy", "sluggish"] },
            { word: "brave", correct: "courageous", wrong: ["scared", "timid", "weak"] },
            { word: "smart", correct: "intelligent", wrong: ["dumb", "foolish", "slow"] },
            { word: "strong", correct: "powerful", wrong: ["weak", "fragile", "feeble"] },
            { word: "angry", correct: "furious", wrong: ["happy", "calm", "joyful"] },
            { word: "funny", correct: "humorous", wrong: ["serious", "boring", "sad"] },
            { word: "bright", correct: "luminous", wrong: ["dark", "dull", "dim"] },
        ],
        antonym: [
            { word: "expand", correct: "contract", wrong: ["grow", "increase", "enlarge"] },
            { word: "victory", correct: "defeat", wrong: ["win", "success", "triumph"] },
            { word: "ancient", correct: "modern", wrong: ["old", "historic", "past"] },
            { word: "strong", correct: "weak", wrong: ["powerful", "robust", "tough"] },
            { word: "happy", correct: "sad", wrong: ["joyful", "excited", "glad"] },
            { word: "open", correct: "closed", wrong: ["shut", "ajar", "wide"] },
            { word: "high", correct: "low", wrong: ["tall", "elevated", "above"] },
            { word: "fast", correct: "slow", wrong: ["quick", "rapid", "swift"] },
            { word: "bright", correct: "dark", wrong: ["luminous", "shiny", "glowing"] },
            { word: "near", correct: "far", wrong: ["close", "next", "adjacent"] },
        ],
        definition: [
            { word: "telescope", correct: "device to see far objects", wrong: ["device to hear sounds", "device to cook food", "device to clean"] },
            { word: "volcano", correct: "mountain that erupts lava", wrong: ["lake", "river", "valley"] },
            { word: "oxygen", correct: "gas we breathe", wrong: ["water", "carbon", "nitrogen"] },
            { word: "keyboard", correct: "device to type on a computer", wrong: ["monitor", "mouse", "printer"] },
            { word: "microscope", correct: "device to see tiny objects", wrong: ["telescope", "camera", "binoculars"] },
            { word: "pyramid", correct: "triangular structure", wrong: ["cube", "sphere", "circle"] },
            { word: "glacier", correct: "large ice mass", wrong: ["river", "mountain", "lake"] },
            { word: "satellite", correct: "object orbiting a planet", wrong: ["rocket", "star", "moon"] },
            { word: "guitar", correct: "stringed musical instrument", wrong: ["drum", "piano", "flute"] },
            { word: "volleyball", correct: "sport played with a ball over a net", wrong: ["soccer", "tennis", "basketball"] },
        ],
        spelling: [
            { word: "necessary", correct: "necessary", wrong: ["neccessary", "necesary", "neccesary"] },
            { word: "beautiful", correct: "beautiful", wrong: ["beatiful", "beutiful", "beautifull"] },
            { word: "accommodate", correct: "accommodate", wrong: ["acommodate", "accomodate", "acomodate"] },
            { word: "definitely", correct: "definitely", wrong: ["definately", "definitly", "definetly"] },
            { word: "separate", correct: "separate", wrong: ["seperate", "seperete", "separite"] },
            { word: "questionnaire", correct: "questionnaire", wrong: ["questionaire", "questinnaire", "questioner"] },
            { word: "occurrence", correct: "occurrence", wrong: ["occurence", "ocurrence", "occurance"] },
            { word: "acquire", correct: "acquire", wrong: ["aquire", "acqire", "acqure"] },
            { word: "maintenance", correct: "maintenance", wrong: ["maintainance", "maintanance", "maintnance"] },
            { word: "privilege", correct: "privilege", wrong: ["privelege", "priviledge", "privlig"] },
        ],
        },
        hard: {
        synonym: [
            { word: "ubiquitous", correct: "everywhere", wrong: ["rare", "hidden", "absent"] },
            { word: "meticulous", correct: "careful", wrong: ["careless", "sloppy", "rushed"] },
            { word: "obstinate", correct: "stubborn", wrong: ["flexible", "gentle", "yielding"] },
            { word: "lucid", correct: "clear", wrong: ["confusing", "vague", "obscure"] },
            { word: "tenacious", correct: "persistent", wrong: ["weak", "lazy", "indifferent"] },
            { word: "esoteric", correct: "obscure", wrong: ["common", "famous", "popular"] },
            { word: "ambiguous", correct: "unclear", wrong: ["obvious", "clear", "definite"] },
            { word: "candid", correct: "honest", wrong: ["dishonest", "sly", "deceptive"] },
            { word: "prudent", correct: "wise", wrong: ["reckless", "careless", "foolish"] },
            { word: "profound", correct: "deep", wrong: ["shallow", "superficial", "simple"] },
        ],
        antonym: [
            { word: "benevolent", correct: "malevolent", wrong: ["kind", "generous", "helpful"] },
            { word: "ephemeral", correct: "permanent", wrong: ["temporary", "brief", "short"] },
            { word: "ascend", correct: "descend", wrong: ["rise", "climb", "soar"] },
            { word: "opaque", correct: "transparent", wrong: ["cloudy", "dark", "murky"] },
            { word: "scarce", correct: "abundant", wrong: ["rare", "limited", "insufficient"] },
            { word: "chaotic", correct: "orderly", wrong: ["messy", "confused", "disorganized"] },
            { word: "artificial", correct: "natural", wrong: ["synthetic", "man-made", "engineered"] },
            { word: "hostile", correct: "friendly", wrong: ["aggressive", "unfriendly", "harsh"] },
            { word: "fragile", correct: "strong", wrong: ["weak", "delicate", "brittle"] },
            { word: "vague", correct: "specific", wrong: ["unclear", "ambiguous", "imprecise"] },
        ],
        definition: [
            { word: "serendipity", correct: "pleasant surprise", wrong: ["bad luck", "planned event", "boring moment"] },
            { word: "epiphany", correct: "sudden realization", wrong: ["confusion", "question", "mistake"] },
            { word: "labyrinth", correct: "complex maze", wrong: ["simple path", "straight road", "open field"] },
            { word: "paradox", correct: "contradictory statement", wrong: ["simple truth", "story", "fact"] },
            { word: "quintessential", correct: "perfect example", wrong: ["worst example", "average", "rare"] },
            { word: "mellifluous", correct: "pleasant-sounding", wrong: ["harsh", "ugly", "rough"] },
            { word: "oblivion", correct: "state of being forgotten", wrong: ["fame", "attention", "recognition"] },
            { word: "zenith", correct: "highest point", wrong: ["lowest point", "middle", "base"] },
            { word: "cacophony", correct: "harsh noise", wrong: ["pleasant sound", "music", "silence"] },
            { word: "ephemeral", correct: "short-lived", wrong: ["long-lasting", "permanent", "eternal"] },
        ],
        spelling: [
            { word: "accommodate", correct: "accommodate", wrong: ["accomodate", "acomodate", "acommodate"] },
            { word: "definitely", correct: "definitely", wrong: ["definately", "definitly", "definetly"] },
            { word: "conscientious", correct: "conscientious", wrong: ["consciencious", "consientious", "conscientious"] },
            { word: "pronunciation", correct: "pronunciation", wrong: ["pronounciation", "pronuntiation", "pronounciaton"] },
            { word: "rhythm", correct: "rhythm", wrong: ["rythm", "rithm", "rhythem"] },
            { word: "miscellaneous", correct: "miscellaneous", wrong: ["miscelaneous", "miscellanous", "micesllaneous"] },
            { word: "occasionally", correct: "occasionally", wrong: ["ocasionally", "occassionally", "ocassionally"] },
            { word: "embarrass", correct: "embarrass", wrong: ["embarass", "embarras", "embarrs"] },
            { word: "harass", correct: "harass", wrong: ["harrass", "haras", "harres"] },
            { word: "connoisseur", correct: "connoisseur", wrong: ["conaisseur", "connosieur", "connoiser"] },
        ],
        }

    }

    const difficultyWords = wordSets[difficulty][questionType]
// Filter out used words
const unusedWords = difficultyWords.filter(
    w => !this.usedWords[difficulty][questionType].includes(w.word)
);

if (unusedWords.length === 0) {
    console.log("All questions for this type and difficulty have been used!");
    return null; // or reset usedWords[difficulty][questionType] = [] if you want to restart
}

// Pick a random unused word
const selectedWord = unusedWords[Math.floor(Math.random() * unusedWords.length)];

// Mark as used
this.usedWords[difficulty][questionType].push(selectedWord.word);

let question, correctAnswer, options;
switch (questionType) {
    case "synonym":
    question = `What is a synonym for "${selectedWord.word}"?`;
    correctAnswer = selectedWord.correct;
    options = [correctAnswer, ...selectedWord.wrong];
    break;
    case "antonym":
    question = `What is the opposite of "${selectedWord.word}"?`;
    correctAnswer = selectedWord.correct;
    options = [correctAnswer, ...selectedWord.wrong];
    break;
    case "definition":
    question = `What is a "${selectedWord.word}"?`;
    correctAnswer = selectedWord.correct;
    options = [correctAnswer, ...selectedWord.wrong];
    break;
    case "spelling":
    question = `Which word is spelled correctly?`;
    correctAnswer = selectedWord.correct;
    options = [correctAnswer, ...selectedWord.wrong];
    break;
}

// Shuffle options
for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
}

return { question, correctAnswer, options };
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

    // Reset sprint and shield
    this.sprint.active = false
    this.sprint.energy = this.sprint.maxEnergy
    this.hasShield = false
    this.shieldPickup = null
    this.shieldSpawned = false

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

    // Sprint activation (hold Shift)
    if ((code === "ShiftLeft" || code === "ShiftRight") && !this.paused) {
    if (this.sprint.energy > 0) this.sprint.active = true
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

    // Collect shield pickup if present at head
    if (this.shieldPickup && head.x === this.shieldPickup.x && head.y === this.shieldPickup.y) {
    this.hasShield = true
    this.shieldPickup = null
    this.showNotification("Shield acquired! 🛡️", "correct")
    }

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
        // Wrong answer: shield blocks once
        if (this.hasShield) {
        this.hasShield = false
        this.snakeFace = "normal"
        this.showNotification("Shield saved you! 🛡️", "correct")
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
    this.showNotification("Shield appeared! 🛡️", "correct")
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
    this.ctx.imageSmoothingEnabled = false

    this.ctx.clearRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT)

    // Draw snake using sprites
    this.snake.forEach((segment, index) => {
    const x = segment.x * this.GRID_SIZE;
    const y = segment.y * this.GRID_SIZE;

    if (index === 0) {
    // ===== HEAD =====
        let headSprite = this.sprites.SnakeHead; // default (up)
        if (this.direction.x === 1) headSprite = this.sprites.SnakeHeadRight;
        else if (this.direction.x === -1) headSprite = this.sprites.SnakeHeadLeft;
        else if (this.direction.y === 1) headSprite = this.sprites.SnakeHeadDown;

    if (headSprite?.complete && headSprite) {
    this.ctx.drawImage(headSprite, x, y, this.GRID_SIZE, this.GRID_SIZE);
    } else {
    this.ctx.fillStyle = "#32cd32";
    this.ctx.fillRect(x, y, this.GRID_SIZE, this.GRID_SIZE);
    this.drawPixelSnakeFace(x, y, this.snakeFace);
    }
} 
else if (index === this.snake.length - 1) {
    // ===== TAIL =====
    const prevSegment = this.snake[index - 1];
    const tailDir = { x: prevSegment.x - segment.x, y: prevSegment.y - segment.y };

    let tailSprite = this.sprites.SnakeTail; // default up
    if (tailDir.x === 1) tailSprite = this.sprites.SnakeTailRight;
    else if (tailDir.x === -1) tailSprite = this.sprites.SnakeTailLeft;
    else if (tailDir.y === 1) tailSprite = this.sprites.SnakeTailDown;

    if (tailSprite?.complete) {
    this.ctx.drawImage(tailSprite, x, y, this.GRID_SIZE, this.GRID_SIZE);
    } else {
    this.ctx.fillStyle = "#228b22";
    this.ctx.fillRect(x, y, this.GRID_SIZE, this.GRID_SIZE);
    }
} 
else {
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
      (dirNext.y === -1 && dirPrev.x === -1) || // down → right
      (dirNext.x === 1 && dirPrev.y === 1) ||   // left → up
      (dirNext.y === this.GRID_HEIGHT - 1 && dirPrev.x === -1) || // lower edge → upper edge → right
      (dirNext.x === - (this.GRID_WIDTH - 1) && dirPrev.y === 1) || // left edge → right edge → up
      (dirNext.y === -1 && dirPrev.x === this.GRID_WIDTH - 1) || // down → right edge → left edge
      (dirNext.x === 1 && dirPrev.y === - (this.GRID_HEIGHT - 1)) // left → upper edge → lower edge
    ) {
      bodySprite = this.sprites.SnakeCornerLeftDown;

    } else if (
      (dirNext.y === -1 && dirPrev.x === 1) ||  // down → left
      (dirNext.x === -1 && dirPrev.y === 1) ||  // right → up
      (dirNext.y === this.GRID_HEIGHT - 1 && dirPrev.x === 1) || // lower edge → upper edge → left
      (dirNext.x === this.GRID_WIDTH - 1 && dirPrev.y === 1) || // right edge → left edge → up
      (dirNext.y === -1 && dirPrev.x === - (this.GRID_WIDTH - 1)) || // down → left edge → right edge
      (dirNext.x === -1 && dirPrev.y === - (this.GRID_HEIGHT - 1)) // right → upper edge → lower edge
    ) {
    bodySprite = this.sprites.SnakeCornerRightDown;
    } else if (
    (dirNext.y === 1 && dirPrev.x === -1) ||  // up → right
    (dirNext.x === 1 && dirPrev.y === -1) ||  // left → down
    (dirNext.y === - (this.GRID_HEIGHT - 1) && dirPrev.x === -1) || // upper edge → lower edge → right
    (dirNext.x === - (this.GRID_WIDTH - 1) && dirPrev.y === -1) || // left edge → right edge → down
    (dirNext.y === 1 && dirPrev.x === this.GRID_WIDTH - 1) || // up → right edge → left edge
    (dirNext.x === 1 && dirPrev.y === this.GRID_HEIGHT - 1) // left → lower edge → upper edge
    ) {
    bodySprite = this.sprites.SnakeCornerLeftUp;
    } else if (
    (dirNext.y === 1 && dirPrev.x === 1) ||   // up → left
    (dirNext.x === -1 && dirPrev.y === -1) || // right → down
    (dirNext.y === - (this.GRID_HEIGHT - 1) && dirPrev.x === 1) || // upper edge → lower edge → left
    (dirNext.x === this.GRID_WIDTH - 1 && dirPrev.y === -1) || // right edge → left edge → down
    (dirNext.y === 1 && dirPrev.x === - (this.GRID_WIDTH - 1)) || // up → left edge → right edge
    (dirNext.x === -1 && dirPrev.y === this.GRID_HEIGHT - 1) // right → lower edge → upper edge
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

    // Draw shield pickup if present
    if (this.shieldPickup) {
    const px = this.shieldPickup.x * this.GRID_SIZE
    const py = this.shieldPickup.y * this.GRID_SIZE
    this.ctx.fillStyle = "#1e90ff"
    this.ctx.fillRect(px, py, this.GRID_SIZE, this.GRID_SIZE)
    this.ctx.strokeStyle = "#000"
    this.ctx.lineWidth = 3
    this.ctx.strokeRect(px, py, this.GRID_SIZE, this.GRID_SIZE)
    this.ctx.strokeStyle = "#a6d8ff"
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(px + 2, py + 2, this.GRID_SIZE - 4, this.GRID_SIZE - 4)
    const iconSize = Math.max(12, Math.floor(this.GRID_SIZE * 0.8))
    this.ctx.font = `${iconSize}px "Press Start 2P", monospace`
    this.ctx.textAlign = "center"
    this.ctx.textBaseline = "middle"
    this.ctx.fillStyle = "#000"
    this.ctx.fillText("🛡️", px + this.GRID_SIZE / 2 + 1, py + this.GRID_SIZE / 2 + 1)
    this.ctx.fillStyle = "#fff"
    this.ctx.fillText("🛡️", px + this.GRID_SIZE / 2, py + this.GRID_SIZE / 2)
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

    // Sprint/stamina bar
    const bar = this.sprintBar
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
    this.ctx.fillText("SPRINT", bar.x + 7, bar.y - 1)
    this.ctx.fillStyle = "#fff"
    this.ctx.fillText("SPRINT", bar.x + 6, bar.y - 2)
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
        gridSize: 50,
        baseSpeed: 6,
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
    } else {t
        clearInterval(countdownInterval)
        countdownOverlay.remove()
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
new SnakeEnglishGame()
})
