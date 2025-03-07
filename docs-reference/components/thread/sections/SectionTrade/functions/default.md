[**solana-social-kit**](../../../../../README.md)

***

[solana-social-kit](../../../../../README.md) / [components/thread/sections/SectionTrade](../README.md) / default

# Function: default()

> **default**(`__namedParameters`): `Element`

Defined in: [src/components/thread/sections/SectionTrade.tsx:52](https://github.com/SendArcade/solana-social-starter/blob/03568260ca96ed63f77049843c721de1cb011893/src/components/thread/sections/SectionTrade.tsx#L52)

A component that renders a trade card in a post section

## Parameters

### \_\_namedParameters

`SectionTradeProps`

## Returns

`Element`

## Component

## Description

SectionTrade displays a trade card with optional text content in a post.
The trade card shows detailed information about a token swap, including
input and output tokens, quantities, and USD values. The component uses
the TradeCard component to render the actual trade details.

Features:
- Text and trade card combination
- Optional text content
- Detailed trade information display
- Missing data handling
- Consistent styling

## Example

```tsx
<SectionTrade
  text="Just executed this trade!"
  tradeData={{
    inputMint: "So11111111111111111111111111111111111111112",
    outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    inputSymbol: "SOL",
    outputSymbol: "USDC",
    inputQuantity: "1.5",
    outputQuantity: "30.5",
    inputUsdValue: "$45.00",
    outputUsdValue: "$30.50"
  }}
/>
```
