import './PuzzleModal.css'

interface GameOverModalProps {
  onClose: () => void
}

function GameOverModal({ onClose }: GameOverModalProps) {
  const surveyUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSdB9exLr6cK_sK3AhhB3v6Tc289Pr8G91ca0awC5u1fBbakPg/viewform?usp=publish-editor'

  const handleClose = () => {
    // 新しいタブでアンケートフォームを開く
    window.open(surveyUrl, '_blank')
    // モーダルを閉じる
    onClose()
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <h2 className="modal-season" style={{ 
          color: '#f44336', 
          fontSize: '3rem',
          fontWeight: 'bold',
          marginBottom: '1.5rem'
        }}>
          脱出失敗
        </h2>
        <div className="modal-puzzle">
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#333' }}>
            出口に向かってね。
          </p>
        </div>
        <button
          type="button"
          className="submit-button"
          onClick={handleClose}
          style={{ marginTop: '2rem', backgroundColor: '#f44336', alignSelf: 'center' }}
        >
          アンケートに回答する
        </button>
      </div>
    </div>
  )
}

export default GameOverModal
