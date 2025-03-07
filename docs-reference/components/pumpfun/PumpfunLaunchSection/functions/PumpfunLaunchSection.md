[**solana-social-kit**](../../../../README.md)

***

[solana-social-kit](../../../../README.md) / [components/pumpfun/PumpfunLaunchSection](../README.md) / PumpfunLaunchSection

# Function: PumpfunLaunchSection()

> **PumpfunLaunchSection**(`props`, `deprecatedLegacyContext`?): `ReactNode`

Defined in: [src/components/pumpfun/PumpfunLaunchSection.tsx:64](https://github.com/SendArcade/solana-social-starter/blob/03568260ca96ed63f77049843c721de1cb011893/src/components/pumpfun/PumpfunLaunchSection.tsx#L64)

A component that provides a user interface for launching new tokens through Pump.fun

## Parameters

### props

[`PumpfunLaunchSectionProps`](../interfaces/PumpfunLaunchSectionProps.md)

### deprecatedLegacyContext?

`any`

**Deprecated**

**See**

[React Docs](https://legacy.reactjs.org/docs/legacy-context.html#referencing-context-in-lifecycle-methods)

## Returns

`ReactNode`

## Component

## Description

PumpfunLaunchSection is a comprehensive form component that allows users to create
and launch new tokens on the Pump.fun platform. It provides a complete interface
for token creation with image upload support and initial purchase functionality.

Features:
- Token name and symbol input
- Description field
- Social media links (Twitter, Telegram)
- Website URL
- Token image upload via device gallery
- Initial purchase amount in SOL
- Loading state handling
- Input validation
- Error handling and user feedback
- Customizable styling

## Example

```tsx
<PumpfunLaunchSection
  containerStyle={styles.customContainer}
  inputStyle={styles.customInput}
  buttonStyle={styles.customButton}
  launchButtonLabel="Create Token"
/>
```
