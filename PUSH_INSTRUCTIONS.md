# 🔐 GitHubプッシュ手順（詳細版）

## ⚠️ 重要

`YOUR_USERNAME` と `YOUR_TOKEN` は**実際の値に置き換える必要があります**。

---

## ステップ1: Personal Access Tokenを取得

### 1. GitHubにログイン

ブラウザで https://github.com にアクセスしてログイン

### 2. Personal Access Tokenを作成

1. 右上のプロフィールアイコンをクリック
2. **Settings** を選択
3. 左メニューの一番下 → **Developer settings**
4. **Personal access tokens** → **Tokens (classic)**
5. **Generate new token (classic)** をクリック
6. 設定を入力：
   - **Note**: `Event-AEON-Push`（任意の名前）
   - **Expiration**: `90 days`（またはお好みの期間）
   - **Select scopes**: `repo` にチェック ✅
7. ページの一番下の **Generate token** をクリック
8. **表示されたトークンをコピー**（例：`ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`）
   - ⚠️ **一度しか表示されません！必ずコピーしてください**

### 3. GitHubユーザー名を確認

GitHubのプロフィールページでユーザー名を確認（例：`jasminetea-hub`）

---

## ステップ2: プッシュを実行

ターミナルで、以下のコマンドの `YOUR_USERNAME` と `YOUR_TOKEN` を実際の値に置き換えて実行：

```bash
# 例：ユーザー名が jasminetea-hub、トークンが ghp_abc123... の場合
git remote set-url origin https://jasminetea-hub:ghp_abc123...@github.com/jasminetea-hub/Event-AEON.git
git push origin main
git remote set-url origin https://github.com/jasminetea-hub/Event-AEON.git
```

**具体的な手順**：

1. まず、以下のコマンドをコピー（まだ実行しない）：
   ```bash
   git remote set-url origin https://YOUR_USERNAME:YOUR_TOKEN@github.com/jasminetea-hub/Event-AEON.git
   ```

2. `YOUR_USERNAME` をあなたのGitHubユーザー名に置き換える
3. `YOUR_TOKEN` をコピーしたPersonal Access Tokenに置き換える
4. ターミナルに貼り付けて実行（Enterキーを押す）

5. 次にプッシュ：
   ```bash
   git push origin main
   ```

6. プッシュ後、URLからトークンを削除：
   ```bash
   git remote set-url origin https://github.com/jasminetea-hub/Event-AEON.git
   ```

---

## 方法2: 環境変数を使用（より安全）

```bash
# トークンとユーザー名を環境変数に設定
export GITHUB_USERNAME="あなたのGitHubユーザー名"
export GITHUB_TOKEN="ghp_あなたのトークン"

# URLを設定してプッシュ
git remote set-url origin "https://${GITHUB_USERNAME}:${GITHUB_TOKEN}@github.com/jasminetea-hub/Event-AEON.git"
git push origin main

# URLを元に戻す
git remote set-url origin https://github.com/jasminetea-hub/Event-AEON.git

# 環境変数をクリア（セキュリティのため）
unset GITHUB_USERNAME
unset GITHUB_TOKEN
```

---

## 方法3: スクリプトを使用

```bash
./push-with-token.sh
```

このスクリプトを実行すると、トークンとユーザー名の入力を求められます。

---

## 方法4: GitHub CLIを使用（最も簡単）

```bash
# GitHub CLIをインストール（未インストールの場合）
brew install gh

# GitHubにログイン（ブラウザが開いて認証）
gh auth login

# プッシュ
git push origin main
```

---

## ✅ プッシュ成功の確認

成功すると以下のようなメッセージが表示されます：

```
Enumerating objects: 15, done.
Counting objects: 100% (15/15), done.
Delta compression using up to 8 threads
Compressing objects: 100% (8/8), done.
Writing objects: 100% (8/8), 2.34 KiB | 2.34 MiB/s, done.
Total 8 (delta 6), reused 0 (delta 0), pack-reused 0
To https://github.com/jasminetea-hub/Event-AEON.git
   f6b8aba..a8f02ae  main -> main
```

---

## 🔍 よくあるエラー

### "Invalid username or token" エラー

- `YOUR_USERNAME` と `YOUR_TOKEN` が実際の値に置き換えられているか確認
- トークンが正しくコピーされているか確認（スペースや改行が入っていないか）
- トークンに `repo` スコープが含まれているか確認

### "Authentication failed" エラー

- トークンの有効期限が切れていないか確認
- トークンが正しく生成されているか確認
- GitHubユーザー名が正しいか確認

---

## 📝 例

ユーザー名が `k-muto`、トークンが `ghp_1234567890abcdefghijklmnopqrstuvwxyz` の場合：

```bash
git remote set-url origin https://k-muto:ghp_1234567890abcdefghijklmnopqrstuvwxyz@github.com/jasminetea-hub/Event-AEON.git
git push origin main
git remote set-url origin https://github.com/jasminetea-hub/Event-AEON.git
```
