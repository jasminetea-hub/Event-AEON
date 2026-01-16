# デプロイ構成ガイド

## 推奨構成

### 構成1: 分離デプロイ（推奨）✅

```
┌─────────────────────────────────┐
│    VPSサーバー（インターネット）   │
│                                 │
│  ├─ スマホ用アプリ（フロントエンド）│
│  │   http://160.16.92.115:3000  │
│  │                              │
│  └─ バックエンドAPI              │
│     http://160.16.92.115:3001   │
└─────────────────────────────────┘
              ▲
              │ API通信
              │
┌─────────────┴──────────────┐
│   PC端末（カードリーダー接続）  │
│                            │
│  カードリーダークライアント     │
│  (pc-terminal/card-reader) │
│  ローカルで実行              │
└────────────────────────────┘
```

**メリット：**
- ✅ カードリーダーはPC端末に直接接続されるため、PC端末で実行するのが自然
- ✅ スマホ用アプリはVPSにデプロイすることで、どこからでもアクセス可能
- ✅ 役割が明確に分離されている
- ✅ セキュリティが高い（カードリーダーが直接インターネットに公開されない）
- ✅ スケーラブル（複数のPC端末からカードを送信可能）

**デメリット：**
- ⚠️ PC端末でもプロジェクトをセットアップする必要がある

---

### 構成2: 統合デプロイ（非推奨）

```
┌─────────────────────────────────┐
│    VPSサーバー（インターネット）   │
│                                 │
│  ├─ スマホ用アプリ               │
│  ├─ バックエンドAPI              │
│  └─ カードリーダー処理           │ ← カードリーダーを接続できない
└─────────────────────────────────┘
```

**問題点：**
- ❌ VPSサーバーにカードリーダーを物理的に接続できない
- ❌ USBデバイス（カードリーダー）はリモートサーバーでは使用できない

---

## デプロイ手順

### 1. VPSサーバー側（スマホ用アプリ）

#### セットアップ

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
```

#### 起動（PM2）

```bash
# バックエンドAPIを起動
pm2 start server/index.js --name "event-aeon-api"

# フロントエンドを起動
pm2 start npm --name "event-aeon-frontend" -- run preview

# 自動起動設定
pm2 save
pm2 startup
```

#### アクセス

- **スマホ**: `http://160.16.92.115:3000`
- **API**: `http://160.16.92.115:3001`

---

### 2. PC端末側（カードリーダー）

#### セットアップ

```bash
# PC端末でプロジェクトをクローン
cd ~
git clone git@github.com:jasminetea-hub/Event-AEON.git
cd Event-AEON

# 依存関係をインストール
npm install

# PC/SCライブラリのインストール（必要に応じて）
# macOS: brew install pcsc-lite
# Linux: sudo apt-get install pcscd libpcsclite1
```

#### 起動

```bash
# カードリーダークライアントを起動
npm run pc:card-reader http://160.16.92.115:3001

# または、環境変数で設定
export VPS_SERVER_URL=http://160.16.92.115:3001
npm run pc:card-reader
```

#### 常時起動（オプション）

```bash
# PM2を使用して常時起動（PC端末で）
pm2 start npm --name "card-reader-client" -- run pc:card-reader -- http://160.16.92.115:3001
pm2 save
pm2 startup
```

---

## ディレクトリ構成

```
Event-AEON/
├── src/                    # スマホ用アプリ（フロントエンド）
│   ├── App.tsx
│   ├── Game.tsx
│   ├── FinalPuzzleModal.tsx
│   └── ...
│
├── server/                 # バックエンドAPI（VPSで実行）
│   ├── index.js
│   └── card-relay.js
│
└── pc-terminal/           # PC端末用アプリ（PC端末で実行）
    └── card-reader-client.js
```

---

## まとめ

| 項目 | VPSサーバー | PC端末 |
|------|------------|--------|
| **役割** | スマホ用アプリ + API | カードリーダー |
| **デプロイ場所** | インターネット上（VPS） | PC端末（ローカル） |
| **アクセス** | どこからでも | PC端末からのみ |
| **起動方法** | PM2（常時起動） | 手動またはPM2 |

**結論：分離デプロイが最適です。**
- VPSサーバー：スマホ用アプリ + バックエンドAPI
- PC端末：カードリーダークライアント
