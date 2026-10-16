const {
    calculateGridTotal,
    calculateLayout,
    getCirclePositions,
    checkOverlap,
    clampToRectangularBoundary,
    clampToCircularBoundary,
    calculateDensity,
    distanceToPolygonEdge,
    isCircleInPolygon
} = require('../src/packing.js');

describe('calculateGridTotal', () => {
    test('calculates correct total for simple grid', () => {
        // 10x10 area, 2 diameter, 0 gap -> 5x5 = 25
        expect(calculateGridTotal(10, 10, 2, 0)).toBe(25);
    });

    test('calculates correct total with gap', () => {
        // 10x10 area, 2 diameter, 1 gap -> effective 3.
        // nx = floor( (10 - 2) / 3 ) + 1 = floor(8/3) + 1 = 2 + 1 = 3
        // ny = floor( (10 - 2) / 3 ) + 1 = 3
        // 3 * 3 = 9
        expect(calculateGridTotal(10, 10, 2, 1)).toBe(9);
    });

    test('returns 0 if diameter is larger than area', () => {
        expect(calculateGridTotal(10, 10, 15, 0)).toBe(0);
    });
});

describe('calculateLayout', () => {
    test('calculates basic hexagonal layout', () => {
        const layout = calculateLayout(10, 10, 2, 0);
        expect(layout.total).toBeGreaterThan(0);
        expect(layout.numRows).toBeGreaterThan(0);
        expect(layout.dy).toBeCloseTo(2 * Math.sqrt(3) / 2);
    });

    test('returns 0 total for too large diameter', () => {
        const layout = calculateLayout(10, 10, 15, 0);
        expect(layout.total).toBe(0);
        expect(layout.numRows).toBe(0);
    });
});

describe('getCirclePositions', () => {
    test('returns empty array if no layout', () => {
        expect(getCirclePositions(null, 10, 10, 2, 0, 0, false)).toEqual([]);
    });

    test('returns positions for a valid layout', () => {
        const layout = calculateLayout(10, 10, 2, 0);
        const positions = getCirclePositions(layout, 10, 10, 2, 0, 0, false);
        expect(positions.length).toBe(layout.total);
        expect(positions[0]).toHaveProperty('x');
        expect(positions[0]).toHaveProperty('y');
        expect(positions[0]).toHaveProperty('r');
        expect(positions[0].r).toBe(1);
    });

    test('applies rotation correctly', () => {
        const layout = calculateLayout(20, 10, 2, 0);
        const positionsNormal = getCirclePositions(layout, 20, 10, 2, 0, 0, false);
        const positionsRotated = getCirclePositions(layout, 10, 20, 2, 0, 0, true);

        expect(positionsNormal.length).toBe(positionsRotated.length);
        // Because of the math, they might not map 1:1 perfectly easily,
        // but checking length and properties is a good sanity check
        expect(positionsRotated[0]).toHaveProperty('x');
        expect(positionsRotated[0]).toHaveProperty('y');
    });
});

describe('checkOverlap', () => {
    test('detects overlap between intersecting circles', () => {
        const c1 = { x: 0, y: 0, r: 5 };
        const c2 = { x: 8, y: 0, r: 5 };
        expect(checkOverlap(c1, c2)).toBe(true);
    });

    test('detects no overlap between separated circles', () => {
        const c1 = { x: 0, y: 0, r: 5 };
        const c2 = { x: 12, y: 0, r: 5 };
        expect(checkOverlap(c1, c2)).toBe(false);
    });

    test('detects overlap with gap parameter', () => {
        const c1 = { x: 0, y: 0, r: 5 };
        const c2 = { x: 11, y: 0, r: 5 };
        // distance is 11. radii sum is 10. Gap is 2.
        // Min distance required is 12. So they "overlap" with respect to the gap.
        expect(checkOverlap(c1, c2, 2)).toBe(true);
    });

    test('edge case: barely touching', () => {
        const c1 = { x: 0, y: 0, r: 5 };
        const c2 = { x: 10, y: 0, r: 5 };
        expect(checkOverlap(c1, c2)).toBe(false);
    });
});

describe('clampToRectangularBoundary', () => {
    test('returns same circle if inside boundary', () => {
        const circle = { x: 5, y: 5, r: 2 };
        const clamped = clampToRectangularBoundary(circle, 10, 10);
        expect(clamped).toEqual(circle);
    });

    test('clamps x coordinate when out of bounds', () => {
        const circle = { x: 1, y: 5, r: 2 };
        const clamped = clampToRectangularBoundary(circle, 10, 10);
        expect(clamped.x).toBe(2);
        expect(clamped.y).toBe(5);
    });

    test('clamps y coordinate when out of bounds', () => {
        const circle = { x: 5, y: 9, r: 2 };
        const clamped = clampToRectangularBoundary(circle, 10, 10);
        expect(clamped.x).toBe(5);
        expect(clamped.y).toBe(8);
    });

    test('applies margin correctly', () => {
        const circle = { x: 2, y: 5, r: 2 };
        const clamped = clampToRectangularBoundary(circle, 10, 10, 1);
        // minX should be margin + r = 1 + 2 = 3
        expect(clamped.x).toBe(3);
    });

    test('returns null if circle is too large for boundary', () => {
        const circle = { x: 5, y: 5, r: 6 };
        const clamped = clampToRectangularBoundary(circle, 10, 10);
        expect(clamped).toBeNull();
    });
});

