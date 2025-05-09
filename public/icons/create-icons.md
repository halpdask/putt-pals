
# PWA Icon Placeholders

This folder contains placeholder icons for the PWA. You should replace these with your actual app icons.

For now, you can create simple placeholder icons using this command in your terminal:

```bash
mkdir -p public/icons
for size in 72 96 128 144 152 192 384 512; do
  convert -size ${size}x${size} canvas:green -fill white -gravity center -draw "text 0,0 'P-P'" public/icons/icon-${size}x${size}.png
done
```

Or you can manually create icons with these dimensions:
- 72x72
- 96x96
- 128x128
- 144x144
- 152x152
- 192x192
- 384x384
- 512x512

And place them in this folder with the naming convention: icon-[size]x[size].png
