class TutorialManager {
    constructor() {
        this.currentStep = 0;
        this.tutorialSteps = [];
        this.isActive = false;
        this.overlay = null;
        this.highlightElement = null;
        this.tutorialBox = null;
        this.gameInstance = null;
        this.originalGameState = null;
        this.hasCompletedTutorial = localStorage.getItem('tutorialCompleted') === 'true';
        
        this.init();
    }

    init() {
        this.createTutorialElements();
        this.bindEvents();
    }

    createTutorialElements() {
        // Create tutorial overlay
        this.overlay = document.createElement('div');
        this.overlay.id = 'tutorial-overlay';
        this.overlay.className = 'tutorial-overlay hidden';
        
        // Create highlight element
        this.highlightElement = document.createElement('div');
        this.highlightElement.id = 'tutorial-highlight';
        this.highlightElement.className = 'tutorial-highlight';
        
        // Create tutorial box
        this.tutorialBox = document.createElement('div');
        this.tutorialBox.id = 'tutorial-box';
        this.tutorialBox.className = 'tutorial-box pixel-border';
        
        // Add elements to overlay
        this.overlay.appendChild(this.highlightElement);
        this.overlay.appendChild(this.tutorialBox);
        
        // Add overlay to body
        document.body.appendChild(this.overlay);
        
    }

