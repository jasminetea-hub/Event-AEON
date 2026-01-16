import { useState, useEffect } from 'react'
import Login from './Login'
import Game from './Game'
import StartModal from './StartModal'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userId, setUserId] = useState<string>('')
  const [showStartModal, setShowStartModal] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)

  useEffect(() => {
    // リロード時はログアウトしてログイン画面に戻る
    // beforeunloadイベントで設定されたフラグをチェック
    const isReloading = sessionStorage.getItem('isReloading') === 'true'
    
    if (isReloading) {
      // リロード検出時は、すべてのログイン情報をクリア
      sessionStorage.removeItem('isReloading')
      localStorage.removeItem('loggedInUsers')
      localStorage.removeItem('currentUserId')
      localStorage.removeItem('currentSessionId')
      localStorage.removeItem('gameStarted')
      
      // ログイン画面を表示
      setIsLoggedIn(false)
      setUserId('')
      setGameStarted(false)
      setShowStartModal(false)
      return
    }
    
    // 通常のページ読み込み時のログイン状態を確認
    const currentUserId = localStorage.getItem('currentUserId')
    const currentSessionId = localStorage.getItem('currentSessionId')
    const savedGameStarted = localStorage.getItem('gameStarted') === 'true'
    
    if (currentUserId && currentSessionId) {
      const loggedInUsers = JSON.parse(localStorage.getItem('loggedInUsers') || '{}')
      // セッションIDが一致する場合のみログイン状態を維持
      if (loggedInUsers[currentUserId] === currentSessionId) {
        setUserId(currentUserId)
        setIsLoggedIn(true)
        setGameStarted(savedGameStarted)
        // ゲームが開始されていない場合はスタートモーダルを表示
        if (!savedGameStarted) {
          setShowStartModal(true)
        }
      } else {
        // セッションが無効な場合はクリア
        localStorage.removeItem('currentUserId')
        localStorage.removeItem('currentSessionId')
        localStorage.removeItem('gameStarted')
      }
    }
    
    // beforeunloadイベントでリロードフラグを設定
    const handleBeforeUnload = () => {
      sessionStorage.setItem('isReloading', 'true')
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  const handleLogin = (id: string) => {
    setUserId(id)
    setIsLoggedIn(true)
    setShowStartModal(true)
    setGameStarted(false)
  }

  const handleStart = () => {
    setShowStartModal(false)
    setGameStarted(true)
    localStorage.setItem('gameStarted', 'true')
  }

  const handleLogout = (targetUserId: string) => {
    // 212022が入力された場合、すべてのユーザーをログアウト
    // または、脱出成功後など任意のユーザーIDでログアウト
    if (targetUserId === '212022') {
      // すべてのログイン情報をクリア
      localStorage.removeItem('loggedInUsers')
    } else {
      // 特定のユーザーをログアウト
      const loggedInUsers = JSON.parse(localStorage.getItem('loggedInUsers') || '{}')
      delete loggedInUsers[targetUserId]
      localStorage.setItem('loggedInUsers', JSON.stringify(loggedInUsers))
    }
    
    // 現在のユーザー情報をクリア
    localStorage.removeItem('currentUserId')
    localStorage.removeItem('currentSessionId')
    localStorage.removeItem('gameStarted')
    setUserId('')
    setIsLoggedIn(false)
    setGameStarted(false)
    setShowStartModal(false)
  }

  return (
    <>
      {!isLoggedIn ? (
        <Login onLogin={handleLogin} />
      ) : (
        <>
          {showStartModal && (
            <StartModal onStart={handleStart} />
          )}
          {gameStarted && (
            <Game userId={userId} onLogout={handleLogout} />
          )}
        </>
      )}
    </>
  )
}

export default App
