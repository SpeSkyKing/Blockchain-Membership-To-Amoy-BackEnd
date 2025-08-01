# Blockchain Membership System - Backend

Node.js + Express + TypeScript で構築されたブロックチェーン会員証システムのバックエンド

## 🚀 機能

- 📸 **画像処理**: Sharp による画像リサイズ・透かし処理
- 🏷️ **EXIFメタデータ**: 検証データの埋め込み・抽出
- ⛓️ **ブロックチェーン連携**: ethers.js によるスマートコントラクト操作
- 🔐 **セキュリティ**: ソルト付きハッシュ・一時ファイル削除

## 🛠️ 技術スタック

- **Runtime**: Node.js + Express
- **Language**: TypeScript
- **Image Processing**: Sharp
- **Blockchain**: ethers.js v6
- **Network**: Polygon Amoy Testnet

## 🔧 セットアップ

### 環境変数 (.env)
```bash
PRIVATE_KEY=your_wallet_private_key_here
CONTRACT_ADDRESS=deployed_contract_address_here
PORT=3001
```

### インストール・起動
```bash
cd app
npm install
npm run dev
```

### ビルド
```bash
npm run build
npm start
```

## 📦 プロジェクト構造

```
app/
├── src/
│   ├── ABI/
│   │   ├── index.ts              # ABI・型定義
│   │   └── MembershipVC.json     # コントラクトABI
│   ├── Service/
│   │   ├── ContractService.ts    # ブロックチェーン連携
│   │   └── ImageService.ts       # 画像処理
│   └── index.ts                  # Express サーバー
├── uploads/                      # 一時アップロードフォルダ
├── package.json
└── tsconfig.json
```

## 🔗 API エンドポイント

### POST /api/register
会員証発行
```bash
curl -X POST http://localhost:3001/api/register \
  -F "image=@photo.jpg" \
  -F "walletAddress=0x..."
```

### POST /api/verify
会員証認証
```bash
curl -X POST http://localhost:3001/api/verify \
  -F "image=@membership.jpg" \
  -F "walletAddress=0x..."
```

## 🔐 セキュリティ機能

- **EXIFメタデータ**: 改ざん検知
- **ソルト付きハッシュ**: レインボーテーブル攻撃対策
- **一時ファイル削除**: プライバシー保護
- **発行者権限**: スマートコントラクト認証

## 🌐 デプロイ

### Docker
```bash
docker build -t blockchain-membership-backend .
docker run -p 3001:3001 blockchain-membership-backend
```

### PM2
```bash
npm run build
pm2 start dist/index.js --name blockchain-membership-backend
```# Blockchain-Membership-To-Amoy-BackEnd
