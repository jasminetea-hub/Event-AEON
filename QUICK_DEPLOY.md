# クイックデプロイガイド

## すぐにデプロイする方法

### ステップ1: ローカルで変更をプッシュ（SSHが使える場合）

```bash
# SSH鍵の問題がある場合は、HTTPSでプッシュ
git remote set-url origin https://github.com/jasminetea-hub/Event-AEON.git
git push origin main
```

または、GitHub Desktopや他のツールを使用してプッシュしてください。

---

### ステップ2: VPSサーバーにSSH接続

```bash
ssh ubuntu@160.16.92.115
```

---

### ステップ3: VPSサーバーで以下のコマンドを実行

```bash
# プロジェクトディレクトリに移動
cd ~

# 既にプロジェクトが存在する場合（更新）
if [ -d "Event-AEON" ]; then
    cd Event-AEON
    echo "🔄 プロジェクトを更新中..."
    git pull origin main
else
    # 初回デプロイ（クローン）
    echo "📥 プロジェクトをクローン中..."
    git clone https://github.com/jasminetea-hub/Event-AEON.git
    cd Event-AEON
fi

# 依存関係をインストール
echo "📚 依存関係をインストール中..."
npm install

# フロントエンドをビルド
echo "🏗️ フロントエンドをビルド中..."
npm run build

# PM2がインストールされているか確認
if ! command -v pm2 &> /dev/null; then
    echo "📦 PM2をインストール中..."
    npm install -g pm2
fi

# 既存のプロセスを停止・削除
echo "🔄 既存のプロセスを停止中..."
pm2 stop event-aeon-api event-aeon-frontend 2>/dev/null || true
pm2 delete event-aeon-api event-aeon-frontend 2>/dev/null || true

# バックエンドAPIを起動
echo "🚀 バックエンドAPIを起動中..."
pm2 start server/index.js --name "event-aeon-api"

# フロントエンドを起動
echo "🚀 フロントエンドを起動中..."
pm2 start npm --name "event-aeon-frontend" -- run preview

# PM2設定を保存
echo "💾 PM2設定を保存中..."
pm2 save

# プロセス状態を確認
echo ""
echo "✅ デプロイが完了しました！"
echo ""
echo "📊 プロセス状態:"
pm2 status
echo ""
echo "📝 ログを確認するには:"
echo "  pm2 logs event-aeon-api"
echo "  pm2 logs event-aeon-frontend"
```

---

### ステップ4: ファイアウォール設定（初回のみ）

```bash
# ポートを開放
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp
sudo ufw reload

# 設定を確認
sudo ufw status
```

---

### ステップ5: アクセス確認

ブラウザで以下にアクセス：
- **スマホアプリ**: `http://160.16.92.115:3000`
- **APIエンドポイント**: `http://160.16.92.115:3001`

---

## ワンライナーコマンド（コピペ用）

VPSサーバーにSSH接続後、以下のコマンドを一度に実行：

```bash
cd ~ && if [ -d "Event-AEON" ]; then cd Event-AEON && git pull origin main; else git clone https://github.com/jasminetea-hub/Event-AEON.git && cd Event-AEON; fi && npm install && npm run build && command -v pm2 >/dev/null 2>&1 || npm install -g pm2 && pm2 stop event-aeon-api event-aeon-frontend 2>/dev/null || true && pm2 delete event-aeon-api event-aeon-frontend 2>/dev/null || true && pm2 start server/index.js --name event-aeon-api && pm2 start npm --name event-aeon-frontend -- run preview && pm2 save && pm2 status
```

---

## トラブルシューティング

### Git cloneが失敗する場合

```bash
# HTTPSでクローン（SSH鍵の問題を回避）
git clone https://github.com/jasminetea-hub/Event-AEON.git
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

## 更新手順（次回以降）

コードを更新した場合：

```bash
ssh ubuntu@160.16.92.115
cd ~/Event-AEON
git pull origin main
npm install
npm run build
pm2 restart all
```
