import './PuzzleModal.css'

interface EscapeSuccessModalProps {
  onClose: () => void
}

function EscapeSuccessModal({ onClose }: EscapeSuccessModalProps) {
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
          color: '#4caf50', 
          fontSize: '3rem',
          fontWeight: 'bold',
          marginBottom: '1.5rem'
        }}>
          脱出成功！
        </h2>
        <div className="modal-puzzle">
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#333' }}>
            おめでとうございます！
          </p>
          <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>あなたは無事に脱出に成功しました。</p>
          <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>失われた季節を取り戻し、</p>
          <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>「おもいで」を手に入れることができました。</p>
        </div>
        <button
          type="button"
          className="submit-button"
          onClick={handleClose}
          style={{ marginTop: '2rem', backgroundColor: '#4caf50', alignSelf: 'center' }}
        >
          アンケートに回答する
        </button>
      </div>
    </div>
  )
}

export default EscapeSuccessModal
