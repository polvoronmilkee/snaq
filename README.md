# 🐍 SnaQ – Quiz Your Brain, Grow Your Snake!

**SnaQ** is a retro-style pixel game that fuses the classic Snake experience with educational quiz challenges.  

Pick your subject, answer questions by munching the correct apples, and grow your snake as your knowledge grows!  

---

## 🎯 Theme Alignment

Learning & Literacy – SnaQ builds foundational knowledge in math, language, and problem-solving by transforming learning into an engaging and interactive game. It makes education fun, accessible, and rewarding through a nostalgic arcade experience.

---

## 🎮 Gameplay

- **Choose Your Subject**
  - Mathematics  
  - English
  - Science
  - General Knowledge

- **Controls**
  - **WASD / Arrow Keys** – Move  
  - **Shift** – Sprint (uses sprint bar)  
  - **ESC** – Pause Game
  - **Space** – Resume Game
  - **R** – Restart Game

- **Objectives**
  - Eat the apple with the correct answer  
  - Gain points & length with correct bites  
  - Lose lives with wrong answers

- **Power-Ups**
  - **Shield** – Blocks one mistake when lives are low  
  - **Sprints** – Makes your snake fast, refills over time  

---

## 🕹️ Game Modes

- **Quiz Mode** – Answer 10 questions to win  
- **Endless Mode** – How long can you survive?  
- **Timed Mode** – 60 seconds of speedy snacking  

---

## ⚙️ Features

- **Customizable Snake Skins** – Unlock and purchase different snake appearances with earned points
- **Skin Shop System** – Browse and buy new skins including Green (default), Pink, Blue, Red, and special Volt Tech variants
- **Volt Tech Skin Bonuses** – Special energy bonuses: +10% max energy, -15% energy drain, +15% energy regeneration
- **Open Trivia Database Integration** – Fresh questions from external API with fallback to local questions
- **Modular Game Architecture** – ES6 modules with shared utilities for easy maintenance and expansion
- **Advanced Power-up System** – Sprint mechanics with energy management and shield protection
- **Multiple Question Categories** – 13+ trivia categories including Science, History, Geography, Sports, and more
- Pixel-art inspired UI and retro vibes with pixelated scrollbars and clean aesthetics
- Sticky header with controls for **help, sound, music, and credits**  
- Modal-based menus for game settings and instructions  
- Difficulty levels: Easy, Medium, Hard with adaptive speed and complexity
- Cross-game mode skin persistence and consistent rendering
- Async question loading with proper error handling

---

## 🚀 Getting Started

1. Clone the repo:  
   ```bash
   git clone https://github.com/your-username/snaq.git
   cd snaq
   ```

2. Open `index.html` in your browser.  

3. Play and grow your snake 🐍  

---

## 📂 Project Structure

```
snakeq_game/
├── index.html                    # Main landing page with skin shop
├── assets/
│   ├── css/
│   │   └── styles.css           # Game styles, pixel art theme, and skin shop UI
│   ├── images/
│   │   ├── icons/               # UI icons and buttons
│   │   ├── apples/              # Apple sprites (multiple colors)
│   │   └── snake-skins/         # Snake skin variants
│   │       ├── green_snake/     # Default green snake sprites
│   │       ├── pink_snake/      # Pink snake skin sprites
│   │       ├── blue_snake/      # Blue snake skin sprites
│   │       ├── red_snake/       # Red snake skin sprites
│   │       └── volt_snake/      # Special Volt Tech skin with bonuses
│   └── sounds/                  # Audio files and sound effects
├── shared/
│   ├── landing.js               # Main menu logic and skin system
│   └── gamesQuestions/          # Question databases for each subject
│       ├── mathQuestions.js     # Math questions and answers
│       ├── scienceQuestions.js  # Science questions and answers
│       ├── englishQuestions.js  # English questions and answers
│       └── generalKnowQuestions.js # General knowledge questions
└── games/                       # Individual game directories
    ├── math/
    │   ├── math-game.html       # Math game interface
    │   └── math-game.js         # Math game logic and rendering
    ├── science/
    │   ├── science-game.html    # Science game interface
    │   └── science-game.js      # Science game logic and rendering
    ├── english/
    │   ├── english-game.html    # English game interface
    │   └── english-game.js      # English game logic and rendering
    └── generalKnowledge/
        ├── generalknow-game.html # General knowledge game interface
        └── generalknow-game.js   # General knowledge game logic
```
---

## 🎵 Copyright & Credits

- **Music:** "And So It Begins" by Artificial.Music  
- Licensed under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/)  

---

## 💪 Designed and Developed by Team APPLE JUICE 🧃

We are 2nd Year BS Software Engineering students from Central Philippine University (CPU), Iloilo City, Philippines — passionate about building fun and meaningful tech projects. For this hackathon, we combined creativity, coding, and teamwork to create SnaQ, a game that makes learning exciting and engaging.

- Danielle Poral
- Lemuel Luceño
- Ahron Alera
- Sophia Mendoza
- Joseph Llacer

