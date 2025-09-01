function $$(id) {
  return document.getElementById(id);
}

class LandingPage {
  constructor() {
    this.selectedCategory = null
    this.selectedMode = null
    this.selectedDifficulty = null
    this.backgroundMusic = new Audio("assets/sounds/bg-music.mp3")
    this.backgroundMusic.loop = true
    this.musicEnabled = localStorage.getItem("musicEnabled") !==  "false"
    this.soundEnabled = localStorage.getItem("soundEnabled") !== "false" // default true
    this.clickSound = new Audio("assets/sounds/click.mp3")
    
    // Skin system
    this.points = parseInt(localStorage.getItem("totalPoints")) || 0
    this.ownedSkins = JSON.parse(localStorage.getItem("ownedSkins")) || ["green"]
    this.selectedSkin = localStorage.getItem("selectedSkin") || "green"
    
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
      musicBtn.textContent = this.musicEnabled ? "🎵" : "🎵"
      musicBtn.classList.toggle("active", this.musicEnabled)
      this.clickSound.volume = 0.5


      if (this.musicEnabled) {
        this.backgroundMusic.volume = 0.2;
        this.backgroundMusic.play().catch((e) => {})
      }
    }

    document.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
        if (this.soundEnabled && this.clickSound) {
        this.clickSound.currentTime = 0 // restart if spam clicked
        this.clickSound.play()
        }
    })
    })

  }

  playClickSound() {
    if (this.soundEnabled && this.clickSound) {
      const sfx = this.clickSound.cloneNode(true) // new audio element
      sfx.volume = 0.5
      sfx.play().catch(e => {})
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
    const aboutBtn = $$("about-btn")
    const closeAboutBtn = $$("close-about")

    if (aboutBtn) {
      aboutBtn.addEventListener("click", () => {
        this.playClickSound()
        this.showAbout()
      })
    }

    if (closeAboutBtn) {
      closeAboutBtn.addEventListener("click", () => {
        this.playClickSound()
        this.closeAbout()
      })
    }

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
    const copyrightBtn = $$("copyright-btn"); 

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

    if (aboutBtn) {
      aboutBtn.addEventListener("click", () => {
        aboutModal.classList.remove("hidden");
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

    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        this.playClickSound()
        this.hideGameModeModal()
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

    // Skin shop event bindings
    const skinBtn = $$("skin-btn")
    const skinShopModal = $$("skin-shop-modal")
    const closeSkinShopBtn = $$("close-skin-shop")

    if (skinBtn) {
      skinBtn.addEventListener("click", () => {
        this.playClickSound()
        this.showSkinShop()
      })
    }

    if (closeSkinShopBtn) {
      closeSkinShopBtn.addEventListener("click", () => {
        this.playClickSound()
        this.hideSkinShop()
      })
    }

    if (skinShopModal) {
      skinShopModal.addEventListener("click", (e) => {
        if (e.target === skinShopModal) {
          this.hideSkinShop()
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

  showAbout() {
    const aboutModal = $$("about-modal")
    if (aboutModal) {
      aboutModal.classList.remove("hidden")
    }
  }

  hideInstructions() {
    const instructionsModal = $$("instructions-modal")
    if (instructionsModal) {
      instructionsModal.classList.add("hidden")
    }
  }

  closeAbout() {
    const aboutModal = $$("about-modal")
    if (aboutModal) {
      aboutModal.classList.add("hidden")
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
      musicBtn.textContent = this.musicEnabled ? "🎵" : "🎵"
      musicBtn.classList.toggle("active", this.musicEnabled)

      if (this.musicEnabled) {
        this.backgroundMusic.play().catch((e) => {})
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
      selectedSkin: this.selectedSkin
    }

    localStorage.setItem("gameSettings", JSON.stringify(gameSettings))

    if (this.musicEnabled) {
      this.backgroundMusic.pause()
    }

    if (this.selectedCategory === "math") {
      window.location.href = "templates/math-game.html"
    } else if (this.selectedCategory === "english") {
      window.location.href = "templates/english-game.html"
    }
    else if (this.selectedCategory === "science") {
      window.location.href = "templates/science-game.html"
    }
    else if (this.selectedCategory === "generalknow") {
      window.location.href = "templates/generalknow-game.html"
    }
  }

  updateSkinShopDisplay() {
    // Update skin items based on ownership
    const skinItems = document.querySelectorAll(".skin-item")
    skinItems.forEach(item => {
      const skinName = item.dataset.skin
      const skinStatus = item.querySelector(".skin-status")
      
      if (this.ownedSkins.includes(skinName)) {
        // Skin is owned
        const isSelected = skinName === this.selectedSkin
        skinStatus.innerHTML = `
          <span class="skin-owned">✓ Owned</span>
          <button class="select-skin-btn ${isSelected ? 'selected' : ''}" data-skin="${skinName}">
            ${isSelected ? 'Selected' : 'Select'}
          </button>
        `
        
        // Add event listener to select button
        const selectBtn = skinStatus.querySelector(".select-skin-btn")
        if (selectBtn && !isSelected) {
          selectBtn.addEventListener("click", (e) => {
            e.stopPropagation()
            this.selectSkin(skinName)
          })
        }
      } else {
        // Skin is not owned, show price and buy button
        const price = this.getSkinPrice(skinName)
        const canAfford = this.points >= price
        
        skinStatus.innerHTML = `
          <span class="skin-price">${price} points</span>
          <button class="buy-skin-btn" data-skin="${skinName}" data-price="${price}" ${!canAfford ? 'disabled' : ''}>
            ${canAfford ? 'Buy' : 'Not Enough Points'}
          </button>
        `
        
        // Add event listener to buy button
        const buyBtn = skinStatus.querySelector(".buy-skin-btn")
        if (buyBtn) {
          buyBtn.addEventListener("click", (e) => {
            e.stopPropagation()
            this.buySkin(skinName, price)
          })
        }
      }
    })
  }

  getSkinPrice(skinName) {
    const prices = {
      "green": 0,
      "pink": 150,
      "blue": 200,
      "volt": 999
    }
    return prices[skinName] || 0
  }

  selectSkin(skinName) {
    if (this.ownedSkins.includes(skinName)) {
      this.selectedSkin = skinName
      localStorage.setItem("selectedSkin", skinName)
      
      // Update display
      this.updateSkinShopDisplay()
      
      // Play sound
      this.playClickSound()
      
      // Show notification
      this.showNotification(`🎨 ${skinName.charAt(0).toUpperCase() + skinName.slice(1)} skin selected!`)
    }
  }

  showSkinShop() {
    const skinShopModal = $$("skin-shop-modal")
    if (skinShopModal) {
      skinShopModal.classList.remove("hidden")
      this.updateSkinShopDisplay()
      
      // Update points display
      const pointsDisplay = $$("current-points")
      if (pointsDisplay) {
        pointsDisplay.textContent = this.points
      }
    }
  }

  hideSkinShop() {
    const skinShopModal = $$("skin-shop-modal")
    if (skinShopModal) {
      skinShopModal.classList.add("hidden")
    }
  }

  buySkin(skinName, price) {
    if (this.points >= price && !this.ownedSkins.includes(skinName)) {
      // Deduct points
      this.points -= price
      localStorage.setItem("totalPoints", this.points.toString())
      
      // Add skin to owned skins
      this.ownedSkins.push(skinName)
      localStorage.setItem("ownedSkins", JSON.stringify(this.ownedSkins))
      
      // Update display
      this.updateSkinShopDisplay()
      
      // Update points display
      const pointsDisplay = $$("current-points")
      if (pointsDisplay) {
        pointsDisplay.textContent = this.points
      }
      
      // Play sound
      this.playClickSound()
      
      // Show notification
      this.showNotification(`🎉 ${skinName.charAt(0).toUpperCase() + skinName.slice(1)} skin purchased!`)
    }
  }

  showNotification(message) {
    // Create notification element if it doesn't exist
    let notification = $$("notification")
    if (!notification) {
      notification = document.createElement("div")
      notification.id = "notification"
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 0px;
        background: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        font-weight: bold;
        transform: translateX(100%);
        transition: transform 0.3s ease;
      `
      document.body.appendChild(notification)
    }
    
    // Set message and show
    notification.textContent = message
    notification.style.transform = "translateX(0)"
    
    // Hide after 3 seconds
    setTimeout(() => {
      notification.style.transform = "translateX(100%)"
    }, 3000)
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new LandingPage()
})