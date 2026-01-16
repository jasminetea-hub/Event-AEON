# アプリとサーバーの起動方法

## 方法1: 別々のターミナルで起動（推奨）

### ターミナル1: フロントエンド（Vite）
```bash
cd /Users/k.muto/webapp_01
npm run dev
```

### ターミナル2: バックエンドサーバー
```bash
cd /Users/k.muto/webapp_01
npm run dev:server
```

## 方法2: concurrentlyを使用（両方同時に起動）

まず、`concurrently`がインストールされているか確認：
```bash
npm list concurrently
```

インストールされていない場合：
```bash
npm install
```

その後、以下のコマンドで両方を同時に起動：
```bash
npm run dev:all
```

## 起動確認

- フロントエンド: http://localhost:3000
- バックエンド: http://localhost:3001

両方が起動していることを確認してから、ブラウザでアクセスしてください。
