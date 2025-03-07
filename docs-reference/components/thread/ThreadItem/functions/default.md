[**solana-social-kit**](../../../../README.md)

***

[solana-social-kit](../../../../README.md) / [components/thread/ThreadItem](../README.md) / default

# Function: default()

> **default**(`__namedParameters`): `Element`

Defined in: [src/components/thread/ThreadItem.tsx:64](https://github.com/SendArcade/solana-social-starter/blob/03568260ca96ed63f77049843c721de1cb011893/src/components/thread/ThreadItem.tsx#L64)

A component that renders an individual post within a thread

## Parameters

### \_\_namedParameters

`ThreadItemProps`

## Returns

`Element`

## Component

## Description

ThreadItem displays a single post with its replies in a threaded discussion.
It handles post interactions like replying, deleting, and showing nested responses.
The component supports customizable styling and themes.

Features:
- Displays post content with author information
- Shows nested replies
- Handles post deletion
- Supports reply composition
- Customizable appearance through themes

## Example

```tsx
<ThreadItem
  post={postData}
  currentUser={user}
  rootPosts={allPosts}
  depth={0}
  onPressPost={handlePostPress}
/>
```
