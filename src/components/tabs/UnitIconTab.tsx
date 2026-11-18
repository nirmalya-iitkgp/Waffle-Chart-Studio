import React, { useRef, useState } from 'react';
import { Loader2, Trash2, Upload } from 'lucide-react';
import { createCustomUnitIconFromFile } from '../../canvasMaskProcessor';
import { CustomUnitIcon, RenderStyle, UnitIconPreset } from '../../types';
import { UnitIconGlyphPreview } from '../UnitIconRenderer';

interface UnitIconTabProps {
  iconPreset: UnitIconPreset;
  renderStyle: RenderStyle;
  iconSizePx: number;
  gapSpacingPx: number;
  customIcon: CustomUnitIcon | null;
  customIconPreviewUrl?: string;
  isProcessingCustomIcon: boolean;
  customIconError: string | null;
  onIconPresetChange: (preset: UnitIconPreset) => void;
  onRenderStyleChange: (style: RenderStyle) => void;
  onIconSizeChange: (sizePx: number) => void;
  onGapSpacingChange: (gapPx: number) => void;
  onCustomIconUpload: (icon: CustomUnitIcon | null) => void;
}

const PRESET_ITEMS: Array<{ id: UnitIconPreset; label: string }> = [
  { id: UnitIconPreset.SQUARE, label: 'Square' },
  { id: UnitIconPreset.ROUNDED_SQUARE, label: 'Rounded' },
  { id: UnitIconPreset.CIRCLE, label: 'Circle' },
  { id: UnitIconPreset.DIAMOND, label: 'Diamond' },
  { id: UnitIconPreset.HEXAGON, label: 'Hexagon' },
  { id: UnitIconPreset.PERSON, label: 'Person' },
  { id: UnitIconPreset.STAR, label: 'Star' },
];

export const UnitIconTab: React.FC<UnitIconTabProps> = ({
  iconPreset,
  renderStyle,
  iconSizePx,
  gapSpacingPx,
  customIcon,
  customIconPreviewUrl,
  isProcessingCustomIcon,
  customIconError,
  onIconPresetChange,
  onRenderStyleChange,
  onIconSizeChange,
  onGapSpacingChange,
  onCustomIconUpload,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setIsLoadingFile(true);
    try {
      const iconData = await createCustomUnitIconFromFile(file);
      onCustomIconUpload(iconData);
      onIconPresetChange(UnitIconPreset.CUSTOM);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Unable to load icon image.');
    } finally {
      setIsLoadingFile(false);
      e.target.value = '';
    }
  };

  const activeError = uploadError || customIconError;

  return (
    <div className="space-y-6">
      {/* Render Style Toggle */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-slate-700">Render Style</label>
          <span className="text-xs text-slate-500">Applies to presets &amp; uploads</span>
        </div>
        <div
          className="grid grid-cols-2 p-1 bg-slate-100 rounded-lg border border-slate-200"
          role="group"
          aria-label="Unit icon render style"
        >
          <button
            type="button"
            onClick={() => onRenderStyleChange(RenderStyle.FILLED)}
            className={`py-2 px-3 text-xs font-medium rounded-md transition-colors min-h-[36px] ${
              renderStyle === RenderStyle.FILLED
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Filled Solid
          </button>
          <button
            type="button"
            onClick={() => onRenderStyleChange(RenderStyle.OUTLINE)}
            className={`py-2 px-3 text-xs font-medium rounded-md transition-colors min-h-[36px] ${
              renderStyle === RenderStyle.OUTLINE
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Outline Stroke
          </button>
        </div>
      </div>

      {/* Preset Shape Grid */}
      <div className="pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-xs font-semibold text-slate-700">Unit Icon Preset</label>
          <span className="text-xs text-slate-500">Native PPTX vectors</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {PRESET_ITEMS.map((item) => {
            const isSelected = iconPreset === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onIconPresetChange(item.id)}
                className={`flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg border text-xs font-medium transition-colors min-h-[64px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <UnitIconGlyphPreview
                  preset={item.id}
                  renderStyle={renderStyle}
                  color={isSelected ? '#ffffff' : '#0f172a'}
                  size={20}
                />
                <span className="truncate max-w-full">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom PNG / SVG Upload */}
      <div className="pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-slate-700">Custom PNG / SVG Icon</label>
          <span className="text-xs text-slate-500">Canvas alpha mask</span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.svg,image/png,image/svg+xml"
          onChange={handleFileChange}
          className="sr-only"
          aria-label="Upload custom unit icon PNG or SVG"
        />

        {customIcon ? (
          <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-md bg-white border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                {isProcessingCustomIcon ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                ) : (
                  <img
                    src={customIconPreviewUrl || customIcon.sourceDataUrl}
                    alt={customIcon.fileName}
                    className="w-8 h-8 object-contain"
                  />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 truncate">
                  {customIcon.fileName}
                </p>
                <p className="text-xs text-slate-500 tabular-nums">
                  {customIcon.width}×{customIcon.height}px ·{' '}
                  {renderStyle === RenderStyle.FILLED ? 'Alpha tint' : 'Edge outline'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {iconPreset !== UnitIconPreset.CUSTOM && (
                <button
                  type="button"
                  onClick={() => onIconPresetChange(UnitIconPreset.CUSTOM)}
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-100"
                >
                  Use
                </button>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-100"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={() => {
                  onCustomIconUpload(null);
                  if (iconPreset === UnitIconPreset.CUSTOM) {
                    onIconPresetChange(UnitIconPreset.ROUNDED_SQUARE);
                  }
                }}
                aria-label="Remove custom unit icon"
                className="p-1.5 text-slate-500 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoadingFile}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-dashed border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-slate-50/70 hover:bg-slate-100 hover:border-slate-400 transition-colors min-h-[48px]"
          >
            {isLoadingFile ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
            ) : (
              <Upload className="w-4 h-4 text-slate-500" />
            )}
            <span>{isLoadingFile ? 'Processing image...' : 'Upload .PNG or .SVG Unit Icon'}</span>
          </button>
        )}

        {activeError && (
          <p className="mt-2 text-xs text-red-600" role="alert">
            {activeError}
          </p>
        )}
      </div>

      {/* Sizing & Spacing Sliders */}
      <div className="pt-4 border-t border-slate-200 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="icon-size-slider" className="text-xs font-semibold text-slate-700">
              Icon Size
            </label>
            <span className="font-mono text-xs text-slate-600 tabular-nums">{iconSizePx} px</span>
          </div>
          <input
            id="icon-size-slider"
            type="range"
            min={8}
            max={28}
            step={1}
            value={iconSizePx}
            onChange={(e) => onIconSizeChange(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="gap-spacing-slider" className="text-xs font-semibold text-slate-700">
              Gap Spacing
            </label>
            <span className="font-mono text-xs text-slate-600 tabular-nums">{gapSpacingPx} px</span>
          </div>
          <input
            id="gap-spacing-slider"
            type="range"
            min={0}
            max={12}
            step={1}
            value={gapSpacingPx}
            onChange={(e) => onGapSpacingChange(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
