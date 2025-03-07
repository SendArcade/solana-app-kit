[**solana-social-kit**](../../../README.md)

***

[solana-social-kit](../../../README.md) / [components/PriorityFeeSelector](../README.md) / default

# Function: default()

> **default**(): `Element`

Defined in: [src/components/PriorityFeeSelector.tsx:29](https://github.com/SendArcade/solana-social-starter/blob/03568260ca96ed63f77049843c721de1cb011893/src/components/PriorityFeeSelector.tsx#L29)

A component that allows users to select transaction fee tiers for Solana transactions

## Returns

`Element`

## Component

## Description

PriorityFeeSelector provides a user interface for selecting different transaction fee tiers
on the Solana network. It offers four options: low, medium, high, and very-high, with
visual feedback for the selected option.

The component integrates with Redux for state management and updates the global
transaction fee preference when a user selects a different tier.

## Example

```tsx
<PriorityFeeSelector />
```
