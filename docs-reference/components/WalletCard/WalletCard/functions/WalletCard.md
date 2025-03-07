[**solana-social-kit**](../../../../README.md)

***

[solana-social-kit](../../../../README.md) / [components/WalletCard/WalletCard](../README.md) / WalletCard

# Function: WalletCard()

> **WalletCard**(`props`, `deprecatedLegacyContext`?): `ReactNode`

Defined in: [src/components/WalletCard/WalletCard.tsx:52](https://github.com/SendArcade/solana-social-starter/blob/03568260ca96ed63f77049843c721de1cb011893/src/components/WalletCard/WalletCard.tsx#L52)

A component that displays wallet information and actions

## Parameters

### props

`WalletCardProps`

### deprecatedLegacyContext?

`any`

**Deprecated**

**See**

[React Docs](https://legacy.reactjs.org/docs/legacy-context.html#referencing-context-in-lifecycle-methods)

## Returns

`ReactNode`

## Component

## Description

WalletCard is a comprehensive wallet interface component that shows the user's
portfolio balance, price changes, and provides quick access to common wallet
actions like swapping tokens, sending funds, and on-ramping fiat currency.

Features:
- Displays current portfolio balance in USD
- Shows price change and percentage change
- Provides quick access buttons for Swap, Send, and On-Ramp actions
- Integrates with Mercuryo for fiat on-ramping

## Example

```tsx
<WalletCard
  balance={1234.56}
  priceChange={23.45}
  percentageChange={1.2}
  onSwap={() => handleSwap()}
  onSend={() => handleSend()}
  onRamp={() => handleOnRamp()}
/>
```
