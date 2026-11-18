import React from 'react';
import { CORPORATE_PALETTES, normalizeHexColor } from '../../palettes';
import { FunnelStage, PalettePreset, StudioConfig } from '../../types';

interface PalettesTabProps {
  config: StudioConfig;
  onSelectPalette: (palette: PalettePreset) => void;
  onStageColorChange: (index: number, color: string) => void;
  onInactiveTintChange: (color: string) => void;
  onShowTrapezoidBorderChange: (show: boolean) => void;
  onTrapezoidBorderColorChange: (color: string) => void;
  onTransparentConnectorOutlineChange: (transparent: boolean) => void;
  onToggleTypography: (
    field: 'showStageHeaders' | 'showAbsoluteValues' | 'showPercentageBadges' | 'showConnectors',
    val: boolean,
  ) => void;
}

export const PalettesTab: React.FC<PalettesTabProps> = ({
  config,
  onSelectPalette,
  onStageColorChange,
  onInactiveTintChange,
  onShowTrapezoidBorderChange,
  onTrapezoidBorderColorChange,
  onTransparentConnectorOutlineChange,
  onToggleTypography,
}) => {
  const activeStages: FunnelStage[] = config.stages.slice(0, config.stageCount);

  return (
    <div className="space-y-6">
      {/* 6 Curated Corporate Palettes */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-xs font-semibold text-slate-700">Corporate Color Palettes</label>
          <span className="text-xs text-slate-500">6 curated themes</span>
        </div>
        <div className="space-y-2">
          {CORPORATE_PALETTES.map((palette) => {
            const isSelected = config.activePaletteId === palette.id;
            return (
              <button
                key={palette.id}
                type="button"
                onClick={() => onSelectPalette(palette)}
                className={`w-full p-2.5 rounded-lg border text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-semibold">{palette.name}</span>
                  <div className="flex items-center gap-1" aria-hidden="true">
                    {palette.colors.map((hex, i) => (
                      <span
                        key={`${palette.id}-${i}`}
                        className="w-4 h-4 rounded-xs border border-black/10"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </div>
                <p
                  className={`text-[11px] ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}
                >
                  {palette.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Per-Stage Custom Swatches */}
      <div className="pt-4 border-t border-slate-200 space-y-2.5">
        <label className="block text-xs font-semibold text-slate-700">
          Per-Stage Custom Swatches
        </label>
        <div className="space-y-2">
          {activeStages.map((stage, idx) => (
            <div
              key={stage.id}
              className="flex items-center justify-between gap-3 px-3 py-2 bg-white border border-slate-200 rounded-lg"
            >
              <span className="text-xs font-medium text-slate-800 truncate">{stage.label}</span>
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="color"
                  value={normalizeHexColor(stage.color)}
                  onChange={(e) => onStageColorChange(idx, e.target.value)}
                  aria-label={`Color picker for ${stage.label}`}
                  className="w-7 h-7 p-0.5 rounded border border-slate-200 cursor-pointer bg-white"
                />
                <input
                  type="text"
                  value={stage.color}
                  onChange={(e) => onStageColorChange(idx, e.target.value)}
                  aria-label={`Hex color for ${stage.label}`}
                  className="w-20 px-2 py-1 font-mono text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-slate-900 focus:outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Inactive Tint & Trapezoid Border */}
      <div className="pt-4 border-t border-slate-200 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="inactive-tint-hex" className="text-xs font-semibold text-slate-700">
            Inactive / Drop-off Unit Tint
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={normalizeHexColor(config.inactiveTint, '#e2e8f0')}
              onChange={(e) => onInactiveTintChange(e.target.value)}
              aria-label="Inactive unit tint color picker"
              className="w-7 h-7 p-0.5 rounded border border-slate-200 cursor-pointer bg-white"
            />
            <input
              id="inactive-tint-hex"
              type="text"
              value={config.inactiveTint}
              onChange={(e) => onInactiveTintChange(e.target.value)}
              className="w-20 px-2 py-1 font-mono text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-slate-900 focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <span>Trapezoid / Container Border Stroke</span>
            <input
              type="checkbox"
              checked={config.showTrapezoidBorder}
              onChange={(e) => onShowTrapezoidBorderChange(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-[#003f5c] focus:ring-slate-900"
            />
          </label>

          {config.showTrapezoidBorder && (
            <div className="flex items-center justify-between gap-3 pl-2">
              <label htmlFor="border-stroke-hex" className="text-xs text-slate-600">
                Border Stroke Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={normalizeHexColor(config.trapezoidBorderColor, '#cbd5e1')}
                  onChange={(e) => onTrapezoidBorderColorChange(e.target.value)}
                  aria-label="Border stroke color picker"
                  className="w-7 h-7 p-0.5 rounded border border-slate-200 cursor-pointer bg-white"
                />
                <input
                  id="border-stroke-hex"
                  type="text"
                  value={config.trapezoidBorderColor}
                  onChange={(e) => onTrapezoidBorderColorChange(e.target.value)}
                  className="w-20 px-2 py-1 font-mono text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-slate-900 focus:outline-none"
                />
              </div>
            </div>
          )}

          <label className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-700 cursor-pointer pt-1">
            <span>Transparent Connector Outlines</span>
            <input
              type="checkbox"
              checked={config.transparentConnectorOutline}
              onChange={(e) => onTransparentConnectorOutlineChange(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-[#003f5c] focus:ring-slate-900"
            />
          </label>
        </div>
      </div>

      {/* Typography & Callout Toggles */}
      <div className="pt-4 border-t border-slate-200 space-y-2.5">
        <span className="block text-xs font-semibold text-slate-700">
          Slide Typography &amp; Labels
        </span>
        <label className="flex items-center justify-between text-xs text-slate-700 cursor-pointer">
          <span>Show Stage Headers</span>
          <input
            type="checkbox"
            checked={config.showStageHeaders}
            onChange={(e) => onToggleTypography('showStageHeaders', e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-[#003f5c] focus:ring-slate-900"
          />
        </label>
        <label className="flex items-center justify-between text-xs text-slate-700 cursor-pointer">
          <span>Show Absolute Values</span>
          <input
            type="checkbox"
            checked={config.showAbsoluteValues}
            onChange={(e) => onToggleTypography('showAbsoluteValues', e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-[#003f5c] focus:ring-slate-900"
          />
        </label>
        <label className="flex items-center justify-between text-xs text-slate-700 cursor-pointer">
          <span>Show Percentage Badges</span>
          <input
            type="checkbox"
            checked={config.showPercentageBadges}
            onChange={(e) => onToggleTypography('showPercentageBadges', e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-[#003f5c] focus:ring-slate-900"
          />
        </label>
        <label className="flex items-center justify-between text-xs text-slate-700 cursor-pointer">
          <span>Show Drop-off Connectors</span>
          <input
            type="checkbox"
            checked={config.showConnectors}
            onChange={(e) => onToggleTypography('showConnectors', e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-[#003f5c] focus:ring-slate-900"
          />
        </label>
      </div>
    </div>
  );
};
