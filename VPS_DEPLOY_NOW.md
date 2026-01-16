# 🚀 VPSデプロイ手順（今すぐ実行）

## ✅ ステップ1: GitHubへのプッシュ（完了）

プッシュが成功しました！

---

## 📝 ステップ2: VPSサーバーにSSH接続

新しいターミナルを開いて、以下を実行：

```bash
ssh ubuntu@160.16.92.115
```

初回接続時は「Are you sure you want to continue connecting (yes/no)?」と聞かれるので、`yes`を入力してください。

---

## 📝 ステップ3: VPSサーバーでデプロイを実行

VPSサーバーに接続後、以下の**ワンライナーコマンド**をコピー＆ペーストして実行：

```bash
cd ~ && if [ -d "Event-AEON" ]; then cd Event-AEON && git pull origin main; else git clone https://github.com/jasminetea-hub/Event-AEON.git && cd Event-AEON; fi && npm install && npm run build && command -v pm2 >/dev/null 2>&1 || npm install -g pm2 && pm2 stop event-aeon-api event-aeon-frontend 2>/dev/null || true && pm2 delete event-aeon-api event-aeon-frontend 2>/dev/null || true && pm2 start server/index.js --name event-aeon-api && pm2 start npm --name event-aeon-frontend -- run preview && pm2 save && pm2 status
```

**または、ステップバイステップで実行：**

```bash
# 1. プロジェクトディレクトリに移動
cd ~

# 2. プロジェクトをクローンまたは更新
if [ -d "Event-AEON" ]; then
    cd Event-AEON
    echo "🔄 プロジェクトを更新中..."
    git pull origin main
else
    echo "📥 プロジェクトをクローン中..."
    git clone https://github.com/jasminetea-hub/Event-AEON.git
    cd Event-AEON
fi

# 3. 依存関係をインストール
echo "📚 依存関係をインストール中..."
npm install

# 4. フロントエンドをビルド
echo "🏗️ フロントエンドをビルド中..."
npm run build

# 5. PM2がインストールされているか確認
if ! command -v pm2 &> /dev/null; then
    echo "📦 PM2をインストール中..."
    npm install -g pm2
fi

# 6. 既存のプロセスを停止・削除
echo "🔄 既存のプロセスを停止中..."
pm2 stop event-aeon-api event-aeon-frontend 2>/dev/null || true
pm2 delete event-aeon-api event-aeon-frontend 2>/dev/null || true

# 7. バックエンドAPIを起動
echo "🚀 バックエンドAPIを起動中..."
pm2 start server/index.js --name "event-aeon-api"

# 8. フロントエンドを起動
echo "🚀 フロントエンドを起動中..."
pm2 start npm --name "event-aeon-frontend" -- run preview

# 9. PM2設定を保存
echo "💾 PM2設定を保存中..."
pm2 save

# 10. プロセス状態を確認
echo ""
echo "✅ デプロイが完了しました！"
echo ""
echo "📊 プロセス状態:"
pm2 status
```

---

## 📝 ステップ4: ファイアウォール設定（初回のみ）

VPSサーバーで以下を実行：

```bash
# ポートを開放
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp
sudo ufw reload

# 設定を確認
sudo ufw status
```

---

## ✅ ステップ5: 動作確認

### スマホで確認

ブラウザで以下にアクセス：
- **アプリ**: `http://160.16.92.115:3000`
- **API**: `http://160.16.92.115:3001`

### VPSサーバーでログ確認

```bash
# バックエンドのログを確認
pm2 logs event-aeon-api

# フロントエンドのログを確認
pm2 logs event-aeon-frontend

# すべてのログを確認
pm2 logs
```

---

## 📝 ステップ6: PC端末側のセットアップ（カードリーダー用）

PC端末（カードリーダーが接続されている端末）で以下を実行：

```bash
# プロジェクトをクローン（まだの場合）
cd ~
git clone https://github.com/jasminetea-hub/Event-AEON.git
cd Event-AEON

# 依存関係をインストール
npm install

# カードリーダークライアントを起動
npm run pc:card-reader http://160.16.92.115:3001
```

---

## 🔍 トラブルシューティング

### VPSサーバーに接続できない場合

```bash
# SSH接続をテスト
ssh -v ubuntu@160.16.92.115

# 接続がタイムアウトする場合は、VPSのファイアウォール設定を確認
```

### npm installが失敗する場合

```bash
# Node.jsのバージョンを確認
node -v
# 推奨: v18以上

# npmキャッシュをクリア
npm cache clean --force
npm install
```

### PM2プロセスが起動しない場合

```bash
# ログを確認
pm2 logs

# 手動で起動してエラーを確認
node server/index.js
npm run preview
```

### ポートが既に使用されている場合

```bash
# 使用中のポートを確認
sudo lsof -i :3000
sudo lsof -i :3001

# プロセスを終了
pm2 stop all
pm2 delete all
```

---

## ✅ デプロイ完了後のチェックリスト

- [ ] VPSサーバーにSSH接続できる
- [ ] プロジェクトがクローン/更新されている
- [ ] `npm install`が成功している
- [ ] `npm run build`が成功している
- [ ] PM2プロセスが起動している（`pm2 status`で確認）
- [ ] スマホでアプリにアクセスできる（`http://160.16.92.115:3000`）
- [ ] ログイン画面が表示される
- [ ] ゲームが正常に動作する

---

## 🎉 デプロイ完了後

デプロイが完了したら、以下のURLでアクセスできます：

- **スマホアプリ**: `http://160.16.92.115:3000`
- **APIエンドポイント**: `http://160.16.92.115:3001`

問題があれば、`pm2 logs`でログを確認してください。
