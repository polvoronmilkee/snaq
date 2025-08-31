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

      this.sounds = {
        biteApple: new Audio("../assets/sounds/bite-apple.mp3"),
        snakeTurns: new Audio("../assets/sounds/snake-turns.mp3"),
        snakeDies: new Audio("../assets/sounds/snake-dies.mp3"),
        snakeLosesLife: new Audio("../assets/sounds/snake-loses-life.mp3"),
        correct: new Audio("../assets/sounds/correct.mp3"),
        bgMusic: new Audio("../assets/sounds/bg-music.mp3"),
        youWon: new Audio("../assets/sounds/good-job.mp3"),
        click: new Audio("../assets/sounds/click.mp3"),
        countdown: new Audio("../assets/sounds/countdown.mp3"),
        shift: new Audio("../assets/sounds/shift.mp3"),
        pause: new Audio("../assets/sounds/pause.mp3")
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
    const skinPath = `../assets/snake_movement/${this.selectedSkin}_snake`
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
        "apple": "../assets/apples/apple.png",
        "appleA-pink": "../assets/apples/appleA-pink.png",
        "appleB-yellow": "../assets/apples/appleB-yellow.png",
        "appleC-blue": "../assets/apples/appleC-blue.png",
        // Icon sprites
        "shield": "../assets/icons/shield.png"
      }

      Object.entries(spritePaths).forEach(([name, path]) => {
        this.sprites[name] = new Image()
        this.sprites[name].src = path
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
      this.playAgainConfirm = document.getElementById("play-again-confirm")
      this.playAgainConfirmBtn = document.getElementById("confirm-play-again")
      this.cancelPlayAgain = document.getElementById("cancel-play-again")
      this.menuBtn = document.getElementById("menu-btn")
      this.restartConfirm = document.getElementById("restart-confirm")
      this.confirmRestartBtn = document.getElementById("confirm-restart")
      this.cancelRestartBtn = document.getElementById("cancel-restart")
      this.timerDisplay = document.getElementById("timer-display")
      this.timerValue = document.getElementById("timer-value")
      this.optionsContainer = document.getElementById("options-display")
      this.heartsContainer = document.getElementById("hearts-container")
      this.helpBtn = document.getElementById("help-btn")
      this.helpBtnEsc = document.getElementById("help-btn-esc")
      this.soundBtn = document.getElementById("sound-btn")
      this.musicBtn = document.getElementById("music-btn")
      this.instructionsModal = document.getElementById("instructions-modal")
      this.closeInstructionsBtn = document.getElementById("close-instructions")
      this.aboutBtn = document.getElementById("about-btn")
      this.aboutModal = document.getElementById("about-modal")
      this.closeAbout = document.getElementById("close-about")

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
      this.menuBtn.addEventListener("click", () => (window.location.href = "../index.html"))
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
          window.location.href = "../index.html";
        }
      });
  }

  showEscMenu() {
    if (this.gameRunning && !this.paused && !this.countdownActive && 
        this.restartConfirm.classList.contains("hidden")) {
      this.escMenuActive = true;
      this.paused = true;
      document.getElementById("esc-menu").classList.remove("hidden");
    }
  }

    hideEscMenu() {
      this.escMenuActive = false;
      this.paused = false;
      document.getElementById("esc-menu").classList.add("hidden");
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
              appleImg.src = `../assets/apples/${appleColors[index] || "apple.png"}`
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
  const difficulty = this.gameSettings.difficulty;
  const questionTypes = ["biology", "physics", "chemistry", "earth"];
  const questionType = questionTypes[Math.floor(Math.random() * questionTypes.length)];

  const scienceSets = {
    easy: {
    biology: [
        { question: "What part of the plant makes food?", correct: "Leaf", wrong: ["Root", "Stem", "Flower"] },
        { question: "What do humans need to breathe?", correct: "Oxygen", wrong: ["Carbon dioxide", "Nitrogen", "Hydrogen"] },
        { question: "What is the basic unit of life?", correct: "Cell", wrong: ["Tissue", "Organ", "Organism"] },
        { question: "What do bees collect from flowers?", correct: "Nectar", wrong: ["Leaves", "Seeds", "Roots"] },
        { question: "Which organ pumps blood in humans?", correct: "Heart", wrong: ["Lungs", "Brain", "Liver"] },
        { question: "Which part of the body helps us smell?", correct: "Nose", wrong: ["Eyes", "Ears", "Mouth"] },
        { question: "Which organ helps us breathe?", correct: "Lungs", wrong: ["Heart", "Stomach", "Kidneys"] },
        { question: "What do fish use to breathe?", correct: "Gills", wrong: ["Lungs", "Skin", "Fins"] },
        { question: "What do cows give us to drink?", correct: "Milk", wrong: ["Water", "Juice", "Oil"] },
        { question: "Which animal is known as man's best friend?", correct: "Dog", wrong: ["Cat", "Horse", "Rabbit"] },
        { question: "What part of the body helps us see?", correct: "Eyes", wrong: ["Ears", "Nose", "Mouth"] },
        { question: "Which organ covers the human body?", correct: "Skin", wrong: ["Liver", "Lungs", "Heart"] },
        { question: "What do plants need from sunlight to make food?", correct: "Energy", wrong: ["Water", "Soil", "Air"] },
        { question: "Which bird is known for saying 'Polly wants a cracker'?", correct: "Parrot", wrong: ["Crow", "Eagle", "Owl"] },
        { question: "Which animal lives both on land and in water?", correct: "Frog", wrong: ["Snake", "Dog", "Tiger"] },
        { question: "What do you call baby cats?", correct: "Kittens", wrong: ["Puppies", "Cubs", "Chicks"] },
        { question: "Which animal gives us wool?", correct: "Sheep", wrong: ["Cow", "Goat", "Horse"] },
        { question: "What do you call a group of fish?", correct: "School", wrong: ["Pack", "Flock", "Herd"] },
        { question: "What food do pandas mostly eat?", correct: "Bamboo", wrong: ["Grass", "Leaves", "Fruit"] },
        { question: "Which animal has a trunk?", correct: "Elephant", wrong: ["Giraffe", "Hippopotamus", "Camel"] },
    ],
    physics: [
        { question: "What force pulls objects toward Earth?", correct: "Gravity", wrong: ["Magnetism", "Friction", "Electricity"] },
        { question: "What is the source of light on Earth?", correct: "The Sun", wrong: ["Moon", "Stars", "Fire"] },
        { question: "Which device is used to see far objects?", correct: "Telescope", wrong: ["Microscope", "Binoculars", "Camera"] },
        { question: "What energy makes things hot?", correct: "Heat", wrong: ["Light", "Sound", "Magnetism"] },
        { question: "What do we call stored energy?", correct: "Potential energy", wrong: ["Kinetic energy", "Heat energy", "Light energy"] },
        { question: "Which force slows down moving objects?", correct: "Friction", wrong: ["Gravity", "Magnetism", "Electricity"] },
        { question: "Which simple machine is used to lift heavy objects?", correct: "Lever", wrong: ["Pulley", "Screw", "Wheel"] },
        { question: "Which material is attracted by magnets?", correct: "Iron", wrong: ["Wood", "Plastic", "Paper"] },
        { question: "What travels faster than sound?", correct: "Light", wrong: ["Water", "Wind", "Car"] },
        { question: "Which type of energy is in moving objects?", correct: "Kinetic energy", wrong: ["Potential energy", "Heat energy", "Chemical energy"] },
        { question: "What do we use to measure time?", correct: "Clock", wrong: ["Scale", "Meter", "Compass"] },
        { question: "What is the opposite of push?", correct: "Pull", wrong: ["Lift", "Drop", "Throw"] },
        { question: "Which instrument measures temperature?", correct: "Thermometer", wrong: ["Barometer", "Speedometer", "Altimeter"] },
        { question: "What force keeps us from floating away?", correct: "Gravity", wrong: ["Magnetism", "Friction", "Pressure"] },
        { question: "Which form of energy is used in light bulbs?", correct: "Electricity", wrong: ["Heat", "Magnetism", "Sound"] },
        { question: "Which planet is closest to the Sun?", correct: "Mercury", wrong: ["Venus", "Earth", "Mars"] },
        { question: "Which energy is stored in food?", correct: "Chemical energy", wrong: ["Heat energy", "Nuclear energy", "Kinetic energy"] },
        { question: "What travels in straight lines and lets us see?", correct: "Light", wrong: ["Sound", "Heat", "Magnetism"] },
        { question: "What type of energy is sound?", correct: "Vibrational energy", wrong: ["Light energy", "Heat energy", "Kinetic energy"] },
        { question: "Which unit measures force?", correct: "Newton", wrong: ["Joule", "Watt", "Volt"] },
    ],
    chemistry: [
        { question: "What is H₂O?", correct: "Water", wrong: ["Oxygen", "Hydrogen", "Carbon dioxide"] },
        { question: "What do we call the simplest type of substance?", correct: "Element", wrong: ["Compound", "Mixture", "Solution"] },
        { question: "What gas do plants release?", correct: "Oxygen", wrong: ["Carbon dioxide", "Nitrogen", "Hydrogen"] },
        { question: "What taste does an acid usually have?", correct: "Sour", wrong: ["Bitter", "Sweet", "Salty"] },
        { question: "Which gas do humans breathe out?", correct: "Carbon dioxide", wrong: ["Oxygen", "Hydrogen", "Nitrogen"] },
        { question: "What do we call a mixture of metals?", correct: "Alloy", wrong: ["Solution", "Compound", "Element"] },
        { question: "Which substance makes up diamonds?", correct: "Carbon", wrong: ["Oxygen", "Silicon", "Hydrogen"] },
        { question: "What do we call table salt?", correct: "Sodium chloride", wrong: ["Calcium chloride", "Potassium nitrate", "Magnesium oxide"] },
        { question: "Which element has the symbol O?", correct: "Oxygen", wrong: ["Gold", "Osmium", "Oxide"] },
        { question: "What is the chemical symbol for gold?", correct: "Au", wrong: ["Ag", "G", "Go"] },
        { question: "What do we call the air we breathe?", correct: "Atmosphere", wrong: ["Oxygen", "Carbon dioxide", "Nitrogen"] },
        { question: "What is NaCl?", correct: "Salt", wrong: ["Sugar", "Water", "Ammonia"] },
        { question: "Which element's symbol is H?", correct: "Hydrogen", wrong: ["Helium", "Hafnium", "Holmium"] },
        { question: "What is the chemical symbol for silver?", correct: "Ag", wrong: ["Si", "S", "Au"] },
        { question: "What substance is used in pencils?", correct: "Graphite", wrong: ["Lead", "Charcoal", "Carbon dioxide"] },
        { question: "What gas makes balloons float?", correct: "Helium", wrong: ["Oxygen", "Nitrogen", "Carbon dioxide"] },
        { question: "Which acid is found in lemons?", correct: "Citric acid", wrong: ["Acetic acid", "Sulfuric acid", "Lactic acid"] },
        { question: "What is the pH of pure water?", correct: "7", wrong: ["5", "1", "10"] },
        { question: "Which element is most abundant in the universe?", correct: "Hydrogen", wrong: ["Oxygen", "Carbon", "Nitrogen"] },
        { question: "What is CO₂ commonly called?", correct: "Carbon dioxide", wrong: ["Carbon monoxide", "Oxygen", "Nitrogen"] },
    ],
    earth: [
        { question: "What planet do we live on?", correct: "Earth", wrong: ["Mars", "Venus", "Jupiter"] },
        { question: "What natural satellite orbits Earth?", correct: "The Moon", wrong: ["The Sun", "Asteroid", "Star"] },
        { question: "What covers most of Earth's surface?", correct: "Water", wrong: ["Land", "Mountains", "Ice"] },
        { question: "What do we call frozen water?", correct: "Ice", wrong: ["Steam", "Salt", "Gas"] },
        { question: "Which planet is known as the Red Planet?", correct: "Mars", wrong: ["Venus", "Jupiter", "Mercury"] },
        { question: "What is the hottest planet in our solar system?", correct: "Venus", wrong: ["Mercury", "Mars", "Jupiter"] },
        { question: "What do we call a scientist who studies rocks?", correct: "Geologist", wrong: ["Astronomer", "Biologist", "Chemist"] },
        { question: "Which layer of Earth do we live on?", correct: "Crust", wrong: ["Mantle", "Core", "Outer core"] },
        { question: "What is the largest ocean on Earth?", correct: "Pacific Ocean", wrong: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean"] },
        { question: "Which gas makes up most of the Earth's atmosphere?", correct: "Nitrogen", wrong: ["Oxygen", "Carbon dioxide", "Hydrogen"] },
        { question: "Which continent is the largest?", correct: "Asia", wrong: ["Africa", "North America", "Europe"] },
        { question: "Which continent is the smallest?", correct: "Australia", wrong: ["Europe", "South America", "Antarctica"] },
        { question: "What is the highest mountain in the world?", correct: "Mount Everest", wrong: ["K2", "Kilimanjaro", "Makalu"] },
        { question: "Which ocean is the smallest?", correct: "Arctic Ocean", wrong: ["Indian Ocean", "Atlantic Ocean", "Pacific Ocean"] },
        { question: "Which desert is the largest in the world?", correct: "Sahara Desert", wrong: ["Gobi Desert", "Kalahari Desert", "Great Victoria Desert"] },
        { question: "What do we call molten rock under Earth's surface?", correct: "Magma", wrong: ["Lava", "Basalt", "Granite"] },
        { question: "What do we call molten rock when it comes out of a volcano?", correct: "Lava", wrong: ["Magma", "Ash", "Smoke"] },
        { question: "What is Earth's only natural satellite?", correct: "The Moon", wrong: ["Mars", "Phobos", "Sun"] },
        { question: "What season comes after summer?", correct: "Autumn", wrong: ["Spring", "Winter", "Rainy"] },
        { question: "Which planet is called the 'Blue Planet'?", correct: "Earth", wrong: ["Neptune", "Mars", "Venus"] },
    ],
    },
    medium: {
        biology: [
        { question: "What part of the cell contains genetic material?", correct: "Nucleus", wrong: ["Cytoplasm", "Membrane", "Ribosome"] },
        { question: "Which blood cells fight infection?", correct: "White blood cells", wrong: ["Red blood cells", "Platelets", "Plasma"] },
        { question: "What gas do humans exhale?", correct: "Carbon dioxide", wrong: ["Oxygen", "Nitrogen", "Hydrogen"] },
        { question: "Which organ pumps blood?", correct: "Heart", wrong: ["Lungs", "Brain", "Liver"] },
        { question: "Which organ filters blood in the human body?", correct: "Kidney", wrong: ["Liver", "Lungs", "Pancreas"] },
        { question: "What pigment makes plants green?", correct: "Chlorophyll", wrong: ["Melanin", "Carotene", "Xanthophyll"] },
        { question: "Which organ helps us breathe?", correct: "Lungs", wrong: ["Stomach", "Kidneys", "Heart"] },
        { question: "What type of blood carries oxygen?", correct: "Red blood cells", wrong: ["White blood cells", "Plasma", "Platelets"] },
        { question: "What structure connects muscles to bones?", correct: "Tendon", wrong: ["Ligament", "Cartilage", "Nerves"] },
        { question: "What system controls voluntary movement?", correct: "Nervous system", wrong: ["Respiratory system", "Digestive system", "Endocrine system"] },
        { question: "Which organ produces insulin?", correct: "Pancreas", wrong: ["Liver", "Kidney", "Stomach"] },
        { question: "What is the largest organ in the human body?", correct: "Skin", wrong: ["Heart", "Liver", "Lungs"] },
        { question: "What gas do plants take in during photosynthesis?", correct: "Carbon dioxide", wrong: ["Oxygen", "Nitrogen", "Hydrogen"] },
        { question: "What is the process of breaking down food called?", correct: "Digestion", wrong: ["Respiration", "Absorption", "Circulation"] },
        { question: "What organ is responsible for detoxifying chemicals?", correct: "Liver", wrong: ["Kidney", "Stomach", "Lungs"] },
        { question: "Which blood type is the universal donor?", correct: "O-", wrong: ["A", "B", "AB+"] },
        { question: "What is the hardest substance in the human body?", correct: "Tooth enamel", wrong: ["Bone", "Cartilage", "Nail"] },
        { question: "What organelle is known as the powerhouse of the cell?", correct: "Mitochondria", wrong: ["Nucleus", "Ribosome", "Golgi apparatus"] },
        { question: "What carries messages between the brain and body?", correct: "Nerves", wrong: ["Arteries", "Veins", "Muscles"] },
        { question: "Which part of the brain controls balance?", correct: "Cerebellum", wrong: ["Cerebrum", "Brainstem", "Hypothalamus"] },
        ],
        physics: [
        { question: "What is the speed of light?", correct: "300,000 km/s", wrong: ["30,000 km/s", "300 km/s", "3,000 km/s"] },
        { question: "What energy is stored in food?", correct: "Chemical energy", wrong: ["Heat energy", "Nuclear energy", "Light energy"] },
        { question: "What is measured in Newtons?", correct: "Force", wrong: ["Energy", "Mass", "Temperature"] },
        { question: "What type of energy does a moving car have?", correct: "Kinetic", wrong: ["Potential", "Thermal", "Nuclear"] },
        { question: "What simple machine is a seesaw?", correct: "Lever", wrong: ["Pulley", "Inclined plane", "Screw"] },
        { question: "What unit is used to measure power?", correct: "Watt", wrong: ["Joule", "Newton", "Ampere"] },
        { question: "What is the force that slows objects moving through air?", correct: "Air resistance", wrong: ["Gravity", "Magnetism", "Tension"] },
        { question: "What type of energy does a stretched rubber band have?", correct: "Elastic potential", wrong: ["Kinetic", "Thermal", "Nuclear"] },
        { question: "Which law states that for every action there is an equal and opposite reaction?", correct: "Newton's Third Law", wrong: ["First Law", "Second Law", "Law of Gravity"] },
        { question: "What instrument measures electric current?", correct: "Ammeter", wrong: ["Voltmeter", "Barometer", "Thermometer"] },
        { question: "What does a prism do to light?", correct: "Splits it into colors", wrong: ["Magnifies it", "Absorbs it", "Reflects it"] },
        { question: "Which type of wave needs no medium to travel?", correct: "Electromagnetic", wrong: ["Sound", "Water", "Seismic"] },
        { question: "What is the acceleration due to gravity on Earth?", correct: "9.8 m/s²", wrong: ["10 m/s²", "8 m/s²", "12 m/s²"] },
        { question: "What is the unit of frequency?", correct: "Hertz", wrong: ["Joule", "Newton", "Ohm"] },
        { question: "What does a convex lens do?", correct: "Converges light rays", wrong: ["Diverges rays", "Blocks rays", "Scatters rays"] },
        { question: "What kind of energy is sunlight?", correct: "Radiant energy", wrong: ["Chemical energy", "Thermal energy", "Nuclear energy"] },
        { question: "What part of an atom has a positive charge?", correct: "Proton", wrong: ["Electron", "Neutron", "Nucleus"] },
        { question: "What is sound caused by?", correct: "Vibrations", wrong: ["Reflections", "Refractions", "Waves only"] },
        { question: "What type of current flows in one direction only?", correct: "Direct current (DC)", wrong: ["Alternating current (AC)", "Static current", "Dynamic current"] },
        { question: "What type of energy is released in nuclear reactions?", correct: "Nuclear energy", wrong: ["Thermal", "Kinetic", "Radiant"] },
        ],
        chemistry: [
        { question: "What is NaCl?", correct: "Salt", wrong: ["Sugar", "Water", "Vinegar"] },
        { question: "What particle has a negative charge?", correct: "Electron", wrong: ["Proton", "Neutron", "Atom"] },
        { question: "What is the chemical symbol for gold?", correct: "Au", wrong: ["Ag", "Fe", "Gd"] },
        { question: "Which gas is used in balloons?", correct: "Helium", wrong: ["Hydrogen", "Oxygen", "Nitrogen"] },
        { question: "What is the chemical symbol for sodium?", correct: "Na", wrong: ["So", "S", "Sn"] },
        { question: "What element does 'O' represent?", correct: "Oxygen", wrong: ["Osmium", "Gold", "Hydrogen"] },
        { question: "Which element has the chemical symbol 'Fe'?", correct: "Iron", wrong: ["Fluorine", "Lead", "Zinc"] },
        { question: "What gas is needed for combustion?", correct: "Oxygen", wrong: ["Carbon dioxide", "Hydrogen", "Nitrogen"] },
        { question: "What do we call a mixture of metals?", correct: "Alloy", wrong: ["Compound", "Solution", "Molecule"] },
        { question: "What is the pH of pure water?", correct: "7", wrong: ["0", "14", "5"] },
        { question: "What acid is found in lemons?", correct: "Citric acid", wrong: ["Sulfuric acid", "Acetic acid", "Lactic acid"] },
        { question: "Which element is a liquid at room temperature?", correct: "Mercury", wrong: ["Iron", "Sodium", "Lead"] },
        { question: "Which gas makes up most of Earth's atmosphere?", correct: "Nitrogen", wrong: ["Oxygen", "Carbon dioxide", "Argon"] },
        { question: "What is the chemical symbol for silver?", correct: "Ag", wrong: ["Au", "Si", "S"] },
        { question: "Which element is the lightest?", correct: "Hydrogen", wrong: ["Helium", "Lithium", "Carbon"] },
        { question: "Which process separates salt from water?", correct: "Distillation", wrong: ["Filtration", "Evaporation", "Condensation"] },
        { question: "What is the common name for H2O2?", correct: "Hydrogen peroxide", wrong: ["Water", "Ozone", "Acid"] },
        { question: "What is the chemical formula for methane?", correct: "CH4", wrong: ["CO2", "C2H6", "C6H12O6"] },
        { question: "Which gas turns limewater milky?", correct: "Carbon dioxide", wrong: ["Oxygen", "Nitrogen", "Hydrogen"] },
        { question: "Which acid is present in vinegar?", correct: "Acetic acid", wrong: ["Sulfuric acid", "Nitric acid", "Citric acid"] },
        ],
        earth: [
        { question: "What is the largest ocean?", correct: "Pacific Ocean", wrong: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean"] },
        { question: "Which layer of Earth do we live on?", correct: "Crust", wrong: ["Mantle", "Core", "Lithosphere"] },
        { question: "What type of rock is formed from lava?", correct: "Igneous", wrong: ["Sedimentary", "Metamorphic", "Fossil"] },
        { question: "What causes day and night?", correct: "Earth's rotation", wrong: ["Earth's revolution", "Moon's orbit", "Sun's rotation"] },
        { question: "Which is the largest continent?", correct: "Asia", wrong: ["Africa", "North America", "Europe"] },
        { question: "What do we call molten rock under Earth's surface?", correct: "Magma", wrong: ["Lava", "Basalt", "Granite"] },
        { question: "Which planet is known as the Red Planet?", correct: "Mars", wrong: ["Venus", "Jupiter", "Mercury"] },
        { question: "Which gas causes the greenhouse effect?", correct: "Carbon dioxide", wrong: ["Oxygen", "Nitrogen", "Helium"] },
        { question: "What is Earth's only natural satellite?", correct: "The Moon", wrong: ["Phobos", "Sun", "Europa"] },
        { question: "What natural disaster is measured by the Richter scale?", correct: "Earthquake", wrong: ["Volcano", "Flood", "Tornado"] },
        { question: "What is the hottest planet in the solar system?", correct: "Venus", wrong: ["Mercury", "Mars", "Jupiter"] },
        { question: "Which layer of Earth is liquid?", correct: "Outer core", wrong: ["Inner core", "Mantle", "Crust"] },
        { question: "What is the study of weather called?", correct: "Meteorology", wrong: ["Geology", "Astronomy", "Climatology"] },
        { question: "What is the largest desert in the world?", correct: "Sahara", wrong: ["Gobi", "Kalahari", "Arctic"] },
        { question: "Which planet has the most moons?", correct: "Saturn", wrong: ["Jupiter", "Mars", "Neptune"] },
        { question: "What is the main gas in Earth's atmosphere?", correct: "Nitrogen", wrong: ["Oxygen", "Carbon dioxide", "Argon"] },
        { question: "Which ocean is the smallest?", correct: "Arctic Ocean", wrong: ["Indian Ocean", "Pacific Ocean", "Atlantic Ocean"] },
        { question: "What is the Earth's longest river?", correct: "Nile", wrong: ["Amazon", "Yangtze", "Mississippi"] },
        { question: "What is the coldest continent?", correct: "Antarctica", wrong: ["Europe", "Asia", "North America"] },
        { question: "Which country has the most volcanoes?", correct: "Indonesia", wrong: ["Japan", "USA", "Iceland"] },
        ],
    },
        hard: {
        biology: [
            { question: "What sugar is found in DNA?", correct: "Deoxyribose", wrong: ["Ribose", "Glucose", "Sucrose"] },
            { question: "What organelle is the powerhouse of the cell?", correct: "Mitochondria", wrong: ["Nucleus", "Ribosome", "Golgi body"] },
            { question: "What process makes gametes?", correct: "Meiosis", wrong: ["Mitosis", "Fertilization", "Replication"] },
            { question: "What pigment captures light in photosynthesis?", correct: "Chlorophyll", wrong: ["Hemoglobin", "Carotene", "Melanin"] },
            { question: "Which blood type is the universal donor?", correct: "O-", wrong: ["O+", "AB+", "A+"] },
            { question: "Which vitamin helps in blood clotting?", correct: "Vitamin K", wrong: ["Vitamin A", "Vitamin C", "Vitamin D"] },
            { question: "What is the largest organ in the human body?", correct: "Skin", wrong: ["Liver", "Lungs", "Heart"] },
            { question: "What is the scientific name for red blood cells?", correct: "Erythrocytes", wrong: ["Leukocytes", "Platelets", "Plasma"] },
            { question: "What is the fluid inside a cell called?", correct: "Cytoplasm", wrong: ["Nucleoplasm", "Chloroplast", "Mitochondria"] },
            { question: "Which part of the brain controls balance?", correct: "Cerebellum", wrong: ["Cerebrum", "Medulla", "Hypothalamus"] },
            { question: "What do ribosomes produce?", correct: "Proteins", wrong: ["Lipids", "Carbohydrates", "DNA"] },
            { question: "Which enzyme breaks down starch?", correct: "Amylase", wrong: ["Lipase", "Protease", "Lactase"] },
            { question: "What is the term for maintaining stable internal conditions?", correct: "Homeostasis", wrong: ["Metabolism", "Equilibrium", "Regulation"] },
            { question: "What type of reproduction involves one parent?", correct: "Asexual", wrong: ["Sexual", "Binary fusion", "Meiosis"] },
            { question: "Which human organ produces insulin?", correct: "Pancreas", wrong: ["Liver", "Kidney", "Stomach"] },
            { question: "Which blood vessels carry blood away from the heart?", correct: "Arteries", wrong: ["Veins", "Capillaries", "Valves"] },
            { question: "Which part of the plant carries water upward?", correct: "Xylem", wrong: ["Phloem", "Stomata", "Chloroplast"] },
            { question: "What is the basic functional unit of the kidney?", correct: "Nephron", wrong: ["Alveoli", "Neuron", "Glomerulus"] },
            { question: "Which nucleic acid is single-stranded?", correct: "RNA", wrong: ["DNA", "Protein", "ATP"] },
            { question: "What organ filters blood in the human body?", correct: "Kidney", wrong: ["Liver", "Heart", "Lungs"] },
        ],
        physics: [
            { question: "Who proposed the theory of relativity?", correct: "Einstein", wrong: ["Newton", "Galileo", "Tesla"] },
            { question: "What is absolute zero in Celsius?", correct: "-273°C", wrong: ["0°C", "-100°C", "-459°C"] },
            { question: "What subatomic particle has no charge?", correct: "Neutron", wrong: ["Proton", "Electron", "Positron"] },
            { question: "What law explains action and reaction?", correct: "Newton's Third Law", wrong: ["First Law", "Second Law", "Law of Gravity"] },
            { question: "What is the unit of electrical resistance?", correct: "Ohm", wrong: ["Watt", "Ampere", "Volt"] },
            { question: "What is the escape velocity from Earth?", correct: "11.2 km/s", wrong: ["7.9 km/s", "9.8 km/s", "15 km/s"] },
            { question: "What is the weakest force in nature?", correct: "Gravitational", wrong: ["Electromagnetic", "Nuclear", "Magnetic"] },
            { question: "What phenomenon causes red shift?", correct: "Doppler Effect", wrong: ["Reflection", "Diffraction", "Refraction"] },
            { question: "What is the SI unit of power?", correct: "Watt", wrong: ["Joule", "Newton", "Volt"] },
            { question: "Which scientist discovered radioactivity?", correct: "Henri Becquerel", wrong: ["Marie Curie", "Rutherford", "Einstein"] },
            { question: "What type of lens is used in a magnifying glass?", correct: "Convex", wrong: ["Concave", "Plane", "Cylindrical"] },
            { question: "What is the bending of light called?", correct: "Refraction", wrong: ["Reflection", "Diffraction", "Dispersion"] },
            { question: "Which law relates pressure and volume of gas?", correct: "Boyle's Law", wrong: ["Charles's Law", "Avogadro's Law", "Dalton's Law"] },
            { question: "What is the most penetrating radiation?", correct: "Gamma rays", wrong: ["Alpha rays", "Beta rays", "X-rays"] },
            { question: "Which particles carry electric current in metals?", correct: "Electrons", wrong: ["Protons", "Neutrons", "Ions"] },
            { question: "What type of wave is sound?", correct: "Longitudinal", wrong: ["Transverse", "Electromagnetic", "Stationary"] },
            { question: "What is measured in Hertz?", correct: "Frequency", wrong: ["Wavelength", "Amplitude", "Speed"] },
            { question: "What is the branch of physics dealing with heat?", correct: "Thermodynamics", wrong: ["Kinetics", "Electrodynamics", "Mechanics"] },
            { question: "What is the angle of incidence equal to?", correct: "Angle of reflection", wrong: ["Refraction angle", "90°", "Critical angle"] },
            { question: "What type of energy is in a stretched spring?", correct: "Potential", wrong: ["Kinetic", "Thermal", "Nuclear"] },
        ],
        chemistry: [
            { question: "What is the pH of pure water?", correct: "7", wrong: ["0", "14", "5"] },
            { question: "Which element has atomic number 6?", correct: "Carbon", wrong: ["Oxygen", "Nitrogen", "Helium"] },
            { question: "What bond shares electrons?", correct: "Covalent", wrong: ["Ionic", "Hydrogen", "Metallic"] },
            { question: "Which acid is found in the stomach?", correct: "Hydrochloric acid", wrong: ["Sulfuric acid", "Nitric acid", "Carbonic acid"] },
            { question: "What is the lightest element?", correct: "Hydrogen", wrong: ["Helium", "Lithium", "Neon"] },
            { question: "What is CH₄?", correct: "Methane", wrong: ["Ethane", "Propane", "Butane"] },
            { question: "Who created the periodic table?", correct: "Mendeleev", wrong: ["Dalton", "Bohr", "Curie"] },
            { question: "Which gas turns limewater milky?", correct: "Carbon dioxide", wrong: ["Oxygen", "Nitrogen", "Hydrogen"] },
            { question: "What type of reaction releases heat?", correct: "Exothermic", wrong: ["Endothermic", "Neutralization", "Combustion"] },
            { question: "What is the chemical symbol for Mercury?", correct: "Hg", wrong: ["Me", "Mr", "Mc"] },
            { question: "Which element is used in thermometers?", correct: "Mercury", wrong: ["Lead", "Zinc", "Copper"] },
            { question: "What is the Avogadro's number?", correct: "6.022×10²³", wrong: ["3.14", "9.81", "1.6×10⁻¹⁹"] },
            { question: "What is the main gas in Earth's atmosphere?", correct: "Nitrogen", wrong: ["Oxygen", "Carbon dioxide", "Hydrogen"] },
            { question: "Which metal is liquid at room temperature?", correct: "Mercury", wrong: ["Sodium", "Potassium", "Aluminum"] },
            { question: "Which acid is found in vinegar?", correct: "Acetic acid", wrong: ["Citric acid", "Sulfuric acid", "Formic acid"] },
            { question: "Which gas is called laughing gas?", correct: "Nitrous oxide", wrong: ["Carbon monoxide", "Oxygen", "Hydrogen"] },
            { question: "What type of ions do acids produce?", correct: "H+ ions", wrong: ["OH- ions", "Na+ ions", "Cl- ions"] },
            { question: "What is the chemical symbol for silver?", correct: "Ag", wrong: ["Au", "Si", "Pb"] },
            { question: "What is the hardest natural substance?", correct: "Diamond", wrong: ["Quartz", "Graphite", "Corundum"] },
            { question: "Which element has the symbol 'K'?", correct: "Potassium", wrong: ["Calcium", "Krypton", "Phosphorus"] },
        ],
        earth: [
            { question: "What type of rock forms from pressure and heat?", correct: "Metamorphic", wrong: ["Igneous", "Sedimentary", "Volcanic"] },
            { question: "Which layer of Earth is liquid?", correct: "Outer core", wrong: ["Inner core", "Mantle", "Crust"] },
            { question: "What is the largest planet in our solar system?", correct: "Jupiter", wrong: ["Saturn", "Earth", "Neptune"] },
            { question: "What causes tides on Earth?", correct: "Moon's gravity", wrong: ["Sun's heat", "Earth's spin", "Wind"] },
            { question: "What is the hottest planet in the solar system?", correct: "Venus", wrong: ["Mercury", "Mars", "Jupiter"] },
            { question: "What is the Earth's most abundant gas?", correct: "Nitrogen", wrong: ["Oxygen", "Carbon dioxide", "Argon"] },
            { question: "What galaxy do we live in?", correct: "Milky Way", wrong: ["Andromeda", "Whirlpool", "Sombrero"] },
            { question: "What is the largest desert on Earth?", correct: "Antarctic Desert", wrong: ["Sahara", "Arctic", "Gobi"] },
            { question: "What is the deepest ocean trench?", correct: "Mariana Trench", wrong: ["Puerto Rico Trench", "Java Trench", "Tonga Trench"] },
            { question: "What is the study of earthquakes called?", correct: "Seismology", wrong: ["Volcanology", "Geology", "Astronomy"] },
            { question: "What is the smallest planet in our solar system?", correct: "Mercury", wrong: ["Mars", "Venus", "Pluto"] },
            { question: "What is Earth's primary source of energy?", correct: "The Sun", wrong: ["The Moon", "Volcanoes", "Earth's core"] },
            { question: "What type of galaxy is the Milky Way?", correct: "Spiral", wrong: ["Elliptical", "Irregular", "Lenticular"] },
            { question: "What is the Earth's innermost layer?", correct: "Inner core", wrong: ["Outer core", "Mantle", "Crust"] },
            { question: "What is the tallest mountain on Earth?", correct: "Mount Everest", wrong: ["K2", "Kangchenjunga", "Makalu"] },
            { question: "Which planet is known as the Red Planet?", correct: "Mars", wrong: ["Jupiter", "Venus", "Saturn"] },
            { question: "What causes the aurora borealis?", correct: "Solar wind", wrong: ["Moonlight", "Earth’s rotation", "Volcanoes"] },
            { question: "What is Earth’s only natural satellite?", correct: "The Moon", wrong: ["Phobos", "Titan", "Europa"] },
            { question: "Which planet has the most moons?", correct: "Saturn", wrong: ["Jupiter", "Uranus", "Neptune"] },
            { question: "What is the most common rock on Earth’s crust?", correct: "Basalt", wrong: ["Granite", "Limestone", "Sandstone"] },
        ],
        }
};

  const difficultyWords = scienceSets[difficulty][questionType];

  // Filter unused questions
  const unused = difficultyWords.filter(
    q => !this.usedWords[difficulty][questionType].includes(q.question)
  );

  if (unused.length === 0) {
        console.log("All questions have been used! You're one Brainy SnaQ! Resetting...");

        // Reset so we can reuse all questions
        this.usedWords[difficulty][questionType] = [];

        // After reset, all words are available again
        unusedWords = [...difficultyWords];
  }

  const selected = unused[Math.floor(Math.random() * unused.length)];
  this.usedWords[difficulty][questionType].push(selected.question);

  // shuffle options
  let options = [selected.correct, ...selected.wrong];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  return { question: selected.question, correctAnswer: selected.correct, options };
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
      this.sounds.pause.currentTime = 0
      this.sounds.pause.play()
      return
      }

      if (code === "KeyR" || key === "r") {
      this.showRestartConfirm()
      return
      }

      // Sprint activation (hold Shift)
      if ((code === "ShiftLeft" || code === "ShiftRight") && !this.paused) {
      if (this.sprint.energy > 0) this.sprint.active = true

      this.sounds.shift.currentTime = 0 
      this.sounds.shift.play()
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

      const isMovementKey = ["w","arrowup","s","arrowdown","a","arrowleft","d","arrowright"].includes(key)
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
        const overlay = document.getElementById("countdown-overlay");
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

          this.currentQuestion = this.generateQuestion()
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
    const shieldIndicator = document.getElementById('shield-indicator');
    if (shieldIndicator) {
        if (this.hasShield) {
            shieldIndicator.innerHTML = '<img src="../assets/icons/shield.png" class="shield-icon" alt="Shield">';
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
            const dirPrev = { x: segment.x - prev.x , y: segment.y - prev.y };

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
          this.iscountdownActive = false
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


      const copyrightModal = document.getElementById("copyright-modal");
      const closeCopyright = document.getElementById("close-copyright");
      const copyrightBtn = document.getElementById("copyright-btn"); 

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

