# Test Files for Image Converters

These test files are used to verify the image converter tools work correctly.

## Test Files Created:

| File | Format | Size | Notes |
|------|--------|------|--------|
| test.jpg | JPEG | 21K | Standard JPEG image with shapes and text |
| test.jpeg | JPEG | 21K | Same as test.jpg (alternate extension) |
| test.png | PNG | 37K | PNG with alpha channel/transparency |
| test.bmp | BMP | 352K | Uncompressed bitmap format |
| test.gif | GIF | 143K | Animated GIF with rotation effect |
| test.ico | ICO | 12K | Icon format (64x64) |
| test.webp | WebP | 8.6K | Modern web format |
| test.avif | AVIF | 21K | Next-gen image format |
| test.heic | HEIC | 21K | Apple's high-efficiency format |
| test.heif | HEIF | 21K | High Efficiency Image Format |

## How to Test Converters:

1. **Start the dev server**: `pnpm dev`
2. **Navigate to converter pages** at http://localhost:3000/tools/[converter-name]
3. **Test each converter**:
   - JPG → PNG: Upload test.jpg
   - PNG → JPG: Upload test.png
   - BMP → JPG: Upload test.bmp
   - BMP → PNG: Upload test.bmp
   - ICO → PNG: Upload test.ico
   - GIF → JPG: Upload test.gif (should extract first frame)
   - GIF → WebP: Upload test.gif
   - PNG → WebP: Upload test.png
   - JPG → WebP: Upload test.jpg
   - JPEG → WebP: Upload test.jpeg
   - AVIF → JPG: Upload test.avif
   - AVIF → JPEG: Upload test.avif
   - HEIC → JPG: Upload test.heic
   - HEIC → JPEG: Upload test.heic
   - HEIC → PNG: Upload test.heic
   - HEIC → PDF: Upload test.heic

## Expected Results:
- Files should convert successfully
- Output should maintain image quality
- Transparency should be preserved where applicable (PNG outputs)
- Animated GIFs should convert first frame for static formats
- No errors in browser console