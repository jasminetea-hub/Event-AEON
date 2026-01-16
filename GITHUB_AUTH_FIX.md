# GitHub認証エラー（401）の解決方法

## 問題

```
fatal: Authentication failed for 'https://github.com/jasminetea-hub/Event-AEON.git/'
```

GitHubへのプッシュ時に認証エラーが発生しています。

---

## 解決方法1: Personal Access Token（PAT）を使用する（推奨）

### ステップ1: GitHubでPersonal Access Tokenを作成

1. GitHubにログイン
2. 右上のアイコンをクリック → **Settings**
3. 左メニューの最下部 → **Developer settings**
4. **Personal access tokens** → **Tokens (classic)**
5. **Generate new token** → **Generate new token (classic)**
6. 以下の設定：
   - **Note**: `Event-AEON-Push`（任意の名前）
   - **Expiration**: 必要な期限を選択（例：90 days）
   - **Scopes**: `repo`にチェック
7. **Generate token**をクリック
8. **トークンをコピー**（一度しか表示されません！）

### ステップ2: Git Credential Helperに保存

```bash
# トークンをGit Credential Helperに保存
git credential-osxkeychain store

# その後、以下の形式で入力（Enterキーを2回押す）
# protocol=https
# host=github.com
# username=YOUR_GITHUB_USERNAME
# password=YOUR_PERSONAL_ACCESS_TOKEN
```

**または、URLに直接トークンを埋め込む方法：**

```bash
# リモートURLを変更（TOKENの部分を実際のトークンに置き換え）
git remote set-url origin https://YOUR_TOKEN@github.com/jasminetea-hub/Event-AEON.git

# プッシュ
git push origin main
```

**注意**: この方法はセキュリティ上の理由から推奨されません。Credential Helperを使う方が安全です。

---

## 解決方法2: SSH鍵を使用する

### ステップ1: SSH鍵が既にあるか確認

```bash
ls -la ~/.ssh/id_ed25519.pub
```

### ステップ2: SSH鍵をGitHubに追加

```bash
# 公開鍵を表示
cat ~/.ssh/id_ed25519.pub
```

1. 表示された鍵をコピー
2. GitHub → **Settings** → **SSH and GPG keys**
3. **New SSH key**をクリック
4. **Title**: 任意（例：MacBook-Air）
5. **Key**: コピーした鍵を貼り付け
6. **Add SSH key**をクリック

### ステップ3: リモートURLをSSHに変更

```bash
# リモートURLをSSHに変更
git remote set-url origin git@github.com:jasminetea-hub/Event-AEON.git

# 接続テスト
ssh -T git@github.com

# プッシュ
git push origin main
```

---

## 解決方法3: GitHub CLIを使用する

```bash
# GitHub CLIをインストール（未インストールの場合）
brew install gh

# GitHubにログイン
gh auth login

# プッシュ
git push origin main
```

---

## 推奨：一時的な解決策（すぐにプッシュしたい場合）

Personal Access Tokenを作成後、以下のコマンドで一度だけプッシュ：

```bash
# リモートURLを変更（TOKENを実際のトークンに置き換え）
git remote set-url origin https://YOUR_TOKEN@github.com/jasminetea-hub/Event-AEON.git

# プッシュ
git push origin main

# プッシュ後、URLからトークンを削除（セキュリティのため）
git remote set-url origin https://github.com/jasminetea-hub/Event-AEON.git
```

---

## 確認方法

```bash
# リモートURLを確認
git remote -v

# プッシュテスト
git push origin main
```
