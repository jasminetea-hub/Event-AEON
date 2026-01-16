# GitHubリポジトリへのプッシュ手順

## 前提条件

- GitHubアカウントを持っていること
- Gitがインストールされていること
- リポジトリ `https://github.com/jasminetea-hub/Event-AEON.git` が作成済みであること

## 手順

### 1. Gitリポジトリの初期化

```bash
cd /Users/k.muto/webapp_01
git init
```

### 2. リモートリポジトリの追加

```bash
git remote add origin https://github.com/jasminetea-hub/Event-AEON.git
```

### 3. ファイルのステージング

```bash
git add .
```

### 4. 初回コミット

```bash
git commit -m "Initial commit: 季節脱出ゲームアプリ

- React + TypeScript + Viteで構築
- Express.jsバックエンドサーバー
- ICカードリーダー連携機能
- スマホ/PC分離構成対応
- ネットワーク経由通信対応"
```

### 5. メインブランチの設定とプッシュ

```bash
git branch -M main
git push -u origin main
```

## 認証について

GitHubへのプッシュ時に認証が求められる場合：

### Personal Access Token (PAT) を使用する場合

1. GitHubの設定 > Developer settings > Personal access tokens > Tokens (classic) でトークンを生成
2. 必要な権限: `repo` を選択
3. プッシュ時にユーザー名とトークンを入力

### SSH鍵を使用する場合

```bash
# SSH鍵を生成（まだ持っていない場合）
ssh-keygen -t ed25519 -C "your_email@example.com"

# 公開鍵をコピー
cat ~/.ssh/id_ed25519.pub

# GitHubの設定 > SSH and GPG keys に公開鍵を追加

# リモートURLをSSHに変更
git remote set-url origin git@github.com:jasminetea-hub/Event-AEON.git
```

## 今後の更新手順

```bash
# 変更をステージング
git add .

# コミット
git commit -m "変更内容の説明"

# プッシュ
git push origin main
```

## ブランチの使用（オプション）

```bash
# 新しいブランチを作成
git checkout -b feature/新機能名

# 変更をコミット
git add .
git commit -m "新機能の追加"

# ブランチをプッシュ
git push origin feature/新機能名

# GitHubでPull Requestを作成してマージ
```
