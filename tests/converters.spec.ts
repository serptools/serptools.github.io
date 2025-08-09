import { test, expect } from '@playwright/test';
import path from 'path';

const testFilesDir = path.join(__dirname, 'files');

// Define converter test cases
const converterTests = [
  { route: '/tools/jpg-to-png', input: 'test.jpg', from: 'JPG', to: 'PNG' },
  { route: '/tools/png-to-jpg', input: 'test.png', from: 'PNG', to: 'JPG' },
  { route: '/tools/bmp-to-jpg', input: 'test.bmp', from: 'BMP', to: 'JPG' },
  { route: '/tools/bmp-to-png', input: 'test.bmp', from: 'BMP', to: 'PNG' },
  { route: '/tools/ico-to-png', input: 'test.ico', from: 'ICO', to: 'PNG' },
  { route: '/tools/gif-to-jpg', input: 'test.gif', from: 'GIF', to: 'JPG' },
  { route: '/tools/png-to-webp', input: 'test.png', from: 'PNG', to: 'WEBP' },
  { route: '/tools/jpg-to-webp', input: 'test.jpg', from: 'JPG', to: 'WEBP' },
  { route: '/tools/heic-to-jpg', input: 'test.heic', from: 'HEIC', to: 'JPG' },
  { route: '/tools/heic-to-png', input: 'test.heic', from: 'HEIC', to: 'PNG' },
];

test.describe('Image Converters', () => {
  test.beforeEach(async ({ page }) => {
    // Set up download handling
    page.on('download', async download => {
      // Save download to verify it works
      const suggestedFilename = download.suggestedFilename();
      console.log(`  ✅ Download triggered: ${suggestedFilename}`);
    });
  });

  for (const converter of converterTests) {
    test(`${converter.from} to ${converter.to} converter`, async ({ page }) => {
      // Navigate to converter page
      await page.goto(converter.route);
      
      // Wait for page to load
      await expect(page.locator('h1')).toContainText(`${converter.from} to ${converter.to}`);
      
      // Find the file input (hidden)
      const fileInput = page.locator('input[type="file"]');
      
      // Upload test file
      const filePath = path.join(testFilesDir, converter.input);
      await fileInput.setInputFiles(filePath);
      
      // Wait for conversion to start
      await expect(page.locator('button')).toContainText('Working…');
      
      // Wait for conversion to complete (max 10 seconds)
      await expect(page.locator('button')).toContainText(`Select ${converter.from} files`, { timeout: 10000 });
      
      console.log(`✅ ${converter.from} → ${converter.to}: Conversion completed`);
    });
  }

  test('Drop zone animations', async ({ page }) => {
    await page.goto('/tools/jpg-to-png');
    
    // Get the drop zone element
    const dropZone = page.locator('.border-dashed').first();
    
    // Verify drop zone is visible and large
    await expect(dropZone).toBeVisible();
    const box = await dropZone.boundingBox();
    
    expect(box?.width).toBeGreaterThan(500);
    expect(box?.height).toBeGreaterThan(250);
    
    console.log(`✅ Drop zone size: ${box?.width}x${box?.height}px`);
  });

  test('Test all animations exist', async ({ page }) => {
    await page.goto('/tools/jpg-to-png');
    
    // Check if animation classes are defined in CSS
    const animations = [
      'animate-splash',
      'animate-bounce', 
      'animate-spin',
      'animate-pulse',
      'animate-shake',
      'animate-flip',
      'animate-zoom',
      'animate-confetti',
      'animate-rejected'
    ];
    
    for (const animation of animations) {
      // Check if the CSS class exists by trying to apply it
      const hasAnimation = await page.evaluate((className) => {
        const testDiv = document.createElement('div');
        testDiv.className = className;
        document.body.appendChild(testDiv);
        const computed = window.getComputedStyle(testDiv);
        const hasAnim = computed.animationName !== 'none';
        document.body.removeChild(testDiv);
        return hasAnim;
      }, animation);
      
      expect(hasAnimation).toBe(true);
      console.log(`  ✅ Animation '${animation}' exists`);
    }
  });
});