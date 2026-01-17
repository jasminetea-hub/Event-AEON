import { useState, useEffect, useRef } from 'react'
import './App.css'
import PuzzleModal from './PuzzleModal'
import FinalPuzzleModal from './FinalPuzzleModal'
import LogoutModal from './LogoutModal'
import GameOverModal from './GameOverModal'
import EscapeSuccessModal from './EscapeSuccessModal'

interface GameProps {
  userId: string
  onLogout?: (userId: string) => void
}

function Game({ userId, onLogout }: GameProps) {
  const seasons = ['🌸', '🏖️', '🎃', '⛄️']
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null)
  const [solvedSeasons, setSolvedSeasons] = useState<Set<string>>(new Set())
  const [collectedLetters, setCollectedLetters] = useState<string[]>([])
  const [showFinalPuzzle, setShowFinalPuzzle] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showGameOverModal, setShowGameOverModal] = useState(false)
  const [showEscapeSuccessModal, setShowEscapeSuccessModal] = useState(false)
  const [titleClickCount, setTitleClickCount] = useState(0)
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(30 * 60) // 30分を秒で表現
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 取得可能な文字（重複を防ぐためSetを使用）
  const availableLetters = ['お', 'も', 'い', 'で']
  const correctOrder = ['お', 'も', 'い', 'で']

  // 「おもいで」の順序かどうかをチェック
  const isOmoidOrder = (letters: string[]): boolean => {
    if (letters.length !== correctOrder.length) return false
    return letters.every((letter, index) => letter === correctOrder[index])
  }

  // 絵文字から漢字へのマッピング
  const seasonEmojiToName: Record<string, string> = {
    '🌸': '春',
    '🏖️': '夏',
    '🎃': '秋',
    '⛄️': '冬'
  }

  // 漢字から絵文字へのマッピング
  const seasonNameToEmoji: Record<string, string> = {
    '春': '🌸',
    '夏': '🏖️',
    '秋': '🎃',
    '冬': '⛄️'
  }

  // 各季節の謎を定義
  const puzzles: Record<string, string> = {
    春: '何を言ってるのかな？',
    夏: 'これは何の形かわかるかな？\n４５９６８４',
    秋: '🔴　🔵　🟡　🟡　🟢\nなんて言ってるのかな？',
    冬: '🦌が２匹は12月の何日にいるのかな？'
  }
  

  // 各季節の正解を定義
  const answers: Record<string, string[]> = {
    春: ['てがみ', '手紙', 'テガミ'],
    夏: ['星', 'ほし', 'ホシ'],
    秋: ['HELLO', 'hello', 'Hello'],
    冬: ['18日', '１８日','１８','18']
  }

  // 各季節のヒントを定義（配列で複数のヒントを設定可能）
  const hints: Record<string, string[]> = {
    春: ['この線どこかでもみた気がするなー？'],
    夏: ['数字が書かれた展示がなかったかな？', 'モルックのピンに書かれていないかな？'],
    秋: ['看板に色がありそうだね！', '看板の文字に色丸があるね'],
    冬: ['どこかの看板にいるかも？']
  }

  // 最後の謎を定義
  const finalPuzzle = '4つの季節を越えて、あなたはここまで来ました。\n\n正しい言葉が完成したとき、\n真実が明らかになります。'
  
  const finalHint = '集めた4つの文字を正しい順序に並べ替えてください'
  
  const finalAnswers = ['おもいで', '思い出', 'おもいで', 'オモイデ']

  // タイマーの開始
  useEffect(() => {
    // ゲームが開始されているか確認
    const savedGameStarted = localStorage.getItem('gameStarted') === 'true'
    const savedTime = localStorage.getItem('timerStartTime')
    
    if (savedGameStarted && savedTime) {
      // ゲームが開始されていて、タイマー開始時刻が保存されている場合
      const startTime = parseInt(savedTime, 10)
      // タイマー開始時刻が無効（0、NaN、または未来の時刻）の場合は新しく開始
      if (!startTime || isNaN(startTime) || startTime > Date.now()) {
        setTimeRemaining(30 * 60)
        localStorage.setItem('timerStartTime', Date.now().toString())
      } else {
        const elapsed = Math.floor((Date.now() - startTime) / 1000)
        const remaining = Math.max(0, 30 * 60 - elapsed)
        setTimeRemaining(remaining)
        // 既に時間切れの場合のみ脱出失敗モーダルを表示（タイマーが有効な場合のみ）
        if (remaining === 0 && elapsed < 30 * 60 + 60) { // 1分のマージンを持たせる
          setShowGameOverModal(true)
        }
      }
    } else {
      // ゲームが開始されていない、またはタイマー開始時刻がない場合は新しく開始
      setTimeRemaining(30 * 60)
      localStorage.setItem('timerStartTime', Date.now().toString())
    }

    // タイマーを開始
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // タイマー終了
          if (timerRef.current) {
            clearInterval(timerRef.current)
          }
          // 脱出失敗モーダルを表示
          setShowGameOverModal(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  // タイマーの残り時間を保存
  useEffect(() => {
    if (timeRemaining > 0) {
      const elapsed = 30 * 60 - timeRemaining
      const startTime = Date.now() - elapsed * 1000
      localStorage.setItem('timerStartTime', startTime.toString())
    }
  }, [timeRemaining])

  // ログインIDが「300」の場合は脱出成功画面を表示
  useEffect(() => {
    if (userId === '300') {
      setTimeout(() => {
        setShowEscapeSuccessModal(true)
      }, 500)
    }
  }, [userId])

  // 4つすべて揃ったら最後の謎を表示
  useEffect(() => {
    if (solvedSeasons.size === 4 && !showFinalPuzzle) {
      // 少し遅延させて表示
      setTimeout(() => {
        setShowFinalPuzzle(true)
      }, 500)
    }
  }, [solvedSeasons.size, showFinalPuzzle])

  // タイマー表示用のフォーマット
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleSeasonClick = (season: string) => {
    setSelectedSeason(season)
  }

  const handleCloseModal = () => {
    setSelectedSeason(null)
  }

  const handleCorrectAnswer = (season: string) => {
    // 漢字から絵文字に変換（またはそのまま）
    const seasonEmoji = seasonNameToEmoji[season] || season
    setSolvedSeasons(prev => {
      const newSolved = new Set([...prev, seasonEmoji])
      return newSolved
    })
    
    // まだ取得していない文字を取得（重複を防ぐためSetを使用）
    setCollectedLetters(currentLetters => {
      // 重複を除去（念のため）
      const uniqueLetters = Array.from(new Set(currentLetters))
      
      // 既に取得済みの文字をSetで管理
      const existingLetters = new Set(uniqueLetters)
      const remainingLetters = availableLetters.filter(
        letter => !existingLetters.has(letter)
      )
      
      if (remainingLetters.length > 0) {
        // 新しい文字を追加したときに「おもいで」の順序にならないようにする
        let selectedLetter: string | null = null
        
        // ランダムに文字を選ぶが、「おもいで」の順序にならないようにする
        const shuffled = [...remainingLetters]
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }
        
        // 「おもいで」の順序にならない文字を選ぶ
        for (const letter of shuffled) {
          const testLetters = [...uniqueLetters, letter]
          if (!isOmoidOrder(testLetters)) {
            selectedLetter = letter
            break
          }
        }
        
        // すべて「おもいで」の順序になってしまう場合は、最初の文字を選ぶ
        if (selectedLetter === null && remainingLetters.length > 0) {
          selectedLetter = remainingLetters[0]
        }
        
        if (selectedLetter) {
          // 重複チェックを追加
          if (!uniqueLetters.includes(selectedLetter)) {
            return [...uniqueLetters, selectedLetter]
          }
        }
      }
      
      return uniqueLetters
    })
    
    setSelectedSeason(null)
  }

  // 文字を入れ替える関数
  const handleLetterSwap = (index1: number, index2: number) => {
    if (index1 === index2) return
    setCollectedLetters(prev => {
      const newLetters = [...prev]
      ;[newLetters[index1], newLetters[index2]] = [newLetters[index2], newLetters[index1]]
      return newLetters
    })
  }

  // 文字をクリックしたときの処理
  const [selectedLetterIndex, setSelectedLetterIndex] = useState<number | null>(null)

  const handleLetterClick = (index: number) => {
    if (selectedLetterIndex === null) {
      // 最初の文字を選択
      setSelectedLetterIndex(index)
    } else if (selectedLetterIndex === index) {
      // 同じ文字をクリックしたら選択解除
      setSelectedLetterIndex(null)
    } else {
      // 2つ目の文字をクリックしたら入れ替え
      handleLetterSwap(selectedLetterIndex, index)
      setSelectedLetterIndex(null)
    }
  }

  // タイトルをクリックしたときの処理
  const handleTitleClick = () => {
    // タイムアウトをクリア
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current)
    }

    const newCount = titleClickCount + 1
    setTitleClickCount(newCount)

    // 3回クリックでログアウト画面を表示
    if (newCount >= 3) {
      setShowLogoutModal(true)
      setTitleClickCount(0)
    } else {
      // 1秒後にカウントをリセット
      clickTimeoutRef.current = setTimeout(() => {
        setTitleClickCount(0)
      }, 1000)
    }
  }

  // ログアウト処理
  const handleLogout = (targetUserId: string) => {
    if (onLogout) {
      onLogout(targetUserId)
    }
  }

  // ICカード読み取り成功時の処理
  const handleCardRead = (cardId: string) => {
    console.log('カード読み取り成功:', cardId)
    setShowFinalPuzzle(false)
    setShowEscapeSuccessModal(true)
    // タイマーを停止
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
  }

  return (
    <div className="App">
      <h1 className="title" onClick={handleTitleClick} style={{ cursor: 'pointer' }}>
        失われた季節からの脱出
      </h1>
      <div className="timer-container">
        <div className="timer-label">残り時間</div>
        <div className={`timer-display ${timeRemaining <= 60 ? 'timer-warning' : ''}`}>
          {formatTime(timeRemaining)}
        </div>
      </div>
      <div className="letters-container">
        <div className="letters-box">
          {collectedLetters.length > 0 ? (
            collectedLetters.map((letter, index) => (
              <span
                key={index}
                className={`letter-item ${selectedLetterIndex === index ? 'selected' : ''}`}
                onClick={() => handleLetterClick(index)}
              >
                {letter}
              </span>
            ))
          ) : (
            <span className="letters-placeholder">？ ？ ？ ？</span>
          )}
        </div>
      </div>
      <div className="seasons-container">
        {seasons.map((season, index) => (
          <button
            key={index}
            className={`season-box ${solvedSeasons.has(season) ? `solved solved-${season}` : ''}`}
            onClick={() => handleSeasonClick(season)}
          >
            <div className="season-placeholder">{season}</div>
          </button>
        ))}
      </div>
      {selectedSeason && (
        <PuzzleModal
          season={seasonEmojiToName[selectedSeason] || selectedSeason}
          puzzle={puzzles[seasonEmojiToName[selectedSeason]] || ''}
          hint={hints[seasonEmojiToName[selectedSeason]] || []}
          correctAnswers={answers[seasonEmojiToName[selectedSeason]] || []}
          isSolved={solvedSeasons.has(selectedSeason)}
          onClose={handleCloseModal}
          onCorrect={handleCorrectAnswer}
        />
      )}
      {showFinalPuzzle && (
        <FinalPuzzleModal
          puzzle={finalPuzzle}
          hint={finalHint}
          correctAnswers={finalAnswers}
          collectedLetters={collectedLetters}
          onLetterSwap={handleLetterSwap}
          selectedLetterIndex={selectedLetterIndex}
          onLetterClick={handleLetterClick}
          onClose={() => setShowFinalPuzzle(false)}
          onCorrect={() => {
            setShowFinalPuzzle(false)
            // 脱出成功モーダルを表示
            setShowEscapeSuccessModal(true)
          }}
          onCardRead={handleCardRead}
          userId={userId}
        />
      )}
      {showEscapeSuccessModal && (
        <EscapeSuccessModal
          onClose={() => {
            // 脱出成功後はゲームを終了してログアウト
            setShowEscapeSuccessModal(false)
            // タイマーを停止
            if (timerRef.current) {
              clearInterval(timerRef.current)
            }
            // ゲーム状態をクリア
            localStorage.removeItem('gameStarted')
            localStorage.removeItem('timerStartTime')
            // ログアウト処理
            if (onLogout) {
              onLogout(userId)
            }
          }}
        />
      )}
      {showLogoutModal && (
        <LogoutModal
          onClose={() => setShowLogoutModal(false)}
          onLogout={handleLogout}
        />
      )}
      {showGameOverModal && (
        <GameOverModal
          onClose={() => setShowGameOverModal(false)}
        />
      )}
    </div>
  )
}

export default Game
