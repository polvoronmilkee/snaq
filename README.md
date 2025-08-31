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
- **Skin Shop System** – Browse and buy new skins including Green (default), Pink, Blue, and Red variants
- Pixel-art inspired UI and retro vibes with pixelated scrollbars and clean aesthetics
- Sticky header with controls for **help, sound, music, and credits**  
- Modal-based menus for game settings and instructions  
- Difficulty levels: Easy, Medium, Hard  
- Power-up mechanics to keep gameplay exciting  
- Modular architecture for easy maintenance and expansion
- Cross-game mode skin persistence and consistent rendering

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
├── css/
│   └── styles.css               # Game styles, pixel art theme, and skin shop UI
├── js/
│   ├── landing.js               # Main menu logic and skin system
│   └── games/                   # Subject-specific game logic
│       ├── math-game.js         # Math questions and snake rendering
│       ├── science-game.js      # Science questions and snake rendering
│       ├── english-game.js      # English questions and snake rendering
│       └── generalknow-game.js  # General knowledge questions and rendering
├── templates/
│   ├── math-game.html           # Math game interface
│   ├── science-game.html        # Science game interface
│   ├── english-game.html        # English game interface
│   └── generalknow-game.html    # General knowledge game interface
└── assets/                      # Game resources
    ├── icons/                   # UI icons and buttons
    ├── backgrounds/             # Background images
    ├── apples/                  # Apple sprites (multiple colors)
    └── snake_movement/          # Snake skin variants
        ├── green_snake/         # Default green snake sprites
        ├── pink_snake/          # Pink snake skin sprites
        ├── blue_snake/          # Blue snake skin sprites
        └── red_snake/           # Red snake skin sprites

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

