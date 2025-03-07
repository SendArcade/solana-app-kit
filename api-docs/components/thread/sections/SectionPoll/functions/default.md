[**solana-social-kit**](../../../../../README.md)

***

[solana-social-kit](../../../../../README.md) / [components/thread/sections/SectionPoll](../README.md) / default

# Function: default()

> **default**(`__namedParameters`): `Element`

Defined in: [src/components/thread/sections/SectionPoll.tsx:42](https://github.com/SendArcade/solana-social-starter/blob/98f94bb63d3814df24512365f6ae706d273e698f/src/components/thread/sections/SectionPoll.tsx#L42)

A component that renders a poll in a post section

## Parameters

### \_\_namedParameters

`SectionPollProps`

## Returns

`Element`

## Component

## Description

SectionPoll displays a poll with a question and multiple options in a post.
Each option shows the number of votes it has received, and the entire poll
is displayed in a styled container with a light background.

Features:
- Question display
- Multiple options support
- Vote count display
- Consistent styling
- Missing data handling

## Example

```tsx
<SectionPoll
  pollData={{
    question: "What's your favorite color?",
    options: ["Red", "Blue", "Green"],
    votes: [10, 15, 8]
  }}
/>
```
