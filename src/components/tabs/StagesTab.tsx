import React from 'react';
import { Equal, Plus, RotateCw, Trash2 } from 'lucide-react';
import {
  computeSlicePercentages,
  computeStageMetrics,
  formatPercent,
} from '../../gridPackingMath';
import { CORPORATE_PALETTES } from '../../palettes';
import { ContainerMode, FunnelStage, StageSizingMode, StudioConfig } from '../../types';

interface StagesTabProps {
  config: StudioConfig;
  onStageCountChange: (count: number) => void;
  onStageSizingModeChange: (mode: StageSizingMode) => void;
  onShowConnectorsChange: (show: boolean) => void;
  onTransparentConnectorOutlineChange: (transparent: boolean) => void;
  onShowGhostDropoffChange: (show: boolean) => void;
  onUpdateStage: (index: number, patch: Partial<FunnelStage>) => void;
  onUpdateStageByDropoff: (index: number, dropoffPct: number) => void;
  onSyncAllDensities: (density: number) => void;
  onSyncAllArcs: (arcSweepDeg: number, arcRotationDeg: number) => void;
}

export const StagesTab: React.FC<StagesTabProps> = ({
  config,
  onStageCountChange,
  onStageSizingModeChange,
  onShowConnectorsChange,
  onTransparentConnectorOutlineChange,
  onShowGhostDropoffChange,
  onUpdateStage,
  onUpdateStageByDropoff,
  onSyncAllDensities,
  onSyncAllArcs,
}) => {
  const metricsList = computeStageMetrics(config);
  const isParliamentArcMode = config.containerMode === ContainerMode.DONUT;

  return (
    <div className="space-y-5">
      {/* Stage Count Selector */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-slate-700">Active Funnel Stages</label>
          <span className="text-xs text-slate-500">
            {config.stageCount === 1 ? 'Single Waffle' : `${config.stageCount}-Stage Funnel`}
          </span>
        </div>
        <div
          className="grid grid-cols-5 gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200"
          role="group"
          aria-label="Stage count"
        >
          {[1, 2, 3, 4, 5].map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => onStageCountChange(count)}
              className={`py-1.5 text-xs font-semibold rounded-md transition-colors tabular-nums min-h-[34px] ${
                config.stageCount === count
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {count}
            </button>
          ))}
        </div>
      </div>

      {/* Stage Sizing Mode */}
      <div className="pt-4 border-t border-slate-200 space-y-3">
        <label className="block text-xs font-semibold text-slate-700">Stage Sizing Mode</label>
        <div
          className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200"
          role="group"
          aria-label="Stage sizing mode"
        >
          <button
            type="button"
            onClick={() => onStageSizingModeChange(StageSizingMode.TRAPEZOID_TAPER)}
            className={`py-2 px-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap min-h-[36px] ${
              config.stageSizingMode === StageSizingMode.TRAPEZOID_TAPER
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Trapezoid
          </button>
          <button
            type="button"
            onClick={() => onStageSizingModeChange(StageSizingMode.CONSTANT_SLOPE)}
            className={`py-2 px-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap min-h-[36px] ${
              config.stageSizingMode === StageSizingMode.CONSTANT_SLOPE
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Constant Slope
          </button>
          <button
            type="button"
            onClick={() => onStageSizingModeChange(StageSizingMode.FIXED_CONTAINER)}
            className={`py-2 px-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap min-h-[36px] ${
              config.stageSizingMode === StageSizingMode.FIXED_CONTAINER
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Uniform
          </button>
        </div>

        <div className="space-y-2 pt-1">
          <label className="flex items-center justify-between gap-2 text-xs text-slate-700 cursor-pointer">
            <span>Transition Connectors &amp; Drop-off Badges</span>
            <input
              type="checkbox"
              checked={config.showConnectors}
              onChange={(e) => onShowConnectorsChange(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-[#003f5c] focus:ring-slate-900"
            />
          </label>

          {config.showConnectors && (
            <label className="flex items-center justify-between gap-2 text-xs text-slate-700 cursor-pointer pl-3">
              <span>Transparent Connector Outlines</span>
              <input
                type="checkbox"
                checked={config.transparentConnectorOutline}
                onChange={(e) => onTransparentConnectorOutlineChange(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-[#003f5c] focus:ring-slate-900"
              />
            </label>
          )}

          {(config.stageSizingMode === StageSizingMode.TRAPEZOID_TAPER ||
            config.stageSizingMode === StageSizingMode.CONSTANT_SLOPE) && (
            <label className="flex items-center justify-between gap-2 text-xs text-slate-700 cursor-pointer">
              <span>Show Muted Ghost Drop-off Icons</span>
              <input
                type="checkbox"
                checked={config.showGhostDropoff}
                onChange={(e) => onShowGhostDropoffChange(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-[#003f5c] focus:ring-slate-900"
              />
            </label>
          )}
        </div>
      </div>

      {/* Per-Stage Configuration List */}
      <div className="pt-4 border-t border-slate-200 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-700">Stage Data &amp; Icon Density</span>
          <div className="flex items-center gap-3">
            {isParliamentArcMode && (
              <button
                type="button"
                onClick={() =>
                  onSyncAllArcs(
                    metricsList[0]?.stage.arcSweepDeg ?? 180,
                    metricsList[0]?.stage.arcRotationDeg ?? 0,
                  )
                }
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 underline underline-offset-2"
                title="Apply Stage 1 arc length & rotation to all stages"
              >
                <RotateCw className="w-3 h-3" />
                <span>Sync arcs</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onSyncAllDensities(metricsList[0]?.stage.iconDensity ?? 100)}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 underline underline-offset-2"
              title="Set all stages to match Stage 1 icon count"
            >
              <Equal className="w-3 h-3" />
              <span>Uniform density</span>
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg bg-white">
          {metricsList.map((m) => {
            const { stage, index, retentionPct, stepConversionPct, stepDropoffPct } = m;
            return (
              <div key={stage.id} className="p-3.5 space-y-3">
                {/* Stage Header Row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                      className="w-3 h-3 rounded-xs shrink-0"
                      style={{ backgroundColor: stage.color }}
                      aria-hidden="true"
                    />
                    <input
                      type="text"
                      value={stage.label}
                      onChange={(e) => onUpdateStage(index, { label: e.target.value })}
                      aria-label={`Stage ${index + 1} label`}
                      className="w-full text-xs font-semibold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-slate-900 focus:outline-none py-0.5"
                    />
                  </div>
                  <span className="font-mono text-xs text-slate-500 tabular-nums shrink-0">
                    {formatPercent(retentionPct)} total
                  </span>
                </div>

                {/* Value & Direct % Drop-off Input */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label
                      htmlFor={`stage-val-${index}`}
                      className="block text-[11px] font-medium text-slate-500 mb-1"
                    >
                      Stage Value
                    </label>
                    <input
                      id={`stage-val-${index}`}
                      type="number"
                      min={0}
                      step={10}
                      value={stage.value}
                      onChange={(e) => {
                        const nextVal = Math.max(0, Number(e.target.value) || 0);
                        onUpdateStage(index, { value: nextVal });
                      }}
                      className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums text-slate-900 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-slate-900 focus:outline-none"
                    />
                  </div>

                  {index > 0 ? (
                    <div>
                      <label
                        htmlFor={`stage-dropoff-${index}`}
                        className="block text-[11px] font-medium text-slate-500 mb-1"
                      >
                        Step Drop-off %
                      </label>
                      <div className="relative">
                        <input
                          id={`stage-dropoff-${index}`}
                          type="number"
                          min={0}
                          max={100}
                          step={0.5}
                          value={Number(stepDropoffPct.toFixed(1))}
                          onChange={(e) => {
                            const drop = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                            onUpdateStageByDropoff(index, drop);
                          }}
                          className="w-full pr-6 pl-2.5 py-1.5 text-xs font-mono tabular-nums text-slate-900 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-slate-900 focus:outline-none"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                          %
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <span className="block text-[11px] font-medium text-slate-500 mb-1">
                        Baseline Anchor
                      </span>
                      <div className="px-2.5 py-1.5 text-xs font-mono tabular-nums text-slate-600 bg-slate-50 border border-slate-200 rounded-md">
                        100% Entry
                      </div>
                    </div>
                  )}
                </div>

                {/* Conversion summary line */}
                {index > 0 && (
                  <div className="flex items-center justify-between text-[11px] text-slate-500 tabular-nums">
                    <span>Step conversion: {formatPercent(stepConversionPct)}</span>
                    <span>Drop-off: -{formatPercent(stepDropoffPct)}</span>
                  </div>
                )}

                {/* Per-Stage Icon Density Slider */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor={`stage-density-${index}`}
                      className="text-[11px] font-medium text-slate-600"
                    >
                      Icon Density
                    </label>
                    <span className="font-mono text-[11px] text-slate-700 tabular-nums">
                      {stage.iconDensity} icons
                    </span>
                  </div>
                  <input
                    id={`stage-density-${index}`}
                    type="range"
                    min={10}
                    max={400}
                    step={1}
                    value={stage.iconDensity}
                    onChange={(e) =>
                      onUpdateStage(index, { iconDensity: Number(e.target.value) })
                    }
                    className="w-full h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Parliament / Arc-Dot Geometry Controls per Stage */}
                {isParliamentArcMode && (
                  <div className="pt-2.5 border-t border-slate-100 space-y-2.5">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label
                          htmlFor={`stage-arc-sweep-${index}`}
                          className="text-[11px] font-medium text-slate-600"
                        >
                          Arc Length
                        </label>
                        <div className="flex items-center gap-1.5">
                          <div className="inline-flex items-center gap-0.5">
                            {[90, 180, 270, 360].map((presetDeg) => (
                              <button
                                key={presetDeg}
                                type="button"
                                onClick={() => onUpdateStage(index, { arcSweepDeg: presetDeg })}
                                className={`px-1.5 py-0.5 text-[10px] font-mono rounded border transition-colors ${
                                  stage.arcSweepDeg === presetDeg
                                    ? 'bg-slate-900 text-white border-slate-900'
                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {presetDeg}°
                              </button>
                            ))}
                          </div>
                          <input
                            id={`stage-arc-sweep-num-${index}`}
                            type="number"
                            min={30}
                            max={360}
                            step={5}
                            aria-label={`Stage ${index + 1} arc length degrees`}
                            value={stage.arcSweepDeg}
                            onChange={(e) => {
                              const val = Math.max(30, Math.min(360, Number(e.target.value) || 180));
                              onUpdateStage(index, { arcSweepDeg: val });
                            }}
                            className="w-12 px-1.5 py-0.5 text-[11px] font-mono tabular-nums text-right text-slate-800 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-slate-900 focus:outline-none"
                          />
                        </div>
                      </div>
                      <input
                        id={`stage-arc-sweep-${index}`}
                        type="range"
                        min={30}
                        max={360}
                        step={5}
                        aria-label={`Stage ${index + 1} arc length slider`}
                        value={stage.arcSweepDeg}
                        onChange={(e) =>
                          onUpdateStage(index, { arcSweepDeg: Number(e.target.value) })
                        }
                        className="w-full h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label
                          htmlFor={`stage-arc-rot-${index}`}
                          className="text-[11px] font-medium text-slate-600"
                        >
                          Arc Rotation
                        </label>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onUpdateStage(index, { arcRotationDeg: 0 })}
                            className="px-1.5 py-0.5 text-[10px] font-medium rounded border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                          >
                            Reset 0°
                          </button>
                          <input
                            id={`stage-arc-rot-num-${index}`}
                            type="number"
                            min={-180}
                            max={180}
                            step={5}
                            aria-label={`Stage ${index + 1} arc rotation degrees`}
                            value={stage.arcRotationDeg}
                            onChange={(e) => {
                              const val = Math.max(-180, Math.min(180, Number(e.target.value) || 0));
                              onUpdateStage(index, { arcRotationDeg: val });
                            }}
                            className="w-12 px-1.5 py-0.5 text-[11px] font-mono tabular-nums text-right text-slate-800 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-slate-900 focus:outline-none"
                          />
                        </div>
                      </div>
                      <input
                        id={`stage-arc-rot-${index}`}
                        type="range"
                        min={-180}
                        max={180}
                        step={5}
                        aria-label={`Stage ${index + 1} arc rotation slider`}
                        value={stage.arcRotationDeg}
                        onChange={(e) =>
                          onUpdateStage(index, { arcRotationDeg: Number(e.target.value) })
                        }
                        className="w-full h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {/* Multi-Color Container Segments Controls per Stage */}
                <div className="pt-2.5 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor={`stage-multicolor-${index}`}
                      className="text-[11px] font-medium text-slate-700 cursor-pointer"
                    >
                      Multi-Color Container Segments
                    </label>
                    <input
                      id={`stage-multicolor-${index}`}
                      type="checkbox"
                      aria-label={`Stage ${index + 1} multi-color segments`}
                      checked={stage.multiColorEnabled}
                      onChange={(e) =>
                        onUpdateStage(index, { multiColorEnabled: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-slate-300 text-[#003f5c] focus:ring-slate-900 cursor-pointer"
                    />
                  </div>

                  {stage.multiColorEnabled && (() => {
                    const pcts = computeSlicePercentages(stage);
                    const paletteColors =
                      CORPORATE_PALETTES.find((p) => p.id === config.activePaletteId)?.colors ??
                      CORPORATE_PALETTES[0].colors;

                    return (
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Split active icons by color</span>
                          <button
                            type="button"
                            onClick={() => {
                              const equalShare = Number(
                                (100 / Math.max(1, stage.colorSlices.length)).toFixed(1),
                              );
                              onUpdateStage(index, {
                                colorSlices: stage.colorSlices.map((sl) => ({
                                  ...sl,
                                  share: equalShare,
                                })),
                              });
                            }}
                            className="font-medium text-slate-600 hover:text-slate-900 underline underline-offset-2"
                          >
                            Equal split
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          {stage.colorSlices.map((slice, sIdx) => (
                            <div
                              key={slice.id}
                              className="flex items-center gap-1.5"
                            >
                              <input
                                type="color"
                                value={slice.color}
                                aria-label={`Stage ${index + 1} segment ${sIdx + 1} color`}
                                onChange={(e) => {
                                  const next = stage.colorSlices.map((sl, i) =>
                                    i === sIdx ? { ...sl, color: e.target.value } : sl,
                                  );
                                  onUpdateStage(index, { colorSlices: next });
                                }}
                                className="w-6 h-6 rounded border border-slate-200 cursor-pointer shrink-0 p-0 bg-transparent"
                              />
                              <input
                                type="text"
                                value={slice.label}
                                aria-label={`Stage ${index + 1} segment ${sIdx + 1} label`}
                                onChange={(e) => {
                                  const next = stage.colorSlices.map((sl, i) =>
                                    i === sIdx ? { ...sl, label: e.target.value } : sl,
                                  );
                                  onUpdateStage(index, { colorSlices: next });
                                }}
                                className="flex-1 min-w-0 px-2 py-1 text-[11px] text-slate-800 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-slate-900 focus:outline-none"
                              />
                              <input
                                type="number"
                                min={0}
                                step={1}
                                value={slice.share}
                                aria-label={`Stage ${index + 1} segment ${sIdx + 1} share`}
                                onChange={(e) => {
                                  const val = Math.max(0, Number(e.target.value) || 0);
                                  const next = stage.colorSlices.map((sl, i) =>
                                    i === sIdx ? { ...sl, share: val } : sl,
                                  );
                                  onUpdateStage(index, { colorSlices: next });
                                }}
                                className="w-12 px-1.5 py-1 text-[11px] font-mono tabular-nums text-right text-slate-800 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-slate-900 focus:outline-none shrink-0"
                              />
                              <span className="w-9 text-right font-mono text-[10px] text-slate-500 tabular-nums shrink-0">
                                {Math.round(pcts[sIdx] ?? 0)}%
                              </span>
                              <button
                                type="button"
                                disabled={stage.colorSlices.length <= 2}
                                aria-label={`Remove stage ${index + 1} segment ${sIdx + 1}`}
                                onClick={() => {
                                  if (stage.colorSlices.length <= 2) return;
                                  onUpdateStage(index, {
                                    colorSlices: stage.colorSlices.filter((_, i) => i !== sIdx),
                                  });
                                }}
                                className="p-1 text-slate-400 hover:text-red-600 disabled:opacity-30 disabled:pointer-events-none shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>

                        {stage.colorSlices.length < 6 && (
                          <button
                            type="button"
                            onClick={() => {
                              const nextIdx = stage.colorSlices.length;
                              const nextLetter = String.fromCharCode(65 + nextIdx);
                              const nextColor = paletteColors[nextIdx % paletteColors.length];
                              onUpdateStage(index, {
                                colorSlices: [
                                  ...stage.colorSlices,
                                  {
                                    id: `slice-${Date.now()}-${nextIdx}`,
                                    label: `Segment ${nextLetter}`,
                                    share: 20,
                                    color: nextColor,
                                  },
                                ],
                              });
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-[#003f5c] hover:text-slate-900"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Color Segment</span>
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
