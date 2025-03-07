[**solana-social-kit**](../../../../../README.md)

***

[solana-social-kit](../../../../../README.md) / [components/thread/sections/SectionNftListing](../README.md) / default

# Function: default()

> **default**(`__namedParameters`): `Element`

Defined in: [src/components/thread/sections/SectionNftListing.tsx:49](https://github.com/SendArcade/solana-social-starter/blob/98f94bb63d3814df24512365f6ae706d273e698f/src/components/thread/sections/SectionNftListing.tsx#L49)

A component that renders an NFT listing card in a post section

## Parameters

### \_\_namedParameters

`SectionNftListingProps`

## Returns

`Element`

## Component

## Description

SectionNftListing displays detailed information about an NFT listing in a post.
It fetches additional NFT data from the Tensor API and shows the NFT's image,
name, collection, price, last sale, and rarity information. The component
handles loading states and errors gracefully.

Features:
- NFT image display
- Collection information
- Price and last sale data
- Rarity ranking
- Loading states
- Error handling
- Responsive layout

## Example

```tsx
<SectionNftListing
  listingData={{
    mint: "mint_address_here",
    name: "Cool NFT #123",
    owner: "wallet_address_here",
    priceSol: 1.5
  }}
/>
```
