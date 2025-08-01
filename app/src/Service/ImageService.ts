import sharp from 'sharp';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

export class ImageService {
  static async processImage(imagePath: string, userId: string): Promise<{ processedPath: string; hash: string; salt: string }> {
    try {
      // ソルト生成（ユーザーID + タイムスタンプ + ランダム値）
      const salt = crypto.createHash('sha256')
        .update(userId + Date.now().toString() + Math.random().toString())
        .digest('hex');
      
      // 元画像からソルトを含めたハッシュ値計算
      const originalImageBuffer = fs.readFileSync(imagePath);
      const hash = crypto.createHash('sha256')
        .update(originalImageBuffer)
        .update(salt)
        .digest('hex');
      


      // 照合用メタデータを作成
      const verificationData = {
        userId,
        timestamp: Date.now(),
        hash: hash.substring(0, 16), // ハッシュの一部
        salt: salt.substring(0, 16)   // ソルトの一部
      };
      
      // 検証データを画像の右下に目立たない形で埋め込み
      const verificationText = JSON.stringify(verificationData);
      const hiddenDataSvg = `
        <svg width="400" height="400">
          <rect x="350" y="350" width="50" height="50" fill="white" opacity="0.01"/>
          <text x="355" y="365" font-family="monospace" font-size="3" fill="rgba(0,0,0,0.05)">${verificationText}</text>
        </svg>
      `;



      // 透かし画像作成
      const watermarkText = '🏆 DID-VC会員証 🏆';
      const watermarkSvg = `
        <svg width="200" height="50">
          <text x="100" y="25" font-family="Arial" font-size="16" fill="rgba(255,192,203,0.7)" text-anchor="middle">${watermarkText}</text>
        </svg>
      `;

      // シンプルなファイル名
      const processedPath = imagePath.replace('.', '-processed.');
      await sharp(imagePath)
        .resize(400, 400, { fit: 'cover' })
        .composite([
          { input: Buffer.from(watermarkSvg), top: 10, left: 100 },
          { input: Buffer.from(hiddenDataSvg), top: 0, left: 0 } // 検証データを右下に埋め込み
        ])
        .withMetadata({
          exif: {
            IFD0: {
              ImageDescription: `VERIFY_DATA:${JSON.stringify(verificationData)}`,
              Software: 'DID-VC-Membership-System',
              Artist: 'DID-VC-System'
            }
          }
        })
        .jpeg({ quality: 90 })
        .toFile(processedPath);
      
      console.log('✅ 画像処理完了');

      // 元画像を削除（セキュリティ対策）
      try {
        fs.unlinkSync(imagePath);
      } catch (deleteError) {
        console.warn('⚠️ 元画像削除エラー:', deleteError.message);
      }

      // 処理済み画像も30分後に削除
      setTimeout(() => {
        if (fs.existsSync(processedPath)) {
          fs.unlinkSync(processedPath);
        }
      }, 30 * 60 * 1000); // 30分
      return { processedPath, hash, salt };
    } catch (error) {
      console.error('❌ 画像処理エラー:', error);
      throw error;
    }
  }
}