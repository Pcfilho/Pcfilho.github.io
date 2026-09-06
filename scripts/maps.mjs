// Rasterizes Natural Earth 50m country polygons into dot-matrix SVGs. Run once: npm run maps.
import { writeFileSync } from 'node:fs';
import { WORLD, BRAZIL } from '../js/maps.js';

const URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson';
const res = await fetch(URL);
if (!res.ok) throw new Error('download failed ' + res.status);
const geo = await res.json();

// point-in-polygon (ray casting) over a ring of [lon, lat]
function inRing(ring, lon, lat) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function polys(feature) {
  const g = feature.geometry;
  return g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
}
// outer ring inside and not in any hole
function inFeature(feature, lon, lat) {
  for (const poly of polys(feature)) {
    if (inRing(poly[0], lon, lat)) {
      let hole = false;
      for (let k = 1; k < poly.length; k++) if (inRing(poly[k], lon, lat)) { hole = true; break; }
      if (!hole) return true;
    }
  }
  return false;
}
function inLand(features, lon, lat) { return features.some(f => inFeature(f, lon, lat)); }

function svg(w, h, dots, r) {
  const body = dots.map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" fill="rgba(255,255,255,0.22)">${body}</svg>\n`;
}

// World: equirectangular, 6px pitch. Skip Antarctica for a cleaner card.
const land = geo.features.filter(f => f.properties.ADMIN !== 'Antarctica' && f.properties.NAME !== 'Antarctica');
const worldDots = [];
for (let y = 3; y < WORLD.h; y += 6) for (let x = 3; x < WORLD.w; x += 6) {
  const lon = (x / WORLD.w) * 360 - 180, lat = 90 - (y / WORLD.h) * 180;
  if (inLand(land, lon, lat)) worldDots.push([x, y]);
}
writeFileSync('assets/map-world.svg', svg(WORLD.w, WORLD.h, worldDots, 1.4));

// Brazil: bounding-box fit, 8px pitch.
const brazil = geo.features.filter(f => f.properties.ADMIN === 'Brazil' || f.properties.NAME === 'Brazil');
if (!brazil.length) throw new Error('Brazil feature not found');
const lonSpan = BRAZIL.lon1 - BRAZIL.lon0, latSpan = BRAZIL.lat1 - BRAZIL.lat0;
const scale = Math.min(BRAZIL.w / lonSpan, BRAZIL.h / latSpan);
const ox = (BRAZIL.w - lonSpan * scale) / 2, oy = (BRAZIL.h - latSpan * scale) / 2;
const brDots = [];
for (let y = 4; y < BRAZIL.h; y += 8) for (let x = 4; x < BRAZIL.w; x += 8) {
  const lon = BRAZIL.lon0 + (x - ox) / scale, lat = BRAZIL.lat1 - (y - oy) / scale;
  if (inLand(brazil, lon, lat)) brDots.push([x, y]);
}
writeFileSync('assets/map-brazil.svg', svg(BRAZIL.w, BRAZIL.h, brDots, 1.8));
console.log('world dots', worldDots.length, 'brazil dots', brDots.length);
