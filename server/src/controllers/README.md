# Controllers Directory

This directory contains controller functions that handle the business logic for various features of the Solana Social Starter backend. Controllers separate the route handling from the actual implementation logic.

## Files

### `threadController.ts`

Handles the logic for thread-related operations:

- Create threads
- Update threads
- Delete threads
- Retrieve threads
- Thread interaction logic

### `uploadMetadataController.ts`

Manages metadata upload operations:

- Process metadata for tokens and NFTs
- Upload metadata to IPFS via Pinata
- Generate and validate metadata URLs

### `jupiterSwapController.ts`

Contains logic for Jupiter DEX operations:

- Quote retrieval
- Swap transaction building
- Route optimization
- Fee calculations

## Purpose

Controllers serve as an intermediary layer between routes and services. They:

1. Parse and validate input from route handlers
2. Orchestrate calls to one or more services
3. Handle error conditions
4. Format responses to be sent back to clients

## Best Practices

When adding new controllers or updating existing ones:

1. Keep controllers focused on a single domain of functionality
2. Move complex business logic to service layers
3. Handle all expected error conditions
4. Provide clear, consistent error messages
5. Document the purpose and parameters of controller functions
6. Use TypeScript interfaces for function parameters and return types

## Example Controller Function

```typescript
/**
 * Creates a new thread
 * @param userId The ID of the user creating the thread
 * @param content The content of the thread
 * @param attachments Optional attachments for the thread
 * @returns The newly created thread object
 */
export async function createThread(
  userId: string,
  content: string,
  attachments?: Attachment[],
): Promise<Thread> {
  try {
    // Validate input
    if (!userId || !content) {
      throw new Error('User ID and content are required');
    }

    // Call service functions
    const newThread = await threadService.create({
      userId,
      content,
      attachments: attachments || [],
      createdAt: new Date(),
    });

    return newThread;
  } catch (error) {
    console.error('Error in createThread controller:', error);
    throw error;
  }
}
```
