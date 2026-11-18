import { describe, expect, it } from 'vitest';
import {
  buildSilhouetteMaskFromPixels,
  createBuiltInSampleMask,
  processAlphaMaskPixels,
} from '../canvasMaskProcessor';

describe('canvasMaskProcessor — Blue Pill & Red Pill', () => {
  it('tints opaque pixels in Filled mode and extracts boundary-only pixels in Outline mode', () => {
    // Construct a 6x6 RGBA image with a solid 4x4 opaque square in the center (x=1..4, y=1..4)
    const width = 6;
    const height = 6;
    const rgba = new Uint8ClampedArray(width * height * 4);
    for (let y = 1; y <= 4; y++) {
      for (let x = 1; x <= 4; x++) {
        const idx = (y * width + x) * 4;
        rgba[idx] = 0;
        rgba[idx + 1] = 0;
        rgba[idx + 2] = 0;
        rgba[idx + 3] = 255;
      }
    }

    const { filled, outline } = processAlphaMaskPixels(rgba, width, height, '#2563eb');

    // Interior pixel (2,2) should be tinted #2563eb in filled mode
    const interiorIdx = (2 * width + 2) * 4;
    expect(filled[interiorIdx]).toBe(0x25);
    expect(filled[interiorIdx + 1]).toBe(0x63);
    expect(filled[interiorIdx + 2]).toBe(0xeb);
    expect(filled[interiorIdx + 3]).toBe(255);

    // Outer transparent corner (0,0) remains transparent in both
    expect(filled[3]).toBe(0);
    expect(outline[3]).toBe(0);

    // Border pixel (1,1) is tinted in outline mode
    const borderIdx = (1 * width + 1) * 4;
    expect(outline[borderIdx]).toBe(0x25);
    expect(outline[borderIdx + 1]).toBe(0x63);
    expect(outline[borderIdx + 2]).toBe(0xeb);
    expect(outline[borderIdx + 3]).toBe(255);
  });

  it('detects silhouette occupancy from both transparent masks and dark-on-white silhouettes', () => {
    // Dark-on-white 4x4 image where center 2x2 is black (#000) and border is white (#fff)
    const width = 4;
    const height = 4;
    const rgba = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const isCenter = x >= 1 && x <= 2 && y >= 1 && y <= 2;
        const v = isCenter ? 10 : 255;
        rgba[idx] = v;
        rgba[idx + 1] = v;
        rgba[idx + 2] = v;
        rgba[idx + 3] = 255;
      }
    }

    const mask = buildSilhouetteMaskFromPixels(rgba, width, height);
    expect(mask.coverageRatio).toBeCloseTo(4 / 16, 4);
    expect(mask.occupancy[1 * width + 1]).toBe(1);
    expect(mask.occupancy[0]).toBe(0);
  });

  it('creates valid built-in procedural silhouette masks', () => {
    for (const kind of ['lightbulb', 'house', 'bottle'] as const) {
      const mask = createBuiltInSampleMask(kind);
      expect(mask.width).toBe(128);
      expect(mask.height).toBe(128);
      expect(mask.coverageRatio).toBeGreaterThan(0.15);
      expect(mask.coverageRatio).toBeLessThan(0.85);
    }
  });

  it('handles completely transparent image gracefully (0 coverage)', () => {
    const rgba = new Uint8ClampedArray(8 * 8 * 4); // all zeros
    const mask = buildSilhouetteMaskFromPixels(rgba, 8, 8);
    expect(mask.coverageRatio).toBe(0);
    expect(mask.occupancy.every((v) => v === 0)).toBe(true);
  });
});
