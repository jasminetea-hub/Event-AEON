# GitHubへのプッシュ方法

## 現在の状態

- ✅ Gitリポジトリは初期化済み
- ✅ リモートリポジトリは設定済み
- ✅ 初回コミットは完了
- ⚠️ プッシュ時に認証が必要

## Personal Access Token (PAT) を使用したプッシュ方法

### 1. GitHubでPersonal Access Tokenを生成

1. GitHubにログイン
2. 右上のプロフィールアイコンをクリック
3. **Settings** を選択
4. 左メニューから **Developer settings** を選択
5. **Personal access tokens** > **Tokens (classic)** を選択
6. **Generate new token** > **Generate new token (classic)** をクリック
7. 以下の設定を行う：
   - **Note**: `Event-AEON` など分かりやすい名前を入力
   - **Expiration**: 希望の有効期限を選択（または無期限）
   - **Select scopes**: `repo` にチェック（すべてのリポジトリへのアクセス権限）
8. **Generate token** をクリック
9. **トークンをコピー**（一度しか表示されません！）

### 2. プッシュ時にトークンを使用

```bash
cd /Users/k.muto/webapp_01

# プッシュを実行（ユーザー名とトークンを入力）
git push -u origin main

# ユーザー名: あなたのGitHubユーザー名
# Password: Personal Access Token（上でコピーしたトークン）
```

### 3. または、URLにトークンを含める（一時的）

```bash
# トークンを環境変数として設定（セキュリティ上の注意）
# 以下の例では、トークンを直接入力します
git remote set-url origin https://YOUR_TOKEN@github.com/jasminetea-hub/Event-AEON.git

# プッシュ
git push -u origin main
```

⚠️ **注意**: トークンをURLに含める方法は、コマンド履歴に残るため推奨されません。

### 4. Git Credential Helperを使用（推奨）

```bash
# macOSの場合は、キーチェーンを使用してトークンを保存
git config --global credential.helper osxkeychain

# プッシュ（1回だけ認証情報を入力）
git push -u origin main

# 次回以降は自動的に認証されます
```

## または、SSH鍵を設定する方法

### 1. SSH鍵を生成（まだ持っていない場合）

```bash
# SSH鍵を生成
ssh-keygen -t ed25519 -C "your_email@example.com"

# ファイル名の確認時はEnterを押す（デフォルトの場所を使用）
# パスフレーズを設定するかどうか（推奨：設定する）

# 公開鍵を表示
cat ~/.ssh/id_ed25519.pub
```

### 2. GitHubに公開鍵を追加

1. 上記でコピーした公開鍵（`~/.ssh/id_ed25519.pub`の内容）をコピー
2. GitHubの設定 > **SSH and GPG keys** > **New SSH key**
3. **Title**: わかりやすい名前（例：`MacBook Air`）
4. **Key**: 公開鍵を貼り付け
5. **Add SSH key** をクリック

### 3. SSH接続をテスト

```bash
ssh -T git@github.com
```

「Hi username! You've successfully authenticated...」と表示されればOK

### 4. リモートURLをSSHに変更してプッシュ

```bash
cd /Users/k.muto/webapp_01
git remote set-url origin git@github.com:jasminetea-hub/Event-AEON.git
git push -u origin main
```

## トラブルシューティング

### SSL証明書エラーが出る場合

```bash
# SSL検証を一時的に無効化（開発環境のみ）
git config --global http.sslVerify false

# または、証明書の場所を指定
git config --global http.sslCAInfo /etc/ssl/cert.pem
```

### 権限エラーが出る場合

- リポジトリへの書き込み権限があるか確認
- Personal Access Tokenに`repo`スコープが含まれているか確認
- SSH鍵がGitHubに正しく登録されているか確認
