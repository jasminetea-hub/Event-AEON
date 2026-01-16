// PC端末用：カードリーダーでカードを読み取り、VPSサーバーに送信するスクリプト
// 使用方法: node pc-terminal/card-reader-client.js <VPS_SERVER_URL>

import pcsc from 'pcsclite';
import readline from 'readline';

const VPS_SERVER_URL = process.argv[2] || 'http://160.16.92.115:3001';
const SQLite3 = (await import('sqlite3')).default;
const path = await import('path');
const { fileURLToPath } = await import('url');
const fs = await import('fs');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// データベースパス
const testDbPath = path.join(__dirname, '../テストデータベース/cards.db');

// PC/SCリーダーの初期化
let pcscHandle = null;
let currentReader = null;

try {
  pcscHandle = pcsc();
  
  pcscHandle.on('reader', (reader) => {
    console.log('✅ リーダー検出:', reader.name);
    currentReader = reader;
    
    reader.on('status', (status) => {
      const changes = reader.state ^ status.state;
      if (changes) {
        if ((changes & reader.SCARD_STATE_PRESENT) && (status.state & reader.SCARD_STATE_PRESENT)) {
          console.log('📱 カードが検出されました');
          handleCardDetected(reader, status);
        }
      }
    });
    
    reader.on('error', (err) => {
      console.error('リーダーエラー:', err);
    });
  });
  
  pcscHandle.on('error', (err) => {
    console.error('PC/SCエラー:', err);
  });
  
} catch (error) {
  console.error('PC/SCの初期化エラー:', error);
  process.exit(1);
}

// カードを読み取る関数（簡易版、実際の実装はserver/index.jsを参照）
async function readCardFromReader(reader, status) {
  return new Promise((resolve, reject) => {
    const atr = status.atr;
    
    reader.connect({ share_mode: reader.SCARD_SHARE_SHARED }, (err, protocol) => {
      if (err) {
        reject(err);
        return;
      }
      
      // UID取得コマンド（Get Data: 0xFF 0xCA 0x00 0x00 0x00）
      const getUIDCommand = Buffer.from([0xFF, 0xCA, 0x00, 0x00, 0x00]);
      
      reader.transmit(getUIDCommand, 40, protocol, (err, data) => {
        if (err) {
          reader.disconnect(reader.SCARD_LEAVE_CARD, () => {});
          reject(err);
          return;
        }
        
        let cardId;
        if (data && data.length >= 4) {
          // 最後の2バイトがステータスコード（0x90, 0x00）か確認
          if (data.length >= 2 && data[data.length - 2] === 0x90 && data[data.length - 1] === 0x00) {
            const uidData = data.slice(0, data.length - 2);
            cardId = uidData.toString('hex').toUpperCase();
          } else {
            const uidLength = Math.min(data.length, 7);
            cardId = data.slice(0, uidLength).toString('hex').toUpperCase();
          }
        } else {
          // フォールバック: ATRを使用
          if (atr && atr.length > 0) {
            cardId = Buffer.from(atr).toString('hex').toUpperCase();
          } else {
            reader.disconnect(reader.SCARD_LEAVE_CARD, () => {});
            reject(new Error('UIDを取得できませんでした'));
            return;
          }
        }
        
        reader.disconnect(reader.SCARD_LEAVE_CARD, (disconnectErr) => {
          if (disconnectErr) {
            console.error('切断エラー:', disconnectErr);
          }
          resolve({ cardId, atr });
        });
      });
    });
  });
}

// データベースからカードユーザーIDを取得
async function getCardUserIdFromDatabase(cardId) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(testDbPath)) {
      resolve(null);
      return;
    }
    
    const db = new SQLite3.Database(testDbPath, SQLite3.OPEN_READONLY);
    
    db.get(
      'SELECT card_id, user_id FROM cards WHERE card_id = ?',
      [cardId],
      (err, row) => {
        db.close();
        if (err) {
          reject(err);
        } else {
          resolve(row ? row.user_id : null);
        }
      }
    );
  });
}

// VPSサーバーにカード情報を送信
async function sendCardToVPS(cardId, cardUserId) {
  try {
    const response = await fetch(`${VPS_SERVER_URL}/api/submit-card`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cardId,
        cardUserId
      }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ VPSサーバーにカード情報を送信しました');
      console.log(`   カードID: ${cardId}`);
      console.log(`   ユーザーID: ${cardUserId || '(未登録)'}`);
    } else {
      console.error('❌ VPSサーバーへの送信失敗:', data.error);
    }
    
    return data.success;
  } catch (error) {
    console.error('❌ VPSサーバーへの送信エラー:', error.message);
    return false;
  }
}

// カード検出時の処理
async function handleCardDetected(reader, status) {
  try {
    console.log('📖 カードを読み取り中...');
    
    // カードのUIDを読み取る
    const cardResult = await readCardFromReader(reader, status);
    const cardId = cardResult.cardId;
    
    console.log(`✅ カードID: ${cardId}`);
    
    // データベースからカードユーザーIDを取得
    let cardUserId = null;
    try {
      cardUserId = await getCardUserIdFromDatabase(cardId);
      if (cardUserId) {
        console.log(`✅ カードユーザーID: ${cardUserId}`);
      } else {
        console.log('⚠️  カードにユーザーIDが登録されていません');
      }
    } catch (error) {
      console.error('❌ データベース読み込みエラー:', error);
    }
    
    // VPSサーバーにカード情報を送信
    const success = await sendCardToVPS(cardId, cardUserId);
    
    if (success) {
      console.log('🎉 カード情報をVPSサーバーに送信しました');
      console.log('   スマホアプリで「脱出成功」が表示されるはずです');
    }
    
  } catch (error) {
    console.error('❌ カード読み取りエラー:', error.message);
  }
}

// メイン処理
console.log('🚀 PC端末 - カードリーダークライアント');
console.log(`📡 VPSサーバー: ${VPS_SERVER_URL}`);
console.log('');
console.log('カードをリーダーにかざしてください...');
console.log('（Ctrl+Cで終了）');

// 終了時の処理
process.on('SIGINT', () => {
  console.log('\n🛑 クライアントを終了します...');
  if (pcscHandle) {
    pcscHandle.close();
  }
  process.exit(0);
});
