# Screens

This directory contains all the screen components for the application. Each screen represents a full-page view that is rendered by the navigation system.

## Directory Structure

```
screens/
├── Common/                # Shared screens
│   ├── LoginScreen/      # Authentication screens
│   ├── IntroScreen/     # Onboarding screens
│   └── BlinkScreen/    # Messaging screens
├── SampleUI/           # Example UI implementations
│   ├── Chat/          # Chat interface screens
│   ├── Threads/      # Social thread screens
│   └── Profile/     # User profile screens
└── index.ts         # Barrel file for exports
```

## Screen Organization

Each screen follows a consistent structure:

```
ScreenName/
├── index.tsx          # Main screen component
├── styles.ts         # Screen-specific styles
├── components/      # Screen-specific components
├── hooks/         # Screen-specific hooks
└── types.ts      # TypeScript definitions
```

## Best Practices

1. **Component Structure**:
   - Keep screens focused on layout and composition
   - Extract complex logic into hooks
   - Use proper TypeScript types
   - Follow consistent styling patterns

2. **Performance**:
   - Implement proper loading states
   - Use lazy loading for heavy components
   - Optimize re-renders
   - Handle memory management

3. **Navigation**:
   - Type-safe route parameters
   - Proper navigation lifecycle
   - Clean navigation state
   - Handle deep linking

4. **State Management**:
   - Clear data flow
   - Proper Redux integration
   - Local state when appropriate
   - Handle side effects

## Example Screen Structure

```typescript
// types.ts
export interface ScreenProps {
  route: RouteProp<RootStackParamList, 'ScreenName'>;
  navigation: StackNavigationProp<RootStackParamList, 'ScreenName'>;
}

// index.tsx
/**
 * Screen component description
 * @component
 * @example
 * ```tsx
 * <ScreenName param1="value" />
 * ```
 */
export const ScreenName: React.FC<ScreenProps> = ({ route, navigation }) => {
  // State management
  const [loading, setLoading] = useState(false);
  const data = useSelector(selectData);
  
  // Effects
  useEffect(() => {
    // Setup and cleanup
  }, []);
  
  // Event handlers
  const handleAction = useCallback(() => {
    // Handle user action
  }, []);
  
  // Render helpers
  const renderContent = () => {
    if (loading) return <LoadingSpinner />;
    return <Content data={data} />;
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <Header />
      {renderContent()}
      <Footer onAction={handleAction} />
    </SafeAreaView>
  );
};
```

## Screen Categories

1. **Authentication Screens**:
   - Login
   - Registration
   - Password Reset
   - Two-Factor Authentication

2. **Main Flow Screens**:
   - Home Dashboard
   - Profile Views
   - Settings
   - Feature-specific screens

3. **Modal Screens**:
   - Action Sheets
   - Confirmation Dialogs
   - Form Inputs
   - Quick Actions

## Common Patterns

1. **Screen Layout**:
```typescript
const Screen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Header />
      <ScrollView contentContainerStyle={styles.content}>
        <Content />
      </ScrollView>
      <BottomBar />
    </SafeAreaView>
  );
};
```

2. **Data Loading**:
```typescript
const Screen: React.FC = () => {
  const { data, loading, error } = useData();
  
  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen error={error} />;
  
  return <Content data={data} />;
};
```

3. **Form Handling**:
```typescript
const FormScreen: React.FC = () => {
  const [formState, setFormState] = useState(initialState);
  const { handleSubmit, isSubmitting } = useFormSubmit();
  
  return (
    <Form onSubmit={handleSubmit}>
      <Input
        value={formState.field}
        onChange={value => setFormState({ ...formState, field: value })}
      />
      <Button 
        disabled={isSubmitting}
        onPress={handleSubmit}
      />
    </Form>
  );
};
```

## Testing Screens

1. **Component Testing**:
```typescript
describe('Screen', () => {
  it('renders correctly', () => {
    const { getByTestId } = render(<Screen />);
    expect(getByTestId('screen')).toBeTruthy();
  });
  
  it('handles user interaction', () => {
    const { getByText } = render(<Screen />);
    fireEvent.press(getByText('Action'));
    expect(handleAction).toHaveBeenCalled();
  });
});
```

2. **Integration Testing**:
```typescript
it('integrates with navigation', () => {
  const { getByText } = render(
    <NavigationContainer>
      <Screen />
    </NavigationContainer>
  );
  
  fireEvent.press(getByText('Navigate'));
  // Assert navigation occurred
});
```

## Adding New Screens

1. Create a new directory using PascalCase
2. Add required files (index.tsx, styles.ts, etc.)
3. Implement the screen component
4. Add to navigation configuration
5. Add tests
6. Update documentation 