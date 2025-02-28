import dotenv from "dotenv";
import bs58 from "bs58";
import * as anchor from "@coral-xyz/anchor";
import * as spl from "@solana/spl-token";
import { Connection, PublicKey, Keypair, Transaction, clusterApiUrl, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import TokenMillIDL from "../idl/token_mill.json";
import BN from "bn.js";
import {
  TokenParams,
  StakingParams,
  VestingParams,
  TokenMillResponse,
  SwapParams,
  TokenMetadata,
  SwapAmounts,
} from "../types/interfaces";
import { TokenMillType } from "../idl/token_mill";
import axios from "axios";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAccount,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction
} from '@solana/spl-token';


// Initialize dotenv
dotenv.config();

// Cast the imported IDL to the correct type
const idl = TokenMillIDL as unknown as TokenMillType;

/**
 * Parameters for releasing vested tokens
 */
interface ReleaseVestingParams {
  marketAddress: string;
  stakingAddress: string;
  stakePositionAddress: string;
  vestingPlanAddress: string;
  baseTokenMint: string;
}

/**
 * Response data for vesting creation
 */
interface CreateVestingResponse {
  vestingAccount: string;
  signature: string;
}

/**
 * Response data for vesting release
 */
interface ReleaseVestingResponse {
  signature: string;
}

/**
 * Client for interacting with the TokenMill program on Solana.
 * Handles token creation, market management, staking, and vesting functionality.
 */
export class TokenMillClient {
  connection: anchor.web3.Connection;
  wallet: anchor.web3.Keypair;
  program: anchor.Program<TokenMillType>;
  config: PublicKey = new PublicKey(process.env.TOKEN_MILL_CONFIG_PDA!);

  /**
   * Initializes a new TokenMillClient instance.
   * Requires RPC_URL and WALLET_PRIVATE_KEY environment variables to be set.
   */
  constructor() {
    this.connection = new Connection(process.env.RPC_URL!);

    // Initialize wallet from private key
    const privateKey = bs58.decode(process.env.WALLET_PRIVATE_KEY!);
    this.wallet = Keypair.fromSecretKey(privateKey);

    const provider = new anchor.AnchorProvider(
      this.connection,
      new anchor.Wallet(this.wallet),
      anchor.AnchorProvider.defaultOptions()
    );

    // Initialize program
    this.program = new anchor.Program<TokenMillType>(
      idl as TokenMillType,
      provider
    );
  }

  /**
   * Creates a new TokenMill configuration.
   * @param authority - The authority address that can manage the config
   * @param protocolFeeRecipient - Address to receive protocol fees
   * @param protocolFeeShare - Percentage of fees allocated to protocol
   * @param referralFeeShare - Percentage of fees allocated to referrals
   */
  async createConfig(
    authority: PublicKey,
    protocolFeeRecipient: PublicKey,
    protocolFeeShare: number,
    referralFeeShare: number
  ) {
    try {
      const config = Keypair.generate();

      const tx = await this.program.methods
        .createConfig(
          authority,
          protocolFeeRecipient,
          protocolFeeShare,
          referralFeeShare
        )
        .accountsPartial({
          config: config.publicKey,
          payer: this.wallet.publicKey,
        })
        .signers([config])
        .rpc();

      console.log("Config created:", config.publicKey.toString());
      this.config = config.publicKey;
    } catch (error) {
      console.error("Error creating config:", error);
    }
  }

  /**
   * Creates a quote token badge for wSOL.
   * @param params - Parameters for badge creation (currently unused)
   */
  async getTokenBadge(params: any) {
    const wSol = new PublicKey("So11111111111111111111111111111111111111112");
    const wSolAccount = await this.connection.getAccountInfo(wSol);

    const transaction = await this.program.methods
      .createQuoteAssetBadge()
      .accountsPartial({
        config: this.config,
        tokenMint: wSol,
        authority: this.wallet.publicKey,
      })
      .signers([this.wallet])
      .transaction();
    const transactionSignature = await this.connection.sendTransaction(
      transaction,
      [this.wallet]
    );

    await this.connection.confirmTransaction(transactionSignature);

    console.log("wSol quote token badge created", wSolAccount);
  }

  /**
   * Creates a new market for token trading.
   * @param params - Market creation parameters including:
   *   - name: Token name
   *   - symbol: Token symbol
   *   - uri: Metadata URI
   *   - totalSupply: Total token supply
   *   - creatorFeeShare: Percentage of fees for creator
   *   - stakingFeeShare: Percentage of fees for staking
   *   - quoteTokenMint: Address of quote token mint
   * @returns Object containing market address, base token mint, and transaction signature
   */
  async lockMarket(market: PublicKey, swapAuthority: PublicKey) {
    try {
      const transaction = await this.program.methods
        .lockMarket(swapAuthority)
        .accountsPartial({
          market,
          creator: this.wallet.publicKey,
        })
        .signers([this.wallet])
        .transaction();

      const transactionSignature = await this.connection.sendTransaction(
        transaction,
        [this.wallet]
      );

      const result = await this.connection.confirmTransaction(
        transactionSignature
      );

      if (result.value.err) {
        console.log("Market lock failed:", result.value.err);
        throw new Error(`Market lock failed: ${result.value.err}`);
      }

      console.log(
        "Market locked successfully with authority:",
        swapAuthority.toString()
      );
      return transactionSignature;
    } catch (error: any) {
      console.error("Error locking market:", error);
      throw error;
    }
  }

