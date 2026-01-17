import { useState, useEffect } from 'react'
import './PuzzleModal.css'

interface FinalPuzzleModalProps {
  puzzle: string
  hint: string
  correctAnswers: string[]
  collectedLetters: string[]
  onLetterSwap: (index1: number, index2: number) => void
  selectedLetterIndex: number | null
  onLetterClick: (index: number) => void
  onClose: () => void
  onCorrect: () => void
}

function FinalPuzzleModal({ 
  puzzle, 
  hint, 
  correctAnswers: _correctAnswers, 
  collectedLetters,
  onLetterSwap: _onLetterSwap,
  selectedLetterIndex,
  onLetterClick,
  onClose, 
  onCorrect
}: FinalPuzzleModalProps) {
  const [message, setMessage] = useState('')
  const [showHint, setShowHint] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [dropZoneTimer, setDropZoneTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  const correctOrder = ['お', 'も', 'い', 'で']

  // 集めた文字が「おもいで」の順序かどうかをチェック
  const isOmoidOrder = (letters: string[]): boolean => {
    if (letters.length !== correctOrder.length) return false
    return letters.every((letter, index) => letter === correctOrder[index])
  }


  // 集めた文字が「おもいで」の順序になったら脱出成功
  useEffect(() => {
    if (collectedLetters.length === 4 && isOmoidOrder(collectedLetters)) {
      setIsCompleted(true)
      setMessage('脱出成功！')
      // 少し遅延させて脱出成功モーダルを表示
      setTimeout(() => {
        if (onCorrect) {
          onCorrect()
        }
      }, 1000)
    } else {
      setIsCompleted(false)
      setMessage('')
      // タイマーをクリア
      if (dropZoneTimer) {
        clearTimeout(dropZoneTimer)
        setDropZoneTimer(null)
      }
    }

    return () => {
      if (dropZoneTimer) {
        clearTimeout(dropZoneTimer)
      }
    }
  }, [collectedLetters, dropZoneTimer, onCorrect])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ×
        </button>
        {!isCompleted ? (
          <>
            <h2 className="modal-season">最後の謎</h2>
            <div className="modal-puzzle">
              <p>{puzzle}</p>
            </div>
            <button
              type="button"
              className="hint-button"
              onClick={() => setShowHint(!showHint)}
            >
              {showHint ? 'ヒントを隠す' : 'ヒントを見る'}
            </button>
            {showHint && (
              <div className="hint-box">
                <p className="hint-text">💡 ヒント: {hint}</p>
              </div>
            )}
            <div className="final-letters-box">
              {collectedLetters.length > 0 ? (
                collectedLetters.map((letter, index) => (
                  <span
                    key={index}
                    className={`letter-item ${selectedLetterIndex === index ? 'selected' : ''}`}
                    onClick={() => onLetterClick(index)}
                  >
                    {letter}
                  </span>
                ))
              ) : (
                <span className="letters-placeholder">？ ？ ？ ？</span>
              )}
            </div>
            {message && (
              <div className={`message ${message.includes('正解') || message.includes('脱出成功') ? 'success' : 'error'}`}>
                {message}
              </div>
            )}
          </>
        ) : (
          <>
            <h2 className="modal-season">脱出の鍵</h2>
            <div className="final-letters-box">
              {collectedLetters.map((letter, index) => (
                <span
                  key={index}
                  className="letter-item"
                >
                  {letter}
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default FinalPuzzleModal
