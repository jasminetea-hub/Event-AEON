# VPSデプロイ手順書

## 前提条件

1. VPSサーバー（160.16.92.115）へのSSHアクセスが可能
2. GitHubリポジトリへのアクセス権限
3. PM2がインストールされている（`npm install -g pm2`）

---

## 方法1: 自動デプロイスクリプトを使用

```bash
./deploy-to-vps.sh
```

---

## 方法2: 手動でデプロイ

### ステップ1: VPSサーバーにSSH接続

```bash
ssh ubuntu@160.16.92.115
```

### ステップ2: プロジェクトをクローンまたは更新

```bash
cd ~

# 既にクローン済みの場合
if [ -d "Event-AEON" ]; then
    cd Event-AEON
    git pull origin main
else
    # 初回の場合
    git clone git@github.com:jasminetea-hub/Event-AEON.git
    cd Event-AEON
fi
```

### ステップ3: 依存関係をインストール

```bash
npm install
```

### ステップ4: フロントエンドをビルド

```bash
npm run build
```

### ステップ5: PM2でアプリケーションを起動

```bash
# 既存のプロセスを停止・削除（初回は不要）
pm2 stop event-aeon-api event-aeon-frontend 2>/dev/null || true
pm2 delete event-aeon-api event-aeon-frontend 2>/dev/null || true

# バックエンドAPIを起動
pm2 start server/index.js --name "event-aeon-api"

# フロントエンドを起動
pm2 start npm --name "event-aeon-frontend" -- run preview

# PM2設定を保存
pm2 save

# 自動起動を設定（初回のみ）
pm2 startup
```

### ステップ6: 確認

```bash
# プロセス状態を確認
pm2 status

# ログを確認
pm2 logs event-aeon-api
pm2 logs event-aeon-frontend
```

---

## アクセス

- **スマホアプリ**: `http://160.16.92.115:3000`
- **APIエンドポイント**: `http://160.16.92.115:3001`

---

## トラブルシューティング

### ポートが開いていない場合

```bash
# ファイアウォールでポートを開放
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp
sudo ufw reload
```

### PM2プロセスが起動しない場合

```bash
# ログを確認
pm2 logs

# プロセスを再起動
pm2 restart all
```

### Git pullが失敗する場合

```bash
# SSH鍵が設定されているか確認
ssh -T git@github.com

# 設定されていない場合は、HTTPSでクローン
git clone https://github.com/jasminetea-hub/Event-AEON.git
```

---

## 更新手順

コードを更新した場合は、以下の手順で更新できます：

```bash
# VPSサーバーにSSH接続
ssh ubuntu@160.16.92.115

# プロジェクトディレクトリに移動
cd ~/Event-AEON

# 最新のコードを取得
git pull origin main

# 依存関係を再インストール（必要に応じて）
npm install

# フロントエンドを再ビルド
npm run build

# PM2プロセスを再起動
pm2 restart all
```
