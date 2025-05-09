

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

### Using Bash (macOS/Linux)

If you have a high-resolution version of your logo and ImageMagick installed, you can use this bash script:

```bash
mkdir -p public/icons
for size in 72 96 128 144 152 192 384 512; do
  convert your-high-res-logo.png -resize ${size}x${size} public/icons/icon-${size}x${size}.png
done
```

### Using PowerShell (Windows)

If you're on Windows and have ImageMagick installed, you can use this PowerShell script:

```powershell
# Create the icons directory if it doesn't exist
if (-not (Test-Path -Path "public\icons")) {
    New-Item -ItemType Directory -Path "public\icons" -Force
}

# Define the required icon sizes
$sizes = 72, 96, 128, 144, 152, 192, 384, 512

# Check which ImageMagick command is available
$magickCommand = ""
if (Get-Command "magick" -ErrorAction SilentlyContinue) {
    $magickCommand = "magick"
} elseif (Get-Command "convert" -ErrorAction SilentlyContinue) {
    $magickCommand = "convert"
} elseif (Test-Path "C:\Program Files\ImageMagick-*\magick.exe") {
    # Find the ImageMagick installation
    $magickPath = Get-ChildItem "C:\Program Files\ImageMagick-*\magick.exe" | Sort-Object -Property FullName -Descending | Select-Object -First 1 -ExpandProperty FullName
    $magickCommand = "`"$magickPath`""
} else {
    Write-Host "ImageMagick not found. Please install it from https://imagemagick.org/script/download.php and add it to your PATH." -ForegroundColor Red
    exit
}

# Generate each icon size
foreach ($size in $sizes) {
    Write-Host "Generating ${size}x${size} icon..."
    if ($magickCommand -eq "magick") {
        Invoke-Expression "$magickCommand convert your-high-res-logo.png -resize ${size}x${size} public\icons\icon-${size}x${size}.png"
    } else {
        Invoke-Expression "$magickCommand your-high-res-logo.png -resize ${size}x${size} public\icons\icon-${size}x${size}.png"
    }
}

Write-Host "Icon generation complete!" -ForegroundColor Green
```

Note: Make sure to install ImageMagick for Windows from https://imagemagick.org/script/download.php and ensure it's in your PATH before running the script.

Make sure your icons are clear, recognizable, and have appropriate padding for best appearance on all devices.

