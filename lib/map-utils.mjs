export function metricColor(value, min, max) {
  if (value == null || !Number.isFinite(Number(value))) return '#101c31';
  const span = max - min;
  const ratio = span > 0 ? Math.max(0, Math.min(1, (Number(value) - min) / span)) : 0.5;
  const hue = 258 - ratio * 78;
  const lightness = 54 + ratio * 8;
  return `hsl(${hue.toFixed(1)} 82% ${lightness.toFixed(1)}%)`;
}

export function clampFloatingPanel(x, y, viewportWidth, viewportHeight, panelWidth = 330, panelHeight = 350) {
  const margin = 16;
  const gap = 24;
  const safeWidth = Math.max(margin, viewportWidth - panelWidth - margin);
  const safeHeight = Math.max(margin, viewportHeight - panelHeight - margin);
  const left = Math.min(Math.max(margin, x - panelWidth / 2), safeWidth);
  const preferredTop = y - panelHeight - gap;
  const fallbackTop = y + gap;
  const top = preferredTop >= margin
    ? preferredTop
    : Math.min(Math.max(margin, fallbackTop), safeHeight);
  return { left, top };
}
