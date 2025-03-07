[**solana-social-kit**](../../../../README.md)

***

[solana-social-kit](../../../../README.md) / [components/TradeCard/TradeCard](../README.md) / default

# Function: default()

> **default**(`__namedParameters`): `Element`

Defined in: [src/components/TradeCard/TradeCard.tsx:127](https://github.com/SendArcade/solana-social-starter/blob/98f94bb63d3814df24512365f6ae706d273e698f/src/components/TradeCard/TradeCard.tsx#L127)

A component that displays a trading card interface for token pairs

## Parameters

### \_\_namedParameters

[`TradeCardProps`](../interfaces/TradeCardProps.md)

## Returns

`Element`

## Component

## Description

TradeCard provides a user interface for displaying and comparing two tokens
in a trading pair. It shows token information including avatars, names,
and prices in both USD and SOL. The component features a swap icon between
the tokens and supports customizable styling through various override props.

The component is designed to be flexible with customizable themes and styles,
making it adaptable to different design requirements.

## Example

```tsx
<TradeCard
  token1={{
    avatar: require('./token1.png'),
    name: 'SOL',
    priceUsd: '$100'
  }}
  token2={{
    avatar: require('./token2.png'),
    name: 'USDC',
    priceUsd: '$1',
    priceSol: '0.01'
  }}
  onTrade={() => console.log('Trade initiated')}
/>
```
