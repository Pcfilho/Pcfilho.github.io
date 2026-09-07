// Shared projections so HTML pins land on the same grid the SVGs were rasterized with.
export const WORLD = { w: 720, h: 360 };
export const BRAZIL = { w: 300, h: 300, lon0: -74, lon1: -34, lat0: -34, lat1: 6 };

export function worldXY(lon, lat) {
  return { x: ((lon + 180) / 360) * 100, y: ((90 - lat) / 180) * 100 };
}

// Linear fit of Brazil's bounding box into a square, aspect preserved and centred.
export function brazilXY(lon, lat) {
  const lonSpan = BRAZIL.lon1 - BRAZIL.lon0, latSpan = BRAZIL.lat1 - BRAZIL.lat0;
  const scale = Math.min(BRAZIL.w / lonSpan, BRAZIL.h / latSpan);
  const ox = (BRAZIL.w - lonSpan * scale) / 2, oy = (BRAZIL.h - latSpan * scale) / 2;
  const px = ox + (lon - BRAZIL.lon0) * scale, py = oy + (BRAZIL.lat1 - lat) * scale;
  return { x: (px / BRAZIL.w) * 100, y: (py / BRAZIL.h) * 100 };
}
