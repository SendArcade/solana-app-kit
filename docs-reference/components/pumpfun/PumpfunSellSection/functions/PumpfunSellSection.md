[**solana-social-kit**](../../../../README.md)

***

[solana-social-kit](../../../../README.md) / [components/pumpfun/PumpfunSellSection](../README.md) / PumpfunSellSection

# Function: PumpfunSellSection()

> **PumpfunSellSection**(`props`, `deprecatedLegacyContext`?): `ReactNode`

Defined in: [src/components/pumpfun/PumpfunSellSection.tsx:78](https://github.com/SendArcade/solana-social-starter/blob/03568260ca96ed63f77049843c721de1cb011893/src/components/pumpfun/PumpfunSellSection.tsx#L78)

A component that provides a user interface for selling tokens through Pump.fun

## Parameters

### props

[`PumpfunSellSectionProps`](../interfaces/PumpfunSellSectionProps.md)

### deprecatedLegacyContext?

`any`

**Deprecated**

**See**

[React Docs](https://legacy.reactjs.org/docs/legacy-context.html#referencing-context-in-lifecycle-methods)

## Returns

`ReactNode`

## Component

## Description

PumpfunSellSection is a form component that allows users to sell tokens
through the Pump.fun platform. It supports both manual token address entry
and pre-selected tokens, with features for amount input and fee estimation.

Features:
- Manual token address input or pre-selected token support
- Token amount input with "Max" button for pre-selected tokens
- Network fee estimation
- Input validation
- Error handling and user feedback
- Customizable styling

## Example

```tsx
// With manual token input
<PumpfunSellSection
  containerStyle={styles.customContainer}
  sellButtonLabel="Sell Now"
/>

// With pre-selected token
<PumpfunSellSection
  selectedToken={{
    mintPubkey: "5tMi...",
    uiAmount: 1000
  }}
  sellButtonLabel="Sell Token"
/>
```
