
import { Connection, PublicKey, Transaction, Keypair } from "@solana/web3.js";
import { 
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAssociatedTokenAddress
} from "@solana/spl-token";
import { TOKEN_DECIMALS } from "../constants";

// Interface para o objeto da carteira (ex: Phantom)
export interface SolanaWallet {
  publicKey: PublicKey;
  signAndSendTransaction: (transaction: Transaction) => Promise<{ signature: string }>;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
}

declare global {
  interface Window {
    solana?: {
      isPhantom: boolean;
      connect: () => Promise<{ publicKey: PublicKey }>;
      signAndSendTransaction: (transaction: Transaction) => Promise<{ signature: string }>;
      signTransaction: (transaction: Transaction) => Promise<Transaction>;
    }
  }
}

/**
 * Gera uma nova carteira Solana (Keypair) para um aluno.
 * Retorna o endereço público e a chave secreta codificada em string.
 */
export const generateStudentWallet = () => {
  const keypair = Keypair.generate();
  return {
    publicKey: keypair.publicKey.toBase58(),
    // ATENÇÃO: Em produção real, isso deve ser criptografado ou não armazenado no client.
    // Como é um projeto educacional custodial, armazenamos para que o professor possa ajudar o aluno a recuperar.
    secretKey: `[${keypair.secretKey.toString()}]` 
  };
};

/**
 * Conecta a uma carteira Solana no navegador (Phantom).
 */
export const connectWallet = async (): Promise<SolanaWallet> => {
  const provider = window.solana;
  if (!provider || !provider.isPhantom) {
    throw new Error("Carteira Phantom não encontrada. Instale a extensão.");
  }
  await provider.connect();
  return provider as any; 
};

/**
 * Envia tokens SPL (LanguageCoin) para um aluno.
 */
export const sendTokenTransfer = async (
  connection: Connection,
  wallet: SolanaWallet,
  toAddress: string,
  amount: number,
  tokenMintAddress: string
) => {
  const fromPublicKey = wallet.publicKey;
  const toPublicKey = new PublicKey(toAddress);
  const mintPublicKey = new PublicKey(tokenMintAddress);

  const fromTokenAccountAddress = await getAssociatedTokenAddress(mintPublicKey, fromPublicKey);
  const toTokenAccountAddress = await getAssociatedTokenAddress(mintPublicKey, toPublicKey);
  
  const transaction = new Transaction();
  
  const toTokenAccountInfo = await connection.getAccountInfo(toTokenAccountAddress);
  if (toTokenAccountInfo === null) {
    transaction.add(
      createAssociatedTokenAccountInstruction(
        fromPublicKey,
        toTokenAccountAddress,
        toPublicKey,
        mintPublicKey
      )
    );
  }

  transaction.add(
    createTransferInstruction(
      fromTokenAccountAddress,
      toTokenAccountAddress,
      fromPublicKey,
      amount * Math.pow(10, TOKEN_DECIMALS)
    )
  );
  
  transaction.feePayer = fromPublicKey;
  transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  
  const { signature } = await wallet.signAndSendTransaction(transaction);
  await connection.confirmTransaction(signature, 'processed');

  return { success: true, hash: signature };
};

export const getTokenBalance = async (
  connection: Connection,
  walletAddress: string,
  tokenMintAddress: string
): Promise<string> => {
  try {
    const ownerPublicKey = new PublicKey(walletAddress);
    const mintPublicKey = new PublicKey(tokenMintAddress);
    
    const tokenAccountAddress = await getAssociatedTokenAddress(mintPublicKey, ownerPublicKey);
    const balance = await connection.getTokenAccountBalance(tokenAccountAddress);
    
    return balance.value.uiAmountString || "0.0";
  } catch (error) {
    return "0.0";
  }
};
