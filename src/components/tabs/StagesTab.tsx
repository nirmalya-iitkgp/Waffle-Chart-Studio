import React from 'react';
import { Equal } from 'lucide-react';
import { computeStageMetrics, formatPercent } from '../../gridPackingMath';
import { FunnelStage, StageSizingMode, StudioConfig } from '../../types';

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
}) => {
  const metricsList = computeStageMetrics(config);

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
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">Stage Data &amp; Icon Density</span>
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
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
