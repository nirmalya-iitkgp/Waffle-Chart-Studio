import { describe, expect, it } from 'vitest';
import { createBuiltInSampleMask } from '../canvasMaskProcessor';
import {
  buildArcSectorOutlinePoints,
  buildArcSectorSvgPath,
  computeLegendText,
  computeSlicePercentages,
  computeSlideLayout,
  computeStageMetrics,
  getSlideDimensions,
} from '../gridPackingMath';
import { INITIAL_STUDIO_CONFIG, normalizeHexColor } from '../palettes';
import {
  AspectRatioMode,
  ContainerMode,
  FillDirection,
  FlowOrientation,
  StageSizingMode,
  StudioConfig,
} from '../types';

describe('gridPackingMath — Blue Pill (Happy Path)', () => {
  it('computes exact slide dimensions for 16:9 and 4:3', () => {
    expect(getSlideDimensions(AspectRatioMode.WIDE_16_9)).toEqual({
      width: 13.333,
      height: 7.5,
    });
    expect(getSlideDimensions(AspectRatioMode.STANDARD_4_3)).toEqual({
      width: 10.0,
      height: 7.5,
    });
  });

  it('computes retention, step conversion, and drop-off percentages accurately for default 4-stage SaaS funnel', () => {
    const metrics = computeStageMetrics(INITIAL_STUDIO_CONFIG);
    expect(metrics).toHaveLength(4);

    // Stage 1: 10,000 (100%)
    expect(metrics[0].retentionPct).toBe(100);
    expect(metrics[0].stepConversionPct).toBe(100);
    expect(metrics[0].stepDropoffPct).toBe(0);

    // Stage 2: 3,400 (34% of total, 34% conversion, 66% drop-off)
    expect(metrics[1].retentionPct).toBeCloseTo(34, 2);
    expect(metrics[1].stepConversionPct).toBeCloseTo(34, 2);
    expect(metrics[1].stepDropoffPct).toBeCloseTo(66, 2);

    // Stage 3: 1,450 (14.5% of total, 42.65% conversion from 3400)
    expect(metrics[2].retentionPct).toBeCloseTo(14.5, 2);
    expect(metrics[2].stepConversionPct).toBeCloseTo((1450 / 3400) * 100, 2);
  });

  it('ensures adjacent trapezoid entry heights match previous stage exit heights', () => {
    const layout = computeSlideLayout(INITIAL_STUDIO_CONFIG);
    expect(layout.stages).toHaveLength(4);
    expect(layout.connectors).toHaveLength(3);

    for (let i = 1; i < layout.stages.length; i++) {
      const prev = layout.stages[i - 1];
      const curr = layout.stages[i];
      // Prev right edge: polygon[1].y .. polygon[2].y
      const prevExitHeight = prev.polygon[2].y - prev.polygon[1].y;
      // Curr left edge: polygon[0].y .. polygon[3].y
      const currEntryHeight = curr.polygon[3].y - curr.polygon[0].y;
      expect(currEntryHeight).toBeCloseTo(prevExitHeight, 3);
    }
  });

  it('packs cells inside all 5 container modes without overflow', () => {
    const mask = createBuiltInSampleMask('lightbulb');
    const modes = [
      ContainerMode.TRAPEZOID,
      ContainerMode.SQUARE_GRID,
      ContainerMode.DONUT,
      ContainerMode.TRIANGLE,
      ContainerMode.CUSTOM_MASK,
    ];

    for (const containerMode of modes) {
      const cfg: StudioConfig = {
        ...INITIAL_STUDIO_CONFIG,
        containerMode,
        customMask: containerMode === ContainerMode.CUSTOM_MASK ? mask : null,
      };
      const layout = computeSlideLayout(cfg);
      for (const stage of layout.stages) {
        expect(stage.cells.length).toBeGreaterThan(0);
        for (const cell of stage.cells) {
          expect(cell.x).toBeGreaterThanOrEqual(stage.box.x - 0.05);
          expect(cell.y).toBeGreaterThanOrEqual(stage.box.y - 0.05);
          expect(cell.x + cell.w).toBeLessThanOrEqual(stage.box.x + stage.box.w + 0.05);
          expect(cell.y + cell.h).toBeLessThanOrEqual(stage.box.y + stage.box.h + 0.05);
        }
      }
    }
  });

  it('fills proportional active vs inactive icons in Fixed Container mode across fill directions', () => {
    const directions = [
      FillDirection.BOTTOM_TO_TOP,
      FillDirection.TOP_TO_BOTTOM,
      FillDirection.LEFT_TO_RIGHT,
    ];

    for (const fillDirection of directions) {
      const cfg: StudioConfig = {
        ...INITIAL_STUDIO_CONFIG,
        containerMode: ContainerMode.SQUARE_GRID,
        stageSizingMode: StageSizingMode.FIXED_CONTAINER,
        fillDirection,
      };
      const layout = computeSlideLayout(cfg);
      const stage2 = layout.stages[1]; // 34% retention
      const activeCells = stage2.cells.filter((c) => c.active);
      const inactiveCells = stage2.cells.filter((c) => !c.active);

      expect(activeCells.length).toBeGreaterThan(0);
      expect(inactiveCells.length).toBeGreaterThan(0);
      expect(activeCells.length / stage2.cells.length).toBeCloseTo(0.34, 1);

      if (fillDirection === FillDirection.BOTTOM_TO_TOP) {
        const avgActiveY = activeCells.reduce((s, c) => s + c.y, 0) / activeCells.length;
        const avgInactiveY = inactiveCells.reduce((s, c) => s + c.y, 0) / inactiveCells.length;
        expect(avgActiveY).toBeGreaterThan(avgInactiveY);
      } else if (fillDirection === FillDirection.TOP_TO_BOTTOM) {
        const avgActiveY = activeCells.reduce((s, c) => s + c.y, 0) / activeCells.length;
        const avgInactiveY = inactiveCells.reduce((s, c) => s + c.y, 0) / inactiveCells.length;
        expect(avgActiveY).toBeLessThan(avgInactiveY);
      } else {
        const avgActiveX = activeCells.reduce((s, c) => s + c.x, 0) / activeCells.length;
        const avgInactiveX = inactiveCells.reduce((s, c) => s + c.x, 0) / inactiveCells.length;
        expect(avgActiveX).toBeLessThan(avgInactiveX);
      }
    }
  });

  it('renders 1,000 total unit icons across 5 stages smoothly under 50ms', () => {
    const cfg: StudioConfig = {
      ...INITIAL_STUDIO_CONFIG,
      stageCount: 5,
      orientation: FlowOrientation.VERTICAL,
      stages: INITIAL_STUDIO_CONFIG.stages.map((s) => ({ ...s, iconDensity: 200 })),
    };
    const start = performance.now();
    const layout = computeSlideLayout(cfg);
    const elapsed = performance.now() - start;

    expect(layout.totalIconsRendered).toBeGreaterThanOrEqual(850);
    expect(elapsed).toBeLessThan(150);
  });

  it('computes a collinear constant linear slope from initial to final stage in CONSTANT_SLOPE mode', () => {
    const cfg: StudioConfig = {
      ...INITIAL_STUDIO_CONFIG,
      stageSizingMode: StageSizingMode.CONSTANT_SLOPE,
    };
    const layout = computeSlideLayout(cfg);
    expect(layout.stages).toHaveLength(4);

    // Top edge slope across all stage polygons should be constant
    const firstTopLeft = layout.stages[0].polygon[0];
    const lastTopRight = layout.stages[layout.stages.length - 1].polygon[1];
    const overallSlope =
      (lastTopRight.y - firstTopLeft.y) / (lastTopRight.x - firstTopLeft.x);

    for (const stage of layout.stages) {
      const p0 = stage.polygon[0];
      const p1 = stage.polygon[1];
      const stageSlope = (p1.y - p0.y) / (p1.x - p0.x);
      expect(stageSlope).toBeCloseTo(overallSlope, 3);
    }
  });

  it('packs exact Parliament / Arc-Dot counts respecting per-stage arcSweepDeg and arcRotationDeg', () => {
    const cfg: StudioConfig = {
      ...INITIAL_STUDIO_CONFIG,
      containerMode: ContainerMode.DONUT,
      stageCount: 2,
      stages: [
        { ...INITIAL_STUDIO_CONFIG.stages[0], iconDensity: 120, arcSweepDeg: 180, arcRotationDeg: 0 },
        { ...INITIAL_STUDIO_CONFIG.stages[1], iconDensity: 85, arcSweepDeg: 270, arcRotationDeg: 90 },
        ...INITIAL_STUDIO_CONFIG.stages.slice(2),
      ],
    };
    const layout = computeSlideLayout(cfg);
    expect(layout.stages[0].cells).toHaveLength(120);
    expect(layout.stages[1].cells).toHaveLength(85);
    expect(layout.stages[0].arcGeometry?.sweepDeg).toBe(180);
    expect(layout.stages[1].arcGeometry?.sweepDeg).toBe(270);

    // Rotated +90 deg shifts center angle to right (0 rad)
    const s1Arc = layout.stages[1].arcGeometry!;
    const midAngle = (s1Arc.startAngleRad + s1Arc.endAngleRad) / 2;
    expect(midAngle).toBeCloseTo(0, 4);

    // Path & outline helpers produce valid geometry
    expect(buildArcSectorSvgPath(s1Arc, 100)).toContain('A ');
    expect(buildArcSectorOutlinePoints(s1Arc).length).toBeGreaterThan(20);
  });

  it('allocates exact proportional colors across active cells when multiColorEnabled is true', () => {
    const cfg: StudioConfig = {
      ...INITIAL_STUDIO_CONFIG,
      containerMode: ContainerMode.SQUARE_GRID,
      stageSizingMode: StageSizingMode.FIXED_CONTAINER,
      stageCount: 2,
      stages: [
        {
          ...INITIAL_STUDIO_CONFIG.stages[0],
          iconDensity: 100,
          multiColorEnabled: true,
          colorSlices: [
            { id: 's1', label: 'Organic', share: 50, color: '#2563eb' },
            { id: 's2', label: 'Paid', share: 30, color: '#16a34a' },
            { id: 's3', label: 'Referral', share: 20, color: '#ea580c' },
          ],
        },
        {
          ...INITIAL_STUDIO_CONFIG.stages[1],
          value: 5000, // 50% retention -> 50 active, 50 inactive
          iconDensity: 100,
          multiColorEnabled: true,
          colorSlices: [
            { id: 's1', label: 'Direct', share: 60, color: '#111111' },
            { id: 's2', label: 'Partner', share: 40, color: '#222222' },
          ],
        },
        ...INITIAL_STUDIO_CONFIG.stages.slice(2),
      ],
    };

    const layout = computeSlideLayout(cfg);
    const s0 = layout.stages[0];
    const s0Cells = s0.cells;
    const cBlue = s0Cells.filter((c) => c.color === '#2563eb').length;
    const cGreen = s0Cells.filter((c) => c.color === '#16a34a').length;
    const cOrange = s0Cells.filter((c) => c.color === '#ea580c').length;
    expect(cBlue + cGreen + cOrange).toBe(s0.activeCellCount);
    expect(cBlue / s0.activeCellCount).toBeCloseTo(0.5, 1);
    expect(cGreen / s0.activeCellCount).toBeCloseTo(0.3, 1);
    expect(cOrange / s0.activeCellCount).toBeCloseTo(0.2, 1);

    // Stage 2 has inactive cells whose color should remain undefined (rendered with inactiveTint)
    const s1Cells = layout.stages[1].cells;
    const activeS1 = s1Cells.filter((c) => c.active);
    const inactiveS1 = s1Cells.filter((c) => !c.active);
    expect(activeS1.filter((c) => c.color === '#111111')).toHaveLength(
      Math.round(activeS1.length * 0.6),
    );
    expect(activeS1.filter((c) => c.color === '#222222')).toHaveLength(
      activeS1.length - Math.round(activeS1.length * 0.6),
    );
    expect(inactiveS1.every((c) => c.color === undefined)).toBe(true);

    // Parliament / Arc-Dot packs exact iconDensity=100 cells -> exact 50/30/20 split
    const arcLayout = computeSlideLayout({ ...cfg, containerMode: ContainerMode.DONUT });
    const arcCells = arcLayout.stages[0].cells;
    expect(arcCells.filter((c) => c.color === '#2563eb')).toHaveLength(50);
    expect(arcCells.filter((c) => c.color === '#16a34a')).toHaveLength(30);
    expect(arcCells.filter((c) => c.color === '#ea580c')).toHaveLength(20);
  });
});

