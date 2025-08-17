"use client"

import { useEffect, useRef, useState, useCallback } from "react"

interface Apple {
  x: number
  y: number
  value: number
  isCorrect: boolean
}

interface Question {
  question: string
  correctAnswer: number
  options: number[]
}

export default function SnakeMathGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<"playing" | "won" | "lost">("playing")
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)

  // Game constants
  const GRID_SIZE = 20
  const CANVAS_WIDTH = 600
  const CANVAS_HEIGHT = 400
  const GRID_WIDTH = CANVAS_WIDTH / GRID_SIZE
  const GRID_HEIGHT = CANVAS_HEIGHT / GRID_SIZE

  // Game state
  const [snake, setSnake] = useState([{ x: 10, y: 10 }])
  const [direction, setDirection] = useState({ x: 1, y: 0 })
  const [apples, setApples] = useState<Apple[]>([])
  const [gameRunning, setGameRunning] = useState(true)

  // Generate random math question
  const generateQuestion = useCallback((): Question => {
    const operations = ["+", "-", "*"]
    const operation = operations[Math.floor(Math.random() * operations.length)]

    let num1: number, num2: number, correctAnswer: number, question: string

    switch (operation) {
      case "+":
        num1 = Math.floor(Math.random() * 20) + 1
        num2 = Math.floor(Math.random() * 20) + 1
        correctAnswer = num1 + num2
        question = `${num1} + ${num2} = ?`
        break
      case "-":
        num1 = Math.floor(Math.random() * 20) + 10
        num2 = Math.floor(Math.random() * num1) + 1
        correctAnswer = num1 - num2
        question = `${num1} - ${num2} = ?`
        break
      case "*":
        num1 = Math.floor(Math.random() * 10) + 1
        num2 = Math.floor(Math.random() * 10) + 1
        correctAnswer = num1 * num2
        question = `${num1} × ${num2} = ?`
        break
      default:
        correctAnswer = 5
        question = "2 + 3 = ?"
    }

    // Generate wrong options
    const options = [correctAnswer]
    while (options.length < 4) {
      const wrongAnswer = correctAnswer + Math.floor(Math.random() * 10) - 5
      if (wrongAnswer > 0 && !options.includes(wrongAnswer)) {
        options.push(wrongAnswer)
      }
    }

    // Shuffle options
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[options[i], options[j]] = [options[j], options[i]]
    }

    return { question, correctAnswer, options }
  }, [])

  // Generate apples with answer options
  const generateApples = useCallback(
    (question: Question) => {
      const newApples: Apple[] = []
      const usedPositions = new Set<string>()

      question.options.forEach((option) => {
        let x, y
        do {
          x = Math.floor(Math.random() * GRID_WIDTH)
          y = Math.floor(Math.random() * GRID_HEIGHT)
        } while (usedPositions.has(`${x},${y}`))

        usedPositions.add(`${x},${y}`)
        newApples.push({
          x,
          y,
          value: option,
          isCorrect: option === question.correctAnswer,
        })
      })

      setApples(newApples)
    },
    [GRID_WIDTH, GRID_HEIGHT], // Removed snake from dependencies
  )

  // Initialize game
  useEffect(() => {
    const question = generateQuestion()
    setCurrentQuestion(question)
    generateApples(question)
  }, [generateQuestion, generateApples])

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!gameRunning) return

      switch (e.key) {
        case "ArrowUp":
          if (direction.y === 0) setDirection({ x: 0, y: -1 })
          break
        case "ArrowDown":
          if (direction.y === 0) setDirection({ x: 0, y: 1 })
          break
        case "ArrowLeft":
          if (direction.x === 0) setDirection({ x: -1, y: 0 })
          break
        case "ArrowRight":
          if (direction.x === 0) setDirection({ x: 1, y: 0 })
          break
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [direction, gameRunning])

  // Game loop
  useEffect(() => {
    if (!gameRunning) return

    const gameLoop = setInterval(() => {
      setSnake((prevSnake) => {
        const newSnake = [...prevSnake]
        const head = { ...newSnake[0] }

        // Move head
        head.x += direction.x
        head.y += direction.y

        // Check wall collision
        if (head.x < 0 || head.x >= GRID_WIDTH || head.y < 0 || head.y >= GRID_HEIGHT) {
          setGameState("lost")
          setGameRunning(false)
          return prevSnake
        }

        // Check self collision
        if (newSnake.some((segment) => segment.x === head.x && segment.y === head.y)) {
          setGameState("lost")
          setGameRunning(false)
          return prevSnake
        }

        newSnake.unshift(head)

        // Check apple collision
        const eatenApple = apples.find((apple) => apple.x === head.x && apple.y === head.y)
        if (eatenApple) {
          if (eatenApple.isCorrect) {
            setScore((prev) => prev + 10)
            setCorrectAnswers((prev) => {
              const newCount = prev + 1
              if (newCount >= 10) {
                setGameState("won")
                setGameRunning(false)
              }
              return newCount
            })

            // Generate new question
            const newQuestion = generateQuestion()
            setCurrentQuestion(newQuestion)
            generateApples(newQuestion)
            // Don't pop tail - snake grows!
          } else {
            setScore((prev) => Math.max(0, prev - 5))
            setLives((prev) => {
              const newLives = prev - 1
              if (newLives <= 0) {
                setGameState("lost")
                setGameRunning(false)
              }
              return newLives
            })
            newSnake.pop() // Remove tail - snake doesn't grow
          }
        } else {
          newSnake.pop()
        }

        return newSnake
      })
    }, 150)

    return () => clearInterval(gameLoop)
  }, [direction, apples, gameRunning, generateQuestion, generateApples, GRID_WIDTH, GRID_HEIGHT])

  // Draw game
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = "#1a1a1a"
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Draw grid
    ctx.strokeStyle = "#333"
    ctx.lineWidth = 1
    for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, CANVAS_HEIGHT)
      ctx.stroke()
    }
    for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(CANVAS_WIDTH, y)
      ctx.stroke()
    }

    // Draw snake
    ctx.fillStyle = "#4ade80"
    snake.forEach((segment, index) => {
      ctx.fillRect(segment.x * GRID_SIZE + 1, segment.y * GRID_SIZE + 1, GRID_SIZE - 2, GRID_SIZE - 2)

      // Draw head differently
      if (index === 0) {
        ctx.fillStyle = "#22c55e"
        ctx.fillRect(segment.x * GRID_SIZE + 3, segment.y * GRID_SIZE + 3, GRID_SIZE - 6, GRID_SIZE - 6)
        ctx.fillStyle = "#4ade80"
      }
    })

    // Draw apples
    apples.forEach((apple) => {
      // Apple background
      ctx.fillStyle = "#ef4444" // All apples are now red
      ctx.fillRect(apple.x * GRID_SIZE + 1, apple.y * GRID_SIZE + 1, GRID_SIZE - 2, GRID_SIZE - 2)

      // Apple number
      ctx.fillStyle = "white"
      ctx.font = "12px monospace"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(apple.value.toString(), apple.x * GRID_SIZE + GRID_SIZE / 2, apple.y * GRID_SIZE + GRID_SIZE / 2)
    })
  }, [snake, apples])

  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }])
    setDirection({ x: 1, y: 0 })
    setScore(0)
    setLives(3)
    setCorrectAnswers(0)
    setGameState("playing")
    setGameRunning(true)

    const question = generateQuestion()
    setCurrentQuestion(question)
    generateApples(question)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg p-6 shadow-2xl">
        <h1 className="text-3xl font-bold text-center mb-6 text-green-400">Math Snake Game</h1>

        {/* HUD */}
        <div className="flex justify-between items-center mb-4 text-lg">
          <div className="text-blue-400">Score: {score}</div>
          <div className="text-red-400">Lives: {lives}</div>
          <div className="text-yellow-400">Correct: {correctAnswers}/10</div>
        </div>

        {/* Question */}
        <div className="text-center mb-4">
          <div className="text-xl font-semibold text-white">{currentQuestion?.question || "Loading..."}</div>
          <div className="text-sm text-gray-400 mt-1">Eat the apple with the correct answer!</div>
        </div>

        {/* Game Canvas */}
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="border-2 border-gray-600 rounded"
          />

          {/* Game Over Overlay */}
          {gameState !== "playing" && (
            <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center rounded">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">
                  {gameState === "won" ? (
                    <span className="text-green-400">You Won! 🎉</span>
                  ) : (
                    <span className="text-red-400">Game Over 💀</span>
                  )}
                </h2>
                <p className="text-lg mb-4">Final Score: {score}</p>
                <button
                  onClick={resetGame}
                  className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded font-semibold transition-colors"
                >
                  Play Again
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-4 text-center text-sm text-gray-400">
          <p>Use arrow keys to move • Eat correct answers to grow • Avoid wrong answers!</p>
          <p className="mt-1">All apples are red - look at the numbers to find the correct answer!</p>
        </div>
      </div>
    </div>
  )
}
