# Utils Directory

This directory contains utility functions and helper modules used throughout the Solana Social Starter backend.

## Overview

Utility functions provide reusable code for common operations, separating shared functionality from business logic. These utilities:

- Perform specific tasks that are needed across multiple parts of the application
- Encapsulate complex operations into simple function calls
- Handle cross-cutting concerns like error handling, serialization, and blockchain interactions

## Files

### `tokenMillHelpers.ts`

Provides utility functions for TokenMill operations:

- `parseSwapAmounts`: Parses and validates swap amount parameters
- `getBlockhashWithFallback`: Retrieves a recent blockhash with fallback mechanisms
- `serializeTransaction`: Serializes transactions for client-side signing
- Other TokenMill-specific helper functions

### `ipfs.ts`

Contains utilities for interacting with IPFS via Pinata:

- Uploading files to IPFS
- Retrieving content from IPFS
- Managing IPFS pins
- Generating gateway URLs for IPFS content

### `gcs.ts`

Provides utilities for Google Cloud Storage operations:

- Uploading files to GCS buckets
- Generating signed URLs for accessing files
- Managing file metadata
- Handling permissions

## Usage

Utility functions are imported where needed throughout the codebase:

```typescript
import {serializeTransaction} from '../utils/tokenMillHelpers';
import {uploadToIPFS} from '../utils/ipfs';

async function processMetadataAndTransaction(metadata, transaction) {
  // Upload metadata to IPFS
  const metadataUri = await uploadToIPFS(metadata);

  // Serialize the transaction for client-side signing
  const serializedTx = serializeTransaction(transaction);

  return {metadataUri, serializedTx};
}
```

## Best Practices

1. **Focus on Single Responsibility**: Each utility function should do one thing well
2. **Document Functions**: Include JSDoc comments for all utility functions
3. **Error Handling**: Implement proper error handling in utility functions
4. **Type Safety**: Use TypeScript types for parameters and return values
5. **Testing**: Write unit tests for utility functions
6. **Pure Functions**: When possible, make utility functions pure (no side effects)
7. **Avoid State**: Utility functions should generally be stateless

## Adding New Utilities

When adding new utility functions:

1. Group related functions in the same file
2. Use descriptive function and file names
3. Export all functions that may be useful elsewhere
4. Document parameters, return values, and usage examples
5. Add type definitions for complex parameters and return values

## Example Utility Function

```typescript
/**
 * Serializes a transaction for client-side signing.
 *
 * @param transaction - The transaction to serialize
 * @returns Base64 encoded serialized transaction
 */
export function serializeTransaction(transaction: Transaction): string {
  try {
    const serializedTx = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });

    return serializedTx.toString('base64');
  } catch (error) {
    console.error('Error serializing transaction:', error);
    throw new Error('Failed to serialize transaction');
  }
}
```
