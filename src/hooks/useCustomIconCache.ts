import { useEffect, useState } from 'react';
import { renderCustomIconVariant } from '../canvasMaskProcessor';
import { normalizeHexColor } from '../palettes';
import { CustomUnitIcon, FunnelStage, RenderStyle } from '../types';

export interface CustomIconCacheState {
  variants: Record<string, string>;
  isProcessing: boolean;
  error: string | null;
}

/**
 * Asynchronously generates recolored/outlined PNG Data URLs via HTML5 Canvas
 * for every active stage color and inactive tint whenever a custom unit icon
 * is selected.
 */
export function useCustomIconCache(
  customIcon: CustomUnitIcon | null,
  renderStyle: RenderStyle,
  stages: FunnelStage[],
  stageCount: number,
  inactiveTint: string,
): CustomIconCacheState {
  const [variants, setVariants] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeStages = stages.slice(0, stageCount);
  const colorSignature = [
    normalizeHexColor(inactiveTint, '#e2e8f0'),
    ...activeStages.map((s) => normalizeHexColor(s.color)),
  ].join('|');

  useEffect(() => {
    if (!customIcon) {
      setVariants({});
      setIsProcessing(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsProcessing(true);
    setError(null);

    const uniqueColors = Array.from(new Set(colorSignature.split('|')));

    Promise.all(
      uniqueColors.map(async (hex) => {
        const url = await renderCustomIconVariant(customIcon.sourceDataUrl, hex, renderStyle, 96);
        return [hex, url] as const;
      }),
    )
      .then((entries) => {
        if (cancelled) return;
        const map: Record<string, string> = {};
        for (const [hex, url] of entries) {
          map[hex] = url;
        }
        setVariants(map);
        setIsProcessing(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to process custom unit icon.');
        setIsProcessing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [customIcon, renderStyle, colorSignature]);

  return { variants, isProcessing, error };
}
