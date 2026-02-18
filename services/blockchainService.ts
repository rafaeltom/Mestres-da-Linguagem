
// Mock implementation for development/demo purposes as blockchain features are optional
export const generateStudentWallet = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let publicKey = '';
  for (let i = 0; i < 44; i++) {
    publicKey += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return {
    publicKey: publicKey,
    secretKey: 'mock_secret_key_' + Date.now()
  };
};
