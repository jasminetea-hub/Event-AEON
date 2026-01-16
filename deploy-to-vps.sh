#!/bin/bash
# VPSサーバーへのデプロイスクリプト

VPS_IP="160.16.92.115"
VPS_USER="ubuntu"
PROJECT_DIR="Event-AEON"

echo "🚀 VPSサーバーにデプロイを開始します..."

# SSH接続してデプロイを実行
ssh ${VPS_USER}@${VPS_IP} << 'ENDSSH'
    echo "📦 プロジェクトディレクトリに移動..."
    cd ~
    
    # プロジェクトが既に存在する場合は更新、なければクローン
    if [ -d "$PROJECT_DIR" ]; then
        echo "🔄 既存のプロジェクトを更新..."
        cd $PROJECT_DIR
        git pull origin main
    else
        echo "📥 プロジェクトをクローン..."
        git clone git@github.com:jasminetea-hub/Event-AEON.git
        cd $PROJECT_DIR
    fi
    
    echo "📚 依存関係をインストール..."
    npm install
    
    echo "🏗️ フロントエンドをビルド..."
    npm run build
    
    echo "🔄 PM2プロセスを再起動..."
    # 既存のプロセスを停止
    pm2 stop event-aeon-api event-aeon-frontend 2>/dev/null || true
    pm2 delete event-aeon-api event-aeon-frontend 2>/dev/null || true
    
    # 新しいプロセスを起動
    pm2 start server/index.js --name "event-aeon-api"
    pm2 start npm --name "event-aeon-frontend" -- run preview
    
    echo "💾 PM2設定を保存..."
    pm2 save
    
    echo "✅ デプロイが完了しました！"
    echo ""
    echo "📊 プロセス状態:"
    pm2 status
    echo ""
    echo "📝 ログを確認するには:"
    echo "  pm2 logs event-aeon-api"
    echo "  pm2 logs event-aeon-frontend"
ENDSSH

echo ""
echo "✨ デプロイが完了しました！"
echo "📱 スマホで以下のURLにアクセス:"
echo "   http://${VPS_IP}:3000"
echo ""
echo "🔗 APIエンドポイント:"
echo "   http://${VPS_IP}:3001"
