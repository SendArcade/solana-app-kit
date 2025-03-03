# Components

This directory contains all reusable UI components used throughout the application. Each component follows a specific structure to maintain consistency and reusability.

## Directory Structure

```
components/
├── ComponentName/           # PascalCase for component directories
│   ├── index.tsx          # Main component file
│   ├── styles.ts         # Component-specific styles
│   ├── types.ts         # TypeScript interfaces and types
│   └── __tests__/      # Component tests
└── index.ts            # Barrel file for easy imports
```

## Component Categories

- **UI Components**: Basic UI elements (buttons, inputs, cards)
- **Feature Components**: Components specific to features (wallet, thread, tokenMill)
- **Layout Components**: Structure and layout components (navigation, containers)

## Best Practices

1. **Naming Conventions**:
   - Use PascalCase for component names and directories
   - Use descriptive names that indicate the component's purpose

2. **Component Structure**:
   - Keep components focused and single-responsibility
   - Extract complex logic into custom hooks
   - Use TypeScript interfaces for props
   - Document props with JSDoc comments

3. **Styling**:
   - Use component-specific style files
   - Follow the project's design system
   - Use consistent naming for style objects

4. **Testing**:
   - Write unit tests for components
   - Test component behavior and rendering
   - Mock external dependencies

## Example Component Structure

```typescript
// types.ts
export interface ComponentProps {
  /** Description of the prop */
  prop1: string;
  /** Description of the optional prop */
  prop2?: number;
}

// index.tsx
import { ComponentProps } from './types';
import styles from './styles';

/**
 * Component description
 * @component
 * @example
 * ```tsx
 * <Component prop1="value" prop2={42} />
 * ```
 */
export const Component: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  return (
    // Component JSX
  );
};
```

## Current Components

- `BlinkRequestCard/`: Handles Dialect Blinks messaging requests
- `ProfileInfo/`: User profile display component
- `WalletCard/`: Wallet information and management
- `thread/`: Social thread components
- `tokenMill/`: Token management components
- `PriorityFeeSelector/`: A component that allows users to select transaction fee tiers (low, medium, high, very-high) for Solana transactions
- `TradeCard/`: A card component for displaying token trading pairs with price information and swap functionality
- `WalletSlide/`: A screen component that displays portfolio balance, search functionality, and a list of portfolio items with their respective values and profits
- `addButton/`: A component that provides action buttons for following back users and sending to wallet, with a customizable button layout
- `portfolioBalance/`: A component that displays the total portfolio value with profit/loss indicators and quick action buttons for swap, send, and on-ramp operations
- `portfolioItem/`: A reusable component that displays individual token information including token image, name, amount, USD value, and profit/loss
- `tweet/`: A Twitter-like post component that displays user information, content, engagement metrics (quotes, retweets, reactions), and a buy button for $SEND tokens
- `userListing/`: A component that displays a scrollable list of users with their profile images, names, usernames, and follow/unfollow functionality
- `perksCard/`: A component that showcases community benefits and token holding requirements, featuring community images and perk descriptions
- `slider/`: A tab view component that provides swipeable navigation between Posts, Collectibles, and Actions sections with custom styling and lazy loading
- `suggestionsCard/`: A card component that displays user suggestions with background image, profile picture, username, handle, and a follow button
- `searchBar/`: A reusable search input component with a magnifying glass icon and text clearing functionality
- `topNavigation/`: A navigation bar component that displays the current section name and contextual icons (messages, notifications, menu) based on the view
- `pumpfun/`: A feature module containing components for token trading via Pump.fun, including sections for buying, selling, and launching tokens with customizable card layouts
- `wallet/`: An embedded wallet authentication component that provides social login options (Google, Apple, Email) and manages Solana wallet connections
- `buyCard/`: A card component for purchasing creator coins, featuring user image, coin information, buy button, and an animated expandable arrow
- `collectibles/`: A grid display component that showcases NFT collectibles using a series of images in a responsive layout
- `otherProfile/`: A screen component that combines TopNavigation, ProfileInfo, and SwipeTabs to display another user's profile information and content
- And more...

## Adding New Components

1. Create a new directory using PascalCase
2. Include all required files (index.tsx, styles.ts, types.ts)
3. Add JSDoc documentation
4. Write unit tests
5. Update the barrel file (index.ts) 