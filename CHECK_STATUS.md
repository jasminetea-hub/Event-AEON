# 🔍 サーバー状態確認手順

## 現在の状態

ログを見ると、サーバーは起動している可能性があります。確認してください。

---

## 確認手順

### ステップ1: PM2の状態を確認

```bash
pm2 status
```

**期待される結果**：
- `event-aeon-api` が `online` 状態
- `event-aeon-frontend` が `online` 状態

---

### ステップ2: ポート3001が使用されているか確認

```bash
sudo lsof -i :3001
```

または

```bash
sudo netstat -tlnp | grep 3001
```

---

### ステップ3: APIサーバーにアクセスできるか確認

```bash
# ローカルから確認
curl http://localhost:3001/

# または、ブラウザで以下にアクセス
# http://160.16.92.115:3001
```

---

### ステップ4: 最新のログを確認

```bash
# 最新のログを確認（エラーがないか）
pm2 logs event-aeon-api --lines 10 --nostream
```

---

## もしサーバーが正常に起動している場合

以下のURLでアクセスできます：
- **スマホアプリ**: `http://160.16.92.115:3000`
- **API**: `http://160.16.92.115:3001`

---

## まだエラーが出る場合

### クリーンな再起動

```bash
# すべてのプロセスを停止・削除
pm2 stop all
pm2 delete all

# ポート3001を使用しているプロセスを確認
sudo lsof -i :3001

# もし他のプロセスが使用している場合は終了
# sudo kill -9 <PID>

# プロジェクトディレクトリに移動
cd ~/Event-AEON

# バックエンドAPIを起動
pm2 start server/index.js --name "event-aeon-api"

# フロントエンドを起動
pm2 start npm --name "event-aeon-frontend" -- run preview

# 設定を保存
pm2 save

# 状態を確認
pm2 status
```
