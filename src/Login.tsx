import { useState } from 'react'
import './Login.css'

interface LoginProps {
  onLogin: (userId: string) => void
}

function Login({ onLogin }: LoginProps) {
  const [userId, setUserId] = useState('')
  const [error, setError] = useState('')

  // 全角を半角に変換する関数
  const toHalfWidth = (str: string): string => {
    return str
      .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (char) => {
        return String.fromCharCode(char.charCodeAt(0) - 0xFEE0)
      })
      .replace(/[ー－―]/g, '-')
      .replace(/[　]/g, ' ')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // 全角を半角に変換してからトリム
    const normalizedUserId = toHalfWidth(userId.trim())
    if (!normalizedUserId) {
      setError('IDを入力してください')
      return
    }

    // ローカルストレージからログイン中のIDを確認
    const loggedInUsers = JSON.parse(localStorage.getItem('loggedInUsers') || '{}')
    const currentSessionId = localStorage.getItem('currentSessionId')
    
    // 同じIDが既にログインしているかチェック（現在のセッション以外）
    if (loggedInUsers[normalizedUserId] && loggedInUsers[normalizedUserId] !== currentSessionId) {
      setError('このIDは他の端末でログイン中です')
      return
    }

    // セッションIDを生成（簡易的な実装）
    const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // ログイン状態を保存
    loggedInUsers[normalizedUserId] = sessionId
    localStorage.setItem('loggedInUsers', JSON.stringify(loggedInUsers))
    localStorage.setItem('currentSessionId', sessionId)
    localStorage.setItem('currentUserId', normalizedUserId)

    onLogin(normalizedUserId)
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="login-title">失われた季節からの脱出</h2>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="userId">ID</label>
            <input
              type="text"
              id="userId"
              value={userId}
              onChange={(e) => {
                // 入力時に自動的に全角を半角に変換
                const normalizedValue = toHalfWidth(e.target.value)
                setUserId(normalizedValue)
                setError('')
              }}
              onBlur={(e) => {
                // フォーカスが外れたときにも半角に変換
                const normalizedValue = toHalfWidth(e.target.value.trim())
                setUserId(normalizedValue)
              }}
              placeholder="IDを入力"
              required
            />
          </div>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          <button type="submit" className="login-button">
            ログイン
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
