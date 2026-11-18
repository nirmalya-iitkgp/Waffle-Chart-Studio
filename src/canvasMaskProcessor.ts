import { hexToRgb } from './palettes';
import { CustomMaskGrid, CustomUnitIcon, RenderStyle } from './types';

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB safety cap

export interface ImageProcessResult {
  filledDataUrl: string;
  outlineDataUrl: string;
}

/**
 * Reads an uploaded File into a Data URL and HTMLImageElement safely.
 */
export function loadImageFromFile(
  file: File,
  allowedMimePrefixes: string[] = ['image/png', 'image/svg+xml', 'image/jpeg', 'image/webp'],
): Promise<{ dataUrl: string; image: HTMLImageElement; isSvg: boolean }> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_UPLOAD_BYTES) {
      reject(new Error('Image exceeds the 8 MB limit. Please upload a smaller asset.'));
      return;
    }

    const lowerName = file.name.toLowerCase();
    const isSvg = file.type === 'image/svg+xml' || lowerName.endsWith('.svg');
    const isAllowed =
      allowedMimePrefixes.some((prefix) => file.type === prefix) ||
      lowerName.endsWith('.png') ||
      lowerName.endsWith('.svg') ||
      lowerName.endsWith('.jpg') ||
      lowerName.endsWith('.jpeg') ||
      lowerName.endsWith('.webp');

    if (!isAllowed) {
      reject(new Error('Unsupported file format. Please upload a PNG or SVG file.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read the selected file.'));
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUrl) {
        reject(new Error('Uploaded file produced an empty data URL.'));
        return;
      }

      const img = new Image();
      img.onload = () => {
        if (img.naturalWidth === 0 || img.naturalHeight === 0) {
          reject(new Error('Image has zero dimensions and cannot be sampled.'));
          return;
        }
        resolve({ dataUrl, image: img, isSvg });
      };
      img.onerror = () => reject(new Error('Could not decode image data. Please check the file.'));
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Processes an ImageData buffer in-place or into two new ImageData buffers:
 * - Filled: tints all non-transparent pixels (alpha > threshold) to colorHex.
 * - Outline: detects boundary pixels using 4/8-neighbor alpha + Sobel gradient magnitude.
 */
export function processAlphaMaskPixels(
  srcData: Uint8ClampedArray,
  width: number,
  height: number,
  colorHex: string,
  alphaThreshold = 24,
): { filled: Uint8ClampedArray; outline: Uint8ClampedArray } {
  const { r, g, b } = hexToRgb(colorHex);
  const len = width * height * 4;
  const filled = new Uint8ClampedArray(len);
  const outline = new Uint8ClampedArray(len);

  const isOpaqueAt = (x: number, y: number): boolean => {
    if (x < 0 || y < 0 || x >= width || y >= height) return false;
    return srcData[(y * width + x) * 4 + 3] > alphaThreshold;
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const alpha = srcData[idx + 3];

      if (alpha > alphaThreshold) {
        filled[idx] = r;
        filled[idx + 1] = g;
        filled[idx + 2] = b;
        filled[idx + 3] = alpha;

        // Check 8-neighborhood for transparency boundary to detect crisp edge pixels
        let isBoundary = false;
        for (let dy = -1; dy <= 1 && !isBoundary; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            if (!isOpaqueAt(x + dx, y + dy)) {
              isBoundary = true;
              break;
            }
          }
        }

        // Also check 2px inner ring for slightly thicker legible outline at small icon sizes
        if (!isBoundary) {
          if (
            !isOpaqueAt(x - 2, y) ||
            !isOpaqueAt(x + 2, y) ||
            !isOpaqueAt(x, y - 2) ||
            !isOpaqueAt(x, y + 2)
          ) {
            isBoundary = true;
          }
        }

        if (isBoundary) {
          outline[idx] = r;
          outline[idx + 1] = g;
          outline[idx + 2] = b;
          outline[idx + 3] = alpha;
        }
      }
    }
  }

  return { filled, outline };
}

/**
 * Renders a tinted or outlined PNG Data URL for a custom uploaded unit icon
 * using an offscreen HTML5 Canvas.
 */
export function renderCustomIconVariant(
  sourceDataUrl: string,
  colorHex: string,
  renderStyle: RenderStyle,
  targetSize = 96,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetSize;
      canvas.height = targetSize;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        reject(new Error('HTML5 Canvas 2D context is unavailable.'));
        return;
      }

      ctx.clearRect(0, 0, targetSize, targetSize);

      // Fit preserving aspect ratio with 4px safety padding so edge outline never clips
      const pad = 4;
      const avail = targetSize - pad * 2;
      const scale = Math.min(avail / img.naturalWidth, avail / img.naturalHeight);
      const drawW = img.naturalWidth * scale;
      const drawH = img.naturalHeight * scale;
      const dx = (targetSize - drawW) / 2;
      const dy = (targetSize - drawH) / 2;

      ctx.drawImage(img, dx, dy, drawW, drawH);
      const imageData = ctx.getImageData(0, 0, targetSize, targetSize);
      const { filled, outline } = processAlphaMaskPixels(
        imageData.data,
        targetSize,
        targetSize,
        colorHex,
      );

      const outData = new ImageData(
        new Uint8ClampedArray(renderStyle === RenderStyle.FILLED ? filled : outline),
        targetSize,
        targetSize,
      );
      ctx.putImageData(outData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Failed to render custom unit icon variant.'));
    img.src = sourceDataUrl;
  });
}

