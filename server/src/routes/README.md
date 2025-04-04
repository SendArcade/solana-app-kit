# Routes Directory

This directory contains all the Express.js route definitions for the Solana Social Starter backend server. Each file defines a set of related API endpoints that handle specific functionality.

## Structure

### `tokenMillRoutes.ts`

Contains all routes related to TokenMill functionality:

- Token creation and management
- Market operations
- Staking
- Vesting
- Swapping
- Asset metadata retrieval

### `threadRoutes.ts`

Handles endpoints for the social thread functionality:

- Thread creation and retrieval
- Thread interactions
- Thread listing and filtering

### `threadImageRoutes.ts`

Manages thread-related image operations:

- Image upload for threads
- Image retrieval
- Image metadata

### `profileImageRoutes.ts`

Handles user profile image operations:

- Upload profile images
- Retrieve profile images
- Update profile images

### `profileWalletRoutes.ts`

Manages the association between user profiles and their wallets:

- Connect wallets to profiles
- Retrieve profile information by wallet
- Update wallet information

### `jupiterSwapRoutes.ts`

Provides endpoints for interacting with Jupiter DEX:

- Token swapping
- Quote retrieval
- Liquidity information

### `pumpSwapRoutes.ts`

Handles PumpSwap-specific functionality:

- PumpSwap token swapping
- Quote retrieval
- Trade execution

### `pumpfunLaunch.ts`

Contains endpoints related to PumpFun token launches:

- Launch configuration
- Participation
- Status retrieval

## Usage

All routes are imported and mounted in the main `index.ts` file. Most routes are prefixed with `/api` when mounted, with some having additional prefixes like `/api/profile` or `/api/thread/images`.

## Adding New Routes

To add new routes:

1. Create a new file in this directory following the naming convention `featureRoutes.ts`
2. Import necessary dependencies and types
3. Create an Express Router instance
4. Define your route handlers
5. Export the router as the default export
6. Import and mount the router in `index.ts`

Example route file template:

```typescript
import express, {Request, Response} from 'express';
import {YourService} from '../services/yourService';

const router = express.Router();

router.get('/your-endpoint', async (req: Request, res: Response) => {
  try {
    // Implementation
    res.json({success: true, data: result});
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
```
