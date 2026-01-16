# ローカル環境での実行手順

## 前提条件

- Node.js がインストールされていること
- npm がインストールされていること
- カードリーダーが接続されていること（オプション）

## セットアップ手順

### 1. 依存関係のインストール

```bash
cd /Users/k.muto/webapp_01
npm install
```

### 2. アプリケーションの起動

#### 方法1: 一括起動（推奨）

```bash
npm start
```

または

```bash
./start.sh
```

これで以下が起動します：
- バックエンドサーバー: `http://localhost:3001`（バックグラウンド）
- フロントエンド: `http://localhost:3000`（ブラウザが自動で開く）

#### 方法2: 別々に起動

**ターミナル1（バックエンドサーバー）:**
```bash
npm run dev:server
```

**ターミナル2（フロントエンド）:**
```bash
npm run dev
```

#### 方法3: concurrently を使用

```bash
npm run dev:all
```

## アクセス方法

### ローカルマシンから

- フロントエンド: `http://localhost:3000`
- バックエンドAPI: `http://localhost:3001`

### 同じネットワーク内のスマホ/タブレットから

1. ローカルマシンとスマホを同じWi-Fiネットワークに接続
2. ローカルマシンのIPアドレスを確認:
   ```bash
   # macOSの場合
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```
3. スマホのブラウザで `http://ローカルマシンのIPアドレス:3000` にアクセス

## カードリーダーの設定

### macOSでのPC/SCライブラリのインストール

```bash
# Homebrewを使用してインストール
brew install pcsc-lite

# サービスを起動
brew services start pcsc-lite
```

### カードリーダーの確認

```bash
# カードリーダーをスキャン
pcsc_scan
```

## トラブルシューティング

### ポートが使用中の場合

```bash
# ポートの使用状況を確認
lsof -i :3000
lsof -i :3001

# プロセスを終了
kill -9 PID
```

### カードリーダーが認識されない場合

```bash
# PC/SCサービスの状態確認
brew services list | grep pcsc

# サービスを再起動
brew services restart pcsc-lite
```

### 依存関係のエラー

```bash
# node_modulesを削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

## 開発時のヒント

- フロントエンドの変更は自動的にホットリロードされます
- バックエンドの変更は手動で再起動が必要です（`Ctrl+C`で停止して再起動）
- ログは `server.log` に出力されます（`start.sh`を使用した場合）

## 停止方法

### 方法1: start.shを使用した場合

`Ctrl+C` を押すと、フロントエンドとバックエンドの両方が停止します。

### 方法2: 別々に起動した場合

各ターミナルで `Ctrl+C` を押して停止します。

### 方法3: プロセスを直接終了

```bash
# ポートを使用しているプロセスを確認
lsof -i :3000
lsof -i :3001

# プロセスを終了
kill -9 PID
```
