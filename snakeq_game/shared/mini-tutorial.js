class MiniTutorial {
    constructor(gameInstance) {
        this.gameInstance = gameInstance;
        this.steps = [];
        this.currentStep = 0;
        this.overlay = null;
        this.highlight = null;
        this.messageBox = null;
        this.retryCount = 0;
        this.hasSeenTutorial = localStorage.getItem('miniTutorialSeen') === 'true';
        
        this.init();
    }

    init() {
        console.log('MiniTutorial init - hasSeenTutorial:', this.hasSeenTutorial);
        console.log('localStorage miniTutorialSeen:', localStorage.getItem('miniTutorialSeen'));
        
        if (this.hasSeenTutorial) {
            console.log('Tutorial already seen, skipping...');
            return;
        }
        
        console.log('Setting up mini tutorial...');
        this.createElements();
        this.setupSteps();
        this.showStep(0);
    }

    createElements() {
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'tutorial-overlay';
        
        // Create highlight box
        this.highlight = document.createElement('div');
        this.highlight.className = 'tutorial-highlight';

        // Create tutorial box
        this.messageBox = document.createElement('div');
        this.messageBox.className = 'tutorial-box';
        
        // Create header with just the title
        const header = document.createElement('div');
        header.className = 'tutorial-header';
        
        const title = document.createElement('h3');
        title.textContent = 'Tutorial';
        
        header.appendChild(title);
        
        // Create content area
        const content = document.createElement('div');
        content.className = 'tutorial-content';
        content.innerHTML = '<p>Loading tutorial...</p>';
        
        // Create footer
        const footer = document.createElement('div');
        footer.className = 'tutorial-footer';
        
        const progress = document.createElement('div');
        progress.className = 'tutorial-progress';
        progress.textContent = '1/5';
        
        const buttons = document.createElement('div');
        buttons.className = 'tutorial-buttons';
        
        const nextButton = document.createElement('button');
        nextButton.className = 'tutorial-btn tutorial-next';
        nextButton.textContent = 'Next';
        nextButton.addEventListener('click', () => this.nextStep());
        
        buttons.appendChild(nextButton);
        footer.appendChild(progress);
        footer.appendChild(buttons);
        
        // Assemble the tutorial box
        this.messageBox.appendChild(header);
        this.messageBox.appendChild(content);
        this.messageBox.appendChild(footer);
        
        // Add to document
        document.body.appendChild(this.overlay);
        document.body.appendChild(this.highlight);
        document.body.appendChild(this.messageBox);
        
        // Store references to updateable elements
        this.elements = {
            content: content,
            progress: progress,
            nextButton: nextButton
        };
    }

    setupSteps() {
        this.steps = [
            {
                element: () => document.querySelector('.question-section'),
                message: 'This is the question area. Answer correctly to grow your snake!',
                position: 'bottom'
            },
            {
                element: () => document.querySelector('#game-canvas'),
                message: 'The correct answer will appear as an apple. Move your snake to eat it!',
                position: 'top'
            },
            {
                element: () => document.querySelector('.score'),
                message: 'Your score increases with each correct answer. Try to get the highest score!',
                position: 'left'
            },
            {
                element: () => document.querySelector('.lives'),
                message: 'You have 5 lives. Be careful - wrong answers will cost you a life!',
                position: 'right'
            },
            {
                element: () => document.querySelector('#game-canvas'),
                message: 'Use the ARROW KEYS or WASD to move. Press SHIFT to sprint!',
                position: 'top',
                isLast: true
            }
        ];
    }

    showStep(stepIndex) {
        console.log(`Showing step ${stepIndex} of ${this.steps.length - 1}`);
        
        if (stepIndex >= this.steps.length) {
            this.completeTutorial();
            return;
        }

        this.currentStep = stepIndex;
        const step = this.steps[stepIndex];
        
        // Try to find the target element
        const targetElement = step.element();
        
        if (!targetElement) {
            console.warn(`Tutorial element not found:`, step);
            
            // Retry finding the element a few times with a delay
            if (this.retryCount < 5) {
                this.retryCount++;
                console.log(`Retrying to find element (attempt ${this.retryCount})...`);
                setTimeout(() => this.showStep(stepIndex), 500);
                return;
            } else {
                console.error('Max retries reached, skipping to next step');
                this.nextStep();
                return;
            }
        }
        
        // Reset retry counter if element is found
        this.retryCount = 0;
        
        // Position the highlight around the target element
        const rect = targetElement.getBoundingClientRect();
        this.highlight.style.cssText = `
            left: ${rect.left - 5}px;
            top: ${rect.top - 5}px;
            width: ${rect.width + 10}px;
            height: ${rect.height + 10}px;
        `;
        
        // Update content
        this.elements.content.innerHTML = `<p>${step.message}</p>`;
        this.elements.progress.textContent = `${stepIndex + 1}/${this.steps.length}`;
        
        // Update next button text for last step
        if (step.isLast) {
            this.elements.nextButton.textContent = 'Got it!';
        } else {
            this.elements.nextButton.textContent = 'Next';
        }
        
        // Position message box
        this.positionMessageBox(step.position, rect);
    }

    positionMessageBox(position, rect) {
        const padding = 20;
        const messageRect = this.messageBox.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Default to center if position is not specified
        let top = (viewportHeight - messageRect.height) / 2;
        let left = (viewportWidth - messageRect.width) / 2;
        
        // Adjust position based on the specified position relative to the target element
        switch (position) {
            case 'top':
                top = rect.top - messageRect.height - padding;
                left = rect.left + (rect.width - messageRect.width) / 2;
                break;
            case 'bottom':
                top = rect.bottom + padding;
                left = rect.left + (rect.width - messageRect.width) / 2;
                break;
            case 'left':
                top = rect.top + (rect.height - messageRect.height) / 2;
                left = rect.left - messageRect.width - padding;
                break;
            case 'right':
                top = rect.top + (rect.height - messageRect.height) / 2;
                left = rect.right + padding;
                break;
        }
        
        // Ensure the message box stays within viewport bounds
        top = Math.max(20, Math.min(top, viewportHeight - messageRect.height - 20));
        left = Math.max(20, Math.min(left, viewportWidth - messageRect.width - 20));
        
        // Apply the calculated position
        this.messageBox.style.top = `${Math.max(0, top)}px`;
        this.messageBox.style.left = `${Math.max(0, left)}px`;
        this.messageBox.style.transform = 'none';
        
        // Ensure the message box is visible
        this.messageBox.style.opacity = '1';
        this.messageBox.style.visibility = 'visible';
    }

    nextStep() {
        this.currentStep++;
        this.showStep(this.currentStep);
    }

    completeTutorial() {
        console.log('Completing tutorial...');
        
        // Mark tutorial as seen
        localStorage.setItem('miniTutorialSeen', 'true');
        
        // Add fade out animation
        if (this.overlay) {
            this.overlay.style.opacity = '0';
            this.overlay.style.transition = 'opacity 0.3s ease';
        }
        
        if (this.highlight) {
            this.highlight.style.opacity = '0';
            this.highlight.style.transition = 'opacity 0.3s ease';
        }
        
        if (this.messageBox) {
            this.messageBox.style.opacity = '0';
            this.messageBox.style.transition = 'opacity 0.3s ease';
        }
        
        // Remove elements after animation completes
        setTimeout(() => {
            if (this.overlay && this.overlay.parentNode) {
                this.overlay.parentNode.removeChild(this.overlay);
            }
            if (this.highlight && this.highlight.parentNode) {
                this.highlight.parentNode.removeChild(this.highlight);
            }
            if (this.messageBox && this.messageBox.parentNode) {
                this.messageBox.parentNode.removeChild(this.messageBox);
            }
            
            // Resume game if it was paused
            if (this.gameInstance) {
                if (this.gameInstance.gameState === 'paused') {
                    console.log('Resuming game...');
                    this.gameInstance.togglePause();
                } else {
                    console.log('Game not paused, no need to resume');
                }
            } else {
                console.log('No game instance found');
            }
            
            console.log('Tutorial completed and cleaned up');
        }, 300);
    }
}

// Make it available globally
window.MiniTutorial = MiniTutorial;
