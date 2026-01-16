# VPSでのクイックセットアップ手順（160.16.92.115）

## 現在の状態
✅ PC/SCサービスが起動済み
✅ Node.jsとGitのインストールが必要
✅ プロジェクトのクローンが必要
✅ PM2でのプロセス管理が必要

## セットアップ手順

### 1. Node.jsのインストール（nvmを使用）

```bash
# nvmをインストール
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 環境変数を読み込み
source ~/.bashrc

# Node.js 20をインストール
nvm install 20
nvm use 20
nvm alias default 20

# バージョン確認
node --version
npm --version
```

### 2. Gitの設定（SSH鍵が未設定の場合）

```bash
# GitHubのSSH鍵が設定されているか確認
ls -la ~/.ssh/

# 鍵がない場合、ローカルマシンから公開鍵をコピー
# または、VPSで新しく生成
ssh-keygen -t ed25519 -C "your_email@example.com"
cat ~/.ssh/id_ed25519.pub
# この公開鍵をGitHubに追加
```

### 3. プロジェクトのクローン

```bash
# ホームディレクトリに移動
cd ~

# リポジトリをクローン
git clone git@github.com:jasminetea-hub/Event-AEON.git
cd Event-AEON

# 依存関係をインストール
npm install
```

### 4. PM2のインストールとプロセス起動

```bash
# PM2をグローバルにインストール
npm install -g pm2

# バックエンドサーバーを起動
pm2 start server/index.js --name "event-aeon-server" --interpreter node

# フロントエンドをビルド
npm run build

# フロントエンドを起動
pm2 start npm --name "event-aeon-frontend" -- run preview

# PM2の設定を保存
pm2 save

# システム起動時に自動起動
pm2 startup
# 表示されたコマンドを実行（sudoが必要な場合があります）
```

### 5. ファイアウォールの設定

```bash
# ポートを開放
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp
sudo ufw allow 22/tcp  # SSH接続を維持

# ファイアウォールを確認
sudo ufw status
```

### 6. Nginxの設定（推奨）

```bash
# Nginxのインストール
sudo apt-get install -y nginx

# 設定ファイルを作成
sudo nano /etc/nginx/sites-available/event-aeon
```

以下の内容を貼り付け：

```nginx
server {
    listen 80;
    server_name 160.16.92.115;

    # フロントエンド
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # バックエンドAPI
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
# シンボリックリンクを作成
sudo ln -s /etc/nginx/sites-available/event-aeon /etc/nginx/sites-enabled/

# デフォルトの設定を無効化（必要に応じて）
sudo rm /etc/nginx/sites-enabled/default

# Nginxの設定をテスト
sudo nginx -t

# Nginxを起動
sudo systemctl enable nginx
sudo systemctl start nginx
sudo systemctl reload nginx
```

### 7. 動作確認

```bash
# PM2の状態確認
pm2 list

# ログの確認
pm2 logs

# ブラウザでアクセス
# http://160.16.92.115
```

## トラブルシューティング

### PM2のプロセスが起動しない場合

```bash
# エラーログを確認
pm2 logs event-aeon-server
pm2 logs event-aeon-frontend

# ポートが使用中か確認
sudo netstat -tlnp | grep :3000
sudo netstat -tlnp | grep :3001
```

### カードリーダーが認識されない場合

```bash
# PC/SCサービスの状態確認（既に起動しています）
sudo systemctl status pcscd

# カードリーダーをスキャン
pcsc_scan
```

### Nginxが起動しない場合

```bash
# エラーログを確認
sudo tail -f /var/log/nginx/error.log
sudo nginx -t
```

## 今後の更新

```bash
cd ~/Event-AEON
git pull origin main
npm install
npm run build
pm2 restart all
```
