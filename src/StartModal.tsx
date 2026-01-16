import './PuzzleModal.css'

interface StartModalProps {
  onStart: () => void
}

function StartModal({ onStart }: StartModalProps) {
  return (
    <div className="modal-overlay">
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <h2 className="modal-season">ゲーム開始</h2>
        <div className="modal-puzzle">
          <p>準備はできましたか？</p>
          <p>スタートボタンを押すと、ゲームがスタートするよ！</p>
        </div>
        <button
          type="button"
          className="submit-button"
          onClick={onStart}
          style={{ marginTop: '2rem', alignSelf: 'center' }}
        >
          スタート
        </button>
      </div>
    </div>
  )
}

export default StartModal
