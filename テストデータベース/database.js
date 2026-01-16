const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class CardDatabase {
    constructor(dbPath = 'cards.db') {
        this.dbPath = dbPath;
        this.db = null;
        this.initDatabase();
    }

    initDatabase() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error(`データベース接続エラー: ${err.message}`);
                    reject(err);
                    return;
                }

                // テーブルを作成
                this.db.serialize(() => {
                    this.db.run(`
                        CREATE TABLE IF NOT EXISTS cards (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            card_id TEXT NOT NULL UNIQUE,
                            card_type TEXT,
                            user_id TEXT,
                            read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                    `);
                    
                    // user_idカラムが存在しない場合は追加（既存のデータベース用）
                    this.db.run(`
                        ALTER TABLE cards ADD COLUMN user_id TEXT
                    `, (err) => {
                        // カラムが既に存在する場合はエラーになるが、無視する
                    });

                    // インデックスを作成
                    this.db.run(`
                        CREATE INDEX IF NOT EXISTS idx_card_id ON cards(card_id)
                    `, (err) => {
                        if (err) {
                            console.error(`インデックス作成エラー: ${err.message}`);
                        } else {
                            console.log(`データベース '${this.dbPath}' を初期化しました`);
                            resolve();
                        }
                    });
                });
            });
        });
    }

    saveCard(cardId, cardType = null, userId = null) {
        return new Promise((resolve) => {
            this.db.run(
                `INSERT INTO cards (card_id, card_type, user_id, read_at)
                 VALUES (?, ?, ?, datetime('now'))`,
                [cardId, cardType, userId],
                function(err) {
                    if (err) {
                        if (err.message.includes('UNIQUE constraint')) {
                            console.log(`カード番号 '${cardId}' は既にデータベースに存在します`);
                            // 既存のカードのuser_idを更新
                            if (userId) {
                                this.db.run(
                                    `UPDATE cards SET user_id = ? WHERE card_id = ?`,
                                    [userId, cardId],
                                    (updateErr) => {
                                        if (updateErr) {
                                            console.error(`user_id更新エラー: ${updateErr.message}`);
                                        } else {
                                            console.log(`カード '${cardId}' のuser_idを更新しました: ${userId}`);
                                        }
                                    }
                                );
                            }
                        } else {
                            console.error(`データベース保存エラー: ${err.message}`);
                        }
                        resolve(false);
                    } else {
                        console.log(`カード番号 '${cardId}' をデータベースに保存しました${userId ? ` (user_id: ${userId})` : ''}`);
                        resolve(true);
                    }
                }.bind(this)
            );
        });
    }

    getAllCards() {
        return new Promise((resolve, reject) => {
            this.db.all(
                `SELECT id, card_id, card_type, user_id, read_at, created_at
                 FROM cards
                 ORDER BY read_at DESC`,
                (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                }
            );
        });
    }

    searchCard(cardId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                `SELECT id, card_id, card_type, user_id, read_at, created_at
                 FROM cards
                 WHERE card_id = ?`,
                [cardId],
                (err, row) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(row);
                    }
                }
            );
        });
    }
    
    updateCardUserId(cardId, userId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `UPDATE cards SET user_id = ? WHERE card_id = ?`,
                [userId, cardId],
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(this.changes > 0);
                    }
                }
            );
        });
    }

    getCardCount() {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT COUNT(*) as count FROM cards', (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row.count);
                }
            });
        });
    }

    close() {
        return new Promise((resolve) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        console.error(`データベースクローズエラー: ${err.message}`);
                    }
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }
}

module.exports = CardDatabase;
