export enum AspectRatioMode {
  WIDE_16_9 = '16:9',
  STANDARD_4_3 = '4:3',
}

export enum FlowOrientation {
  HORIZONTAL = 'horizontal',
  VERTICAL = 'vertical',
}

export enum UnitIconPreset {
  SQUARE = 'square',
  ROUNDED_SQUARE = 'rounded-square',
  CIRCLE = 'circle',
  DIAMOND = 'diamond',
  HEXAGON = 'hexagon',
  PERSON = 'person',
  STAR = 'star',
  CUSTOM = 'custom',
}

export enum RenderStyle {
  FILLED = 'filled',
  OUTLINE = 'outline',
}

export enum ContainerMode {
  TRAPEZOID = 'trapezoid',
  SQUARE_GRID = 'square-grid',
  DONUT = 'donut',
  TRIANGLE = 'triangle',
  CUSTOM_MASK = 'custom-mask',
}

export enum FillDirection {
  BOTTOM_TO_TOP = 'bottom-to-top',
  TOP_TO_BOTTOM = 'top-to-bottom',
  LEFT_TO_RIGHT = 'left-to-right',
}

export enum StageSizingMode {
  TRAPEZOID_TAPER = 'trapezoid-taper',
  CONSTANT_SLOPE = 'constant-slope',
  FIXED_CONTAINER = 'fixed-container',
}

export type SidebarTabId = 'unit-icon' | 'container-shape' | 'stages' | 'palettes';

export interface StageColorSlice {
  id: string;
  label: string;
  share: number;
  color: string;
}

export interface FunnelStage {
  id: string;
  label: string;
  value: number;
  iconDensity: number;
  color: string;
  /** Arc sweep angle in degrees (30–360) for Parliament / Arc-Dot mode */
  arcSweepDeg: number;
  /** Arc rotation offset in degrees (-180–180) for Parliament / Arc-Dot mode */
  arcRotationDeg: number;
  /** Enable multiple color segments inside this stage's macro container */
  multiColorEnabled: boolean;
  /** Ordered color breakdown slices used when multiColorEnabled is true */
  colorSlices: StageColorSlice[];
}

export interface PalettePreset {
  id: string;
  name: string;
  description: string;
  colors: [string, string, string, string, string];
}

export interface CustomMaskGrid {
  width: number;
  height: number;
  /** Row-major 0/1 occupancy array where 1 = inside silhouette */
  occupancy: Uint8Array;
  previewDataUrl: string;
  fileName: string;
  coverageRatio: number;
}

export interface CustomUnitIcon {
  fileName: string;
  sourceDataUrl: string;
  isSvg: boolean;
  width: number;
  height: number;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface UnitCell {
  x: number;
  y: number;
  w: number;
  h: number;
  active: boolean;
  color?: string;
  isGhostOutsideTaper?: boolean;
}

export interface StageComputedMetrics {
  stage: FunnelStage;
  index: number;
  retentionPct: number;
  prevRetentionPct: number;
  stepConversionPct: number;
  stepDropoffPct: number;
}

export interface ArcSectorGeometry {
  cx: number;
  cy: number;
  innerR: number;
  outerR: number;
  startAngleRad: number;
  endAngleRad: number;
  sweepDeg: number;
}

export interface StageLayoutResult {
  metrics: StageComputedMetrics;
  /** Bounding box of the icon container in slide inches */
  box: { x: number; y: number; w: number; h: number };
  /** Exact 4-corner polygon for trapezoid border (or rectangle) in slide inches */
  polygon: Point2D[];
  /** Optional annular sector geometry when in Parliament / Arc-Dot mode */
  arcGeometry?: ArcSectorGeometry;
  /** Header text bounding box in slide inches */
  headerBox: { x: number; y: number; w: number; h: number };
  /** All packed unit cells in slide inches */
  cells: UnitCell[];
  /** Number of active units rendered */
  activeCellCount: number;
}

export interface ConnectorLayout {
  fromStageIndex: number;
  toStageIndex: number;
  polygon: Point2D[];
  badgeCenter: Point2D;
  dropoffPct: number;
  conversionPct: number;
}

export interface SlideLayoutResult {
  slideWidth: number;
  slideHeight: number;
  stages: StageLayoutResult[];
  connectors: ConnectorLayout[];
  legendText: string;
  totalIconsRendered: number;
}

export interface StudioConfig {
  slideTitle: string;
  slideSubtitle: string;
  aspectRatio: AspectRatioMode;
  orientation: FlowOrientation;

  // Level 1: Unit Icon
  iconPreset: UnitIconPreset;
  renderStyle: RenderStyle;
  iconSizePx: number;
  gapSpacingPx: number;
  customIcon: CustomUnitIcon | null;

  // Level 2: Container Shape
  containerMode: ContainerMode;
  fillDirection: FillDirection;
  customMask: CustomMaskGrid | null;

  // Level 3: Stages & Funnel Flow
  stageCount: number;
  stages: FunnelStage[];
  stageSizingMode: StageSizingMode;
  showConnectors: boolean;
  showGhostDropoff: boolean;

  // Styling & Palettes
  activePaletteId: string;
  inactiveTint: string;
  showTrapezoidBorder: boolean;
  trapezoidBorderColor: string;
  transparentConnectorOutline: boolean;
  showStageHeaders: boolean;
  showAbsoluteValues: boolean;
  showPercentageBadges: boolean;
}
