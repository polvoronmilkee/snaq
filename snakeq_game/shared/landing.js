function $$(id) {
  return document.getElementById(id);
}

class LandingPage {
  constructor() {
    this.selectedCategory = null;
    this.selectedMode = null;
    this.selectedDifficulty = null;
    this.backgroundMusic = new Audio("assets/sounds/bg-music.mp3");
    this.backgroundMusic.loop = true;
    this.musicEnabled = localStorage.getItem("musicEnabled") !== "false";
    this.soundEnabled = localStorage.getItem("soundEnabled") !== "false"; // default true
    this.clickSound = new Audio("assets/sounds/click.mp3");

    // Skin system
    this.points = parseInt(localStorage.getItem("totalPoints")) || 0;
    this.coins = Math.floor(this.points / 10); // Convert points to coins (10 points = 1 coin)
    this.totalPointsDisplay = $$("current-points");
    this.ownedSkins = JSON.parse(localStorage.getItem("ownedSkins")) || ["green"];
    this.selectedSkin = localStorage.getItem("selectedSkin") || "green";
    
    // Shop system
    this.ownedAccessories = JSON.parse(localStorage.getItem("ownedAccessories")) || [];
    this.selectedAccessory = localStorage.getItem("selectedAccessory") || null;
    this.ownedEffects = JSON.parse(localStorage.getItem("ownedEffects")) || [];
    this.selectedEffect = localStorage.getItem("selectedEffect") || null;
    
    this.init();
  }

  init() {
    this.bindEvents();
    this.initializeAudioStates();
  }

