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

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateGridTotal,
        calculateLayout,
        getCirclePositions,
        checkOverlap,
        clampToRectangularBoundary,
        clampToCircularBoundary,
        calculateDensity
    };
} else if (typeof window !== 'undefined') {
    window.calculateGridTotal = calculateGridTotal;
    window.calculateLayout = calculateLayout;
    window.getCirclePositions = getCirclePositions;
    window.checkOverlap = checkOverlap;
    window.clampToRectangularBoundary = clampToRectangularBoundary;
    window.clampToCircularBoundary = clampToCircularBoundary;
    window.calculateDensity = calculateDensity;
}