/**
 * Generates a CustomUnitIcon payload from an uploaded PNG or SVG file.
 */
export async function createCustomUnitIconFromFile(file: File): Promise<CustomUnitIcon> {
  const { dataUrl, image, isSvg } = await loadImageFromFile(file, [
    'image/png',
    'image/svg+xml',
  ]);
  return {
    fileName: file.name,
    sourceDataUrl: dataUrl,
    isSvg,
    width: image.naturalWidth,
    height: image.naturalHeight,
  };
}

/**
 * Samples a high-contrast silhouette PNG onto an offscreen canvas and builds
 * a deterministic 2D occupancy grid where opaque/dark pixels mark inside regions.
 */
export function buildSilhouetteMaskFromPixels(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
): { occupancy: Uint8Array; coverageRatio: number } {
  const occupancy = new Uint8Array(width * height);
  let transparentCount = 0;

  // Detect whether image uses transparency or solid dark-on-light background
  for (let i = 0; i < width * height; i++) {
    if (rgba[i * 4 + 3] < 200) {
      transparentCount++;
    }
  }
  const hasTransparencyMask = transparentCount > width * height * 0.05;

  let insideCount = 0;
  for (let i = 0; i < width * height; i++) {
    const r = rgba[i * 4];
    const g = rgba[i * 4 + 1];
    const b = rgba[i * 4 + 2];
    const a = rgba[i * 4 + 3];

    let isInside = false;
    if (hasTransparencyMask) {
      isInside = a >= 100;
    } else {
      // High-contrast silhouette on opaque white/light canvas: dark pixels are inside
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      isInside = a >= 100 && luminance < 190;
    }

    if (isInside) {
      occupancy[i] = 1;
      insideCount++;
    }
  }

  return {
    occupancy,
    coverageRatio: insideCount / (width * height),
  };
}

/**
 * Loads an uploaded PNG silhouette file and samples it onto a 128x128 offscreen canvas.
 */
export async function createCustomSilhouetteMaskFromFile(
  file: File,
  sampleResolution = 128,
): Promise<CustomMaskGrid> {
  const { image } = await loadImageFromFile(file, ['image/png', 'image/svg+xml', 'image/webp']);

  const canvas = document.createElement('canvas');
  canvas.width = sampleResolution;
  canvas.height = sampleResolution;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('HTML5 Canvas 2D context is unavailable.');
  }

  ctx.clearRect(0, 0, sampleResolution, sampleResolution);
  const pad = 4;
  const avail = sampleResolution - pad * 2;
  const scale = Math.min(avail / image.naturalWidth, avail / image.naturalHeight);
  const drawW = image.naturalWidth * scale;
  const drawH = image.naturalHeight * scale;
  const dx = (sampleResolution - drawW) / 2;
  const dy = (sampleResolution - drawH) / 2;

  ctx.drawImage(image, dx, dy, drawW, drawH);
  const imageData = ctx.getImageData(0, 0, sampleResolution, sampleResolution);
  const { occupancy, coverageRatio } = buildSilhouetteMaskFromPixels(
    imageData.data,
    sampleResolution,
    sampleResolution,
  );

  if (coverageRatio < 0.02) {
    throw new Error(
      'Uploaded silhouette mask has too few opaque or dark pixels (<2%). Try a higher-contrast PNG.',
    );
  }

  // Generate crisp dark-slate preview thumbnail of the sampled mask
  const previewCanvas = document.createElement('canvas');
  previewCanvas.width = sampleResolution;
  previewCanvas.height = sampleResolution;
  const pCtx = previewCanvas.getContext('2d');
  let previewDataUrl = '';
  if (pCtx) {
    const pImg = pCtx.createImageData(sampleResolution, sampleResolution);
    for (let i = 0; i < occupancy.length; i++) {
      const offset = i * 4;
      if (occupancy[i] === 1) {
        pImg.data[offset] = 15;
        pImg.data[offset + 1] = 23;
        pImg.data[offset + 2] = 42;
        pImg.data[offset + 3] = 225;
      } else {
        pImg.data[offset] = 241;
        pImg.data[offset + 1] = 245;
        pImg.data[offset + 2] = 249;
        pImg.data[offset + 3] = 255;
      }
    }
    pCtx.putImageData(pImg, 0, 0);
    previewDataUrl = previewCanvas.toDataURL('image/png');
  }

  return {
    width: sampleResolution,
    height: sampleResolution,
    occupancy,
    previewDataUrl,
    fileName: file.name,
    coverageRatio,
  };
}

