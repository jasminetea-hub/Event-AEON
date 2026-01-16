# GitHubへのプッシュ方法（簡易版）

## 🚀 すぐにプッシュする方法

### 方法1: Personal Access TokenをURLに埋め込む（一時的）

```bash
# 1. GitHubでPersonal Access Tokenを作成
#    GitHub → Settings → Developer settings → Personal access tokens → Generate new token
#    Scope: repo にチェック

# 2. リモートURLを変更（TOKENの部分を実際のトークンに置き換え）
git remote set-url origin https://YOUR_TOKEN@github.com/jasminetea-hub/Event-AEON.git

# 3. プッシュ
git push origin main

# 4. プッシュ後、URLからトークンを削除（セキュリティのため）
git remote set-url origin https://github.com/jasminetea-hub/Event-AEON.git
```

### 方法2: GitHub Desktopを使用する

1. GitHub Desktopアプリを開く
2. 変更をコミット（既にコミット済み）
3. **Push origin**ボタンをクリック

### 方法3: VS CodeのGit機能を使用する

1. VS Codeのソース管理パネルを開く
2. **Push**ボタンをクリック
3. 認証ダイアログが表示されたら、Personal Access Tokenを入力

---

## 📝 Personal Access Tokenの作成手順

1. **GitHubにログイン**
2. 右上のアイコン → **Settings**
3. 左メニュー最下部 → **Developer settings**
4. **Personal access tokens** → **Tokens (classic)**
5. **Generate new token (classic)**
6. 設定：
   - **Note**: `Event-AEON-Push`
   - **Expiration**: 90 days
   - **Scopes**: `repo`にチェック
7. **Generate token**をクリック
8. **トークンをコピー**（重要：一度しか表示されません）

---

## ✅ プッシュ後

プッシュが成功したら、VPSサーバーで以下を実行：

```bash
ssh ubuntu@160.16.92.115
cd ~/Event-AEON
git pull origin main
```
