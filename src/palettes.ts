import {
  AspectRatioMode,
  ContainerMode,
  FillDirection,
  FlowOrientation,
  FunnelStage,
  PalettePreset,
  RenderStyle,
  StageSizingMode,
  StudioConfig,
  UnitIconPreset,
} from './types';

export const CORPORATE_PALETTES: PalettePreset[] = [
  {
    id: 'consulting-blues',
    name: 'Consulting Blues',
    description: 'Deep navy to executive berry gradient',
    colors: ['#003f5c', '#2f4b7c', '#665191', '#a05195', '#d45087'],
  },
  {
    id: 'corporate-emerald',
    name: 'Corporate Emerald',
    description: 'Forest slate to crisp mint',
    colors: ['#1b4332', '#2d6a4f', '#40916c', '#52b788', '#74c69d'],
  },
  {
    id: 'terracotta-slate',
    name: 'Terracotta & Slate',
    description: 'Editorial petrol, amber, and coral',
    colors: ['#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51'],
  },
  {
    id: 'monochrome-executive',
    name: 'Monochrome Executive',
    description: 'Architectural charcoal scale',
    colors: ['#0f172a', '#334155', '#475569', '#64748b', '#94a3b8'],
  },
  {
    id: 'vibrant-product',
    name: 'Vibrant Product',
    description: 'High-contrast SaaS telemetry',
    colors: ['#2563eb', '#7c3aed', '#db2777', '#ea580c', '#059669'],
  },
  {
    id: 'colorblind-viridis',
    name: 'Colorblind-Safe Viridis',
    description: 'Perceptually uniform accessible scale',
    colors: ['#440154', '#3b528b', '#21918c', '#5ec962', '#fde725'],
  },
];

export function createDefaultColorSlices(
  paletteColors: readonly string[] = CORPORATE_PALETTES[0].colors,
) {
  return [
    {
      id: 'slice-1',
      label: 'Segment A',
      share: 45,
      color: paletteColors[0] ?? '#003f5c',
    },
    {
      id: 'slice-2',
      label: 'Segment B',
      share: 35,
      color: paletteColors[1] ?? '#2f4b7c',
    },
    {
      id: 'slice-3',
      label: 'Segment C',
      share: 20,
      color: paletteColors[3] ?? '#a05195',
    },
  ];
}

export const DEFAULT_SAAS_STAGES: FunnelStage[] = [
  {
    id: 'stage-1',
    label: 'Website Visitors',
    value: 10000,
    iconDensity: 180,
    color: CORPORATE_PALETTES[0].colors[0],
    arcSweepDeg: 180,
    arcRotationDeg: 0,
    multiColorEnabled: false,
    colorSlices: createDefaultColorSlices(CORPORATE_PALETTES[0].colors),
  },
  {
    id: 'stage-2',
    label: 'Product Signups',
    value: 3400,
    iconDensity: 120,
    color: CORPORATE_PALETTES[0].colors[1],
    arcSweepDeg: 180,
    arcRotationDeg: 0,
    multiColorEnabled: false,
    colorSlices: createDefaultColorSlices(CORPORATE_PALETTES[0].colors),
  },
  {
    id: 'stage-3',
    label: 'Active Teams',
    value: 1450,
    iconDensity: 80,
    color: CORPORATE_PALETTES[0].colors[2],
    arcSweepDeg: 180,
    arcRotationDeg: 0,
    multiColorEnabled: false,
    colorSlices: createDefaultColorSlices(CORPORATE_PALETTES[0].colors),
  },
  {
    id: 'stage-4',
    label: 'Paid Customers',
    value: 520,
    iconDensity: 45,
    color: CORPORATE_PALETTES[0].colors[3],
    arcSweepDeg: 180,
    arcRotationDeg: 0,
    multiColorEnabled: false,
    colorSlices: createDefaultColorSlices(CORPORATE_PALETTES[0].colors),
  },
  {
    id: 'stage-5',
    label: 'Enterprise Expansion',
    value: 180,
    iconDensity: 24,
    color: CORPORATE_PALETTES[0].colors[4],
    arcSweepDeg: 180,
    arcRotationDeg: 0,
    multiColorEnabled: false,
    colorSlices: createDefaultColorSlices(CORPORATE_PALETTES[0].colors),
  },
];

export const INITIAL_STUDIO_CONFIG: StudioConfig = {
  slideTitle: 'B2B SaaS Acquisition & Conversion Funnel',
  slideSubtitle: 'Q4 Self-Serve Pipeline · Cohorted Monthly Account Progression',
  aspectRatio: AspectRatioMode.WIDE_16_9,
  orientation: FlowOrientation.HORIZONTAL,

  iconPreset: UnitIconPreset.ROUNDED_SQUARE,
  renderStyle: RenderStyle.FILLED,
  iconSizePx: 16,
  gapSpacingPx: 3,
  customIcon: null,

  containerMode: ContainerMode.TRAPEZOID,
  fillDirection: FillDirection.BOTTOM_TO_TOP,
  customMask: null,

  stageCount: 4,
  stages: DEFAULT_SAAS_STAGES,
  stageSizingMode: StageSizingMode.TRAPEZOID_TAPER,
  showConnectors: true,
  showGhostDropoff: false,

  activePaletteId: CORPORATE_PALETTES[0].id,
  inactiveTint: '#e2e8f0',
  showTrapezoidBorder: true,
  trapezoidBorderColor: '#cbd5e1',
  transparentConnectorOutline: false,
  showStageHeaders: true,
  showAbsoluteValues: true,
  showPercentageBadges: true,
};

export function normalizeHexColor(hex: string, fallback = '#003f5c'): string {
  const cleaned = hex.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(cleaned)) {
    return cleaned.toLowerCase();
  }
  if (/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    return `#${cleaned.toLowerCase()}`;
  }
  return fallback;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = normalizeHexColor(hex).slice(1);
  const num = parseInt(normalized, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function getContrastTextColor(bgHex: string): string {
  const { r, g, b } = hexToRgb(bgHex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? '#0f172a' : '#ffffff';
}
