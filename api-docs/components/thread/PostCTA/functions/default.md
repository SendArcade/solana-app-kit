[**solana-social-kit**](../../../../README.md)

***

[solana-social-kit](../../../../README.md) / [components/thread/PostCTA](../README.md) / default

# Function: default()

> **default**(`__namedParameters`): `null` \| `Element`

Defined in: [src/components/thread/PostCTA.tsx:109](https://github.com/SendArcade/solana-social-starter/blob/98f94bb63d3814df24512365f6ae706d273e698f/src/components/thread/PostCTA.tsx#L109)

A component that displays call-to-action buttons for posts with trade or NFT content

## Parameters

### \_\_namedParameters

`PostCTAProps`

## Returns

`null` \| `Element`

## Component

## Description

PostCTA renders appropriate call-to-action buttons based on the post's content type.
For trade posts, it shows a "Copy Trade" button that opens a trade modal. For NFT
listing posts, it shows a "Buy NFT" button that initiates the NFT purchase process.

Features:
- Dynamic CTA based on post content
- Trade copying functionality
- NFT purchasing integration
- Loading states and error handling
- Customizable styling

## Example

```tsx
<PostCTA
  post={postData}
  themeOverrides={{ '--primary-color': '#1D9BF0' }}
  styleOverrides={{
    button: { backgroundColor: '#1D9BF0' },
    buttonLabel: { color: 'white' }
  }}
/>
```
