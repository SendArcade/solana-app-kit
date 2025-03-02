# TokenMill Backend

A Solana-based backend service for TokenMill, providing token management, staking, and vesting functionality.

## Overview

TokenMill Backend is an Express.js server that interfaces with the TokenMill Solana program, providing REST API endpoints for:
- Token creation and management
- Market operations
- Staking functionality
- Vesting schedules
- Configuration management

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Solana CLI tools
- A Solana wallet with some SOL for transactions

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd token-mill-be
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
RPC_URL=https://api.devnet.solana.com
PROGRAM_ID=JoeaRXgtME3jAoz5WuFXGEndfv4NPH9nBxsLq44hk9J
```

## Development

Start the development server:
```bash
npm run dev
```

Build the project:
```bash
npm run build
```

## API Endpoints

### Configuration
- `POST /api/config` - Create a new TokenMill configuration
  - Required body: `{ authority, protocolFeeRecipient, protocolFeeShare, referralFeeShare }`

### Token Operations
- `POST /api/quote-token-badge` - Get token badge quote
- Required body: `{ quoteTokenMint, baseTokenMint, amount}`
- `POST /api/tokens` - Create a new token
  - Required body: `{ name, symbol, uri, totalSupply, creatorFeeShare, stakingFeeShare, quoteTokenMint `

### Market Operations
- `POST /api/markets` - Create a new market
  - Required body: `{ name, symbol, uri, totalSupply, creatorFeeShare, stakingFeeShare, quoteTokenMint }`

### Staking
- `POST /api/stake` - Create a new staking position
  - Required body: `{ marketAddress }`

### Vesting
- `POST /api/vesting` - Create a new vesting schedule
- Required body: `{ marketAddress, recipient, baseTokenMint, amount, duration, cliffDuration }`
- `POST /api/vesting/:marketAddress/claim` - Claim vested tokens
  - Required params: marketAddress
  - Required body: Claim parameters

### Swapping
- `POST /api/swap` - Excutes swap using swap authority 
-  Required body - `{ action, tradeType, amount, otherAmountThreshold, market, quoteTokenMint }`

### Get Asset Metadata
- `POST /api/get-asset` -  executes get asset metadata using mint address to give the metadata
- Required body: `{ assetId }`

## Project Structure

```
token-mill-be/
├── src/
│   ├── idl/            # Solana program interface definitions
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions and classes
│   └── index.ts        # Main application entry point
├── dist/               # Compiled JavaScript output
├── .env               # Environment variables
└── package.json
```

## Dependencies

- `@coral-xyz/anchor` - Solana development framework
- `@solana/web3.js` - Solana web3 library
- `@solana/spl-token` - SPL Token program interactions
- `express` - Web server framework
- `typescript` - Type support
- Additional utilities- `big.js`, `bn.js`, `bs58`, `dotenv`
- IDL for the program - https://github.com/SendArcade/Token-Mill/tree/main/src/idl

### Token-Mill Client

The `TokenMillClient` class provides an interface for interacting with the Token-Mill backend.

## Initialization

The `TokenMillClient` requires `RPC_URL` and `WALLET_PRIVATE_KEY` to be set in the environment variables. It initializes:

- A Solana connection
- A wallet from the provided private key
- An Anchor provider and program instance

## Methods

### `createConfig`

Creates a new Token-Mill configuration.
function link: https://github.com/SendArcade/Token-Mill/blob/main/src/utils/tokenMill.ts#L94

- **Params:**
    - `authority` - The address with configuration management rights
    - `protocolFeeRecipient` - Address to receive protocol fees
    - `protocolFeeShare` - Percentage of fees allocated to the protocol
    - `referralFeeShare` - Percentage of fees allocated to referrals
- **Functionality:**
    - Generates a new keypair for the configuration
    - Calls the Solana program to create a new config
    - Sets the new configuration public key

### `getTokenBadge`

Creates a quote token badge for Wrapped SOL (`wSOL`).
function link: https://github.com/SendArcade/Token-Mill/blob/main/src/utils/tokenMill.ts#L128



- **Params:**
    - `params` - (Currently unused)
- **Functionality:**
    - Fetches account info for `wSOL`
    - Calls the program to create a quote asset badge
    - Signs and sends the transaction
    - Confirms the transaction and logs the result

### `createMarket`

Creates a new market on the Token-Mill platform.
function link: https://github.com/SendArcade/Token-Mill/blob/main/src/utils/tokenMill.ts#L199

- **Params:**
    - `name` - Market name
    - `symbol` - Token symbol
    - `uri` - Token metadata URI
    - `totalSupply` - Total token supply
    - `creatorFeeShare` - Percentage of fees allocated to creators
    - `stakingFeeShare` - Percentage of fees allocated to staking
- **Functionality:**
    - Generates a new base token mint
    - Derives necessary PDAs (Program Derived Addresses) for the market and quote token badge
    - Creates the market and initializes it with a locked state
    - Locks the market using a swap authority
    - Calls `setPrices` to establish initial pricing


### `createToken`

Creates a new SPL token on Solana.
function link: https://github.com/SendArcade/Token-Mill/blob/main/src/utils/tokenMill.ts#L399

- **Functionality:**
    - Generates a new mint keypair
    - Creates a new mint using the SPL token program
    - Creates an associated token account for the user
    - Mints an initial supply of 100,000,000 tokens to the user's account
    - Returns the mint address and transaction signature


### `vesting`

Handles vesting schedules and claiming tokens.
function link: https://github.com/SendArcade/Token-Mill/blob/main/src/utils/tokenMill.ts#L538

- **Params:**
    - `marketAddress` - The address of the market
    - `vestingSchedule` - Schedule details (start time, duration, cliff period, etc.)
    - `userAddress` - Address of the beneficiary
- **Functionality:**
    - Creates a new vesting schedule by locking tokens in the smart contract
    - Allows users to claim vested tokens periodically
    - Ensures that tokens are only released according to the defined schedule
    - Calls the Solana program to manage vesting logic

### `setPrices`

Sets the market bid and ask prices.
function link: https://github.com/SendArcade/Token-Mill/blob/main/src/utils/tokenMill.ts#L342

- **Params:**
    - `market` - The market public key
- **Functionality:**
    - Defines predefined bid and ask price tiers
    - Calls the Solana program to set the prices
    - Confirms the transaction and logs the result

### `stake`

Creates a new staking position for a market.
function link: https://github.com/SendArcade/Token-Mill/blob/main/src/utils/tokenMill.ts#L490

- **Params:**
    - `marketAddress` - The address of the market
- **Functionality:**
    - Fetches the market details
    - Retrieves or creates the staking account
    - Calls the Solana program to stake tokens
    - Returns the transaction signature


### `executeSwap`

Executes a token swap using the swap authority.
function link: https://github.com/SendArcade/Token-Mill/blob/main/src/utils/tokenMill.ts#L818


- **Params:**
    - `marketAddress` - The address of the market
    - `amount` - Amount of tokens to swap
    - `userAddress` - Address of the user executing the swap
- **Functionality:**
    - Fetches the market details
    - Ensures the user has sufficient balance
    - Calls the Solana program to execute the swap
    - Returns the transaction signature


## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

ISC License

## Support

For support, please open an issue in the repository or contact the maintainers.
