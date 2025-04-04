# NFT Module

This module centralizes all NFT-related functionality in the application, providing a consistent and reusable interface for handling NFT operations.

## Structure

- `components/`: Reusable NFT UI components
- `hooks/`: Custom hooks for NFT data fetching and state management
- `screens/`: Full screens for NFT functionality (browse, buy, sell)
- `services/`: Business logic for NFT operations (buying, selling, listing)
- `types/`: Type definitions for NFT data
- `utils/`: Utility functions for NFT operations
- `index.ts`: Main export file for the module

## Features

- NFT fetching and display
- NFT listing and purchase
- Collection viewing
- NFT collection floor price fetching
- NFT integration with threads and posts
- Compressed NFT support

## Usage

Import components and functions from this module to handle any NFT-related operations in the application.

```typescript
import { useFetchNFTs, NftListingModal, buyNft, NftItem } from '../../modules/nft';

// Example usage
const { nfts, loading, error } = useFetchNFTs(walletAddress);
```

## Integration

This module integrates with:
- Thread and post components
- Profile display
- Token details
- Transaction signing
