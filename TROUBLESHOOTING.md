# 🔧 トラブルシューティング：サーバー接続エラー

## 問題：「サーバーに接続できない」と表示される

### 確認項目

---

## ✅ チェック1: VPSサーバーでバックエンドAPIが起動しているか確認

VPSサーバーにSSH接続して確認：

```bash
ssh ubuntu@160.16.92.115

# PM2プロセスの状態を確認
pm2 status

# 期待される出力例：
# ┌─────┬─────────────────────────┬─────────┬─────────┬──────────┐
# │ id  │ name                    │ status  │ restart │ uptime   │
# ├─────┼─────────────────────────┼─────────┼─────────┼──────────┤
# │ 0   │ event-aeon-api          │ online  │ 0       │ 5m       │
# │ 1   │ event-aeon-frontend     │ online  │ 0       │ 5m       │
# └─────┴─────────────────────────┴─────────┴─────────┴──────────┘
```

**もし起動していない場合**：

```bash
cd ~/Event-AEON

# バックエンドAPIを起動
pm2 start server/index.js --name "event-aeon-api"

# フロントエンドを起動
pm2 start npm --name "event-aeon-frontend" -- run preview

# 設定を保存
pm2 save
```

---

## ✅ チェック2: サーバーのログを確認

```bash
# バックエンドAPIのログを確認
pm2 logs event-aeon-api --lines 50

# フロントエンドのログを確認
pm2 logs event-aeon-frontend --lines 50
```

**エラーが出ている場合**、エラーメッセージを確認してください。

---

## ✅ チェック3: ポートが開放されているか確認

```bash
# ファイアウォールの状態を確認
sudo ufw status

# ポートが開いていない場合、以下を実行
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp
sudo ufw reload
```

---

## ✅ チェック4: APIサーバーが実際に動作しているか確認

VPSサーバー上で：

```bash
# ローカルからAPIにアクセスできるか確認
curl http://localhost:3001/api/health

# または、ヘルスチェックエンドポイントがない場合は
curl http://localhost:3001/
```

**ローカルのPC/スマホから**：

```bash
# スマホやPCのブラウザで直接APIにアクセスしてみる
# http://160.16.92.115:3001
```

---

## ✅ チェック5: API URLの設定を確認

スマホのブラウザで以下を実行（開発者ツールのコンソール）：

```javascript
// 現在のAPI URLを確認
console.log('API URL:', localStorage.getItem('apiBaseUrl') || 'http://160.16.92.115:3001');

// API URLを手動で設定（必要に応じて）
localStorage.setItem('apiBaseUrl', 'http://160.16.92.115:3001');
location.reload();
```

---

## ✅ チェック6: ネットワーク接続を確認

スマホやPCからVPSサーバーに接続できるか確認：

```bash
# pingで接続確認
ping 160.16.92.115

# ポート3001が開いているか確認（telnetまたはncを使用）
telnet 160.16.92.115 3001
# または
nc -zv 160.16.92.115 3001
```

---

## 🔧 よくある問題と解決方法

### 問題1: PM2プロセスが起動していない

**解決方法**：

```bash
cd ~/Event-AEON
pm2 start server/index.js --name "event-aeon-api"
pm2 start npm --name "event-aeon-frontend" -- run preview
pm2 save
```

### 問題2: ポート3001が使用できない

**解決方法**：

```bash
# 使用中のポートを確認
sudo lsof -i :3001

# プロセスを終了（必要な場合）
pm2 stop event-aeon-api
pm2 delete event-aeon-api

# 再起動
pm2 start server/index.js --name "event-aeon-api"
```

### 問題3: ファイアウォールでブロックされている

**解決方法**：

```bash
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp
sudo ufw reload
sudo ufw status
```

### 問題4: API URLが正しく設定されていない

**解決方法**：

スマホのブラウザで開発者ツールを開き、コンソールで以下を実行：

```javascript
// API URLを設定
localStorage.setItem('apiBaseUrl', 'http://160.16.92.115:3001');
location.reload();
```

### 問題5: CORSエラーが発生している

**確認方法**：

ブラウザの開発者ツール（F12）→ コンソールタブでエラーを確認

**解決方法**：

`server/index.js`でCORSが正しく設定されているか確認：

```javascript
app.use(cors());
```

---

## 🆘 まだ解決しない場合

1. **VPSサーバーのログを確認**：
   ```bash
   pm2 logs --lines 100
   ```

2. **手動でサーバーを起動してエラーを確認**：
   ```bash
   cd ~/Event-AEON
   node server/index.js
   ```

3. **ブラウザの開発者ツールでエラーを確認**：
   - F12キーを押して開発者ツールを開く
   - Consoleタブでエラーメッセージを確認
   - NetworkタブでAPIリクエストが失敗しているか確認

---

## 📝 デバッグ用コマンド一覧

```bash
# VPSサーバーにSSH接続
ssh ubuntu@160.16.92.115

# PM2プロセス状態
pm2 status

# PM2ログ確認
pm2 logs event-aeon-api --lines 50
pm2 logs event-aeon-frontend --lines 50

# ファイアウォール状態
sudo ufw status

# ポート使用状況
sudo lsof -i :3000
sudo lsof -i :3001

# サーバー再起動
pm2 restart all

# API接続テスト
curl http://localhost:3001/
```