/**
 * Generates a built-in procedural silhouette mask (e.g. Lightbulb, House, Bottle)
 * so users can test silhouette masking with 1 click before uploading their own PNG.
 */
export function createBuiltInSampleMask(kind: 'house' | 'bottle' | 'lightbulb'): CustomMaskGrid {
  const size = 128;
  const occupancy = new Uint8Array(size * size);
  let insideCount = 0;

  for (let y = 0; y < size; y++) {
    const ny = y / (size - 1);
    for (let x = 0; x < size; x++) {
      const nx = x / (size - 1);
      let inside = false;

      if (kind === 'house') {
        // Roof triangle (ny in [0.1, 0.45]) + main body (ny in [0.45, 0.88], nx in [0.18, 0.82])
        if (ny >= 0.1 && ny < 0.45) {
          const halfSpan = ((ny - 0.1) / 0.35) * 0.42;
          inside = Math.abs(nx - 0.5) <= halfSpan;
        } else if (ny >= 0.45 && ny <= 0.88) {
          inside = nx >= 0.2 && nx <= 0.8;
        }
      } else if (kind === 'bottle') {
        // Neck + shoulder + body
        if (ny >= 0.08 && ny < 0.28) {
          inside = Math.abs(nx - 0.5) <= 0.1;
        } else if (ny >= 0.28 && ny < 0.42) {
          const t = (ny - 0.28) / 0.14;
          const halfSpan = 0.1 + t * 0.18;
          inside = Math.abs(nx - 0.5) <= halfSpan;
        } else if (ny >= 0.42 && ny <= 0.9) {
          inside = Math.abs(nx - 0.5) <= 0.28;
        }
      } else {
        // Lightbulb: bulb circle + neck + screw base
        const distBulb = Math.hypot(nx - 0.5, ny - 0.38);
        if (distBulb <= 0.28) {
          inside = true;
        } else if (ny >= 0.55 && ny < 0.72) {
          const t = (ny - 0.55) / 0.17;
          const halfSpan = 0.22 - t * 0.08;
          inside = Math.abs(nx - 0.5) <= halfSpan;
        } else if (ny >= 0.72 && ny <= 0.86) {
          inside = Math.abs(nx - 0.5) <= 0.13;
        }
      }

      if (inside) {
        occupancy[y * size + x] = 1;
        insideCount++;
      }
    }
  }

  let previewDataUrl = '';
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const img = ctx.createImageData(size, size);
      for (let i = 0; i < occupancy.length; i++) {
        const offset = i * 4;
        if (occupancy[i] === 1) {
          img.data[offset] = 15;
          img.data[offset + 1] = 23;
          img.data[offset + 2] = 42;
          img.data[offset + 3] = 225;
        } else {
          img.data[offset] = 241;
          img.data[offset + 1] = 245;
          img.data[offset + 2] = 249;
          img.data[offset + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
      previewDataUrl = canvas.toDataURL('image/png');
    }
  }

  return {
    width: size,
    height: size,
    occupancy,
    previewDataUrl,
    fileName: `${kind}-silhouette.png`,
    coverageRatio: insideCount / (size * size),
  };
}

/**
 * Generates a crisp PNG data URL for the Person Silhouette preset icon
 * (used when exporting to PowerPoint via slide.addImage if needed).
 */
export function renderPersonIconPng(
  colorHex: string,
  renderStyle: RenderStyle,
  size = 96,
): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.clearRect(0, 0, size, size);
  const s = size / 24;

  ctx.lineWidth = 2.2 * s;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // Head
  ctx.beginPath();
  ctx.arc(12 * s, 6.5 * s, 3.6 * s, 0, Math.PI * 2);

  // Shoulders & torso
  ctx.moveTo(5.2 * s, 21 * s);
  ctx.lineTo(5.2 * s, 17.5 * s);
  ctx.quadraticCurveTo(5.2 * s, 12.6 * s, 12 * s, 12.6 * s);
  ctx.quadraticCurveTo(18.8 * s, 12.6 * s, 18.8 * s, 17.5 * s);
  ctx.lineTo(18.8 * s, 21 * s);
  if (renderStyle === RenderStyle.FILLED) {
    ctx.closePath();
  }

  if (renderStyle === RenderStyle.FILLED) {
    ctx.fillStyle = colorHex;
    ctx.fill();
  } else {
    ctx.strokeStyle = colorHex;
    ctx.stroke();
  }

  return canvas.toDataURL('image/png');
}
