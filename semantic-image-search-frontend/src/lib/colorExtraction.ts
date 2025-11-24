/**
 * Color extraction and manipulation utilities
 */

export interface ColorPalette {
  dominant: string;
  palette: string[];
}

/**
 * Extract dominant colors from an image URL
 * Uses canvas to analyze pixel data
 */
export async function extractColorsFromImage(imageUrl: string): Promise<ColorPalette> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Scale down for performance
        const maxSize = 100;
        const scale = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        const colors = extractDominantColors(imageData.data, 5);
        
        resolve({
          dominant: colors[0],
          palette: colors,
        });
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = imageUrl;
  });
}

/**
 * Extract dominant colors using simple color quantization
 */
function extractDominantColors(pixels: Uint8ClampedArray, count: number): string[] {
  const colorMap: Map<string, number> = new Map();
  
  // Sample every 4th pixel for performance
  for (let i = 0; i < pixels.length; i += 16) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const a = pixels[i + 3];
    
    // Skip transparent pixels
    if (a < 128) continue;
    
    // Quantize colors to reduce variations
    const qr = Math.round(r / 32) * 32;
    const qg = Math.round(g / 32) * 32;
    const qb = Math.round(b / 32) * 32;
    
    const color = rgbToHex(qr, qg, qb);
    colorMap.set(color, (colorMap.get(color) || 0) + 1);
  }
  
  // Sort by frequency and return top colors
  return Array.from(colorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([color]) => color);
}

/**
 * Convert RGB to hex color
 */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b]
    .map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    })
    .join('');
}

/**
 * Get color name approximation
 */
export function getColorName(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return 'Unknown';
  
  const { r, g, b } = rgb;
  
  // Simple color naming based on dominant channel
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  
  // Grayscale
  if (diff < 30) {
    if (max < 50) return 'Black';
    if (max < 130) return 'Gray';
    if (max < 200) return 'Light Gray';
    return 'White';
  }
  
  // Colors
  if (r === max) {
    if (g > b) return g > 150 ? 'Yellow' : 'Orange';
    return 'Red';
  }
  if (g === max) {
    if (b > r) return 'Cyan';
    return 'Green';
  }
  if (r > g) return 'Magenta';
  return 'Blue';
}

/**
 * Convert hex to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Check if color is light or dark
 */
export function isLightColor(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return true;
  
  // Calculate perceived brightness
  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return brightness > 128;
}