  initializeAudioStates() {
    const soundBtn = $$("sound-btn");
    const musicBtn = $$("music-btn");

    if (soundBtn) {
      soundBtn.textContent = this.soundEnabled ? "🔊" : "🔇";
      soundBtn.classList.toggle("active", this.soundEnabled);
    }

    if (musicBtn) {
      musicBtn.textContent = this.musicEnabled ? "🎵" : "🎵";
      musicBtn.classList.toggle("active", this.musicEnabled);
      this.clickSound.volume = 0.5;

      if (this.musicEnabled) {
        this.backgroundMusic.volume = 1;
        this.backgroundMusic.play().catch(() => {});
      }
    }

    document.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (this.soundEnabled && this.clickSound) {
          this.clickSound.currentTime = 0; // restart if spam clicked
          this.clickSound.play();
        }
      });
    });
  }

  selectInventoryTab(e) {
    const tab = e.target.closest('.inventory-tab');
    if (!tab) return;
    
    // Remove active class from all tabs
    document.querySelectorAll('.inventory-tab').forEach(t => {
      t.classList.remove('active');
    });
    
    // Add active class to clicked tab
    tab.classList.add('active');
    
    // Render items for the selected category
    this.renderShopItems(tab.dataset.category);
  }

  playClickSound() {
    if (this.soundEnabled && this.clickSound) {
      const sfx = this.clickSound.cloneNode(true); // new audio element
      sfx.volume = 0.5;
      sfx.play().catch(() => {});
      sfx.addEventListener("ended", () => sfx.remove());
    }
  }

  bindEvents() {
    const categoryBtns = document.querySelectorAll(".category-btn");
    categoryBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.playClickSound();
        this.selectCategory(e);
      });
    });

    const inventoryTabs = document.querySelectorAll('.inventory-tab');
    inventoryTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.playClickSound();
        this.selectInventoryTab(e);
      });
    });

    const playBtn = $$("playBtn");
    if (playBtn) {
      playBtn.addEventListener("click", () => {
        this.playClickSound();
        this.showGameModeModal();
      });
    }

    const helpBtn = $$("help-btn");
    const soundBtn = $$("sound-btn");
    const musicBtn = $$("music-btn");
    const instructionsModal = $$("instructions-modal");
    const closeInstructionsBtn = $$("close-instructions");
    const aboutBtn = $$("about-btn");
    const closeAboutBtn = $$("close-about");

    if (aboutBtn) {
      aboutBtn.addEventListener("click", () => {
        this.playClickSound();
        this.showAbout();
      });
    }

    if (closeAboutBtn) {
      closeAboutBtn.addEventListener("click", () => {
        this.playClickSound();
        this.closeAbout();
      });
    }

    if (helpBtn) {
      helpBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.playClickSound();
        this.showInstructions();
      });
    }

    if (soundBtn) {
      soundBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.toggleSound();
      });
    }

    if (musicBtn) {
      musicBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.toggleMusic();
      });
    }

    if (closeInstructionsBtn) {
      closeInstructionsBtn.addEventListener("click", () => {
        this.playClickSound();
        this.hideInstructions();
      });
    }

    if (instructionsModal) {
      instructionsModal.addEventListener("click", (e) => {
        if (e.target === instructionsModal) {
          this.hideInstructions();
        }
      });
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
        $$("about-modal").classList.remove("hidden");
      });
    }

    const modal = $$("gameModeModal");
    const cancelBtn = $$("cancelBtn");
    const startBtn = $$("startGameBtn");

    if (startBtn) {
      startBtn.addEventListener("click", () => {
        this.playClickSound();
        setTimeout(() => this.startGame(), 500);
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        this.playClickSound();
        this.hideGameModeModal();
      });
    }

    const modeBtns = document.querySelectorAll(".mode-btn");
    modeBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.playClickSound();
        this.selectMode(e);
      });
    });

    const difficultyBtns = document.querySelectorAll(".difficulty-btn");
    difficultyBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.playClickSound();
        this.selectDifficulty(e);
      });
    });

    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          this.hideGameModeModal();
        }
      });
    }

    // Skin shop event bindings
    const skinBtn = $$("skin-btn");
    const skinShopModal = $$("skin-shop-modal");
    const closeSkinShopBtn = $$("close-skin-shop");

    if (skinBtn) {
      skinBtn.addEventListener("click", () => {
        this.playClickSound();
        this.showSkinShop();
      });
    }

    if (closeSkinShopBtn) {
      closeSkinShopBtn.addEventListener("click", () => {
        this.playClickSound();
        this.hideSkinShop();
      });
    }

    if (skinShopModal) {
      skinShopModal.addEventListener("click", (e) => {
        if (e.target === skinShopModal) {
          this.hideSkinShop();
        }
      });
    }

    // Game menu event bindings
    const gameMenu = $$("game-menu");
    const resumeBtn = $$("resume-btn");
    const howToPlayBtn = $$("how-to-play-btn");
    const shopMenuBtn = $$("shop-menu-btn");
    const soundMenuBtn = $$("sound-menu-btn");
    const musicMenuBtn = $$("music-menu-btn");
    const mainMenuBtn = $$("main-menu-btn");
    const closeInstructionsBtn2 = $$("close-instructions-btn");

    // ESC key for game menu ---------------------------------------------------------------------------
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.toggleGameMenu();
      }
    });

    if (resumeBtn) {
      resumeBtn.addEventListener("click", () => {
        this.playClickSound();
        this.toggleGameMenu();
      });
    }

    if (howToPlayBtn) {
      howToPlayBtn.addEventListener("click", () => {
        this.playClickSound();
        this.showInstructions();
      });
    }

    if (shopMenuBtn) {
      shopMenuBtn.addEventListener("click", () => {
        this.playClickSound();
        this.toggleGameMenu();
        this.showSkinShop();
      });
    }

    if (soundMenuBtn) {
      soundMenuBtn.addEventListener("click", () => {
        this.playClickSound();
        this.toggleSound();
        this.updateSoundMenuButton();
      });
    }

    if (musicMenuBtn) {
      musicMenuBtn.addEventListener("click", () => {
        this.playClickSound();
        this.toggleMusic();
        this.updateMusicMenuButton();
      });
    }

    if (mainMenuBtn) {
      mainMenuBtn.addEventListener("click", () => {
        this.playClickSound();
        window.location.href = "index.html";
      });
    }

    if (closeInstructionsBtn2) {
      closeInstructionsBtn2.addEventListener("click", () => {
        this.playClickSound();
        this.hideInstructions();
      });
    }
  }

  showInstructions() {
    const instructionsModal = $$("instructions-modal");
    if (instructionsModal) {
      instructionsModal.classList.remove("hidden");
    }
  }

  showAbout() {
    const aboutModal = $$("about-modal");
    if (aboutModal) {
      aboutModal.classList.remove("hidden");
    }
  }

  hideInstructions() {
    const instructionsModal = $$("instructions-modal");
    if (instructionsModal) {
      instructionsModal.classList.add("hidden");
    }
  }

  closeAbout() {
    const aboutModal = $$("about-modal");
    if (aboutModal) {
      aboutModal.classList.add("hidden");
    }
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    localStorage.setItem("soundEnabled", this.soundEnabled.toString());

    const soundBtn = $$("sound-btn");
    if (soundBtn) {
      soundBtn.textContent = this.soundEnabled ? "🔊" : "🔇";
      soundBtn.classList.toggle("active", this.soundEnabled);
    }
    
    this.updateSoundMenuButton();
  }
  
  updateSoundMenuButton() {
    const soundMenuBtn = $$("sound-menu-btn");
    if (soundMenuBtn) {
      soundMenuBtn.textContent = `Sound: ${this.soundEnabled ? "On" : "Off"}`;
    }
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    localStorage.setItem("musicEnabled", this.musicEnabled.toString());

    const musicBtn = $$("music-btn");

    if (musicBtn) {
      musicBtn.textContent = this.musicEnabled ? "🎵" : "🎵";
      musicBtn.classList.toggle("active", this.musicEnabled);

      if (this.musicEnabled) {
        this.backgroundMusic.play().catch(() => {});
      } else {
        this.backgroundMusic.pause();
      }
    }
    this.updateMusicMenuButton();
  }

  updateMusicMenuButton() {
    const musicMenuBtn = $$("music-menu-btn");
    if (musicMenuBtn) {
      musicMenuBtn.textContent = `Music: ${this.musicEnabled ? "On" : "Off"}`;
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
    if (!this.selectedCategory) return;

    const modal = $$("gameModeModal");
    if (modal) {
      modal.classList.remove("hidden");
    }
  }

  hideGameModeModal() {
    const modal = $$("gameModeModal");
    if (modal) {
      modal.classList.add("hidden");
    }
    this.resetModalSelections();
  }

  selectMode(e) {
    document.querySelectorAll(".mode-btn").forEach((btn) => {
      btn.classList.remove("selected");
    });

    e.target.classList.add("selected");
    this.selectedMode = e.target.dataset.mode;

    this.updateStartButton();
  }

  selectDifficulty(e) {
    document.querySelectorAll(".difficulty-btn").forEach((btn) => {
      btn.classList.remove("selected");
    });

    e.target.classList.add("selected");
    this.selectedDifficulty = e.target.dataset.difficulty;

    this.updateStartButton();
  }

  updateStartButton() {
    const startBtn = $$("startGameBtn");
    if (startBtn) {
      startBtn.disabled = !(this.selectedMode && this.selectedDifficulty);
    }
  }

  resetModalSelections() {
    this.selectedMode = null;
    this.selectedDifficulty = null;

    document.querySelectorAll(".mode-btn, .difficulty-btn").forEach((btn) => {
      btn.classList.remove("selected");
    });

    const startBtn = $$("startGameBtn");
    if (startBtn) {
      startBtn.disabled = true;
    }
  }

  startGame() {
    const gameSettings = {
      category: this.selectedCategory,
      mode: this.selectedMode,
      difficulty: this.selectedDifficulty,
      selectedSkin: this.selectedSkin,
      selectedAccessory: this.selectedAccessory,
      selectedEffect: this.selectedEffect
    };

    localStorage.setItem("gameSettings", JSON.stringify(gameSettings));

    if (this.musicEnabled) {
      this.backgroundMusic.pause();
    }

    if (this.selectedCategory === "math") {
      window.location.href = "games/math/math-game.html";
    } else if (this.selectedCategory === "english") {
      window.location.href = "games/english/english-game.html";
    } else if (this.selectedCategory === "science") {
      window.location.href = "games/science/science-game.html";
    } else if (this.selectedCategory === "generalknow") {
      window.location.href = "games/generalKnowledge/generalknow-game.html";
    }
  }

  // Shop functionality
  selectShopCategory(e) {
    const btn = e.target.closest('.shop-category-btn');
    if (!btn) return;
    
    document.querySelectorAll(".shop-category-btn").forEach((btn) => {
      btn.classList.remove("active");
    });
    
    btn.classList.add("active");
    const category = btn.dataset.category;
    this.renderShopItems(category);
  }
renderShopItems(category) {
  const itemsContainer = document.getElementById("shop-items-container");
  if (!itemsContainer) return;
  
  itemsContainer.innerHTML = '';
  
  const items = this.getShopItemsByCategory(category);
  
  if (items.length === 0) {
    itemsContainer.innerHTML = '<p class="coming-soon">Coming soon!</p>';
    return;
  }
  
  // Create grid container
  const grid = document.createElement('div');
  grid.className = 'skins-grid';
  
  items.forEach(item => {
    const isOwned = this.isItemOwned(category, item.id);
    const isSelected = this.isItemSelected(category, item.id);
    const canAfford = this.coins >= item.price; // ✅ now checks coins

    const itemElement = document.createElement('div');
    itemElement.className = 'skin-item shop-item';
    itemElement.innerHTML = `
      <div class="skin-preview">
        <img src="assets/images/snake-skins/${item.id}_snake/SnakeHead.png" alt="${item.name}" class="skin-image" />
      </div>
      <div class="skin-info">
        <h4>${item.name}</h4>
        <p class="skin-description">${item.desc}</p>
        <div class="skin-status">
          ${isOwned ? 
            `<span class="skin-owned">✓ Owned</span>
             <button class="action-btn ${isSelected ? 'selected' : ''}" 
                     data-category="${category}" data-id="${item.id}" data-action="select">
               ${isSelected ? 'Selected' : 'Select'}
             </button>` : 
            `<span class="skin-price">${item.price} coins</span>  <!-- ✅ now shows coins -->
             <button class="action-btn ${canAfford ? '' : 'disabled'}" 
                     data-category="${category}" data-id="${item.id}" data-action="buy"
                     ${canAfford ? '' : 'disabled'}>
               ${canAfford ? 'Buy' : 'Need More Coins'}
             </button>`
          }
        </div>
      </div>
    `;
    
    grid.appendChild(itemElement);
  });
  
  itemsContainer.appendChild(grid);


    // Add event listeners to action buttons
    itemsContainer.querySelectorAll('.action-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const category = button.dataset.category;
        const itemId = button.dataset.id;
        const action = button.dataset.action;
        
        if (action === 'buy') {
          this.buyItem(category, itemId);
        } else if (action === 'select') {
          this.selectItem(category, itemId);
        }
      });
    });
  }
  
  isItemOwned(category, itemId) {
    if (category === 'skins') {
      return this.ownedSkins.includes(itemId);
    } else if (category === 'accessories') {
      return this.ownedAccessories.includes(itemId);
    } else if (category === 'effects') {
      return this.ownedEffects.includes(itemId);
    }
    return false;
  }
  
  isItemSelected(category, itemId) {
    if (category === 'skins') {
      return this.selectedSkin === itemId;
    } else if (category === 'accessories') {
      return this.selectedAccessory === itemId;
    } else if (category === 'effects') {
      return this.selectedEffect === itemId;
    }
    return false;
  }
  
  buyItem(category, itemId) {
    const items = this.getShopItemsByCategory(category);
    const item = items.find(i => i.id === itemId);
    
    if (!item) {
      console.error('Item not found:', itemId);
      return;
    }
    
    // Check if already owned
    if (this.isItemOwned(category, itemId)) {
      this.showNotification('✅ You already own this item!');
      return;
    }
    
    // Check if user has enough points and coins
    if (this.points < item.price) {
      this.showNotification('❌ Not enough points!');
      return;
    }

    if (this.coins < (item.priceCoins || 0)) {
      this.showNotification('❌ Not enough coins!');
      return;
    }
    
    // Deduct points and add to owned items
    this.points -= item.price;
    localStorage.setItem("totalPoints", this.points.toString());

    this.coins -= (item.priceCoins || 0);
    localStorage.setItem("totalCoins", this.coins.toString());
    
    if (category === 'skins') {
      if (!this.ownedSkins.includes(itemId)) {
        this.ownedSkins.push(itemId);
        localStorage.setItem("ownedSkins", JSON.stringify(this.ownedSkins));
      }
    } else if (category === 'accessories') {
      if (!this.ownedAccessories.includes(itemId)) {
        this.ownedAccessories.push(itemId);
        localStorage.setItem("ownedAccessories", JSON.stringify(this.ownedAccessories));
      }
    } else if (category === 'effects') {
      if (!this.ownedEffects.includes(itemId)) {
        this.ownedEffects.push(itemId);
        localStorage.setItem("ownedEffects", JSON.stringify(this.ownedEffects));
      }
    }
    
    // Update points display
    const pointsDisplay = document.getElementById("current-points");
    if (pointsDisplay) {
      pointsDisplay.textContent = this.points;
    }

    // Update coins based on new points
    const coinsDisplay = document.getElementById("current-coins");
    if (coinsDisplay) {
        coinsDisplay.textContent = this.coins;
    }

    
    // Re-render items to show updated status
    const activeTab = document.querySelector('.inventory-tab.active');
    if (activeTab) {
      this.renderShopItems(activeTab.dataset.category);
    }
    
    this.playClickSound();
    this.showNotification(`${item.name} purchased!`);
  }

  selectItem(category, itemId) {
    if (category === 'skins') {
      this.selectedSkin = itemId;
      localStorage.setItem("selectedSkin", itemId);
    } else if (category === 'accessories') {
      this.selectedAccessory = itemId;
      localStorage.setItem("selectedAccessory", itemId);
    } else if (category === 'effects') {
      this.selectedEffect = itemId;
      localStorage.setItem("selectedEffect", itemId);
    }
    
    // Re-render items to show selection
    const activeTab = document.querySelector('.inventory-tab.active');
    if (activeTab) {
      this.renderShopItems(activeTab.dataset.category);
    }
    
    this.playClickSound();
    this.showNotification(`${this.getItemName(category, itemId)} selected!`);
  }
  
  getItemName(category, itemId) {
    const items = this.getShopItemsByCategory(category);
    const item = items.find(i => i.id === itemId);
    return item ? item.name : 'Item';
  }

  showSkinShop() {
    const skinShopModal = $$("skin-shop-modal");
    if (skinShopModal) {
      skinShopModal.classList.remove("hidden");
      
      // Update points display
      const pointsDisplay = $$("current-points");
      if (pointsDisplay) {
        pointsDisplay.textContent = this.points;
      }

      const coinsDisplay = $$("current-coins");
      if (coinsDisplay) {
          coinsDisplay.textContent = this.coins;
      }
      
      // Select first category by default
      const firstTab = document.querySelector('.inventory-tab');
      if (firstTab) {
        // Remove active class from all tabs
        document.querySelectorAll('.inventory-tab').forEach(t => {
          t.classList.remove('active');
        });
        
        // Add active class to first tab
        firstTab.classList.add('active');
        
        // Render items for the first tab
        this.renderShopItems(firstTab.dataset.category);
      }
    }
  }

  getShopItemsByCategory(category) {
    const items = {
      skins: [
        { id: 'green', name: 'Classic Green', desc: 'The original snake look', price: 0 },
        { id: 'pink', name: 'Sugar Strike', desc: 'A sweet pink variation', price: 150 },
        { id: 'blue', name: 'Ocean Fang', desc: 'Cool as the deep sea', price: 200 },
        { id: 'volt', name: 'Zap Viper', desc: 'Charged with voltech energy', price: 999 }
      ],
      accessories: [
        { id: 'hat', name: 'Top Hat', desc: 'A dapper accessory', price: 100 },
        { id: 'glasses', name: 'Sunglasses', desc: 'Cool shades for your snake', price: 75 },
        { id: 'crown', name: 'Golden Crown', desc: 'Royal headpiece', price: 250 },
        { id: 'bow', name: 'Red Bow', desc: 'Elegant ribbon accessory', price: 50 }
      ],
      effects: [
        { id: 'trail', name: 'Rainbow Trail', desc: 'Colorful trail effect', price: 150 },
        { id: 'sparkle', name: 'Sparkle Effect', desc: 'Glittering sparkles', price: 100 },
        { id: 'fire', name: 'Fire Effect', desc: 'Flaming hot trail', price: 200 },
        { id: 'ice', name: 'Ice Effect', desc: 'Frosty cool trail', price: 175 }
      ]
    };
    
    return items[category] || [];
  }

  hideSkinShop() {
    const skinShopModal = $$("skin-shop-modal");
    if (skinShopModal) {
      skinShopModal.classList.add("hidden");
    }
  }
  
  toggleGameMenu() {
    const gameMenu = $$("game-menu");
    if (gameMenu) {
      // Toggle the hidden class
      gameMenu.classList.toggle("hidden");
      
      // If menu is now visible, pause the game
      if (!gameMenu.classList.contains("hidden")) {
        // Add any game pausing logic here if needed
        console.log("Game paused - menu opened");
      } else {
        // Add any game resuming logic here if needed
        console.log("Game resumed - menu closed");
      }
      
      // Update sound button text in menu
      this.updateSoundMenuButton();
      this.updateMusicMenuButton();
    }
  }

  showNotification(message) {
    // Create notification element if it doesn't exist
    let notification = $$("notification");
    if (!notification) {
      notification = document.createElement("div");
      notification.id = "notification";
      notification.className = "hidden";
      document.body.appendChild(notification);
    }
    
    // Set message and show
    notification.textContent = message;
    notification.classList.remove("hidden");
    notification.classList.add("show");
    
    // Hide after 2 seconds
    setTimeout(() => {
      notification.classList.remove("show");
      setTimeout(() => {
        notification.classList.add("hidden");
      }, 1000);
    }, 2000);
  }
}


