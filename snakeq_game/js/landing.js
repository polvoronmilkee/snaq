class LandingPage {
  constructor() {
    this.selectedCategory = null
    this.selectedMode = null
    this.selectedDifficulty = null
    this.backgroundMusic = new Audio("sounds/music.mp3")
    this.backgroundMusic.loop = true
    this.musicEnabled = localStorage.getItem("musicEnabled") === "true"
    this.soundEnabled = localStorage.getItem("soundEnabled") !== "false" // default true
    this.clickSound = new Audio("sounds/click.mp3")

    this.init()
  }

  init() {
    this.bindEvents()
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
        this.backgroundMusic.play().catch((e) => console.log("Music play failed:", e))
      }
    }
  }

  playClickSound() {
    if (this.soundEnabled) {
      this.clickSound.currentTime = 0
      this.clickSound.play().catch((e) => console.log("Click sound failed:", e))
    }
  }

  bindEvents() {
    const categoryBtns = document.querySelectorAll(".category-btn")
    categoryBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.playClickSound()
        this.selectCategory(e)
      })
    })

    const playBtn = document.getElementById("playBtn")
    if (playBtn) {
      playBtn.addEventListener("click", () => {
        this.playClickSound()
        this.showGameModeModal()
      })
    }

    const helpBtn = document.getElementById("help-btn")
    const soundBtn = document.getElementById("sound-btn")
    const musicBtn = document.getElementById("music-btn")
    const instructionsModal = document.getElementById("instructions-modal")
    const closeInstructionsBtn = document.getElementById("close-instructions")

    if (helpBtn) {
      helpBtn.addEventListener("click", (e) => {
        e.preventDefault()
        this.playClickSound()
        this.showInstructions()
      })
    }

    if (soundBtn) {
      soundBtn.addEventListener("click", (e) => {
        e.preventDefault()
        this.toggleSound()
      })
    }

    if (musicBtn) {
      musicBtn.addEventListener("click", (e) => {
        e.preventDefault()
        this.toggleMusic()
      })
    }

    if (closeInstructionsBtn) {
      closeInstructionsBtn.addEventListener("click", () => {
        this.playClickSound()
        this.hideInstructions()
      })
    }

    if (instructionsModal) {
      instructionsModal.addEventListener("click", (e) => {
        if (e.target === instructionsModal) {
          this.hideInstructions()
        }
      })
    }

    const modal = document.getElementById("gameModeModal")
    const cancelBtn = document.getElementById("cancelBtn")
    const startBtn = document.getElementById("startGameBtn")

    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        this.playClickSound()
        this.hideGameModeModal()
      })
    }

    if (startBtn) {
      startBtn.addEventListener("click", () => {
        this.playClickSound()
        this.startGame()
      })
    }

    const modeBtns = document.querySelectorAll(".mode-btn")
    modeBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.playClickSound()
        this.selectMode(e)
      })
    })

    const difficultyBtns = document.querySelectorAll(".difficulty-btn")
    difficultyBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.playClickSound()
        this.selectDifficulty(e)
      })
    })

    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          this.hideGameModeModal()
        }
      })
    }
  }

  showInstructions() {
    const instructionsModal = document.getElementById("instructions-modal")
    if (instructionsModal) {
      instructionsModal.classList.remove("hidden")
    }
  }

  hideInstructions() {
    const instructionsModal = document.getElementById("instructions-modal")
    if (instructionsModal) {
      instructionsModal.classList.add("hidden")
    }
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled
    localStorage.setItem("soundEnabled", this.soundEnabled.toString())

    const soundBtn = document.getElementById("sound-btn")
    if (soundBtn) {
      soundBtn.textContent = this.soundEnabled ? "🔊" : "🔇"
      soundBtn.classList.toggle("active", this.soundEnabled)
    }
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled
    localStorage.setItem("musicEnabled", this.musicEnabled.toString())

    const musicBtn = document.getElementById("music-btn")

    if (musicBtn) {
      musicBtn.textContent = this.musicEnabled ? "🎵" : "🔇"
      musicBtn.classList.toggle("active", this.musicEnabled)

      if (this.musicEnabled) {
        this.backgroundMusic.play().catch((e) => console.log("Music play failed:", e))
      } else {
        this.backgroundMusic.pause()
      }
    }
  }

  selectCategory(e) {
    // Find the actual button element (handles clicks on child elements)
    const btn = e.target.closest('.category-btn');
    if (!btn) return;
    
    document.querySelectorAll(".category-btn").forEach((btn) => {
      btn.classList.remove("selected");
    });

    btn.classList.add("selected");
    this.selectedCategory = btn.dataset.category;

    const playBtn = document.getElementById("playBtn");
    if (playBtn) {
      playBtn.disabled = false;
    }
  }

  showGameModeModal() {
    if (!this.selectedCategory) return

    const modal = document.getElementById("gameModeModal")
    if (modal) {
      modal.classList.remove("hidden")
    }
  }

  hideGameModeModal() {
    const modal = document.getElementById("gameModeModal")
    if (modal) {
      modal.classList.add("hidden")
    }
    this.resetModalSelections()
  }

  selectMode(e) {
    document.querySelectorAll(".mode-btn").forEach((btn) => {
      btn.classList.remove("selected")
    })

    e.target.classList.add("selected")
    this.selectedMode = e.target.dataset.mode

    this.updateStartButton()
  }

  selectDifficulty(e) {
    document.querySelectorAll(".difficulty-btn").forEach((btn) => {
      btn.classList.remove("selected")
    })

    e.target.classList.add("selected")
    this.selectedDifficulty = e.target.dataset.difficulty

    this.updateStartButton()
  }

  updateStartButton() {
    const startBtn = document.getElementById("startGameBtn")
    if (startBtn) {
      startBtn.disabled = !(this.selectedMode && this.selectedDifficulty)
    }
  }

  resetModalSelections() {
    this.selectedMode = null
    this.selectedDifficulty = null

    document.querySelectorAll(".mode-btn, .difficulty-btn").forEach((btn) => {
      btn.classList.remove("selected")
    })

    const startBtn = document.getElementById("startGameBtn")
    if (startBtn) {
      startBtn.disabled = true
    }
  }

  startGame() {
    const gameSettings = {
      category: this.selectedCategory,
      mode: this.selectedMode,
      difficulty: this.selectedDifficulty,
    }

    localStorage.setItem("gameSettings", JSON.stringify(gameSettings))

    if (this.musicEnabled) {
      this.backgroundMusic.pause()
    }

    if (this.selectedCategory === "math") {
      window.location.href = "games/math-game.html"
    } else if (this.selectedCategory === "english") {
      window.location.href = "games/english-game.html"
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new LandingPage()
})
