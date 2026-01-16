const pcsc = require('pcsclite');

class MifareCardReader {
    constructor() {
        this.pcsc = null;
        this.readers = [];
        this.currentReader = null;
        this.connect();
    }

    connect() {
        try {
            this.pcsc = pcsc();
            
            this.pcsc.on('reader', (reader) => {
                console.log(`リーダーを検出しました: ${reader.name}`);
                this.readers.push(reader);

                reader.on('error', (err) => {
                    console.error(`リーダーエラー (${reader.name}):`, err);
                });

                reader.on('status', (status) => {
                    const changes = this.readerStateChanges(reader, status);
                    if (changes) {
                        if (changes.inserted) {
                            // statusオブジェクトからATRを取得
                            const atr = status.atr || null;
                            this.handleCardInserted(reader, atr);
                        }
                    }
                });

                reader.on('end', () => {
                    console.log(`リーダーが切断されました: ${reader.name}`);
                    const index = this.readers.indexOf(reader);
                    if (index > -1) {
                        this.readers.splice(index, 1);
                    }
                });
            });

            this.pcsc.on('error', (err) => {
                console.error('PC/SCエラー:', err);
            });

            console.log('PC/SCサービスに接続しました');
            console.log('リーダーを検出中...');
        } catch (error) {
            console.error('リーダー接続エラー:', error);
            this.pcsc = null;
        }
    }

    readerStateChanges(reader, status) {
        const changes = {
            inserted: false,
            removed: false
        };

        if (status.state & reader.SCARD_STATE_PRESENT) {
            if (!reader.previousState || !(reader.previousState & reader.SCARD_STATE_PRESENT)) {
                changes.inserted = true;
            }
        } else {
            if (reader.previousState && (reader.previousState & reader.SCARD_STATE_PRESENT)) {
                changes.removed = true;
            }
        }

        reader.previousState = status.state;
        return changes;
    }

    handleCardInserted(reader, atr) {
        try {
            console.log(`カードが検出されました (${reader.name})`);
            
            reader.connect({ share_mode: reader.SCARD_SHARE_SHARED }, (err, protocol) => {
                if (err) {
                    console.error('カード接続エラー:', err);
                    return;
                }

                // ATRが既に取得できている場合は使用、そうでなければ直接UID取得を試す
                if (atr && atr.length > 0) {
                    console.log(`ATR: ${atr.toString('hex').toUpperCase()}`);
                    this.getCardUID(reader, protocol, atr);
                } else {
                    console.log('ATRが取得できませんでした。直接UID取得を試します...');
                    this.getCardUID(reader, protocol, null);
                }
            });
        } catch (error) {
            console.error('カード処理エラー:', error);
        }
    }

    getCardUID(reader, protocol, atr) {
        // ATRを表示
        if (atr && atr.length > 0) {
            const atrHex = atr.toString('hex').toUpperCase();
            console.log(`ATR (Answer To Reset): ${atrHex}`);
            console.log(`ATR長さ: ${atr.length}バイト`);
        }
        
        // Mifare Classicの場合、UIDを取得するコマンド（PC/SC経由）
        // コマンド: Get Data (0xFF 0xCA 0x00 0x00 0x00)
        const getUIDCommand = Buffer.from([0xFF, 0xCA, 0x00, 0x00, 0x00]);
        
        reader.transmit(getUIDCommand, 40, protocol, (err, data) => {
            if (err) {
                console.error('UID取得コマンドエラー:', err);
                console.log('カードタイプがMifare Classicではない可能性があります。');
                this.tryAlternativeMethod(reader, protocol, atr);
                return;
            }

            // デバッグ: レスポンスデータを表示
            if (data) {
                console.log(`UID取得レスポンス (Raw): ${data.toString('hex').toUpperCase()}`);
                console.log(`UID取得レスポンス (長さ): ${data.length}バイト`);
            }

            if (data && data.length >= 4) {
                // レスポンス形式: [UID 4-7バイト] + [ステータスコード 2バイト (0x90, 0x00)]
                // 例: CB9D24AE9000 + 9000 → [CB, 9D, 24, AE, 90, 00, 90, 00]
                
                let cardId;
                
                // 最後の2バイトがステータスコード（0x90, 0x00）か確認
                if (data.length >= 2 && data[data.length - 2] === 0x90 && data[data.length - 1] === 0x00) {
                    // ステータスコードを除いた部分がUID
                    const uidData = data.slice(0, data.length - 2);
                    cardId = uidData.toString('hex').toUpperCase();
                } else {
                    // ステータスコードがない場合、全体をUIDとして扱う
                    // ただし、通常は4-7バイト
                    const uidLength = Math.min(data.length, 7);
                    cardId = data.slice(0, uidLength).toString('hex').toUpperCase();
                }
                
                const cardType = this.detectCardType(atr);
                console.log(`UID (カードID): ${cardId}`);
                console.log(`カードタイプ: ${cardType}`);
                
                // コールバックを呼び出す
                if (this.onCardRead) {
                    this.onCardRead(cardId, cardType);
                }
                
                // カードを切断
                reader.disconnect(reader.SCARD_LEAVE_CARD, (err) => {
                    if (err) {
                        console.error('切断エラー:', err);
                    }
                });
            } else {
                // データが空または短すぎる場合、ATRから情報を取得
                console.log('UID取得コマンドの応答が不正です。ATRから情報を取得します...');
                this.tryAlternativeMethod(reader, protocol, atr);
                return;
            }
        });
    }