// === Buy Coins Modal ===
const buyCoinsModal = document.getElementById("buy-coins-modal");
const openBuyCoinsBtn = document.getElementById("buy-coins-btn"); // the "Buy Coins" button in shop
const closeBuyCoinsBtn = document.getElementById("close-buy-coins");

const priceButtons = document.querySelectorAll(".price-btn");
const purchaseBtn = document.getElementById("confirm-purchase");
let selectedPackage = null;

// Open Buy Coins modal
openBuyCoinsBtn.addEventListener("click", () => {
  buyCoinsModal.classList.remove("hidden");

  // Reset state every time modal opens
  document.querySelectorAll(".coin-package").forEach(pkg => pkg.classList.remove("selected"));
  purchaseBtn.classList.add("hidden");
  selectedPackage = null;
});

// Close Buy Coins modal
closeBuyCoinsBtn.addEventListener("click", () => {
  buyCoinsModal.classList.add("hidden");

  // Reset when closing too
  document.querySelectorAll(".coin-package").forEach(pkg => pkg.classList.remove("selected"));
  purchaseBtn.classList.add("hidden");
  selectedPackage = null;
});

// Handle price button clicks
priceButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    // Clear previous selection
    document.querySelectorAll(".coin-package").forEach(pkg => pkg.classList.remove("selected"));

    // Mark new selection
    const packageDiv = btn.closest(".coin-package");
    packageDiv.classList.add("selected");

    selectedPackage = {
      coins: packageDiv.dataset.coins,
      price: packageDiv.dataset.price
    };

    // Show purchase button
    purchaseBtn.classList.remove("hidden");
  });
});

// "Purchase" button clicked
purchaseBtn.addEventListener("click", () => {
  if (selectedPackage) {
    alert(`✅ You selected ${selectedPackage.coins} coins for ₱${selectedPackage.price}.\n(Purchases disabled in demo)`);
  }
});
// ======================

document.addEventListener("DOMContentLoaded", () => {
  new LandingPage();
});