# さくらのVPSでのデプロイ手順

## 1. GitHubリポジトリへのプッシュ

### ローカルでの準備

```bash
# Gitリポジトリを初期化
git init

# リモートリポジトリを追加
git remote add origin https://github.com/jasminetea-hub/Event-AEON.git

# すべてのファイルをステージング
git add .

# 初回コミット
git commit -m "Initial commit: 季節脱出ゲームアプリ"

# メインブランチにプッシュ
git branch -M main
git push -u origin main
```

## 2. さくらのVPSでのセットアップ

### 2.1 必要なソフトウェアのインストール

```bash
# Node.jsのインストール（nvmを使用）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20

# Gitのインストール（未インストールの場合）
sudo yum install git -y  # CentOS/RHELの場合
# または
sudo apt-get install git -y  # Ubuntu/Debianの場合

# PC/SCライブラリのインストール（カードリーダー用）
sudo yum install pcsc-lite pcsc-lite-devel -y  # CentOS/RHELの場合
# または
sudo apt-get install libpcsclite1 libpcsclite-dev -y  # Ubuntu/Debianの場合

# PC/SCサービスを起動
sudo systemctl enable pcscd
sudo systemctl start pcscd
```

### 2.2 プロジェクトのクローン

```bash
# ホームディレクトリまたは適切な場所に移動
cd ~

# リポジトリをクローン
git clone https://github.com/jasminetea-hub/Event-AEON.git
cd Event-AEON
```

### 2.3 依存関係のインストール

```bash
# プロジェクトの依存関係をインストール
npm install

# テストデータベースの依存関係もインストール（必要に応じて）
cd テストデータベース
npm install
cd ..
```

### 2.4 環境変数の設定（オプション）

```bash
# .envファイルを作成（必要に応じて）
cat > .env << EOF
VITE_API_BASE_URL=http://YOUR_VPS_IP:3001
NODE_ENV=production
EOF
```

## 3. 本番環境での実行

### 3.1 PM2を使用したプロセス管理（推奨）

```bash
# PM2をグローバルにインストール
npm install -g pm2

# バックエンドサーバーをPM2で起動
pm2 start server/index.js --name "event-aeon-server" --interpreter node

# フロントエンドをビルド
npm run build

# フロントエンドをPM2で起動（Viteのプレビューサーバーを使用）
pm2 start npm --name "event-aeon-frontend" -- run preview

# PM2の設定を保存
pm2 save

# システム起動時に自動起動
pm2 startup
```

### 3.2 または、systemdサービスとして実行

#### バックエンドサーバー用のサービスファイル

```bash
sudo nano /etc/systemd/system/event-aeon-server.service
```

```ini
[Unit]
Description=Event AEON Backend Server
After=network.target

[Service]
Type=simple
User=YOUR_USERNAME
WorkingDirectory=/home/YOUR_USERNAME/Event-AEON
Environment="NODE_ENV=production"
ExecStart=/home/YOUR_USERNAME/.nvm/versions/node/v20.x.x/bin/node server/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

#### フロントエンド用のサービスファイル

```bash
sudo nano /etc/systemd/system/event-aeon-frontend.service
```

```ini
[Unit]
Description=Event AEON Frontend Server
After=network.target

[Service]
Type=simple
User=YOUR_USERNAME
WorkingDirectory=/home/YOUR_USERNAME/Event-AEON
Environment="NODE_ENV=production"
ExecStart=/home/YOUR_USERNAME/.nvm/versions/node/v20.x.x/bin/npm run preview
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

#### サービスの起動

```bash
# サービスを有効化
sudo systemctl enable event-aeon-server
sudo systemctl enable event-aeon-frontend

# サービスを起動
sudo systemctl start event-aeon-server
sudo systemctl start event-aeon-frontend

# ステータス確認
sudo systemctl status event-aeon-server
sudo systemctl status event-aeon-frontend
```

## 4. ファイアウォールの設定

```bash
# ポート3000（フロントエンド）と3001（バックエンド）を開放
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --reload

# または、ufwを使用する場合
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp
sudo ufw reload
```

## 5. Nginxリバースプロキシの設定（推奨）

### 5.1 Nginxのインストール

```bash
sudo yum install nginx -y  # CentOS/RHELの場合
# または
sudo apt-get install nginx -y  # Ubuntu/Debianの場合
```

### 5.2 Nginx設定ファイル

```bash
sudo nano /etc/nginx/conf.d/event-aeon.conf
```

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    # フロントエンド
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # バックエンドAPI
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5.3 Nginxの起動

```bash
sudo systemctl enable nginx
sudo systemctl start nginx
sudo nginx -t  # 設定ファイルのテスト
sudo systemctl reload nginx
```

## 6. SSL証明書の設定（Let's Encrypt）

```bash
# Certbotのインストール
sudo yum install certbot python3-certbot-nginx -y  # CentOS/RHELの場合
# または
sudo apt-get install certbot python3-certbot-nginx -y  # Ubuntu/Debianの場合

# SSL証明書の取得
sudo certbot --nginx -d YOUR_DOMAIN
```

## 7. データベースのセットアップ

```bash
# テストデータベースの初期化（必要に応じて）
cd テストデータベース
node database.js
cd ..
```

## 8. ログの確認

```bash
# PM2を使用している場合
pm2 logs

# systemdを使用している場合
sudo journalctl -u event-aeon-server -f
sudo journalctl -u event-aeon-frontend -f

# Nginxのログ
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 9. 更新手順

```bash
# リポジトリを更新
cd ~/Event-AEON
git pull origin main

# 依存関係を更新
npm install

# フロントエンドを再ビルド
npm run build

# サービスを再起動
pm2 restart all
# または
sudo systemctl restart event-aeon-server
sudo systemctl restart event-aeon-frontend
```

## トラブルシューティング

### カードリーダーが認識されない場合

```bash
# PC/SCサービスの状態確認
sudo systemctl status pcscd

# カードリーダーの確認
pcsc_scan

# 権限の確認
ls -l /dev/bus/usb/
```

### ポートが使用中の場合

```bash
# ポートの使用状況を確認
sudo netstat -tlnp | grep :3000
sudo netstat -tlnp | grep :3001

# プロセスを終了
sudo kill -9 PID
```

## 参考リンク

- [GitHubリポジトリ](https://github.com/jasminetea-hub/Event-AEON.git)
- [PM2公式ドキュメント](https://pm2.keymetrics.io/)
- [Nginx公式ドキュメント](https://nginx.org/en/docs/)
