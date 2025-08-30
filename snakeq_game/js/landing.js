function $$(id) {
  return document.getElementById(id);
}

class LandingPage {
  constructor() {
    this.selectedCategory = null
    this.selectedMode = null
    this.selectedDifficulty = null
    this.backgroundMusic = new Audio("sounds/music.mp3")
    this.backgroundMusic.loop = true
    this.musicEnabled = localStorage.getItem("musicEnabled") !==  "false"
    this.soundEnabled = localStorage.getItem("soundEnabled") !== "false" // default true
    this.clickSound = new Audio("sounds/click.mp3")
    this.init()
  }

  

  init() {
    this.bindEvents()
    this.initializeAudioStates()
  }

  initializeAudioStates() {
    const soundBtn = $$("sound-btn")
    const musicBtn = $$("music-btn")

    if (soundBtn) {
      soundBtn.textContent = this.soundEnabled ? "🔊" : "🔇"
      soundBtn.classList.toggle("active", this.soundEnabled)
    }

    if (musicBtn) {
      musicBtn.textContent = this.musicEnabled ? "🎵" : "🔇"
      musicBtn.classList.toggle("active", this.musicEnabled)
      this.sounds.click.volume = 0.5


      if (this.musicEnabled) {
        this.backgroundMusic.volume = 0.2;
        this.backgroundMusic.play().catch((e) => console.log("Music play failed:", e))
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

  playClickSound() {
    if (this.soundEnabled && this.clickSound) {
      const sfx = this.clickSound.cloneNode(true) // new audio element
      sfx.volume = 0.5
      sfx.play().catch(e => console.log("Click sound failed:", e))

      // optional cleanup once it’s done playing
      sfx.addEventListener("ended", () => sfx.remove())
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

    const playBtn = $$("playBtn")
    if (playBtn) {
      playBtn.addEventListener("click", () => {
        this.playClickSound()
        this.showGameModeModal()
      })
    }

    const helpBtn = $$("help-btn")
    const soundBtn = $$("sound-btn")
    const musicBtn = $$("music-btn")
    const instructionsModal = $$("instructions-modal")
    const closeInstructionsBtn = $$("close-instructions")

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

    const copyrightModal = $$("copyright-modal");
    const closeCopyright = $$("close-copyright");
    const copyrightBtn = $$("copyright-btn"); // You can place a button in header/footer

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


    const modal = $$("gameModeModal")
    const cancelBtn = $$("cancelBtn")
    const startBtn = $$("startGameBtn")

    if (startBtn) {
      startBtn.addEventListener("click", () => {
        this.playClickSound()
        this.startGame()
      })
    }

    if (startGameBtn) {
      startGameBtn.addEventListener("click", () => {
        this.playClickSound()
        setTimeout(() => this.startGame(), 500)

      })
    }

    if (copyrightBtn) {
      copyrightBtn.addEventListener("click", () => {
        this.playClickSound()
        this.showCopyright()
      })
    }

    if (closeCopyright) {
      closeCopyright.addEventListener("click", () => {
        this.playClickSound()
        copyrightModal.classList.add("hidden")
      })
    }

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
    const instructionsModal = $$("instructions-modal")
    if (instructionsModal) {
      instructionsModal.classList.remove("hidden")
    }
  }

  hideInstructions() {
    const instructionsModal = $$("instructions-modal")
    if (instructionsModal) {
      instructionsModal.classList.add("hidden")
    }
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled
    localStorage.setItem("soundEnabled", this.soundEnabled.toString())

    const soundBtn = $$("sound-btn")
    if (soundBtn) {
      soundBtn.textContent = this.soundEnabled ? "🔊" : "🔇"
      soundBtn.classList.toggle("active", this.soundEnabled)
    }
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled
    localStorage.setItem("musicEnabled", this.musicEnabled.toString())

    const musicBtn = $$("music-btn")

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

    const modal = $$("gameModeModal")
    if (modal) {
      modal.classList.remove("hidden")
    }
  }

  hideGameModeModal() {
    const modal = $$("gameModeModal")
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
    const startBtn = $$("startGameBtn")
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

    const startBtn = $$("startGameBtn")
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
    else if (this.selectedCategory === "science") {
      window.location.href = "games/science-game.html"
    }
    else if (this.selectedCategory === "generalknow") {
      window.location.href = "games/generalknow-game.html"
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new LandingPage()
})