# Thread Module

The Thread module is a comprehensive implementation of thread/post functionality similar to social media applications like Twitter. This module is designed to be modular, customizable, and easy to contribute to.

## Directory Structure

```
src/core/thread/
├── components/            # UI Components
│   ├── post/              # Post-specific components
│   ├── sections/          # Content section components
│   ├── retweet/           # Retweet-related components
│   ├── trade/             # Trade-related components
│   └── FollowersFollowingListScreen/  # User followers/following screen
├── types/                 # TypeScript interfaces and types
├── utils/                 # Utility functions
├── services/              # API and data fetching functions
└── hooks/                 # Custom React hooks
```

## Components

The components directory contains all UI-related elements:

- `Thread.tsx` - Main thread component displaying a list of posts
- `ThreadItem.tsx` - Individual post component
- `ThreadComposer.tsx` - Post creation/editing component
- `ThreadAncestors.tsx` - Displays ancestor/parent posts
- `ThreadEditModal.tsx` - Modal for editing a post
- `NftListingModal.tsx` - Modal for NFT listings within posts
- `EditPostModal.tsx` - Modal for editing post content

### Component Organization

Each component follows a structured organization:

1. Import statements
2. Component props interface
3. Component definition
4. Helper functions
5. Render logic

## Types

The `types` directory contains all TypeScript interfaces and type definitions:

- ThreadPost - The main post interface
- ThreadUser - User data interface
- ThreadSection - Content section interface
- Component props interfaces (ThreadProps, ThreadItemProps, etc.)

## Utils

The `utils` directory contains utility functions:

- `gatherAncestorChain` - Builds ancestry chain for a post
- `flattenPosts` - Flattens nested post structure
- `findPostById` - Finds a post by ID
- `removePostRecursive` - Recursively removes a post and its replies

## Services

The `services` directory contains API and data-related functions:

- `createPost` - Creates a new post
- `updatePost` - Updates an existing post
- `deletePost` - Deletes a post
- `fetchPosts` - Fetches posts from the API
- `addReaction` - Adds a reaction to a post
- `createRetweet` - Creates a retweet

## Hooks

The `hooks` directory contains custom React hooks:

- `useThread` - Main thread data management hook
- `useThreadAnimations` - Animations for thread interactions

## Usage

To use the Thread module in your application:

```tsx
import {Thread} from '../core/thread/components';
import {useThread} from '../core/thread/hooks';

function ThreadScreen() {
  const {posts, addPost, removePost} = useThread(initialPosts);

  return (
    <Thread
      rootPosts={posts}
      currentUser={currentUser}
      onPostCreated={() => {
        // Handle post creation
      }}
      onPressPost={post => {
        // Handle post press
      }}
    />
  );
}
```

## Contributing

When contributing to the Thread module:

1. Maintain separation of concerns between components, types, utils, services, and hooks
2. Add new utility functions to the utils directory
3. Add new API methods to the services directory
4. Create custom hooks for complex logic
5. Keep components focused on UI rendering
6. Follow the established naming conventions

## Styling

Thread styling is handled through a combination of:

1. Base styles in `thread.styles.ts`
2. Theme configuration in `thread.theme.ts`
3. Component-specific style files (e.g., `ThreadEditModal.style.ts`)
4. Style overrides through component props
