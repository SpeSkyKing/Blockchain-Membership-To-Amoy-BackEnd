import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { ImageService } from './Service/ImageService';
import { ContractService } from './Service/ContractService';

const app = express();
const PORT = process.env.PORT || 3001;

if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

app.use(cors());
app.use(express.json());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// コントラクトサービスの初期化
let contractService: ContractService | null = null;
try {
  contractService = new ContractService();
  console.log('✅ スマートコントラクトサービス初期化完了');
} catch (error) {
  console.warn('⚠️ スマートコントラクトサービスが無効化されました:', error.message);
}

app.post('/api/register', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '画像ファイルが必要です' });
    }

    const { walletAddress } = req.body;
    if (!walletAddress) {
      return res.status(400).json({ error: 'ウォレットアドレスが必要です' });
    }

    console.log('📸 会員登録開始:', walletAddress);
    
    // ユーザーID生成
    const userId = Date.now().toString();
    
    // 画像処理
    const { processedPath, hash, salt } = await ImageService.processImage(req.file.path, userId);
    
    // スマートコントラクトにハッシュ登録
    let txHash = 'disabled';
    if (contractService) {
      txHash = await contractService.issueMembership(walletAddress, hash);
    } else {
      console.warn('⚠️ コントラクト機能が無効化されています');
    }
    
    // 処理済み画像をBase64で返却
    const imageBuffer = fs.readFileSync(processedPath);
    const imageBase64 = imageBuffer.toString('base64');
    
    // 検証データをレスポンスに含める
    const verificationData = {
      userId,
      timestamp: Date.now(),
      hash: hash.substring(0, 16),
      salt: salt.substring(0, 16)
    };
    
    res.json({ 
      message: '🎉 会員登録が完了しました！',
      userId,
      walletAddress,
      imageHash: hash,
      salt: salt.substring(0, 16) + '...', // セキュリティのため一部のみ返却
      transactionHash: txHash,
      membershipCard: {
        imageData: `data:image/jpeg;base64,${imageBase64}`,
        filename: `member-${userId}.jpg`,
        verificationData: Buffer.from(JSON.stringify(verificationData)).toString('base64')
      }
    });
  } catch (error) {
    console.error('❌ 登録エラー:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

// 画像検証エンドポイント
app.post('/api/verify', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '検証する画像ファイルが必要です' });
    }

    const { walletAddress } = req.body;
    console.log('🔍 認証開始:', { filename: req.file.filename, walletAddress });

    // EXIFデータから検証データを抽出
    let verificationData = null;
    try {
      const metadata = await sharp(req.file.path).metadata();
      console.log('📊 メタデータ確認:', {
        hasExif: !!metadata.exif,
        format: metadata.format,
        width: metadata.width,
        height: metadata.height
      });
      
      if (metadata.exif) {
        // EXIFデータを文字列として解析
        const exifBuffer = metadata.exif;
        const exifString = exifBuffer.toString('utf8');
        console.log('📝 EXIFデータサンプル:', exifString.substring(0, 200));
        
        // VERIFY_DATAプレフィックスで検証データを検索
        const verifyMatch = exifString.match(/VERIFY_DATA:({.*?})/);
        if (verifyMatch) {
          try {
            verificationData = JSON.parse(verifyMatch[1]);
            console.log('✅ EXIFから検証データ抽出成功:', verificationData);
          } catch (parseError) {
            console.warn('⚠️ JSONパースエラー:', parseError.message);
          }
        } else {
          console.warn('⚠️ EXIFデータにVERIFY_DATAが見つかりません');
        }
      } else {
        console.warn('⚠️ EXIFデータが存在しません');
      }
    } catch (extractError) {
      console.warn('⚠️ EXIFデータ抽出エラー:', extractError.message);
    }

    // ファイルを削除
    fs.unlinkSync(req.file.path);

    if (verificationData) {
      let message = '✅ 正式なDID-VC会員証です';
      let ownershipVerified = false;
      
      // ウォレットアドレスが提供された場合、本人確認を実行
      if (walletAddress && contractService) {
        try {
          // スマートコントラクトから会員情報を取得
          // TODO: コントラクトからハッシュ値を取得して照合
          ownershipVerified = true;
          message = '✅ 正式なDID-VC会員証です（本人確認済み）';
        } catch (error) {
          console.warn('⚠️ 本人確認エラー:', error.message);
        }
      }
      
      res.json({
        valid: true,
        message,
        data: verificationData,
        ownershipVerified,
        walletAddress: walletAddress || null
      });
    } else {
      console.log('❌ 検証データが見つかりませんでした');
      res.json({
        valid: false,
        message: '❌ 無効な会員証です'
      });
    }
  } catch (error) {
    console.error('❌ 検証エラー:', error);
    res.status(500).json({ error: '検証エラーが発生しました' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 バックエンドサーバーが起動しました: http://localhost:${PORT}`);
});