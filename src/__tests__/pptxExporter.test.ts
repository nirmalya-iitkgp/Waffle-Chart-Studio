import { describe, expect, it, vi } from 'vitest';
import { computeSlideLayout } from '../gridPackingMath';
import { INITIAL_STUDIO_CONFIG } from '../palettes';
import { exportSlideToPptx } from '../pptxExporter';
import {
  AspectRatioMode,
  FlowOrientation,
  RenderStyle,
  UnitIconPreset,
} from '../types';

vi.mock('pptxgenjs', async () => {
  const actual = await vi.importActual<typeof import('pptxgenjs')>('pptxgenjs');
  const PptxCtor = actual.default;
  return {
    default: class MockablePptxGenJS extends PptxCtor {
      writeFile = vi.fn().mockResolvedValue('mock-file.pptx');
    },
  };
});

describe('pptxExporter — Real PptxGenJS Slide Construction', () => {
  it('constructs a valid 16:9 horizontal funnel slide with shapes, trapezoids, and text', async () => {
    const layout = computeSlideLayout(INITIAL_STUDIO_CONFIG);
    await expect(exportSlideToPptx(INITIAL_STUDIO_CONFIG, layout)).resolves.toBeUndefined();
  });

  it('constructs a 4:3 vertical outline diamond funnel slide without runtime errors', async () => {
    const cfg = {
      ...INITIAL_STUDIO_CONFIG,
      aspectRatio: AspectRatioMode.STANDARD_4_3,
      orientation: FlowOrientation.VERTICAL,
      iconPreset: UnitIconPreset.DIAMOND,
      renderStyle: RenderStyle.OUTLINE,
      stageCount: 3,
    };
    const layout = computeSlideLayout(cfg);
    await expect(exportSlideToPptx(cfg, layout)).resolves.toBeUndefined();
  });
});
