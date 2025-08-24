class LandingPage {
  constructor() {
    this.selectedCategory = null
    this.selectedMode = null
    this.selectedDifficulty = null

    this.init()
  }

  init() {
    this.bindEvents()
  }

  bindEvents() {
    // Category selection
    const categoryBtns = document.querySelectorAll(".category-btn")
    categoryBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => this.selectCategory(e))
    })

    // Play button
    const playBtn = document.getElementById("playBtn")
    if (playBtn) {
      playBtn.addEventListener("click", () => this.showGameModeModal())
    }

    const helpBtn = document.getElementById("help-btn")
    const soundBtn = document.getElementById("sound-btn")
    const musicBtn = document.getElementById("music-btn")
    const instructionsModal = document.getElementById("instructions-modal")
    const closeInstructionsBtn = document.getElementById("close-instructions")

    if (helpBtn) {
      helpBtn.addEventListener("click", (e) => {
        e.preventDefault()
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
      closeInstructionsBtn.addEventListener("click", () => this.hideInstructions())
    }

    // Close instructions modal when clicking outside
    if (instructionsModal) {
      instructionsModal.addEventListener("click", (e) => {
        if (e.target === instructionsModal) {
          this.hideInstructions()
        }
      })
    }

    // Modal events
    const modal = document.getElementById("gameModeModal")
    const cancelBtn = document.getElementById("cancelBtn")
    const startBtn = document.getElementById("startGameBtn")

    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => this.hideGameModeModal())
    }

    if (startBtn) {
      startBtn.addEventListener("click", () => this.startGame())
    }

    // Mode selection
    const modeBtns = document.querySelectorAll(".mode-btn")
    modeBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => this.selectMode(e))
    })

    // Difficulty selection
    const difficultyBtns = document.querySelectorAll(".difficulty-btn")
    difficultyBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => this.selectDifficulty(e))
    })

    // Close modal on outside click
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
    // Simple sound toggle for landing page
    const soundBtn = document.getElementById("sound-btn")
    if (soundBtn) {
      const isEnabled = soundBtn.textContent === "🔊"
      soundBtn.textContent = isEnabled ? "🔇" : "🔊"
      soundBtn.classList.toggle("active", !isEnabled)
    }
  }

  toggleMusic() {
    // Simple music toggle for landing page
    const musicBtn = document.getElementById("music-btn")
    if (musicBtn) {
      const isEnabled = musicBtn.textContent === "🎵"
      musicBtn.textContent = isEnabled ? "🔇" : "🎵"
      musicBtn.classList.toggle("active", !isEnabled)
    }
  }

  selectCategory(e) {
    // Remove previous selection
    document.querySelectorAll(".category-btn").forEach((btn) => {
      btn.classList.remove("selected")
    })

    // Add selection to clicked button
    e.target.classList.add("selected")
    this.selectedCategory = e.target.dataset.category

    // Enable play button
    const playBtn = document.getElementById("playBtn")
    if (playBtn) {
      playBtn.disabled = false
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
    // Remove previous selection
    document.querySelectorAll(".mode-btn").forEach((btn) => {
      btn.classList.remove("selected")
    })

    // Add selection to clicked button
    e.target.classList.add("selected")
    this.selectedMode = e.target.dataset.mode

    this.updateStartButton()
  }

  selectDifficulty(e) {
    // Remove previous selection
    document.querySelectorAll(".difficulty-btn").forEach((btn) => {
      btn.classList.remove("selected")
    })

    // Add selection to clicked button
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
    // Store game settings in localStorage
    const gameSettings = {
      category: this.selectedCategory,
      mode: this.selectedMode,
      difficulty: this.selectedDifficulty,
    }

    localStorage.setItem("gameSettings", JSON.stringify(gameSettings))

    // Navigate to appropriate game page
    if (this.selectedCategory === "math") {
      window.location.href = "games/math-game.html"
    } else if (this.selectedCategory === "english") {
      window.location.href = "games/english-game.html"
    }
  }
}

// Initialize landing page when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new LandingPage()
})
