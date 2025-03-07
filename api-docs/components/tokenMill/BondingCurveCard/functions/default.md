[**solana-social-kit**](../../../../README.md)

***

[solana-social-kit](../../../../README.md) / [components/tokenMill/BondingCurveCard](../README.md) / default

# Function: default()

> **default**(`__namedParameters`): `Element`

Defined in: [src/components/tokenMill/BondingCurveCard.tsx:56](https://github.com/SendArcade/solana-social-starter/blob/98f94bb63d3814df24512365f6ae706d273e698f/src/components/tokenMill/BondingCurveCard.tsx#L56)

A component for configuring and setting bonding curves for token markets

## Parameters

### \_\_namedParameters

`BondingCurveCardProps`

## Returns

`Element`

## Component

## Description

BondingCurveCard provides an interface for configuring and setting bonding curves
for token markets. It combines a configurator component for setting ask and bid
prices with functionality to commit these settings to the blockchain.

Features:
- Bonding curve configuration
- Ask and bid price management
- On-chain curve setting
- Loading state handling
- Error handling
- Customizable styling

## Example

```tsx
<BondingCurveCard
  marketAddress="market_address_here"
  connection={solanaConnection}
  publicKey={userPublicKey}
  solanaWallet={wallet}
  setLoading={setIsLoading}
/>
```
