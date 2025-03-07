[**solana-social-kit**](../../../../README.md)

***

[solana-social-kit](../../../../README.md) / [components/thread/SelectTokenModal](../README.md) / default

# Function: default()

> **default**(`__namedParameters`): `Element`

Defined in: [src/components/thread/SelectTokenModal.tsx:69](https://github.com/SendArcade/solana-social-starter/blob/03568260ca96ed63f77049843c721de1cb011893/src/components/thread/SelectTokenModal.tsx#L69)

A modal component for selecting tokens from a list of verified tokens

## Parameters

### \_\_namedParameters

`SelectTokenModalProps`

## Returns

`Element`

## Component

## Description

SelectTokenModal provides a searchable interface for selecting tokens from a list
of verified tokens fetched from Jupiter's API. It supports searching by symbol,
name, or address, and displays token logos and details.

Features:
- Search functionality
- Token logo display
- Token details (symbol, name)
- Loading state handling
- Responsive layout

## Example

```tsx
<SelectTokenModal
  visible={showTokenModal}
  onClose={() => setShowTokenModal(false)}
  onTokenSelected={(token) => setSelectedToken(token)}
/>
```
