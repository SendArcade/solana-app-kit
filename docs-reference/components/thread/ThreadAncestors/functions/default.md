[**solana-social-kit**](../../../../README.md)

***

[solana-social-kit](../../../../README.md) / [components/thread/ThreadAncestors](../README.md) / default

# Function: default()

> **default**(`__namedParameters`): `null` \| `Element`

Defined in: [src/components/thread/ThreadAncestors.tsx:48](https://github.com/SendArcade/solana-social-starter/blob/03568260ca96ed63f77049843c721de1cb011893/src/components/thread/ThreadAncestors.tsx#L48)

A component that displays the chain of users being replied to in a thread

## Parameters

### \_\_namedParameters

`ThreadAncestorsProps`

## Returns

`null` \| `Element`

## Component

## Description

ThreadAncestors shows a list of users that a post is replying to in a thread.
It traverses up the reply chain to find all unique users being referenced
and displays their handles in a comma-separated list.

Features:
- Ancestor chain traversal
- Unique user handle filtering
- Customizable styling
- Null handling for root posts

## Example

```tsx
<ThreadAncestors
  post={currentPost}
  rootPosts={allPosts}
  themeOverrides={{ '--primary-color': '#1D9BF0' }}
/>
```
