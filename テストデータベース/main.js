const readline = require('readline');
const MifareCardReader = require('./card_reader');
const CardDatabase = require('./database');
const path = require('path');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const dbPath = path.join(__dirname, 'cards.db');
const db = new CardDatabase(dbPath);
const reader = new MifareCardReader();

// データベースの初期化を待つ
let dbInitialized = false;
db.initDatabase().then(() => {
    dbInitialized = true;
    console.log('✅ データベースの初期化が完了しました');
}).catch((err) => {
    console.error('❌ データベースの初期化に失敗しました:', err);
});

function showMenu() {
    console.log('\n=== Mifareカード読み取りシステム ===');
    console.log('1. カードを1回読み取る');
    console.log('2. 連続してカードを読み取る（Ctrl+Cで終了）');
    console.log('3. データベース内のカード一覧を表示');
    console.log('4. 終了');
    console.log('-----------------------------------');
    rl.question('選択してください (1-4): ', (answer) => {
        handleMenuChoice(answer.trim());
    });
}

function handleMenuChoice(choice) {
    switch (choice) {
        case '1':
            readCardOnce();
            break;
        case '2':
            readCardContinuous();
            break;
        case '3':
            showAllCards();
            break;
        case '4':
            exit();
            break;
        default:
            console.log('無効な選択です。1-4の数字を入力してください。');
            showMenu();
    }
}

function readCardOnce() {
    if (!dbInitialized) {
        console.log('\n⚠️  データベースの初期化を待っています...');
        setTimeout(() => {
            if (dbInitialized) {
                readCardOnce();
            } else {
                console.log('❌ データベースの初期化に失敗しました。もう一度お試しください。');
                showMenu();
            }
        }, 1000);
        return;
    }
    
    console.log('\n📱 カードをリーダーに近づけてください...');
    console.log('（カードが検出されるまで待機します）\n');
    
    reader.readCardOnce(async (cardId, cardType) => {
        console.log(`\n✅ カードを読み取りました:`);
        console.log(`   カードID: ${cardId}`);
        console.log(`   カードタイプ: ${cardType || '不明'}`);
        
        // user_idを入力（オプション）
        rl.question('\nユーザーIDを入力してください（Enterでスキップ）: ', async (userId) => {
            const finalUserId = userId.trim() || null;
            const saved = await db.saveCard(cardId, cardType, finalUserId);
            if (saved) {
                console.log('✅ データベースに保存しました');
                if (finalUserId) {
                    console.log(`   ユーザーID: ${finalUserId} を設定しました`);
                }
            } else {
                console.log('⚠️  カードは既にデータベースに存在します');
                if (finalUserId) {
                    // 既存のカードのuser_idを更新
                    try {
                        await db.updateCardUserId(cardId, finalUserId);
                        console.log(`✅ ユーザーID: ${finalUserId} を更新しました`);
                    } catch (error) {
                        console.error('❌ ユーザーIDの更新に失敗しました:', error);
                    }
                }
            }
            
            setTimeout(() => {
                showMenu();
            }, 1000);
        });
    });
}

function readCardContinuous() {
    console.log('\n連続カード読み取りを開始します...');
    console.log('（Ctrl+Cで終了）\n');
    
    reader.readCardContinuous(async (cardId, cardType) => {
        console.log(`\n✅ カードを読み取りました:`);
        console.log(`   カードID: ${cardId}`);
        console.log(`   カードタイプ: ${cardType}`);
        
        // 連続読み取りの場合はuser_idなしで保存（後で更新可能）
        const saved = await db.saveCard(cardId, cardType, null);
        if (saved) {
            console.log('✅ データベースに保存しました');
        }
        console.log('---');
    });
}

async function showAllCards() {
    try {
        const cards = await db.getAllCards();
        const count = await db.getCardCount();
        
        console.log(`\n📋 登録済みカード一覧 (合計: ${count}件)`);
        console.log('-----------------------------------');
        
        if (cards.length === 0) {
            console.log('登録されているカードはありません。');
        } else {
            cards.forEach((card, index) => {
                console.log(`${index + 1}. ID: ${card.id}`);
                console.log(`   カードID: ${card.card_id}`);
                console.log(`   タイプ: ${card.card_type || '不明'}`);
                console.log(`   ユーザーID: ${card.user_id || '未設定'}`);
                console.log(`   読み取り日時: ${card.read_at}`);
                console.log('---');
            });
        }
        
        showMenu();
    } catch (error) {
        console.error('カード一覧取得エラー:', error);
        showMenu();
    }
}

function exit() {
    console.log('\n終了します...');
    reader.close();
    db.close().then(() => {
        rl.close();
        process.exit(0);
    });
}

// 終了時の処理
process.on('SIGINT', () => {
    console.log('\n\n終了します...');
    reader.close();
    db.close().then(() => {
        rl.close();
        process.exit(0);
    });
});

// 起動
console.log('========================================');
console.log('  Mifareカード読み取りシステム');
console.log('========================================');
console.log('リーダーを検出中...');
console.log('データベースを初期化中...\n');

// リーダーとデータベースの初期化を待つ
setTimeout(() => {
    const readers = reader.getReaders();
    if (readers.length > 0) {
        console.log(`✅ リーダーを検出しました: ${readers.join(', ')}`);
    } else {
        console.log('⚠️  リーダーが検出されていません');
        console.log('   ICカードリーダーが接続されているか確認してください');
    }
    
    if (dbInitialized) {
        console.log('✅ データベースの準備が完了しました\n');
    } else {
        console.log('⚠️  データベースの初期化を待っています...\n');
    }
    
    showMenu();
}, 2000);
