# Components

This directory contains all reusable UI components used throughout the application. Each component follows a specific structure to maintain consistency and reusability.

## Directory Structure

```
components/
├── ComponentName/           # PascalCase for component directories
│   ├── ComponentName.tsx   # Main component file
│   ├── ComponentName.style.ts  # Component-specific styles
│   ├── ComponentName.types.ts  # TypeScript interfaces and types
│   └── __tests__/         # Component tests
└── index.ts              # Barrel file for easy imports
```

## Component Categories

### Core Components
- **Wallet Components**: Handle wallet connections and management
  - `wallet/`: Embedded wallet authentication
  - `WalletCard/`: Wallet information display
  - `WalletSlide/`: Portfolio management interface

### Token Management
- **Token Components**: Handle token operations and display
  - `tokenMill/`: Token creation and management
  - `BondingCurveCard/`: Bonding curve configuration
  - `TradeCard/`: Token trading interface

### Social Features
- **Social Components**: Handle social interactions
  - `thread/`: Social thread display and interactions
  - `tweet/`: Post display and engagement
  - `BlinkRequestCard/`: Messaging requests
  - `suggestionsCard/`: User suggestions

### UI Elements
- **Layout Components**: Structure and organization
  - `topNavigation/`: Navigation bar
  - `slider/`: Tab view navigation
  - `searchBar/`: Search functionality

### NFT and Collectibles
- **NFT Components**: Handle NFT display and management
  - `collectibles/`: NFT grid display
  - `portfolioBalance/`: Portfolio value tracking

## Best Practices

1. **Naming Conventions**:
   - Use PascalCase for component names and directories
   - Use descriptive names that indicate the component's purpose
   - Follow consistent file naming patterns

2. **Component Structure**:
   - Keep components focused and single-responsibility
   - Extract complex logic into custom hooks
   - Use TypeScript interfaces for props
   - Document props with JSDoc comments
   - Implement proper error handling

3. **Styling**:
   - Use component-specific style files
   - Follow the project's design system
   - Use consistent naming for style objects
   - Support style overrides through props
   - Implement responsive layouts

4. **Documentation**:
   - Add comprehensive JSDoc comments
   - Include usage examples
   - Document props and their types
   - Explain component behavior
   - Provide implementation notes

5. **Testing**:
   - Write unit tests for components
   - Test component behavior and rendering
   - Mock external dependencies
   - Test edge cases and error states
   - Include snapshot tests

## Example Component Structure

```typescript
// ComponentName.types.ts
export interface ComponentNameProps {
  /** Description of the prop */
  prop1: string;
  /** Description of the optional prop */
  prop2?: number;
  /** Optional style overrides */
  styleOverrides?: Partial<typeof defaultStyles>;
}

// ComponentName.style.ts
export const ComponentNameStyles = StyleSheet.create({
  container: {
    // styles
  },
  // other styles
});

// ComponentName.tsx
import { ComponentNameProps } from './ComponentName.types';
import { ComponentNameStyles as defaultStyles } from './ComponentName.style';

/**
 * Component description
 * @component
 * @description
 * Detailed description of the component's purpose and functionality.
 * 
 * Features:
 * - Feature 1
 * - Feature 2
 * 
 * @example
 * ```tsx
 * <ComponentName prop1="value" prop2={42} />
 * ```
 */
export const ComponentName: React.FC<ComponentNameProps> = ({
  prop1,
  prop2,
  styleOverrides = {},
}) => {
  const styles = {...defaultStyles, ...styleOverrides};
  
  return (
    // Component JSX
  );
};
```

## Current Components

### Wallet Components
- `wallet/`: Embedded wallet authentication with social login options
- `WalletCard/`: Wallet information display and management
- `WalletSlide/`: Portfolio management with balance and token list

### Token Management
- `tokenMill/`: Token creation and management suite
- `BondingCurveCard/`: Bonding curve configuration interface
- `TradeCard/`: Token trading interface with price information
- `pumpfun/`: Token trading via Pump.fun integration

### Social Features
- `thread/`: Social thread display and interactions
- `tweet/`: Post display with engagement metrics
- `BlinkRequestCard/`: Dialect Blinks messaging requests
- `suggestionsCard/`: User suggestions with follow functionality

### UI Elements
- `topNavigation/`: Navigation bar with contextual icons
- `slider/`: Tab view navigation with lazy loading
- `searchBar/`: Search input with clear functionality
- `addButton/`: Action buttons for user interactions

### NFT and Collectibles
- `collectibles/`: NFT grid display with responsive layout
- `portfolioBalance/`: Portfolio value tracking with profit/loss
- `portfolioItem/`: Individual token information display

### Other Components
- `PriorityFeeSelector/`: Transaction fee tier selection
- `otherProfile/`: User profile display component
- `userListing/`: Scrollable list of users with follow functionality
- `perksCard/`: Community benefits display
- `actions/`: Placeholder for action-related components

## Adding New Components

1. Create a new directory using PascalCase
2. Include all required files:
   - Main component file (ComponentName.tsx)
   - Style file (ComponentName.style.ts)
   - Types file (ComponentName.types.ts)
3. Add comprehensive JSDoc documentation
4. Write unit tests
5. Update the barrel file (index.ts)
6. Follow the project's coding standards
7. Test on both iOS and Android
8. Document any platform-specific considerations 