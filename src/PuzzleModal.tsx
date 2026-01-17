import { useState } from 'react'
import './PuzzleModal.css'

interface PuzzleModalProps {
  season: string
  puzzle: string
  hint: string | string[]
  correctAnswers: string[]
  isSolved: boolean
  onClose: () => void
  onCorrect: (season: string) => void
}

function PuzzleModal({ season, puzzle, hint, correctAnswers, isSolved, onClose, onCorrect }: PuzzleModalProps) {
  const [answer, setAnswer] = useState('')
  const [message, setMessage] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [hintIndex, setHintIndex] = useState(0)
  
  // ヒントが配列の場合は配列を使用、文字列の場合は配列に変換
  const hints = Array.isArray(hint) ? hint : [hint]
  const showHint = hintIndex > 0
  const currentHint = hints[hintIndex - 1] || ''
  
  // 漢字の季節名を絵文字に変換
  const seasonNameToEmoji: Record<string, string> = {
    '春': '🌸',
    '夏': '🏖️',
    '秋': '🎃',
    '冬': '⛄️'
  }
  const seasonEmoji = seasonNameToEmoji[season] || season

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
        <h2 className="modal-season">{seasonEmoji}の謎</h2>
        <div className="modal-puzzle">
          {(season === '春' || season === '🌸') ? (
            <div className="spring-puzzle">
              <p className="spring-puzzle-text">{puzzle}</p>
              <div className="spring-puzzle-lines">
                <div className="spring-line" style={{ backgroundColor: '#87CEEB' }}></div>
                <div className="spring-line" style={{ backgroundColor: '#FF0000' }}></div>
                <div className="spring-line" style={{ backgroundColor: '#00FF00' }}></div>
              </div>
            </div>
          ) : (season === '夏' || season === '🏖️') ? (
            <div className="summer-puzzle">
              <p className="summer-puzzle-question">これは何の形かわかるかな？</p>
              <p className="summer-puzzle-numbers">４５９６８４</p>
            </div>
          ) : (
            <p>{puzzle}</p>
          )}
        </div>
        {!isSolved && (
          <>
            <button
              type="button"
              className="hint-button"
              onClick={() => {
                if (hintIndex < hints.length) {
                  setHintIndex(hintIndex + 1)
                } else {
                  setHintIndex(0)
                }
              }}
            >
              {hintIndex === 0 
                ? 'ヒントを見る' 
                : hintIndex < hints.length 
                  ? `ヒント${hintIndex}/${hints.length} (次のヒントを見る)` 
                  : 'ヒントを隠す'}
            </button>
            {showHint && !isSolved && (
              <div className="hint-box">
                <p className="hint-text">💡 ヒント{hintIndex}/{hints.length}: {currentHint}</p>
              </div>
            )}
          </>
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
