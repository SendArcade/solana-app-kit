[**solana-social-kit**](../../../../README.md)

***

[solana-social-kit](../../../../README.md) / [components/thread/PostFooter](../README.md) / default

# Function: default()

> **default**(`__namedParameters`): `Element`

Defined in: [src/components/thread/PostFooter.tsx:49](https://github.com/SendArcade/solana-social-starter/blob/03568260ca96ed63f77049843c721de1cb011893/src/components/thread/PostFooter.tsx#L49)

A component that renders the footer section of a post

## Parameters

### \_\_namedParameters

`PostFooterProps`

## Returns

`Element`

## Component

## Description

PostFooter displays engagement metrics and action buttons below a post.
It shows comment counts, like counts, and other interaction options.
The component supports customizable styling through themes and style overrides.

## Example

```tsx
<PostFooter
  post={postData}
  onPressComment={handleCommentPress}
  themeOverrides={customTheme}
/>
```
