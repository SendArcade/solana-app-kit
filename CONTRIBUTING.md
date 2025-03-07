# Contributing to Solana App Kit

We love your input! We want to make contributing to Solana App Kit as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Code Style Guidelines

### TypeScript

- Use TypeScript for all new code
- Define interfaces for props and state
- Use proper type annotations
- Avoid using `any`

```typescript
// Good
interface Props {
  name: string;
  age?: number;
}

// Bad
const Component = (props: any) => {
  // ...
};
```

### React Components

- Use functional components with hooks
- Use proper prop types
- Keep components focused and single-responsibility
- Extract reusable logic into custom hooks

```typescript
// Good
const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdate }) => {
  const handleUpdate = useCallback(() => {
    onUpdate(user.id);
  }, [user.id, onUpdate]);

  return (
    // JSX
  );
};

// Bad
const UserProfile = (props) => {
  // No type checking
  // Multiple responsibilities
};
```

### File Organization

- One component per file
- Use PascalCase for component files
- Use camelCase for utility files
- Group related files in directories

```
src/
├── components/
│   └── UserProfile/
│       ├── index.tsx
│       ├── styles.ts
│       └── types.ts
└── utils/
    └── formatters.ts
```

### Documentation

- Use JSDoc comments for components and functions
- Document props and return values
- Include examples where helpful

```typescript
/**
 * A component that displays user profile information
 * @component
 * @example
 * ```tsx
 * <UserProfile user={user} onUpdate={handleUpdate} />
 * ```
 */
```

### Testing

- Write tests for all new features
- Use React Testing Library
- Test component behavior, not implementation
- Mock external dependencies

```typescript
describe('UserProfile', () => {
  it('should display user information', () => {
    render(<UserProfile user={mockUser} />);
    expect(screen.getByText(mockUser.name)).toBeInTheDocument();
  });
});
```

## Pull Request Process

1. Update the README.md with details of changes to the interface
2. Update the documentation with any new dependencies or requirements
3. The PR may be merged once you have the sign-off of two other developers

## Issue Reporting

### Bug Reports

When filing an issue, make sure to answer these questions:

1. What version of the app are you using?
2. What did you do?
3. What did you expect to see?
4. What did you see instead?

### Feature Requests

We welcome feature requests! Please provide:

1. Clear description of the feature
2. Use cases and benefits
3. Potential implementation approach

## Community

- Be welcoming to newcomers
- Be respectful of differing viewpoints
- Accept constructive criticism
- Focus on what is best for the community

## License

By contributing, you agree that your contributions will be licensed under its MIT License. 