import PptxGenJS from 'pptxgenjs';
import { renderCustomIconVariant, renderPersonIconPng } from './canvasMaskProcessor';
import {
  buildArcSectorOutlinePoints,
  formatCompactNumber,
  formatPercent,
} from './gridPackingMath';
import { normalizeHexColor } from './palettes';
import {
  AspectRatioMode,
  FlowOrientation,
  Point2D,
  RenderStyle,
  SlideLayoutResult,
  StudioConfig,
  UnitIconPreset,
} from './types';

function stripHash(hex: string): string {
  return normalizeHexColor(hex).replace('#', '').toUpperCase();
}

function getRelativePolygonBounds(polygon: Point2D[]): {
  x: number;
  y: number;
  w: number;
  h: number;
  points: Array<{ x: number; y: number; moveTo?: boolean } | { close: true }>;
} {
  const xs = polygon.map((p) => p.x);
  const ys = polygon.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  const w = Math.max(0.01, maxX - minX);
  const h = Math.max(0.01, maxY - minY);

  const points: Array<{ x: number; y: number; moveTo?: boolean } | { close: true }> =
    polygon.map((p, idx) => ({
      x: Number((p.x - minX).toFixed(4)),
      y: Number((p.y - minY).toFixed(4)),
      ...(idx === 0 ? { moveTo: true } : {}),
    }));
  points.push({ close: true });

  return { x: minX, y: minY, w, h, points };
}

function mapPresetToPptxShape(
  preset: UnitIconPreset,
  pptx: PptxGenJS,
): PptxGenJS.SHAPE_NAME | null {
  switch (preset) {
    case UnitIconPreset.SQUARE:
      return pptx.ShapeType.rect;
    case UnitIconPreset.ROUNDED_SQUARE:
      return pptx.ShapeType.roundRect;
    case UnitIconPreset.CIRCLE:
      return pptx.ShapeType.ellipse;
    case UnitIconPreset.DIAMOND:
      return pptx.ShapeType.diamond;
    case UnitIconPreset.HEXAGON:
      return pptx.ShapeType.hexagon;
    case UnitIconPreset.STAR:
      return pptx.ShapeType.star5;
    case UnitIconPreset.PERSON:
    case UnitIconPreset.CUSTOM:
      return null;
  }
}