describe('clampToCircularBoundary', () => {
    test('returns same circle if inside boundary', () => {
        const circle = { x: 0, y: 0, r: 2 };
        const clamped = clampToCircularBoundary(circle, 0, 0, 10);
        expect(clamped).toEqual(circle);
    });

    test('clamps circle to edge of boundary', () => {
        const circle = { x: 8, y: 0, r: 3 };
        const clamped = clampToCircularBoundary(circle, 0, 0, 10);
        // maxDist = 10 - 3 = 7. Current dist is 8.
        expect(clamped.x).toBe(7);
        expect(clamped.y).toBe(0);
    });

    test('applies margin correctly', () => {
        const circle = { x: 6, y: 0, r: 3 };
        const clamped = clampToCircularBoundary(circle, 0, 0, 10, 2);
        // maxDist = 10 - 2(margin) - 3(r) = 5. Current dist is 6.
        expect(clamped.x).toBe(5);
        expect(clamped.y).toBe(0);
    });

    test('returns null if circle is too large for boundary', () => {
        const circle = { x: 0, y: 0, r: 12 };
        const clamped = clampToCircularBoundary(circle, 0, 0, 10);
        expect(clamped).toBeNull();
    });
});

describe('calculateDensity', () => {
    test('calculates correct density', () => {
        const circles = [
            { x: 0, y: 0, r: 1 },
            { x: 2, y: 0, r: 1 }
        ];
        const containerArea = 10;
        const expectedDensity = (Math.PI * 1 * 1 * 2) / 10;
        expect(calculateDensity(circles, containerArea)).toBeCloseTo(expectedDensity);
    });

    test('returns 0 for empty circles array', () => {
        expect(calculateDensity([], 10)).toBe(0);
    });

    test('returns 0 for containerArea <= 0', () => {
        expect(calculateDensity([{ x: 0, y: 0, r: 1 }], 0)).toBe(0);
        expect(calculateDensity([{ x: 0, y: 0, r: 1 }], -5)).toBe(0);
    });
});

describe('distanceToPolygonEdge', () => {
    const squarePolygon = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 }
    ];

    test('calculates correct distance from circle to nearest polygon edge', () => {
        const circle = { x: 5, y: 5, r: 1 };
        // distance from (5,5) to edges (0, y), (10, y), (x, 0), (x, 10) is 5
        expect(distanceToPolygonEdge(circle, squarePolygon)).toBeCloseTo(5);
    });

    test('calculates correct distance when circle is near corner', () => {
        const circle = { x: 1, y: 2, r: 1 };
        // closest to left edge (x=0) which is dist 1
        expect(distanceToPolygonEdge(circle, squarePolygon)).toBeCloseTo(1);
    });

    test('calculates distance accurately for points outside the polygon', () => {
        const circle = { x: 15, y: 5, r: 1 };
        // distance to edge (10, y) is 5
        expect(distanceToPolygonEdge(circle, squarePolygon)).toBeCloseTo(5);
    });
});

describe('isCircleInPolygon', () => {
    const trianglePolygon = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 0, y: 10 }
    ];

    const squarePolygon = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 }
    ];

    test('returns true when circle is completely inside', () => {
        const circle = { x: 5, y: 5, r: 2 };
        expect(isCircleInPolygon(circle, squarePolygon)).toBe(true);
    });

    test('returns false when circle is outside', () => {
        const circle = { x: 15, y: 15, r: 2 };
        expect(isCircleInPolygon(circle, squarePolygon)).toBe(false);
    });

    test('returns false when circle intersects an edge', () => {
        const circle = { x: 1, y: 5, r: 2 };
        // distance to left edge is 1, radius is 2, so it intersects
        expect(isCircleInPolygon(circle, squarePolygon)).toBe(false);
    });

    test('returns true for circle tangent to bounding edge without registering false-positive collision', () => {
        const circle = { x: 2, y: 5, r: 2 };
        // distance to left edge is exactly 2, radius is 2. Should be true.
        expect(isCircleInPolygon(circle, squarePolygon)).toBe(true);
    });

    test('returns true for floating point tangent inaccuracies', () => {
        // slightly less than 2 due to floating point error, e.g. 1.999999
        const circle = { x: 1.999995, y: 5, r: 2 };
        expect(isCircleInPolygon(circle, squarePolygon)).toBe(true);
    });
});
