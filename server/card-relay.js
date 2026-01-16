// カード情報を中継する機能
// PC端末から送信されたカード情報を一時保存し、スマホからのリクエストに返す

// カード情報を一時保存（メモリベース、簡易実装）
// 本番環境では、Redisやデータベースを使用することを推奨
const cardInfoStore = new Map();
const CARD_INFO_TTL = 60000; // 60秒で期限切れ

// カード情報を保存する関数
export const saveCardInfo = (cardId, cardUserId) => {
  const timestamp = Date.now();
  cardInfoStore.set(cardId, {
    cardId,
    cardUserId,
    timestamp
  });
  
  // TTL後に自動削除
  setTimeout(() => {
    cardInfoStore.delete(cardId);
  }, CARD_INFO_TTL);
  
  console.log('📥 カード情報を保存:', { cardId, cardUserId, timestamp });
};

// カード情報を取得する関数
export function getCardInfo(cardId = null) {
  if (cardId) {
    // 特定のカードIDの情報を取得
    const info = cardInfoStore.get(cardId);
    if (info && (Date.now() - info.timestamp) < CARD_INFO_TTL) {
      return info;
    }
    return null;
  } else {
    // 最新のカード情報を取得（最後に追加されたもの）
    const entries = Array.from(cardInfoStore.entries());
    if (entries.length === 0) {
      return null;
    }
    
    // 最新のタイムスタンプを持つエントリを取得
    const latest = entries.reduce((latest, current) => {
      return current[1].timestamp > latest[1].timestamp ? current : latest;
    });
    
    // TTLをチェック
    if (Date.now() - latest[1].timestamp < CARD_INFO_TTL) {
      return latest[1];
    }
    
    return null;
  }
};

// すべてのカード情報をクリアする関数
export function clearCardInfo(cardId = null) {
  if (cardId) {
    cardInfoStore.delete(cardId);
  } else {
    cardInfoStore.clear();
  }
};

// 期限切れのカード情報をクリーンアップする関数
export function cleanupExpiredCards() {
  const now = Date.now();
  for (const [cardId, info] of cardInfoStore.entries()) {
    if (now - info.timestamp >= CARD_INFO_TTL) {
      cardInfoStore.delete(cardId);
    }
  }
};

// 定期的にクリーンアップ（1分ごと）
setInterval(cleanupExpiredCards, 60000);
