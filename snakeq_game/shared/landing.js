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
    this.coins = parseInt(localStorage.getItem("totalCoins")) || Math.floor(this.points / 10); // Load coins from storage or calculate from points

    // console.log('LandingPage initialized - Points:', this.points, 'Coins:', this.coins);
    this.totalPointsDisplay = $$("current-points");
    this.ownedSkins = JSON.parse(localStorage.getItem("ownedSkins")) || ["green"];
    this.selectedSkin = localStorage.getItem("selectedSkin") || "green";

    // Shop system
    this.ownedAccessories = JSON.parse(localStorage.getItem("ownedAccessories")) || [];
    this.selectedAccessory = localStorage.getItem("selectedAccessory") || null;

    this.ownedTiles = JSON.parse(localStorage.getItem("ownedTiles")) || ["Tile"];
    this.selectedTile = localStorage.getItem("selectedTile") || "Tile";

    this.unlockedModes = JSON.parse(localStorage.getItem("unlockedModes")) || ["quiz"];
    this.pendingUnlock = null;

    // Leaderboard system
    this.username = localStorage.getItem("playerUsername") || null;
    this.leaderboardManager = null;
    this.currentLeaderboardCategory = 'overall';
    
    // Achievement system
    this.achievements = this.loadAchievements();
    this.gameStats = this.loadGameStats();
    
    this.init();
  }

      async init() {
        // Track how many times intro has been seen
        let introCount = parseInt(localStorage.getItem('introCount') || '0', 10);
        const fromIntro = new URLSearchParams(window.location.search).get('fromIntro');

        if (introCount === 0 && !fromIntro) {
          // First ever time → show intro
          const url = new URL(window.location.origin);
          url.pathname = '/snakeq_game/shared/intro.html';
          url.searchParams.set('unskippable', 'true');
          url.searchParams.set('fromIntro', 'true'); // so we know we came back
          window.location.href = url.toString();
          return; // Stop init
        }

        if (fromIntro) {
          // Increase intro count
          introCount++;
          localStorage.setItem('introCount', introCount);

          // Clear the param
          const url = new URL(window.location);
          url.searchParams.delete('fromIntro');
          window.history.replaceState({}, '', url);

          // First time back from intro → show tutorial
          if (introCount === 1) {
            this.startTutorial();
          }
        }

        this.bindEvents();
        this.initializeAudioStates();
        await this.initializeLeaderboard();
        this.checkUsernamePrompt();
        this.setupMessageListener();

        // Check for new achievements on page load
        setTimeout(() => {
          this.checkAchievements();
        }, 1000);
      }


  async initializeLeaderboard() {
    try {
      // Initialize Firebase leaderboard manager
      if (window.LeaderboardManager) {
        this.leaderboardManager = new window.LeaderboardManager();
        console.log('Leaderboard system initialized');
      } else {
        console.warn('LeaderboardManager not available - Firebase may not be loaded');
      }
    } catch (error) {
      console.error('Failed to initialize leaderboard:', error);
    }
  }

  checkUsernamePrompt() {
    // Show username modal if no username is set and user has points
    if (!this.username && this.points > 0) {
      setTimeout(() => {
        this.showUsernameModal();
      }, 1000);
    }
  }

  initializeAudioStates() {
    const soundBtn = $$("sound-btn");
    const musicBtn = $$("music-btn");

    if (soundBtn) {
      soundBtn.textContent = this.soundEnabled ? "🔊" : "🔇";
      soundBtn.classList.toggle("active", this.soundEnabled);
    }

    if (musicBtn) {
      musicBtn.textContent = this.musicEnabled ? "🎵" : "🤫";
      musicBtn.classList.toggle("active", this.musicEnabled);
      this.clickSound.volume = 0.5;

      if (this.musicEnabled) {
        this.backgroundMusic.volume = 1;
        this.backgroundMusic.play().catch(() => { });
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
      sfx.play().catch(() => { });
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

    // Intro button event
    const introBtn = $$("intro-btn");
    if (introBtn) {
      introBtn.addEventListener("click", () => {
        this.playClickSound();
        window.location.href = 'shared/intro.html';
      });
    }

    // Tutorial button event
    const tutorialBtn = $$("tutorial-btn");
    if (tutorialBtn) {
      tutorialBtn.addEventListener("click", () => {
        this.playClickSound();
        this.startTutorial();
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

    // Leaderboard event bindings
    const leaderboardBtn = $$("leaderboard-btn");
    const leaderboardModal = $$("leaderboard-modal");
    const closeLeaderboardBtn = $$("close-leaderboard");
    const refreshLeaderboardBtn = $$("refresh-leaderboard");
    const leaderboardTabs = document.querySelectorAll('.leaderboard-tab');

    if (leaderboardBtn) {
      leaderboardBtn.addEventListener("click", () => {
        this.playClickSound();
        this.showLeaderboard();
      });
    }

    if (closeLeaderboardBtn) {
      closeLeaderboardBtn.addEventListener("click", () => {
        this.playClickSound();
        this.hideLeaderboard();
      });
    }

    if (refreshLeaderboardBtn) {
      refreshLeaderboardBtn.addEventListener("click", () => {
        this.playClickSound();
        this.showNotification("Refreshing leaderboard... 🔄");
        this.loadLeaderboard(this.currentLeaderboardCategory);
      });
    }

    if (leaderboardModal) {
      leaderboardModal.addEventListener("click", (e) => {
        if (e.target === leaderboardModal) {
          this.hideLeaderboard();
        }
      });
    }

    leaderboardTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.playClickSound();
        this.selectLeaderboardCategory(e);
      });
    });

    // Achievements event bindings
    const achievementsBtn = $$("achievements-btn");
    const achievementsModal = $$("achievements-modal");
    const closeAchievementsBtn = $$("close-achievements");

    if (achievementsBtn) {
      achievementsBtn.addEventListener("click", () => {
        this.playClickSound();
        this.showAchievements();
      });
    }

    if (closeAchievementsBtn) {
      closeAchievementsBtn.addEventListener("click", () => {
        this.playClickSound();
        this.hideAchievements();
      });
    }

    if (achievementsModal) {
      achievementsModal.addEventListener("click", (e) => {
        if (e.target === achievementsModal) {
          this.hideAchievements();
        }
      });
    }


    // Username modal event bindings
    const usernameModal = $$("username-modal");
    const saveUsernameBtn = $$("save-username");
    const skipUsernameBtn = $$("skip-username");
    const usernameInput = $$("username-input");

    if (saveUsernameBtn) {
      saveUsernameBtn.addEventListener("click", () => {
        this.playClickSound();
        this.saveUsername();
      });
    }

    if (skipUsernameBtn) {
      skipUsernameBtn.addEventListener("click", () => {
        this.playClickSound();
        this.hideUsernameModal();
      });
    }

    if (usernameInput) {
      usernameInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          this.saveUsername();
        }
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

    // Unlock modal event bindings
    const unlockModal = $$("unlock-modal");
    const confirmUnlockBtn = $$("confirm-unlock-btn");
    const cancelUnlockBtn = $$("cancel-unlock-btn");

    if (confirmUnlockBtn) {
      confirmUnlockBtn.addEventListener("click", () => {
        this.playClickSound();
        this.confirmUnlock();
      });
    }

    if (cancelUnlockBtn) {
      cancelUnlockBtn.addEventListener("click", () => {
        this.playClickSound();
        this.hideUnlockModal();
      });
    }

    if (unlockModal) {
      unlockModal.addEventListener("click", (e) => {
        if (e.target === unlockModal) {
          this.hideUnlockModal();
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
      musicBtn.textContent = this.musicEnabled ? "🎵" : "🤫";
      musicBtn.classList.toggle("active", this.musicEnabled);

      if (this.musicEnabled) {
        this.backgroundMusic.play().catch(() => { });
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

    // Go directly to game mode modal instead of enabling start button
    this.showGameModeModal();
  }

  showGameModeModal() {
    if (!this.selectedCategory) return;

    const modal = $$("gameModeModal");
    if (modal) {
      modal.classList.remove("hidden");
      this.updateGameModeLocks();
    }
  }

  updateGameModeLocks() {

    const modeBtns = document.querySelectorAll(".mode-btn");

    modeBtns.forEach((btn) => {
      const cost = parseInt(btn.dataset.cost) || 0;
      const mode = btn.dataset.mode;

      // Remove any existing overlays (cleanup from old system)
      const existingOverlay = btn.parentElement.querySelector(`[data-lock-for="${mode}"]`);
      if (existingOverlay) {
        existingOverlay.remove();
      }

      if (cost === 0 || this.unlockedModes.includes(mode)) {
        btn.classList.remove("locked");
        btn.removeAttribute("data-cost-display");
        btn.disabled = false;
      } else {
        btn.classList.add("locked");
        btn.setAttribute("data-cost-display", `${cost} coins needed`);
        btn.disabled = false; // Keep clickable to show unlock modal
      }
    });

    this.updateDifficultyLocks();

  }

  updateDifficultyLocks() {

    const difficultyBtns = document.querySelectorAll(".difficulty-btn");

    difficultyBtns.forEach((btn) => {
      const difficulty = btn.dataset.difficulty;

      // Remove any existing overlays (cleanup from old system)
      const existingOverlay = btn.parentElement.querySelector(`[data-difficulty-lock-for="${difficulty}"]`);
      if (existingOverlay) {
        existingOverlay.remove();
      }

      const requiredCoins = parseInt(btn.dataset.cost) || 0;

      if (requiredCoins === 0 || this.coins >= requiredCoins) {
        btn.classList.remove("locked");
        btn.removeAttribute("data-cost-display");
        btn.disabled = false;
      } else {
        btn.classList.add("locked");
        btn.setAttribute("data-cost-display", `${requiredCoins} coins needed`);
        btn.disabled = false; // Keep clickable for potential future unlock functionality
      }
    });

  }

  hideGameModeModal() {
    const modal = $$("gameModeModal");
    if (modal) {
      modal.classList.add("hidden");
    }
    this.resetModalSelections();
  }

  selectMode(e) {
    const btn = e.target.closest('.mode-btn');
    if (!btn) return;

    const mode = btn.dataset.mode;
    const cost = parseInt(btn.dataset.cost) || 0;

    document.querySelectorAll(".mode-btn").forEach((btn) => {
      btn.classList.remove("selected");
    });

    btn.classList.add("selected");
    this.selectedMode = btn.dataset.mode;
    this.updateStartButton();


    if (cost === 0 || this.unlockedModes.includes(mode)) {
      document.querySelectorAll(".mode-btn").forEach((btn) => {
        btn.classList.remove("selected");
      });

      btn.classList.add("selected");
      this.selectedMode = btn.dataset.mode;
      this.updateStartButton();
      return;
    }

    this.showUnlockModal(mode, cost);

  }

  showUnlockModal(mode, cost) {

    const unlockModal = $$("unlock-modal");
    const modeTitle = $$("unlock-mode-title");
    const modeDescription = $$("unlock-mode-description");
    const costAmount = $$("unlock-cost-amount");
    const currentCoins = $$("unlock-current-coins");
    const insufficientMsg = $$("unlock-insufficient");
    const confirmBtn = $$("confirm-unlock-btn");

    if (!unlockModal) return;

    const modeName = mode === 'endless' ? 'Endless Mode' : 'Timed Mode (1 min)';
    const modeDesc = mode === 'endless'
      ? 'Play without limits! '
      : 'Fast-paced 60-second challenge! ';

    if (modeTitle) modeTitle.textContent = `🔒 Unlock ${modeName}`;
    if (modeDescription) modeDescription.textContent = modeDesc;
    if (costAmount) costAmount.textContent = `${cost} coins`;
    if (currentCoins) currentCoins.textContent = this.coins;

    const canAfford = this.coins >= cost;
    if (insufficientMsg) {
      if (canAfford) {
        insufficientMsg.classList.add('hidden');
      } else {
        insufficientMsg.classList.remove('hidden');
      }
    }

    if (confirmBtn) {
      confirmBtn.disabled = !canAfford;
      confirmBtn.textContent = canAfford ? 'Unlock Mode' : 'Need More Coins';
    }

    this.pendingUnlock = { mode, cost };

    unlockModal.classList.remove("hidden");

  }

  hideUnlockModal() {

    const unlockModal = $$("unlock-modal");
    if (unlockModal) {
      unlockModal.classList.add("hidden");
    }
    this.pendingUnlock = null;

  }

  confirmUnlock() {

    if (!this.pendingUnlock) return;

    const { mode, difficulty, cost, type } = this.pendingUnlock;

    if (this.coins >= cost) {
      if (type === 'difficulty') {
        this.unlockDifficulty(difficulty, cost);
      } else {
        this.unlockGameMode(mode, cost);
      }
      this.hideUnlockModal();
    } else {
      this.hideUnlockModal();
      this.showNotification(`💰 Not enough coins! Play the unlocked or free modes to gain more points, then visit the shop to convert them!`);
    }

  }

  unlockGameMode(mode, cost) {

    this.coins -= cost;
    this.points -= (cost * 10);

    localStorage.setItem("totalCoins", this.coins.toString());
    localStorage.setItem("totalPoints", this.points.toString());

    const unlockedModes = JSON.parse(localStorage.getItem("unlockedModes")) || ["quiz"];
    if (!unlockedModes.includes(mode)) {
      unlockedModes.push(mode);
      localStorage.setItem("unlockedModes", JSON.stringify(unlockedModes));
    }

    this.unlockedModes = unlockedModes;

    const pointsDisplay = $$("current-points");
    if (pointsDisplay) {
      pointsDisplay.textContent = this.points;
    }

    const coinsDisplay = $$("current-coins");
    if (coinsDisplay) {
      coinsDisplay.textContent = this.coins;
    }

    this.updateGameModeLocks();

    const modeName = mode === 'endless' ? 'Endless Mode' : 'Timed Mode';
    this.showNotification(`🎉 ${modeName} unlocked! Enjoy the new challenge!`);

    const modeBtn = document.querySelector(`[data-mode="${mode}"]`);
    if (modeBtn) {
      document.querySelectorAll(".mode-btn").forEach((btn) => {
        btn.classList.remove("selected");
      });

      modeBtn.classList.add("selected");
      this.selectedMode = mode;
      this.updateStartButton();
    }

  }

  showDifficultyUnlockModal(difficulty, cost) {

    const unlockModal = $$("unlock-modal");
    const modeTitle = $$("unlock-mode-title");
    const modeDescription = $$("unlock-mode-description");
    const costAmount = $$("unlock-cost-amount");
    const currentCoins = $$("unlock-current-coins");
    const insufficientMsg = $$("unlock-insufficient");
    const confirmBtn = $$("confirm-unlock-btn");

    if (!unlockModal) return;

    const difficultyName = difficulty.charAt(0).toUpperCase() + difficulty.slice(1) + ' Difficulty';
    const difficultyDesc = difficulty === 'medium'
      ? 'Moderate challenge with balanced questions and slightly faster gameplay.'
      : 'Ultimate challenge! Hardest questions with the fastest gameplay speed.';

    if (modeTitle) modeTitle.textContent = `🔒 Unlock ${difficultyName}`;
    if (modeDescription) modeDescription.textContent = difficultyDesc;
    if (costAmount) costAmount.textContent = `${cost} coins`;
    if (currentCoins) currentCoins.textContent = this.coins;

    const canAfford = this.coins >= cost;
    if (insufficientMsg) {
      if (canAfford) {
        insufficientMsg.classList.add('hidden');
      } else {
        insufficientMsg.classList.remove('hidden');
      }
    }

    if (confirmBtn) {
      confirmBtn.disabled = !canAfford;
      confirmBtn.textContent = canAfford ? 'Unlock Difficulty' : 'Need More Coins';
    }

    this.pendingUnlock = { difficulty, cost, type: 'difficulty' };

    unlockModal.classList.remove("hidden");

  }

  unlockDifficulty(difficulty, cost) {

    this.coins -= cost;
    this.points -= (cost * 10);

    localStorage.setItem("totalCoins", this.coins.toString());
    localStorage.setItem("totalPoints", this.points.toString());

    const pointsDisplay = $$("current-points");
    if (pointsDisplay) {
      pointsDisplay.textContent = this.points;
    }

    const coinsDisplay = $$("current-coins");
    if (coinsDisplay) {
      coinsDisplay.textContent = this.coins;
    }

    this.updateGameModeLocks();

    const difficultyName = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    this.showNotification(`🎉 ${difficultyName} difficulty unlocked! Ready for the challenge!`);

    const difficultyBtn = document.querySelector(`[data-difficulty="${difficulty}"]`);
    if (difficultyBtn) {
      document.querySelectorAll(".difficulty-btn").forEach((btn) => {
        btn.classList.remove("selected");
      });

      difficultyBtn.classList.add("selected");
      this.selectedDifficulty = difficulty;
      this.updateStartButton();
    }

  }

  selectDifficulty(e) {
    const btn = e.target.closest('.difficulty-btn');
    if (!btn) return;

    const difficulty = btn.dataset.difficulty;
    const requiredCoins = parseInt(btn.dataset.cost) || 0;

    // Check if difficulty is free or user has enough coins
    if (requiredCoins === 0 || this.coins >= requiredCoins) {
      // Normal difficulty selection
      document.querySelectorAll(".difficulty-btn").forEach((btn) => {
        btn.classList.remove("selected");
      });

      btn.classList.add("selected");
      this.selectedDifficulty = btn.dataset.difficulty;
      this.updateStartButton();
      return;
    }

    // For locked difficulties, show unlock modal
    this.showDifficultyUnlockModal(difficulty, requiredCoins);
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
      selectedTile: this.selectedTile
    };

    localStorage.setItem("gameSettings", JSON.stringify(gameSettings));

    if (this.musicEnabled) {
      this.backgroundMusic.pause();
    }
    

    // Check sessionStorage for tutorial mode
    const gameMode = sessionStorage.getItem('gameMode');
    const isTutorialMode = gameMode === 'tutorial';

    // Clear tutorial mode after checking to prevent repeated redirects
    if (isTutorialMode) {
      sessionStorage.removeItem('gameMode');
    }

    if (this.selectedCategory === "math") {
      if (isTutorialMode) {
        window.location.href = "games/math/math-game.html";
        // window.location.href = "games/math/math-tutorial/math-game-tutorial.html";
      } else {
        window.location.href = "games/math/math-game.html";
      }
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
      const canAfford = this.coins >= item.price; // 

      const itemElement = document.createElement('div');
      itemElement.className = 'skin-item shop-item';

      if (category === "skins") {
        itemElement.innerHTML = `
        <div class="skin-preview">
          <img src="assets/images/snake-skins/${item.id}_snake/SnakeHeadDown.png" alt="${item.name}" class="skin-image" />
        </div>
        <div class="skin-info">
          <h4>${item.name}</h4>
          <p class="skin-description">${item.desc}</p>
          <div class="skin-status">
            ${isOwned ?
            `<span class="skin-owned">Owned</span>
              <button class="action-btn ${isSelected ? 'selected' : ''}" 
                      data-category="${category}" data-id="${item.id}" data-action="select">
                ${isSelected ? 'Selected' : 'Select'}
              </button>` :
            `<span class="skin-price">${item.price} coins</span>  
              <button class="action-btn ${canAfford ? '' : 'disabled'}" 
                      data-category="${category}" data-id="${item.id}" data-action="buy"
                      ${canAfford ? '' : 'disabled'}>
                ${canAfford ? 'Buy' : 'Need More Coins'}
              </button>`
          }
          </div>
        </div>
      `;
      } else if (category === "accessories") {
        itemElement.innerHTML = `
        <div class="skin-preview">
          <img src="assets/images/accessory/${item.id}Down.png" alt="${item.name}" class="skin-image" />
        </div>
        <div class="skin-info">
          <h4>${item.name}</h4>
          <p class="skin-description">${item.desc}</p>
          <div class="skin-status">
            ${isOwned ?
            `<span class="skin-owned">Owned</span>
              <button class="action-btn ${isSelected ? 'selected' : ''}" 
                      data-category="${category}" data-id="${item.id}" data-action="select">
                ${isSelected ? 'Selected' : 'Select'}
              </button>` :
            `<span class="skin-price">${item.price} coins</span>  
              <button class="action-btn ${canAfford ? '' : 'disabled'}" 
                      data-category="${category}" data-id="${item.id}" data-action="buy"
                      ${canAfford ? '' : 'disabled'}>
                ${canAfford ? 'Buy' : 'Need More Coins'}
              </button>`
          }
          </div>
        </div>
      `;
      } else if (category === "tiles") {
        itemElement.innerHTML = `
        <div class="skin-preview">
          <img src="assets/images/tiles/${item.id}.png" alt="${item.name}" class="skin-image" />
        </div>
        <div class="skin-info">
          <h4>${item.name}</h4>
          <p class="skin-description">${item.desc}</p>
          <div class="skin-status">
            ${isOwned ?
            `<span class="skin-owned">Owned</span>
              <button class="action-btn ${isSelected ? 'selected' : ''}" 
                      data-category="${category}" data-id="${item.id}" data-action="select">
                ${isSelected ? 'Selected' : 'Select'}
              </button>` :
            `<span class="skin-price">${item.price} coins</span>  
              <button class="action-btn ${canAfford ? '' : 'disabled'}" 
                      data-category="${category}" data-id="${item.id}" data-action="buy"
                      ${canAfford ? '' : 'disabled'}>
                ${canAfford ? 'Buy' : 'Need More Coins'}
              </button>`
          }
          </div>
        </div>
      `;
      }

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
    } else if (category === 'tiles') {
      return this.ownedTiles.includes(itemId);
    }
    return false;
  }

  isItemSelected(category, itemId) {
    if (category === 'skins') {
      return this.selectedSkin === itemId;
    } else if (category === 'accessories') {
      return this.selectedAccessory === itemId;
    } else if (category === 'tiles') {
      return this.selectedTile === itemId;
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

    // Check if user has enough coins
    if (this.coins < item.price) {
      this.showNotification('❌ Not enough coins!');
      return;
    }

    // Deduct coins and corresponding points (10 points = 1 coin)
    this.coins -= item.price;
    this.points -= (item.price * 10);
    localStorage.setItem("totalCoins", this.coins.toString());
    localStorage.setItem("totalPoints", this.points.toString());

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
    } else if (category === 'tiles') {
      if (!this.ownedTiles.includes(itemId)) {
        this.ownedTiles.push(itemId);
        localStorage.setItem("ownedTiles", JSON.stringify(this.ownedTiles));
      }
    }

    // Update points display
    const pointsDisplay = document.getElementById("current-points");
    if (pointsDisplay) {
      pointsDisplay.textContent = this.points;
    }

    // Update coins display
    const coinsDisplay = document.getElementById("current-coins");
    if (coinsDisplay) {
      coinsDisplay.textContent = this.coins;
    }

    // Update game mode locks if modal is open
    const gameModeModal = $$("gameModeModal");
    if (gameModeModal && !gameModeModal.classList.contains("hidden")) {
      this.updateGameModeLocks();
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

      // Show selected skin notification
      const notification = document.createElement('div');
      notification.className = 'selected-skin-notification';
      notification.innerHTML = `
        <span>${this.getItemName(category, itemId)} selected!</span>
      `;

      // Remove any existing notifications
      const existingNotification = document.querySelector('.selected-skin-notification');
      if (existingNotification) {
        existingNotification.remove();
      }

      // Add new notification
      document.body.appendChild(notification);

      // Remove notification after 2 seconds
      setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
          notification.remove();
        }, 300);
      }, 2000);

    } else if (category === 'accessories') {
      this.selectedAccessory = itemId;
      localStorage.setItem("selectedAccessory", itemId);
    } else if (category === 'tiles') {
      this.selectedTile = itemId;
      localStorage.setItem("selectedTile", itemId);
    }

    // Re-render items to show selection
    const activeTab = document.querySelector('.inventory-tab.active');
    if (activeTab) {
      this.renderShopItems(activeTab.dataset.category);
    }

    this.playClickSound();
    // Only show default notification for non-skin selections
    if (category !== 'skins') {
      this.showNotification(`${this.getItemName(category, itemId)} selected!`);
    }
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
        { id: 'pink', name: 'Sugar Rush', desc: 'A sweet pink variation', price: 100 },
        { id: 'blue', name: 'Ocean Fang', desc: 'A bubbly blue variation', price: 100 },
        { id: 'purple', name: 'Midnight Mirage', desc: 'A mysterious purple snake', price: 100 },
        { id: 'gold', name: 'Royal Glimmer', desc: 'A royalty shining snake', price: 300 },
        { id: 'white', name: 'Crimson Pale', desc: 'A pale vampire-like snake', price: 500 },
        { id: 'volt', name: 'Ghost Shock', desc: 'A ghostly snake with shock energy', price: 999 },
        { id: 'centipede', name: 'Bore Centipede', desc: 'Mortal enemy of SnaQ, BEWARE!!', price: 4999 },
      ],
      accessories: [
        { id: 'none', name: 'Default', desc: 'No accessory', price: 0 },
        { id: 'bow', name: 'Red Bow', desc: 'Elegant ribbon accessory', price: 50 },
        { id: 'glasses', name: 'Sunglasses', desc: 'Cool shades to cover your eyes', price: 75 },
        { id: 'hat', name: 'Cook Hat', desc: 'An extension of your mind', price: 100 },
        { id: 'mustache', name: 'Mustache', desc: 'A gentlemen\'s mustache', price: 100 },
        { id: 'crown', name: 'Golden Crown', desc: 'Royal headpiece', price: 250 },
      ],
      tiles: [
        { id: 'Tile', name: 'Classic Tiles', desc: 'A classic tile design', price: 150 },
        { id: 'pinkTile', name: 'Sugar Rush', desc: 'Yumm!!', price: 100 },
        { id: 'blueTile', name: 'Ocean Blaze', desc: 'Like the rushing waves', price: 200 },
        { id: 'voltTile', name: 'Ancient Tech', desc: 'A mystical scripts of the past', price: 175 }
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

  // Leaderboard functionality
  async showLeaderboard() {
    const leaderboardModal = $$("leaderboard-modal");
    if (leaderboardModal) {
      leaderboardModal.classList.remove("hidden");
      await this.loadLeaderboard(this.currentLeaderboardCategory);
    }
  }

  hideLeaderboard() {
    const leaderboardModal = $$("leaderboard-modal");
    if (leaderboardModal) {
      leaderboardModal.classList.add("hidden");
    }
  }

  selectLeaderboardCategory(e) {
    const tab = e.target.closest('.leaderboard-tab');
    if (!tab) return;

    // Remove active class from all tabs
    document.querySelectorAll('.leaderboard-tab').forEach(t => {
      t.classList.remove('active');
    });

    // Add active class to clicked tab
    tab.classList.add('active');

    // Load leaderboard for selected category
    this.currentLeaderboardCategory = tab.dataset.category;
    this.loadLeaderboard(this.currentLeaderboardCategory);
  }

  async loadLeaderboard(category = 'overall') {
    const leaderboardList = $$("leaderboard-list");
    if (!leaderboardList || !this.leaderboardManager) {
      if (leaderboardList) {
        leaderboardList.innerHTML = '<div class="error-message">Leaderboard unavailable - Firebase not connected</div>';
      }
      return;
    }

    leaderboardList.innerHTML = `<div class="loading-message">Loading ${category} leaderboard...</div>`;

    try {
      const leaderboard = await this.leaderboardManager.getLeaderboard(category, 10);

      if (leaderboard.length === 0) {
        const categoryName = category === 'overall' ? 'overall' : category;
        if (categoryName && categoryName.trim() !== "") {
          if (categoryName.toLowerCase() === "generalknow") {
            leaderboardList.innerHTML = `<div class="empty-message">No scores yet in General Knowledge. Be the first! 🏆</div>`;
          } else if (categoryName.toLowerCase() === "science") {
            leaderboardList.innerHTML = `<div class="empty-message">No scores yet in Science. Be the first! 🏆</div>`;
          } else if (categoryName.toLowerCase() === "math") {
            leaderboardList.innerHTML = `<div class="empty-message">No scores yet in Math. Be the first! 🏆</div>`;
          } else if (categoryName.toLowerCase() === "english") {
            leaderboardList.innerHTML = `<div class="empty-message">No scores yet in English. Be the first! 🏆</div>`;
          } else {
            leaderboardList.innerHTML = `<div class="empty-message">No scores yet in ${categoryName}. Be the first! 🏆</div>`;
          }
        } else {
          leaderboardList.innerHTML = `<div class="empty-message">No scores yet. Be the first! 🏆</div>`;
        }
        return;
      }

      let html = '';
      leaderboard.forEach((entry, index) => {
        const isCurrentPlayer = this.username && entry.username === this.username;
        const rank = entry.rank || (index + 1);

        // Add medal emojis for top 3
        let rankDisplay = `${rank}`;
        if (rank === 1) rankDisplay = '🥇';
        else if (rank === 2) rankDisplay = '🥈';
        else if (rank === 3) rankDisplay = '🥉';

        html += `
          <div class="leaderboard-entry ${isCurrentPlayer ? 'current-player' : ''}">
            <span class="rank">${rankDisplay}</span>
            <span class="username">${entry.username}</span>
            <span class="score">${entry.totalPoints ? entry.totalPoints.toLocaleString() : '0'}</span>
          </div>
        `;
      });

      leaderboardList.innerHTML = html;

      // Update player rank display
      if (this.username) {
        await this.updatePlayerRank(category);
        this.updateUsernameDisplay();
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      leaderboardList.innerHTML = '<div class="error-message">Failed to load leaderboard. Please try again.</div>';
    }
  }

  async updatePlayerRank(category = 'overall') {
    if (!this.username || !this.leaderboardManager) return;

    try {
      const rank = await this.leaderboardManager.getPlayerRank(this.username, category);
      const rankDisplay = $$("player-rank-display");
      const currentPlayerRank = $$("current-player-rank");

      if (rankDisplay && currentPlayerRank) {
        if (rank && !isNaN(rank)) {
          currentPlayerRank.textContent = `#${rank}`;
          rankDisplay.classList.remove('hidden');
        } else {
          rankDisplay.classList.add('hidden');
        }
      }
    } catch (error) {
      console.error('Error getting player rank:', error);
    }
  }

  updateUsernameDisplay() {
    const usernameDisplay = $$("current-username-display");
    const displayUsername = $$("display-username");

    if (usernameDisplay && displayUsername) {
      if (this.username) {
        displayUsername.textContent = this.username;
        usernameDisplay.classList.remove('hidden');
      } else {
        usernameDisplay.classList.add('hidden');
      }
    }
  }

  // Reset username for demo purposes
  resetUsername() {
    // Clear username from localStorage and memory
    this.username = null;
    localStorage.removeItem("playerUsername");

    // Update display
    this.updateUsernameDisplay();

    // Show username modal immediately
    this.showUsernameModal();

    console.log("Username reset - ready for demo!");
  }

  // Username functionality
  showUsernameModal() {
    const usernameModal = $$("username-modal");
    if (usernameModal) {
      usernameModal.classList.remove("hidden");
      const usernameInput = $$("username-input");
      if (usernameInput) {
        // Pre-fill with current username if changing
        if (this.username) {
          usernameInput.value = this.username;
        } else {
          usernameInput.value = "";
        }
        usernameInput.focus();
      }

      // Update modal title based on context
      const modalTitle = usernameModal.querySelector("h3");
      if (modalTitle) {
        modalTitle.textContent = this.username ? "🎮 Change Your Username" : "🎮 Enter Your Username";
      }
    }
  }

  hideUsernameModal() {
    const usernameModal = $$("username-modal");
    if (usernameModal) {
      usernameModal.classList.add("hidden");
    }
  }

  saveUsername() {
    const usernameInput = $$("username-input");
    const usernameError = $$("username-error");
    const saveBtn = $$("save-username");

    if (!usernameInput) return;

    // Prevent spamming by disabling button
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = "Saving...";
    }

    const username = usernameInput.value.trim();

    // Validate username
    if (username.length < 3 || username.length > 20) {
      usernameError.classList.remove('hidden');
      usernameError.textContent = 'Username must be 3-20 characters long';
      // Re-enable button on error
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = "Save Username";
      }
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      usernameError.classList.remove('hidden');
      usernameError.textContent = 'Username can only contain letters, numbers, - and _';
      // Re-enable button on error
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = "Save Username";
      }
      return;
    }

    // Hide error message if validation passes
    usernameError.classList.add('hidden');

    // Save username
    this.username = username;
    localStorage.setItem("playerUsername", username);

    // Note: Scores are now submitted from individual games to their specific categories
    // Overall leaderboard is calculated automatically by summing all category scores

    // Close modal and show success
    this.hideUsernameModal();
    this.showNotification(`Welcome, ${username}! 🎮`);
    this.updateUsernameDisplay();

    // Re-enable button for future use
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = "Save Username";
    }
  }

  // Submit score to leaderboard
  async submitScoreToLeaderboard(category = 'overall') {
    if (!this.username || !this.leaderboardManager) return;

    try {
      await this.leaderboardManager.submitScore(this.username, this.points, category);
      console.log(`Score submitted to ${category} leaderboard`);
    } catch (error) {
      console.error('Error submitting score to leaderboard:', error);
    }
  }

  // Tutorial method
  startTutorial() {
    console.log('Starting tutorial...');

    // Set tutorial mode in sessionStorage
    sessionStorage.setItem('gameMode', 'tutorial');

    // Start the landing page tutorial
    if (window.tutorialManager) {
      window.tutorialManager.startTutorial();
    } else {
      console.warn('Tutorial manager not available, retrying in 100ms...');
      // Retry after a short delay in case the tutorial manager isn't loaded yet
      setTimeout(() => {
        if (window.tutorialManager) {
          window.tutorialManager.startTutorial();
        } else {
          console.error('Tutorial manager still not available');
          alert('Tutorial system is not ready. Please refresh the page and try again.');
        }
      }, 100);
    }
  }

  // Achievement System
  loadAchievements() {
    const defaultAchievements = {
      hungrySnake: { unlocked: false, claimed: false },
      speedDemon: { unlocked: false, claimed: false },
      scholar: { unlocked: false, claimed: false },
      perfectionist: { unlocked: false, claimed: false },
      collector: { unlocked: false, claimed: false },
      marathoner: { unlocked: false, claimed: false },
      tutorialMaster: { unlocked: false, claimed: false }
    };
    
    return JSON.parse(localStorage.getItem("achievements")) || defaultAchievements;
  }

  loadGameStats() {
    const defaultStats = {
      totalApplesEaten: 0,
      correctAnswers: 0,
      gamesPlayed: 0,
      perfectGames: 0,
      totalPlayTime: 0
    };
    
    const stats = JSON.parse(localStorage.getItem("gameStats")) || defaultStats;
    console.log('Loaded game stats:', stats);
    return stats;
  }

  saveAchievements() {
    localStorage.setItem("achievements", JSON.stringify(this.achievements));
  }

  saveGameStats() {
    console.log('Saving game stats:', this.gameStats);
    localStorage.setItem("gameStats", JSON.stringify(this.gameStats));
  }

  getAchievementList() {
    return [
      {
        id: 'hungrySnake',
        name: 'Hungry Snake',
        description: 'Eat 100 apples overall',
        icon: '🍎',
        reward: 150,
        requirement: () => this.gameStats.totalApplesEaten >= 100,
        progress: () => Math.min(this.gameStats.totalApplesEaten, 100),
        maxProgress: 100
      },
      {
        id: 'speedDemon',
        name: 'Speed Demon',
        description: 'Answer 50 questions correctly',
        icon: '⚡',
        reward: 250,
        requirement: () => this.gameStats.correctAnswers >= 50,
        progress: () => Math.min(this.gameStats.correctAnswers, 50),
        maxProgress: 50
      },
      {
        id: 'scholar',
        name: 'Scholar',
        description: 'Play 25 games across all categories',
        icon: '🎓',
        reward: 350,
        requirement: () => this.gameStats.gamesPlayed >= 25,
        progress: () => Math.min(this.gameStats.gamesPlayed, 25),
        maxProgress: 25
      },
      {
        id: 'perfectionist',
        name: 'Perfectionist',
        description: 'Complete 5 games with perfect score',
        icon: '🏆',
        reward: 500,
        requirement: () => this.gameStats.perfectGames >= 5,
        progress: () => Math.min(this.gameStats.perfectGames, 5),
        maxProgress: 5
      },
      {
        id: 'collector',
        name: 'Collector',
        description: 'Own 3 different snake skins',
        icon: '🐍',
        reward: 1000,
        requirement: () => this.ownedSkins.length >= 3,
        progress: () => Math.min(this.ownedSkins.length, 3),
        maxProgress: 3
      },
      {
        id: 'marathoner',
        name: 'Marathoner',
        description: 'Play for a total of 60 minutes',
        icon: '⏱️',
        reward: 500,
        requirement: () => this.gameStats.totalPlayTime >= 3600000, // 60 minutes in milliseconds
        progress: () => Math.min(Math.floor(this.gameStats.totalPlayTime / 1000), 3600), // Convert to seconds for display
        maxProgress: 3600
      },
      {
        id: 'tutorialMaster',
        name: 'Tutorial Master',
        description: 'Complete the game tutorial',
        icon: '🎓',
        reward: 25,
        requirement: () => this.gameStats.tutorialCompleted === true,
        progress: () => this.gameStats.tutorialCompleted ? 1 : 0,
        maxProgress: 1
      }
    ];
  }

  checkAchievements() {
    console.log('Checking achievements with current stats:', this.gameStats);
    const achievementList = this.getAchievementList();
    let newAchievements = [];

    achievementList.forEach(achievement => {
      const currentlyUnlocked = this.achievements[achievement.id].unlocked;
      const meetsRequirement = achievement.requirement();
      console.log(`Achievement ${achievement.id}: unlocked=${currentlyUnlocked}, meetsRequirement=${meetsRequirement}`);
      
      if (!currentlyUnlocked && meetsRequirement) {
        console.log(`Unlocking achievement: ${achievement.id}`);
        this.achievements[achievement.id].unlocked = true;
        newAchievements.push(achievement);
      }
    });

    if (newAchievements.length > 0) {
      console.log('New achievements unlocked:', newAchievements.map(a => a.id));
      this.saveAchievements();
      newAchievements.forEach(achievement => {
        this.showAchievementNotification(achievement);
      });
    }
  }

  showAchievementNotification(achievement) {
    // Create achievement notification
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
      <div class="achievement-content">
        <div class="achievement-icon">${achievement.icon}</div>
        <div class="achievement-text">
          <h4>Achievement Unlocked!</h4>
          <p>${achievement.name}</p>
          <small>+${achievement.reward} coins reward available!</small>
        </div>
      </div>
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);

    // Remove after 4 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        notification.remove();
      }, 500);
    }, 4000);
  }

  showAchievements() {
    const achievementsModal = document.getElementById("achievements-modal");
    if (achievementsModal) {
      achievementsModal.classList.remove("hidden");
      this.renderAchievements();
    }
  }

  hideAchievements() {
    const achievementsModal = document.getElementById("achievements-modal");
    if (achievementsModal) {
      achievementsModal.classList.add("hidden");
    }
  }

  renderAchievements() {
    const achievementsList = document.getElementById("achievements-list");
    if (!achievementsList) return;

    const achievementList = this.getAchievementList();
    achievementsList.innerHTML = '';

    achievementList.forEach(achievement => {
      const isUnlocked = this.achievements[achievement.id].unlocked;
      const isClaimed = this.achievements[achievement.id].claimed;
      const progress = achievement.progress();
      const maxProgress = achievement.maxProgress;
      const progressPercent = (progress / maxProgress) * 100;

      const achievementElement = document.createElement('div');
      achievementElement.className = `achievement-item ${isUnlocked ? 'unlocked' : 'locked'}`;
      
      achievementElement.innerHTML = `
        <div class="achievement-icon-large">${achievement.icon}</div>
        <div class="achievement-info">
          <h4 class="achievement-title">${achievement.name}</h4>
          <p class="achievement-description">${achievement.description}</p>
          <div class="achievement-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${progressPercent}%"></div>
            </div>
            <span class="progress-text">${progress}/${maxProgress}</span>
          </div>
        </div>
        <div class="achievement-reward">
          ${isUnlocked ? 
            (isClaimed ? 
              '<span class="claimed">✅ Claimed</span>' : 
              `<button class="claim-btn pixel-btn" data-achievement="${achievement.id}">
                Claim ${achievement.reward} coins
              </button>`
            ) : 
            `<span class="reward-preview">+${achievement.reward} coins</span>`
          }
        </div>
      `;

      achievementsList.appendChild(achievementElement);
    });

    // Add event listeners to claim buttons
    achievementsList.querySelectorAll('.claim-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const achievementId = button.dataset.achievement;
        this.claimAchievementReward(achievementId);
      });
    });
  }

  claimAchievementReward(achievementId) {
    const achievement = this.getAchievementList().find(a => a.id === achievementId);
    if (!achievement || !this.achievements[achievementId].unlocked || this.achievements[achievementId].claimed) {
      return;
    }

    // Award coins
    this.coins += achievement.reward;
    this.points += (achievement.reward * 10); // Maintain point-coin ratio

    // Mark as claimed
    this.achievements[achievementId].claimed = true;

    // Save changes
    localStorage.setItem("totalCoins", this.coins.toString());
    localStorage.setItem("totalPoints", this.points.toString());
    this.saveAchievements();

    // Update displays
    const pointsDisplay = document.getElementById("current-points");
    if (pointsDisplay) {
      pointsDisplay.textContent = this.points;
    }

    const coinsDisplay = document.getElementById("current-coins");
    if (coinsDisplay) {
      coinsDisplay.textContent = this.coins;
    }

    // Update achievements modal displays if open
    const achievementsPointsDisplay = document.getElementById("achievements-points");
    if (achievementsPointsDisplay) {
      achievementsPointsDisplay.textContent = this.points;
    }

    const achievementsCoinsDisplay = document.getElementById("achievements-coins");
    if (achievementsCoinsDisplay) {
      achievementsCoinsDisplay.textContent = this.coins;
    }

    // Re-render achievements to show claimed status
    this.renderAchievements();

    // Show success notification
    this.showNotification(`Claimed ${achievement.reward} coins for "${achievement.name}"!`);
    this.playClickSound();
  }

  // Method to be called from games to update stats
  updateGameStats(stats) {
    console.log('Updating game stats with:', stats);
    if (stats.applesEaten) this.gameStats.totalApplesEaten += stats.applesEaten;
    if (stats.correctAnswers) this.gameStats.correctAnswers += stats.correctAnswers;
    if (stats.gamesPlayed) this.gameStats.gamesPlayed += stats.gamesPlayed;
    if (stats.perfectGames) this.gameStats.perfectGames += stats.perfectGames;
    if (stats.perfectGame) this.gameStats.perfectGames += 1; // backward compatibility
    if (stats.totalPlayTime) this.gameStats.totalPlayTime += stats.totalPlayTime;
    if (stats.playTime) this.gameStats.totalPlayTime += stats.playTime; // backward compatibility

    console.log('Updated game stats:', this.gameStats);
    this.saveGameStats();
    this.checkAchievements();
  }

  setupMessageListener() {
    console.log('Setting up message listener...');
    // Listen for game statistics from game windows
    window.addEventListener('message', (event) => {
      console.log('Raw message received:', event);
      console.log('Message origin:', event.origin);
      console.log('Message data:', event.data);
      
      if (event.data && event.data.type === 'gameStatistics') {
        console.log('Processing game statistics:', event.data.stats);
        this.updateGameStats(event.data.stats);
      } else {
        console.log('Message ignored - not gameStatistics type');
      }
    });
    console.log('Message listener setup complete');
  }
}



const settingsBtn = document.getElementById("settings-btn");
const settingsMenu = document.getElementById("settings-menu");

settingsBtn.addEventListener("click", () => {
  settingsMenu.classList.toggle("hidden");
});


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

document.addEventListener("DOMContentLoaded", () => {
  const landingPage = new LandingPage();
  // Make it globally accessible for debugging
  window.landingPageInstance = landingPage;
});