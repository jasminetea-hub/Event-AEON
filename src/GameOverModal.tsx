import './PuzzleModal.css'

interface GameOverModalProps {
  onClose: () => void
}

function GameOverModal({ onClose }: GameOverModalProps) {
  return (
    <div className="modal-overlay">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-season">脱出失敗…</h2>
        <div className="modal-puzzle">
          <p>時間切れです。</p>
          <p>30分以内に脱出できませんでした。</p>
        </div>
        <button
          type="button"
          className="submit-button"
          onClick={onClose}
          style={{ marginTop: '2rem' }}
        >
          閉じる
        </button>
      </div>
    </div>
  )
}

export default GameOverModal
