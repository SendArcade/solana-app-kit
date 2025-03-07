[**solana-social-kit**](../../../../README.md)

***

[solana-social-kit](../../../../README.md) / [components/userListing/userListing](../README.md) / default

# Function: default()

> **default**(): `Element`

Defined in: [src/components/userListing/userListing.tsx:30](https://github.com/SendArcade/solana-social-starter/blob/03568260ca96ed63f77049843c721de1cb011893/src/components/userListing/userListing.tsx#L30)

A component that displays a scrollable list of users with follow functionality

## Returns

`Element`

## Component

## Description

UserListing is a component that renders a list of users with their profile
information and follow/unfollow functionality. Features include:
- User profile image display
- User name and username display
- Interactive follow/unfollow button
- State management for follow status
- Smooth scrolling list implementation

The component uses FlatList for efficient rendering of large lists and
maintains follow state for each user independently.

## Example

```tsx
<UserListing />
```

Note: The component currently uses dummy data from mocks/users.
In a production environment, this should be replaced with real user data.
