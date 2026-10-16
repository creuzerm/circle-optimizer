const PackingUtils = require('../src/packing.js');

describe('PackingUtils.checkCircleCollision', () => {
    test('should return false for separate circles', () => {
        const c1 = { x: 0, y: 0, r: 5 };
        const c2 = { x: 12, y: 0, r: 5 };
        expect(PackingUtils.checkCircleCollision(c1, c2, 1e-8)).toBe(false);
    });

    test('should return true for overlapping circles', () => {
        const c1 = { x: 0, y: 0, r: 5 };
        const c2 = { x: 8, y: 0, r: 5 };
        expect(PackingUtils.checkCircleCollision(c1, c2, 1e-8)).toBe(true);
    });

    test('should return false for strictly tangent circles', () => {
        const c1 = { x: 0, y: 0, r: 5 };
        const c2 = { x: 10, y: 0, r: 5 };
        // With an epsilon, tangent circles should NOT be considered overlapping
        expect(PackingUtils.checkCircleCollision(c1, c2, 1e-8)).toBe(false);
    });

    test('should return false for strictly tangent circles with different radii', () => {
        const c1 = { x: 0, y: 0, r: 3 };
        const c2 = { x: 7, y: 0, r: 4 };
        expect(PackingUtils.checkCircleCollision(c1, c2, 1e-8)).toBe(false);
    });

    test('should detect collision when distance is exactly (minDist - epsilon)', () => {
        const c1 = { x: 0, y: 0, r: 5 };
        const minDist = 10;
        const epsilon = 1e-8;
        // distance squared we want is (minDistSq - epsilon) slightly lower to trigger
        const distSq = minDist * minDist - epsilon - 1e-10;
        const dist = Math.sqrt(distSq);
        const c2 = { x: dist, y: 0, r: 5 };

        expect(PackingUtils.checkCircleCollision(c1, c2, epsilon)).toBe(true);
    });

    test('should not detect collision when distance is exactly (minDist - epsilon) + tiny', () => {
        const c1 = { x: 0, y: 0, r: 5 };
        const minDist = 10;
        const epsilon = 1e-8;
        // distance squared slightly higher than (minDistSq - epsilon) to NOT trigger
        const distSq = minDist * minDist - epsilon + 1e-10;
        const dist = Math.sqrt(distSq);
        const c2 = { x: dist, y: 0, r: 5 };

        expect(PackingUtils.checkCircleCollision(c1, c2, epsilon)).toBe(false);
    });
});

