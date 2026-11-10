(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // Node.js (CommonJS)
    module.exports = factory();
  } else {
    // Browser globals
    const utils = factory();
    root.PackingUtils = utils;
    if (typeof Object.assign === 'function') {
      Object.assign(root, utils);
    } else {
      for (let k in utils) {
        if (Object.prototype.hasOwnProperty.call(utils, k)) {
          root[k] = utils[k];
        }
      }
    }
  }
}(typeof window !== 'undefined' ? window : this, function () {

  const calculateGridTotal = (w, h, d, gap) => {
      if (!Number.isFinite(w) || !Number.isFinite(h) || !Number.isFinite(d)) return 0;
      if (w <= 0 || h <= 0 || d <= 0) return 0;

      const effectiveD = d + gap;
      if (effectiveD <= 0) return 0;

      const nx = Math.floor((w - d + 0.000001) / effectiveD) + 1;
      const ny = Math.floor((h - d + 0.000001) / effectiveD) + 1;
      return Math.max(0, nx) * Math.max(0, ny);
  };

  const calculateLayout = (w, h, d, gap) => {
      if (!Number.isFinite(w) || !Number.isFinite(h) || !Number.isFinite(d)) return { total: 0, rowData: [], dy: 0, numRows: 0 };
      if (w <= 0 || h <= 0 || d <= 0) return { total: 0, rowData: [], dy: 0, numRows: 0 };

      const effectiveD = d + gap;
      if (effectiveD <= 0) return { total: 0, rowData: [], dy: 0, numRows: 0 };

      const dy = effectiveD * (Math.sqrt(3) / 2);
      const numRows = Math.floor((h - d + 0.000001) / dy) + 1;
      if (numRows <= 0 || w < d) return { total: 0, rowData: [], dy: 0, numRows: 0 };
      let total = 0;
      const rowData = [];
      for (let i = 0; i < numRows; i++) {
          const rowOffset = i % 2 !== 0 ? effectiveD / 2 : 0;
          const count = Math.floor((w - rowOffset - d + 0.000001) / effectiveD) + 1;
          if (count > 0) {
              total += count;
              rowData.push({ count, offset: rowOffset });
          }
      }
      return { total, rowData, dy, numRows: rowData.length };
  };

  const getCirclePositions = (layout, width, height, diameter, margin, gap, isRotated) => {
      if (!layout) return [];
      const r = diameter / 2;
      const effectiveD = diameter + gap;
      const packingW = isRotated ? height - (margin * 2) : width - (margin * 2);
      const packingH = isRotated ? width - (margin * 2) : height - (margin * 2);

      const maxRowWidth = Math.max(...layout.rowData.map(row => (row.count - 1) * effectiveD + diameter + row.offset));
      const patternH = (layout.numRows - 1) * layout.dy + diameter;

      const startX = margin + (packingW - maxRowWidth) / 2;
      const startY = margin + (packingH - patternH) / 2;

      const circles = [];
      layout.rowData.forEach((row, rowIndex) => {
          const py = startY + r + (rowIndex * layout.dy);
          for (let i = 0; i < row.count; i++) {
              const px = startX + r + (i * effectiveD) + row.offset;
              const cx = isRotated ? py : px;
              const cy = isRotated ? px : py;
              circles.push({ x: cx, y: cy, r });
          }
      });
      return circles;
  };

  const checkCircleCollision = (c1, c2, epsilon = 0.0001) => {
      const dx = c2.x - c1.x;
      const minDist = c1.r + c2.r;
      if (dx >= minDist || dx <= -minDist) return false;
      const dy = c2.y - c1.y;
      if (dy >= minDist || dy <= -minDist) return false;
      // To strictly follow dx*dx + dy*dy <= (r1+r2)*(r1+r2) and avoid redundant Math.sqrt/Math.hypot calls
      return (dx * dx + dy * dy) < (minDist * minDist) - epsilon;
  };

  const isCircleInConvexHull = (circle, polygon, epsilon = 0.0001) => {
      if (!polygon || polygon.length < 3) return false;

      const threshold = circle.r - epsilon;

      for (let i = 0; i < polygon.length; i++) {
          const p1 = polygon[i];
          const p2 = polygon[(i + 1) % polygon.length];

          const edgeX = p2.x - p1.x;
          const edgeY = p2.y - p1.y;
          const edgeSq = edgeX * edgeX + edgeY * edgeY;

          const cx = circle.x - p1.x;
          const cy = circle.y - p1.y;

          const cross = edgeX * cy - edgeY * cx;

          if (threshold > 0) {
              if (cross < 0 || (cross * cross) / edgeSq < threshold * threshold) {
                  return false;
              }
          } else {
              if (cross < 0 && (cross * cross) / edgeSq > threshold * threshold) {
                  return false;
              }
          }
      }
      return true;
  };

  // Additional Geometry functions
  const checkOverlap = (c1, c2, gap = 0) => {
      const dx = c1.x - c2.x;
      const minDist = c1.r + c2.r + gap;
      if (dx >= minDist || dx <= -minDist) return false;
      const dy = c1.y - c2.y;
      if (dy >= minDist || dy <= -minDist) return false;
      // Use squared distance comparison to avoid redundant Math.sqrt/Math.hypot in inner loops
      return (dx * dx + dy * dy) < (minDist * minDist) - 0.0001;
  };

  const clampToRectangularBoundary = (circle, width, height, margin = 0) => {
      let { x, y, r } = circle;
      const minX = margin + r;
      const maxX = width - margin - r;
      const minY = margin + r;
      const maxY = height - margin - r;

      if (minX > maxX || minY > maxY) {
          return null;
      }

      x = Math.max(minX, Math.min(x, maxX));
      y = Math.max(minY, Math.min(y, maxY));

      if (x === circle.x && y === circle.y) {
          return { ...circle };
      }

      return { x, y, r };
  };

  const clampToCircularBoundary = (circle, containerX, containerY, containerR, margin = 0) => {
      const { x, y, r } = circle;
      const dx = x - containerX;
      const dy = y - containerY;
      const distSq = dx * dx + dy * dy;

      const maxDist = containerR - margin - r;

      if (maxDist < 0) return null;

      // Use squared distance comparison to avoid redundant Math.sqrt in candidate rejection loop
      if (distSq <= maxDist * maxDist) {
          return { ...circle };
      }

      // Only compute actual distance (using Math.sqrt) when clamping is strictly needed
      const dist = Math.sqrt(distSq);
      const ratio = maxDist / dist;
      return {
          x: containerX + dx * ratio,
          y: containerY + dy * ratio,
          r
      };
  };

  const calculateDensity = (circles, containerArea) => {
      if (!circles || circles.length === 0 || containerArea <= 0) return 0;
      const totalCircleArea = circles.reduce((acc, c) => acc + (Math.PI * c.r * c.r), 0);
      return totalCircleArea / containerArea;
  };

  const dist2 = (v, w) => (v.x - w.x) * (v.x - w.x) + (v.y - w.y) * (v.y - w.y);

  const distToSegmentSquared = (p, v, w) => {
      const l2 = dist2(v, w);
      if (l2 === 0) return dist2(p, v);
      let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
      t = Math.max(0, Math.min(1, t));
      return dist2(p, { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) });
  };

  const pointInPolygon = (p, polygon) => {
      let isInside = false;
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
          const xi = polygon[i].x, yi = polygon[i].y;
          const xj = polygon[j].x, yj = polygon[j].y;
          const intersect = ((yi > p.y) !== (yj > p.y)) && (p.x < (xj - xi) * (p.y - yi) / (yj - yi) + xi);
          if (intersect) isInside = !isInside;
      }
      return isInside;
  };

  const distanceToPolygonEdgeSquared = (circle, polygon) => {
      let minDistSq = Infinity;
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
          const dSq = distToSegmentSquared(circle, polygon[j], polygon[i]);
          if (dSq < minDistSq) {
              minDistSq = dSq;
          }
      }
      return minDistSq;
  };

  const distanceToPolygonEdge = (circle, polygon) => {
      return Math.sqrt(distanceToPolygonEdgeSquared(circle, polygon));
  };

  const isCircleInPolygon = (circle, polygon) => {
      if (!pointInPolygon(circle, polygon)) return false;
      const threshold = circle.r - 0.0001;
      if (threshold <= 0) return true;
      const distSq = distanceToPolygonEdgeSquared(circle, polygon);
      return distSq >= threshold * threshold;
  };

  const calculateTotalArea = (circles) => {
      if (!circles || !Array.isArray(circles) || circles.length === 0) return 0;
      return circles.reduce((acc, c) => acc + (Math.PI * c.r * c.r), 0);
  };

  const calculateVoidArea = (circles, containerArea) => {
      if (typeof containerArea !== 'number' || containerArea <= 0) return 0;
      const totalArea = calculateTotalArea(circles);
      return Math.max(0, containerArea - totalArea);
  };

  const calculateScrapPercentage = (circles, containerArea) => {
      if (typeof containerArea !== 'number' || containerArea <= 0) return 0;
      if (!circles || !Array.isArray(circles) || circles.length === 0) return 100;

      const voidArea = calculateVoidArea(circles, containerArea);
      return (voidArea / containerArea) * 100;
  };

  const calculateConvexHull = (points) => {
      if (!points) return null;
      if (points.length <= 1) return points || [];

      const sorted = [...points].sort((a, b) => {
          if (a.x !== b.x) return a.x - b.x;
          return a.y - b.y;
      });

      const cross = (o, a, b) => {
          return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
      };

      const lower = [];
      for (let i = 0; i < sorted.length; i++) {
          while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], sorted[i]) <= 0) {
              lower.pop();
          }
          lower.push(sorted[i]);
      }

      const upper = [];
      for (let i = sorted.length - 1; i >= 0; i--) {
          while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], sorted[i]) <= 0) {
              upper.pop();
          }
          upper.push(sorted[i]);
      }

      upper.pop();
      lower.pop();
      return lower.concat(upper);
  };

  const calculatePolygonPerimeter = (polygon) => {
      if (!polygon || polygon.length < 2) return 0;
      let perimeter = 0;
      for (let i = 0; i < polygon.length; i++) {
          const next = (i + 1) % polygon.length;
          const dx = polygon[next].x - polygon[i].x;
          const dy = polygon[next].y - polygon[i].y;
          perimeter += Math.sqrt(dx * dx + dy * dy);
      }
      return perimeter;
  };

  const generateSVGString = (config, results, unit) => {
      const { width, height, margin } = config;
      const { largeCircles, fillerCircles } = results;

      if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
          return ''; // Invalid dimensions, returning empty SVG or similar handled externally if preferred
      }

      const safeWidth = Number.isFinite(width) && width > 0 ? width : 0;
      const safeHeight = Number.isFinite(height) && height > 0 ? height : 0;

      if (safeWidth === 0 || safeHeight === 0 || !largeCircles || largeCircles.length === 0) return '';

      const safeMargin = Number.isFinite(margin) && margin >= 0 ? margin : 0;
      const safeInnerWidth = Math.max(0, safeWidth - safeMargin * 2);
      const safeInnerHeight = Math.max(0, safeHeight - safeMargin * 2);

      let circles = '';
      largeCircles.forEach(c => {
          if (Number.isFinite(c.x) && Number.isFinite(c.y) && Number.isFinite(c.r)) {
              circles += `  <circle cx="${c.x.toFixed(4)}" cy="${c.y.toFixed(4)}" r="${c.r}" fill="none" stroke="blue" stroke-width="${unit === 'in' ? 0.01 : 0.2}" />\n`;
          }
      });

      if (fillerCircles) {
          fillerCircles.forEach(c => {
              if (Number.isFinite(c.x) && Number.isFinite(c.y) && Number.isFinite(c.r)) {
                  circles += `  <circle cx="${c.x.toFixed(4)}" cy="${c.y.toFixed(4)}" r="${c.r}" fill="none" stroke="#f59e0b" stroke-width="${unit === 'in' ? 0.01 : 0.2}" />\n`;
              }
          });
      }

      const unitSuffix = unit === 'in' ? 'in' : 'mm';
      return `<svg width="${safeWidth}${unitSuffix}" height="${safeHeight}${unitSuffix}" viewBox="0 0 ${safeWidth} ${safeHeight}" xmlns="http://www.w3.org/2000/svg">
                    <rect x="0" y="0" width="${safeWidth}" height="${safeHeight}" fill="none" stroke="#ddd" stroke-width="${unit === 'in' ? 0.02 : 0.5}" />
                    <rect x="${safeMargin}" y="${safeMargin}" width="${safeInnerWidth.toFixed(4)}" height="${safeInnerHeight.toFixed(4)}" fill="none" stroke="#ff0000" stroke-width="${unit === 'in' ? 0.01 : 0.2}" stroke-dasharray="${unit === 'in' ? 0.05 : 1}" opacity="0.5" />
                    ${circles}
                </svg>`;
  };

  return {
    calculateGridTotal,
    calculateLayout,
    getCirclePositions,
    checkCircleCollision,
    isCircleInConvexHull,
    checkOverlap,
    clampToRectangularBoundary,
    clampToCircularBoundary,
    calculateDensity,
    dist2,
    distToSegmentSquared,
    pointInPolygon,
    distanceToPolygonEdge,
    isCircleInPolygon,
    calculateTotalArea,
    calculateVoidArea,
    calculateScrapPercentage,
    calculateConvexHull,
    calculatePolygonPerimeter,
    generateSVGString
  };

}));
