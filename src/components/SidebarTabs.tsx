import React from 'react';
import { Layers, Palette, Shapes, Sparkles } from 'lucide-react';
import { CustomUnitIcon, PalettePreset, SidebarTabId, StudioConfig } from '../types';
import { ContainerShapeTab } from './tabs/ContainerShapeTab';
import { PalettesTab } from './tabs/PalettesTab';
import { StagesTab } from './tabs/StagesTab';
import { UnitIconTab } from './tabs/UnitIconTab';

interface SidebarTabsProps {
  activeTab: SidebarTabId;
  onTabChange: (tab: SidebarTabId) => void;
  config: StudioConfig;
  customIconVariants: Record<string, string>;
  isProcessingCustomIcon: boolean;
  customIconError: string | null;
  onUpdateConfig: (patch: Partial<StudioConfig>) => void;
  onCustomIconUpload: (icon: CustomUnitIcon | null) => void;
  onUpdateStage: (index: number, patch: Partial<StudioConfig['stages'][number]>) => void;
  onUpdateStageByDropoff: (index: number, dropoffPct: number) => void;
  onSyncAllDensities: (density: number) => void;
  onSyncAllArcs: (arcSweepDeg: number, arcRotationDeg: number) => void;
  onSelectPalette: (palette: PalettePreset) => void;
  onStageColorChange: (index: number, color: string) => void;
}

const TAB_ITEMS: Array<{ id: SidebarTabId; label: string; icon: React.ReactNode }> = [
  { id: 'unit-icon', label: 'Unit Icon', icon: <Sparkles className="w-3.5 h-3.5" /> },
  { id: 'container-shape', label: 'Container', icon: <Shapes className="w-3.5 h-3.5" /> },
  { id: 'stages', label: 'Stages', icon: <Layers className="w-3.5 h-3.5" /> },
  { id: 'palettes', label: 'Palettes', icon: <Palette className="w-3.5 h-3.5" /> },
];

export const SidebarTabs: React.FC<SidebarTabsProps> = ({
  activeTab,
  onTabChange,
  config,
  customIconVariants,
  isProcessingCustomIcon,
  customIconError,
  onUpdateConfig,
  onCustomIconUpload,
  onUpdateStage,
  onUpdateStageByDropoff,
  onSyncAllDensities,
  onSyncAllArcs,
  onSelectPalette,
  onStageColorChange,
}) => {
  const firstStageColor = config.stages[0]?.color.toLowerCase() ?? '#003f5c';

  return (
    <aside
      className="w-full lg:w-[420px] shrink-0 bg-white border-r border-slate-200 flex flex-col h-full overflow-hidden"
      aria-label="WaffleFlow Studio controls"
    >
      {/* 4 Clean Tabs */}
      <nav
        className="grid grid-cols-4 border-b border-slate-200 bg-slate-50/70 px-2 pt-2 gap-1 shrink-0"
        role="tablist"
        aria-label="Control categories"
      >
        {TAB_ITEMS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors whitespace-nowrap shrink-0 min-h-[42px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${
                isActive
                  ? 'bg-white text-slate-900 border-[#003f5c]'
                  : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Scrollable Tab Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {activeTab === 'unit-icon' && (
          <UnitIconTab
            iconPreset={config.iconPreset}
            renderStyle={config.renderStyle}
            iconSizePx={config.iconSizePx}
            gapSpacingPx={config.gapSpacingPx}
            customIcon={config.customIcon}
            customIconPreviewUrl={customIconVariants[firstStageColor]}
            isProcessingCustomIcon={isProcessingCustomIcon}
            customIconError={customIconError}
            onIconPresetChange={(iconPreset) => onUpdateConfig({ iconPreset })}
            onRenderStyleChange={(renderStyle) => onUpdateConfig({ renderStyle })}
            onIconSizeChange={(iconSizePx) => onUpdateConfig({ iconSizePx })}
            onGapSpacingChange={(gapSpacingPx) => onUpdateConfig({ gapSpacingPx })}
            onCustomIconUpload={onCustomIconUpload}
          />
        )}

        {activeTab === 'container-shape' && (
          <ContainerShapeTab
            containerMode={config.containerMode}
            fillDirection={config.fillDirection}
            customMask={config.customMask}
            onContainerModeChange={(containerMode) => onUpdateConfig({ containerMode })}
            onFillDirectionChange={(fillDirection) => onUpdateConfig({ fillDirection })}
            onCustomMaskChange={(customMask) => onUpdateConfig({ customMask })}
          />
        )}

        {activeTab === 'stages' && (
          <StagesTab
            config={config}
            onStageCountChange={(stageCount) => onUpdateConfig({ stageCount })}
            onStageSizingModeChange={(stageSizingMode) => onUpdateConfig({ stageSizingMode })}
            onShowConnectorsChange={(showConnectors) => onUpdateConfig({ showConnectors })}
            onTransparentConnectorOutlineChange={(transparentConnectorOutline) =>
              onUpdateConfig({ transparentConnectorOutline })
            }
            onShowGhostDropoffChange={(showGhostDropoff) => onUpdateConfig({ showGhostDropoff })}
            onUpdateStage={onUpdateStage}
            onUpdateStageByDropoff={onUpdateStageByDropoff}
            onSyncAllDensities={onSyncAllDensities}
            onSyncAllArcs={onSyncAllArcs}
          />
        )}

        {activeTab === 'palettes' && (
          <PalettesTab
            config={config}
            onSelectPalette={onSelectPalette}
            onStageColorChange={onStageColorChange}
            onInactiveTintChange={(inactiveTint) => onUpdateConfig({ inactiveTint })}
            onShowTrapezoidBorderChange={(showTrapezoidBorder) =>
              onUpdateConfig({ showTrapezoidBorder })
            }
            onTrapezoidBorderColorChange={(trapezoidBorderColor) =>
              onUpdateConfig({ trapezoidBorderColor })
            }
            onTransparentConnectorOutlineChange={(transparentConnectorOutline) =>
              onUpdateConfig({ transparentConnectorOutline })
            }
            onToggleTypography={(field, val) => onUpdateConfig({ [field]: val })}
          />
        )}
      </div>
    </aside>
  );
};
