// MembershipVC コントラクトABI定義
export const MembershipVCABI = [
  "function issueMembership(bytes32 imageHash, address holder, uint256 expiresAt) external returns (bytes32)",
  "function verifyMembership(bytes32 credentialId, bytes32 imageHash) external view returns (bool)",
  "function getCredential(bytes32 credentialId) external view returns (tuple(bytes32 imageHash, address holder, address issuer, uint256 issuedAt, uint256 expiresAt, bool active))",
  "function isAuthorizedIssuer(address issuer) external view returns (bool)",
  "function revokeMembership(bytes32 credentialId) external",
  "function authorizeIssuer(address issuer) external",
  "function revokeIssuer(address issuer) external",
  "function isCredentialActive(bytes32 credentialId) external view returns (bool)",
  "event MembershipIssued(bytes32 indexed credentialId, address indexed holder, address indexed issuer)",
  "event MembershipRevoked(bytes32 indexed credentialId)",
  "event IssuerAuthorized(address indexed issuer)",
  "event IssuerRevoked(address indexed issuer)"
] as const;

// コントラクト関連の型定義
export interface MemberCredential {
  imageHash: string;
  holder: string;
  issuer: string;
  issuedAt: bigint;
  expiresAt: bigint;
  active: boolean;
}

// コントラクト設定
export const CONTRACT_CONFIG = {
  NETWORKS: {
    AMOY: {
      name: 'Polygon Amoy Testnet',
      rpcUrl: 'https://rpc-amoy.polygon.technology/',
      chainId: 80002
    }
  },
  DEFAULT_EXPIRY_DURATION: 365 * 24 * 60 * 60 // 1年（秒）
} as const;