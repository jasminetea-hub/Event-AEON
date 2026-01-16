# デプロイメント README

## 概要

このアプリケーションは **2つのコンポーネント** で構成されています：

1. **スマホ用アプリ（VPSサーバーにデプロイ）**
   - ユーザーが操作するWebアプリケーション
   - VPSサーバーにデプロイしてインターネット経由でアクセス可能

2. **カードリーダーアプリ（PC端末で実行）**
   - PC端末に接続されたカードリーダーを使用
   - PC端末でローカル実行

---

## クイックスタート

### VPSサーバー側

```bash
# VPSにSSH接続
ssh ubuntu@160.16.92.115

# プロジェクトをクローン
cd ~
git clone git@github.com:jasminetea-hub/Event-AEON.git
cd Event-AEON

# 依存関係をインストール
npm install

# フロントエンドをビルド
npm run build

# PM2で起動
pm2 start server/index.js --name "event-aeon-api"
pm2 start npm --name "event-aeon-frontend" -- run preview
pm2 save
pm2 startup
```

### PC端末側

```bash
# PC端末でプロジェクトをクローン
cd ~
git clone git@github.com:jasminetea-hub/Event-AEON.git
cd Event-AEON

# 依存関係をインストール
npm install

# カードリーダークライアントを起動
npm run pc:card-reader http://160.16.92.115:3001
```

---

## 詳細なデプロイ手順

詳細は以下のドキュメントを参照してください：

- **デプロイ構成**: `DEPLOYMENT_STRUCTURE.md`
- **VPSデプロイガイド**: `VPS_DEPLOYMENT_GUIDE.md`
- **ローカルセットアップ**: `LOCAL_SETUP.md`

---

## トラブルシューティング

### PC端末からVPSサーバーに接続できない

```bash
# ネットワーク接続を確認
ping 160.16.92.115

# VPSサーバーのAPIにアクセスできるか確認
curl http://160.16.92.115:3001/api/submit-card
```

### スマホからVPSサーバーに接続できない

- ブラウザで `http://160.16.92.115:3000` にアクセスできるか確認
- ファイアウォールの設定を確認（ポート3000, 3001を開放）

### カードリーダーが認識されない（PC端末）

```bash
# PC/SCサービスの状態確認
# macOS:
brew services list | grep pcsc

# Linux:
sudo systemctl status pcscd
```

---

## サポート

問題が発生した場合は、以下の情報を確認してください：

1. VPSサーバーのログ: `pm2 logs event-aeon-api`
2. PC端末のコンソール出力
3. ブラウザのコンソール（スマホ側）
