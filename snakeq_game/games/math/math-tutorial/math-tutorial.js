class MathTutorialManager {
    constructor(gameInstance) {
        this.gameInstance = gameInstance;
        this.currentStep = 0;
        this.tutorialSteps = [];
        this.isActive = false;
        this.overlay = null;
        this.highlightElement = null;
        this.tutorialBox = null;
        this.originalGameState = null;
        this.practiceMode = false;
        this.practiceRequiredCorrect = 3;
        this.practiceStartCorrect = 0;
        
        this.init();
    }

    init() {
        this.createTutorialElements();
        this.bindEvents();
    }

    createTutorialElements() {
        // Create tutorial overlay
        this.overlay = document.createElement('div');
        this.overlay.id = 'math-tutorial-overlay';
        this.overlay.className = 'tutorial-overlay hidden';
        
        // Create highlight element
        this.highlightElement = document.createElement('div');
        this.highlightElement.id = 'math-tutorial-highlight';
        this.highlightElement.className = 'tutorial-highlight';
        
        // Create tutorial box
        this.tutorialBox = document.createElement('div');
        this.tutorialBox.id = 'math-tutorial-box';
        this.tutorialBox.className = 'tutorial-box';
        
        // Add elements to overlay
        this.overlay.appendChild(this.highlightElement);
        this.overlay.appendChild(this.tutorialBox);
        
        // Add overlay to body
        document.body.appendChild(this.overlay);
    }

    bindEvents() {
        document.addEventListener('keydown', (e) => {
            if (this.isActive) {
                if (e.key === 'Escape' && !this.practiceMode) {
                    // Disable ESC during tutorial except in practice mode
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                } else if (e.key === 'Enter' || e.key === ' ') {
                    if (!this.isWaitingForAction()) {
                        e.preventDefault();
                        this.nextStep();
                    }
                }
            }
        });
    }

    startTutorial() {
        this.isActive = true;
        this.currentStep = 0;
        this.practiceMode = false;
        
        // Pause the game during tutorial
        if (this.gameInstance && this.gameInstance.pauseGame) {
            this.gameInstance.pauseGame();
        }
        
        // Define comprehensive tutorial steps
        this.tutorialSteps = [
            // Step 1: Welcome & Interface Overview
            {
                target: '.game-header-bar',
                title: '🎮 Welcome to Math SnaQ Tutorial!',
                content: 'Welcome to the Mathematics Snake Quiz! This tutorial will teach you everything you need to know to master the game. Let\'s start by exploring the game interface.',
                position: 'bottom',
                action: null
            },
            
            // Step 2: Score Counter
            {
                target: '.score',
                title: '📊 Score Counter',
                content: 'This shows your current score. You earn 10 points for each correct answer! Your score helps unlock new snake skins in the shop and gets recorded on the leaderboard.',
                position: 'bottom',
                action: null,
                highlight: true
            },
            
            // Step 3: Lives System
            {
                target: '.lives',
                title: '❤️ Lives System',
                content: 'These hearts show your remaining lives. You start with 3 lives and lose one for each wrong answer or if you bite yourself. The game ends when you reach 0 lives!',
                position: 'bottom',
                action: null,
                highlight: true
            },
            
            // Step 4: Correct Counter
            {
                target: '.correct',
                title: '✅ Correct Answers Progress',
                content: 'This tracks how many questions you\'ve answered correctly. In Quiz mode, you need 10 correct answers to win. Each correct answer makes your snake grow longer!',
                position: 'bottom',
                action: null,
                highlight: true
            },
            
            // Step 5: Question Display
            {
                target: '.question',
                title: '❓ Math Question Display',
                content: 'The current math question appears here. Read it carefully and calculate the answer in your head before moving your snake to the correct apple!',
                position: 'bottom',
                action: null,
                highlight: true
            },
            
            // Step 6: Answer Apples Explanation
            {
                target: '#game-canvas',
                title: '🍎 Answer Apples System',
                content: 'Look at the game area! You\'ll see 4 red apples, each labeled A, B, C, D with different numbers. These are your answer choices. Your goal is to eat the apple with the CORRECT answer to the math question.',
                position: 'top',
                action: null,
                highlight: true
            },
            
            // Step 7: Snake Introduction
            {
                target: '#game-canvas',
                title: '🐍 Your Snake Character',
                content: 'This green snake is YOU! You control it to navigate around the game area and eat the correct answer apples. Be careful - eating the wrong apple will cost you a life and points!',
                position: 'top',
                action: null
            },
            
            // Step 8: Movement Tutorial
            {
                target: '#game-canvas',
                title: '🕹️ Movement Controls - Try It Now!',
                content: 'Time to learn movement! Use these controls:\n\n🔸 WASD Keys: W=Up, A=Left, S=Down, D=Right\n🔸 Arrow Keys: ↑↓←→\n\nTry moving your snake now using either control method!',
                position: 'top',
                action: 'movement',
                waitForMovement: true
            },
            
            // Step 9: Question Solving
            {
                target: '.question',
                title: '🧮 Solve & Answer - Practice Time!',
                content: 'Excellent movement! Now look at the math question and calculate the answer. Once you know the correct answer, guide your snake to eat the apple with that number. Go ahead and try it!',
                position: 'bottom',
                action: 'answer',
                waitForAnswer: true
            },
            
            // Step 10: Snake Growth Celebration
            {
                target: '#game-canvas',
                title: '🎉 Perfect! Snake Growth Mechanics',
                content: 'Amazing! When you eat the correct apple, several things happen:\n\n✅ Your snake grows longer\n📈 You earn 10 points\n🔢 Your correct counter increases\n\nThe longer your snake gets, the more challenging navigation becomes!',
                position: 'top',
                action: null
            },
            
            // Step 11: Sprint Feature
            {
                target: '.instructions',
                title: '⚡ Sprint Feature - Hold SHIFT!',
                content: 'Now learn the sprint feature! Hold the SHIFT key to make your snake move faster. This is useful when you need to reach an apple quickly or avoid danger. Try holding SHIFT now!',
                position: 'top',
                action: 'sprint',
                waitForSprint: true
            },
            
            // Step 12: Pause Game
            {
                target: '.instructions',
                title: '⏸️ Pause Game - Press ESC!',
                content: 'Great sprinting! Now learn to pause. Press the ESC key to pause the game anytime. This opens a menu where you can resume, get help, or return to main menu. Try pressing ESC now!',
                position: 'top',
                action: 'pause',
                waitForPause: true
            },
            
            // Step 13: Resume & Restart Controls
            {
                target: '.instructions',
                title: '▶️ Resume & Restart Controls',
                content: 'Perfect! When paused, you have several options:\n\n▶️ Press SPACE to resume quickly\n🔄 Press R to restart the game\n📖 Click "How to Play?" for help\n🏠 Click "Main Menu" to exit\n\nThese controls help you manage your game experience.',
                position: 'top',
                action: null
            },
            
            // Step 14: Advanced Strategy Tips
            {
                target: '.instructions',
                title: '🚀 Advanced Sprint Strategy',
                content: 'Master tip: Use sprint strategically! Sprint when:\n\n⚡ Racing to get the correct apple first\n🚫 Avoiding walls or your own tail\n⏰ Time is running out (in timed mode)\n\nSave energy for when you really need it!',
                position: 'top',
                action: null
            },
            
            // Step 15: Practice Phase Introduction
            {
                target: null,
                title: '🎯 Practice Phase - Your Turn!',
                content: 'Now it\'s time to practice on your own! You need to answer 3 questions correctly without guidance to complete the tutorial. The game will resume and you can play freely. Good luck!',
                position: 'center',
                action: 'startPractice'
            },
            
            // Step 16: Tutorial Completion
            {
                target: null,
                title: '🎓 Tutorial Complete - You\'re Ready!',
                content: '🎉 Congratulations! You\'ve mastered Math SnaQ:\n\n✅ Understanding the interface\n✅ Reading math questions\n✅ Snake movement controls\n✅ Answering questions correctly\n✅ Using sprint strategically\n✅ Game management (pause/resume)\n\n🎯 Goal: Get 10 correct answers to win!\n\nThank you for playing the tutorial!',
                position: 'center',
                action: 'complete'
            }
        ];
        
        this.showStep(0);
    }

    showStep(stepIndex) {
        if (stepIndex >= this.tutorialSteps.length) {
            this.completeTutorial();
            return;
        }

        const step = this.tutorialSteps[stepIndex];
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
        const existingArea = document.getElementById('math-tutorial-clickable-area');
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
        if (!targetElement) {
            console.warn(`Math tutorial target not found: ${step.target}`);
            this.nextStep();
            return;
        }
    
        const rect = targetElement.getBoundingClientRect();
        
        // Enhanced highlighting with special effects for important elements
        this.highlightElement.style.display = 'block';
        this.highlightElement.style.top = (rect.top - 10) + 'px';
        this.highlightElement.style.left = (rect.left - 10) + 'px';
        this.highlightElement.style.width = (rect.width + 20) + 'px';
        this.highlightElement.style.height = (rect.height + 20) + 'px';
        
        // Add special highlighting for key game elements
        if (step.highlight) {
            this.highlightElement.style.border = '3px solid #00ff00';
            this.highlightElement.style.boxShadow = '0 0 20px #00ff00, inset 0 0 20px rgba(0, 255, 0, 0.2)';
            this.highlightElement.style.animation = 'tutorialPulse 2s infinite';
        } else {
            this.highlightElement.style.border = '2px solid #ffff00';
            this.highlightElement.style.boxShadow = '0 0 15px #ffff00';
            this.highlightElement.style.animation = 'none';
        }
        
        // Position tutorial box
        this.positionTutorialBox(rect, step.position);
    }

    positionTutorialBox(targetRect, position) {
        const boxWidth = 550;
        const boxHeight = 200;
        const margin = 20;
        
        let top, left;
        
        switch (position) {
            case 'top':
                top = targetRect.top - boxHeight - margin;
                left = targetRect.left + (targetRect.width / 2) - (boxWidth / 2);
                break;
            case 'bottom':
                top = targetRect.bottom + margin;
                left = targetRect.left + (targetRect.width / 2) - (boxWidth / 2);
                break;
            case 'left':
                top = targetRect.top + (targetRect.height / 2) - (boxHeight / 2);
                left = targetRect.left - boxWidth - margin;
                break;
            case 'right':
                top = targetRect.top + (targetRect.height / 2) - (boxHeight / 2);
                left = targetRect.right + margin;
                break;
            default:
                top = targetRect.bottom + margin;
                left = targetRect.left + (targetRect.width / 2) - (boxWidth / 2);
        }
        
        // Keep box within viewport
        top = Math.max(10, Math.min(top, window.innerHeight - boxHeight - 10));
        left = Math.max(10, Math.min(left, window.innerWidth - boxWidth - 10));
        
        this.tutorialBox.style.position = 'fixed';
        this.tutorialBox.style.top = top + 'px';
        this.tutorialBox.style.left = left + 'px';
        this.tutorialBox.style.width = boxWidth + 'px';
        this.tutorialBox.style.minHeight = boxHeight + 'px';
        this.tutorialBox.style.transform = 'none';
    }

    updateTutorialBox(step) {
        const isLastStep = this.currentStep === this.tutorialSteps.length - 1;
        const hasWaitCondition = step.waitForClick || step.waitForMovement || step.waitForAnswer ||
                                 step.waitForSprint || step.waitForPause;
    
        this.tutorialBox.innerHTML = `
            <div class="tutorial-header">
                <h3>${step.title}</h3>
            </div>
            <div class="tutorial-content">
                <p>${step.content.replace(/\n/g, '<br>')}</p>
            </div>
            <div class="tutorial-footer">
                <div class="tutorial-progress">
                    Step ${this.currentStep + 1} of ${this.tutorialSteps.length}
                </div>
                <div class="tutorial-buttons">
                    ${!hasWaitCondition ? `<button class="tutorial-btn tutorial-next">
                        ${isLastStep ? 'Finish' : 'Next'}
                    </button>` : ''}
                    <button class="tutorial-btn tutorial-skip">Skip Tutorial</button>
                </div>
            </div>
        `;
    
        // Ensure tutorial overlay has highest z-index
        this.overlay.style.zIndex = '99999';
        this.tutorialBox.style.zIndex = '100000';
    
        // Attach event listeners
        const nextBtn = this.tutorialBox.querySelector('.tutorial-next');
        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.nextStep();
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
            case 'movement':
                this.waitForMovement();
                break;
            case 'answer':
                this.waitForAnswer();
                break;
            case 'sprint':
                this.waitForSprint();
                break;
            case 'pause':
                this.waitForPause();
                break;
            case 'startPractice':
                this.startPracticePhase();
                break;
            case 'complete':
                this.completeTutorial();
                break;
        }
    }

    waitForMovement() {
        let moved = false;
        console.log('Math Tutorial: Waiting for movement...');
        
        // Add visual movement indicator
        this.addMovementIndicator();
        
        const moveHandler = (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key.toLowerCase())) {
                if (!moved) {
                    moved = true;
                    console.log('Math Tutorial: Movement detected!');
                    document.removeEventListener('keydown', moveHandler);
                    this.removeMovementIndicator();
                    setTimeout(() => this.nextStep(), 1000);
                }
            }
        };
        document.addEventListener('keydown', moveHandler);
    }

    waitForAnswer() {
        console.log('Math Tutorial: Waiting for correct answer...');
        
        // Add visual indicator for answering
        this.addAnswerIndicator();
        
        // Store initial correct count
        this.initialCorrectCount = parseInt(document.getElementById('correct-value')?.textContent) || 0;
        
        // Monitor for correct answers
        const checkForCorrectAnswer = () => {
            const correctElement = document.getElementById('correct-value');
            if (correctElement) {
                const currentCorrect = parseInt(correctElement.textContent) || 0;
                if (currentCorrect > this.initialCorrectCount) {
                    console.log('Math Tutorial: Correct answer detected!');
                    clearInterval(this.answerCheckInterval);
                    this.removeAnswerIndicator();
                    setTimeout(() => this.nextStep(), 1500);
                }
            }
        };
        
        this.answerCheckInterval = setInterval(checkForCorrectAnswer, 500);
    }

    waitForSprint() {
        console.log('Math Tutorial: Waiting for sprint...');
        
        const sprintHandler = (event) => {
            if (event.key === 'Shift') {
                console.log('Math Tutorial: Sprint detected!');
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
        console.log('Math Tutorial: Waiting for pause...');
        
        const pauseHandler = (event) => {
            if (event.key === 'Escape') {
                console.log('Math Tutorial: Pause detected!');
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

    startPracticePhase() {
        this.practiceMode = true;
        this.practiceStartCorrect = parseInt(document.getElementById('correct-value')?.textContent) || 0;
        
        // Hide tutorial overlay
        this.overlay.classList.add('hidden');
        
        // Resume game for practice
        if (this.gameInstance && this.gameInstance.resumeGame) {
            this.gameInstance.resumeGame();
        }
        
        // Monitor practice progress
        this.monitorPracticeProgress();
    }

    monitorPracticeProgress() {
        const checkPracticeProgress = () => {
            const currentCorrect = parseInt(document.getElementById('correct-value')?.textContent) || 0;
            const practiceCorrect = currentCorrect - this.practiceStartCorrect;
            
            if (practiceCorrect >= this.practiceRequiredCorrect) {
                console.log('Math Tutorial: Practice phase completed!');
                clearInterval(this.practiceCheckInterval);
                
                // Pause game again
                if (this.gameInstance && this.gameInstance.pauseGame) {
                    this.gameInstance.pauseGame();
                }
                
                // Show final step
                this.nextStep();
            }
        };
        
        this.practiceCheckInterval = setInterval(checkPracticeProgress, 1000);
    }

    // Visual indicator methods
    addMovementIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'math-tutorial-movement-indicator';
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
            font-family: 'Press Start 2P', cursive;
        `;
        document.body.appendChild(indicator);
    }

    addSprintIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'math-tutorial-sprint-indicator';
        indicator.className = 'tutorial-sprint-indicator';
        indicator.innerHTML = `
            <div class="sprint-key">
                <div class="key shift-key">SHIFT</div>
                <div class="sprint-text">Hold to Sprint!</div>
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
            font-family: 'Press Start 2P', cursive;
        `;
        document.body.appendChild(indicator);
    }

    addPauseIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'math-tutorial-pause-indicator';
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
            font-family: 'Press Start 2P', cursive;
        `;
        document.body.appendChild(indicator);
    }

    addAnswerIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'math-tutorial-answer-indicator';
        indicator.className = 'tutorial-answer-indicator';
        indicator.innerHTML = `
            <div class="answer-prompt">
                <div class="answer-icon">🧮</div>
                <div class="answer-text">Calculate and eat the correct apple!</div>
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
            font-family: 'Press Start 2P', cursive;
        `;
        document.body.appendChild(indicator);
    }

    addSprintSuccessIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'math-tutorial-sprint-success-indicator';
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
            font-family: 'Press Start 2P', cursive;
        `;
        document.body.appendChild(indicator);
        
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.remove();
            }
        }, 2000);
    }

    // Indicator removal methods
    removeMovementIndicator() {
        const indicator = document.getElementById('math-tutorial-movement-indicator');
        if (indicator) indicator.remove();
    }

    removeSprintIndicator() {
        const indicator = document.getElementById('math-tutorial-sprint-indicator');
        if (indicator) indicator.remove();
    }

    removePauseIndicator() {
        const indicator = document.getElementById('math-tutorial-pause-indicator');
        if (indicator) indicator.remove();
    }

    removeAnswerIndicator() {
        const indicator = document.getElementById('math-tutorial-answer-indicator');
        if (indicator) indicator.remove();
    }

    isWaitingForAction() {
        const step = this.tutorialSteps[this.currentStep];
        return step && (step.waitForMovement || step.waitForAnswer || step.waitForSprint || step.waitForPause);
    }

    nextStep() {
        // Clean up any active intervals
        if (this.answerCheckInterval) {
            clearInterval(this.answerCheckInterval);
            this.answerCheckInterval = null;
        }
        
        if (this.practiceCheckInterval) {
            clearInterval(this.practiceCheckInterval);
            this.practiceCheckInterval = null;
        }
        
        // Remove any active indicators
        this.removeAnswerIndicator();
        this.removeMovementIndicator();
        this.removeSprintIndicator();
        this.removePauseIndicator();
        
        this.showStep(this.currentStep + 1);
    }

    skipTutorial() {
        this.completeTutorial();
    }

    completeTutorial() {
        this.isActive = false;
        this.practiceMode = false;
        this.overlay.classList.add('hidden');
        
        // Clean up intervals
        if (this.answerCheckInterval) {
            clearInterval(this.answerCheckInterval);
        }
        if (this.practiceCheckInterval) {
            clearInterval(this.practiceCheckInterval);
        }
        
        // Resume game
        if (this.gameInstance && this.gameInstance.resumeGame) {
            this.gameInstance.resumeGame();
        }
        
        // Mark tutorial as completed
        localStorage.setItem('mathTutorialCompleted', 'true');
        
        // Show completion message
        this.showCompletionMessage();
    }

    showCompletionMessage() {
        const notification = document.createElement('div');
        notification.className = 'tutorial-completion-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <h2>🎉 Math Tutorial Complete!</h2>
                <p>You're now ready to master Math SnaQ! Good luck and have fun solving equations!</p>
                <button class="notification-btn" onclick="this.parentElement.parentElement.remove()">Start Playing!</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.add('fade-out');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 500);
            }
        }, 4000);
    }

    // Static methods for tutorial management
    static hasCompletedTutorial() {
        return localStorage.getItem('mathTutorialCompleted') === 'true';
    }

    static resetTutorial() {
        localStorage.removeItem('mathTutorialCompleted');
    }
}

// Export for use in math game
window.MathTutorialManager = MathTutorialManager;
