# Test URLs and Files for 10 New Converters

## Testing Instructions
1. Start dev server: `npm run dev`
2. Open each URL below
3. Upload the corresponding test file
4. Verify conversion works

## Converters and Test Files

| Tool | URL | Test File | test|
|------|-----|-----------|--|
| **WebP to JPG** | http://localhost:3000/tools/webp-to-jpg | `tests/files/test.webp` | works |
| **PDF to JPG** | http://localhost:3000/tools/pdf-to-jpg | `tests/files/test.pdf` | doesnt work |
| **PNG to PDF** | http://localhost:3000/tools/png-to-pdf | `tests/files/test.png` | works |
| **WebP to GIF** | http://localhost:3000/tools/webp-to-gif | `tests/files/test.webp`works |
| **PNG to GIF** | http://localhost:3000/tools/png-to-gif | `tests/files/test.png` | works |
| **BMP to PDF** | http://localhost:3000/tools/bmp-to-pdf | `tests/files/test.bmp` |  |
| **ICO to JPG** | http://localhost:3000/tools/ico-to-jpg | `tests/files/test.ico` |  |
| **JPEG to GIF** | http://localhost:3000/tools/jpeg-to-gif | `tests/files/test.jpeg` |
| **SVG to PNG** | http://localhost:3000/tools/svg-to-png | `tests/files/test.svg` |  |
| **SVG to JPG** | http://localhost:3000/tools/svg-to-jpg | `tests/files/test.svg` |  |

## Quick Copy-Paste URLs
```
http://localhost:3000/tools/webp-to-jpg
http://localhost:3000/tools/pdf-to-jpg
http://localhost:3000/tools/png-to-pdf
http://localhost:3000/tools/webp-to-gif
http://localhost:3000/tools/png-to-gif
http://localhost:3000/tools/bmp-to-pdf
http://localhost:3000/tools/ico-to-jpg
http://localhost:3000/tools/jpeg-to-gif
http://localhost:3000/tools/svg-to-png
http://localhost:3000/tools/svg-to-jpg
```

## All Test Files Available
```bash
ls tests/files/
```
- test.avif
- test.bmp
- test.gif
- test.heic
- test.heif
- test.ico
- test.jpeg
- test.jpg
- test.pdf (created)
- test.png
- test.svg (created)
- test.webp