# Node.js インストールガイド

このプロジェクトを実行するには、Node.js（バージョン18以上）が必要です。

## インストール方法

### 方法1: Homebrewを使用（推奨）

1. Homebrewをインストール（まだインストールしていない場合）:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

2. Node.jsをインストール:
```bash
brew install node
```

### 方法2: 公式インストーラーを使用

1. [Node.js公式サイト](https://nodejs.org/ja/)にアクセス
2. LTS版（推奨版）をダウンロード
3. ダウンロードした`.pkg`ファイルを実行してインストール

### 方法3: nvmを使用（複数のNode.jsバージョンを管理したい場合）

1. nvmをインストール:
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
```

2. ターミナルを再起動するか、以下を実行:
```bash
source ~/.zshrc
```

3. Node.jsをインストール:
```bash
nvm install --lts
nvm use --lts
```

## インストール確認

インストール後、以下のコマンドで確認してください:

```bash
node --version
npm --version
```

両方のコマンドがバージョン番号を表示すれば、インストール成功です。

## 依存関係のインストール

Node.jsのインストールが完了したら、プロジェクトディレクトリで以下を実行:

```bash
cd /Users/k.muto/webapp_01
npm install
```

## 開発サーバーの起動

```bash
npm run dev
```
