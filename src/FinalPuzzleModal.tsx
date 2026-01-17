import { useState, useEffect, useRef } from 'react'
import './PuzzleModal.css'
import { getApiBaseUrl } from './config'

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
  onCardRead?: (cardId: string) => void
  userId: string
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
  onCorrect,
  onCardRead,
  userId
}: FinalPuzzleModalProps) {
  const [message, setMessage] = useState('')
  const [showHint, setShowHint] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [showOmoidPopup, setShowOmoidPopup] = useState(false)
  const [_draggedLetter, setDraggedLetter] = useState<string | null>(null)
  const [dropZoneHovered, setDropZoneHovered] = useState(false)
  const [dropZoneTimer, setDropZoneTimer] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [_cardReadError, setCardReadError] = useState<string>('')
  const dropZoneRef = useRef<HTMLDivElement>(null)

  const correctOrder = ['お', 'も', 'い', 'で']

  // 集めた文字が「おもいで」の順序かどうかをチェック
  const isOmoidOrder = (letters: string[]): boolean => {
    if (letters.length !== correctOrder.length) return false
    return letters.every((letter, index) => letter === correctOrder[index])
  }

  // VPSサーバー経由でカード情報を取得する関数（通信待ち）
  // 要件：
  // 1. 最後の謎を解いたら通信待ちの状態になる
  // 2. PCはカードリーダーでUIDを読み取り、データベースからカードユーザーIDを取得してVPSサーバーに送信
  // 3. スマホはVPSサーバーからカード情報を取得し、カードユーザーIDとログインIDを照合
  const waitForCard = async () => {
    try {
      setCardReadError('')
      const apiUrl = getApiBaseUrl();
      console.log('📱 VPSサーバー経由でPCからのカード読み取りを待機中...')
      
      // VPSサーバーの/api/get-card-infoエンドポイントを呼び出す
      const response = await fetch(`${apiUrl}/api/get-card-info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }), // 照合用にuserIdを送信
      })
      
      const data = await response.json()
      console.log('PCからのカード読み取りレスポンス:', data)
      
      if (response.ok) {
        if (data.success && data.cardUserId) {
          // ステップ3: PCから送信されたカードユーザーIDとログインIDを照合
          const cardUserIdStr = String(data.cardUserId);
          const loginUserIdStr = String(userId);
          
          console.log('🔍 ID照合:', {
            カードユーザーID: cardUserIdStr,
            ログインID: loginUserIdStr
          });
          
          if (cardUserIdStr === loginUserIdStr) {
            // IDが一致した → 脱出成功
            console.log('✅ 脱出成功！カードID:', data.cardId, 'カードユーザーID:', data.cardUserId, 'ログインID:', userId)
            if (onCardRead) {
              onCardRead(data.cardId)
            }
            if (onCorrect) {
              onCorrect()
            }
            return true
          } else {
            // IDが一致しない
            const errorMessage = `IDが一致しません（カードのID: ${cardUserIdStr}, ログインID: ${loginUserIdStr}）`
            setCardReadError(errorMessage)
            console.log('❌ ID不一致:', errorMessage)
            return false
          }
        } else if (data.success && !data.cardUserId) {
          // カードは読み取れたが、user_idが登録されていない
          const errorMessage = data.message || 'このカードにはユーザーIDが登録されていません'
          setCardReadError(errorMessage)
          console.log('❌ カードにユーザーIDが登録されていません:', data)
          return false
        } else {
          // カードが読み取れなかった
          const errorMessage = data.message || 'カードが読み取れませんでした'
          // エラーは表示しない（通信待ち状態を維持）
          console.log('⏳ カード待機中:', errorMessage)
          return false
        }
      } else {
        // HTTPエラー
        const errorMessage = data.message || data.error || 'カード読み取りに失敗しました'
        // エラーは表示しない（通信待ち状態を維持）
        console.log('⏳ 通信エラー（再試行します）:', errorMessage)
        return false
      }
    } catch (error) {
      console.error('通信エラー:', error)
      // エラーは表示しない（通信待ち状態を維持）
      return false
    }
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
      setShowOmoidPopup(false)
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

  // ドラッグ開始（「おもいで」全体をドラッグ）
  const handleDragStart = (e: React.DragEvent) => {
    setDraggedLetter('おもいで')
    e.dataTransfer.effectAllowed = 'move'
  }

  // ドラッグ終了
  const handleDragEnd = () => {
    setDraggedLetter(null)
    // ドロップゾーンから離れた場合はタイマーをクリア
    if (!dropZoneHovered) {
      if (dropZoneTimer) {
        clearTimeout(dropZoneTimer)
        setDropZoneTimer(null)
      }
    }
  }

  // ドロップゾーンに入った
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    setDropZoneHovered(true)
    
    // 既存のタイマーをクリア
    if (dropZoneTimer) {
      clearTimeout(dropZoneTimer)
    }
    
    // 3秒後に脱出成功
    const timer = setTimeout(() => {
      if (onCorrect) {
        onCorrect()
      }
    }, 3000)
    setDropZoneTimer(timer)
  }

  // ドロップゾーンから出た
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    // 子要素への移動の場合は何もしない
    if (dropZoneRef.current && dropZoneRef.current.contains(e.relatedTarget as Node)) {
      return
    }
    setDropZoneHovered(false)
    
    // タイマーをクリア
    if (dropZoneTimer) {
      clearTimeout(dropZoneTimer)
      setDropZoneTimer(null)
    }
  }

  // ドロップ
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDropZoneHovered(false)
  }

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
        ) : showOmoidPopup ? (
          <>
            <h2 className="modal-season" style={{ marginBottom: '1.5rem' }}>思い出を心にかざせ！</h2>
            <div className="omoid-drag-container">
              <div 
                className="omoid-word-draggable"
                draggable
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                おもいで
              </div>
              <div className="drop-zone-instruction">「思」に動かして3秒かざす</div>
              <div
                ref={dropZoneRef}
                className={`omoid-drop-zone ${dropZoneHovered ? 'hovered' : ''}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                <div className="drop-zone-text">思</div>
                {dropZoneHovered && (
                  <div className="drop-zone-timer">3秒...</div>
                )}
              </div>
            </div>
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
            <div className="final-message">
              <p style={{ marginBottom: '1.5rem' }}>を心にかざして脱出しろ！</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default FinalPuzzleModal
