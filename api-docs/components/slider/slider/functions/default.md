[**solana-social-kit**](../../../../README.md)

***

[solana-social-kit](../../../../README.md) / [components/slider/slider](../README.md) / default

# Function: default()

> **default**(`props`): `ReactNode`

Defined in: [src/components/slider/slider.tsx:49](https://github.com/SendArcade/solana-social-starter/blob/98f94bb63d3814df24512365f6ae706d273e698f/src/components/slider/slider.tsx#L49)

A component that provides swipeable tab navigation between different sections

## Parameters

### props

`unknown`

## Returns

`ReactNode`

## Component

## Description

SwipeTabs is a component that implements a tab-based navigation system with
swipeable functionality. Features include:
- Three main sections: Posts, Collectibles, and Actions
- Smooth swipe transitions between tabs
- Custom styled tab bar with indicators
- Lazy loading of tab content
- Responsive design adapting to screen width

The component uses react-native-tab-view for the core functionality and
implements custom styling for the tab bar and content areas.

## Example

```tsx
<SwipeTabs />
```

Note: The Posts and Actions sections currently display placeholder content.
The Collectibles section is fully implemented.
