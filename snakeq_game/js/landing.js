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
    playBtn.addEventListener("click", () => this.showGameModeModal())

    // Modal events
    const modal = document.getElementById("gameModeModal")
    const cancelBtn = document.getElementById("cancelBtn")
    const startBtn = document.getElementById("startGameBtn")

    cancelBtn.addEventListener("click", () => this.hideGameModeModal())
    startBtn.addEventListener("click", () => this.startGame())

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
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        this.hideGameModeModal()
      }
    })
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
    document.getElementById("playBtn").disabled = false
  }

  showGameModeModal() {
    if (!this.selectedCategory) return

    document.getElementById("gameModeModal").classList.remove("hidden")
  }

  hideGameModeModal() {
    document.getElementById("gameModeModal").classList.add("hidden")
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
    startBtn.disabled = !(this.selectedMode && this.selectedDifficulty)
  }

  resetModalSelections() {
    this.selectedMode = null
    this.selectedDifficulty = null

    document.querySelectorAll(".mode-btn, .difficulty-btn").forEach((btn) => {
      btn.classList.remove("selected")
    })
  
    document.getElementById("startGameBtn").disabled = true
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
