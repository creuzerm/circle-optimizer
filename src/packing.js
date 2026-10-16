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

// New geometry functions
const checkOverlap = (c1, c2, gap = 0) => {
    const dx = c1.x - c2.x;
    const dy = c1.y - c2.y;
    const distSq = dx * dx + dy * dy;
    const minDist = c1.r + c2.r + gap;
    return distSq < minDist * minDist - 0.0001;
};

const clampToRectangularBoundary = (circle, width, height, margin = 0) => {
    let { x, y, r } = circle;
    const minX = margin + r;
    const maxX = width - margin - r;
    const minY = margin + r;
    const maxY = height - margin - r;

    // if radius is too big for the boundary
    if (minX > maxX || minY > maxY) {
        return null;
    }

    x = Math.max(minX, Math.min(x, maxX));
    y = Math.max(minY, Math.min(y, maxY));

    // Return original if not clamped, else clamped
    if (x === circle.x && y === circle.y) {
        return { ...circle };
    }

    return { x, y, r };
};

const clampToCircularBoundary = (circle, containerX, containerY, containerR, margin = 0) => {
    const { x, y, r } = circle;
    const dx = x - containerX;
    const dy = y - containerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const maxDist = containerR - margin - r;

    if (maxDist < 0) return null; // Circle too large

    if (dist <= maxDist) {
        return { ...circle };
    }

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

const distanceToPolygonEdge = (circle, polygon) => {
    let minDistSq = Infinity;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const dSq = distToSegmentSquared(circle, polygon[j], polygon[i]);
        if (dSq < minDistSq) {
            minDistSq = dSq;
        }
    }
    return Math.sqrt(minDistSq);
};

const isCircleInPolygon = (circle, polygon) => {
    if (!pointInPolygon(circle, polygon)) return false;
    const dist = distanceToPolygonEdge(circle, polygon);
    // Use epsilon to prevent false positives on tangent circles
    return dist >= circle.r - 0.0001;
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

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateGridTotal,
        calculateLayout,
        getCirclePositions,
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
        calculateScrapPercentage
    };
} else if (typeof window !== 'undefined') {
    window.calculateGridTotal = calculateGridTotal;
    window.calculateLayout = calculateLayout;
    window.getCirclePositions = getCirclePositions;
    window.checkOverlap = checkOverlap;
    window.clampToRectangularBoundary = clampToRectangularBoundary;
    window.clampToCircularBoundary = clampToCircularBoundary;
    window.calculateDensity = calculateDensity;
    window.dist2 = dist2;
    window.distToSegmentSquared = distToSegmentSquared;
    window.pointInPolygon = pointInPolygon;
    window.distanceToPolygonEdge = distanceToPolygonEdge;
    window.isCircleInPolygon = isCircleInPolygon;
    window.calculateTotalArea = calculateTotalArea;
    window.calculateVoidArea = calculateVoidArea;
    window.calculateScrapPercentage = calculateScrapPercentage;
}
