# Mifareカード読み取り・データベース保存システム

PaSoRi 4.0を使用してMifareカードの番号を読み取り、SQLiteデータベースに保存するシステムです。

Node.jsとPC/SCを使用して実装されています。

## 必要な環境

- Node.js 14.0以上
- npm または yarn
- PaSoRi 4.0（FeliCa Port/PaSoRi 4.0）
- macOS、Linux、またはWindows

## インストール

1. **Node.jsをインストール**（まだインストールされていない場合）:

macOSの場合：
```bash
brew install node
```

または、[Node.js公式サイト](https://nodejs.org/)からダウンロード

2. **必要なパッケージをインストール**:

```bash
npm install
```

3. **PC/SCライブラリのインストール**（macOSの場合）:

```bash
brew install pcsc-lite
```

Linux（Ubuntu/Debian）の場合：
```bash
sudo apt-get install libpcsclite-dev pcscd
```

## 使用方法

1. PaSoRiリーダーをUSBポートに接続します

2. PC/SCサービスを起動（macOSの場合、通常は自動起動）:
```bash
# サービスが起動しているか確認
brew services list | grep pcsc
```

3. アプリケーションを起動します：

```bash
npm start
```

または

```bash
node main.js
```

4. メニューから操作を選択します：

   - **1**: カードを1回読み取る
   - **2**: 連続してカードを読み取る（Ctrl+Cで終了）
   - **3**: データベース内のカード一覧を表示
   - **4**: 終了

## データベース

カード情報は `cards.db` というSQLiteデータベースファイルに保存されます。

### データベーススキーマ

- `id`: 主キー（自動増分）
- `card_id`: カードのID（16進数文字列、ユニーク）
- `card_type`: カードのタイプ（Mifare、FeliCaなど）
- `read_at`: 読み取り日時
- `created_at`: 登録日時

## トラブルシューティング

### npm installの権限エラー

`EPERM: operation not permitted`エラーが発生する場合：

1. **システム環境設定で権限を確認**:
   - システム環境設定 > セキュリティとプライバシー > プライバシー
   - 「完全なディスクアクセス」にターミナルアプリを追加
   - ターミナルを再起動

2. **npmキャッシュをクリア**:
   ```bash
   npm cache clean --force
   npm install
   ```

3. **詳細は `権限設定ガイド.md` を参照してください**

### PC/SCサービスが起動していない場合

macOSの場合：
```bash
brew services start pcsc-lite
```

Linuxの場合：
```bash
sudo systemctl start pcscd
sudo systemctl enable pcscd
```

### リーダーが検出されない場合

1. PaSoRiリーダーが正しく接続されているか確認してください
2. PC/SCサービスが起動しているか確認してください
3. リーダーが他のアプリケーションで使用されていないか確認してください
4. リーダーを一度抜いて再度接続してみてください

### カードが読み取れない場合

1. カードがリーダーに正しく近づけられているか確認してください
2. カードの種類（Mifare、FeliCa）を確認してください
3. リーダーのLEDが点灯しているか確認してください

## ファイル構成

- `main.js`: メインアプリケーション
- `card_reader.js`: カード読み取り機能
- `database.js`: データベース操作機能
- `package.json`: Node.jsパッケージ設定
- `cards.db`: データベースファイル（自動生成）

## ドキュメント

- `README_NODEJS.md`: 詳細な使用方法
- `実装まとめ.md`: 実装の詳細と経緯
- `実行環境.md`: 動作確認済みの環境情報
- `読み取りデータ形式.md`: 読み取り可能なデータ形式
- `データベース仕様書.md`: データベースの詳細仕様
- `権限設定ガイド.md`: macOSでの権限設定方法
