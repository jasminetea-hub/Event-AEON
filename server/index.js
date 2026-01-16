import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import * as cardRelay from './card-relay.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { saveCardInfo, getCardInfo, clearCardInfo } = cardRelay;

// SQLite3を動的にインポート（テストデータベースから読み込む場合）
let sqlite3 = null;
let sqlite3Loaded = false;

// SQLite3を非同期で読み込む
(async () => {
  try {
    const sqlite3Module = await import('sqlite3');
    sqlite3 = sqlite3Module.default || sqlite3Module;
    sqlite3Loaded = true;
    console.log('sqlite3を読み込みました。テストデータベースから読み込めます。');
  } catch (error) {
    console.warn('sqlite3がインストールされていません。テストデータベースからの読み込みは無効です。');
  }
})();

const app = express();
const port = 3001;

// CORS設定
app.use(cors());
app.use(express.json());

// データファイルのパス
const CARDS_FILE = path.join(__dirname, 'cards.json');
const MAPPINGS_FILE = path.join(__dirname, 'mappings.json');

// データファイルの初期化
const initDataFiles = () => {
  if (!fs.existsSync(CARDS_FILE)) {
    fs.writeFileSync(CARDS_FILE, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(MAPPINGS_FILE)) {
    fs.writeFileSync(MAPPINGS_FILE, JSON.stringify({}, null, 2));
  }
};

initDataFiles();

// データを読み込む関数
const readCards = () => {
  try {
    const data = fs.readFileSync(CARDS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const readMappings = () => {
  try {
    const data = fs.readFileSync(MAPPINGS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
};

// データを保存する関数
const saveCards = (cards) => {
  fs.writeFileSync(CARDS_FILE, JSON.stringify(cards, null, 2));
};

const saveMappings = (mappings) => {
  fs.writeFileSync(MAPPINGS_FILE, JSON.stringify(mappings, null, 2));
};

// PC/SCリーダーの初期化（オプション）
let pcsc = null;
let currentReader = null;

try {
  // pcscliteがインストールされている場合のみ使用
  const pcscliteModule = await import('pcsclite');
  pcsc = pcscliteModule.default();
  
  pcsc.on('reader', (reader) => {
    console.log('リーダー検出:', reader.name);
    currentReader = reader;
    
    reader.on('status', (status) => {
      const changes = reader.state ^ status.state;
      if (changes) {
        if ((changes & reader.SCARD_STATE_EMPTY) && (status.state & reader.SCARD_STATE_EMPTY)) {
          console.log('カードが取り外されました');
        }
        if ((changes & reader.SCARD_STATE_PRESENT) && (status.state & reader.SCARD_STATE_PRESENT)) {
          console.log('カードが検出されました');
        }
      }
    });
    
    reader.on('error', (err) => {
      console.error('リーダーエラー:', err);
    });
  });
  
  pcsc.on('error', (err) => {
    console.error('PC/SCエラー:', err);
  });
  
  console.log('ICカードリーダー機能が有効です');
} catch (error) {
  console.warn('pcscliteがインストールされていません。ICカードリーダー機能は無効です。');
  console.warn('インストールするには: npm install pcsclite');
}

// カードを読み取る関数（モック実装も含む）
const readCardFromReader = async () => {
  if (!currentReader) {
    console.error('❌ ICカードリーダーが接続されていません');
    throw new Error('ICカードリーダーが接続されていません');
  }

  console.log('📱 カード読み取り開始...');
  console.log('リーダー名:', currentReader.name);
  console.log('カードをリーダーに近づけてください（10秒以内）');

  // カードの状態を監視して、カードが検出されるまで待つ
  return new Promise((resolve, reject) => {
    let cardDetected = false;
    let statusHandler = null;
    let cardAtr = null; // ATRを保存（カード登録時に使用）
    
    const timeout = setTimeout(() => {
      if (!cardDetected) {
        if (statusHandler) {
          currentReader.removeListener('status', statusHandler);
        }
        console.error('❌ タイムアウト: カードが検出されませんでした（10秒以内にカードをかざしてください）');
        reject(new Error('カードが検出されませんでした。カードをリーダーに近づけて、もう一度お試しください。'));
      }
    }, 10000); // 10秒タイムアウト

    statusHandler = (status) => {
      // デバッグ: statusイベントの発生をログに記録
      console.log('📡 statusイベント発生:', {
        state: status ? status.state : 'null',
        atr: status && status.atr ? Buffer.from(status.atr).toString('hex') : 'なし',
        hasState: !!status?.state
      });
      
      try {
        // カードが検出された場合
        if (status && status.state && (status.state & currentReader.SCARD_STATE_PRESENT)) {
          if (cardDetected) return; // 既に処理中の場合はスキップ
          
          cardDetected = true;
          clearTimeout(timeout);
          currentReader.removeListener('status', statusHandler);

          // カードに接続
          // pcscliteのconnectは、コールバックに(err, protocol, card)を渡す
          // ただし、cardオブジェクトがundefinedの場合があるため、readerから直接コマンドを送信
          const atr = status.atr;
          
          // atrをスコープの外に保存（カード登録時に使用）
          cardAtr = atr;
          console.log('カード検出:', {
            atr: atr ? Buffer.from(atr).toString('hex') : 'なし',
            atrLength: atr ? atr.length : 0
          });
          
          currentReader.connect({ share_mode: currentReader.SCARD_SHARE_SHARED }, (err, protocol, card) => {
            if (err) {
              console.error('カード接続エラー:', err);
              reject(new Error(`カード接続エラー: ${err.message || err}`));
              return;
            }

            const actualCard = card;
            const actualProtocol = protocol;
            
            console.log('connectコールバック:', {
              protocol: actualProtocol,
              card: actualCard ? '存在' : 'undefined',
              cardType: typeof actualCard
            });
            
            // MifareカードのUID（固有番号）を取得
            let cardId;
            
            // cardオブジェクトを使用可能か確認
            const cardToUse = actualCard;
            
            if (cardToUse && typeof cardToUse.transmit === 'function') {
              console.log('card.transmitを使用してUIDを取得します');
              try {
                // 方法1: ISO 14443 Type AのSELECTコマンドでUIDを取得
                // SELECTコマンド: 0x93 0x20 (Cascade Level 1)
                const selectCommand = Buffer.from([0x93, 0x20]);
                
                try {
                  const response = cardToUse.transmit(selectCommand, 20, actualProtocol || protocol);
                  
                  if (response && response.length >= 4) {
                    // MifareカードのSELECT応答形式:
                    // - Mifare Classic: 4バイトのUID + 1バイトのBCC
                    // - Mifare Ultralight: 7バイトのUID + 1バイトのBCC
                    // 応答の最初のバイトが0x04または0x08の場合、その後のバイトがUID
                    
                    let uid;
                    if (response[0] === 0x04 && response.length >= 5) {
                      // Mifare Classic (4バイトUID)
                      uid = response.slice(1, 5);
                      cardId = uid.toString('hex');
                    } else if (response[0] === 0x08 && response.length >= 9) {
                      // Mifare Ultralight (7バイトUID)
                      uid = response.slice(1, 8);
                      cardId = uid.toString('hex');
                    } else if (response.length >= 4) {
                      // 応答形式が不明な場合、最初の4-7バイトをUIDとして使用
                      const uidLength = Math.min(7, response.length - 1);
                      uid = response.slice(0, uidLength);
                      cardId = uid.toString('hex');
                    } else {
                      throw new Error('SELECTコマンドの応答が短すぎます');
                    }
                  } else {
                    throw new Error('SELECTコマンドの応答が不正です');
                  }
                } catch (selectError) {
                  throw selectError;
                }
              } catch (transmitError) {
                // フォールバック: ATRからUIDを抽出
                // 注意: ATRはカードタイプによって同じになることがあるため、UIDとして使用するのは推奨されない
                if (atr && atr.length > 0) {
                  const atrHex = Buffer.from(atr).toString('hex');
                  cardId = atrHex;
                  console.warn('警告: SELECTコマンドが失敗したため、ATRを使用しています。同じカードタイプで同じUIDになる可能性があります。');
                } else {
                  throw new Error('カードのUIDが取得できませんでした');
                }
              }
              
              // card.transmitが使えた場合、カードを切断してcardIdとatrを返す
              if (cardId) {
                if (actualCard && typeof actualCard.disconnect === 'function') {
                  actualCard.disconnect(currentReader.SCARD_LEAVE_CARD, (disconnectErr) => {
                    if (disconnectErr) {
                      console.error('カード切断エラー:', disconnectErr);
                    }
                    resolve({ cardId, atr });
                  });
                } else if (currentReader && typeof currentReader.disconnect === 'function') {
                  currentReader.disconnect(currentReader.SCARD_LEAVE_CARD, (disconnectErr) => {
                    if (disconnectErr) {
                      console.error('カード切断エラー:', disconnectErr);
                    }
                    resolve({ cardId, atr });
                  });
                } else {
                  resolve({ cardId, atr });
                }
                return;
              }
            } else {
              // card.transmitが使えない場合、readerから直接コマンドを送信（コールバック形式）
              // テストデータベースのcard_reader.jsと同じ方法を使用
              console.log('card.transmitが使用できないため、readerから直接コマンドを送信します');
              
              // ATRを表示（テストデータベースと同じ）
              if (atr && atr.length > 0) {
                const atrHex = Buffer.from(atr).toString('hex').toUpperCase();
                console.log(`ATR (Answer To Reset): ${atrHex}`);
                console.log(`ATR長さ: ${atr.length}バイト`);
              }
              
              // Mifare Classic用のUID取得コマンド（Get Data: 0xFF 0xCA 0x00 0x00 0x00）
              const getUIDCommand = Buffer.from([0xFF, 0xCA, 0x00, 0x00, 0x00]);
              
              // pcscliteのreader.transmitはコールバック形式（テストデータベースと同じ）
              currentReader.transmit(getUIDCommand, 40, actualProtocol || protocol, (err, data) => {
                if (err) {
                  console.error('UID取得コマンドエラー:', err);
                  console.log('カードタイプがMifare Classicではない可能性があります。');
                  // テストデータベースと同じ方法でフォールバック
                  if (atr && atr.length > 0) {
                    const atrHex = Buffer.from(atr).toString('hex').toUpperCase();
                    cardId = atrHex;
                    console.warn('警告: UID取得コマンドが失敗したため、ATRを使用しています。同じカードタイプで同じUIDになる可能性があります。');
                    
                    // カードを切断して解決（テストデータベースと同じ方法）
                    // cardIdとatrを返す
                    currentReader.disconnect(currentReader.SCARD_LEAVE_CARD, (disconnectErr) => {
                      if (disconnectErr) {
                        console.error('切断エラー:', disconnectErr);
                      }
                      resolve({ cardId, atr });
                    });
                  } else {
                    currentReader.disconnect(currentReader.SCARD_LEAVE_CARD, () => {});
                    reject(new Error('カードのUIDが取得できませんでした'));
                  }
                  return;
                }

                // デバッグ: レスポンスデータを表示（テストデータベースと同じ）
                if (data) {
                  console.log(`UID取得レスポンス (Raw): ${data.toString('hex').toUpperCase()}`);
                  console.log(`UID取得レスポンス (長さ): ${data.length}バイト`);
                }
                
                if (data && data.length >= 4) {
                  // レスポンス形式: [UID 4-7バイト] + [ステータスコード 2バイト (0x90, 0x00)]
                  // 例: CB9D24AE9000 + 9000 → [CB, 9D, 24, AE, 90, 00, 90, 00]
                  
                  let cardId;
                  
                  // 最後の2バイトがステータスコード（0x90, 0x00）か確認（テストデータベースと同じ）
                  if (data.length >= 2 && data[data.length - 2] === 0x90 && data[data.length - 1] === 0x00) {
                    // ステータスコードを除いた部分がUID
                    const uidData = data.slice(0, data.length - 2);
                    cardId = uidData.toString('hex').toUpperCase();
                    console.log(`UID (カードID): ${cardId}`);
                  } else {
                    // ステータスコードがない場合、全体をUIDとして扱う
                    // ただし、通常は4-7バイト
                    const uidLength = Math.min(data.length, 7);
                    cardId = data.slice(0, uidLength).toString('hex').toUpperCase();
                    console.log(`UID (カードID): ${cardId}`);
                  }
                  
                  // カードタイプを検出（テストデータベースと同じ）
                  const atrHex = atr ? Buffer.from(atr).toString('hex').toUpperCase() : '';
                  let cardType = 'Unknown';
                  if (atrHex.includes('3B8F8001804F0CA000000306030001000000006A') || 
                      atrHex.startsWith('3B8F8001804F0CA000000306030001')) {
                    cardType = 'Mifare Classic';
                  }
                  console.log(`カードタイプ: ${cardType}`);
                  
                  // カードを切断して解決（テストデータベースと同じ方法）
                  // cardIdとatrを返す
                  currentReader.disconnect(currentReader.SCARD_LEAVE_CARD, (disconnectErr) => {
                    if (disconnectErr) {
                      console.error('切断エラー:', disconnectErr);
                    }
                    resolve({ cardId, atr });
                  });
                } else {
                  // データが空または短すぎる場合
                  console.log('UID取得コマンドの応答が不正です。ATRから情報を取得します...');
                  // フォールバック: ATRを使用
                  if (atr && atr.length > 0) {
                    const atrHex = Buffer.from(atr).toString('hex').toUpperCase();
                    cardId = atrHex;
                    console.warn('警告: ATRを使用しています。同じカードタイプで同じUIDになる可能性があります。');
                    
                    // カードを切断して解決
                    // cardIdとatrを返す
                    currentReader.disconnect(currentReader.SCARD_LEAVE_CARD, (disconnectErr) => {
                      if (disconnectErr) {
                        console.error('切断エラー:', disconnectErr);
                      }
                      resolve({ cardId, atr });
                    });
                  } else {
                    currentReader.disconnect(currentReader.SCARD_LEAVE_CARD, () => {});
                    reject(new Error('カードのUIDが取得できませんでした'));
                  }
                }
              });
              
              // コールバック形式なので、ここでreturn（以下の処理は実行しない）
              return;
            }
            // カードを切断
            // cardIdとatrを返す
            if (actualCard && typeof actualCard.disconnect === 'function') {
              actualCard.disconnect(currentReader.SCARD_LEAVE_CARD, (disconnectErr) => {
                if (disconnectErr) {
                  console.error('カード切断エラー:', disconnectErr);
                }
                resolve({ cardId, atr });
              });
            } else if (currentReader && typeof currentReader.disconnect === 'function') {
              currentReader.disconnect(currentReader.SCARD_LEAVE_CARD, (disconnectErr) => {
                if (disconnectErr) {
                  console.error('カード切断エラー:', disconnectErr);
                }
                resolve({ cardId, atr });
              });
            } else {
              // 切断できない場合は、そのまま解決
              resolve({ cardId, atr });
            }
          });
        }
      } catch (error) {
        console.error('statusHandler内でエラー:', error);
        if (!cardDetected) {
          cardDetected = true;
          clearTimeout(timeout);
          currentReader.removeListener('status', statusHandler);
          reject(error);
        }
      }
    };

    // statusイベントを監視
    currentReader.on('status', statusHandler);
  });
};

// ICカードを読み取り、カードユーザーIDを返すAPI（スマホ待機用）
// このAPIはスマホが最後の謎を解いた後に呼び出され、
// PCがカードを読み取ってカードユーザーIDを返すまで待機する
// PC側の処理：
// 1. カードリーダーでUIDを読み取る
// 2. データベースを参照してそのUIDからカードユーザーID（user_id）を取得
// 3. カードユーザーIDをスマホに送信
app.post('/api/wait-for-card', async (req, res) => {
  try {
    if (!currentReader) {
      return res.status(503).json({ 
        success: false, 
        error: 'ICカードリーダーが接続されていません' 
      });
    }

    console.log('📱 スマホからカード読み取り待機リクエストを受信しました');
    console.log('カードをPCのカードリーダーにかざしてください...');

    // ステップ1: カードリーダーでUIDを読み取る
    let cardResult;
    
    try {
      cardResult = await readCardFromReader();
      // cardResultは { cardId, atr } 形式
    } catch (error) {
      console.error('カード読み取りエラー（詳細）:', error);
      return res.json({ 
        success: false, 
        message: error.message || 'カードが検出されませんでした。カードをかざしてください。',
        error: error.message
      });
    }

    const cardId = cardResult.cardId;
    const cardAtr = cardResult.atr;
    
    console.log('✅ カード読み取り成功 - UID:', cardId);
    
    // ステップ2: データベースを参照して、そのUIDからカードユーザーID（user_id）を取得
    
    // まずcards.jsonから検索
    let card = null;
    const cards = readCards();
    card = cards.find(c => c.card_id === cardId);
    
    // cards.jsonに見つからない場合、テストデータベース（cards.db）から検索
    if (!card && sqlite3Loaded) {
      const testDbPath = path.join(__dirname, '../テストデータベース/cards.db');
      if (fs.existsSync(testDbPath)) {
        try {
          const Database = sqlite3.Database || sqlite3.default?.Database || sqlite3;
          const OPEN_READONLY = sqlite3.OPEN_READONLY || 1;
          
          const db = new Database(testDbPath, OPEN_READONLY);
          
          // テーブル構造を確認してuser_idカラムがあるかチェック
          const pragmaRows = await new Promise((resolve, reject) => {
            db.all("PRAGMA table_info(cards)", [], (err, rows) => {
              if (err) {
                reject(err);
              } else {
                resolve(rows);
              }
            });
          });
          
          const hasUserIdColumn = pragmaRows.some(col => col.name === 'user_id');
          const selectColumns = hasUserIdColumn 
            ? 'id, card_id, card_type, user_id, read_at, created_at'
            : 'id, card_id, card_type, read_at, created_at';
          
          const row = await new Promise((resolve, reject) => {
            db.get(
              `SELECT ${selectColumns} FROM cards WHERE card_id = ?`,
              [cardId],
              (err, row) => {
                db.close();
                if (err) {
                  reject(err);
                } else {
                  resolve(row);
                }
              }
            );
          });
          
          if (row) {
            card = {
              id: row.id,
              card_id: row.card_id,
              user_id: row.user_id || null,
              registered_at: row.read_at || row.created_at || null,
              notes: row.card_type || null
            };
            console.log('✅ データベースからカード情報を取得:', card);
          }
        } catch (error) {
          console.error('データベース読み込みエラー:', error);
        }
      }
    }
    
    // ステップ3: カードユーザーID（user_id）を取得してスマホに送信
    if (!card) {
      console.log('⚠️  カードが見つかりませんでした:', cardId);
      return res.json({
        success: false,
        cardUserId: null,
        message: 'このカードはデータベースに登録されていません。',
        cardId: cardId
      });
    }
    
    const cardUserId = card.user_id;
    console.log('📤 スマホに送信するカードユーザーID:', cardUserId);
    console.log('   カードUID:', cardId);
    
    // カードユーザーIDをスマホに送信（照合はスマホ側で行う）
    res.json({
      success: true,
      cardId: cardId,
      cardUserId: cardUserId,
      message: cardUserId ? 'カードが読み取られました' : 'カードにユーザーIDが登録されていません'
    });

  } catch (error) {
    console.error('カード読み取りエラー:', error);
    if (error.message && error.message.includes('timeout')) {
      return res.json({ 
        success: false, 
        message: 'カードが検出されませんでした。カードをかざしてください。' 
      });
    }
    res.status(500).json({ 
      success: false, 
      error: error.message || 'カード読み取りに失敗しました' 
    });
  }
});

// ICカードを読み取るAPI（IDと照合）- 後方互換性のため残す
app.post('/api/read-card', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userIdが必要です'
      });
    }
    
    if (!currentReader) {
      return res.status(503).json({ 
        success: false, 
        error: 'ICカードリーダーが接続されていません' 
      });
    }

    let readCardResult;
    
    try {
      readCardResult = await readCardFromReader();
      // readCardResultは { cardId, atr } 形式
    } catch (error) {
      console.error('カード読み取りエラー（詳細）:', error);
      return res.json({ 
        success: false, 
        message: error.message || 'カードが検出されませんでした。カードをかざしてください。',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }

    const readCardId = readCardResult.cardId;
    const readCardAtr = readCardResult.atr;
    
    // カードタイプを判定
    let readCardType = 'Unknown';
    if (readCardAtr && readCardAtr.length > 0) {
      const atrHex = Buffer.from(readCardAtr).toString('hex').toUpperCase();
      if (atrHex.includes('3B8F8001804F0CA000000306030001000000006A') || 
          atrHex.startsWith('3B8F8001804F0CA000000306030001')) {
        readCardType = 'Mifare Classic';
      }
    }
    
    console.log('カード読み取り成功:', readCardId);
    console.log('カードタイプ:', readCardType);
    console.log('現在のユーザーID:', userId);
    
    // ステップ1: データベースから同じカード番号のカードを検索
    // データベース（cards.json）からカード情報を取得
    let readCardData = null;
    const readCardsData = readCards();
    readCardData = readCardsData.find(c => c.card_id === readCardId);
    console.log('cards.jsonから検索:', readCardData ? '見つかりました' : '見つかりませんでした');
    
    // ステップ2: cards.jsonに見つからない場合、テストデータベース（cards.db）から検索
    if (!readCardData && sqlite3Loaded) {
      console.log('テストデータベースから検索します...');
      const testDbPath = path.join(__dirname, '../テストデータベース/cards.db');
      if (fs.existsSync(testDbPath)) {
        try {
          // sqlite3がまだ読み込まれていない場合は待機
          if (!sqlite3Loaded) {
            for (let i = 0; i < 50; i++) {
              await new Promise(resolve => setTimeout(resolve, 100));
              if (sqlite3Loaded) break;
            }
          }
          
          const Database = sqlite3.Database || sqlite3.default?.Database || sqlite3;
          const OPEN_READONLY = sqlite3.OPEN_READONLY || 1;
          
          const db = new Database(testDbPath, OPEN_READONLY);
          // まずテーブル構造を確認してuser_idカラムがあるかチェック
          const pragmaRows = await new Promise((resolve, reject) => {
            db.all("PRAGMA table_info(cards)", [], (err, rows) => {
              if (err) {
                reject(err);
              } else {
                resolve(rows);
              }
            });
          });
          
          const hasUserIdColumn = pragmaRows.some(col => col.name === 'user_id');
          // user_idカラムがある場合は含める（カラムが存在しない場合はエラーになるが、その場合は別のクエリを試す）
          const selectColumns = hasUserIdColumn 
            ? 'id, card_id, card_type, user_id, read_at, created_at'
            : 'id, card_id, card_type, read_at, created_at';
          
          const row = await new Promise((resolve, reject) => {
            db.get(
              `SELECT ${selectColumns} FROM cards WHERE card_id = ?`,
              [readCardId],
              (err, row) => {
                db.close();
                if (err) {
                  reject(err);
                } else {
                  resolve(row);
                }
              }
            );
          });
          
          if (row) {
            // テストデータベースのカード情報をcards.jsonの形式に変換
            readCardData = {
              id: row.id,
              card_id: row.card_id,
              user_id: row.user_id || null,
              registered_at: row.read_at || row.created_at || null,
              notes: row.card_type || null
            };
            console.log('テストデータベースからカードを取得:', readCardData);
          }
        } catch (error) {
          console.error('テストデータベース読み込みエラー:', error);
        }
      }
    }
    
    if (!readCardData) {
      // このカードはデータベースに登録されていない
      // 自動的にデータベースに登録する
      console.log('⚠️  カードが見つかりませんでした。データベースに登録します:', readCardId);
      
      try {
        // テストデータベース（cards.db）に登録
        if (sqlite3Loaded) {
          const testDbPath = path.join(__dirname, '../テストデータベース/cards.db');
          if (fs.existsSync(testDbPath)) {
            const Database = sqlite3.Database || sqlite3.default?.Database || sqlite3;
            const OPEN_READWRITE = sqlite3.OPEN_READWRITE || 2;
            
            const db = new Database(testDbPath, OPEN_READWRITE);
            
            // カードタイプを判定（readCardAtrを使用）
            const atrHex = readCardAtr ? Buffer.from(readCardAtr).toString('hex').toUpperCase() : '';
            if (atrHex.includes('3B8F8001804F0CA000000306030001000000006A') || 
                atrHex.startsWith('3B8F8001804F0CA000000306030001')) {
              readCardType = 'Mifare Classic';
            }
            
            console.log('データベースに登録するカード情報:', {
              cardId: readCardId,
              cardType: readCardType,
              userId: userId || null
            });
            
            // カードをデータベースに登録（user_idはログインIDで登録）
            await new Promise((resolve, reject) => {
              db.run(
                `INSERT INTO cards (card_id, card_type, user_id, read_at)
                 VALUES (?, ?, ?, datetime('now'))`,
                [readCardId, readCardType, userId || null],
                function(err) {
                  if (err) {
                    if (err.message.includes('UNIQUE constraint')) {
                      // 既に登録されている場合、user_idを更新
                      db.run(
                        `UPDATE cards SET user_id = ?, read_at = datetime('now') WHERE card_id = ?`,
                        [userId || null, readCardId],
                        (updateErr) => {
                          db.close();
                          if (updateErr) {
                            console.error('user_id更新エラー:', updateErr);
                            reject(updateErr);
                          } else {
                            console.log('✅ カードのuser_idを更新しました:', readCardId, '→', userId);
                            resolve();
                          }
                        }
                      );
                    } else {
                      db.close();
                      console.error('カード登録エラー:', err);
                      reject(err);
                    }
                  } else {
                    db.close();
                    console.log('✅ カードをデータベースに登録しました:', readCardId);
                    resolve();
                  }
                }
              );
            });
            
            // 登録したカード情報を取得
            const db2 = new Database(testDbPath, OPEN_READWRITE);
            const row = await new Promise((resolve, reject) => {
              db2.get(
                `SELECT id, card_id, card_type, user_id, read_at, created_at FROM cards WHERE card_id = ?`,
                [readCardId],
                (err, row) => {
                  db2.close();
                  if (err) {
                    reject(err);
                  } else {
                    resolve(row);
                  }
                }
              );
            });
            
            if (row) {
              readCardData = {
                id: row.id,
                card_id: row.card_id,
                user_id: row.user_id || null,
                registered_at: row.read_at || row.created_at || null,
                notes: row.card_type || null
              };
              console.log('登録したカード情報:', readCardData);
            }
          }
        }
      } catch (registerError) {
        console.error('カード登録エラー:', registerError);
        // 登録に失敗しても、エラーを返さずに続行
      }
      
      // まだカードが見つからない場合
      if (!readCardData) {
        return res.json({
          success: false,
          matched: false,
          message: 'このカードは登録されていません。データベースへの登録に失敗しました。',
          cardId: readCardId
        });
      }
      
      // カードが登録されたが、user_idが設定されていない場合
      if (!readCardData.user_id) {
        return res.json({
          success: false,
          matched: false,
          message: `カードをデータベースに登録しました。user_idが設定されていないため、ログインID（${userId}）との照合ができません。カードにuser_idを設定してください。`,
          cardId: readCardId,
          cardUserId: null,
          loginUserId: userId
        });
      }
    }
    
    // ステップ3: データベースから取得したカードのID（user_id）を取得
    const readCardUserId = readCardData.user_id;
    console.log('カード情報:', {
      cardId: readCardData.card_id,
      cardUserId: readCardUserId,  // データベースに登録されているカードのID
      loginUserId: userId,     // ログイン時に入力したID
      userIdType: typeof readCardUserId,
      loginUserIdType: typeof userId
    });
    
    // ステップ4: カードのID（user_id）とログインIDを照合
    
    if (readCardUserId === null || readCardUserId === undefined || readCardUserId === '') {
      // カードのID（user_id）が設定されていない
      console.log('❌ カードのID（user_id）が設定されていません');
      return res.json({
        success: false,
        matched: false,
        message: 'このカードにはIDが登録されていません。カードにuser_idを設定してください。',
        cardId: readCardId,
        cardUserId: readCardUserId,
        loginUserId: userId
      });
    }
    
    // 文字列として比較（型の違いを考慮）
    const readCardUserIdStr = String(readCardUserId);
    const loginUserIdStr = String(userId);
    
    console.log('照合:', {
      カードのID: readCardUserIdStr,
      ログインID: loginUserIdStr,
      一致: readCardUserIdStr === loginUserIdStr
    });
    
    if (readCardUserIdStr !== loginUserIdStr) {
      // IDが一致しない
      console.log('❌ IDが一致しません:', {
        cardUserId: readCardUserIdStr,
        loginUserId: loginUserIdStr
      });
      return res.json({
        success: false,
        matched: false,
        message: `IDが一致しません（カードのID: ${readCardUserIdStr}, ログインID: ${loginUserIdStr}）`,
        cardId: readCardId,
        cardUserId: readCardUserId,
        loginUserId: userId
      });
    }
    
    // ステップ5: カードのIDとログインIDが一致した → 脱出成功
    console.log('✅ カードのIDとログインIDが一致しました！');
    console.log('カード番号:', readCardId);
    console.log('カードのID（user_id）:', readCardUserId);
    console.log('ログインID:', userId);
    res.json({ 
      success: true,
      matched: true,
      cardId: readCardId,
      userId: userId,
      message: '脱出成功！' 
    });

  } catch (error) {
    console.error('カード読み取りエラー:', error);
    if (error.message && error.message.includes('timeout')) {
      return res.json({ 
        success: false, 
        message: 'カードが検出されませんでした。カードをかざしてください。' 
      });
    }
    res.status(500).json({ 
      success: false, 
      error: error.message || 'カード読み取りに失敗しました' 
    });
  }
});

// ============================================================
// VPS経由での通信（異なるWi-Fi環境対応）
// ============================================================

// PC端末からカード情報を受け取るエンドポイント
// PCがカードリーダーでカードを読み取り、このAPIに送信する
app.post('/api/submit-card', async (req, res) => {
  try {
    const { cardId, cardUserId } = req.body;
    
    if (!cardId) {
      return res.status(400).json({
        success: false,
        error: 'cardIdが必要です'
      });
    }
    
    console.log('📥 PC端末からカード情報を受信:', {
      cardId,
      cardUserId
    });
    
    // カード情報を一時保存
    saveCardInfo(cardId, cardUserId || null);
    
    res.json({
      success: true,
      message: 'カード情報を受け取りました',
      cardId,
      cardUserId
    });
    
  } catch (error) {
    console.error('カード情報受信エラー:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'カード情報の受信に失敗しました'
    });
  }
});

// スマホがカード情報を取得するエンドポイント（VPS経由）
// スマホはこのAPIをポーリングして、PCから送信されたカード情報を取得する
app.post('/api/get-card-info', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userIdが必要です'
      });
    }
    
    // PCから送信された最新のカード情報を取得
    const cardInfo = getCardInfo();
    
    if (!cardInfo) {
      // カード情報がまだない場合
      return res.json({
        success: false,
        message: 'カード情報がまだ受信されていません。カードをPCのカードリーダーにかざしてください。'
      });
    }
    
    console.log('📤 スマホにカード情報を送信:', {
      cardId: cardInfo.cardId,
      cardUserId: cardInfo.cardUserId,
      userId
    });
    
    // カード情報を返す（照合はスマホ側で行う）
    res.json({
      success: true,
      cardId: cardInfo.cardId,
      cardUserId: cardInfo.cardUserId,
      message: cardInfo.cardUserId ? 'カードが読み取られました' : 'カードにユーザーIDが登録されていません'
    });
    
    // カード情報をクリア（1回限りの使用）
    clearCardInfo(cardInfo.cardId);
    
  } catch (error) {
    console.error('カード情報取得エラー:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'カード情報の取得に失敗しました'
    });
  }
});