    tryAlternativeMethod(reader, protocol, atr) {
        // ATRはカードタイプによって同じになることがあるため、UIDとしては使用しない
        // UID取得コマンドが失敗した場合は、エラーを表示してカードIDを保存しない
        console.error('❌ エラー: UID取得コマンドが失敗しました。カードIDを取得できませんでした。');
        console.log('💡 カードを再度リーダーに近づけてください。');
        
        if (atr && atr.length > 0) {
            const atrHex = atr.toString('hex').toUpperCase();
            const cardType = this.detectCardType(atr);
            console.log(`📋 ATR: ${atrHex} (これはカードIDではありません)`);
            console.log(`📋 カードタイプ: ${cardType}`);
            console.log(`⚠️  注意: ATRはカードタイプによって同じになる可能性があるため、カードIDとしては使用しません`);
        } else {
            console.error('❌ カードの情報を取得できませんでした');
        }
        
        // カードIDを保存しない（コールバックを呼ばない）
        
        // カードを切断
        reader.disconnect(reader.SCARD_LEAVE_CARD, (err) => {
            if (err) {
                console.error('切断エラー:', err);
            }
        });
    }

    detectCardType(atr) {
        if (!atr || atr.length === 0) {
            return 'Unknown';
        }

        const atrHex = atr.toString('hex').toUpperCase();
        
        // Mifare Classic（完全一致または部分一致）
        // ATR例: 3B8F8001804F0CA000000306030001000000006A
        if (atrHex.includes('3B8F8001804F0CA000000306030001000000006A') || 
            atrHex.startsWith('3B8F8001804F0CA000000306030001')) {
            return 'Mifare Classic';
        }
        
        // Mifare Ultralight
        if (atrHex.includes('3B8400') || atrHex.startsWith('3B88')) {
            return 'Mifare Ultralight';
        }
        
        // FeliCa
        if (atrHex.includes('12FC') || atrHex.includes('01FE')) {
            return 'FeliCa';
        }
        
        // ISO 14443 Type A（一般的な形式）
        if (atrHex.startsWith('3B') || atrHex.startsWith('3F')) {
            return 'ISO 14443 Type A';
        }

        return 'Unknown';
    }

    readCardOnce(callback) {
        this.onCardRead = (cardId, cardType) => {
            callback(cardId, cardType);
            this.onCardRead = null;
        };

        console.log('カードをリーダーに近づけてください...');
        console.log('（カードが検出されるまで待機します）');
    }

    readCardContinuous(callback, interval = 1000) {
        this.onCardRead = (cardId, cardType) => {
            callback(cardId, cardType);
            // 連続読み取りの場合は、コールバックを保持
        };

        console.log('連続カード読み取りを開始します（Ctrl+Cで終了）...');
    }

    close() {
        if (this.pcsc) {
            this.readers.forEach(reader => {
                try {
                    reader.close();
                } catch (err) {
                    // 無視
                }
            });
            this.pcsc.close();
            console.log('リーダーを閉じました');
        }
    }

    getReaders() {
        return this.readers.map(r => r.name);
    }
}

module.exports = MifareCardReader;
