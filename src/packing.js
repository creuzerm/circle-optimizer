(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // Node.js (CommonJS)
    module.exports = factory();
  } else {
    // Browser globals
    root.PackingUtils = factory();
  }
}(typeof window !== 'undefined' ? window : this, function () {

  const calculateGridTotal = (w, h, d, gap) => {
      const effectiveD = d + gap;
      const nx = Math.floor((w - d + 0.000001) / effectiveD) + 1;
      const ny = Math.floor((h - d + 0.000001) / effectiveD) + 1;
      return Math.max(0, nx) * Math.max(0, ny);
  };

  const calculateLayout = (w, h, d, gap) => {
      const effectiveD = d + gap;
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
      const dy = c2.y - c1.y;
      const distSq = dx * dx + dy * dy;
      const minDist = c1.r + c2.r;
      const minDistSq = minDist * minDist;
      // If distance squared is strictly less than minDistSq - epsilon, we consider it a collision
      return distSq < minDistSq - epsilon;
  };

  const isCircleInConvexHull = (circle, polygon, epsilon = 0.0001) => {
      // Polygon should be an array of objects {x, y} in counter-clockwise order
      if (!polygon || polygon.length < 3) return false;
      for (let i = 0; i < polygon.length; i++) {
          const p1 = polygon[i];
          const p2 = polygon[(i + 1) % polygon.length];

          // Edge vector
          const edgeX = p2.x - p1.x;
          const edgeY = p2.y - p1.y;
          const edgeLength = Math.sqrt(edgeX * edgeX + edgeY * edgeY);

          // Vector from p1 to circle center
          const cx = circle.x - p1.x;
          const cy = circle.y - p1.y;

          // Cross product to find distance from point to line segment
          // A negative cross product means the point is on the "outside" (right side) of the counter-clockwise edge
          const cross = edgeX * cy - edgeY * cx;
          const distance = cross / edgeLength;

          // The distance from the center of the circle to the edge should be >= circle.r
          // Epsilon allows tolerance
          if (distance < circle.r - epsilon) {
              return false;
          }
      }
      return true;
  };

  return {
    calculateGridTotal,
    calculateLayout,
    getCirclePositions,
    checkCircleCollision,
    isCircleInConvexHull
  };

}));
