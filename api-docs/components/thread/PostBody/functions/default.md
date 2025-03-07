[**solana-social-kit**](../../../../README.md)

***

[solana-social-kit](../../../../README.md) / [components/thread/PostBody](../README.md) / default

# Function: default()

> **default**(`__namedParameters`): `Element`

Defined in: [src/components/thread/PostBody.tsx:56](https://github.com/SendArcade/solana-social-starter/blob/98f94bb63d3814df24512365f6ae706d273e698f/src/components/thread/PostBody.tsx#L56)

A component that renders the body content of a post in a thread

## Parameters

### \_\_namedParameters

`PostBodyProps`

## Returns

`Element`

## Component

## Description

PostBody handles the rendering of different types of content sections in a post,
including text, images, videos, polls, trades, and NFT listings. It supports
multiple sections per post and delegates rendering to specialized section components.

Features:
- Multiple content section support
- Section type-specific rendering
- Customizable styling
- Responsive layout

Supported Section Types:
- TEXT_ONLY: Plain text content
- TEXT_IMAGE: Text with an image
- TEXT_VIDEO: Text with a video
- TEXT_TRADE: Trade information
- POLL: Poll data
- NFT_LISTING: NFT listing details

## Example

```tsx
<PostBody
  post={postData}
  themeOverrides={{ '--primary-color': '#1D9BF0' }}
/>
```
