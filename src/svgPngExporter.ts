function triggerBlobDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function buildSafeFileSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'waffleflow-funnel'
  );
}

/**
 * Serializes the live SVG slide element to a standalone .svg file download.
 */
export function exportSlideToSvg(svgElement: SVGSVGElement, title: string): void {
  const clone = svgElement.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

  const serializer = new XMLSerializer();
  const svgString = `<?xml version="1.0" encoding="UTF-8"?>\n${serializer.serializeToString(clone)}`;
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  triggerBlobDownload(blob, `${buildSafeFileSlug(title)}.svg`);
}

/**
 * Rasterizes the live SVG slide element at 2x resolution onto an HTML5 Canvas
 * and downloads a crisp PNG image.
 */
export function exportSlideToPng(
  svgElement: SVGSVGElement,
  title: string,
  slideWidthIn: number,
  slideHeightIn: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const pixelWidth = Math.round(slideWidthIn * 180); // ~2400px for 16:9
    const pixelHeight = Math.round(slideHeightIn * 180); // ~1350px

    const clone = svgElement.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    clone.setAttribute('width', String(pixelWidth));
    clone.setAttribute('height', String(pixelHeight));

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clone);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(svgUrl);
          reject(new Error('Could not acquire 2D canvas context for PNG export.'));
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pixelWidth, pixelHeight);
        ctx.drawImage(img, 0, 0, pixelWidth, pixelHeight);
        URL.revokeObjectURL(svgUrl);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas PNG serialization returned null.'));
              return;
            }
            triggerBlobDownload(blob, `${buildSafeFileSlug(title)}.png`);
            resolve();
          },
          'image/png',
          1,
        );
      } catch (err) {
        URL.revokeObjectURL(svgUrl);
        reject(err);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(svgUrl);
      reject(new Error('Failed to rasterize SVG for PNG export.'));
    };
    img.src = svgUrl;
  });
}
