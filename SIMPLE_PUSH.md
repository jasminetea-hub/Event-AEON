# 🚀 簡単なプッシュ方法

## 方法1: スクリプトを使用（推奨）

```bash
./push-with-token.sh
```

このスクリプトを実行すると、Personal Access Tokenとユーザー名の入力が求められます。

---

## 方法2: コマンドラインで直接実行

### ステップ1: Personal Access Tokenを取得

1. GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. **Generate new token (classic)**
3. **Note**: `Event-AEON-Push`
4. **Expiration**: 90 days
5. **Scopes**: `repo` にチェック
6. **Generate token** → トークンをコピー

### ステップ2: プッシュを実行

```bash
# リモートURLを一時的に変更（TOKENとUSERNAMEを実際の値に置き換え）
git remote set-url origin https://YOUR_USERNAME:YOUR_TOKEN@github.com/jasminetea-hub/Event-AEON.git

# プッシュ
git push origin main

# プッシュ後、URLからトークンを削除（セキュリティのため）
git remote set-url origin https://github.com/jasminetea-hub/Event-AEON.git
```

**例**：
```bash
git remote set-url origin https://jasminetea-hub:ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@github.com/jasminetea-hub/Event-AEON.git
git push origin main
git remote set-url origin https://github.com/jasminetea-hub/Event-AEON.git
```

---

## 方法3: GitHub CLIを使用

```bash
# GitHub CLIをインストール（未インストールの場合）
brew install gh

# GitHubにログイン
gh auth login

# プッシュ
git push origin main
```

---

## 方法4: GitHub Desktopを使用

1. GitHub Desktopアプリを開く
2. 左側の変更を確認
3. 下部にコミットメッセージを入力（既にコミット済みならスキップ）
4. **Push origin** ボタンをクリック

---

## ✅ プッシュ成功の確認

プッシュが成功すると、以下のようなメッセージが表示されます：

```
Enumerating objects: X, done.
Counting objects: 100% (X/X), done.
Delta compression using up to X threads
Compressing objects: 100% (X/X), done.
Writing objects: 100% (X/X), X.XX KiB | X.XX MiB/s, done.
Total X (delta X), reused X (delta X), pack-reused 0
To https://github.com/jasminetea-hub/Event-AEON.git
   xxxxxxx..xxxxxxx  main -> main
```

---

## 🔍 トラブルシューティング

### トークンが無効な場合

- トークンが正しくコピーされているか確認
- トークンの有効期限が切れていないか確認
- `repo` スコープが有効になっているか確認

### 権限エラーが発生する場合

- リポジトリへの書き込み権限があるか確認
- トークンに `repo` スコープが含まれているか確認

### Cursorのaskpassエラーが発生する場合

- ターミナルで直接実行してみる（Cursorの統合ターミナルではなく、別のターミナルアプリを使用）
- URLにトークンを埋め込む方法を使用