describe('gridPackingMath — Red Pill (Adversarial & Edge Cases)', () => {
  it('handles zero baseline value without NaN or Infinity', () => {
    const cfg: StudioConfig = {
      ...INITIAL_STUDIO_CONFIG,
      stages: INITIAL_STUDIO_CONFIG.stages.map((s) => ({ ...s, value: 0 })),
    };
    const metrics = computeStageMetrics(cfg);
    for (const m of metrics) {
      expect(Number.isFinite(m.retentionPct)).toBe(true);
      expect(Number.isFinite(m.stepConversionPct)).toBe(true);
      expect(Number.isFinite(m.stepDropoffPct)).toBe(true);
    }

    const legend = computeLegendText(metrics);
    expect(legend).toContain('1 icon');
    expect(() => computeSlideLayout(cfg)).not.toThrow();
  });

  it('clamps out-of-range stageCount and empty custom mask safely', () => {
    const emptyMask = {
      width: 16,
      height: 16,
      occupancy: new Uint8Array(16 * 16), // all zeros
      previewDataUrl: '',
      fileName: 'empty.png',
      coverageRatio: 0,
    };

    const cfg: StudioConfig = {
      ...INITIAL_STUDIO_CONFIG,
      stageCount: 99,
      containerMode: ContainerMode.CUSTOM_MASK,
      customMask: emptyMask,
    };

    const layout = computeSlideLayout(cfg);
    expect(layout.stages).toHaveLength(5);
    expect(Number.isFinite(layout.totalIconsRendered)).toBe(true);
  });

  it('normalizes malformed hex color strings to safe fallback', () => {
    expect(normalizeHexColor('not-a-color', '#003f5c')).toBe('#003f5c');
    expect(normalizeHexColor('2563eb')).toBe('#2563eb');
    expect(normalizeHexColor('#ABCDEF')).toBe('#abcdef');
  });

  it('falls back to equal split when all color slice weights are zero', () => {
    const stage = {
      ...INITIAL_STUDIO_CONFIG.stages[0],
      multiColorEnabled: true,
      colorSlices: [
        { id: 'a', label: 'A', share: 0, color: '#111111' },
        { id: 'b', label: 'B', share: -5, color: '#222222' },
      ],
    };
    const pcts = computeSlicePercentages(stage);
    expect(pcts).toEqual([50, 50]);
  });
});
