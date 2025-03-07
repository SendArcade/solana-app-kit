[**solana-social-kit**](../../../../../README.md)

***

[solana-social-kit](../../../../../README.md) / [components/thread/sections/SectionTextVideo](../README.md) / default

# Function: default()

> **default**(`__namedParameters`): `Element`

Defined in: [src/components/thread/sections/SectionTextVideo.tsx:41](https://github.com/SendArcade/solana-social-starter/blob/98f94bb63d3814df24512365f6ae706d273e698f/src/components/thread/sections/SectionTextVideo.tsx#L41)

A component that renders text content with a video in a post section

## Parameters

### \_\_namedParameters

`SectionTextVideoProps`

## Returns

`Element`

## Component

## Description

SectionTextVideo displays a combination of text and video content in a post.
The text appears above the video, and the video is displayed in a placeholder
container with consistent styling. Currently, this component shows a placeholder
for the video player, which can be replaced with an actual video player implementation.

Features:
- Text and video combination
- Optional text content
- Placeholder video container
- Consistent styling
- Rounded corners for video container

## Example

```tsx
<SectionTextVideo
  text="Check out this amazing video!"
  videoUrl="https://example.com/video.mp4"
/>
```
