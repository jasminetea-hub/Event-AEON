import { useState } from 'react'
import './PuzzleModal.css'

interface LogoutModalProps {
  onClose: () => void
  onLogout: (userId: string) => void
}

function LogoutModal({ onClose, onLogout }: LogoutModalProps) {
  const [userId, setUserId] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedUserId = userId.trim()
    
    if (!trimmedUserId) {
      setMessage('番号を入力してください')
      return
    }

    // 212022が入力された場合のみログアウト処理
    if (trimmedUserId === '212022') {
      onLogout(trimmedUserId)
      setUserId('')
      setMessage('ログアウトしました')
      setTimeout(() => {
        onClose()
      }, 1000)
    } else {
      setMessage('正しい番号を入力してください')
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ×
        </button>
        <h2 className="modal-season">強制ログアウト</h2>
        <div className="modal-puzzle">
          <p>ログアウト番号を入力してください</p>
        </div>
        <form onSubmit={handleSubmit} className="answer-form">
          <div className="form-group">
            <label htmlFor="userId">番号</label>
            <input
              type="text"
              id="userId"
              value={userId}
              onChange={(e) => {
                setUserId(e.target.value)
                setMessage('')
              }}
              placeholder="番号を入力"
              required
              autoFocus
            />
          </div>
          {message && (
            <div className={`message ${message.includes('ログアウト') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}
          <button type="submit" className="submit-button">
            ログアウト
          </button>
        </form>
      </div>
    </div>
  )
}

export default LogoutModal
