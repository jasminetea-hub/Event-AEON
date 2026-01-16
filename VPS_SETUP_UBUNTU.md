# UbuntuでのVPSセットアップ手順

## 1. PC/SCライブラリのインストール（Ubuntu）

```bash
# PC/SCライブラリをインストール
sudo apt-get update
sudo apt-get install -y pcscd libpcsclite1 libpcsclite-dev

# PC/SCサービスを起動
sudo systemctl enable pcscd
sudo systemctl start pcscd

# サービス状態を確認
sudo systemctl status pcscd
```

### サービスが見つからない場合の対処

```bash
# パッケージが正しくインストールされているか確認
dpkg -l | grep pcsc

# サービスファイルの場所を確認
systemctl list-unit-files | grep pcsc

# サービスファイルが存在しない場合、再インストール
sudo apt-get remove --purge pcscd
sudo apt-get install -y pcscd

# サービスの確認
sudo systemctl daemon-reload
sudo systemctl enable pcscd
sudo systemctl start pcscd
```

## 2. Node.jsのインストール

```bash
# nvmをインストール
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# Node.js 20をインストール
nvm install 20
nvm use 20
nvm alias default 20

# バージョン確認
node --version
npm --version
```

## 3. GitのインストールとSSH鍵設定

```bash
# Gitのインストール
sudo apt-get install -y git

# GitHubのSSH鍵が既に設定されているか確認
ls -la ~/.ssh/

# SSH鍵がない場合、生成
ssh-keygen -t ed25519 -C "your_email@example.com"
cat ~/.ssh/id_ed25519.pub

# 公開鍵をGitHubに追加（ローカルマシンで実行した手順と同じ）
```

## 4. プロジェクトのクローン

```bash
# ホームディレクトリに移動
cd ~

# リポジトリをクローン
git clone git@github.com:jasminetea-hub/Event-AEON.git
cd Event-AEON

# 依存関係をインストール
npm install
```

## 5. PM2のインストールとプロセス管理

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

# システム起動時に自動起動（sudoが必要な場合があります）
pm2 startup
# 表示されたコマンドをコピーして実行
```

## 6. ファイアウォールの設定（ufwを使用）

```bash
# ufwが有効でない場合、有効化
sudo ufw status

# ポート3000（フロントエンド）と3001（バックエンド）を開放
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp
sudo ufw allow 22/tcp  # SSH接続を維持

# ファイアウォールを有効化（まだ有効でない場合）
sudo ufw enable

# 設定を確認
sudo ufw status
```

## 7. Nginxのインストールと設定

```bash
# Nginxのインストール
sudo apt-get install -y nginx

# Nginx設定ファイルを作成
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

## 8. カードリーダーの確認

```bash
# PC/SCサービスが起動しているか確認
sudo systemctl status pcscd

# カードリーダーをスキャン
pcsc_scan

# または
sudo pcscd -f
```

## 9. 動作確認

1. ブラウザでアクセス: `http://160.16.92.115`
2. アプリケーションが表示されることを確認
3. PM2の状態を確認: `pm2 list`

## トラブルシューティング

### PC/SCサービスが起動しない場合

```bash
# パッケージを再インストール
sudo apt-get remove --purge pcscd
sudo apt-get autoremove
sudo apt-get install -y pcscd

# サービスを再読み込み
sudo systemctl daemon-reload
sudo systemctl enable pcscd
sudo systemctl start pcscd

# ログを確認
sudo journalctl -u pcscd -f
```

### カードリーダーが接続されていない場合

カードリーダーはUSB経由で接続する必要があります。USB接続を確認してください。

### PM2のプロセスが起動しない場合

```bash
# ログを確認
pm2 logs

# エラーの詳細を確認
pm2 describe event-aeon-server
pm2 describe event-aeon-frontend

# ポートが使用中か確認
sudo netstat -tlnp | grep :3000
sudo netstat -tlnp | grep :3001
```

### Nginxが起動しない場合

```bash
# 設定ファイルの構文を確認
sudo nginx -t

# エラーログを確認
sudo tail -f /var/log/nginx/error.log
```

## 今後の更新手順

```bash
# VPSにSSH接続
ssh ubuntu@160.16.92.115

# プロジェクトディレクトリに移動
cd ~/Event-AEON

# リポジトリを更新
git pull origin main

# 依存関係を更新
npm install

# フロントエンドを再ビルド
npm run build

# PM2を再起動
pm2 restart all
```
