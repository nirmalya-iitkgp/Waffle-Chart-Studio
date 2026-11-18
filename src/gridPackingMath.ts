import {
  AspectRatioMode,
  ConnectorLayout,
  ContainerMode,
  CustomMaskGrid,
  FillDirection,
  FlowOrientation,
  Point2D,
  SlideLayoutResult,
  StageComputedMetrics,
  StageLayoutResult,
  StageSizingMode,
  StudioConfig,
  UnitCell,
} from './types';

export const SVG_UNITS_PER_INCH = 100;
const MIN_VISUAL_TAPER_RATIO = 0.08;

export function getSlideDimensions(aspectRatio: AspectRatioMode): {
  width: number;
  height: number;
} {
  if (aspectRatio === AspectRatioMode.STANDARD_4_3) {
    return { width: 10.0, height: 7.5 };
  }
  return { width: 13.333, height: 7.5 };
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function formatCompactNumber(value: number): string {
  if (!Number.isFinite(value)) return '0';
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2).replace(/\.00$/, '')}M`;
  }
  return Math.round(value).toLocaleString('en-US');
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return '0%';
  if (value >= 10 || value === 0 || Number.isInteger(value)) {
    return `${Math.round(value)}%`;
  }
  return `${value.toFixed(1)}%`;
}

/**
 * Computes per-stage retention %, step conversion %, and step drop-off %.
 */
export function computeStageMetrics(config: StudioConfig): StageComputedMetrics[] {
  const activeStages = config.stages.slice(0, clamp(config.stageCount, 1, 5));
  const baseline = activeStages.length > 0 ? Math.max(1, activeStages[0].value) : 1;

  return activeStages.map((stage, index) => {
    const retentionPct = clamp((stage.value / baseline) * 100, 0, 100);
    const prevValue = index === 0 ? baseline : Math.max(0, activeStages[index - 1].value);
    const prevRetentionPct =
      index === 0 ? 100 : clamp((prevValue / baseline) * 100, 0, 100);

    const stepConversionPct =
      index === 0
        ? 100
        : prevValue > 0
          ? clamp((stage.value / prevValue) * 100, 0, 100)
          : 0;
    const stepDropoffPct = index === 0 ? 0 : Math.max(0, 100 - stepConversionPct);

    return {
      stage,
      index,
      retentionPct,
      prevRetentionPct,
      stepConversionPct,
      stepDropoffPct,
    };
  });
}

/**
 * Computes automatic "1 icon = X units" legend text.
 */
export function computeLegendText(metrics: StageComputedMetrics[]): string {
  if (metrics.length === 0) return '1 icon = 1 unit';
  const base = metrics[0];
  const density = Math.max(1, base.stage.iconDensity);
  const unitsPerIcon = base.stage.value / density;

  // Check if all stages share approximately the same units/icon ratio
  const isUniform = metrics.every((m) => {
    const expectedIcons = m.stage.value / Math.max(0.001, unitsPerIcon);
    return Math.abs(expectedIcons - m.stage.iconDensity) <= Math.max(4, m.stage.iconDensity * 0.25);
  });

  const rounded =
    unitsPerIcon >= 10
      ? Math.round(unitsPerIcon).toLocaleString('en-US')
      : unitsPerIcon >= 1
        ? unitsPerIcon.toFixed(1).replace(/\.0$/, '')
        : unitsPerIcon.toFixed(2);

  return isUniform ? `1 icon = ${rounded} units` : `1 icon ≈ ${rounded} base units (per-stage density)`;
}

type ShapePredicate = (nx: number, ny: number) => boolean;

/**
 * Builds the normalized [0..1] x [0..1] containment predicate for a stage container.
 */
function buildContainerPredicate(
  containerMode: ContainerMode,
  orientation: FlowOrientation,
  entryRatio: number,
  exitRatio: number,
  sizingMode: StageSizingMode,
  customMask: CustomMaskGrid | null,
): ShapePredicate {
  if (containerMode === ContainerMode.TRAPEZOID) {
    if (sizingMode === StageSizingMode.FIXED_CONTAINER) {
      return () => true;
    }
    const r0 = clamp(entryRatio, MIN_VISUAL_TAPER_RATIO, 1);
    const r1 = clamp(exitRatio, MIN_VISUAL_TAPER_RATIO, 1);

    if (orientation === FlowOrientation.HORIZONTAL) {
      return (nx, ny) => {
        const halfSpan = (r0 + (r1 - r0) * nx) * 0.5;
        return Math.abs(ny - 0.5) <= halfSpan;
      };
    }
    return (nx, ny) => {
      const halfSpan = (r0 + (r1 - r0) * ny) * 0.5;
      return Math.abs(nx - 0.5) <= halfSpan;
    };
  }

  if (containerMode === ContainerMode.SQUARE_GRID) {
    return () => true;
  }

  if (containerMode === ContainerMode.DONUT) {
    const outerR = 0.48;
    const innerR = 0.19;
    return (nx, ny) => {
      const dist = Math.hypot(nx - 0.5, ny - 0.5);
      return dist <= outerR && dist >= innerR;
    };
  }

  if (containerMode === ContainerMode.TRIANGLE) {
    if (orientation === FlowOrientation.HORIZONTAL) {
      // Right-pointing funnel pyramid or upward triangle
      return (nx, ny) => {
        const halfSpan = (1 - nx * 0.85) * 0.48;
        return Math.abs(ny - 0.5) <= halfSpan;
      };
    }
    // Classic upright or funnel pyramid
    return (nx, ny) => {
      const halfSpan = (0.1 + ny * 0.86) * 0.5;
      return Math.abs(nx - 0.5) <= halfSpan;
    };
  }

  if (containerMode === ContainerMode.CUSTOM_MASK && customMask) {
    const { width, height, occupancy } = customMask;
    return (nx, ny) => {
      const gx = clamp(Math.floor(nx * width), 0, width - 1);
      const gy = clamp(Math.floor(ny * height), 0, height - 1);
      return occupancy[gy * width + gx] === 1;
    };
  }

  return () => true;
}

/**
 * Computes the 4-corner polygon of a stage container in slide inches.
 */
function buildStagePolygon(
  box: { x: number; y: number; w: number; h: number },
  containerMode: ContainerMode,
  orientation: FlowOrientation,
  entryRatio: number,
  exitRatio: number,
  sizingMode: StageSizingMode,
): Point2D[] {
  if (
    containerMode === ContainerMode.TRAPEZOID &&
    (sizingMode === StageSizingMode.TRAPEZOID_TAPER ||
      sizingMode === StageSizingMode.CONSTANT_SLOPE)
  ) {
    const r0 = clamp(entryRatio, MIN_VISUAL_TAPER_RATIO, 1);
    const r1 = clamp(exitRatio, MIN_VISUAL_TAPER_RATIO, 1);

    if (orientation === FlowOrientation.HORIZONTAL) {
      const topLeftY = box.y + box.h * (0.5 - r0 * 0.5);
      const botLeftY = box.y + box.h * (0.5 + r0 * 0.5);
      const topRightY = box.y + box.h * (0.5 - r1 * 0.5);
      const botRightY = box.y + box.h * (0.5 + r1 * 0.5);
      return [
        { x: box.x, y: topLeftY },
        { x: box.x + box.w, y: topRightY },
        { x: box.x + box.w, y: botRightY },
        { x: box.x, y: botLeftY },
      ];
    }

    const leftTopX = box.x + box.w * (0.5 - r0 * 0.5);
    const rightTopX = box.x + box.w * (0.5 + r0 * 0.5);
    const leftBotX = box.x + box.w * (0.5 - r1 * 0.5);
    const rightBotX = box.x + box.w * (0.5 + r1 * 0.5);
    return [
      { x: leftTopX, y: box.y },
      { x: rightTopX, y: box.y },
      { x: rightBotX, y: box.y + box.h },
      { x: leftBotX, y: box.y + box.h },
    ];
  }

  return [
    { x: box.x, y: box.y },
    { x: box.x + box.w, y: box.y },
    { x: box.x + box.w, y: box.y + box.h },
    { x: box.x, y: box.y + box.h },
  ];
}

/**
 * Estimates the fractional area of a shape predicate via deterministic 24x24 sampling.
 */
function estimateAreaFraction(predicate: ShapePredicate): number {
  const N = 24;
  let inside = 0;
  for (let r = 0; r < N; r++) {
    const ny = (r + 0.5) / N;
    for (let c = 0; c < N; c++) {
      const nx = (c + 0.5) / N;
      if (predicate(nx, ny)) inside++;
    }
  }
  return Math.max(0.06, inside / (N * N));
}

function sampleGridForPitch(
  box: { x: number; y: number; w: number; h: number },
  pitch: number,
  predicate: ShapePredicate,
): Array<{ cx: number; cy: number }> {
  const cols = Math.max(1, Math.floor(box.w / pitch));
  const rows = Math.max(1, Math.floor(box.h / pitch));
  const gridW = cols * pitch;
  const gridH = rows * pitch;
  const startX = box.x + (box.w - gridW) / 2;
  const startY = box.y + (box.h - gridH) / 2;

  const hits: Array<{ cx: number; cy: number }> = [];
  for (let r = 0; r < rows; r++) {
    const cy = startY + (r + 0.5) * pitch;
    const ny = (cy - box.y) / box.h;
    for (let c = 0; c < cols; c++) {
      const cx = startX + (c + 0.5) * pitch;
      const nx = (cx - box.x) / box.w;
      if (predicate(nx, ny)) {
        hits.push({ cx, cy });
      }
    }
  }
  return hits;
}

function sortPositionsByFillDirection(
  positions: Array<{ cx: number; cy: number }>,
  fillDirection: FillDirection,
): Array<{ cx: number; cy: number }> {
  const sorted = [...positions];
  sorted.sort((a, b) => {
    const eps = 0.001;
    if (fillDirection === FillDirection.BOTTOM_TO_TOP) {
      if (Math.abs(b.cy - a.cy) > eps) return b.cy - a.cy;
      return a.cx - b.cx;
    }
    if (fillDirection === FillDirection.TOP_TO_BOTTOM) {
      if (Math.abs(a.cy - b.cy) > eps) return a.cy - b.cy;
      return a.cx - b.cx;
    }
    // LEFT_TO_RIGHT
    if (Math.abs(a.cx - b.cx) > eps) return a.cx - b.cx;
    return a.cy - b.cy;
  });
  return sorted;
}

/**
 * Packs `targetDensity` unit cells inside a stage container using an iterative
 * pitch solver so the resulting cell count matches `targetDensity` closely.
 */
function packCellsInContainer(
  box: { x: number; y: number; w: number; h: number },
  targetDensity: number,
  predicate: ShapePredicate,
  fillDirection: FillDirection,
  iconSizePx: number,
  gapSpacingPx: number,
  activeRatio: number,
  includeGhostOutside: boolean,
): { cells: UnitCell[]; activeCount: number } {
  const safeTarget = clamp(Math.round(targetDensity), 1, 400);
  const areaFraction = estimateAreaFraction(predicate);
  const effectiveSlots = safeTarget / areaFraction;

  // Initial pitch guess
  const initialPitch = Math.sqrt((box.w * box.h) / Math.max(1, effectiveSlots));
  let low = Math.min(box.w, box.h) / 45;
  let high = Math.min(box.w, box.h);

  let bestPitch = initialPitch;
  let bestPositions = sampleGridForPitch(box, initialPitch, predicate);
  let bestDiff = Math.abs(bestPositions.length - safeTarget);

  // Binary search on pitch to match requested iconDensity cleanly
  for (let iter = 0; iter < 14; iter++) {
    const mid = (low + high) / 2;
    const pts = sampleGridForPitch(box, mid, predicate);
    const diff = Math.abs(pts.length - safeTarget);

    if (
      diff < bestDiff ||
      (diff === bestDiff && pts.length >= safeTarget && bestPositions.length < safeTarget)
    ) {
      bestDiff = diff;
      bestPitch = mid;
      bestPositions = pts;
    }

    if (pts.length > safeTarget) {
      low = mid; // too many -> larger pitch
    } else if (pts.length < safeTarget) {
      high = mid; // too few -> smaller pitch
    } else {
      break;
    }
  }

  // Sort by fill direction and trim exact overflow if needed
  const sortedInside = sortPositionsByFillDirection(bestPositions, fillDirection);
  const trimmedInside =
    sortedInside.length > safeTarget ? sortedInside.slice(0, safeTarget) : sortedInside;

  // Gap & Icon Size scaling in slide inches
  // gapSpacingPx (0..12) reduces cell size up to 48% of pitch
  const gapFraction = clamp(gapSpacingPx / 26, 0.04, 0.48);
  // iconSizePx (8..28, default 16) scales icon within available cell slot
  const sizeScale = clamp(iconSizePx / 16, 0.45, 1.35);
  const rawIconDim = bestPitch * (1 - gapFraction) * Math.min(1.06, sizeScale);
  const iconDim = clamp(rawIconDim, 0.028, bestPitch * 0.94);

  const activeCount = Math.round(trimmedInside.length * clamp(activeRatio, 0, 1));
  const cells: UnitCell[] = trimmedInside.map((pos, idx) => ({
    x: pos.cx - iconDim / 2,
    y: pos.cy - iconDim / 2,
    w: iconDim,
    h: iconDim,
    active: idx < activeCount,
  }));

  // Optional ghost drop-off cells outside tapered trapezoid
  if (includeGhostOutside) {
    const allBoxPositions = sampleGridForPitch(box, bestPitch, () => true);
    for (const pos of allBoxPositions) {
      const nx = (pos.cx - box.x) / box.w;
      const ny = (pos.cy - box.y) / box.h;
      if (!predicate(nx, ny)) {
        cells.push({
          x: pos.cx - iconDim / 2,
          y: pos.cy - iconDim / 2,
          w: iconDim,
          h: iconDim,
          active: false,
          isGhostOutsideTaper: true,
        });
      }
    }
  }

  return { cells, activeCount };
}

/**
 * Computes the complete deterministic slide layout in Slide Inches.
 */
export function computeSlideLayout(config: StudioConfig): SlideLayoutResult {
  const { width: slideWidth, height: slideHeight } = getSlideDimensions(config.aspectRatio);
  const metricsList = computeStageMetrics(config);
  const n = metricsList.length;

  const marginX = 0.55;
  const topPlotY = 1.42;
  const bottomMargin = 0.48;
  const plotW = slideWidth - marginX * 2;
  const plotH = slideHeight - topPlotY - bottomMargin;

  const stageLayouts: StageLayoutResult[] = [];
  const connectors: ConnectorLayout[] = [];
  let totalIconsRendered = 0;

  const isConstantSlope = config.stageSizingMode === StageSizingMode.CONSTANT_SLOPE;
  const slopeStartRatio =
    n > 0 ? clamp(metricsList[0].retentionPct / 100, MIN_VISUAL_TAPER_RATIO, 1) : 1;
  const slopeEndRatio =
    n > 0 ? clamp(metricsList[n - 1].retentionPct / 100, MIN_VISUAL_TAPER_RATIO, 1) : 1;

  if (config.orientation === FlowOrientation.HORIZONTAL) {
    const connectorGap = n > 1 ? (config.showConnectors ? 0.46 : 0.24) : 0;
    const totalGaps = connectorGap * Math.max(0, n - 1);
    const stageW = (plotW - totalGaps) / Math.max(1, n);
    const totalSpan = n * stageW + totalGaps;
    const headerH = config.showStageHeaders ? 0.64 : 0.1;
    const boxY = topPlotY + headerH;
    const boxH = Math.max(1.2, plotH - headerH);

    for (let i = 0; i < n; i++) {
      const m = metricsList[i];
      const stageX = marginX + i * (stageW + connectorGap);
      const box = { x: stageX, y: boxY, w: stageW, h: boxH };
      const headerBox = { x: stageX, y: topPlotY, w: stageW, h: headerH };

      let entryRatio = m.prevRetentionPct / 100;
      let exitRatio = m.retentionPct / 100;
      if (isConstantSlope && totalSpan > 0) {
        const t0 = (i * (stageW + connectorGap)) / totalSpan;
        const t1 = (i * (stageW + connectorGap) + stageW) / totalSpan;
        entryRatio = slopeStartRatio + (slopeEndRatio - slopeStartRatio) * t0;
        exitRatio = slopeStartRatio + (slopeEndRatio - slopeStartRatio) * t1;
      }

      const predicate = buildContainerPredicate(
        config.containerMode,
        config.orientation,
        entryRatio,
        exitRatio,
        config.stageSizingMode,
        config.customMask,
      );

      const polygon = buildStagePolygon(
        box,
        config.containerMode,
        config.orientation,
        entryRatio,
        exitRatio,
        config.stageSizingMode,
      );

      const isTaperedTrapezoid =
        config.containerMode === ContainerMode.TRAPEZOID &&
        (config.stageSizingMode === StageSizingMode.TRAPEZOID_TAPER ||
          config.stageSizingMode === StageSizingMode.CONSTANT_SLOPE);

      const activeRatio = isTaperedTrapezoid ? 1 : m.retentionPct / 100;
      const includeGhost = isTaperedTrapezoid && config.showGhostDropoff;

      const { cells, activeCellCount } = (() => {
        const res = packCellsInContainer(
          box,
          m.stage.iconDensity,
          predicate,
          config.fillDirection,
          config.iconSizePx,
          config.gapSpacingPx,
          activeRatio,
          includeGhost,
        );
        return { cells: res.cells, activeCellCount: res.activeCount };
      })();

      totalIconsRendered += cells.length;
      stageLayouts.push({
        metrics: m,
        box,
        polygon,
        headerBox,
        cells,
        activeCellCount,
      });
    }

    // Horizontal connectors between adjacent stages
    if (config.showConnectors && n > 1) {
      for (let i = 0; i < n - 1; i++) {
        const curr = stageLayouts[i];
        const next = stageLayouts[i + 1];
        const currRightTop = curr.polygon[1];
        const currRightBot = curr.polygon[2];
        const nextLeftTop = next.polygon[0];
        const nextLeftBot = next.polygon[3];

        connectors.push({
          fromStageIndex: i,
          toStageIndex: i + 1,
          polygon: [currRightTop, nextLeftTop, nextLeftBot, currRightBot],
          badgeCenter: {
            x: (currRightTop.x + nextLeftTop.x) / 2,
            y: boxY + boxH / 2,
          },
          dropoffPct: next.metrics.stepDropoffPct,
          conversionPct: next.metrics.stepConversionPct,
        });
      }
    }
  } else {
    // VERTICAL FLOW (Top-to-Bottom)
    const connectorGap = n > 1 ? (config.showConnectors ? 0.34 : 0.16) : 0;
    const totalGaps = connectorGap * Math.max(0, n - 1);
    const stageH = (plotH - totalGaps) / Math.max(1, n);
    const totalSpan = n * stageH + totalGaps;
    const labelColW = config.showStageHeaders ? 2.45 : 0;
    const containerX = marginX + labelColW + (config.showStageHeaders ? 0.2 : 0);
    const containerW = plotW - labelColW - (config.showStageHeaders ? 0.2 : 0);

    for (let i = 0; i < n; i++) {
      const m = metricsList[i];
      const stageY = topPlotY + i * (stageH + connectorGap);
      const box = { x: containerX, y: stageY, w: containerW, h: stageH };
      const headerBox = {
        x: marginX,
        y: stageY,
        w: labelColW,
        h: stageH,
      };

      let entryRatio = m.prevRetentionPct / 100;
      let exitRatio = m.retentionPct / 100;
      if (isConstantSlope && totalSpan > 0) {
        const t0 = (i * (stageH + connectorGap)) / totalSpan;
        const t1 = (i * (stageH + connectorGap) + stageH) / totalSpan;
        entryRatio = slopeStartRatio + (slopeEndRatio - slopeStartRatio) * t0;
        exitRatio = slopeStartRatio + (slopeEndRatio - slopeStartRatio) * t1;
      }

      const predicate = buildContainerPredicate(
        config.containerMode,
        config.orientation,
        entryRatio,
        exitRatio,
        config.stageSizingMode,
        config.customMask,
      );

      const polygon = buildStagePolygon(
        box,
        config.containerMode,
        config.orientation,
        entryRatio,
        exitRatio,
        config.stageSizingMode,
      );

      const isTaperedTrapezoid =
        config.containerMode === ContainerMode.TRAPEZOID &&
        (config.stageSizingMode === StageSizingMode.TRAPEZOID_TAPER ||
          config.stageSizingMode === StageSizingMode.CONSTANT_SLOPE);

      const activeRatio = isTaperedTrapezoid ? 1 : m.retentionPct / 100;
      const includeGhost = isTaperedTrapezoid && config.showGhostDropoff;

      const res = packCellsInContainer(
        box,
        m.stage.iconDensity,
        predicate,
        config.fillDirection,
        config.iconSizePx,
        config.gapSpacingPx,
        activeRatio,
        includeGhost,
      );

      totalIconsRendered += res.cells.length;
      stageLayouts.push({
        metrics: m,
        box,
        polygon,
        headerBox,
        cells: res.cells,
        activeCellCount: res.activeCount,
      });
    }

    if (config.showConnectors && n > 1) {
      for (let i = 0; i < n - 1; i++) {
        const curr = stageLayouts[i];
        const next = stageLayouts[i + 1];
        const currBotLeft = curr.polygon[3];
        const currBotRight = curr.polygon[2];
        const nextTopLeft = next.polygon[0];
        const nextTopRight = next.polygon[1];

        connectors.push({
          fromStageIndex: i,
          toStageIndex: i + 1,
          polygon: [currBotLeft, currBotRight, nextTopRight, nextTopLeft],
          badgeCenter: {
            x: containerX + containerW / 2,
            y: (currBotLeft.y + nextTopLeft.y) / 2,
          },
          dropoffPct: next.metrics.stepDropoffPct,
          conversionPct: next.metrics.stepConversionPct,
        });
      }
    }
  }

  return {
    slideWidth,
    slideHeight,
    stages: stageLayouts,
    connectors,
    legendText: computeLegendText(metricsList),
    totalIconsRendered,
  };
}
