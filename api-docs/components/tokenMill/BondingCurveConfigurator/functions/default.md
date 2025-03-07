[**solana-social-kit**](../../../../README.md)

***

[solana-social-kit](../../../../README.md) / [components/tokenMill/BondingCurveConfigurator](../README.md) / default

# Function: default()

> **default**(`__namedParameters`): `Element`

Defined in: [src/components/tokenMill/BondingCurveConfigurator.tsx:87](https://github.com/SendArcade/solana-social-starter/blob/98f94bb63d3814df24512365f6ae706d273e698f/src/components/tokenMill/BondingCurveConfigurator.tsx#L87)

A component for configuring bonding curves with visual feedback

## Parameters

### \_\_namedParameters

`BondingCurveConfiguratorProps`

## Returns

`Element`

## Component

## Description

BondingCurveConfigurator provides an interactive interface for configuring
bonding curves with real-time visual feedback. It supports multiple curve types
and allows users to adjust various parameters through sliders.

Features:
- Multiple curve types (linear, power, exponential, logarithmic)
- Real-time curve visualization
- Adjustable parameters:
  - Number of points
  - Base price
  - Top price
  - Power (for power curves)
  - Fee percentage
- Platform-specific optimizations
- Loading states
- Customizable styling

## Example

```tsx
<BondingCurveConfigurator
  onCurveChange={(askPrices, bidPrices) => {
    console.log('New curve prices:', {askPrices, bidPrices});
  }}
/>
```