    bindEvents() {
        document.addEventListener('keydown', (e) => {
            if (this.isActive) {
                if (e.key === 'Escape') {
                    // Disable ESC during tutorial - prevent accidental exit
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                } else if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.nextStep();
                }
            }
        });
    }

    startTutorial() {
        this.isActive = true;
        this.currentStep = 0;
        
        // Check if user has completed tutorial before
        this.hasCompletedTutorial = localStorage.getItem('tutorialCompleted') === 'true';
        
        // Define tutorial steps
        this.tutorialSteps = [
            // Landing page introduction
            {
                target: '.game-header',
                title: 'Welcome to SnaQ!',
                content: 'Welcome to SnaQ - Quiz Your Brain, Grow Your Snake! This tutorial will guide you through all the game',
                position: 'bottom',
                action: null
            },
            
            {
                target: '#settings-btn',
                title: 'Sound Settings',
                content: 'Here you can adjust the sound settings. You can turn on or off sound effects and background music.',
                position: 'bottom',
                action: null
            },

            {
                target: '#help-btn',
                title: 'Help',
                content: 'Here you can find information about the game and how to play.',
                position: 'bottom',
                action: null
            },
            {
                target: '#tutorial-btn',
                title: 'Tutorial',
                content: 'Here you can start the tutorial. It will guide you through all the features and gameplay mechanics.',
                position: 'bottom',
                action: null
            },
            {
                target: '#intro-btn',
                title: 'Introduction',
                content: 'Watch our intro animation to get a feel of the game. The animation will automatically start when you click on this button.',
                position: 'bottom',
                action: null
            },

            {
                target: '#about-btn',
                title: 'About Us',
                content: 'Information about the game and developers.',
                position: 'bottom',
                action: null
            },
            // Categories explanation
            {
                target: '.category-buttons',
                title: 'Choose Your Adventure',
                content: 'Here you can select from 4 different quiz categories: Mathematics, English, Science, and General Knowledge.',
                position: 'bottom',
                action: null
            },
            
            // Leaderboard explanation
            {
                target: '.leaderboard-btn',
                title: 'Leaderboard System',
                content: 'Check the leaderboard to see top players across all categories. You can compete with other players and track your ranking!',
                position: 'left',
                action: null
            },
            {
                target: '.achievements-btn',
                title: 'Achievement System',
                content: 'Unlock achievements by completing challenges! Each achievement rewards you with coins.',
                position: 'left',
                action: null
            },
            // Skins explanation
            {
                target: '.skin-shop-btn',
                title: 'Skin Shop',
                content: 'Customize your snake with different skins, accessories, and tiles!',
                position: 'right',
                action: null
            },
            
            
            // Math category selection
            {
                target: '.math-btn',
                title: 'Select Math Category',
                content: 'Let\'s start with Mathematics! Click on the Math button to select it.',
                position: 'bottom',
                action: 'click',
                waitForClick: true
            },
            // Game mode explanation
            {
                target: '.mode-buttons',
                title: 'Game Modes',
                content: 'Choose your game mode:\n• Quiz Mode: Answer 10 questions correctly to win\n• Endless Mode: Keep playing until you run out of lives\n• Timed Mode: Answer as many as you can in 60 seconds',
                position: 'bottom',
                action: null
            },
            
            // Difficulty explanation
            {
                target: '.difficulty-buttons',
                title: 'Difficulty Levels',
                content: 'Select your difficulty:\n• Easy: Simple questions, more time\n• Medium: Moderate challenge\n• Hard: Tough questions, faster pace',
                position: 'bottom',
                action: null
            },
            
            // Select quiz mode
            {
                target: '[data-mode="quiz"]',
                title: 'Choose Quiz Mode',
                content: 'For this tutorial, let\'s select Quiz Mode. Click on "Quiz Mode".',
                position: 'bottom',
                action: 'click',
                waitForClick: true
            },
            
            // Select easy difficulty
            {
                target: '[data-difficulty="easy"]',
                title: 'Choose Easy Difficulty',
                content: 'Now select "Easy" difficulty to get started.',
                position: 'bottom',
                action: 'click',
                waitForClick: true
            },
            
            // Start the actual game
            {
                target: '#startGameBtn',
                title: 'Begin the Game',
                content: 'Perfect! Now click "Start Game" to enter the math game.',
                position: 'top',
                action: 'click',
                waitForClick: true,
                callback: () => {
                    // Wait for game to load then continue tutorial in game
                    setTimeout(() => {
                        this.continueInGame();
                    }, 2000);
                }
            }
        ];
        
        this.showStep(0);
    }

    continueInGame() {
        // Enhanced math game tutorial with comprehensive step-by-step guidance
        const gameSteps = [
            {
                target: '.pixel-hud',
                title: '🎮 Welcome to Math SnaQ!',
                content: 'Welcome to the Mathematics game! This tutorial will guide you through every aspect of the game. Let\'s start by understanding the game interface.',
                position: 'bottom',
                action: null
            },
            
            {
                target: '.score',
                title: '📊 Score Counter',
                content: 'This shows your current score. You earn 10 points for each correct answer! The score helps you unlock new snake skins in the shop.',
                position: 'bottom',
                action: null,
                highlight: true
            },
            
            {
                target: '.lives',
                title: '❤️ Lives System',
                content: 'These hearts show your remaining lives. You start with 3 lives and lose one for each wrong answer or if you bite yourself. Game over when you reach 0!',
                position: 'bottom',
                action: null,
                highlight: true
            },
            
            {
                target: '.correct',
                title: '✅ Correct Answers Counter',
                content: 'This tracks your progress! In Quiz mode, you need 10 correct answers to win. Each correct answer makes your snake grow longer.',
                position: 'bottom',
                action: null,
                highlight: true
            },
            
            {
                target: '.pixel-question',
                title: '❓ Math Question Display',
                content: 'The current math question appears here. Read it carefully and calculate the answer in your head before moving your snake!',
                position: 'bottom',
                action: null,
                highlight: true
            },
            
            {
                target: '#game-canvas',
                title: '🍎 Answer Apples Explanation',
                content: 'Look at the game area! You\'ll see 4 red apples, each with a different number. These are your answer choices (A, B, C, D). Your job is to find the apple with the CORRECT answer to the math question.',
                position: 'top',
                action: null,
                highlight: true
            },
            
            {
                target: '#game-canvas',
                title: '🐍 Your Snake',
                content: 'This green snake is YOU! You control it to eat the correct answer apple. Be careful - eating the wrong apple will cost you a life!',
                position: 'top',
                action: null
            },
            
            {
                target: '#game-canvas',
                title: '🕹️ Movement Tutorial - Try It Now!',
                content: 'Time to move! Use these controls to move your snake:\n\n🔸 WASD Keys: W=Up, A=Left, S=Down, D=Right\n🔸 Arrow Keys: ↑↓←→\n\nTry moving your snake now using either control method!',
                position: 'top',
                action: 'movement',
                waitForMovement: true
            },
            
            {
                target: '.pixel-question',
                title: '🧮 Solve the Math Problem',
                content: 'Excellent movement! Now look at the math question above and calculate the answer. Once you know the correct answer, guide your snake to eat the apple with that number!',
                position: 'bottom',
                action: 'answer',
                waitForAnswer: true
            },
            
            {
                target: '#game-canvas',
                title: 'Perfect! Snake Growth',
                content: 'Amazing! When you eat the correct apple, three things happen:\n\n✅ Your snake grows longer\n📈 You earn 10 points\n🔢 Your correct counter increases\n\nThe longer your snake gets, the more challenging the game becomes!',
                position: 'top',
                action: null
            },
            
            {
                target: '.pixel-instructions',
                title: '⚡ Sprint Feature - Hold SHIFT!',
                content: 'Now learn the sprint feature! Hold the SHIFT key to make your snake move faster. This is useful when you need to reach an apple quickly or avoid danger. Try holding SHIFT now!',
                position: 'top',
                action: 'sprint',
                waitForSprint: true
            },
            
            {
                target: '.pixel-instructions',
                title: '⏸️ Pause Game - Press ESC!',
                content: 'Great sprinting! Now learn to pause. Press the ESC key to pause the game anytime. This opens a menu where you can resume, get help, or return to main menu. Try pressing ESC now!',
                position: 'top',
                action: 'pause',
                waitForPause: true
            },
            
            {
                target: '.pixel-instructions',
                title: '▶️ Resume & Restart Controls',
                content: 'Perfect! When paused, you can:\n\n▶️ Press SPACE to resume\n🔄 Press R to restart the game\n📖 Click "How to Play?" for help\n🏠 Click "Main Menu" to exit\n\nThese controls help you manage your game experience.',
                position: 'top',
                action: null
            },
            
            {
                target: '.pixel-instructions',
                title: '🚀 Advanced Sprint Strategy',
                content: 'Master tip: Use sprint strategically! Your energy bar (if visible) shows sprint energy. Sprint when:\n\n⚡ Racing to get the correct apple\n🚫 Avoiding walls or your own tail\n⏰ Time is running out\n\nSave energy for when you really need it!',
                position: 'top',
                action: null
            },
            
            {
                target: null,
                title: 'Tutorial Complete - You\'re Ready!',
                content: '🎉 Congratulations! You\'ve mastered all the game mechanics:\n\n✅ Understanding the interface (Score, Lives, Correct Counter)\n✅ Reading math questions and finding correct apples\n✅ Snake movement with WASD/Arrow keys\n✅ Answering questions correctly\n✅ Using sprint (SHIFT) strategically\n✅ Pausing (ESC) and resuming (SPACE)\n✅ Restarting games (R)\n\n🎯 Goal: Get 10 correct answers to win!\n\nNow play on your own and have fun! Thank you for playing the tutorial!',
                position: 'center',
                action: 'complete'
            }
        ];
        
        this.tutorialSteps = gameSteps;
        this.currentStep = 0;
        this.showStep(0);
    }

    showStep(stepIndex) {
        console.log(`showStep called with index: ${stepIndex}, total steps: ${this.tutorialSteps.length}`);
        
        if (stepIndex >= this.tutorialSteps.length) {
            console.log('Tutorial completed - no more steps');
            this.completeTutorial();
            return;
        }

        const step = this.tutorialSteps[stepIndex];
        console.log(`Showing step ${stepIndex}: ${step.title}`);
        this.currentStep = stepIndex;
        
        // Show overlay
        this.overlay.classList.remove('hidden');
        
        // Position highlight and tutorial box
        this.positionElements(step);
        
        // Update tutorial box content
        this.updateTutorialBox(step);
        
        // Handle step actions
        this.handleStepAction(step);
    }

    positionElements(step) {
        // Remove old clickable area unless this step explicitly needs it
        const existingArea = document.getElementById('tutorial-clickable-area');
        if (existingArea && !step.waitForClick) {
            existingArea.remove();
        }
    
        if (!step.target) {
            // Center position for final step
            this.highlightElement.style.display = 'none';
            this.tutorialBox.style.position = 'fixed';
            this.tutorialBox.style.top = '50%';
            this.tutorialBox.style.left = '50%';
            this.tutorialBox.style.transform = 'translate(-50%, -50%)';
            return;
        }
    
        const targetElement = document.querySelector(step.target);
    
        // 🔧 FIX: don’t skip if missing, just retry
        if (!targetElement) {
            console.warn(`Tutorial target not found: ${step.target}, retrying...`);
            setTimeout(() => this.showStep(this.currentStep), 300);
            return;
        }
    
        // Calculate position + highlight
        const rect = targetElement.getBoundingClientRect();
        this.highlightElement.style.display = 'block';
        this.highlightElement.style.top = `${rect.top + window.scrollY - 5}px`;
        this.highlightElement.style.left = `${rect.left + window.scrollX - 5}px`;
        this.highlightElement.style.width = `${rect.width + 10}px`;
        this.highlightElement.style.height = `${rect.height + 10}px`;
    
        // Position tutorial box
        let top = rect.top + window.scrollY;
        let left = rect.left + window.scrollX;
    
        switch (step.position) {
            case 'top':
                top -= this.tutorialBox.offsetHeight + 10;
                left += (rect.width - this.tutorialBox.offsetWidth) / 2;
                break;
            case 'bottom':
                top += rect.height + 10;
                left += (rect.width - this.tutorialBox.offsetWidth) / 2;
                break;
            case 'left':
                top += (rect.height - this.tutorialBox.offsetHeight) / 2;
                left -= this.tutorialBox.offsetWidth + 10;
                break;
            case 'right':
                top += (rect.height - this.tutorialBox.offsetHeight) / 2;
                left += rect.width + 10;
                break;
        }
        
        this.tutorialBox.style.position = 'absolute';
        
        // Ensure the tutorial box stays within viewport bounds
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const boxWidth = this.tutorialBox.offsetWidth;
        const boxHeight = this.tutorialBox.offsetHeight;
        
        // Adjust left position if the box would go off the right edge
        if (left + boxWidth > viewportWidth) {
            left = viewportWidth - boxWidth - 10; // 10px margin from right
        }
        // Adjust left position if the box would go off the left edge
        if (left < 10) {
            left = 10; // 10px margin from left
        }
        
        // Adjust top position if the box would go off the bottom
        if (top + boxHeight > viewportHeight + window.scrollY) {
            // Try to position above the target if there's more space
            if (rect.top - boxHeight - 10 > 0) {
                top = rect.top + window.scrollY - boxHeight - 10;
            } else {
                // If not enough space above, just keep it at the bottom with margin
                top = viewportHeight + window.scrollY - boxHeight - 10;
            }
        }
        // Adjust top position if the box would go off the top
        if (top < window.scrollY + 10) {
            top = window.scrollY + 10; // 10px margin from top
        }
        
        this.tutorialBox.style.top = `${top}px`;
        this.tutorialBox.style.left = `${left}px`;
        this.tutorialBox.style.transform = 'none';
        
        // Create clickable area if this step requires it
        if (step.waitForClick) {
            this.createClickableArea(targetElement, rect);
        }
    }
    
    createClickableArea(targetElement, rect) {
        // Remove any existing clickable area
        const existingArea = document.getElementById('tutorial-clickable-area');
        if (existingArea) {
            existingArea.remove();
        }

        // Create a transparent clickable area that covers the highlighted element
        const clickableArea = document.createElement('div');
        clickableArea.id = 'tutorial-clickable-area';
        clickableArea.style.cssText = `
            position: fixed;
            top: ${rect.top}px;
            left: ${rect.left}px;
            width: ${rect.width}px;
            height: ${rect.height}px;
            z-index: 100002;
            cursor: pointer;
            background: rgba(0, 255, 0, 0.1);
            border: 2px dashed #00ff00;
            pointer-events: auto;
        `;
        
        // Add click handler to the clickable area
        const clickHandler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log(`Tutorial click detected on highlighted element`);
            
            // Remove the clickable area
            clickableArea.remove();
            
            // Trigger the actual element's click
            targetElement.click();
            
            // Don't call nextStep() here - let the actual button logic handle navigation
            // The step's callback or waitForClick logic will handle advancing
        };
        
        clickableArea.addEventListener('click', clickHandler);
        document.body.appendChild(clickableArea);
    }

    updateTutorialBox(step) {
        const isLastStep = this.currentStep === this.tutorialSteps.length - 1;
        const hasWaitCondition = step.waitForClick || step.waitForMovement || step.waitForAnswer ||
                                 step.waitForSprint || step.waitForPause;
    
        const canSkip = !hasWaitCondition;
    
        // Render HTML WITHOUT inline onclick attributes
        this.tutorialBox.innerHTML = `
            <div class="tutorial-header">
                <h3>${step.title}</h3>
            </div>
            <div class="tutorial-content">
                <p>${step.content.replace(/\n/g, '<br>')}</p>
                ${step.action === 'movement' ? this.createMovementIndicator() : ''}
                ${step.action === 'sprint' ? this.createSprintIndicator() : ''}
                ${step.action === 'pause' ? this.createPauseIndicator() : ''}
            </div>
            <div class="tutorial-footer">
                <div class="tutorial-progress">Step ${this.currentStep + 1} of ${this.tutorialSteps.length}</div>
                <div class="tutorial-buttons">
                    ${!hasWaitCondition && !isLastStep ? `<button class="tutorial-btn tutorial-next">Next</button>` : ''}
                    ${!hasWaitCondition && isLastStep ? `<button class="tutorial-btn tutorial-finish">Finish</button>` : ''}
                    ${canSkip ? `<button class="tutorial-btn tutorial-skip">Skip Tutorial</button>` : ''}
                </div>
            </div>
        `;
    
        // Ensure overlay and box stacking order (tutorialBox above clickable area)
        this.overlay.style.zIndex = '99999';
        this.tutorialBox.style.zIndex = '100005';
    
        // Attach listeners (only on the freshly-created elements)
        const nextBtn = this.tutorialBox.querySelector('.tutorial-next');
        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log(`Next button clicked on step ${this.currentStep}`);
                this.nextStep();
            });
        }
    
        const finishBtn = this.tutorialBox.querySelector('.tutorial-finish');
        if (finishBtn) {
            finishBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.completeTutorial();
            });
        }
    
        const skipBtn = this.tutorialBox.querySelector('.tutorial-skip');
        if (skipBtn) {
            skipBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.skipTutorial();
            });
        }
    }

    handleStepAction(step) {
        if (!step.action) return;
        
        switch (step.action) {
            case 'startGame':
                // Navigate to math game
                window.location.href = 'games/math/math-game.html?tutorial=true';
                break;
                
            case 'movement':
                this.waitForMovement();
                break;
            case 'complete':
                this.completeTutorial();
                break;
        }
        
        // Legacy support for old action format
        if (step.waitForClick) {
            const clickableArea = document.getElementById('tutorial-clickable-area');
            const targetElement = document.querySelector(step.target);
        
            if (clickableArea && targetElement) {
                const clickHandler = () => {
                    clickableArea.removeEventListener('click', clickHandler);
                    if (step.callback) {
                        step.callback();
                    } else {
                        setTimeout(() => this.nextStep(), 500);
                    }
                };
                clickableArea.addEventListener('click', clickHandler);
            }
        } else if (step.waitForMovement) {
            this.waitForMovement();
        } else if (step.waitForAnswer) {
            this.waitForAnswer();
        }
    }

    waitForMovement() {
        let moved = false;
        console.log('Tutorial: Waiting for movement...');
        
        // Add visual movement indicator
        this.addMovementIndicator();
        
        const moveHandler = (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key.toLowerCase())) {
                if (!moved) {
                    moved = true;
                    console.log('Tutorial: Movement detected!');
                    document.removeEventListener('keydown', moveHandler);
                    this.removeMovementIndicator();
                    setTimeout(() => this.nextStep(), 1000);
                }
            }
        };
        document.addEventListener('keydown', moveHandler);
    }

    waitForAnswer() {
        // Enhanced answer waiting with visual feedback
        console.log('Tutorial: Waiting for correct answer...');
        
        // Add visual indicator for answering
        this.addAnswerIndicator();
        
        // This will be triggered by the game when player answers correctly
        window.tutorialAnswered = () => {
            console.log('Tutorial: Correct answer detected!');
            this.removeAnswerIndicator();
            setTimeout(() => this.nextStep(), 1500);
        };
        
        // Also listen for game events that indicate correct answer
        const checkForCorrectAnswer = () => {
            const correctElement = document.getElementById('correct-value');
            if (correctElement) {
                const currentCorrect = parseInt(correctElement.textContent) || 0;
                if (currentCorrect > this.lastCorrectCount) {
                    this.lastCorrectCount = currentCorrect;
                    if (window.tutorialAnswered) {
                        window.tutorialAnswered();
                    }
                }
            }
        };
        
        this.lastCorrectCount = parseInt(document.getElementById('correct-value')?.textContent) || 0;
        this.answerCheckInterval = setInterval(checkForCorrectAnswer, 500);
    }

    waitForSprint() {
        console.log('Tutorial: Waiting for sprint...');
        
        const sprintHandler = (event) => {
            if (event.key === 'Shift') {
                console.log('Tutorial: Sprint detected!');
                document.removeEventListener('keydown', sprintHandler);
                this.removeSprintIndicator();
                this.addSprintSuccessIndicator();
                setTimeout(() => {
                    this.nextStep();
                }, 2000);
            }
        };
        document.addEventListener('keydown', sprintHandler);
        
        // Add visual indicator
        this.addSprintIndicator();
    }

    waitForPause() {
        console.log('Tutorial: Waiting for pause...');
        
        const pauseHandler = (event) => {
            if (event.key === 'Escape') {
                console.log('Tutorial: Pause detected!');
                document.removeEventListener('keydown', pauseHandler);
                this.removePauseIndicator();
                setTimeout(() => {
                    this.nextStep();
                }, 1000);
            }
        };
        document.addEventListener('keydown', pauseHandler);
        
        // Add visual indicator
        this.addPauseIndicator();
    }

    addMovementIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'tutorial-movement-indicator';
        indicator.className = 'tutorial-movement-indicator';
        indicator.innerHTML = `
            <div class="movement-keys">
                <div class="movement-title">Try Moving!</div>
                <div class="key-row">
                    <div class="key">W</div>
                </div>
                <div class="key-row">
                    <div class="key">A</div>
                    <div class="key">S</div>
                    <div class="key">D</div>
                </div>
                <div class="or-text">OR</div>
                <div class="arrow-keys">
                    <div class="key">↑</div>
                    <div class="key">←</div>
                    <div class="key">↓</div>
                    <div class="key">→</div>
                </div>
            </div>
        `;
        indicator.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px;
            border-radius: 10px;
            z-index: 10001;
            animation: pulse 1s infinite;
            text-align: center;
        `;
        document.body.appendChild(indicator);
        
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.remove();
            }
        }, 10000);
    }

    addSprintIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'tutorial-sprint-indicator';
        indicator.className = 'tutorial-sprint-indicator';
        indicator.innerHTML = `
            <div class="sprint-key">
                <div class="key shift-key">SHIFT</div>
                <div class="sprint-text">Hold to Sprint!</div>
                <div class="sprint-subtext">Make your snake move faster</div>
            </div>
        `;
        indicator.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(255, 165, 0, 0.9);
            color: white;
            padding: 15px;
            border-radius: 10px;
            z-index: 10001;
            animation: pulse 1s infinite;
            text-align: center;
        `;
        document.body.appendChild(indicator);
        
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.remove();
            }
        }, 10000);
    }

    addPauseIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'tutorial-pause-indicator';
        indicator.className = 'tutorial-pause-indicator';
        indicator.innerHTML = `
            <div class="pause-key">
                <div class="key esc-key">ESC</div>
                <div class="pause-text">Press to Pause!</div>
            </div>
        `;
        indicator.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(255, 0, 0, 0.9);
            color: white;
            padding: 15px;
            border-radius: 10px;
            z-index: 10001;
            animation: pulse 1s infinite;
            text-align: center;
        `;
        document.body.appendChild(indicator);
        
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.remove();
            }
        }, 10000);
    }

    addAnswerIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'tutorial-answer-indicator';
        indicator.className = 'tutorial-answer-indicator';
        indicator.innerHTML = `
            <div class="answer-prompt">
                <div class="answer-icon">🧮</div>
                <div class="answer-text">Calculate the answer and eat the correct apple!</div>
                <div class="answer-subtext">Look at the question above ↑</div>
            </div>
        `;
        indicator.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0, 150, 255, 0.9);
            color: white;
            padding: 15px;
            border-radius: 10px;
            z-index: 10001;
            animation: pulse 1s infinite;
            text-align: center;
            max-width: 250px;
        `;
        document.body.appendChild(indicator);
    }

    addSprintSuccessIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'tutorial-sprint-success-indicator';
        indicator.className = 'tutorial-sprint-success-indicator';
        indicator.innerHTML = `
            <div class="sprint-success">
                <div class="success-icon">⚡✅</div>
                <div class="success-text">Great! You're sprinting!</div>
            </div>
        `;
        indicator.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0, 255, 0, 0.9);
            color: white;
            padding: 15px;
            border-radius: 10px;
            z-index: 10001;
            text-align: center;
        `;
        document.body.appendChild(indicator);
        
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.remove();
            }
        }, 2000);
    }

    // Indicator removal functions
    removeAnswerIndicator() {
        const indicator = document.getElementById('tutorial-answer-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    removeMovementIndicator() {
        const indicator = document.getElementById('tutorial-movement-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    removeSprintIndicator() {
        const indicator = document.getElementById('tutorial-sprint-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    removePauseIndicator() {
        const indicator = document.getElementById('tutorial-pause-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    nextStep() {
        console.log(`Moving from step ${this.currentStep} to step ${this.currentStep + 1}`);
        console.log(`Total steps: ${this.tutorialSteps.length}`);
        
        // Clean up any active intervals
        if (this.answerCheckInterval) {
            clearInterval(this.answerCheckInterval);
            this.answerCheckInterval = null;
        }
        
        // Remove any active indicators
        this.removeAnswerIndicator();
        this.removeMovementIndicator();
        this.removeSprintIndicator();
        this.removePauseIndicator();
        
        // Add additional debugging
        if (this.currentStep + 1 < this.tutorialSteps.length) {
            const nextStep = this.tutorialSteps[this.currentStep + 1];
            console.log(`Next step will be: "${nextStep.title}"`);
        }
        
        this.showStep(this.currentStep + 1);
    }

    skipTutorial() {
        this.completeTutorial();
    }

    completeTutorial() {
        this.isActive = false;
        this.overlay.classList.add('hidden');
        
        // Clean up any remaining elements
        if (this.clickableArea) {
            this.clickableArea.remove();
        }
        
        // Mark tutorial as completed
        const wasAlreadyCompleted = localStorage.getItem('tutorialCompleted') === 'true';
        localStorage.setItem('tutorialCompleted', 'true');
        
        // Dispatch tutorial complete event only if it wasn't already completed
        if (!wasAlreadyCompleted) {
            const event = new CustomEvent('tutorialComplete', {
                bubbles: true,
                cancelable: true
            });
            document.dispatchEvent(event);
        }
        
        // Award tutorial completion achievement
        this.awardTutorialAchievement();
        
        // Clean up any event listeners
        window.tutorialAnswered = null;
        
        // Show completion message
        this.showCompletionMessage();
    }

    awardTutorialAchievement() {
        // Update game stats for tutorial completion
        let gameStats = JSON.parse(localStorage.getItem('gameStats')) || {
            totalGamesPlayed: 0,
            totalCorrectAnswers: 0,
            totalWrongAnswers: 0,
            longestStreak: 0,
            tutorialCompleted: false
        };
        
        gameStats.tutorialCompleted = true;
        localStorage.setItem('gameStats', JSON.stringify(gameStats));
        
        // Check if landing page exists to trigger achievement check
        if (window.landingPage && typeof window.landingPage.checkAchievements === 'function') {
            window.landingPage.checkAchievements();
        }
        
        // Show tutorial achievement notification
        this.showTutorialAchievementNotification();
    }

    showTutorialAchievementNotification() {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification tutorial-achievement';
        notification.innerHTML = `
            <div class="achievement-content">
                <div class="achievement-icon">🎓</div>
                <div class="achievement-text">
                    <h4>Achievement Unlocked!</h4>
                    <p>Tutorial Master</p>
                    <small>+25 coins reward available!</small>
                </div>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            z-index: 10000;
            transform: translateX(400px);
            transition: transform 0.5s ease;
            max-width: 300px;
            font-family: "Press Start 2P", monospace;
            font-size: 8px;
            line-height: 1.4;
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Animate out after 4 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 500);
        }, 4000);
    }

    showCompletionMessage() {
        // Use the same notification system as the shop
        const notification = document.createElement("div");
        notification.id = "notification";
        notification.className = "";
        notification.textContent = "Tutorial Complete! You're now ready to play SnaQ!";
        document.body.appendChild(notification);

        // Show the notification
        setTimeout(() => notification.classList.add("show"), 10);

        // Hide after 3 seconds
        setTimeout(() => {
            notification.classList.remove("show");
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 1000);
        }, 3000);
    }

    // Check if tutorial has been completed
    static hasCompletedTutorial() {
        return localStorage.getItem('tutorialCompleted') === 'true';
    }

    // Reset tutorial completion status
    static resetTutorial() {
        localStorage.removeItem('tutorialCompleted');
    }
}

// Initialize tutorial manager and make it globally available
window.tutorialManager = null;
document.addEventListener('DOMContentLoaded', () => {
    window.tutorialManager = new TutorialManager();
    console.log('Tutorial manager initialized');
});
