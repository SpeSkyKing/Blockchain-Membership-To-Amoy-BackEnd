import { ethers } from 'ethers';
import { MembershipVCABI, CONTRACT_CONFIG, MemberCredential } from '../ABI';

export class ContractService {
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;
  private wallet: ethers.Wallet;

  constructor() {
    // Amoy テストネット設定
    this.provider = new ethers.JsonRpcProvider(CONTRACT_CONFIG.NETWORKS.AMOY.rpcUrl);
    
    // 環境変数から秘密鍵とコントラクトアドレスを取得
    const privateKey = process.env.PRIVATE_KEY;
    const contractAddress = process.env.CONTRACT_ADDRESS;
    
    if (!privateKey || privateKey === 'your_private_key_here') {
      throw new Error('❌ PRIVATE_KEY が設定されていません。.env ファイルを確認してください。');
    }
    
    if (!contractAddress || contractAddress === 'your_contract_address_here') {
      throw new Error('❌ CONTRACT_ADDRESS が設定されていません。.env ファイルを確認してください。');
    }
    
    try {
      this.wallet = new ethers.Wallet(privateKey, this.provider);
    } catch (error) {
      throw new Error('❌ 無効なプライベートキーです。正しい形式で設定してください。');
    }
    
    try {
      this.contract = new ethers.Contract(contractAddress, MembershipVCABI, this.wallet);
      console.log('✅ コントラクト初期化完了:', contractAddress);
    } catch (error) {
      console.error('❌ コントラクト初期化エラー:', error.message);
      throw new Error(`コントラクトの初期化に失敗しました: ${error.message}`);
    }
  }

  async issueMembership(memberAddress: string, imageHash: string): Promise<string> {
    try {
      const imageHashBytes32 = ethers.keccak256(ethers.toUtf8Bytes(imageHash));
      const expiresAt = Math.floor(Date.now() / 1000) + CONTRACT_CONFIG.DEFAULT_EXPIRY_DURATION;
      
      // 発行者権限確認
      const isAuthorized = await this.contract.isAuthorizedIssuer(this.wallet.address);
      if (!isAuthorized) {
        throw new Error('発行者権限がありません');
      }
      
      const tx = await this.contract.issueMembership(imageHashBytes32, memberAddress, expiresAt);
      const receipt = await tx.wait();
      
      console.log('✅ 会員証発行完了:', receipt.hash);
      return receipt.hash;
    } catch (error) {
      console.error('❌ 会員証発行エラー:', error.message);
      throw error;
    }
  }

  async verifyMembership(credentialId: string, imageHash: string): Promise<boolean> {
    try {
      const credentialIdBytes32 = ethers.keccak256(ethers.toUtf8Bytes(credentialId));
      const imageHashBytes32 = ethers.keccak256(ethers.toUtf8Bytes(imageHash));
      return await this.contract.verifyMembership(credentialIdBytes32, imageHashBytes32);
    } catch (error) {
      console.error('❌ 認証エラー:', error.message);
      return false;
    }
  }

  async isAuthorizedIssuer(issuerAddress: string): Promise<boolean> {
    try {
      return await this.contract.isAuthorizedIssuer(issuerAddress);
    } catch (error) {
      console.error('❌ 発行者確認エラー:', error.message);
      return false;
    }
  }

  async getCredential(credentialId: string): Promise<MemberCredential | null> {
    try {
      const credentialIdBytes32 = ethers.keccak256(ethers.toUtf8Bytes(credentialId));
      const result = await this.contract.getCredential(credentialIdBytes32);
      
      return {
        imageHash: result.imageHash,
        holder: result.holder,
        issuer: result.issuer,
        issuedAt: result.issuedAt,
        expiresAt: result.expiresAt,
        active: result.active
      };
    } catch (error) {
      console.error('❌ 会員証取得エラー:', error.message);
      return null;
    }
  }

  async isCredentialActive(credentialId: string): Promise<boolean> {
    try {
      const credentialIdBytes32 = ethers.keccak256(ethers.toUtf8Bytes(credentialId));
      return await this.contract.isCredentialActive(credentialIdBytes32);
    } catch (error) {
      console.error('❌ 会員証有効性確認エラー:', error.message);
      return false;
    }
  }
}