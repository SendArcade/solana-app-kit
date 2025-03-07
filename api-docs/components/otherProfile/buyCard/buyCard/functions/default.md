[**solana-social-kit**](../../../../../README.md)

***

[solana-social-kit](../../../../../README.md) / [components/otherProfile/buyCard/buyCard](../README.md) / default

# Function: default()

> **default**(): `Element`

Defined in: [src/components/otherProfile/buyCard/buyCard.tsx:33](https://github.com/SendArcade/solana-social-starter/blob/98f94bb63d3814df24512365f6ae706d273e698f/src/components/otherProfile/buyCard/buyCard.tsx#L33)

A card component for purchasing creator coins

## Returns

`Element`

## Component

## Description

BuyCard is a component that displays information about a creator's coin
and provides purchase functionality. Features include:
- Creator profile image display
- Coin name and description
- Buy button for direct purchase
- Animated expandable arrow for additional information

The component includes smooth animations for the arrow rotation and
maintains its own state for the expanded/collapsed view.

## Example

```tsx
<BuyCard />
```

Note: Currently uses hardcoded values for the Yash coin.
Future iterations could accept props for:
- Creator information
- Coin details
- Buy action callback
