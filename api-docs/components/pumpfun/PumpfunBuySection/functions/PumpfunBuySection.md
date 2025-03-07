[**solana-social-kit**](../../../../README.md)

***

[solana-social-kit](../../../../README.md) / [components/pumpfun/PumpfunBuySection](../README.md) / PumpfunBuySection

# Function: PumpfunBuySection()

> **PumpfunBuySection**(`props`, `deprecatedLegacyContext`?): `ReactNode`

Defined in: [src/components/pumpfun/PumpfunBuySection.tsx:58](https://github.com/SendArcade/solana-social-starter/blob/98f94bb63d3814df24512365f6ae706d273e698f/src/components/pumpfun/PumpfunBuySection.tsx#L58)

A component that provides a user interface for buying tokens through Pump.fun

## Parameters

### props

[`PumpfunBuySectionProps`](../interfaces/PumpfunBuySectionProps.md)

### deprecatedLegacyContext?

`any`

**Deprecated**

**See**

[React Docs](https://legacy.reactjs.org/docs/legacy-context.html#referencing-context-in-lifecycle-methods)

## Returns

`ReactNode`

## Component

## Description

PumpfunBuySection is a form component that allows users to purchase tokens
through the Pump.fun platform. It provides input fields for token address
and SOL amount, with clipboard integration for easy data entry.

Features:
- Token address input with paste functionality
- SOL amount input with decimal support
- Input validation
- Clipboard integration
- Customizable styling
- Error handling and user feedback

## Example

```tsx
<PumpfunBuySection
  containerStyle={styles.customContainer}
  inputStyle={styles.customInput}
  buttonStyle={styles.customButton}
  buyButtonLabel="Purchase Token"
/>
```
