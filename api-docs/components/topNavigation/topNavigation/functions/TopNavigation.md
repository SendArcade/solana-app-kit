[**solana-social-kit**](../../../../README.md)

***

[solana-social-kit](../../../../README.md) / [components/topNavigation/topNavigation](../README.md) / TopNavigation

# Function: TopNavigation()

> **TopNavigation**(`props`, `deprecatedLegacyContext`?): `ReactNode`

Defined in: [src/components/topNavigation/topNavigation.tsx:40](https://github.com/SendArcade/solana-social-starter/blob/98f94bb63d3814df24512365f6ae706d273e698f/src/components/topNavigation/topNavigation.tsx#L40)

A navigation bar component for the top of the screen

## Parameters

### props

`TopNavigationProps`

### deprecatedLegacyContext?

`any`

**Deprecated**

**See**

[React Docs](https://legacy.reactjs.org/docs/legacy-context.html#referencing-context-in-lifecycle-methods)

## Returns

`ReactNode`

## Component

## Description

TopNavigation provides a consistent navigation bar at the top of the screen.
The component features:
- Section name display with customizable text
- Back arrow navigation
- Contextual icons based on view:
  - Messages icon
  - Notifications bell
  - Menu dots

The component adapts its display based on whether a section name is provided,
showing different sets of icons accordingly.

## Example

```tsx
// With section name
<TopNavigation sectionName="Profile" />

// Without section name (shows all icons)
<TopNavigation />
```
