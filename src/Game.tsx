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
  const seasons = ['春', '夏', '秋', '冬']
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

  // 各季節の謎を定義
  const puzzles: Record<string, string> = {
    春: '桜の花びらが舞い散る季節。\n\n「最初の一歩を踏み出す時、\n何が咲き誇るのか？」',
    夏: '太陽が輝き、緑が生い茂る季節。\n\n「最も熱い時、\n何があなたを涼しくするのか？」',
    秋: '紅葉が美しく色づく季節。\n\n「実りの時、\n何が収穫されるのか？」',
    冬: '雪が降り、静寂に包まれる季節。\n\n「最も寒い時、\n何があなたを温めるのか？」'
  }

  // 各季節の正解を定義
  const answers: Record<string, string[]> = {
    春: ['あ'],
    夏: ['い'],
    秋: ['う'],
    冬: ['え']
  }

  // 各季節のヒントを定義
  const hints: Record<string, string> = {
    春: '新しい始まりを象徴するもの',
    夏: '水と関係がある',
    秋: '大地からの贈り物',
    冬: '光と関係がある'
  }

  // 最後の謎を定義
  const finalPuzzle = '4つの季節を越えて、あなたはここまで来ました。\n\n集めた4つの文字を並べ替えて、\n失われた言葉を復活させてください。\n\n正しい言葉が完成したとき、\n真実が明らかになります。'
  
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
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      const remaining = Math.max(0, 30 * 60 - elapsed)
      setTimeRemaining(remaining)
      // 既に時間切れの場合は脱出失敗モーダルを表示
      if (remaining === 0) {
        setShowGameOverModal(true)
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
    setSolvedSeasons(prev => {
      const newSolved = new Set([...prev, season])
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
          season={selectedSeason}
          puzzle={puzzles[selectedSeason]}
          hint={hints[selectedSeason]}
          correctAnswers={answers[selectedSeason]}
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
            // ゲームクリア処理をここに追加可能
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
