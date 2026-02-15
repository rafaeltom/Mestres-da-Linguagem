
export const COLORS = {
  primary: '#4f46e5',
  secondary: '#10b981',
  background: '#0f172a',
  surface: '#1e293b',
};

export const TOKEN_NAME = 'LanguageCoin';
export const TOKEN_SYMBOL = 'LC';
export const TOKEN_DECIMALS = 6; // pump.fun coins typically have 6 decimals

export type NetworkName = 'mainnet-beta' | 'devnet';

export const SOLANA_NETWORKS: Record<NetworkName, {
  name: NetworkName;
  url: string;
  tokenMintAddress: string;
  explorerUrl: string;
}> = {
  'mainnet-beta': {
    name: 'mainnet-beta',
    url: 'https://api.mainnet-beta.solana.com',
    tokenMintAddress: 'EQHHb2w4eDbjkiPhPFRrGzC7aU8bBNBqBWXDkDhEpump', // Sua moeda real
    explorerUrl: 'https://solscan.io',
  },
  devnet: {
    name: 'devnet',
    url: 'https://api.devnet.solana.com',
    // Endereço de um token de exemplo na Devnet. Você pode criar o seu facilmente.
    tokenMintAddress: 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr',
    explorerUrl: 'https://solscan.io',
  }
};
