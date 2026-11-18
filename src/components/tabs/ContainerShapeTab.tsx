import React, { useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CircleDot,
  Filter,
  Grid3X3,
  ImagePlus,
  Loader2,
  Trash2,
  Triangle,
} from 'lucide-react';
import {
  createBuiltInSampleMask,
  createCustomSilhouetteMaskFromFile,
} from '../../canvasMaskProcessor';
import { ContainerMode, CustomMaskGrid, FillDirection } from '../../types';

interface ContainerShapeTabProps {
  containerMode: ContainerMode;
  fillDirection: FillDirection;
  customMask: CustomMaskGrid | null;
  onContainerModeChange: (mode: ContainerMode) => void;
  onFillDirectionChange: (dir: FillDirection) => void;
  onCustomMaskChange: (mask: CustomMaskGrid | null) => void;
}

const CONTAINER_MODES: Array<{
  id: ContainerMode;
  title: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    id: ContainerMode.TRAPEZOID,
    title: 'Funnel Trapezoid',
    description: 'Entry matches prior stage; tapers to current %',
    icon: <Filter className="w-4 h-4" />,
  },
  {
    id: ContainerMode.SQUARE_GRID,
    title: 'Square / Rectangle Grid',
    description: 'Classic balanced waffle matrix',
    icon: <Grid3X3 className="w-4 h-4" />,
  },
  {
    id: ContainerMode.DONUT,
    title: 'Parliament / Arc-Dot Chart',
    description: 'Concentric arc rows with per-stage rotation & arc length',
    icon: <CircleDot className="w-4 h-4" />,
  },
  {
    id: ContainerMode.TRIANGLE,
    title: 'Triangle / Pyramid',
    description: 'Tapered geometric pyramid containment',
    icon: <Triangle className="w-4 h-4" />,
  },
  {
    id: ContainerMode.CUSTOM_MASK,
    title: 'Custom Silhouette PNG Mask',
    description: 'Sample any dark/opaque PNG shape onto the grid',
    icon: <ImagePlus className="w-4 h-4" />,
  },
];

export const ContainerShapeTab: React.FC<ContainerShapeTabProps> = ({
  containerMode,
  fillDirection,
  customMask,
  onContainerModeChange,
  onFillDirectionChange,
  onCustomMaskChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isSampling, setIsSampling] = useState(false);
  const [maskError, setMaskError] = useState<string | null>(null);

  const handleMaskUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMaskError(null);
    setIsSampling(true);
    try {
      const mask = await createCustomSilhouetteMaskFromFile(file);
      onCustomMaskChange(mask);
      onContainerModeChange(ContainerMode.CUSTOM_MASK);
    } catch (err) {
      setMaskError(err instanceof Error ? err.message : 'Failed to sample silhouette PNG.');
    } finally {
      setIsSampling(false);
      e.target.value = '';
    }
  };

  const handleSamplePreset = (kind: 'house' | 'bottle' | 'lightbulb') => {
    setMaskError(null);
    const mask = createBuiltInSampleMask(kind);
    onCustomMaskChange(mask);
    onContainerModeChange(ContainerMode.CUSTOM_MASK);
  };

  return (
    <div className="space-y-6">
      {/* Macro Container Selector */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-xs font-semibold text-slate-700">Macro Container Shape</label>
          <span className="text-xs text-slate-500">Level 2 Geometry</span>
        </div>

        <div className="space-y-2">
          {CONTAINER_MODES.map((mode) => {
            const isSelected = containerMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => {
                  if (mode.id === ContainerMode.CUSTOM_MASK && !customMask) {
                    onCustomMaskChange(createBuiltInSampleMask('lightbulb'));
                  }
                  onContainerModeChange(mode.id);
                }}
                className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span
                  className={`mt-0.5 shrink-0 ${isSelected ? 'text-sky-300' : 'text-slate-500'}`}
                >
                  {mode.icon}
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-semibold">{mode.title}</div>
                  <div
                    className={`text-xs mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}
                  >
                    {mode.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Silhouette PNG Mask Panel */}
      {containerMode === ContainerMode.CUSTOM_MASK && (
        <div className="pt-4 border-t border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700">Silhouette Mask Asset</label>
            <span className="text-xs text-slate-500">128×128 Canvas Sampler</span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.svg,.webp,image/png,image/svg+xml,image/webp"
            onChange={handleMaskUpload}
            className="sr-only"
            aria-label="Upload custom silhouette PNG mask"
          />

          {customMask && (
            <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-md bg-white border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                  {customMask.previewDataUrl ? (
                    <img
                      src={customMask.previewDataUrl}
                      alt={customMask.fileName}
                      className="w-10 h-10 object-contain"
                    />
                  ) : (
                    <ImagePlus className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    {customMask.fileName}
                  </p>
                  <p className="text-xs text-slate-500 tabular-nums">
                    {Math.round(customMask.coverageRatio * 100)}% fill area
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onCustomMaskChange(null)}
                aria-label="Clear custom silhouette mask"
                className="p-1.5 text-slate-500 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSampling}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-dashed border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-slate-50/80 hover:bg-slate-100 hover:border-slate-400 transition-colors min-h-[42px]"
          >
            {isSampling ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ImagePlus className="w-4 h-4 text-slate-500" />
            )}
            <span>{isSampling ? 'Sampling Pixels...' : 'Upload High-Contrast Silhouette PNG'}</span>
          </button>

          <div>
            <p className="text-xs text-slate-500 mb-1.5">Or load a sample silhouette mask:</p>
            <div className="grid grid-cols-3 gap-2">
              {(['lightbulb', 'house', 'bottle'] as const).map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => handleSamplePreset(sample)}
                  className="py-1.5 px-2 text-xs font-medium capitalize text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>

          {maskError && (
            <p className="text-xs text-red-600" role="alert">
              {maskError}
            </p>
          )}
        </div>
      )}

      {/* Fill Direction Control */}
      <div className="pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-slate-700">Icon Fill Ordering</label>
          <span className="text-xs text-slate-500">Active progression</span>
        </div>
        <div
          className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200"
          role="group"
          aria-label="Fill direction"
        >
          <button
            type="button"
            onClick={() => onFillDirectionChange(FillDirection.BOTTOM_TO_TOP)}
            className={`inline-flex items-center justify-center gap-1 py-2 px-2 text-xs font-medium rounded-md transition-colors min-h-[36px] ${
              fillDirection === FillDirection.BOTTOM_TO_TOP
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowUp className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Bottom-Up</span>
          </button>
          <button
            type="button"
            onClick={() => onFillDirectionChange(FillDirection.TOP_TO_BOTTOM)}
            className={`inline-flex items-center justify-center gap-1 py-2 px-2 text-xs font-medium rounded-md transition-colors min-h-[36px] ${
              fillDirection === FillDirection.TOP_TO_BOTTOM
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowDown className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Top-Down</span>
          </button>
          <button
            type="button"
            onClick={() => onFillDirectionChange(FillDirection.LEFT_TO_RIGHT)}
            className={`inline-flex items-center justify-center gap-1 py-2 px-2 text-xs font-medium rounded-md transition-colors min-h-[36px] ${
              fillDirection === FillDirection.LEFT_TO_RIGHT
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Left-Right</span>
          </button>
        </div>
      </div>
    </div>
  );
};
