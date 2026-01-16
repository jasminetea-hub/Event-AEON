import { useState } from 'react'
import './PuzzleModal.css'

interface PuzzleModalProps {
  season: string
  puzzle: string
  hint: string
  correctAnswers: string[]
  isSolved: boolean
  onClose: () => void
  onCorrect: (season: string) => void
}

function PuzzleModal({ season, puzzle, hint, correctAnswers, isSolved, onClose, onCorrect }: PuzzleModalProps) {
  const [answer, setAnswer] = useState('')
  const [message, setMessage] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [showHint, setShowHint] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!answer.trim()) {
      setMessage('回答を入力してください')
      return
    }

    setIsChecking(true)
    const normalizedAnswer = answer.trim().toLowerCase()
    const isCorrect = correctAnswers.some(correct => 
      correct.toLowerCase() === normalizedAnswer
    )

    if (isCorrect) {
      setMessage('正解です！')
      setTimeout(() => {
        onCorrect(season)
      }, 1000)
    } else {
      setMessage('不正解です。もう一度考えてみてください。')
      setIsChecking(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ×
        </button>
        <h2 className="modal-season">{season}の謎</h2>
        <div className="modal-puzzle">
          <p>{puzzle}</p>
        </div>
        {!isSolved && (
          <button
            type="button"
            className="hint-button"
            onClick={() => setShowHint(!showHint)}
          >
            {showHint ? 'ヒントを隠す' : 'ヒントを見る'}
          </button>
        )}
        {showHint && !isSolved && (
          <div className="hint-box">
            <p className="hint-text">💡 ヒント: {hint}</p>
          </div>
        )}
        {isSolved ? (
          <div className="solved-message">
            ✓ この謎は既に解かれています
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="answer-form">
            <div className="form-group">
              <label htmlFor="answer">回答</label>
              <input
                type="text"
                id="answer"
                value={answer}
                onChange={(e) => {
                  setAnswer(e.target.value)
                  setMessage('')
                }}
                placeholder="答えを入力してください"
                disabled={isChecking}
                autoFocus
              />
            </div>
            {message && (
              <div className={`message ${message.includes('正解') ? 'success' : 'error'}`}>
                {message}
              </div>
            )}
            <button type="submit" className="submit-button" disabled={isChecking}>
              {isChecking ? '確認中...' : '回答する'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default PuzzleModal