describe('PackingUtils.isCircleInConvexHull', () => {
    test('should return true if circle is fully inside a rectangle', () => {
        const rect = [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 10 },
            { x: 0, y: 10 }
        ];
        const circle = { x: 5, y: 5, r: 2 };
        expect(PackingUtils.isCircleInConvexHull(circle, rect, 1e-8)).toBe(true);
    });

    test('should return false if circle intersects rectangle edge', () => {
        const rect = [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 10 },
            { x: 0, y: 10 }
        ];
        const circle = { x: 1, y: 5, r: 2 }; // Distance to x=0 edge is 1, which is < r (2)
        expect(PackingUtils.isCircleInConvexHull(circle, rect, 1e-8)).toBe(false);
    });

    test('should return false if circle is fully outside the rectangle', () => {
        const rect = [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 10 },
            { x: 0, y: 10 }
        ];
        const circle = { x: 15, y: 5, r: 2 };
        expect(PackingUtils.isCircleInConvexHull(circle, rect, 1e-8)).toBe(false);
    });

    test('should return true for circle tangent to inner edge of rectangle', () => {
        const rect = [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 10 },
            { x: 0, y: 10 }
        ];
        const circle = { x: 2, y: 5, r: 2 }; // Distance to x=0 edge is 2, == r (2)
        expect(PackingUtils.isCircleInConvexHull(circle, rect, 1e-8)).toBe(true);
    });

    test('should return true if circle is fully inside a triangle', () => {
        const triangle = [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 0, y: 10 }
        ];
        const circle = { x: 2, y: 2, r: 1 };
        expect(PackingUtils.isCircleInConvexHull(circle, triangle, 1e-8)).toBe(true);
    });

    test('should return false if circle intersects triangle edge', () => {
        const triangle = [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 0, y: 10 }
        ];
        const circle = { x: 5, y: 5, r: 2 }; // Center is on the hypotenuse
        expect(PackingUtils.isCircleInConvexHull(circle, triangle, 1e-8)).toBe(false);

const {
    calculateGridTotal,
    calculateLayout,
    getCirclePositions,
    checkOverlap,
    clampToRectangularBoundary,
    clampToCircularBoundary,
    calculateDensity,
    distanceToPolygonEdge,
    isCircleInPolygon,
    calculateTotalArea,
    calculateVoidArea,
    calculateScrapPercentage,
    calculateConvexHull,
    calculatePolygonPerimeter
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

    test('detects overlap with varying radii and kerf gap', () => {
        const c1 = { x: 0, y: 0, r: 5 };
        const c2 = { x: 10, y: 0, r: 2 }; // distance is 10
        // radii sum is 7. Gap is 4. Min dist is 11. Overlaps!
        expect(checkOverlap(c1, c2, 4)).toBe(true);
        // radii sum is 7. Gap is 2. Min dist is 9. Does not overlap!
        expect(checkOverlap(c1, c2, 2)).toBe(false);
    });

    test('edge case: barely touching', () => {
        const c1 = { x: 0, y: 0, r: 5 };
        const c2 = { x: 10, y: 0, r: 5 };
        expect(checkOverlap(c1, c2)).toBe(false);
    });

    test('interstitial fill logic: fits small circle perfectly in void between tangent larger circles', () => {
        const R = 5;
        // 3 mutually tangent circles of radius R
        const c1 = { x: 0, y: 0, r: R };
        const c2 = { x: 2 * R, y: 0, r: R };
        const c3 = { x: R, y: Math.sqrt(3) * R, r: R };

        // Void centroid is at (R, R / Math.sqrt(3))
        // Distance from centroid to any circle center is 2R / Math.sqrt(3)
        // Max radius of inscribed circle is R * (2 / Math.sqrt(3) - 1)
        const centroidX = R;
        const centroidY = R * Math.sqrt(3) / 3;
        const maxR = R * (2 * Math.sqrt(3) / 3 - 1);

        const validFiller = { x: centroidX, y: centroidY, r: maxR };
        expect(checkOverlap(validFiller, c1, 0)).toBe(false);
        expect(checkOverlap(validFiller, c2, 0)).toBe(false);
        expect(checkOverlap(validFiller, c3, 0)).toBe(false);

        // A slightly larger circle should overlap
        const invalidFiller = { x: centroidX, y: centroidY, r: maxR + 0.1 };
        expect(checkOverlap(invalidFiller, c1, 0)).toBe(true);
        expect(checkOverlap(invalidFiller, c2, 0)).toBe(true);
        expect(checkOverlap(invalidFiller, c3, 0)).toBe(true);
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

describe('calculateTotalArea', () => {
    test('calculates correct area for an array of circles', () => {
        const circles = [
            { x: 0, y: 0, r: 2 },
            { x: 5, y: 5, r: 3 }
        ];
        const expected = Math.PI * (4 + 9);
        expect(calculateTotalArea(circles)).toBeCloseTo(expected);
    });

    test('returns 0 for empty array', () => {
        expect(calculateTotalArea([])).toBe(0);
    });

    test('returns 0 for null/undefined input', () => {
        expect(calculateTotalArea(null)).toBe(0);
        expect(calculateTotalArea(undefined)).toBe(0);
    });
});

describe('calculateVoidArea', () => {
    test('subtracts circle area from container area correctly', () => {
        const circles = [
            { x: 0, y: 0, r: 1 },
            { x: 3, y: 3, r: 1 }
        ];
        const containerArea = 20;
        const expected = 20 - (2 * Math.PI);
        expect(calculateVoidArea(circles, containerArea)).toBeCloseTo(expected);
    });

    test('returns 0 if container area is 0 or negative', () => {
        const circles = [{ x: 0, y: 0, r: 1 }];
        expect(calculateVoidArea(circles, 0)).toBe(0);
        expect(calculateVoidArea(circles, -10)).toBe(0);
    });

    test('returns container area if no circles are provided', () => {
        expect(calculateVoidArea([], 50)).toBe(50);
        expect(calculateVoidArea(null, 50)).toBe(50);
    });

    test('does not return negative area if circle area exceeds container area', () => {
        const circles = [{ x: 0, y: 0, r: 10 }]; // Area is ~314
        const containerArea = 100;
        expect(calculateVoidArea(circles, containerArea)).toBe(0);
    });
});

describe('calculateScrapPercentage', () => {
    test('calculates correct percentage', () => {
        const circles = [
            { x: 0, y: 0, r: 1 },
            { x: 3, y: 3, r: 1 }
        ];
        const containerArea = 20;
        const totalCircleArea = 2 * Math.PI;
        const expected = ((20 - totalCircleArea) / 20) * 100;
        expect(calculateScrapPercentage(circles, containerArea)).toBeCloseTo(expected);
    });

    test('returns 100% if no circles are provided', () => {
        expect(calculateScrapPercentage([], 50)).toBe(100);
        expect(calculateScrapPercentage(null, 50)).toBe(100);
    });

    test('returns 0 if container area is invalid', () => {
        const circles = [{ x: 0, y: 0, r: 1 }];
        expect(calculateScrapPercentage(circles, 0)).toBe(0);
        expect(calculateScrapPercentage(circles, -10)).toBe(0);
    });
});

describe('calculateConvexHull', () => {
    test('returns empty array for invalid points or too few points', () => {
        expect(calculateConvexHull([])).toEqual([]);
        expect(calculateConvexHull([{ x: 0, y: 0 }])).toEqual([{ x: 0, y: 0 }]);
        expect(calculateConvexHull(null)).toBeNull();
    });

    test('calculates correct convex hull for a simple set of points', () => {
        const points = [
            { x: 0, y: 0 },
            { x: 2, y: 0 },
            { x: 2, y: 2 },
            { x: 0, y: 2 },
            { x: 1, y: 1 } // Inside point
        ];
        const hull = calculateConvexHull(points);
        expect(hull).toHaveLength(4);
        // Order might vary depending on starting point, but should contain the 4 corners
        const hullSet = new Set(hull.map(p => `${p.x},${p.y}`));
        expect(hullSet.has('0,0')).toBeTruthy();
        expect(hullSet.has('2,0')).toBeTruthy();
        expect(hullSet.has('2,2')).toBeTruthy();
        expect(hullSet.has('0,2')).toBeTruthy();
    });

    test('calculates correct convex hull for a line of points', () => {
        const points = [
            { x: 0, y: 0 },
            { x: 1, y: 1 },
            { x: 2, y: 2 }
        ];
        const hull = calculateConvexHull(points);
        // Should ideally return just the two endpoints, or all three if collinearity isn't strict
        // In our Monotone Chain, it returns endpoints.
        expect(hull).toHaveLength(2);
        expect(hull).toEqual(expect.arrayContaining([{x: 0, y: 0}, {x: 2, y: 2}]));
    });
});

describe('calculatePolygonPerimeter', () => {
    test('returns 0 for invalid polygons', () => {
        expect(calculatePolygonPerimeter([])).toBe(0);
        expect(calculatePolygonPerimeter([{ x: 0, y: 0 }])).toBe(0);
        expect(calculatePolygonPerimeter(null)).toBe(0);
    });

    test('calculates correct perimeter for a square', () => {
        const polygon = [
            { x: 0, y: 0 },
            { x: 2, y: 0 },
            { x: 2, y: 2 },
            { x: 0, y: 2 }
        ];
        expect(calculatePolygonPerimeter(polygon)).toBe(8);
    });

    test('calculates correct perimeter for a triangle', () => {
        const polygon = [
            { x: 0, y: 0 },
            { x: 3, y: 0 },
            { x: 0, y: 4 }
        ];
        // 3 + 4 + 5 = 12
        expect(calculatePolygonPerimeter(polygon)).toBe(12);
    });
});

describe('non-axis-aligned bounding polygon containment', () => {
    const polygon = [
        { x: 5, y: 0 },
        { x: 10, y: 5 },
        { x: 5, y: 10 },
        { x: 0, y: 5 }
    ];

    test('circle entirely inside rotated diamond', () => {
        expect(isCircleInPolygon({ x: 5, y: 5, r: 2 }, polygon)).toBe(true);
    });

    test('circle entirely outside rotated diamond', () => {
        expect(isCircleInPolygon({ x: 10, y: 10, r: 1 }, polygon)).toBe(false);
    });

    test('circle intersecting edge of rotated diamond', () => {
        expect(isCircleInPolygon({ x: 7.5, y: 7.5, r: 2 }, polygon)).toBe(false); // Center on edge
        expect(isCircleInPolygon({ x: 7, y: 7, r: 2 }, polygon)).toBe(false); // Center inside, intersecting edge
    });

    test('circle tangent to edge of rotated diamond', () => {
        // Distance from center (5,5) to edge (5,10)-(10,5) is
        // The line is x + y - 15 = 0
        // Distance from (5,5) to line x + y - 15 = 0 is |5 + 5 - 15| / sqrt(2) = 5 / sqrt(2) = ~3.5355
        // A circle at (5,5) with radius 3.5355 should be roughly tangent
        const r = 5 / Math.sqrt(2);
        expect(isCircleInPolygon({ x: 5, y: 5, r: r }, polygon)).toBe(true);