  async buildCreateMarketTx(params: any) {
    const { name, symbol, uri, totalSupply, creatorFeeShare, stakingFeeShare, userPublicKey } = params;
    console.log("[buildCreateMarketTx] Received parameters:", params);
  
    const userPubkey = new PublicKey(userPublicKey);
    console.log("[buildCreateMarketTx] Using user public key:", userPubkey.toString());
  
    // 1) Generate a new keypair for the base token mint (server generated)
    const baseTokenMint = anchor.web3.Keypair.generate();
    console.log("[buildCreateMarketTx] Generated base token mint:", baseTokenMint.publicKey.toString());
  
    // Only wSOL is currently supported as quote token
    const quoteTokenMint = new PublicKey("So11111111111111111111111111111111111111112");
    console.log("[buildCreateMarketTx] Using quote token mint:", quoteTokenMint.toString());
  
    // 2) Derive PDAs for quote token badge and market
    const quoteTokenBadge = PublicKey.findProgramAddressSync(
      [
        Buffer.from("quote_token_badge"),
        this.config.toBuffer(),
        quoteTokenMint.toBuffer(),
      ],
      this.program.programId
    )[0];
    console.log("[buildCreateMarketTx] Derived quote token badge PDA:", quoteTokenBadge.toString());
  
    const market = PublicKey.findProgramAddressSync(
      [Buffer.from("market"), baseTokenMint.publicKey.toBuffer()],
      this.program.programId
    )[0];
    console.log("[buildCreateMarketTx] Derived market PDA:", market.toString());
  
    const marketBaseTokenAta = spl.getAssociatedTokenAddressSync(
      baseTokenMint.publicKey,
      market,
      true
    );
    console.log("[buildCreateMarketTx] Derived market base token ATA:", marketBaseTokenAta.toString());
  
    const metaplexProgramId = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
    const baseTokenMetadata = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        metaplexProgramId.toBuffer(),
        baseTokenMint.publicKey.toBuffer(),
      ],
      metaplexProgramId
    )[0];
    console.log("[buildCreateMarketTx] Derived base token metadata PDA:", baseTokenMetadata.toString());
  
    // 3) Build the instruction using Anchor’s builder—but do NOT call .rpc()
    console.log("[buildCreateMarketTx] Building transaction instruction...");
    let tx: Transaction = await this.program.methods
      .createMarketWithSpl(
        name,
        symbol,
        uri,
        new BN(totalSupply * 10 ** 6),
        creatorFeeShare,
        stakingFeeShare
      )
      .accountsPartial({
        config: this.config,
        market: market,
        baseTokenMint: baseTokenMint.publicKey,
        baseTokenMetadata: baseTokenMetadata,
        marketBaseTokenAta: marketBaseTokenAta,
        quoteTokenMint: quoteTokenMint,
        quoteTokenBadge: quoteTokenBadge,
        creator: userPubkey, // user is the creator
      })
      .signers([baseTokenMint])
      .transaction();
    console.log("[buildCreateMarketTx] Transaction instruction built.");
  
    // 4) Set blockhash & fee payer with fallback if needed
    let blockhash: string;
    try {
      ({ blockhash } = await this.connection.getLatestBlockhash());
    } catch (err) {
      console.error("Error getting blockhash from primary RPC:", err);
      console.log("Falling back to clusterApiUrl('devnet')...");
      const fallbackConnection = new Connection(clusterApiUrl('devnet'));
      ({ blockhash } = await fallbackConnection.getLatestBlockhash());
    }
    tx.recentBlockhash = blockhash;
    tx.feePayer = userPubkey;
    console.log("[buildCreateMarketTx] Set fee payer and blockhash.");
  
    // 5) Manually partial-sign with the ephemeral mint key
    tx.sign(baseTokenMint);
    console.log("[buildCreateMarketTx] Partially signed with base token mint key.");
  
    // 6) Serialize the entire transaction (with partial signature) and convert to base64
    const serializedTx = tx.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });
    const base64Tx = serializedTx.toString("base64");
    console.log("[buildCreateMarketTx] Final serialized transaction (base64):", base64Tx);
  
    return {
      success: true,
      transaction: base64Tx,
      marketAddress: market.toString(),
      baseTokenMint: baseTokenMint.publicKey.toString(),
    };
  }
  
  

  async createMarket(params: any) {
    const { name, symbol, uri, totalSupply, creatorFeeShare, stakingFeeShare } =
      params;

    console.log("Wallet:", this.wallet.publicKey.toString());

    // Only wSOL is currently supported as quote token
    // So11111111111111111111111111111111111111112
    const quoteTokenMint = new PublicKey(
      "So11111111111111111111111111111111111111112"
    );

    try {
      const baseTokenMint = Keypair.generate();

      const quoteTokenBadge = PublicKey.findProgramAddressSync(
        [
          Buffer.from("quote_token_badge"),
          this.config.toBuffer(),
          new PublicKey(quoteTokenMint).toBuffer(),
        ],
        this.program.programId
      )[0];

      const market = PublicKey.findProgramAddressSync(
        [Buffer.from("market"), baseTokenMint.publicKey.toBuffer()],
        this.program.programId
      )[0];

      console.log("Market:", market.toString());
      console.log("Base Token Mint:", baseTokenMint.publicKey.toString());
      console.log("Quote Token Badge:", quoteTokenBadge.toString());

      // Creating the market requires providing its base token ATA
      // As the whole token supply is minted and sent to the market account
      const marketBaseTokenAta = spl.getAssociatedTokenAddressSync(
        baseTokenMint.publicKey,
        market,
        true
      );

      const metaplexProgramId = new PublicKey(
        "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
      );

      const baseTokenMetadata = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          metaplexProgramId.toBuffer(),
          baseTokenMint.publicKey.toBuffer(),
        ],
        metaplexProgramId
      )[0];

      const tx = await this.program.methods
        .createMarketWithSpl(
          name,
          symbol,
          uri,
          new anchor.BN(totalSupply * 10 ** 6),
          creatorFeeShare,
          stakingFeeShare
        )
        .accountsPartial({
          config: this.config,
          market: market,
          baseTokenMint: baseTokenMint.publicKey,
          baseTokenMetadata: baseTokenMetadata,
          marketBaseTokenAta: marketBaseTokenAta,
          quoteTokenMint: new PublicKey(quoteTokenMint),
          quoteTokenBadge: quoteTokenBadge,
          creator: this.wallet.publicKey,
        })
        .signers([baseTokenMint, this.wallet])
        .rpc({
          commitment: "finalized",
        });

      console.log("Market created:", market.toString());

      const swapAuthority = Keypair.fromSecretKey(
        bs58.decode(process.env.SWAP_AUTHORITY_KEY!)
      );

      const swapAuthorityBadge = PublicKey.findProgramAddressSync(
        [
          Buffer.from("swap_authority"),
          market.toBuffer(),
          swapAuthority.publicKey.toBuffer(),
        ],
        this.program.programId
      )[0];

      const lockTX = await this.program.methods
        .lockMarket(swapAuthority.publicKey)
        .accountsPartial({
          market: market,
          swapAuthorityBadge: swapAuthorityBadge,
          creator: this.wallet.publicKey,
        })
        .signers([this.wallet])
        .transaction();

      const lockSignature = await this.connection.sendTransaction(lockTX, [
        this.wallet,
      ]);

      const lockResult = await this.connection.confirmTransaction(
        lockSignature
      );

      if (lockResult.value.err) {
        console.log("Market lock failed:", lockResult.value.err);
        throw new Error(`Market lock failed: ${lockResult.value.err}`);
      }

      console.log(
        "Market locked successfully with authority:",
        swapAuthority.publicKey.toString()
      );
      console.log(baseTokenMint.publicKey);

      await this.setPrices(market);

      return {
        success: true,
        marketAddress: market.toString(),
        baseTokenMint: baseTokenMint.publicKey.toString(),
        signature: tx,
      };
    } catch (error: any) {
      console.error("Error creating market:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Sets the prices for a market.
   * @param market - The market to set prices for
   */
  async setPrices(market: PublicKey) {
    const askPrices: BN[] = [
      new BN(28), // 2.8e-8
      new BN(29), // 2.9e-8
      new BN(32), // 3.2e-8
      new BN(47), // 4.7e-8
      new BN(110), // 1.1e-7
      new BN(380), // 3.8e-7
      new BN(1500), // 1.5e-6
      new BN(6400), // 6.4e-6
      new BN(27000), // 2.7e-5
      new BN(120000), // 1.2e-4
      new BN(500000), // 5e-4
    ];

    const bidPrices: BN[] = askPrices.map((price) => price.muln(99).divn(100));

    const transaction = await this.program.methods
      .setMarketPrices(bidPrices, askPrices)
      .accountsPartial({
        market: market,
        creator: this.wallet.publicKey,
      })
      .signers([this.wallet])
      .transaction();

    const transactionSignature = await this.connection.sendTransaction(
      transaction,
      [this.wallet]
    );

    const result = await this.connection.confirmTransaction(
      transactionSignature
    );

    console.log("Prices set successfully");

    if (result.value.err) {
      console.log("Set prices failed:", result.value.err);
      process.exit(1);
    }
  }
  

  /**
   * Creates a new token with associated market.
   * @param params - Token creation parameters including:
   *   - name: Token name
   *   - symbol: Token symbol
   *   - uri: Metadata URI
   *   - totalSupply: Total token supply
   *   - recipient: Token recipient address
   *   - creatorFeeShare: Percentage of fees for creator
   *   - stakingFeeShare: Percentage of fees for staking
   *   - quoteTokenMint: Address of quote token mint
   * @returns TokenMillResponse containing market address, base token mint, and transaction signatures
   */
  async createToken(): Promise<
    TokenMillResponse<{
      mint: string;
      mintSignature: string;
    }>
  > {
    try {
      const mint = Keypair.generate();
      await spl.createMint(
        this.connection,
        this.wallet,
        this.wallet.publicKey,
        null,
        6,
        mint,
        {
          commitment: "confirmed",
        },
        spl.TOKEN_PROGRAM_ID
      );

      console.log("Token created:", mint.publicKey.toBase58());
      const userAta = await spl.createAssociatedTokenAccount(
        this.connection,
        this.wallet,
        mint.publicKey,
        this.wallet.publicKey,
        {
          commitment: "confirmed",
        },
        spl.TOKEN_PROGRAM_ID,
        spl.ASSOCIATED_TOKEN_PROGRAM_ID,
        true
      );
      console.log("Associated token account created:", userAta.toBase58());
      const mintSignature = await spl.mintTo(
        this.connection,
        this.wallet,
        mint.publicKey,
        userAta,
        this.wallet.publicKey,
        100_000_000e6,
        [],
        {
          commitment: "confirmed",
        },
        spl.TOKEN_PROGRAM_ID
      );

      console.log(
        "Minted 100,000,000 tokens to:",
        this.wallet.publicKey.toBase58()
      );
      return {
        success: true,
        data: {
          mint: mint.publicKey.toString(),
          mintSignature: mintSignature,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Retrieves the Program Derived Address (PDA) for the config account.
   * @returns Promise resolving to the config PDA
   */
  async getConfigPDA(): Promise<PublicKey> {
    try {
      // Calculate the PDA for the config account
      const [configPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("config")], // Seed must match the program's logic
        this.program.programId // Program ID
      );
      return configPDA;
    } catch (error) {
      console.error("Error calculating config PDA:", error);
      throw new Error("Failed to calculate config PDA");
    }
  }

  // Add this function in your TokenMillClient class
  async buildStakeTx(
    params: StakingParams & { userPublicKey: string }
  ): Promise<TokenMillResponse<string>> {
    try {
      const marketPubkey = new PublicKey(params.marketAddress);
      const userPubkey = new PublicKey(params.userPublicKey);
  
      // Derive the staking PDA
      const stakingAccount = PublicKey.findProgramAddressSync(
        [
          Buffer.from("market_staking"), 
          marketPubkey.toBuffer(), 
          //userPubkey.toBuffer()
        ],
        this.program.programId
      )[0];
      console.log("Derived staking PDA:", stakingAccount.toString());
  
      // 1) Build the instruction using Anchor—but DO NOT sign with user.
      console.log("[buildStakeTx] Building stake instruction via Anchor...");
      const anchorTx: Transaction = await this.program.methods
        .createStaking()
        .accountsPartial({
          market: marketPubkey,
          staking: stakingAccount,
          payer: userPubkey, // client’s key
        })
        .transaction(); 
      console.log("[buildStakeTx] Anchor created transaction with instructions.");
  
      // 2) Build a new (legacy) Transaction from the anchorTx instructions
      console.log("[buildStakeTx] Forcing legacy transaction creation...");
      const { blockhash } = await this.connection.getLatestBlockhash();
      const legacyTx = new Transaction({
        feePayer: userPubkey,
        recentBlockhash: blockhash,
      });
      // Add the instructions from anchorTx
      legacyTx.add(...anchorTx.instructions);
  
      // 3) We do NOT sign with user’s key on the server. 
      //    If you have ephemeral signers, sign them here. 
      //    For stake, there’s no ephemeral signers, so skip.
  
      // 4) Serialize the entire transaction (no partial signers).
      const serializedTx = legacyTx.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });
      const base64Tx = serializedTx.toString("base64");
      console.log("[buildStakeTx] Final stake transaction (base64):", base64Tx);
  
      return { success: true, data: base64Tx };
    } catch (error: any) {
      console.error("[buildStakeTx] Error:", error);
      return {
        success: false,
        error: error.message || "Unknown error",
      };
    }
  }
  


  /**
   * Creates a new staking position for a market.
   * @param params - Staking parameters including market address
   * @returns TokenMillResponse containing transaction signature
   */
  async stake(params: StakingParams): Promise<
    TokenMillResponse<{
      signature: string;
    }>
  > {
    try {
      const marketPubkey = new PublicKey(params.marketAddress);
      const market = await this.program.account.market.fetch(marketPubkey);

      const stakingAccount = await this.getStakingAccount(
        marketPubkey,
        this.wallet.publicKey
      );

      const tx = await this.program.methods
        .createStaking()
        .accountsPartial({
          market: marketPubkey,
          staking: stakingAccount,
          payer: this.wallet.publicKey,
        })
        .signers([this.wallet])
        .rpc();

      return {
        success: true,
        data: { signature: tx },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async buildCreateVestingTxWithAutoPositionAndATA(params: {
    marketAddress: string;
    userPublicKey: string; // the wallet address
    baseTokenMint: string; // must be an SPL mint
    recipient: string;     
    amount: number;
    startTime: number;
    duration: number;
    cliffDuration?: number;
  }): Promise<TokenMillResponse<{ transaction: string; ephemeralVestingPubkey: string }>> {
    try {
      console.log("[buildCreateVestingTxWithAutoPositionAndATA] Received params:", params);

      // 1) Convert strings to PublicKeys
      const marketPubkey = new PublicKey(params.marketAddress);
      const userPubkey = new PublicKey(params.userPublicKey);
      const baseTokenMintPubkey = new PublicKey(params.baseTokenMint);
      const recipientPubkey = new PublicKey(params.recipient);

      // 2) Derive PDAs: staking, stakePosition, eventAuthority
      const [stakingPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("market_staking"), marketPubkey.toBuffer()],
        this.program.programId
      );
      const [stakePositionPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("stake_position"), marketPubkey.toBuffer(), userPubkey.toBuffer()],
        this.program.programId
      );
      const [eventAuthorityPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("__event_authority")],
        this.program.programId
      );

      // 3) Derive ATAs: marketBaseTokenAta & userBaseTokenAta
      const marketBaseTokenAta = spl.getAssociatedTokenAddressSync(
        baseTokenMintPubkey,
        marketPubkey,
        true
      );
      const userBaseTokenAta = spl.getAssociatedTokenAddressSync(
        baseTokenMintPubkey,
        userPubkey,
        true
      );

      // 4) Ephemeral vesting Keypair
      const vestingKeypair = Keypair.generate();

      // 5) We'll gather instructions in an array
      const instructions: TransactionInstruction[] = [];

      // (a) Create userBaseTokenAta if not existing
      const userATAinfo = await this.connection.getAccountInfo(userBaseTokenAta);
      if (!userATAinfo) {
        console.log("User ATA does not exist. We will create it now.");
        // We can build a normal "createAssociatedTokenAccount" IX for userPubkey as payer:
        const createUserATAix = spl.createAssociatedTokenAccountInstruction(
          userPubkey,         // payer
          userBaseTokenAta,   // the address of the ATA to create
          userPubkey,         // owner of this ATA
          baseTokenMintPubkey // mint
        );
        instructions.push(createUserATAix);
      } else {
        console.log("User ATA already exists:", userBaseTokenAta.toBase58());
      }

      // (b) Create stakePosition if not existing
      const stakePositionInfo = await this.connection.getAccountInfo(stakePositionPda);
      if (!stakePositionInfo) {
        console.log("stake_position NOT found. We'll create it now.");
        const stakeIx = await this.program.methods
          .createStakePosition()
          .accountsPartial({
            market: marketPubkey,
            stakePosition: stakePositionPda,
            user: userPubkey,
            systemProgram: SystemProgram.programId,
          })
          .instruction();
        instructions.push(stakeIx);
      } else {
        console.log("stake_position found:", stakePositionPda.toBase58());
      }

      // (c) createVestingPlan always
      const vestingIx = await this.program.methods
        .createVestingPlan(
          new BN(params.startTime),
          new BN(params.amount),
          new BN(params.duration),
          params.cliffDuration ? new BN(params.cliffDuration) : new BN(0)
        )
        .accountsPartial({
          market: marketPubkey,
          staking: stakingPda,
          stakePosition: stakePositionPda,
          vestingPlan: vestingKeypair.publicKey,
          baseTokenMint: baseTokenMintPubkey,
          marketBaseTokenAta,
          userBaseTokenAta,
          user: userPubkey,
          baseTokenProgram: spl.TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          eventAuthority: eventAuthorityPda,
          program: this.program.programId,
        })
        .instruction();
      instructions.push(vestingIx);

      console.log("We have", instructions.length, "instructions in total.");

      // 6) Combine instructions into one Transaction
      const { blockhash } = await this.connection.getLatestBlockhash();
      const legacyTx = new Transaction({
        feePayer: userPubkey,
        recentBlockhash: blockhash,
      });
      legacyTx.add(...instructions);

      // 7) Partially sign with ephemeral vesting (since vestingPlan is a signer)
      legacyTx.partialSign(vestingKeypair);

      // 8) Serialize & return base64
      const serialized = legacyTx.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });
      const base64Tx = serialized.toString("base64");

      return {
        success: true,
        data: {
          transaction: base64Tx,
          ephemeralVestingPubkey: vestingKeypair.publicKey.toBase58(),
        },
      };
    } catch (err: any) {
      console.error("[buildCreateVestingTxWithAutoPositionAndATA] Error:", err);
      return {
        success: false,
        error: err.message || "Unknown error",
      };
    }
  }


  async buildSwapTx(params: SwapParams): Promise<TokenMillResponse<{ transaction: string }>> {
    try {
      console.log("[buildSwapTx] START with params:", params);
  
      const {
        market,
        quoteTokenMint,
        action,
        tradeType,
        amount,
        otherAmountThreshold,
        userPublicKey,
      } = params;
  
      const userPubkey = new PublicKey(userPublicKey);
      const marketPubkey = new PublicKey(market);
      const quoteMintPubkey = new PublicKey(quoteTokenMint);
  
      // 1) Fetch market account
      console.log("[buildSwapTx] Fetching market account:", market);
      const marketAccount = await this.program.account.market.fetch(marketPubkey);
      const configPubkey = marketAccount.config as PublicKey;
      const baseTokenMint = marketAccount.baseTokenMint as PublicKey;
      console.log("    - Market baseTokenMint:", baseTokenMint.toBase58());
      console.log("    - Market configPubkey:", configPubkey.toBase58());
  
      // 2) Load swapAuthority from .env
      console.log("[buildSwapTx] Loading swapAuthorityKeypair from env SWAP_AUTHORITY_KEY");
      const swapAuthorityKeypair = Keypair.fromSecretKey(
        bs58.decode(process.env.SWAP_AUTHORITY_KEY!)
      );
      console.log("    - swapAuthority pubkey:", swapAuthorityKeypair.publicKey.toBase58());
  
      // Derive swapAuthorityBadge
      const swapAuthorityBadge = PublicKey.findProgramAddressSync(
        [
          Buffer.from("swap_authority"),
          marketPubkey.toBuffer(),
          swapAuthorityKeypair.publicKey.toBuffer(),
        ],
        this.program.programId
      )[0];
      console.log("    - swapAuthorityBadge PDA:", swapAuthorityBadge.toBase58());
  
      // 3) Derive ATAs
      console.log("[buildSwapTx] Deriving ATAs...");
      const marketQuoteTokenAta = getAssociatedTokenAddressSync(
        quoteMintPubkey,
        marketPubkey,
        true
      );
      const marketBaseTokenAta = getAssociatedTokenAddressSync(
        baseTokenMint,
        marketPubkey,
        true
      );
      const userQuoteTokenAta = getAssociatedTokenAddressSync(
        quoteMintPubkey,
        userPubkey
      );
      const userBaseTokenAta = getAssociatedTokenAddressSync(
        baseTokenMint,
        userPubkey
      );
      console.log("    - marketQuoteTokenAta:", marketQuoteTokenAta.toBase58());
      console.log("    - marketBaseTokenAta:", marketBaseTokenAta.toBase58());
      console.log("    - userQuoteTokenAta:", userQuoteTokenAta.toBase58());
      console.log("    - userBaseTokenAta:", userBaseTokenAta.toBase58());
  
      // Protocol fee info
      console.log("[buildSwapTx] Fetching configAccount for protocol fee...");
      const configAccount = await this.program.account.tokenMillConfig.fetch(configPubkey);
      const protocolFeeRecipient = (configAccount as any).protocolFeeRecipient as PublicKey;
      const protocolQuoteTokenAta = getAssociatedTokenAddressSync(
        quoteMintPubkey,
        protocolFeeRecipient,
        true
      );
      console.log("    - protocolFeeRecipient:", protocolFeeRecipient.toBase58());
      console.log("    - protocolQuoteTokenAta:", protocolQuoteTokenAta.toBase58());
  
      // 4) Check if swapAuthorityBadge is on-chain
      console.log("[buildSwapTx] Checking if swapAuthorityBadge is on-chain...");
      const badgeInfo = await this.connection.getAccountInfo(swapAuthorityBadge);
      const badgeExists = !!badgeInfo;
      console.log("    - swapAuthorityBadge Exists?", badgeExists);
  
      // 5) Check market’s quote ATA & read wSOL balance
      console.log("[buildSwapTx] Checking if market quote ATA exists on-chain...");
      const marketQuoteInfo = await this.connection.getAccountInfo(marketQuoteTokenAta);
  
      let marketWsolBalance = 0;
      let marketHasQuoteAta = false;
      if (marketQuoteInfo) {
        marketHasQuoteAta = true;
        // If it exists, let's read the wSOL balance
        console.log("[buildSwapTx] Market quote ATA found, fetching wSOL balance...");
        const balanceInfo = await this.connection.getTokenAccountBalance(marketQuoteTokenAta);
        marketWsolBalance = balanceInfo?.value?.uiAmount || 0;
      } else {
        console.log("[buildSwapTx] Market quote ATA does NOT exist => balance is 0");
      }
      console.log("[buildSwapTx] Market's wSOL balance (or 0 if no ATA):", marketWsolBalance);
  
      // 6) Check user's quote ATA & base ATA
      console.log("[buildSwapTx] Checking if user quote ATA exists...");
      const userQuoteInfo = await this.connection.getAccountInfo(userQuoteTokenAta);
      const userHasQuoteAta = !!userQuoteInfo;
  
      console.log("[buildSwapTx] Checking if user base ATA exists...");
      const userBaseInfo = await this.connection.getAccountInfo(userBaseTokenAta);
      const userHasBaseAta = !!userBaseInfo;
  
      // Decide if we do "freeMarket" or remain locked
      const doFreeMarket = marketHasQuoteAta && marketWsolBalance >= 69;
      console.log("[buildSwapTx] doFreeMarket:", doFreeMarket);
  
      // 7) Build instructions
      const instructions: TransactionInstruction[] = [];
  
      // (A) If swapAuthorityBadge does NOT exist, create it with lockMarket
      if (!badgeExists) {
        console.log("[buildSwapTx] swapAuthorityBadge not found => Pushing lockMarket instruction...");
        const lockIx = await this.program.methods
          .lockMarket(swapAuthorityKeypair.publicKey)
          .accountsPartial({
            market: marketPubkey,
            swapAuthorityBadge,
            creator: userPubkey,
          })
          .instruction();
        instructions.push(lockIx);
      }
  
      // (B) If the market's quote ATA does NOT exist, create it
      if (!marketHasQuoteAta) {
        console.log("[buildSwapTx] Pushing instruction to create Market quote ATA...");
        const createMarketQuoteIx = createAssociatedTokenAccountInstruction(
          userPubkey,          // payer
          marketQuoteTokenAta, // ATA
          marketPubkey,        // owner
          quoteMintPubkey
        );
        instructions.push(createMarketQuoteIx);
      }
  
      // (C) If the user’s quote ATA does NOT exist, create it
      if (!userHasQuoteAta) {
        console.log("[buildSwapTx] Pushing instruction to create User quote ATA...");
        const createUserQuoteIx = createAssociatedTokenAccountInstruction(
          userPubkey,         // payer
          userQuoteTokenAta,  // ATA
          userPubkey,         // owner
          quoteMintPubkey
        );
        instructions.push(createUserQuoteIx);
      }
  
      // (D) If the user’s base ATA does NOT exist, create it
      // THIS is the crucial fix for "AccountNotInitialized: user_base_token_account"
      if (!userHasBaseAta) {
        console.log("[buildSwapTx] Pushing instruction to create User BASE token ATA...");
        const createUserBaseIx = createAssociatedTokenAccountInstruction(
          userPubkey,         // payer
          userBaseTokenAta,   // ATA
          userPubkey,         // owner
          baseTokenMint
        );
        instructions.push(createUserBaseIx);
      }
  
      // (E) If we want to free the market, push freeMarket instruction
      if (doFreeMarket) {
        console.log("[buildSwapTx] Pushing freeMarket instruction => user as new authority");
        const freeMarketIx = await this.program.methods
          .freeMarket()
          .accountsPartial({
            market: marketPubkey,
            swapAuthority: swapAuthorityKeypair.publicKey
          })
          .instruction();
        instructions.push(freeMarketIx);
      }
  
      // (F) permissionedSwap
      const finalSwapAuthority = doFreeMarket
        ? userPubkey
        : swapAuthorityKeypair.publicKey;
  
      console.log("[buildSwapTx] finalSwapAuthority:", finalSwapAuthority.toBase58());
  
      const finalThreshold = otherAmountThreshold ?? (
        action === "buy"
          ? Math.floor(amount * 0.99)
          : Math.floor(amount * 1.01)
      );
      console.log("[buildSwapTx] finalThreshold:", finalThreshold);
  
      const swapIx = await this.program.methods
        .permissionedSwap(
          action === 'buy' ? { buy: {} } : { sell: {} },
          tradeType === 'exactInput' ? { exactInput: {} } : { exactOutput: {} },
          new BN(amount),
          new BN(finalThreshold),
        )
        .accountsPartial({
          config: configPubkey,
          market: marketPubkey,
          baseTokenMint,
          quoteTokenMint: quoteMintPubkey,
          marketBaseTokenAta,
          marketQuoteTokenAta,
          userBaseTokenAccount: userBaseTokenAta,  // <--- now guaranteed to exist
          userQuoteTokenAccount: userQuoteTokenAta,
          protocolQuoteTokenAta,
          referralTokenAccount: this.program.programId,
          swapAuthority: finalSwapAuthority,
          swapAuthorityBadge,
          user: userPubkey,
          baseTokenProgram: TOKEN_PROGRAM_ID,
          quoteTokenProgram: TOKEN_PROGRAM_ID,
        })
        .instruction();
  
      instructions.push(swapIx);
  
      // 8) Build Transaction
      console.log("[buildSwapTx] Building Transaction with", instructions.length, "instruction(s).");
      const { blockhash } = await this.connection.getLatestBlockhash();
      const legacyTx = new Transaction({
        feePayer: userPubkey,
        recentBlockhash: blockhash,
      });
      instructions.forEach(ix => legacyTx.add(ix));
  
      // 9) Partial-sign with swapAuthorityKeypair
      console.log("[buildSwapTx] partialSign with server's swapAuthorityKeypair...");
      legacyTx.partialSign(swapAuthorityKeypair);
  
      // 10) Serialize & return base64
      const serializedTx = legacyTx.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });
      const base64Tx = serializedTx.toString("base64");
      console.log("[buildSwapTx] DONE. Returning base64 transaction...");
  
      return {
        success: true,
        data: { transaction: base64Tx },
      };
    } catch (error: any) {
      console.error("[buildSwapTx] FATAL ERROR:", error);
      return {
        success: false,
        error: error.message ?? "Unknown error",
      };
    }
  }
  




  // ----------------------------------------------------------------
  // BUILD RELEASE VESTING TX
  // ----------------------------------------------------------------
  async buildReleaseVestingTx(params: {
    marketAddress: string;
    vestingPlanAddress: string;
    baseTokenMint: string;
    userPublicKey: string;
  }): Promise<TokenMillResponse<string>> {
    try {
      const { marketAddress, vestingPlanAddress, baseTokenMint, userPublicKey } = params;
      const marketPubkey = new PublicKey(marketAddress);
      const vestingPubkey = new PublicKey(vestingPlanAddress);
      const baseTokenMintPubkey = new PublicKey(baseTokenMint);
      const userPubkey = new PublicKey(userPublicKey);

      // 1) Derive the staking & stakePosition PDAs
      const stakingPda = PublicKey.findProgramAddressSync(
        [Buffer.from("market_staking"), marketPubkey.toBuffer()],
        this.program.programId
      )[0];
      const stakePositionPda = PublicKey.findProgramAddressSync(
        [Buffer.from("stake_position"), marketPubkey.toBuffer(), userPubkey.toBuffer()],
        this.program.programId
      )[0];

      // 2) Derive ATAs
      const marketBaseTokenAta = getAssociatedTokenAddressSync(
        baseTokenMintPubkey,
        marketPubkey,
        true
      );
      const userBaseTokenAta = getAssociatedTokenAddressSync(
        baseTokenMintPubkey,
        userPubkey,
        true
      );

      console.log("[buildReleaseVestingTx] Building release instruction...");
      // 3) Build the anchor instruction but do NOT call .rpc()
      const anchorTx = await this.program.methods
        .release() // your on-chain method
        .accountsPartial({
          market: marketPubkey,
          staking: stakingPda,
          stakePosition: stakePositionPda,
          vestingPlan: vestingPubkey,
          marketBaseTokenAta,
          userBaseTokenAta,
          baseTokenMint: baseTokenMintPubkey,
          baseTokenProgram: TOKEN_PROGRAM_ID,
          user: userPubkey,
        })
        .transaction();

      // 4) Convert anchorTx instructions into a legacy Transaction
      const { blockhash } = await this.connection.getLatestBlockhash();
      const legacyTx = new Transaction({
        feePayer: userPubkey,
        recentBlockhash: blockhash,
      });
      legacyTx.add(...anchorTx.instructions);

      // 5) No ephemeral signers needed (vestingPlan is a PDA, so no local signing).
      //    If your program required ephemeral, you'd partialSign here.

      // 6) Serialize to base64
      const serializedTx = legacyTx.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });
      const base64Tx = serializedTx.toString("base64");

      return { success: true, data: base64Tx };
    } catch (error: any) {
      console.error("[buildReleaseVestingTx] Error:", error);
      return {
        success: false,
        error: error.message || "Unknown error",
      };
    }
  }

  /**
   * Creates a new vesting plan for token distribution.
   * @param params - Vesting parameters including:
   *   - marketAddress: Address of the market
   *   - recipient: Recipient of vested tokens
   *   - baseTokenMint: Token mint address
   *   - amount: Amount to vest
   *   - startTime: Vesting start timestamp
   *   - duration: Vesting duration in seconds
   *   - cliffDuration: Optional cliff duration in seconds
   * @returns TokenMillResponse containing vesting account address and transaction signature
   */
  async createVesting(
    params: VestingParams
  ): Promise<TokenMillResponse<CreateVestingResponse>> {
    try {
      // Initialize key variables
      const marketPubkey = new PublicKey(params.marketAddress);
      const recipientPubkey = new PublicKey(params.recipient);
      const vestingAccount = Keypair.generate();

      const marketAccount = await this.program.account.market.fetch(
        marketPubkey
      );
      const baseTokenMint = marketAccount.baseTokenMint;

      console.log("Base Token Mint:", baseTokenMint.toString());

      // Get ATAs
      const userBaseTokenAta = spl.getAssociatedTokenAddressSync(
        baseTokenMint,
        this.wallet.publicKey,
        true,
        spl.TOKEN_2022_PROGRAM_ID,
        spl.ASSOCIATED_TOKEN_PROGRAM_ID
      );

      // Get user base token balance
      const userBaseTokenBalance = await this.connection.getTokenAccountBalance(
        userBaseTokenAta
      );
      console.log(
        "User Base Token Balance:",
        userBaseTokenBalance.value.uiAmount
      );

      const marketBaseTokenAta = spl.getAssociatedTokenAddressSync(
        baseTokenMint,
        marketPubkey,
        true,
        spl.TOKEN_2022_PROGRAM_ID,
        spl.ASSOCIATED_TOKEN_PROGRAM_ID
      );

      // Create user ATA if needed
      const doesUserHaveBaseTokenATA = await this.connection.getAccountInfo(
        userBaseTokenAta
      );
      console.log("Does User Have Base Token ATA:", doesUserHaveBaseTokenATA);
      if (!doesUserHaveBaseTokenATA) {
        await spl.createAssociatedTokenAccount(
          this.connection,
          this.wallet,
          baseTokenMint,
          this.wallet.publicKey,
          { commitment: "confirmed" },
          spl.TOKEN_2022_PROGRAM_ID,
          spl.ASSOCIATED_TOKEN_PROGRAM_ID,
          true
        );
      }

      // Setup staking if needed
      const staking = PublicKey.findProgramAddressSync(
        [Buffer.from("market_staking"), marketPubkey.toBuffer()],
        this.program.programId
      )[0];

      const stakePositionAccountInfo = await this.connection.getAccountInfo(
        staking
      );
      console.log("Stake Position Account Info:", stakePositionAccountInfo);

      await this.setupStakingIfNeeded(staking, marketPubkey);
      await this.setupStakePositionIfNeeded(marketPubkey);

      // Create vesting plan
      const tx = await this.program.methods
        .createVestingPlan(
          new BN(Date.now() / 1000),
          new BN(params.amount),
          new BN(params.duration),
          params.cliffDuration ? new BN(params.cliffDuration) : new BN(0)
        )
        .accountsPartial({
          market: marketPubkey,
          staking,
          stakePosition: await this.getStakePositionAddress(marketPubkey),
          vestingPlan: vestingAccount.publicKey,
          marketBaseTokenAta,
          userBaseTokenAta,
          baseTokenMint: baseTokenMint,
          baseTokenProgram: spl.TOKEN_2022_PROGRAM_ID,
          user: this.wallet.publicKey,
        })
        .signers([vestingAccount])
        .rpc();

      return {
        success: true,
        data: {
          vestingAccount: vestingAccount.toString(),
          signature: tx,
        },
      };
    } catch (error) {
      console.error("Error creating vesting:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Sets up staking for a market if not already configured
   */
  private async setupStakingIfNeeded(
    staking: PublicKey,
    market: PublicKey
  ): Promise<void> {
    const stakingAccountInfo = await this.connection.getAccountInfo(staking);
    if (!stakingAccountInfo) {
      const transaction = await this.program.methods
        .createStaking()
        .accountsPartial({
          market,
          staking,
          payer: this.wallet.publicKey,
        })
        .signers([this.wallet])
        .transaction();

      const signature = await this.connection.sendTransaction(transaction, [
        this.wallet,
      ]);
      const result = await this.connection.confirmTransaction(signature);

      if (result.value.err) {
        throw new Error(`Staking activation failed: ${result.value.err}`);
      }
    }
  }

  /**
   * Sets up stake position for the current user if not already configured
   */
  private async setupStakePositionIfNeeded(market: PublicKey): Promise<void> {
    const stakePosition = await this.getStakePositionAddress(market);
    const stakePositionInfo = await this.connection.getAccountInfo(
      stakePosition
    );

    if (!stakePositionInfo) {
      const transaction = await this.program.methods
        .createStakePosition()
        .accountsPartial({
          market,
          stakePosition,
          user: this.wallet.publicKey,
        })
        .signers([this.wallet])
        .transaction();

      const signature = await this.connection.sendTransaction(transaction, [
        this.wallet,
      ]);
      const result = await this.connection.confirmTransaction(signature);

      if (result.value.err) {
        throw new Error(`Stake position creation failed: ${result.value.err}`);
      }
    }
  }

  /**
   * Gets the stake position address for the current user and market
   */
  private async getStakePositionAddress(market: PublicKey): Promise<PublicKey> {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from("stake_position"),
        market.toBuffer(),
        this.wallet.publicKey.toBuffer(),
      ],
      this.program.programId
    )[0];
  }

  /**
   * Releases vested tokens to the recipient.
   * @param params - Release parameters including:
   *   - marketAddress: Address of the market
   *   - stakingAddress: Address of staking account
   *   - stakePositionAddress: Address of stake position
   *   - vestingPlanAddress: Address of vesting plan
   *   - baseTokenMint: Token mint address
   * @returns TokenMillResponse containing transaction signature
   */
  async releaseVesting(
    params: ReleaseVestingParams
  ): Promise<TokenMillResponse<ReleaseVestingResponse>> {
    try {
      const marketPubkey = new PublicKey(params.marketAddress);
      const baseTokenMintPubkey = new PublicKey(params.baseTokenMint);
      const vestingPlanPubkey = new PublicKey(params.vestingPlanAddress);

      // Get ATAs for market and user
      const marketBaseTokenAta = spl.getAssociatedTokenAddressSync(
        baseTokenMintPubkey,
        marketPubkey,
        true,
        spl.TOKEN_PROGRAM_ID
      );

      const userBaseTokenAta = spl.getAssociatedTokenAddressSync(
        baseTokenMintPubkey,
        this.wallet.publicKey,
        true,
        spl.TOKEN_PROGRAM_ID
      );

      await new Promise((resolve) => setTimeout(resolve, 60_000));

      const transaction = await this.program.methods
        .release()
        .accountsPartial({
          market: marketPubkey,
          staking: new PublicKey(params.stakingAddress),
          stakePosition: new PublicKey(params.stakePositionAddress),
          vestingPlan: vestingPlanPubkey,
          marketBaseTokenAta,
          userBaseTokenAta,
          baseTokenMint: baseTokenMintPubkey,
          baseTokenProgram: spl.TOKEN_PROGRAM_ID,
          user: this.wallet.publicKey,
        })
        .transaction();

      const transactionSignature = await this.connection.sendTransaction(
        transaction,
        [this.wallet]
      );
      const confirmation = await this.connection.confirmTransaction(
        transactionSignature
      );

      if (confirmation.value.err) {
        throw new Error(`Release failed: ${confirmation.value.err}`);
      }

      return {
        success: true,
        data: {
          signature: transactionSignature,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Gets the staking account PDA for a market and user.
   * @param market - Market public key
   * @param user - User public key
   * @returns Promise resolving to staking account PDA
   * @private
   */
  private async getStakingAccount(
    market: PublicKey,
    user: PublicKey
  ): Promise<PublicKey> {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("market_staking"), market.toBuffer()],
      this.program.programId
    )[0];
  }

  async executeSwap({
    market,
    quoteTokenMint,
    action,
    tradeType,
    amount,
    otherAmountThreshold,
  }: SwapParams) {
    try {
      // Fetch market and config accounts
      const marketPubkey = new PublicKey(market);

      // Fetch market account
      const marketAccount = await this.program.account.market.fetch(
        marketPubkey
      );
      const config = marketAccount.config;
      const baseTokenMint = marketAccount.baseTokenMint;
      const quoteTokenMint = new PublicKey(
        "So11111111111111111111111111111111111111112"
      );

      console.log("baseTokenMint", baseTokenMint);

      // Get ATAs

      const marketBaseTokenAta = await spl.getOrCreateAssociatedTokenAccount(
        this.connection,
        this.wallet,
        baseTokenMint,
        new PublicKey(market),
        true
      );

      console.log("marketBaseTokenAta", marketBaseTokenAta);

      const userBaseTokenAta = await spl.getOrCreateAssociatedTokenAccount(
        this.connection,
        this.wallet,
        baseTokenMint,
        this.wallet.publicKey,
        true
      );

      console.log("userBaseTokenAta", userBaseTokenAta);

      const marketQuoteTokenAta = await spl.getOrCreateAssociatedTokenAccount(
        this.connection,
        this.wallet,
        new PublicKey(quoteTokenMint),
        new PublicKey(market),
        true
      );
      const marketQuoteTokenAta2 = spl.getAssociatedTokenAddressSync(
        quoteTokenMint,
        marketPubkey,
        true
      );
      const marketBaseTokenAccount =
        await this.connection.getTokenAccountBalance(marketQuoteTokenAta2);
      const baseTokenBalance = marketBaseTokenAccount.value.uiAmount || 0;

      // Check if balance is at least 69 WSOL
      const REQUIRED_WSOL_AMOUNT = 69;
      const swapAuthorityKeypair = Keypair.fromSecretKey(
        bs58.decode(process.env.SWAP_AUTHORITY_KEY!)
      );
      const swapAuthority = swapAuthorityKeypair.publicKey;
      console.log("Swap Authority Public Key:", swapAuthority.toString());
      console.log("Market balance:", baseTokenBalance, "WSOL");
      console.log("Market:", marketPubkey.toString());

      console.log("marketQuoteTokenAta", marketQuoteTokenAta);

      const userQuoteTokenAta = await spl.getOrCreateAssociatedTokenAccount(
        this.connection,
        this.wallet,
        new PublicKey(quoteTokenMint),
        this.wallet.publicKey
      );

      console.log("userQuoteTokenAta", userQuoteTokenAta);
      const configAccount = await this.program.account.tokenMillConfig.fetch(
        config
      );
      const protocolQuoteTokenAta = await spl.getOrCreateAssociatedTokenAccount(
        this.connection,
        this.wallet,
        new PublicKey(quoteTokenMint),
        configAccount.protocolFeeRecipient
      );

      console.log("protocolQuoteTokenAta", protocolQuoteTokenAta);

      const swap_authority = Keypair.fromSecretKey(
        bs58.decode(process.env.SWAP_AUTHORITY_KEY!)
      );
      const swapAuthorityBadge = PublicKey.findProgramAddressSync(
        [
          Buffer.from("swap_authority"),
          marketPubkey.toBuffer(),
          swap_authority.publicKey.toBuffer(),
        ],
        this.program.programId
      )[0];

      if (baseTokenBalance < REQUIRED_WSOL_AMOUNT) {
        console.log(
          `Market lock with Authority. Current balance: ${baseTokenBalance} WSOL. Required: ${REQUIRED_WSOL_AMOUNT} WSOL`
        );
        const transaction = await this.program.methods
          .permissionedSwap(
            action === "buy" ? { buy: {} } : { sell: {} },
            tradeType === "exactInput"
              ? { exactInput: {} }
              : { exactOutput: {} },
            new BN(amount),
            new BN(otherAmountThreshold)
          )
          .accountsPartial({
            config,
            market: new PublicKey(market),
            baseTokenMint,
            quoteTokenMint: new PublicKey(quoteTokenMint),
            marketBaseTokenAta: marketBaseTokenAta.address,
            marketQuoteTokenAta: marketQuoteTokenAta.address,
            userBaseTokenAccount: userBaseTokenAta.address,
            userQuoteTokenAccount: userQuoteTokenAta.address,
            protocolQuoteTokenAta: protocolQuoteTokenAta.address,
            referralTokenAccount: this.program.programId,
            swapAuthority: swap_authority.publicKey,
            swapAuthorityBadge: swapAuthorityBadge,
            user: this.wallet.publicKey,
            baseTokenProgram: spl.TOKEN_PROGRAM_ID,
            quoteTokenProgram: spl.TOKEN_PROGRAM_ID,
          })
          .signers([this.wallet, swap_authority])
          .transaction();

        const signature = await this.connection.sendTransaction(transaction, [
          this.wallet,
          swap_authority,
        ]);

        const confirmation = await this.connection.confirmTransaction(
          signature
        );

        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${confirmation.value.err}`);
        }
        return {
          success: true,
          signature,
          message: "Swap executed successfully",
        };
      } else {
        // Build and send transaction
        const transaction = await this.program.methods
          .freeMarket()
          .accountsPartial({
            market,
            swapAuthority: swapAuthority,
          })
          .signers([this.wallet, swapAuthorityKeypair])
          .transaction();

        const signature = await this.connection.sendTransaction(transaction, [
          this.wallet,
          swapAuthorityKeypair,
        ]);

        const freeconfirmation = await this.connection.confirmTransaction(
          signature
        );

        if (freeconfirmation.value.err) {
          throw new Error(`Transaction failed: ${freeconfirmation.value.err}`);
        }
        console.log("Market Free");
        const freetransaction = await this.program.methods
          .permissionedSwap(
            action === "buy" ? { buy: {} } : { sell: {} },
            tradeType === "exactInput"
              ? { exactInput: {} }
              : { exactOutput: {} },
            new BN(amount),
            new BN(otherAmountThreshold)
          )
          .accountsPartial({
            config,
            market: new PublicKey(market),
            baseTokenMint,
            quoteTokenMint: new PublicKey(quoteTokenMint),
            marketBaseTokenAta: marketBaseTokenAta.address,
            marketQuoteTokenAta: marketQuoteTokenAta.address,
            userBaseTokenAccount: userBaseTokenAta.address,
            userQuoteTokenAccount: userQuoteTokenAta.address,
            protocolQuoteTokenAta: protocolQuoteTokenAta.address,
            referralTokenAccount: this.program.programId,
            swapAuthority: this.wallet.publicKey,
            user: this.wallet.publicKey,
            baseTokenProgram: spl.TOKEN_PROGRAM_ID,
            quoteTokenProgram: spl.TOKEN_PROGRAM_ID,
          })
          .signers([this.wallet])
          .transaction();

        const freesignature = await this.connection.sendTransaction(
          freetransaction,
          [this.wallet]
        );

        const confirmation = await this.connection.confirmTransaction(
          freesignature
        );

        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${confirmation.value.err}`);
        }

        return {
          success: true,
          signature,
          message: "Swap executed successfully",
        };
      }
    } catch (error: any) {
      console.error(error);
      throw new Error(`Failed to execute swap: ${error.message}`);
    }
  }
  async getAssetMetadata(assetId: string) {
    if (!process.env.RPC_URL) {
      throw new Error("RPC_URL is not set in environment variables.");
    }

    try {
      const response = await axios.post(process.env.RPC_URL, {
        jsonrpc: "2.0",
        id: "1",
        method: "getAsset",
        params: { id: assetId },
      });

      // Check for asset not found error
      if (response.data.error?.message?.includes("Asset Not Found")) {
        throw new Error(`Asset with ID ${assetId} was not found.`);
      }

      return response.data;
    } catch (error: any) {
      console.error(
        "Error fetching asset metadata:",
        error.response?.data || error.message
      );
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to fetch asset metadata."
      );
    }
  }

  private parseSwapAmounts(returnData: any) {
    if (!returnData || !returnData.data) {
      console.log("Invalid or missing return data:", returnData);
      return { inputAmount: 0, outputAmount: 0 };
    }

    try {
      const buffer = Buffer.from(returnData.data[0], "base64");
      console.log("Decoded buffer:", buffer.toString("hex"));
      console.log("Decoded buffer length:", buffer.length);

      // Safety check for 16 bytes
      if (buffer.length < 16) {
        console.log("Buffer too short, returning default values");
        return { inputAmount: 0, outputAmount: 0 };
      }

      let baseAmount: bigint;
      let quoteAmount: bigint;

      try {
        // Assuming the new structure: first 8 bytes = input, last 8 bytes = output
        baseAmount = buffer.readBigUInt64LE(0); // Starts at 0
        quoteAmount = buffer.readBigUInt64LE(8); // Starts at 8
      } catch (error) {
        console.log("Error reading buffer:", error);
        return { inputAmount: 0, outputAmount: 0 };
      }

      return {
        baseAmount: Number(baseAmount),
        quoteAmount: Number(quoteAmount),
      };
    } catch (error) {
      console.log("Error parsing return data:", error);
      return { inputAmount: 0, outputAmount: 0 };
    }
  }


  async buildSetCurveTx(params: {
    market: string;
    userPublicKey: string;
    askPrices: number[]; 
    bidPrices: number[];
  }): Promise<TokenMillResponse<{ transaction: string }>> {
    try {
      console.log("[buildSetCurveTx] Received params:", params);
      const { market, userPublicKey, askPrices, bidPrices } = params;
      const marketPubkey = new PublicKey(market);
      const userPubkey = new PublicKey(userPublicKey);

      // 1) Convert askPrices[], bidPrices[] into BN arrays
      const bnAsk = askPrices.map((n) => new BN(n));
      const bnBid = bidPrices.map((n) => new BN(n));

      // 2) Build the anchor instruction
      console.log("[buildSetCurveTx] Building setMarketPrices instruction...");
      const anchorTx = await this.program.methods
        .setMarketPrices(bnBid, bnAsk)
        .accountsPartial({
          market: marketPubkey,
          creator: userPubkey, // user must be the "creator" or authorized
        })
        .transaction();

      // 3) Convert anchorTx -> legacy Tx
      const { blockhash } = await this.connection.getLatestBlockhash();
      const legacyTx = new Transaction({
        feePayer: userPubkey,
        recentBlockhash: blockhash,
      });
      legacyTx.add(...anchorTx.instructions);

      // 4) No ephemeral signers needed if your program does not require them
      //    If it does, partialSign them here.

      // 5) Serialize -> base64
      const serializedTx = legacyTx.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });
      const base64Tx = serializedTx.toString("base64");
      console.log("[buildSetCurveTx] Final base64:", base64Tx);

      return { success: true, data: { transaction: base64Tx } };
    } catch (error: any) {
      console.error("[buildSetCurveTx] Error:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }

  async quoteSwap({
    market,
    quoteTokenMint,
    action,
    tradeType,
    amount,
    otherAmountThreshold,
  }: SwapParams) {
    try {
      // Fetch market and config accounts
      const marketPubkey = new PublicKey(market);

      // Fetch market account
      const marketAccount = await this.program.account.market.fetch(
        marketPubkey
      );
      const config = marketAccount.config;
      const baseTokenMint = marketAccount.baseTokenMint;
      const quoteTokenMint = new PublicKey(
        "So11111111111111111111111111111111111111112"
      );

      console.log("baseTokenMint", baseTokenMint);

      // Get ATAs

      const marketBaseTokenAta = await spl.getOrCreateAssociatedTokenAccount(
        this.connection,
        this.wallet,
        baseTokenMint,
        new PublicKey(market),
        true
      );

      console.log("marketBaseTokenAta", marketBaseTokenAta);

      const userBaseTokenAta = await spl.getOrCreateAssociatedTokenAccount(
        this.connection,
        this.wallet,
        baseTokenMint,
        this.wallet.publicKey,
        true
      );

      console.log("userBaseTokenAta", userBaseTokenAta);

      const marketQuoteTokenAta = await spl.getOrCreateAssociatedTokenAccount(
        this.connection,
        this.wallet,
        new PublicKey(quoteTokenMint),
        new PublicKey(market),
        true
      );
      const marketQuoteTokenAta2 = spl.getAssociatedTokenAddressSync(
        quoteTokenMint,
        marketPubkey,
        true
      );
      const marketBaseTokenAccount =
        await this.connection.getTokenAccountBalance(marketQuoteTokenAta2);
      const baseTokenBalance = marketBaseTokenAccount.value.uiAmount || 0;

      // Check if balance is at least 69 WSOL
      const REQUIRED_WSOL_AMOUNT = 69;
      const swapAuthorityKeypair = Keypair.fromSecretKey(
        bs58.decode(process.env.SWAP_AUTHORITY_KEY!)
      );
      const swapAuthority = swapAuthorityKeypair.publicKey;
      console.log("Swap Authority Public Key:", swapAuthority.toString());
      console.log("Market balance:", baseTokenBalance, "WSOL");
      console.log("Market:", marketPubkey.toString());

      console.log("marketQuoteTokenAta", marketQuoteTokenAta);

      const userQuoteTokenAta = await spl.getOrCreateAssociatedTokenAccount(
        this.connection,
        this.wallet,
        new PublicKey(quoteTokenMint),
        this.wallet.publicKey
      );

      console.log("userQuoteTokenAta", userQuoteTokenAta);
      const configAccount = await this.program.account.tokenMillConfig.fetch(
        config
      );
      const protocolQuoteTokenAta = await spl.getOrCreateAssociatedTokenAccount(
        this.connection,
        this.wallet,
        new PublicKey(quoteTokenMint),
        configAccount.protocolFeeRecipient
      );

      console.log("protocolQuoteTokenAta", protocolQuoteTokenAta);

      const swap_authority = Keypair.fromSecretKey(
        bs58.decode(process.env.SWAP_AUTHORITY_KEY!)
      );
      const swapAuthorityBadge = PublicKey.findProgramAddressSync(
        [
          Buffer.from("swap_authority"),
          marketPubkey.toBuffer(),
          swap_authority.publicKey.toBuffer(),
        ],
        this.program.programId
      )[0];
      const transaction = await this.program.methods
        .permissionedSwap(
          action === "buy" ? { buy: {} } : { sell: {} },
          tradeType === "exactInput" ? { exactInput: {} } : { exactOutput: {} },
          new BN(amount),
          new BN(otherAmountThreshold)
        )
        .accountsPartial({
          config,
          market: new PublicKey(market),
          baseTokenMint,
          quoteTokenMint: new PublicKey(quoteTokenMint),
          marketBaseTokenAta: marketBaseTokenAta.address,
          marketQuoteTokenAta: marketQuoteTokenAta.address,
          userBaseTokenAccount: userBaseTokenAta.address,
          userQuoteTokenAccount: userQuoteTokenAta.address,
          protocolQuoteTokenAta: protocolQuoteTokenAta.address,
          referralTokenAccount: this.program.programId,
          swapAuthority: swap_authority.publicKey,
          swapAuthorityBadge: swapAuthorityBadge,
          user: this.wallet.publicKey,
          baseTokenProgram: spl.TOKEN_PROGRAM_ID,
          quoteTokenProgram: spl.TOKEN_PROGRAM_ID,
        })
        .signers([this.wallet, swap_authority])
        .transaction();

      const simulation = await this.connection.simulateTransaction(
        transaction,
        [this.wallet, swap_authority]
      );
      console.log("Simulation data:", {
        err: simulation.value.err,
        logs: simulation.value.logs,
        returnData: simulation.value.returnData,
      });

      const data = simulation.value.returnData;
      if (data) {
        const { baseAmount, quoteAmount } = this.parseSwapAmounts(data);
        console.log(
          `Swap amounts - baseAmount: ${baseAmount}, quoteAmount: ${quoteAmount}`
        );
      }

      // TODO: Parse the data to get the input and output amounts

      if (simulation.value.err) {
        throw new Error(`Transaction failed: ${simulation.value.err}`);
      }
      return {
        success: true,
        simulation,
        message: "Swap executed successfully",
      };
    } catch (error: any) {
      console.error(error);
      throw new Error(`Failed to execute swap: ${error.message}`);
    }
  }
  async getGraduation(market: string) {
    try {
      const GRADUTATION_THRESHOLD = 60 * LAMPORTS_PER_SOL;
      const marketPubkey = new PublicKey(market);
      const marketAccount = await this.program.account.market.fetch(
        marketPubkey
      );
      const config = marketAccount.config;
      const baseTokenMint = marketAccount.baseTokenMint;
      const quoteTokenMint = marketAccount.quoteTokenMint;

      const marketBaseTokenAta = await spl.getOrCreateAssociatedTokenAccount(
        this.connection,
        this.wallet,
        baseTokenMint,
        new PublicKey(market),
        true
      );
      const marketQuoteTokenAta = await spl.getOrCreateAssociatedTokenAccount(
        this.connection,
        this.wallet,
        quoteTokenMint,
        new PublicKey(market),
        true
      );
      const baseTokenBalance = await this.connection.getTokenAccountBalance(
        marketBaseTokenAta.address
      );

      const quoteTokenBalance = await this.connection.getTokenAccountBalance(
        marketQuoteTokenAta.address
      );

      const baseTokenBalanceNumber = Number(baseTokenBalance.value.uiAmount);
      const quoteTokenBalanceNumber = Number(quoteTokenBalance.value.uiAmount);

      const info = await this.getAssetMetadata(baseTokenMint.toBase58());

      const graduationData = {
        baseTokenBalance: baseTokenBalanceNumber,
        quoteTokenBalance: quoteTokenBalanceNumber,
        tokenInfo: info.result.content.metadata,
        graduation: quoteTokenBalanceNumber >= GRADUTATION_THRESHOLD,
        graudation_percentage: (
          (quoteTokenBalanceNumber / GRADUTATION_THRESHOLD) *
          100
        ).toFixed(6),
      };

      return graduationData;
    } catch (error: any) {
      console.error(error);
      throw new Error(`Failed to get graduation: ${error.message}`);
    }
  }
}