// ネットワーク経由でアクセス可能にするため、0.0.0.0でリッスン
const HOST = '0.0.0.0';

// サーバー起動
app.listen(port, HOST, () => {
  console.log(`バックエンドサーバーがポート ${port} で起動しました`);
  console.log(`ネットワーク経由でアクセス可能です`);
  
  // ネットワークインターフェースのIPアドレスを表示
  const networkInterfaces = os.networkInterfaces();
  console.log('\n📡 アクセス可能なURL:');
  console.log(`   ローカル: http://localhost:${port}`);
  
  Object.keys(networkInterfaces).forEach((interfaceName) => {
    networkInterfaces[interfaceName].forEach((netInterface) => {
      if (netInterface.family === 'IPv4' && !netInterface.internal) {
        console.log(`   ネットワーク: http://${netInterface.address}:${port}`);
      }
    });
  });
  console.log('');
  
  if (pcsc) {
    console.log('ICカードリーダーの検出を開始します...');
  } else {
    console.log('⚠️  ICカードリーダー機能は無効です。');
    console.log('   インストールするには: npm install pcsclite');
    console.log('   テスト用にカードIDを直接指定することもできます。');
  }
});

// 終了時の処理
process.on('SIGINT', () => {
  console.log('サーバーを終了します...');
  if (pcsc) {
    pcsc.close();
  }
  process.exit(0);
});
