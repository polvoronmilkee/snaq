class SnakeGeneralKnowledgeGame {
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

      canvasContainer.style.backgroundImage = (this.gameSettings.selectedSkin === "volt") ? `url(../assets/snake-skins/volt_snake/Tile.png)` : `url("../assets/icons/Tile.png")`;

      const soundPath = (this.gameSettings.selectedSkin === "volt") ? "../assets/snake-skins/volt_snake/sounds" : "../assets/sounds"

      this.sounds = {
        biteApple: new Audio(`${soundPath}/bite-apple.mp3`),
        snakeTurns: new Audio(`${soundPath}/snake-turns.mp3`),
        snakeDies: new Audio(`${soundPath}/snake-dies.mp3`),
        snakeLosesLife: new Audio(`${soundPath}/snake-loses-life.mp3`),
        correct: new Audio(`${soundPath}/correct.mp3`),
        bgMusic: new Audio(`${soundPath}/bg-music.mp3`),
        youWon: new Audio("../assets/sounds/good-job.mp3"),
        click: new Audio(`${soundPath}/click.mp3`),
        countdown: new Audio(`${soundPath}/countdown.mp3`),
        shift: new Audio(`${soundPath}/shift.mp3`),
        pause: new Audio(`${soundPath}/pause.mp3`)
      }

      this.sounds.bgMusic.volume = (this.gameSettings.selectedSkin === "volt") ? 0.6 : 0.2
      this.sounds.shift.volume = (this.gameSettings.selectedSkin === "volt") ? 0.1 : 1
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
  easy: { history: [], geography: [], sports: [], popculture: [] },
  medium: { history: [], geography: [], sports: [], popculture: [] },
  hard: { history: [], geography: [], sports: [], popculture: [] },
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
      const skinPath = `../assets/snake-skins/${this.selectedSkin}_snake`
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

      this.aboutModal = document.getElementById("about-modal")
      this.closeAbout = document.getElementById("close-about")
      this.aboutBtn = document.getElementById("about-btn")

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
  const questionTypes = ["history", "geography", "sports", "popculture"];
  const questionType = questionTypes[Math.floor(Math.random() * questionTypes.length)];

  const gkSets = {
    easy: {
    history: [
        { question: "Who was the first President of the Philippines?", correct: "Emilio Aguinaldo", wrong: ["Sergio Osmeña", "Manuel L. Quezon", "Jose P. Laurel"] },
        { question: "Who is considered the national hero of the Philippines?", correct: "José Rizal", wrong: ["Andres Bonifacio", "Emilio Aguinaldo", "Apolinario Mabini"] },
        { question: "Who is known as the 'Father of the Katipunan'?", correct: "Andres Bonifacio", wrong: ["Emilio Jacinto", "Marcelo H. del Pilar", "José Rizal"] },
        { question: "In what year was Philippine Independence declared in Kawit, Cavite?", correct: "1898", wrong: ["1896", "1901", "1946"] },
        { question: "Who led the first circumnavigation of the world and landed in the Philippines?", correct: "Ferdinand Magellan", wrong: ["Christopher Columbus", "Juan Sebastián Elcano", "Miguel López de Legazpi"] },
        { question: "Who is known as the 'Brains of the Revolution'?", correct: "Apolinario Mabini", wrong: ["Emilio Jacinto", "Andres Bonifacio", "Marcelo H. del Pilar"] },
        { question: "What historic site in Manila is also called the 'Walled City'?", correct: "Intramuros", wrong: ["Fort Santiago", "Luneta", "Malacañang"] },
        { question: "Who was the first woman president of the Philippines?", correct: "Corazon Aquino", wrong: ["Gloria Macapagal-Arroyo", "Imelda Marcos", "Melchora Aquino"] },
        { question: "Who is the first Miss Universe winner from the Philippines?", correct: "Gloria Diaz", wrong: ["Margarita Moran", "Pia Wurtzbach", "Catriona Gray"] },
        { question: "Who was the president during the declaration of Martial Law in 1972?", correct: "Ferdinand Marcos", wrong: ["Diosdado Macapagal", "Corazon Aquino", "Elpidio Quirino"] },
        { question: "What Philippine mountain is the highest peak in the country?", correct: "Mount Apo", wrong: ["Mount Pulag", "Mount Banahaw", "Mount Mayon"] },
        { question: "Who was the first editor of La Solidaridad?", correct: "Graciano López Jaena", wrong: ["Marcelo H. del Pilar", "José Rizal", "Juan Luna"] },
        { question: "Who founded the Katipunan?", correct: "Andres Bonifacio", wrong: ["Emilio Aguinaldo", "Apolinario Mabini", "Gregorio del Pilar"] },
        { question: "Who is known as 'Tandang Sora'?", correct: "Melchora Aquino", wrong: ["Gabriela Silang", "Corazon Aquino", "Leona Florentino"] },
        { question: "What war was fought against American colonizers from 1899 to 1902?", correct: "Philippine-American War", wrong: ["Philippine Revolution", "World War II", "Filipino-Japanese War"] },
        { question: "Who painted the famous 'Spoliarium'?", correct: "Juan Luna", wrong: ["Fernando Amorsolo", "Félix Resurrección Hidalgo", "Carlos Botong Francisco"] },
        { question: "What ship carried the remains of José Rizal back to the Philippines in 1896?", correct: "SS España", wrong: ["SS Colon", "SS Montevideo", "SS Filipinas"] },
        { question: "Who was the first Prime Minister of the Philippines?", correct: "Cesar Virata", wrong: ["Ferdinand Marcos", "Arturo Tolentino", "Fidel Ramos"] },
        { question: "Which country colonized the Philippines for more than 300 years?", correct: "Spain", wrong: ["United States", "Japan", "China"] },
        { question: "Who was the first vice president of the Philippines?", correct: "Sergio Osmeña", wrong: ["Manuel Roxas", "Elpidio Quirino", "Jose P. Laurel"] }
    ],

    geography: [
        { question: "What is the largest ocean on Earth?", correct: "Pacific Ocean", wrong: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean"] },
        { question: "What is the capital of France?", correct: "Paris", wrong: ["Rome", "Madrid", "Berlin"] },
        { question: "What is the tallest mountain in the world?", correct: "Mount Everest", wrong: ["K2", "Kilimanjaro", "Makalu"] },
        { question: "Which desert is the largest in the world?", correct: "Sahara", wrong: ["Gobi", "Kalahari", "Arctic"] },
        { question: "What country has the Great Wall?", correct: "China", wrong: ["India", "Japan", "Mongolia"] },
        { question: "What is the longest river in the world?", correct: "Nile", wrong: ["Amazon", "Yangtze", "Mississippi"] },
        { question: "Which continent is the coldest?", correct: "Antarctica", wrong: ["Europe", "North America", "Asia"] },
        { question: "What country is shaped like a boot?", correct: "Italy", wrong: ["Spain", "France", "Greece"] },
        { question: "What is the capital of Japan?", correct: "Tokyo", wrong: ["Kyoto", "Osaka", "Seoul"] },
        { question: "Which country is famous for kangaroos?", correct: "Australia", wrong: ["South Africa", "New Zealand", "Brazil"] },
        { question: "What is the smallest country in the world?", correct: "Vatican City", wrong: ["Monaco", "San Marino", "Liechtenstein"] },
        { question: "Which continent is known as the 'Dark Continent'?", correct: "Africa", wrong: ["South America", "Asia", "Australia"] },
        { question: "What country has the city of Cairo?", correct: "Egypt", wrong: ["Morocco", "Turkey", "Saudi Arabia"] },
        { question: "What is the capital of Canada?", correct: "Ottawa", wrong: ["Toronto", "Vancouver", "Montreal"] },
        { question: "Which U.S. state is the largest by area?", correct: "Alaska", wrong: ["Texas", "California", "Montana"] },
        { question: "Which ocean borders India?", correct: "Indian Ocean", wrong: ["Pacific Ocean", "Atlantic Ocean", "Southern Ocean"] },
        { question: "Which European country has the tulip as its symbol?", correct: "Netherlands", wrong: ["Belgium", "Germany", "France"] },
        { question: "Which country has the Amazon rainforest?", correct: "Brazil", wrong: ["Peru", "Colombia", "Venezuela"] },
        { question: "What is the capital of South Korea?", correct: "Seoul", wrong: ["Busan", "Tokyo", "Beijing"] },
        { question: "Which continent has the most countries?", correct: "Africa", wrong: ["Asia", "Europe", "South America"] },
    ],

    sports: [
        { question: "How many players are on a soccer team (on field)?", correct: "11", wrong: ["9", "10", "12"] },
        { question: "In basketball, how many points is a free throw worth?", correct: "1", wrong: ["2", "3", "0"] },
        { question: "What sport uses a bat and ball and bases?", correct: "Baseball", wrong: ["Cricket", "Hockey", "Rugby"] },
        { question: "What color flag means 'stop' in car racing?", correct: "Red", wrong: ["Yellow", "Green", "Blue"] },
        { question: "What sport has love, deuce, and ace?", correct: "Tennis", wrong: ["Badminton", "Volleyball", "Table Tennis"] },
        { question: "Which sport is known as 'the beautiful game'?", correct: "Soccer", wrong: ["Basketball", "Rugby", "Cricket"] },
        { question: "In which sport do you knock down pins?", correct: "Bowling", wrong: ["Cricket", "Baseball", "Golf"] },
        { question: "What sport uses a puck?", correct: "Ice Hockey", wrong: ["Lacrosse", "Field Hockey", "Basketball"] },
        { question: "Which sport has a quarterback?", correct: "American Football", wrong: ["Rugby", "Soccer", "Basketball"] },
        { question: "In golf, what is the term for one stroke under par?", correct: "Birdie", wrong: ["Bogey", "Eagle", "Par"] },
        { question: "Which country hosts the Tour de France?", correct: "France", wrong: ["Italy", "Spain", "Belgium"] },
        { question: "What is the national sport of Japan?", correct: "Sumo Wrestling", wrong: ["Judo", "Karate", "Kendo"] },
        { question: "How many rings are on the Olympic flag?", correct: "5", wrong: ["4", "6", "7"] },
        { question: "What sport is played at Wimbledon?", correct: "Tennis", wrong: ["Badminton", "Table Tennis", "Squash"] },
        { question: "In baseball, how many strikes make an out?", correct: "3", wrong: ["2", "4", "5"] },
        { question: "In basketball, how many points is a shot from beyond the arc?", correct: "3", wrong: ["2", "1", "4"] },
        { question: "What sport uses a shuttlecock?", correct: "Badminton", wrong: ["Tennis", "Squash", "Table Tennis"] },
        { question: "What sport does Lionel Messi play?", correct: "Soccer", wrong: ["Basketball", "Tennis", "Rugby"] },
        { question: "In which sport would you do a slam dunk?", correct: "Basketball", wrong: ["Volleyball", "Soccer", "Handball"] },
        { question: "What sport does Serena Williams play?", correct: "Tennis", wrong: ["Badminton", "Golf", "Volleyball"] },
    ],

    popculture: [
        { question: "Who is Mickey Mouse’s dog?", correct: "Pluto", wrong: ["Goofy", "Donald", "Snoopy"] },
        { question: "What movie features a boy wizard named Harry?", correct: "Harry Potter", wrong: ["Lord of the Rings", "Narnia", "Percy Jackson"] },
        { question: "Who is the superhero with a bat symbol?", correct: "Batman", wrong: ["Superman", "Spider-Man", "Iron Man"] },
        { question: "What is the name of the toy cowboy in Toy Story?", correct: "Woody", wrong: ["Buzz", "Jessie", "Slinky"] },
        { question: "Which singer is known as the King of Pop?", correct: "Michael Jackson", wrong: ["Elvis Presley", "Prince", "Freddie Mercury"] },
        { question: "What is the name of Shrek’s donkey friend?", correct: "Donkey", wrong: ["Puss", "Fiona", "Dragon"] },
        { question: "Who is the princess with seven dwarfs?", correct: "Snow White", wrong: ["Cinderella", "Aurora", "Rapunzel"] },
        { question: "What is the name of SpongeBob’s best friend?", correct: "Patrick", wrong: ["Squidward", "Mr. Krabs", "Gary"] },
        { question: "Which Marvel hero wields Mjolnir?", correct: "Thor", wrong: ["Iron Man", "Captain America", "Hulk"] },
        { question: "In Frozen, what is the snowman’s name?", correct: "Olaf", wrong: ["Kristoff", "Sven", "Hans"] },
        { question: "What is the name of the wizard school in Harry Potter?", correct: "Hogwarts", wrong: ["Durmstrang", "Beauxbatons", "Ilvermorny"] },
        { question: "Which Pixar film features a clownfish?", correct: "Finding Nemo", wrong: ["Shark Tale", "The Little Mermaid", "Moana"] },
        { question: "Who lives in a pineapple under the sea?", correct: "SpongeBob", wrong: ["Patrick", "Squidward", "Nemo"] },
        { question: "Which princess loses her glass slipper?", correct: "Cinderella", wrong: ["Belle", "Aurora", "Ariel"] },
        { question: "What video game character collects rings?", correct: "Sonic", wrong: ["Mario", "Link", "Pac-Man"] },
        { question: "Which movie features a talking snowman and ice powers?", correct: "Frozen", wrong: ["Tangled", "Moana", "Brave"] },
        { question: "Who is the green ogre in DreamWorks movies?", correct: "Shrek", wrong: ["Fiona", "Donkey", "Hulk"] },
        { question: "What is the name of Iron Man’s alter ego?", correct: "Tony Stark", wrong: ["Bruce Wayne", "Steve Rogers", "Clark Kent"] },
        { question: "Which yellow creatures love bananas?", correct: "Minions", wrong: ["Smurfs", "Care Bears", "Trolls"] },
        { question: "What’s the name of Mario’s brother?", correct: "Luigi", wrong: ["Yoshi", "Wario", "Toad"] },
    ],
    },

    medium: {
    history: [
        { question: "Who discovered America in 1492?", correct: "Christopher Columbus", wrong: ["Ferdinand Magellan", "Marco Polo", "Amerigo Vespucci"] },
        { question: "The Great Fire of London happened in which year?", correct: "1666", wrong: ["1766", "1566", "1866"] },
        { question: "Who was the first emperor of Rome?", correct: "Augustus", wrong: ["Julius Caesar", "Nero", "Tiberius"] },
        { question: "Which war ended with the Treaty of Versailles?", correct: "World War I", wrong: ["World War II", "Napoleonic Wars", "Cold War"] },
        { question: "The Cold War was mainly between the USA and which country?", correct: "Soviet Union", wrong: ["China", "Germany", "Japan"] },
        { question: "Who was the British Prime Minister during most of World War II?", correct: "Winston Churchill", wrong: ["Neville Chamberlain", "Clement Attlee", "Margaret Thatcher"] },
        { question: "Which US president abolished slavery?", correct: "Abraham Lincoln", wrong: ["George Washington", "Theodore Roosevelt", "John F. Kennedy"] },
        { question: "Who was the first female Prime Minister of the UK?", correct: "Margaret Thatcher", wrong: ["Theresa May", "Elizabeth I", "Angela Merkel"] },
        { question: "Which empire built Machu Picchu?", correct: "Inca", wrong: ["Maya", "Aztec", "Olmec"] },
        { question: "What year did World War II end?", correct: "1945", wrong: ["1939", "1918", "1955"] },
        { question: "Who was assassinated in Sarajevo in 1914, sparking WWI?", correct: "Archduke Franz Ferdinand", wrong: ["Kaiser Wilhelm", "Nicholas II", "Woodrow Wilson"] },
        { question: "Who was known as the Maid of Orléans?", correct: "Joan of Arc", wrong: ["Catherine the Great", "Cleopatra", "Marie Antoinette"] },
        { question: "Which empire was ruled by Genghis Khan?", correct: "Mongol Empire", wrong: ["Ottoman Empire", "Persian Empire", "Roman Empire"] },
        { question: "Who painted the ceiling of the Sistine Chapel?", correct: "Michelangelo", wrong: ["Leonardo da Vinci", "Raphael", "Donatello"] },
        { question: "The Berlin Wall fell in what year?", correct: "1989", wrong: ["1991", "1985", "1979"] },
        { question: "Who was the first man on the moon?", correct: "Neil Armstrong", wrong: ["Buzz Aldrin", "Yuri Gagarin", "John Glenn"] },
        { question: "The ancient city of Troy was located in which modern country?", correct: "Turkey", wrong: ["Greece", "Italy", "Egypt"] },
        { question: "Which king had six wives?", correct: "Henry VIII", wrong: ["Louis XIV", "Richard III", "Edward VI"] },
        { question: "Who was the first President of South Africa after apartheid?", correct: "Nelson Mandela", wrong: ["Desmond Tutu", "F.W. de Klerk", "Jacob Zuma"] },
        { question: "The American Civil War was fought in which century?", correct: "19th", wrong: ["18th", "20th", "17th"] },
    ],

    geography: [
        { question: "Which desert is the largest in the world?", correct: "Sahara", wrong: ["Gobi", "Kalahari", "Arabian"] },
        { question: "Mount Everest lies on the border of Nepal and which country?", correct: "China", wrong: ["India", "Bhutan", "Pakistan"] },
        { question: "What is the capital of Canada?", correct: "Ottawa", wrong: ["Toronto", "Vancouver", "Montreal"] },
        { question: "Which river flows through Egypt?", correct: "Nile", wrong: ["Amazon", "Danube", "Tigris"] },
        { question: "What is the smallest country in the world?", correct: "Vatican City", wrong: ["Monaco", "San Marino", "Liechtenstein"] },
        { question: "Which continent has the most countries?", correct: "Africa", wrong: ["Europe", "Asia", "South America"] },
        { question: "What is the capital of Australia?", correct: "Canberra", wrong: ["Sydney", "Melbourne", "Perth"] },
        { question: "Which country is known as the Land of the Rising Sun?", correct: "Japan", wrong: ["China", "Thailand", "South Korea"] },
        { question: "The Amazon rainforest is mainly in which country?", correct: "Brazil", wrong: ["Peru", "Colombia", "Venezuela"] },
        { question: "Which US state is the largest by area?", correct: "Alaska", wrong: ["Texas", "California", "Montana"] },
        { question: "Which city is known as the Eternal City?", correct: "Rome", wrong: ["Athens", "Paris", "Jerusalem"] },
        { question: "Which country has the longest coastline in the world?", correct: "Canada", wrong: ["Russia", "Australia", "USA"] },
        { question: "What is the capital of South Korea?", correct: "Seoul", wrong: ["Busan", "Tokyo", "Beijing"] },
        { question: "What is the driest place on Earth?", correct: "Atacama Desert", wrong: ["Sahara", "Antarctica", "Gobi"] },
        { question: "Which ocean is between Africa and Australia?", correct: "Indian Ocean", wrong: ["Pacific Ocean", "Atlantic Ocean", "Arctic Ocean"] },
        { question: "Which European country is famous for tulips and windmills?", correct: "Netherlands", wrong: ["Belgium", "Denmark", "Switzerland"] },
        { question: "What is the capital of Egypt?", correct: "Cairo", wrong: ["Alexandria", "Luxor", "Giza"] },
        { question: "Which mountain range separates Europe from Asia?", correct: "Ural Mountains", wrong: ["Alps", "Himalayas", "Carpathians"] },
        { question: "Which African country has the most people?", correct: "Nigeria", wrong: ["Egypt", "South Africa", "Kenya"] },
        { question: "What is the capital of Argentina?", correct: "Buenos Aires", wrong: ["Santiago", "Lima", "Rio de Janeiro"] },
    ],

    sports: [
        { question: "Which country won the FIFA World Cup in 2018?", correct: "France", wrong: ["Brazil", "Germany", "Argentina"] },
        { question: "In tennis, what is the term for 0 points?", correct: "Love", wrong: ["Zero", "Nil", "Blank"] },
        { question: "How many players are on a basketball team on the court?", correct: "5", wrong: ["6", "7", "4"] },
        { question: "Which sport is known as the 'king of sports'?", correct: "Soccer", wrong: ["Basketball", "Tennis", "Cricket"] },
        { question: "In which sport do players use a shuttlecock?", correct: "Badminton", wrong: ["Tennis", "Squash", "Table Tennis"] },
        { question: "How long is an Olympic swimming pool?", correct: "50 meters", wrong: ["25 meters", "100 meters", "75 meters"] },
        { question: "Which sport has positions like pitcher and catcher?", correct: "Baseball", wrong: ["Cricket", "Rugby", "Hockey"] },
        { question: "Which country hosts the Tour de France?", correct: "France", wrong: ["Italy", "Spain", "Belgium"] },
        { question: "How many holes are played in a standard round of golf?", correct: "18", wrong: ["9", "12", "24"] },
        { question: "Which martial art originated in Korea?", correct: "Taekwondo", wrong: ["Karate", "Kung Fu", "Judo"] },
        { question: "In which sport is the term 'checkmate' used?", correct: "Chess", wrong: ["Boxing", "Wrestling", "Fencing"] },
        { question: "Which country hosted the 2016 Summer Olympics?", correct: "Brazil", wrong: ["China", "UK", "Russia"] },
        { question: "What is the highest score in a single frame of bowling?", correct: "30", wrong: ["20", "10", "40"] },
        { question: "In which sport can you get a 'hole in one'?", correct: "Golf", wrong: ["Cricket", "Tennis", "Bowling"] },
        { question: "What does NBA stand for?", correct: "National Basketball Association", wrong: ["National Baseball Association", "National Boxing Alliance", "National Ball Association"] },
        { question: "Which sport uses a pommel horse?", correct: "Gymnastics", wrong: ["Wrestling", "Karate", "Diving"] },
        { question: "In soccer, what is it called when a player scores 3 goals in a game?", correct: "Hat-trick", wrong: ["Triple", "Three-pointer", "Goal blast"] },
        { question: "Who has won the most Olympic gold medals?", correct: "Michael Phelps", wrong: ["Usain Bolt", "Simone Biles", "Carl Lewis"] },
        { question: "Which sport uses a bat and wicket?", correct: "Cricket", wrong: ["Baseball", "Hockey", "Lacrosse"] },
        { question: "In which sport is the Vince Lombardi Trophy awarded?", correct: "American Football (NFL)", wrong: ["Baseball", "Basketball", "Ice Hockey"] },
    ],

    popculture: [
        { question: "Who played Jack in Titanic?", correct: "Leonardo DiCaprio", wrong: ["Brad Pitt", "Tom Cruise", "Matt Damon"] },
        { question: "Which superhero is also known as the Dark Knight?", correct: "Batman", wrong: ["Superman", "Iron Man", "Spider-Man"] },
        { question: "Which singer is known as the Queen of Pop?", correct: "Madonna", wrong: ["Beyoncé", "Lady Gaga", "Whitney Houston"] },
        { question: "Which movie series features a ring and Middle-earth?", correct: "The Lord of the Rings", wrong: ["Harry Potter", "Narnia", "Star Wars"] },
        { question: "Who created the Mickey Mouse character?", correct: "Walt Disney", wrong: ["Stan Lee", "Hanna-Barbera", "Jim Henson"] },
        { question: "Which pop star is known as the 'Material Girl'?", correct: "Madonna", wrong: ["Britney Spears", "Lady Gaga", "Cher"] },
        { question: "Which Netflix show features Eleven and the Upside Down?", correct: "Stranger Things", wrong: ["The Witcher", "Dark", "Breaking Bad"] },
        { question: "What’s the name of the wizarding school in Harry Potter?", correct: "Hogwarts", wrong: ["Durmstrang", "Beauxbatons", "Ilvermorny"] },
        { question: "Which actor plays Iron Man in the MCU?", correct: "Robert Downey Jr.", wrong: ["Chris Evans", "Mark Ruffalo", "Chris Hemsworth"] },
        { question: "Which TV show is set in Springfield?", correct: "The Simpsons", wrong: ["Family Guy", "South Park", "Futurama"] },
        { question: "Which singer is nicknamed 'The King of Pop'?", correct: "Michael Jackson", wrong: ["Elvis Presley", "Prince", "Freddie Mercury"] },
        { question: "What is the highest-grossing movie of all time (as of 2023)?", correct: "Avatar", wrong: ["Avengers: Endgame", "Titanic", "Star Wars"] },
        { question: "Who voices Donkey in Shrek?", correct: "Eddie Murphy", wrong: ["Chris Rock", "Kevin Hart", "Will Smith"] },
        { question: "Which video game series features Master Chief?", correct: "Halo", wrong: ["Call of Duty", "Gears of War", "Fortnite"] },
        { question: "Which singer released the album '1989'?", correct: "Taylor Swift", wrong: ["Adele", "Katy Perry", "Selena Gomez"] },
        { question: "What is the name of the coffee shop in Friends?", correct: "Central Perk", wrong: ["Monk's Café", "MacLaren's", "JJ's Diner"] },
        { question: "Which movie features the song 'Let It Go'?", correct: "Frozen", wrong: ["Moana", "Tangled", "Encanto"] },
        { question: "Who played the character of Jack Sparrow?", correct: "Johnny Depp", wrong: ["Orlando Bloom", "Hugh Jackman", "Russell Crowe"] },
        { question: "Which show had characters Ross, Rachel, and Monica?", correct: "Friends", wrong: ["How I Met Your Mother", "The Office", "Seinfeld"] },
        { question: "Which rapper is known as Slim Shady?", correct: "Eminem", wrong: ["Dr. Dre", "Jay-Z", "Kanye West"] },
    ]
    },

    hard: {
    history: [
        { question: "Who was the first emperor of Rome?", correct: "Augustus", wrong: ["Julius Caesar", "Nero", "Tiberius"] },
        { question: "The Cold War was mainly between the USA and which country?", correct: "Soviet Union", wrong: ["Germany", "China", "Japan"] },
        { question: "Who was the first woman to fly solo across the Atlantic?", correct: "Amelia Earhart", wrong: ["Harriet Quimby", "Bessie Coleman", "Valentina Tereshkova"] },
        { question: "Which treaty ended World War I?", correct: "Treaty of Versailles", wrong: ["Treaty of Paris", "Treaty of Ghent", "Treaty of Utrecht"] },
        { question: "Who was the British Prime Minister during World War II?", correct: "Winston Churchill", wrong: ["Neville Chamberlain", "Clement Attlee", "Margaret Thatcher"] },
        { question: "What empire was ruled by Genghis Khan?", correct: "Mongol Empire", wrong: ["Ottoman Empire", "Roman Empire", "Persian Empire"] },
        { question: "Which ancient city was destroyed by a volcanic eruption in 79 AD?", correct: "Pompeii", wrong: ["Athens", "Babylon", "Carthage"] },
        { question: "Who was assassinated on the Ides of March, 44 BC?", correct: "Julius Caesar", wrong: ["Brutus", "Augustus", "Cicero"] },
        { question: "What year did the Berlin Wall fall?", correct: "1989", wrong: ["1991", "1985", "1993"] },
        { question: "Who was the first President of South Africa after apartheid?", correct: "Nelson Mandela", wrong: ["Thabo Mbeki", "F.W. de Klerk", "Jacob Zuma"] },
        { question: "Which war was fought between the North and South regions of the United States?", correct: "American Civil War", wrong: ["Revolutionary War", "World War I", "Mexican War"] },
        { question: "What was the name of the ship on which the Pilgrims traveled to America in 1620?", correct: "Mayflower", wrong: ["Santa Maria", "Endeavour", "Discovery"] },
        { question: "Who was the longest-reigning British monarch before Queen Elizabeth II surpassed them?", correct: "Queen Victoria", wrong: ["George III", "Edward VII", "Elizabeth I"] },
        { question: "Which civilization built Machu Picchu?", correct: "Inca", wrong: ["Aztec", "Maya", "Olmec"] },
        { question: "The Battle of Hastings was fought in which year?", correct: "1066", wrong: ["1215", "1415", "1666"] },
        { question: "Who painted the Sistine Chapel ceiling?", correct: "Michelangelo", wrong: ["Leonardo da Vinci", "Raphael", "Donatello"] },
        { question: "What was the first country to grant women the right to vote?", correct: "New Zealand", wrong: ["USA", "UK", "Sweden"] },
        { question: "Which French queen was executed during the French Revolution?", correct: "Marie Antoinette", wrong: ["Catherine de Medici", "Joan of Arc", "Anne Boleyn"] },
        { question: "Who was the U.S. president during the Cuban Missile Crisis?", correct: "John F. Kennedy", wrong: ["Richard Nixon", "Dwight D. Eisenhower", "Lyndon B. Johnson"] },
        { question: "What dynasty built most of the Great Wall of China?", correct: "Ming Dynasty", wrong: ["Han Dynasty", "Tang Dynasty", "Qin Dynasty"] }
    ],

    geography: [
        { question: "What is the capital of Canada?", correct: "Ottawa", wrong: ["Toronto", "Vancouver", "Montreal"] },
        { question: "Which river runs through Baghdad?", correct: "Tigris", wrong: ["Euphrates", "Nile", "Jordan"] },
        { question: "What is the smallest country in the world?", correct: "Vatican City", wrong: ["Monaco", "San Marino", "Liechtenstein"] },
        { question: "Which country has the most islands?", correct: "Sweden", wrong: ["Indonesia", "Philippines", "Norway"] },
        { question: "What is the longest river in the world?", correct: "Nile", wrong: ["Amazon", "Yangtze", "Mississippi"] },
        { question: "Which continent has no permanent population?", correct: "Antarctica", wrong: ["Australia", "Europe", "Africa"] },
        { question: "What is the capital of Kazakhstan?", correct: "Astana (Nur-Sultan)", wrong: ["Almaty", "Tashkent", "Bishkek"] },
        { question: "Which mountain range separates Europe and Asia?", correct: "Ural Mountains", wrong: ["Alps", "Caucasus", "Himalayas"] },
        { question: "What is the deepest ocean trench?", correct: "Mariana Trench", wrong: ["Tonga Trench", "Kuril Trench", "Puerto Rico Trench"] },
        { question: "Which country is known as the Land of a Thousand Lakes?", correct: "Finland", wrong: ["Norway", "Sweden", "Canada"] },
        { question: "What is the largest desert in the world?", correct: "Antarctic Desert", wrong: ["Sahara", "Arabian", "Gobi"] },
        { question: "Which two countries share the longest border in the world?", correct: "USA and Canada", wrong: ["Russia and China", "Brazil and Argentina", "India and Bangladesh"] },
        { question: "Which African country was formerly called Abyssinia?", correct: "Ethiopia", wrong: ["Somalia", "Sudan", "Eritrea"] },
        { question: "What is the capital of Mongolia?", correct: "Ulaanbaatar", wrong: ["Astana", "Tashkent", "Baku"] },
        { question: "Which sea separates Europe and Africa?", correct: "Mediterranean Sea", wrong: ["Black Sea", "Red Sea", "Caspian Sea"] },
        { question: "Which country has the city of Timbuktu?", correct: "Mali", wrong: ["Niger", "Chad", "Burkina Faso"] },
        { question: "What is the only country that is also a continent?", correct: "Australia", wrong: ["Antarctica", "Greenland", "South America"] },
        { question: "Which city is known as the 'Pearl of the Orient'?", correct: "Manila", wrong: ["Hong Kong", "Singapore", "Bangkok"] },
        { question: "Which river flows through Paris?", correct: "Seine", wrong: ["Thames", "Rhine", "Danube"] },
        { question: "What is the tallest mountain in Africa?", correct: "Mount Kilimanjaro", wrong: ["Mount Kenya", "Ruwenzori", "Drakensberg"] }
    ],

    sports: [
        { question: "Who has won the most Olympic gold medals?", correct: "Michael Phelps", wrong: ["Usain Bolt", "Simone Biles", "Carl Lewis"] },
        { question: "In which sport is the Ryder Cup contested?", correct: "Golf", wrong: ["Tennis", "Cricket", "Rugby"] },
        { question: "Which country hosted the first modern Olympics?", correct: "Greece", wrong: ["France", "USA", "Italy"] },
        { question: "Which boxer was known as 'The Greatest'?", correct: "Muhammad Ali", wrong: ["Mike Tyson", "Floyd Mayweather", "Joe Frazier"] },
        { question: "In which year did Roger Federer win his first Wimbledon?", correct: "2003", wrong: ["2001", "2004", "2005"] },
        { question: "Which country won the first FIFA World Cup in 1930?", correct: "Uruguay", wrong: ["Brazil", "Germany", "Argentina"] },
        { question: "How many players are on a rugby union team?", correct: "15", wrong: ["11", "13", "9"] },
        { question: "Which NBA player is known as 'The Black Mamba'?", correct: "Kobe Bryant", wrong: ["Michael Jordan", "LeBron James", "Shaquille O'Neal"] },
        { question: "Who won the most Formula 1 World Championships?", correct: "Michael Schumacher and Lewis Hamilton", wrong: ["Ayrton Senna", "Sebastian Vettel", "Alain Prost"] },
        { question: "Which female tennis player has won the most Grand Slams?", correct: "Serena Williams", wrong: ["Steffi Graf", "Martina Navratilova", "Chris Evert"] },
        { question: "Which country has won the most Cricket World Cups?", correct: "Australia", wrong: ["India", "England", "West Indies"] },
        { question: "In baseball, how many strikes result in an out?", correct: "3", wrong: ["2", "4", "5"] },
        { question: "Which African nation won the AFCON in 2019?", correct: "Algeria", wrong: ["Egypt", "Nigeria", "Cameroon"] },
        { question: "Which NFL team has won the most Super Bowls?", correct: "New England Patriots & Pittsburgh Steelers", wrong: ["Dallas Cowboys", "San Francisco 49ers", "Green Bay Packers"] },
        { question: "Which athlete lit the Olympic flame in Barcelona 1992?", correct: "Antonio Rebollo", wrong: ["Carl Lewis", "Sergey Bubka", "Nadia Comăneci"] },
        { question: "What sport uses the terms 'stale fish' and 'ollie'?", correct: "Skateboarding", wrong: ["Snowboarding", "Surfing", "BMX"] },
        { question: "Who was the first gymnast to score a perfect 10 in the Olympics?", correct: "Nadia Comăneci", wrong: ["Simone Biles", "Olga Korbut", "Shannon Miller"] },
        { question: "Which country won the Rugby World Cup in 2019?", correct: "South Africa", wrong: ["England", "New Zealand", "Australia"] },
        { question: "Which country invented table tennis?", correct: "England", wrong: ["China", "Japan", "Germany"] },
        { question: "Which boxer was nicknamed 'Iron Mike'?", correct: "Mike Tyson", wrong: ["George Foreman", "Joe Louis", "Evander Holyfield"] }
    ],

    popculture: [
        { question: "Which band was John Lennon a member of?", correct: "The Beatles", wrong: ["The Rolling Stones", "Pink Floyd", "Queen"] },
        { question: "What year did the first iPhone release?", correct: "2007", wrong: ["2005", "2008", "2010"] },
        { question: "Who created the TV series 'Game of Thrones'?", correct: "George R. R. Martin", wrong: ["J.R.R. Tolkien", "J.K. Rowling", "Stephen King"] },
        { question: "Which actor voiced Darth Vader?", correct: "James Earl Jones", wrong: ["Samuel L. Jackson", "Morgan Freeman", "Forest Whitaker"] },
        { question: "Who directed 'Inception'?", correct: "Christopher Nolan", wrong: ["Steven Spielberg", "James Cameron", "Ridley Scott"] },
        { question: "Which singer is known as 'Queen of Pop'?", correct: "Madonna", wrong: ["Beyoncé", "Lady Gaga", "Whitney Houston"] },
        { question: "What is the highest-grossing movie of all time (without inflation)?", correct: "Avatar", wrong: ["Avengers: Endgame", "Titanic", "Star Wars"] },
        { question: "Which TV show featured Ross, Rachel, and Chandler?", correct: "Friends", wrong: ["How I Met Your Mother", "The Office", "Seinfeld"] },
        { question: "Which artist painted 'Starry Night'?", correct: "Vincent van Gogh", wrong: ["Claude Monet", "Pablo Picasso", "Salvador Dalí"] },
        { question: "Who played the Joker in 'The Dark Knight'?", correct: "Heath Ledger", wrong: ["Jared Leto", "Joaquin Phoenix", "Jack Nicholson"] },
        { question: "Which rapper is also known as Marshall Mathers?", correct: "Eminem", wrong: ["Dr. Dre", "Jay-Z", "50 Cent"] },
        { question: "Who sang 'Rolling in the Deep'?", correct: "Adele", wrong: ["Rihanna", "Taylor Swift", "Beyoncé"] },
        { question: "Which animated movie features Elsa and Anna?", correct: "Frozen", wrong: ["Moana", "Brave", "Tangled"] },
        { question: "Who wrote 'The Lord of the Rings'?", correct: "J.R.R. Tolkien", wrong: ["C.S. Lewis", "George R.R. Martin", "Philip Pullman"] },
        { question: "What’s the name of the coffee shop in Friends?", correct: "Central Perk", wrong: ["Cafe Nervosa", "Java Joe's", "Daily Grind"] },
        { question: "Which movie won Best Picture at the Oscars 2020?", correct: "Parasite", wrong: ["1917", "Joker", "Once Upon a Time in Hollywood"] },
        { question: "What video game franchise features Master Chief?", correct: "Halo", wrong: ["Call of Duty", "Gears of War", "Destiny"] },
        { question: "Who played Wolverine in the X-Men movies?", correct: "Hugh Jackman", wrong: ["Chris Hemsworth", "Ryan Reynolds", "Henry Cavill"] },
        { question: "Which TV series is set in Westeros?", correct: "Game of Thrones", wrong: ["The Witcher", "The Last Kingdom", "Shadow and Bone"] },
        { question: "Which K-pop group released 'Dynamite'?", correct: "BTS", wrong: ["Blackpink", "EXO", "Twice"] }
    ]
    }

};

  const difficultyWords = gkSets[difficulty][questionType];

  // filter unused questions
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

  // shuffle answer options
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
  new SnakeGeneralKnowledgeGame()
})

