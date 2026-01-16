# VPSでのSSH鍵設定方法

## 問題
VPSでGitHubからリポジトリをクローンしようとしたが、SSH鍵が設定されていないためエラーが発生。

## 解決方法1: SSH鍵を設定する（推奨）

### 1. VPSでSSH鍵を生成

```bash
# VPSでSSH鍵を生成
ssh-keygen -t ed25519 -C "vps@160.16.92.115"

# すべてEnterを押す（デフォルト設定を使用）
# パスフレーズは設定を推奨

# 公開鍵を表示してコピー
cat ~/.ssh/id_ed25519.pub
```

### 2. GitHubに公開鍵を追加

1. GitHubにログイン: https://github.com
2. 右上のプロフィールアイコン → **Settings**
3. 左メニュー → **SSH and GPG keys**
4. **New SSH key** をクリック
5. 以下を入力：
   - **Title**: `VPS - 160.16.92.115` など
   - **Key**: 上記でコピーした公開鍵を貼り付け
6. **Add SSH key** をクリック

### 3. SSH接続をテスト

```bash
# VPSでGitHubへの接続をテスト
ssh -T git@github.com

# "Hi jasminetea-hub! You've successfully authenticated..." と表示されればOK
```

### 4. リポジトリをクローン

```bash
cd ~
git clone git@github.com:jasminetea-hub/Event-AEON.git
cd Event-AEON
npm install
```

## 解決方法2: HTTPS方式でクローンする（簡単）

### 1. Personal Access Token (PAT) を用意

ローカルマシンで使用したPersonal Access Token、または新しく生成してください。

### 2. HTTPS方式でクローン

```bash
cd ~

# HTTPS方式でクローン（認証情報を求められる）
git clone https://github.com/jasminetea-hub/Event-AEON.git

# ユーザー名: jasminetea-hub
# パスワード: Personal Access Token（通常のパスワードではない）

cd Event-AEON
npm install
```

### 3. 認証情報を保存（オプション）

```bash
# Gitの認証情報ヘルパーを設定
git config --global credential.helper store

# 次回以降は自動的に認証されます
```

## 推奨: 方法1（SSH鍵設定）

SSH鍵を設定することで、今後は認証なしでプッシュ・プルが可能になります。

### 手順のまとめ

```bash
# 1. SSH鍵を生成
ssh-keygen -t ed25519 -C "vps@160.16.92.115"
# Enterを押す（デフォルト設定）

# 2. 公開鍵を表示
cat ~/.ssh/id_ed25519.pub

# 3. この公開鍵をGitHubに追加（上記手順参照）

# 4. 接続テスト
ssh -T git@github.com

# 5. クローン
cd ~
git clone git@github.com:jasminetea-hub/Event-AEON.git
cd Event-AEON
npm install
```
