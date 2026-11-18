import React from 'react';
import { RenderStyle, UnitIconPreset } from '../types';

interface UnitIconSvgProps {
  preset: UnitIconPreset;
  renderStyle: RenderStyle;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  opacity?: number;
  customImageDataUrl?: string;
}

export const UnitIconSvg: React.FC<UnitIconSvgProps> = React.memo(
  ({ preset, renderStyle, x, y, w, h, color, opacity = 1, customImageDataUrl }) => {
    const isFilled = renderStyle === RenderStyle.FILLED;
    const strokeWidth = Math.max(1.1, Math.min(w, h) * 0.11);
    const fillProp = isFilled ? color : 'none';
    const strokeProp = isFilled ? 'none' : color;

    if (preset === UnitIconPreset.CUSTOM && customImageDataUrl) {
      return (
        <image
          href={customImageDataUrl}
          x={x}
          y={y}
          width={w}
          height={h}
          opacity={opacity}
          preserveAspectRatio="xMidYMid meet"
        />
      );
    }

    switch (preset) {
      case UnitIconPreset.SQUARE:
        return (
          <rect
            x={x}
            y={y}
            width={w}
            height={h}
            fill={fillProp}
            stroke={strokeProp}
            strokeWidth={isFilled ? 0 : strokeWidth}
            opacity={opacity}
          />
        );

      case UnitIconPreset.ROUNDED_SQUARE:
        return (
          <rect
            x={x}
            y={y}
            width={w}
            height={h}
            rx={Math.min(w, h) * 0.22}
            ry={Math.min(w, h) * 0.22}
            fill={fillProp}
            stroke={strokeProp}
            strokeWidth={isFilled ? 0 : strokeWidth}
            opacity={opacity}
          />
        );

      case UnitIconPreset.CIRCLE:
        return (
          <circle
            cx={x + w / 2}
            cy={y + h / 2}
            r={Math.min(w, h) / 2}
            fill={fillProp}
            stroke={strokeProp}
            strokeWidth={isFilled ? 0 : strokeWidth}
            opacity={opacity}
          />
        );

      case UnitIconPreset.DIAMOND: {
        const cx = x + w / 2;
        const cy = y + h / 2;
        const pts = `${cx},${y} ${x + w},${cy} ${cx},${y + h} ${x},${cy}`;
        return (
          <polygon
            points={pts}
            fill={fillProp}
            stroke={strokeProp}
            strokeWidth={isFilled ? 0 : strokeWidth}
            strokeLinejoin="round"
            opacity={opacity}
          />
        );
      }

      case UnitIconPreset.HEXAGON: {
        const cx = x + w / 2;
        const cy = y + h / 2;
        const rx = w / 2;
        const ry = h / 2;
        const pts = [0, 1, 2, 3, 4, 5]
          .map((i) => {
            const angle = (Math.PI / 3) * i - Math.PI / 2;
            return `${(cx + rx * Math.cos(angle)).toFixed(2)},${(cy + ry * Math.sin(angle)).toFixed(2)}`;
          })
          .join(' ');
        return (
          <polygon
            points={pts}
            fill={fillProp}
            stroke={strokeProp}
            strokeWidth={isFilled ? 0 : strokeWidth}
            strokeLinejoin="round"
            opacity={opacity}
          />
        );
      }

      case UnitIconPreset.STAR: {
        const cx = x + w / 2;
        const cy = y + h / 2;
        const outerR = Math.min(w, h) / 2;
        const innerR = outerR * 0.42;
        const pts: string[] = [];
        for (let i = 0; i < 10; i++) {
          const r = i % 2 === 0 ? outerR : innerR;
          const angle = (Math.PI / 5) * i - Math.PI / 2;
          pts.push(`${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`);
        }
        return (
          <polygon
            points={pts.join(' ')}
            fill={fillProp}
            stroke={strokeProp}
            strokeWidth={isFilled ? 0 : strokeWidth}
            strokeLinejoin="round"
            opacity={opacity}
          />
        );
      }

      case UnitIconPreset.PERSON: {
        // Normalized 24x24 person silhouette scaled to (x, y, w, h)
        const sx = w / 24;
        const sy = h / 24;
        return (
          <g
            transform={`translate(${x}, ${y}) scale(${sx}, ${sy})`}
            opacity={opacity}
          >
            <circle
              cx={12}
              cy={6.5}
              r={3.6}
              fill={fillProp}
              stroke={strokeProp}
              strokeWidth={isFilled ? 0 : 2.1}
            />
            <path
              d="M5.2 21v-3.5c0-2.7 3-4.9 6.8-4.9s6.8 2.2 6.8 4.9V21z"
              fill={fillProp}
              stroke={strokeProp}
              strokeWidth={isFilled ? 0 : 2.1}
              strokeLinejoin="round"
            />
          </g>
        );
      }

      default:
        return (
          <rect
            x={x}
            y={y}
            width={w}
            height={h}
            rx={Math.min(w, h) * 0.2}
            fill={fillProp}
            stroke={strokeProp}
            strokeWidth={isFilled ? 0 : strokeWidth}
            opacity={opacity}
          />
        );
    }
  },
);

UnitIconSvg.displayName = 'UnitIconSvg';

export const UnitIconGlyphPreview: React.FC<{
  preset: UnitIconPreset;
  renderStyle: RenderStyle;
  color?: string;
  size?: number;
}> = ({ preset, renderStyle, color = '#0f172a', size = 20 }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <UnitIconSvg
        preset={preset}
        renderStyle={renderStyle}
        x={2}
        y={2}
        w={20}
        h={20}
        color={color}
      />
    </svg>
  );
};
