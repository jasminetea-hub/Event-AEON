# 🔧 フロントエンドサーバーが起動しない問題の修正

## 問題

ポート3000に接続できない = フロントエンドサーバーが起動していない

`npm run preview`は事前にビルドされたファイルが必要です。

---

## 解決方法

### ステップ1: ビルドファイルの存在を確認

VPSサーバーで以下を実行：

```bash
cd ~/Event-AEON

# distディレクトリが存在するか確認
ls -la dist/

# 存在しない場合は、ビルドが必要
```

---

### ステップ2: フロントエンドをビルド

```bash
cd ~/Event-AEON

# フロントエンドをビルド
npm run build

# ビルドが成功したか確認
ls -la dist/
```

---

### ステップ3: フロントエンドプロセスを再起動

```bash
# 既存のフロントエンドプロセスを削除
pm2 delete event-aeon-frontend

# フロントエンドを再起動
pm2 start npm --name "event-aeon-frontend" -- run preview

# 設定を保存
pm2 save

# 状態を確認
pm2 status
```

---

### ステップ4: ログを確認

```bash
# フロントエンドのログを確認
pm2 logs event-aeon-frontend --lines 30

# Viteが正常に起動しているか確認
# 以下のようなメッセージが見られるはず：
# VITE v5.x.x  ready in XXX ms
# ➜  Local:   http://localhost:3000/
# ➜  Network: http://0.0.0.0:3000/
```

---

### ステップ5: 接続確認

```bash
# ローカルからアクセス
curl -I http://localhost:3000

# 成功するはずです
```

---

## 完全な再セットアップ（推奨）

```bash
cd ~/Event-AEON

# 1. すべてのフロントエンドプロセスを停止・削除
pm2 stop event-aeon-frontend
pm2 delete event-aeon-frontend

# 2. 最新のコードを取得（念のため）
git pull origin main

# 3. 依存関係をインストール（念のため）
npm install

# 4. フロントエンドをビルド
echo "🏗️ フロントエンドをビルド中..."
npm run build

# 5. ビルドが成功したか確認
if [ -d "dist" ]; then
    echo "✅ ビルドが成功しました"
    ls -la dist/ | head -5
else
    echo "❌ ビルドが失敗しました"
    exit 1
fi

# 6. フロントエンドを起動
echo "🚀 フロントエンドを起動中..."
pm2 start npm --name "event-aeon-frontend" -- run preview

# 7. 設定を保存
pm2 save

# 8. 状態を確認
pm2 status

# 9. ログを確認
echo "📝 ログを確認..."
pm2 logs event-aeon-frontend --lines 20 --nostream | grep -E "(VITE|Local|Network|ready|error)" | head -10

# 10. 接続テスト
echo "🔍 接続テスト..."
sleep 3
curl -I http://localhost:3000
```

---

## 期待される結果

### ビルド後

```bash
ls -la dist/
# index.html やアセットファイルが見えるはず
```

### PM2ログ

```
VITE v5.x.x  ready in XXX ms
➜  Local:   http://localhost:3000/
➜  Network: http://0.0.0.0:3000/
```

### curl テスト

```bash
curl -I http://localhost:3000
# HTTP/1.1 200 OK のような応答が返ってくるはず
```

---

## トラブルシューティング

### ビルドエラーが出る場合

```bash
# npmキャッシュをクリア
npm cache clean --force

# 依存関係を再インストール
rm -rf node_modules
npm install

# 再度ビルド
npm run build
```

### ビルドは成功したが、previewが起動しない場合

```bash
# 手動で起動してエラーを確認
cd ~/Event-AEON
npm run preview

# エラーメッセージを確認
```
