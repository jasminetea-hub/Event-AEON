# 🚀 次のステップ - デプロイ手順

## 📋 現在の状況

✅ ローカルでコード変更は完了  
⚠️ GitHubへのプッシュがまだ（1コミット待ち）  
⚠️ デプロイ関連ファイルがまだ追加されていない

---

## 📝 ステップ1: デプロイ関連ファイルを追加してコミット・プッシュ

### ローカルで実行：

```bash
# デプロイ関連ファイルを追加
git add DEPLOY_INSTRUCTIONS.md QUICK_DEPLOY.md deploy-to-vps.sh

# コミット
git commit -m "デプロイ手順書を追加"

# GitHubにプッシュ
git push origin main
```

**注意**: GitHubの認証が必要な場合があります。Personal Access Tokenを使用してください。

---

## 📝 ステップ2: VPSサーバーにSSH接続

ターミナルで以下を実行：

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
# プロジェクトディレクトリに移動
cd ~

# プロジェクトをクローンまたは更新
if [ -d "Event-AEON" ]; then
    cd Event-AEON
    git pull origin main
else
    git clone https://github.com/jasminetea-hub/Event-AEON.git
    cd Event-AEON
fi

# 依存関係をインストール
npm install

# フロントエンドをビルド
npm run build

# PM2をインストール（未インストールの場合）
npm install -g pm2

# 既存のプロセスを停止・削除
pm2 stop event-aeon-api event-aeon-frontend 2>/dev/null || true
pm2 delete event-aeon-api event-aeon-frontend 2>/dev/null || true

# バックエンドAPIを起動
pm2 start server/index.js --name "event-aeon-api"

# フロントエンドを起動
pm2 start npm --name "event-aeon-frontend" -- run preview

# PM2設定を保存
pm2 save

# プロセス状態を確認
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

## 📝 ステップ5: 動作確認

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

## ✅ デプロイ完了後のチェックリスト

- [ ] スマホでアプリにアクセスできる（`http://160.16.92.115:3000`）
- [ ] ログイン画面が表示される
- [ ] ゲームが正常に動作する
- [ ] PC端末でカードリーダーが動作する
- [ ] カードを読み取るとVPSサーバーに送信される
- [ ] スマホで「脱出成功」が表示される

---

## 🆘 トラブルシューティング

### Git pushが失敗する場合

```bash
# GitHubのPersonal Access Tokenが必要な場合があります
# リモートURLを確認
git remote -v

# HTTPSで設定されていることを確認
git remote set-url origin https://github.com/jasminetea-hub/Event-AEON.git
```

### VPSサーバーに接続できない場合

```bash
# SSH接続を確認
ssh -v ubuntu@160.16.92.115

# 接続がタイムアウトする場合は、VPSのファイアウォール設定を確認
```

### PM2プロセスが起動しない場合

```bash
# ログを確認
pm2 logs

# 手動で起動してエラーを確認
node server/index.js
npm run preview
```

### ポートが使用中の場合

```bash
# 使用中のポートを確認
sudo lsof -i :3000
sudo lsof -i :3001

# プロセスを終了
pm2 stop all
pm2 delete all
```

---

## 📚 参考ドキュメント

- `QUICK_DEPLOY.md` - クイックデプロイガイド
- `DEPLOY_INSTRUCTIONS.md` - 詳細なデプロイ手順
- `DEPLOYMENT_STRUCTURE.md` - デプロイ構成の説明