export async function exportSlideToPptx(
  config: StudioConfig,
  layout: SlideLayoutResult,
): Promise<void> {
  const pptx = new PptxGenJS();
  pptx.author = 'WaffleFlow Studio';
  pptx.title = config.slideTitle || 'WaffleFlow Funnel Slide';
  pptx.subject = 'Isotype Waffle & Multi-Stage Funnel';

  if (config.aspectRatio === AspectRatioMode.STANDARD_4_3) {
    pptx.layout = 'LAYOUT_4x3';
  } else {
    pptx.layout = 'LAYOUT_WIDE';
  }

  const slide = pptx.addSlide();
  slide.background = { color: 'FFFFFF' };

  const fontFace = 'Arial';
  const slideW = layout.slideWidth;

  // 1. Slide Title & Subtitle & Automatic Legend
  slide.addText(config.slideTitle || 'Untitled Funnel', {
    x: 0.55,
    y: 0.34,
    w: slideW - 4.1,
    h: 0.45,
    fontFace,
    fontSize: 20,
    bold: true,
    color: '0F172A',
    valign: 'middle',
    margin: 0,
  });

  if (config.slideSubtitle.trim().length > 0) {
    slide.addText(config.slideSubtitle, {
      x: 0.55,
      y: 0.78,
      w: slideW - 4.1,
      h: 0.32,
      fontFace,
      fontSize: 11,
      color: '475569',
      valign: 'middle',
      margin: 0,
    });
  }

  // Legend pill box (clean bordered container in slide export)
  slide.addShape(pptx.ShapeType.roundRect, {
    x: slideW - 3.45,
    y: 0.4,
    w: 2.9,
    h: 0.38,
    rectRadius: 0.15,
    fill: { color: 'F8FAFC' },
    line: { color: 'E2E8F0', width: 0.75 },
  });
  slide.addText(layout.legendText, {
    x: slideW - 3.35,
    y: 0.4,
    w: 2.7,
    h: 0.38,
    fontFace,
    fontSize: 9.5,
    bold: true,
    color: '334155',
    align: 'center',
    valign: 'middle',
    margin: 0,
  });

  // Hairline header rule
  slide.addShape(pptx.ShapeType.line, {
    x: 0.55,
    y: 1.22,
    w: slideW - 1.1,
    h: 0,
    line: { color: 'E2E8F0', width: 0.75 },
  });

  // 2. Transition Connectors (drawn underneath borders & icons)
  for (const conn of layout.connectors) {
    const bounds = getRelativePolygonBounds(conn.polygon);
    slide.addShape('custGeom' as PptxGenJS.SHAPE_NAME, {
      x: bounds.x,
      y: bounds.y,
      w: bounds.w,
      h: bounds.h,
      points: bounds.points,
      fill: { color: 'F1F5F9', transparency: 25 },
      line: config.transparentConnectorOutline
        ? { color: 'FFFFFF', transparency: 100, width: 0 }
        : { color: 'CBD5E1', width: 0.5, dashType: 'dash' },
    });

    const badgeW = 0.62;
    const badgeH = 0.24;
    slide.addShape(pptx.ShapeType.roundRect, {
      x: conn.badgeCenter.x - badgeW / 2,
      y: conn.badgeCenter.y - badgeH / 2,
      w: badgeW,
      h: badgeH,
      rectRadius: 0.2,
      fill: { color: 'FFFFFF' },
      line: config.transparentConnectorOutline
        ? { color: 'FFFFFF', transparency: 100, width: 0 }
        : { color: 'CBD5E1', width: 0.75 },
    });
    slide.addText(`-${formatPercent(conn.dropoffPct)}`, {
      x: conn.badgeCenter.x - badgeW / 2,
      y: conn.badgeCenter.y - badgeH / 2,
      w: badgeW,
      h: badgeH,
      fontFace,
      fontSize: 8.5,
      bold: true,
      color: 'DC2626',
      align: 'center',
      valign: 'middle',
      margin: 0,
    });
  }

  // 3. Pre-render custom / person raster PNGs per stage color if needed
  const inactiveHex = normalizeHexColor(config.inactiveTint, '#e2e8f0');
  const stageIconDataCache = new Map<string, string>();

  if (config.iconPreset === UnitIconPreset.CUSTOM && config.customIcon) {
    const uniqueColors = new Set<string>([
      inactiveHex,
      ...layout.stages.map((s) => normalizeHexColor(s.metrics.stage.color)),
    ]);
    await Promise.all(
      Array.from(uniqueColors).map(async (hex) => {
        const dataUrl = await renderCustomIconVariant(
          config.customIcon!.sourceDataUrl,
          hex,
          config.renderStyle,
          96,
        );
        stageIconDataCache.set(hex, dataUrl);
      }),
    );
  } else if (config.iconPreset === UnitIconPreset.PERSON) {
    const uniqueColors = new Set<string>([
      inactiveHex,
      ...layout.stages.map((s) => normalizeHexColor(s.metrics.stage.color)),
    ]);
    for (const hex of uniqueColors) {
      stageIconDataCache.set(hex, renderPersonIconPng(hex, config.renderStyle, 96));
    }
  }

  const nativeShape = mapPresetToPptxShape(config.iconPreset, pptx);
  const borderColor = stripHash(config.trapezoidBorderColor || '#cbd5e1');

  // 4. Stage Borders, Unit Icons, and Stage Labels
  for (const stageLayout of layout.stages) {
    const { metrics, polygon, headerBox, cells } = stageLayout;
    const stageHex = normalizeHexColor(metrics.stage.color);
    const stageColorNoHash = stripHash(stageHex);
    const inactiveNoHash = stripHash(inactiveHex);

    // Optional Trapezoid / Container / Parliament Arc Border
    if (config.showTrapezoidBorder) {
      const borderPoints = stageLayout.arcGeometry
        ? buildArcSectorOutlinePoints(stageLayout.arcGeometry)
        : polygon;
      const polyBounds = getRelativePolygonBounds(borderPoints);
      slide.addShape('custGeom' as PptxGenJS.SHAPE_NAME, {
        x: polyBounds.x,
        y: polyBounds.y,
        w: polyBounds.w,
        h: polyBounds.h,
        points: polyBounds.points,
        fill: { color: 'FFFFFF', transparency: 100 },
        line: { color: borderColor, width: 1 },
      });
    }

    // Individual Unit Icons
    for (const cell of cells) {
      const colorHex = cell.active ? stageHex : inactiveHex;
      const colorNoHash = cell.active ? stageColorNoHash : inactiveNoHash;

      if (nativeShape) {
        const isOutline = config.renderStyle === RenderStyle.OUTLINE;
        slide.addShape(nativeShape, {
          x: cell.x,
          y: cell.y,
          w: cell.w,
          h: cell.h,
          ...(config.iconPreset === UnitIconPreset.ROUNDED_SQUARE ? { rectRadius: 0.22 } : {}),
          fill: isOutline
            ? { color: 'FFFFFF', transparency: 100 }
            : {
                color: colorNoHash,
                ...(cell.isGhostOutsideTaper ? { transparency: 45 } : {}),
              },
          line: isOutline
            ? { color: colorNoHash, width: 1 }
            : { color: colorNoHash, width: 0 },
        });
      } else {
        const imgData = stageIconDataCache.get(colorHex);
        if (imgData) {
          slide.addImage({
            data: imgData,
            x: cell.x,
            y: cell.y,
            w: cell.w,
            h: cell.h,
          });
        }
      }
    }

    // Stage Labels (Headers, Values, Retention Badges)
    if (config.showStageHeaders) {
      const isHoriz = config.orientation === FlowOrientation.HORIZONTAL;
      const align = isHoriz ? 'center' : 'left';

      slide.addText(metrics.stage.label, {
        x: headerBox.x,
        y: isHoriz ? headerBox.y : headerBox.y + headerBox.h * 0.18,
        w: headerBox.w,
        h: 0.26,
        fontFace,
        fontSize: 11,
        bold: true,
        color: '0F172A',
        align,
        valign: 'middle',
        margin: 0,
      });

      const subParts: string[] = [];
      if (config.showAbsoluteValues) {
        subParts.push(formatCompactNumber(metrics.stage.value));
      }
      if (config.showPercentageBadges) {
        subParts.push(`${formatPercent(metrics.retentionPct)} of total`);
      }

      if (subParts.length > 0) {
        slide.addText(subParts.join('  ·  '), {
          x: headerBox.x,
          y: isHoriz ? headerBox.y + 0.26 : headerBox.y + headerBox.h * 0.18 + 0.28,
          w: headerBox.w,
          h: 0.24,
          fontFace,
          fontSize: 9.5,
          bold: false,
          color: stageColorNoHash,
          align,
          valign: 'middle',
          margin: 0,
        });
      }
    }
  }

  const safeSlug = (config.slideTitle || 'waffleflow-funnel')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  await pptx.writeFile({ fileName: `${safeSlug || 'waffleflow-funnel'}.pptx` });
}
