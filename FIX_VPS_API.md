# 🔧 VPSサーバーAPIエラー修正手順

## 問題

`event-aeon-api` が `errored` 状態で起動していません。

---

## 修正手順

VPSサーバーで以下を実行してください：

### ステップ1: エラーログを確認

```bash
pm2 logs event-aeon-api --lines 50
```

エラーメッセージを確認してください。

---

### ステップ2: 古いプロセスをクリーンアップ

```bash
# すべてのプロセスを停止
pm2 stop all

# エラー状態のプロセスを削除
pm2 delete event-aeon-api

# 重複しているフロントエンドプロセスも整理
pm2 delete event-aeon-frontend
pm2 delete event-aeon-server
```

---

### ステップ3: プロジェクトディレクトリに移動して最新のコードを取得

```bash
cd ~/Event-AEON

# 最新のコードを取得
git pull origin main

# 依存関係を再インストール（必要に応じて）
npm install
```

---

### ステップ4: サーバーを手動で起動してエラーを確認

```bash
# 手動で起動してエラーを確認
node server/index.js
```

エラーメッセージを確認してください。よくあるエラー：
- モジュールが見つからない
- ポートが既に使用されている
- 設定ファイルの問題

---

### ステップ5: PM2で正しく起動

```bash
# バックエンドAPIを起動
pm2 start server/index.js --name "event-aeon-api"

# フロントエンドを起動（既に起動している場合は不要）
pm2 start npm --name "event-aeon-frontend" -- run preview

# 設定を保存
pm2 save

# 状態を確認
pm2 status
```

---

## よくあるエラーと解決方法

### エラー1: モジュールが見つからない

```bash
# 依存関係を再インストール
cd ~/Event-AEON
npm install
```

### エラー2: ポート3001が既に使用されている

```bash
# ポート3001を使用しているプロセスを確認
sudo lsof -i :3001

# プロセスを終了（必要に応じて）
# PIDを確認してから
kill -9 <PID>
```

### エラー3: ES Moduleの問題

`server/index.js`がES Moduleを使用している場合、`package.json`に以下があることを確認：

```json
{
  "type": "module"
}
```

---

## クリーンな再起動（すべてをリセット）

```bash
# すべてのプロセスを停止・削除
pm2 stop all
pm2 delete all

# プロジェクトディレクトリに移動
cd ~/Event-AEON

# 最新のコードを取得
git pull origin main

# 依存関係をインストール
npm install

# フロントエンドをビルド
npm run build

# 新しいプロセスを起動
pm2 start server/index.js --name "event-aeon-api"
pm2 start npm --name "event-aeon-frontend" -- run preview

# 設定を保存
pm2 save

# 状態を確認
pm2 status
```
