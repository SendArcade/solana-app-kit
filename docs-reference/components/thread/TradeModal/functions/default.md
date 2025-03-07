[**solana-social-kit**](../../../../README.md)

***

[solana-social-kit](../../../../README.md) / [components/thread/TradeModal](../README.md) / default

# Function: default()

> **default**(`__namedParameters`): `Element`

Defined in: [src/components/thread/TradeModal.tsx:84](https://github.com/SendArcade/solana-social-starter/blob/03568260ca96ed63f77049843c721de1cb011893/src/components/thread/TradeModal.tsx#L84)

A modal component for executing token trades and sharing them on the feed

## Parameters

### \_\_namedParameters

`TradeModalProps`

## Returns

`Element`

## Component

## Description

TradeModal provides a user interface for executing token swaps using Jupiter aggregator
and sharing the trade details on the social feed. It supports token selection, amount input,
and automatic post creation after successful trades.

Features:
- Token selection for input and output
- Real-time price quotes
- Trade execution via Jupiter aggregator
- Automatic trade post creation
- USD value calculation
- Customizable appearance

## Example

```tsx
<TradeModal
  visible={showTradeModal}
  onClose={() => setShowTradeModal(false)}
  currentUser={user}
  onPostCreated={() => refetchPosts()}
  initialInputToken={solToken}
  initialOutputToken={usdcToken}
/>
```
