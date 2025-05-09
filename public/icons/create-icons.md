
# PWA Icon Instructions

This folder contains the PWA app icons in various sizes required for different devices and display scenarios.

## Icon Sizes Required

The following icon sizes are used by the PWA:
- 72x72
- 96x96
- 128x128
- 144x144
- 152x152
- 192x192
- 384x384
- 512x512

## How to Create New Icons

To replace the current placeholder icons with your own logo:

1. Create your logo image in each of the required sizes
2. Save each file using the naming convention: `icon-[size]x[size].png`
3. Place them in this folder (`public/icons/`)

You can use design software like Figma, Sketch, Adobe Illustrator, or Photoshop to create these icons.

## Quick Generation Method

If you have a high-resolution version of your logo, you can use tools like ImageMagick to generate all sizes:

```bash
mkdir -p public/icons
for size in 72 96 128 144 152 192 384 512; do
  convert your-high-res-logo.png -resize ${size}x${size} public/icons/icon-${size}x${size}.png
done
```

Make sure your icons are clear, recognizable, and have appropriate padding for best appearance on all devices.
