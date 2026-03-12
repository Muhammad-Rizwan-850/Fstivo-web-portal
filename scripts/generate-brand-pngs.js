const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const brandDir = path.join('/home/rizwan/attempt_02', 'public', 'brand');

// Define SVG files and their PNG output configurations
const conversions = [
  // Original icon - all sizes
  { svg: 'fstivo-icon.svg', outputs: [
    { size: 192, name: 'fstivo-icon-192.png' },
    { size: 256, name: 'fstivo-icon-256.png' },
    { size: 512, name: 'fstivo-icon-512.png' }
  ]},
  // Dark icon - all sizes
  { svg: 'fstivo-icon-dark.svg', outputs: [
    { size: 192, name: 'fstivo-icon-dark-192.png' },
    { size: 256, name: 'fstivo-icon-dark-256.png' },
    { size: 512, name: 'fstivo-icon-dark-512.png' }
  ]},
  // White icon - all sizes
  { svg: 'fstivo-icon-white.svg', outputs: [
    { size: 192, name: 'fstivo-icon-white-192.png' },
    { size: 256, name: 'fstivo-icon-white-256.png' },
    { size: 512, name: 'fstivo-icon-white-512.png' }
  ]},
  // Original wordmark - selected sizes
  { svg: 'fstivo-wordmark.svg', outputs: [
    { size: 256, name: 'fstivo-wordmark-256.png' },
    { size: 512, name: 'fstivo-wordmark-512.png' }
  ]},
  // Dark wordmark - selected sizes
  { svg: 'fstivo-wordmark-dark.svg', outputs: [
    { size: 256, name: 'fstivo-wordmark-dark-256.png' },
    { size: 512, name: 'fstivo-wordmark-dark-512.png' }
  ]},
  // White wordmark - selected sizes
  { svg: 'fstivo-wordmark-white.svg', outputs: [
    { size: 256, name: 'fstivo-wordmark-white-256.png' },
    { size: 512, name: 'fstivo-wordmark-white-512.png' }
  ]}
];

async function convertSVGtoPNG() {
  try {
    console.log('🎨 Starting SVG to PNG conversion...\n');

    for (const { svg, outputs } of conversions) {
      const svgPath = path.join(brandDir, svg);
      
      if (!fs.existsSync(svgPath)) {
        console.warn(`⚠️  SVG not found: ${svg}`);
        continue;
      }

      console.log(`Converting ${svg}...`);

      for (const { size, name } of outputs) {
        const outputPath = path.join(brandDir, name);
        
        try {
          await sharp(svgPath)
            .resize(size, size, {
              fit: 'contain',
              background: { r: 255, g: 255, b: 255, alpha: 0 }
            })
            .png()
            .toFile(outputPath);

          console.log(`  ✅ Created ${name} (${size}x${size})`);
        } catch (err) {
          console.error(`  ❌ Failed to create ${name}:`, err.message);
        }
      }
    }

    console.log('\n✨ SVG to PNG conversion complete!\n');
    console.log('📁 Generated files:');
    const pngFiles = fs.readdirSync(brandDir).filter(f => f.endsWith('.png'));
    pngFiles.forEach(f => console.log(`   - ${f}`));
  } catch (error) {
    console.error('Error during conversion:', error);
    process.exit(1);
  }
}

convertSVGtoPNG();
