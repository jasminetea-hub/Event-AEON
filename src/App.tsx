import { useState, useEffect } from 'react'
import Game from './Game'
import StartModal from './StartModal'

function App() {
  // ログイン画面を削除し、自動的にユーザーIDを生成
  const [userId] = useState<string>(() => {
    // 既存のユーザーIDがあれば使用、なければ自動生成
    const existingUserId = localStorage.getItem('currentUserId')
    if (existingUserId) {
      return existingUserId
    }
    // ランダムなユーザーIDを生成
    const newUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem('currentUserId', newUserId)
    return newUserId
  })
  const [showStartModal, setShowStartModal] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)

  useEffect(() => {
    // ゲーム開始状態を確認
    const savedGameStarted = localStorage.getItem('gameStarted') === 'true'
    
    if (savedGameStarted) {
      setGameStarted(true)
      setShowStartModal(false)
    } else {
      // ゲームが開始されていない場合はスタートモーダルを表示
      setShowStartModal(true)
    }
  }, [])

  const handleStart = () => {
    // スタートボタンを押した時は、タイマーをリセットして新しく開始
    localStorage.removeItem('timerStartTime')
    setShowStartModal(false)
    setGameStarted(true)
    localStorage.setItem('gameStarted', 'true')
  }

  const handleLogout = (_targetUserId: string) => {
    // ログアウト時はゲーム状態をクリア
    localStorage.removeItem('gameStarted')
    localStorage.removeItem('timerStartTime')
    // ページをリロードして初期状態に戻す
    window.location.reload()
  }

  return (
    <>
      {showStartModal && (
        <StartModal onStart={handleStart} />
      )}
      {gameStarted && (
        <Game userId={userId} onLogout={handleLogout} />
      )}
    </>
  )
}

export default App
