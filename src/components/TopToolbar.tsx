import React from 'react';
import {
  ArrowDownUp,
  ArrowLeftRight,
  Download,
  FileCode2,
  Image as ImageIcon,
  Loader2,
  SlidersHorizontal,
} from 'lucide-react';
import { AspectRatioMode, FlowOrientation } from '../types';

interface TopToolbarProps {
  aspectRatio: AspectRatioMode;
  orientation: FlowOrientation;
  isExportingPptx: boolean;
  isExportingPng: boolean;
  onAspectRatioChange: (ratio: AspectRatioMode) => void;
  onOrientationChange: (orientation: FlowOrientation) => void;
  onExportPptx: () => void;
  onExportSvg: () => void;
  onExportPng: () => void;
  onToggleMobileControls?: () => void;
  mobileControlsOpen?: boolean;
}

export const TopToolbar: React.FC<TopToolbarProps> = ({
  aspectRatio,
  orientation,
  isExportingPptx,
  isExportingPng,
  onAspectRatioChange,
  onOrientationChange,
  onExportPptx,
  onExportSvg,
  onExportPng,
  onToggleMobileControls,
  mobileControlsOpen,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 px-4 lg:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 z-20">
      {/* Brand Title */}
      <div className="flex items-center gap-3 min-w-0">
        {onToggleMobileControls && (
          <button
            type="button"
            onClick={onToggleMobileControls}
            className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
            aria-label={mobileControlsOpen ? 'Close studio controls' : 'Open studio controls'}
            aria-expanded={mobileControlsOpen}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        )}
        <div className="flex items-center gap-2.5">
          <svg
            width="26"
            height="26"
            viewBox="0 0 32 32"
            fill="none"
            className="shrink-0"
            aria-hidden="true"
          >
            <rect width="32" height="32" rx="7" fill="#0F172A" />
            <rect x="6" y="7" width="4" height="4" rx="1" fill="#38BDF8" />
            <rect x="11.5" y="7" width="4" height="4" rx="1" fill="#38BDF8" />
            <rect x="17" y="7" width="4" height="4" rx="1" fill="#38BDF8" />
            <rect x="22.5" y="7" width="4" height="4" rx="1" fill="#38BDF8" />
            <rect x="6" y="13" width="4" height="4" rx="1" fill="#60A5FA" />
            <rect x="11.5" y="13" width="4" height="4" rx="1" fill="#60A5FA" />
            <rect x="17" y="13" width="4" height="4" rx="1" fill="#60A5FA" />
            <rect x="22.5" y="13" width="4" height="4" rx="1" fill="#334155" />
            <rect x="8.75" y="19" width="4" height="4" rx="1" fill="#818CF8" />
            <rect x="14.25" y="19" width="4" height="4" rx="1" fill="#818CF8" />
            <rect x="19.75" y="19" width="4" height="4" rx="1" fill="#334155" />
            <rect x="14.25" y="25" width="4" height="4" rx="1" fill="#A78BFA" />
          </svg>
          <span className="font-display text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
            WaffleFlow Studio
          </span>
        </div>
      </div>

      {/* Studio Slide Geometry Toggles */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div
          className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200"
          role="group"
          aria-label="Slide aspect ratio"
        >
          <button
            type="button"
            onClick={() => onAspectRatioChange(AspectRatioMode.WIDE_16_9)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 min-h-[34px] ${
              aspectRatio === AspectRatioMode.WIDE_16_9
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            16:9 Widescreen
          </button>
          <button
            type="button"
            onClick={() => onAspectRatioChange(AspectRatioMode.STANDARD_4_3)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 min-h-[34px] ${
              aspectRatio === AspectRatioMode.STANDARD_4_3
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            4:3 Standard
          </button>
        </div>

        <div
          className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200"
          role="group"
          aria-label="Flow orientation"
        >
          <button
            type="button"
            onClick={() => onOrientationChange(FlowOrientation.HORIZONTAL)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 min-h-[34px] ${
              orientation === FlowOrientation.HORIZONTAL
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Horizontal Flow</span>
          </button>
          <button
            type="button"
            onClick={() => onOrientationChange(FlowOrientation.VERTICAL)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 min-h-[34px] ${
              orientation === FlowOrientation.VERTICAL
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowDownUp className="w-3.5 h-3.5" />
            <span>Vertical Flow</span>
          </button>
        </div>
      </div>

      {/* Export Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onExportSvg}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 min-h-[38px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
        >
          <FileCode2 className="w-3.5 h-3.5" />
          <span>Export SVG</span>
        </button>
        <button
          type="button"
          onClick={onExportPng}
          disabled={isExportingPng}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 min-h-[38px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
        >
          {isExportingPng ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <ImageIcon className="w-3.5 h-3.5" />
          )}
          <span>Export PNG</span>
        </button>
        <button
          type="button"
          onClick={onExportPptx}
          disabled={isExportingPptx}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#003f5c] hover:bg-[#002f45] disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[38px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#003f5c]"
        >
          {isExportingPptx ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          <span>{isExportingPptx ? 'Building PPTX...' : 'Download Native PPTX'}</span>
        </button>
      </div>
    </header>
  );
};
