[**solana-social-kit**](../../../../README.md)

***

[solana-social-kit](../../../../README.md) / [components/thread/PostHeader](../README.md) / default

# Function: default()

> **default**(`__namedParameters`): `Element`

Defined in: [src/components/thread/PostHeader.tsx:60](https://github.com/SendArcade/solana-social-starter/blob/98f94bb63d3814df24512365f6ae706d273e698f/src/components/thread/PostHeader.tsx#L60)

A component that displays the header of a post in a thread

## Parameters

### \_\_namedParameters

`PostHeaderProps`

## Returns

`Element`

## Component

## Description

PostHeader shows the user information and metadata for a post, including
the user's avatar, username, handle, verification status, and post timestamp.
It also provides menu functionality for post actions like deletion.

Features:
- User avatar display with fallback
- Username and handle display
- Verification badge
- Post timestamp
- Menu actions
- Customizable styling

## Example

```tsx
<PostHeader
  post={postData}
  onPressMenu={(post) => handleMenuPress(post)}
  onDeletePost={(post) => handleDelete(post)}
  themeOverrides={{ '--primary-color': '#1D9BF0' }}
/>
```
