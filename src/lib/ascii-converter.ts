export interface ASCIISettings {
  characterSet: string;
  pixelSize: number;
  colorMode: 'original' | 'monochrome' | 'gradient' | 'custom';
  monochromeColor: string;
  gradientColors: string[];
  backgroundColor: string;
  transparentBackground: boolean;
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay' | 'difference';
  contrast: number;
  brightness: number;
  invert: boolean;
  fontSize: number;
}

export const DEFAULT_SETTINGS: ASCIISettings = {
  characterSet: '.:-=+*#%@',
  pixelSize: 8,
  colorMode: 'original',
  monochromeColor: '#00ff88',
  gradientColors: ['#00ff88', '#ff00ff', '#00ffff'],
  backgroundColor: '#0a0a0f',
  transparentBackground: false,
  blendMode: 'normal',
  contrast: 1,
  brightness: 1,
  invert: false,
  fontSize: 10,
};

export const CHARACTER_PRESETS: Record<string, string> = {
  standard: '.:-=+*#%@',
  blocks: '░▒▓█',
  detailed: '.",:;!~+-xmo*#W&8@',
  minimal: '.-:=+#@',
  binary: '01',
  custom: '',
};

// Standard monospace font aspect ratio (width / height)
const CHAR_ASPECT_RATIO = 0.6;

