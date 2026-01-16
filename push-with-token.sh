#!/bin/bash
# GitHubへのプッシュ用スクリプト（Personal Access Tokenを使用）

echo "🔐 GitHubへのプッシュを行います"
echo ""
echo "⚠️  事前準備: GitHubでPersonal Access Tokenを作成してください"
echo "   1. GitHub → Settings → Developer settings → Personal access tokens"
echo "   2. Generate new token (classic)"
echo "   3. Scope: repo にチェック"
echo "   4. トークンをコピー"
echo ""

# Personal Access Tokenを入力
read -sp "Personal Access Tokenを入力してください: " TOKEN
echo ""

# GitHubユーザー名を入力
read -p "GitHubユーザー名を入力してください: " USERNAME
echo ""

if [ -z "$TOKEN" ] || [ -z "$USERNAME" ]; then
    echo "❌ エラー: トークンまたはユーザー名が入力されていません"
    exit 1
fi

# リモートURLを一時的に変更
echo "📝 リモートURLを一時的に変更しています..."
git remote set-url origin "https://${USERNAME}:${TOKEN}@github.com/jasminetea-hub/Event-AEON.git"

# プッシュ
echo "🚀 GitHubにプッシュしています..."
if git push origin main; then
    echo "✅ プッシュが成功しました！"
    
    # セキュリティのため、URLからトークンを削除
    echo "🔒 セキュリティのため、URLからトークンを削除しています..."
    git remote set-url origin "https://github.com/jasminetea-hub/Event-AEON.git"
    echo "✅ 完了しました"
else
    echo "❌ プッシュに失敗しました"
    # エラー時もURLを戻す
    git remote set-url origin "https://github.com/jasminetea-hub/Event-AEON.git"
    exit 1
fi
