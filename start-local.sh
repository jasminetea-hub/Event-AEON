#!/bin/bash
# ローカル環境でアプリを起動するスクリプト（同じWi-Fi下でアクセス可能）

echo "🚀 ローカル環境でアプリを起動します..."
echo ""

# ローカルIPアドレスを取得して表示
echo "📡 ローカルIPアドレスを取得中..."
node get-local-ip.js

echo ""
echo "📦 依存関係を確認中..."
if [ ! -d "node_modules" ]; then
  echo "   依存関係をインストールします..."
  npm install
fi

echo ""
echo "🎯 開発サーバーとバックエンドサーバーを起動します..."
echo "   フロントエンド: http://localhost:3000 (または上記のローカルIPアドレス)"
echo "   バックエンドAPI: http://localhost:3001 (または上記のローカルIPアドレス)"
echo ""
echo "⚠️  終了するには Ctrl+C を押してください"
echo ""

# フロントエンドとバックエンドを同時に起動
npm run dev:all