export function rgbToGrayscale(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export function applyBrightness(value: number, brightness: number): number {
  return Math.min(255, Math.max(0, value * brightness));
}

export function applyContrast(value: number, contrast: number): number {
  // Handle neutral contrast (1.0) as no-op
  if (Math.abs(contrast - 1.0) < 0.001) {
    return value;
  }
  
  // Standard contrast formula: factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255))
  // But we need to handle the case where contrast != 1.0 properly
  // Simplified formula: factor = contrast, then apply: factor * (value - 128) + 128
  // For proper contrast adjustment, we use: ((value - 128) * contrast) + 128
  const adjusted = ((value - 128) * contrast) + 128;
  return Math.min(255, Math.max(0, adjusted));
}

export function getCharacterForBrightness(
  brightness: number,
  characterSet: string,
  invert: boolean
): string {
  if (characterSet.length === 0) return ' ';
  if (characterSet.length === 1) return characterSet[0];
  
  const normalizedBrightness = Math.min(255, Math.max(0, brightness)) / 255;
  const adjustedBrightness = invert ? 1 - normalizedBrightness : normalizedBrightness;
  const index = Math.round(adjustedBrightness * (characterSet.length - 1));
  return characterSet[Math.min(Math.max(0, index), characterSet.length - 1)];
}

export function interpolateGradient(
  colors: string[],
  position: number
): string {
  if (colors.length === 0) return '#ffffff';
  if (colors.length === 1) return colors[0];
  
  const scaledPosition = position * (colors.length - 1);
  const index = Math.floor(scaledPosition);
  const t = scaledPosition - index;
  
  if (index >= colors.length - 1) return colors[colors.length - 1];
  
  const color1 = hexToRgb(colors[index]);
  const color2 = hexToRgb(colors[index + 1]);
  
  const r = Math.round(color1.r + (color2.r - color1.r) * t);
  const g = Math.round(color1.g + (color2.g - color1.g) * t);
  const b = Math.round(color1.b + (color2.b - color1.b) * t);
  
  return rgbToHex(r, g, b);
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 255, g: 255, b: 255 };
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

export function applyBlendMode(
  sourceR: number,
  sourceG: number,
  sourceB: number,
  mode: ASCIISettings['blendMode']
): { r: number; g: number; b: number } {
  switch (mode) {
    case 'multiply':
      return {
        r: (sourceR * sourceR) / 255,
        g: (sourceG * sourceG) / 255,
        b: (sourceB * sourceB) / 255,
      };
    case 'screen':
      return {
        r: 255 - ((255 - sourceR) * (255 - sourceR)) / 255,
        g: 255 - ((255 - sourceG) * (255 - sourceG)) / 255,
        b: 255 - ((255 - sourceB) * (255 - sourceB)) / 255,
      };
    case 'overlay':
      return {
        r: sourceR < 128 ? (2 * sourceR * sourceR) / 255 : 255 - (2 * (255 - sourceR) * (255 - sourceR)) / 255,
        g: sourceG < 128 ? (2 * sourceG * sourceG) / 255 : 255 - (2 * (255 - sourceG) * (255 - sourceG)) / 255,
        b: sourceB < 128 ? (2 * sourceB * sourceB) / 255 : 255 - (2 * (255 - sourceB) * (255 - sourceB)) / 255,
      };
    case 'difference':
      return {
        r: Math.abs(sourceR - 128),
        g: Math.abs(sourceG - 128),
        b: Math.abs(sourceB - 128),
      };
    default:
      return { r: sourceR, g: sourceG, b: sourceB };
  }
}

export interface ASCIIChar {
  char: string;
  color: string;
  x: number;
  y: number;
}

export function convertFrameToASCII(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: ASCIISettings
): ASCIIChar[][] {
  const { pixelSize, characterSet, colorMode, contrast, brightness, invert, blendMode } = settings;
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;
  
  // To maintain aspect ratio, we sample blocks that match the character's aspect ratio
  const stepX = pixelSize;
  const stepY = pixelSize / CHAR_ASPECT_RATIO;
  
  const cols = Math.floor(width / stepX);
  const rows = Math.floor(height / stepY);
  const result: ASCIIChar[][] = [];
  
  for (let y = 0; y < rows; y++) {
    const row: ASCIIChar[] = [];
    for (let x = 0; x < cols; x++) {
      const pixelX = Math.floor(x * stepX);
      const pixelY = Math.floor(y * stepY);
      
      let totalR = 0, totalG = 0, totalB = 0, count = 0;
      
      const blockWidth = Math.ceil(stepX);
      const blockHeight = Math.ceil(stepY);
      
      for (let py = 0; py < blockHeight && pixelY + py < height; py++) {
        for (let px = 0; px < blockWidth && pixelX + px < width; px++) {
          const i = ((pixelY + py) * width + (pixelX + px)) * 4;
          totalR += pixels[i];
          totalG += pixels[i + 1];
          totalB += pixels[i + 2];
          count++;
        }
      }
      
      if (count === 0) continue;

      let avgR = totalR / count;
      let avgG = totalG / count;
      let avgB = totalB / count;
      
      const blended = applyBlendMode(avgR, avgG, avgB, blendMode);
      avgR = blended.r;
      avgG = blended.g;
      avgB = blended.b;
      
      let gray = rgbToGrayscale(avgR, avgG, avgB);
      gray = applyBrightness(gray, brightness);
      gray = applyContrast(gray, contrast);
      
      const char = getCharacterForBrightness(gray, characterSet, invert);
      
      let color: string;
      switch (colorMode) {
        case 'monochrome':
          color = settings.monochromeColor;
          break;
        case 'gradient':
          color = interpolateGradient(settings.gradientColors, gray / 255);
          break;
        case 'custom':
          color = settings.monochromeColor;
          break;
        default:
          color = rgbToHex(Math.round(avgR), Math.round(avgG), Math.round(avgB));
      }
      
      row.push({ char, color, x: pixelX, y: pixelY });
    }
    result.push(row);
  }
  
  return result;
}

export function renderASCIIToCanvas(
  outputCtx: CanvasRenderingContext2D,
  asciiChars: ASCIIChar[][],
  settings: ASCIISettings,
  outputWidth: number,
  outputHeight: number
): void {
  const { backgroundColor, transparentBackground } = settings;
  
  if (transparentBackground) {
    outputCtx.clearRect(0, 0, outputWidth, outputHeight);
  } else {
    outputCtx.fillStyle = backgroundColor;
    outputCtx.fillRect(0, 0, outputWidth, outputHeight);
  }
  
  if (asciiChars.length === 0 || asciiChars[0].length === 0) return;

  const cols = asciiChars[0].length;
  const rows = asciiChars.length;

  // Calculate the actual size of each cell in the output
  const cellWidth = outputWidth / cols;
  const cellHeight = outputHeight / rows;

  // Use the cellHeight as font size, but we might need to adjust for the aspect ratio
  // Since our cells were sampled at 0.6 ratio, cellWidth / cellHeight should be approx 0.6
  const fontSize = cellHeight;
  outputCtx.font = `${fontSize}px "JetBrains Mono", monospace`;
  outputCtx.textBaseline = 'top';
  outputCtx.textAlign = 'left';

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const { char, color } = asciiChars[y][x];
      outputCtx.fillStyle = color;
      
      // Center the character in its cell if needed, but for mono font
      // just drawing at (x * cellWidth, y * cellHeight) should work if font matches
      outputCtx.fillText(
        char,
        x * cellWidth,
        y * cellHeight
      );
    }
  }
}
