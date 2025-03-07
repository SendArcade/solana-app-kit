[**solana-social-kit**](../../../../README.md)

***

[solana-social-kit](../../../../README.md) / [components/thread/ThreadComposer](../README.md) / default

# Function: default()

> **default**(`__namedParameters`): `Element`

Defined in: [src/components/thread/ThreadComposer.tsx:79](https://github.com/SendArcade/solana-social-starter/blob/03568260ca96ed63f77049843c721de1cb011893/src/components/thread/ThreadComposer.tsx#L79)

A component for composing new posts and replies in a thread

## Parameters

### \_\_namedParameters

`ThreadComposerProps`

## Returns

`Element`

## Component

## Description

ThreadComposer provides a rich text editor for creating new posts and replies in a thread.
It supports text input, image attachments, and NFT listings. The component handles both
root-level posts and nested replies, with appropriate styling and behavior for each case.

Features:
- Text input with placeholder text
- Image attachment support
- NFT listing integration
- Reply composition
- Offline fallback support
- Customizable theming

## Example

```tsx
<ThreadComposer
  currentUser={user}
  parentId="post-123" // Optional, for replies
  onPostCreated={() => refetchPosts()}
  themeOverrides={{ '--primary-color': '#1D9BF0' }}
/>
```
