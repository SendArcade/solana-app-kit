[**solana-social-kit**](../../../../README.md)

***

[solana-social-kit](../../../../README.md) / [components/pumpfun/PumpfunCard](../README.md) / PumpfunCard

# Function: PumpfunCard()

> **PumpfunCard**(`props`, `deprecatedLegacyContext`?): `ReactNode`

Defined in: [src/components/pumpfun/PumpfunCard.tsx:31](https://github.com/SendArcade/solana-social-starter/blob/03568260ca96ed63f77049843c721de1cb011893/src/components/pumpfun/PumpfunCard.tsx#L31)

A card component used in the Pumpfun feature

## Parameters

### props

[`PumpfunCardProps`](../interfaces/PumpfunCardProps.md)

### deprecatedLegacyContext?

`any`

**Deprecated**

**See**

[React Docs](https://legacy.reactjs.org/docs/legacy-context.html#referencing-context-in-lifecycle-methods)

## Returns

`ReactNode`

## Component

## Description

PumpfunCard is a container component that provides a consistent card-like appearance
for content in the Pumpfun feature. It supports custom styling through the containerStyle
prop and can contain any child components.

## Example

```tsx
<PumpfunCard containerStyle={styles.customCard}>
  <Text>Card Content</Text>
</PumpfunCard>
```
