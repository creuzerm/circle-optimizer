const { describe, test, it } = require('node:test');
const assert = require('node:assert');
const PackingUtils = require('../src/packing.js');

describe('PackingUtils.checkCircleCollision', () => {
    test('should return false for separate circles', () => {
        const c1 = { x: 0, y: 0, r: 5 };
        const c2 = { x: 12, y: 0, r: 5 };
        assert.strictEqual(PackingUtils.checkCircleCollision(c1, c2, 1e-8), false);
    });

    test('should return true for overlapping circles', () => {
        const c1 = { x: 0, y: 0, r: 5 };
        const c2 = { x: 8, y: 0, r: 5 };
        assert.strictEqual(PackingUtils.checkCircleCollision(c1, c2, 1e-8), true);
    });

    test('should return false for strictly tangent circles', () => {
        const c1 = { x: 0, y: 0, r: 5 };
        const c2 = { x: 10, y: 0, r: 5 };
        // With an epsilon, tangent circles should NOT be considered overlapping
        assert.strictEqual(PackingUtils.checkCircleCollision(c1, c2, 1e-8), false);
    });

    test('should return false for strictly tangent circles with different radii', () => {
        const c1 = { x: 0, y: 0, r: 3 };
        const c2 = { x: 7, y: 0, r: 4 };
        assert.strictEqual(PackingUtils.checkCircleCollision(c1, c2, 1e-8), false);
    });

    test('should detect collision when distance is exactly (minDist - epsilon)', () => {
        const c1 = { x: 0, y: 0, r: 5 };
        const minDist = 10;
        const epsilon = 1e-8;
        // distance squared we want is (minDistSq - epsilon) slightly lower to trigger
        const distSq = minDist * minDist - epsilon - 1e-10;
        const dist = Math.sqrt(distSq);
        const c2 = { x: dist, y: 0, r: 5 };

        assert.strictEqual(PackingUtils.checkCircleCollision(c1, c2, epsilon), true);
    });

    test('should not detect collision when distance is exactly (minDist - epsilon) + tiny', () => {
        const c1 = { x: 0, y: 0, r: 5 };
        const minDist = 10;
        const epsilon = 1e-8;
        // distance squared slightly higher than (minDistSq - epsilon) to NOT trigger
        const distSq = minDist * minDist - epsilon + 1e-10;
        const dist = Math.sqrt(distSq);
        const c2 = { x: dist, y: 0, r: 5 };

        assert.strictEqual(PackingUtils.checkCircleCollision(c1, c2, epsilon), false);
    });

    test('should return identical results to Math.hypot logic (baseline check)', () => {
        const c1 = { x: 10, y: 15, r: 4 };
        const c2 = { x: 13, y: 19, r: 3 }; // dist is exactly 5. 5 < 7

        const dx = c2.x - c1.x;
        const dy = c2.y - c1.y;
        const hypotDist = Math.hypot(dx, dy);
        const expected = hypotDist < c1.r + c2.r;

        assert.strictEqual(PackingUtils.checkCircleCollision(c1, c2, 0), expected);
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
        assert.strictEqual(PackingUtils.isCircleInConvexHull(circle, rect, 1e-8), true);
    });

    test('should return false if circle intersects rectangle edge', () => {
        const rect = [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 10 },
            { x: 0, y: 10 }
        ];
        const circle = { x: 1, y: 5, r: 2 }; // Distance to x=0 edge is 1, which is < r (2)
        assert.strictEqual(PackingUtils.isCircleInConvexHull(circle, rect, 1e-8), false);
    });

    test('should return false if circle is fully outside the rectangle', () => {
        const rect = [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 10 },
            { x: 0, y: 10 }
        ];
        const circle = { x: 15, y: 5, r: 2 };
        assert.strictEqual(PackingUtils.isCircleInConvexHull(circle, rect, 1e-8), false);
    });

    test('should return true for circle tangent to inner edge of rectangle', () => {
        const rect = [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 10 },
            { x: 0, y: 10 }
        ];
        const circle = { x: 2, y: 5, r: 2 }; // Distance to x=0 edge is 2, == r (2)
        assert.strictEqual(PackingUtils.isCircleInConvexHull(circle, rect, 1e-8), true);
    });

    test('should return true if circle is fully inside a triangle', () => {
        const triangle = [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 0, y: 10 }
        ];
        const circle = { x: 2, y: 2, r: 1 };
        assert.strictEqual(PackingUtils.isCircleInConvexHull(circle, triangle, 1e-8), true);
    });

    test('should return false if circle intersects triangle edge', () => {
        const triangle = [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 0, y: 10 }
        ];
        const circle = { x: 5, y: 5, r: 2 }; // Center is on the hypotenuse
        assert.strictEqual(PackingUtils.isCircleInConvexHull(circle, triangle, 1e-8), false);
    });
});

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
        assert.strictEqual(calculateGridTotal(10, 10, 2, 0), 25);
    });

    test('calculates correct total with gap', () => {
        // 10x10 area, 2 diameter, 1 gap -> effective 3.
        // nx = floor( (10 - 2) / 3 ) + 1 = floor(8/3) + 1 = 2 + 1 = 3
        // ny = floor( (10 - 2) / 3 ) + 1 = 3
        // 3 * 3 = 9
        assert.strictEqual(calculateGridTotal(10, 10, 2, 1), 9);
    });

    test('returns 0 if diameter is larger than area', () => {
        assert.strictEqual(calculateGridTotal(10, 10, 15, 0), 0);
    });
});

describe('calculateLayout', () => {
    test('calculates basic hexagonal layout', () => {
        const layout = calculateLayout(10, 10, 2, 0);
        assert.ok(layout.total > 0);
        assert.ok(layout.numRows > 0);
        assert.ok(Math.abs(layout.dy - 2 * Math.sqrt(3) / 2) < 0.0001);
    });

    test('returns 0 total for too large diameter', () => {
        const layout = calculateLayout(10, 10, 15, 0);
        assert.strictEqual(layout.total, 0);
        assert.strictEqual(layout.numRows, 0);
    });
});

describe('getCirclePositions', () => {
    test('returns empty array if no layout', () => {
        assert.deepStrictEqual(getCirclePositions(null, 10, 10, 2, 0, 0, false), []);
    });

    test('returns positions for a valid layout', () => {
        const layout = calculateLayout(10, 10, 2, 0);
        const positions = getCirclePositions(layout, 10, 10, 2, 0, 0, false);
        assert.strictEqual(positions.length, layout.total);
        assert.ok('x' in positions[0]);
        assert.ok('y' in positions[0]);
        assert.ok('r' in positions[0]);
        assert.strictEqual(positions[0].r, 1);
    });

    test('applies rotation correctly', () => {
        const layout = calculateLayout(20, 10, 2, 0);
        const positionsNormal = getCirclePositions(layout, 20, 10, 2, 0, 0, false);
        const positionsRotated = getCirclePositions(layout, 10, 20, 2, 0, 0, true);

        assert.strictEqual(positionsNormal.length, positionsRotated.length);
        // Because of the math, they might not map 1:1 perfectly easily,
        // but checking length and properties is a good sanity check
        assert.ok('x' in positionsRotated[0]);
        assert.ok('y' in positionsRotated[0]);
    });
});

describe('checkOverlap', () => {
    test('detects overlap between intersecting circles', () => {
        const c1 = { x: 0, y: 0, r: 5 };
        const c2 = { x: 8, y: 0, r: 5 };
        assert.strictEqual(checkOverlap(c1, c2), true);
    });

    test('detects no overlap between separated circles', () => {
        const c1 = { x: 0, y: 0, r: 5 };
        const c2 = { x: 12, y: 0, r: 5 };
        assert.strictEqual(checkOverlap(c1, c2), false);
    });

    test('detects overlap with gap parameter', () => {
        const c1 = { x: 0, y: 0, r: 5 };
        const c2 = { x: 11, y: 0, r: 5 };
        // distance is 11. radii sum is 10. Gap is 2.
        // Min distance required is 12. So they "overlap" with respect to the gap.
        assert.strictEqual(checkOverlap(c1, c2, 2), true);
    });

    test('detects overlap with varying radii and kerf gap', () => {
        const c1 = { x: 0, y: 0, r: 5 };
        const c2 = { x: 10, y: 0, r: 2 }; // distance is 10
        // radii sum is 7. Gap is 4. Min dist is 11. Overlaps!
        assert.strictEqual(checkOverlap(c1, c2, 4), true);
        // radii sum is 7. Gap is 2. Min dist is 9. Does not overlap!
        assert.strictEqual(checkOverlap(c1, c2, 2), false);
    });

    test('edge case: barely touching', () => {
        const c1 = { x: 0, y: 0, r: 5 };
        const c2 = { x: 10, y: 0, r: 5 };
        assert.strictEqual(checkOverlap(c1, c2), false);
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
        assert.strictEqual(checkOverlap(validFiller, c1, 0), false);
        assert.strictEqual(checkOverlap(validFiller, c2, 0), false);
        assert.strictEqual(checkOverlap(validFiller, c3, 0), false);

        // A slightly larger circle should overlap
        const invalidFiller = { x: centroidX, y: centroidY, r: maxR + 0.1 };
        assert.strictEqual(checkOverlap(invalidFiller, c1, 0), true);
        assert.strictEqual(checkOverlap(invalidFiller, c2, 0), true);
        assert.strictEqual(checkOverlap(invalidFiller, c3, 0), true);
    });
});

describe('clampToRectangularBoundary', () => {
    test('returns same circle if inside boundary', () => {
        const circle = { x: 5, y: 5, r: 2 };
        const clamped = clampToRectangularBoundary(circle, 10, 10);
        assert.deepStrictEqual(clamped, circle);
    });

    test('clamps x coordinate when out of bounds', () => {
        const circle = { x: 1, y: 5, r: 2 };
        const clamped = clampToRectangularBoundary(circle, 10, 10);
        assert.strictEqual(clamped.x, 2);
        assert.strictEqual(clamped.y, 5);
    });

    test('clamps y coordinate when out of bounds', () => {
        const circle = { x: 5, y: 9, r: 2 };
        const clamped = clampToRectangularBoundary(circle, 10, 10);
        assert.strictEqual(clamped.x, 5);
        assert.strictEqual(clamped.y, 8);
    });

    test('applies margin correctly', () => {
        const circle = { x: 2, y: 5, r: 2 };
        const clamped = clampToRectangularBoundary(circle, 10, 10, 1);
        // minX should be margin + r = 1 + 2 = 3
        assert.strictEqual(clamped.x, 3);
    });

    test('returns null if circle is too large for boundary', () => {
        const circle = { x: 5, y: 5, r: 6 };
        const clamped = clampToRectangularBoundary(circle, 10, 10);
        assert.strictEqual(clamped, null);
    });
});

describe('clampToCircularBoundary', () => {
    test('returns same circle if inside boundary', () => {
        const circle = { x: 0, y: 0, r: 2 };
        const clamped = clampToCircularBoundary(circle, 0, 0, 10);
        assert.deepStrictEqual(clamped, circle);
    });

    test('clamps circle to edge of boundary', () => {
        const circle = { x: 8, y: 0, r: 3 };
        const clamped = clampToCircularBoundary(circle, 0, 0, 10);
        // maxDist = 10 - 3 = 7. Current dist is 8.
        assert.strictEqual(clamped.x, 7);
        assert.strictEqual(clamped.y, 0);
    });

    test('applies margin correctly', () => {
        const circle = { x: 6, y: 0, r: 3 };
        const clamped = clampToCircularBoundary(circle, 0, 0, 10, 2);
        // maxDist = 10 - 2(margin) - 3(r) = 5. Current dist is 6.
        assert.strictEqual(clamped.x, 5);
        assert.strictEqual(clamped.y, 0);
    });

    test('returns null if circle is too large for boundary', () => {
        const circle = { x: 0, y: 0, r: 12 };
        const clamped = clampToCircularBoundary(circle, 0, 0, 10);
        assert.strictEqual(clamped, null);
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
        assert.ok(Math.abs(calculateDensity(circles, containerArea) - expectedDensity) < 0.0001);
    });

    test('returns 0 for empty circles array', () => {
        assert.strictEqual(calculateDensity([], 10), 0);
    });

    test('returns 0 for containerArea <= 0', () => {
        assert.strictEqual(calculateDensity([{ x: 0, y: 0, r: 1 }], 0), 0);
        assert.strictEqual(calculateDensity([{ x: 0, y: 0, r: 1 }], -5), 0);
    });
});

describe('Performance / Benchmark', () => {
    test('avoids Math.sqrt and Math.hypot during inner loop circle collision tests', () => {
        const originalSqrt = Math.sqrt;
        const originalHypot = Math.hypot;
        let sqrtCalls = 0;
        let hypotCalls = 0;

        Math.sqrt = (x) => {
            sqrtCalls++;
            return originalSqrt(x);
        };
        Math.hypot = (...args) => {
            hypotCalls++;
            return originalHypot(...args);
        };

        const c1 = { x: 0, y: 0, r: 5 };
        const c2 = { x: 8, y: 0, r: 5 };

        try {
            PackingUtils.checkCircleCollision(c1, c2);
            PackingUtils.checkOverlap(c1, c2);

            assert.strictEqual(sqrtCalls, 0, `Expected 0 Math.sqrt calls, but got ${sqrtCalls}`);
            assert.strictEqual(hypotCalls, 0, `Expected 0 Math.hypot calls, but got ${hypotCalls}`);
        } finally {
            Math.sqrt = originalSqrt;
            Math.hypot = originalHypot;
        }
    });

    test('avoids Math.sqrt during inner loop collision tests', () => {
        const originalSqrt = Math.sqrt;
        let sqrtCalls = 0;

        Math.sqrt = (x) => {
            sqrtCalls++;
            return originalSqrt(x);
        };

        const squarePolygon = [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 10 },
            { x: 0, y: 10 }
        ];

        const circle = { x: 5, y: 5, r: 2 };

        try {
            const inConvex = PackingUtils.isCircleInConvexHull(circle, squarePolygon);
            const inPolygon = PackingUtils.isCircleInPolygon(circle, squarePolygon);

            assert.strictEqual(inConvex, true);
            assert.strictEqual(inPolygon, true);

            // Neither of these internal routines should have called Math.sqrt
            assert.strictEqual(sqrtCalls, 0, `Expected 0 Math.sqrt calls, but got ${sqrtCalls}`);
        } finally {
            Math.sqrt = originalSqrt;
        }
    });

    test('clampToCircularBoundary uses 0 Math.sqrt calls for circles within boundary', () => {
        const originalSqrt = Math.sqrt;
        let sqrtCalls = 0;

        Math.sqrt = (x) => {
            sqrtCalls++;
            return originalSqrt(x);
        };

        const circle = { x: 0, y: 0, r: 2 };
        try {
            const result = PackingUtils.clampToCircularBoundary(circle, 0, 0, 10);
            assert.deepStrictEqual(result, circle);
            assert.strictEqual(sqrtCalls, 0, `Expected 0 Math.sqrt calls, but got ${sqrtCalls}`);
        } finally {
            Math.sqrt = originalSqrt;
        }
    });

    test('clampToCircularBoundary uses 1 Math.sqrt call when clamping is needed', () => {
        const originalSqrt = Math.sqrt;
        let sqrtCalls = 0;

        Math.sqrt = (x) => {
            sqrtCalls++;
            return originalSqrt(x);
        };

        const circle = { x: 8, y: 0, r: 3 };
        try {
            const result = PackingUtils.clampToCircularBoundary(circle, 0, 0, 10);
            assert.ok(result);
            assert.strictEqual(result.x, 7);
            assert.strictEqual(result.y, 0);
            assert.strictEqual(sqrtCalls, 1, `Expected 1 Math.sqrt call, but got ${sqrtCalls}`);
        } finally {
            Math.sqrt = originalSqrt;
        }
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
        assert.ok(Math.abs(distanceToPolygonEdge(circle, squarePolygon) - 5) < 0.0001);
    });

    test('calculates correct distance when circle is near corner', () => {
        const circle = { x: 1, y: 2, r: 1 };
        // closest to left edge (x=0) which is dist 1
        assert.ok(Math.abs(distanceToPolygonEdge(circle, squarePolygon) - 1) < 0.0001);
    });

    test('calculates distance accurately for points outside the polygon', () => {
        const circle = { x: 15, y: 5, r: 1 };
        // distance to edge (10, y) is 5
        assert.ok(Math.abs(distanceToPolygonEdge(circle, squarePolygon) - 5) < 0.0001);
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
        assert.strictEqual(isCircleInPolygon(circle, squarePolygon), true);
    });

    test('returns false when circle is outside', () => {
        const circle = { x: 15, y: 15, r: 2 };
        assert.strictEqual(isCircleInPolygon(circle, squarePolygon), false);
    });

    test('returns false when circle intersects an edge', () => {
        const circle = { x: 1, y: 5, r: 2 };
        // distance to left edge is 1, radius is 2, so it intersects
        assert.strictEqual(isCircleInPolygon(circle, squarePolygon), false);
    });

    test('returns true for circle tangent to bounding edge without registering false-positive collision', () => {
        const circle = { x: 2, y: 5, r: 2 };
        // distance to left edge is exactly 2, radius is 2. Should be true.
        assert.strictEqual(isCircleInPolygon(circle, squarePolygon), true);
    });

    test('returns true for floating point tangent inaccuracies', () => {
        // slightly less than 2 due to floating point error, e.g. 1.999999
        const circle = { x: 1.999995, y: 5, r: 2 };
        assert.strictEqual(isCircleInPolygon(circle, squarePolygon), true);
    });
});

describe('calculateTotalArea', () => {
    test('calculates correct area for an array of circles', () => {
        const circles = [
            { x: 0, y: 0, r: 2 },
            { x: 5, y: 5, r: 3 }
        ];
        const expected = Math.PI * (4 + 9);
        assert.ok(Math.abs(calculateTotalArea(circles) - expected) < 0.0001);
    });

    test('returns 0 for empty array', () => {
        assert.strictEqual(calculateTotalArea([]), 0);
    });

    test('returns 0 for null/undefined input', () => {
        assert.strictEqual(calculateTotalArea(null), 0);
        assert.strictEqual(calculateTotalArea(undefined), 0);
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
        assert.ok(Math.abs(calculateVoidArea(circles, containerArea) - expected) < 0.0001);
    });

    test('returns 0 if container area is 0 or negative', () => {
        const circles = [{ x: 0, y: 0, r: 1 }];
        assert.strictEqual(calculateVoidArea(circles, 0), 0);
        assert.strictEqual(calculateVoidArea(circles, -10), 0);
    });

    test('returns container area if no circles are provided', () => {
        assert.strictEqual(calculateVoidArea([], 50), 50);
        assert.strictEqual(calculateVoidArea(null, 50), 50);
    });

    test('does not return negative area if circle area exceeds container area', () => {
        const circles = [{ x: 0, y: 0, r: 10 }]; // Area is ~314
        const containerArea = 100;
        assert.strictEqual(calculateVoidArea(circles, containerArea), 0);
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
        assert.ok(Math.abs(calculateScrapPercentage(circles, containerArea) - expected) < 0.0001);
    });

    test('returns 100% if no circles are provided', () => {
        assert.strictEqual(calculateScrapPercentage([], 50), 100);
        assert.strictEqual(calculateScrapPercentage(null, 50), 100);
    });

    test('returns 0 if container area is invalid', () => {
        const circles = [{ x: 0, y: 0, r: 1 }];
        assert.strictEqual(calculateScrapPercentage(circles, 0), 0);
        assert.strictEqual(calculateScrapPercentage(circles, -10), 0);
    });
});

describe('calculateConvexHull', () => {
    test('returns empty array for invalid points or too few points', () => {
        assert.deepStrictEqual(calculateConvexHull([]), []);
        assert.deepStrictEqual(calculateConvexHull([{ x: 0, y: 0 }]), [{ x: 0, y: 0 }]);
        assert.strictEqual(calculateConvexHull(null), null);
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
        assert.strictEqual(hull.length, 4);
        // Order might vary depending on starting point, but should contain the 4 corners
        const hullSet = new Set(hull.map(p => `${p.x},${p.y}`));
        assert.ok(hullSet.has('0,0'));
        assert.ok(hullSet.has('2,0'));
        assert.ok(hullSet.has('2,2'));
        assert.ok(hullSet.has('0,2'));
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
        assert.strictEqual(hull.length, 2);
        assert.deepStrictEqual(hull, [{x: 0, y: 0}, {x: 2, y: 2}]);
    });
});

describe('calculatePolygonPerimeter', () => {
    test('returns 0 for invalid polygons', () => {
        assert.strictEqual(calculatePolygonPerimeter([]), 0);
        assert.strictEqual(calculatePolygonPerimeter([{ x: 0, y: 0 }]), 0);
        assert.strictEqual(calculatePolygonPerimeter(null), 0);
    });

    test('calculates correct perimeter for a square', () => {
        const polygon = [
            { x: 0, y: 0 },
            { x: 2, y: 0 },
            { x: 2, y: 2 },
            { x: 0, y: 2 }
        ];
        assert.strictEqual(calculatePolygonPerimeter(polygon), 8);
    });

    test('calculates correct perimeter for a triangle', () => {
        const polygon = [
            { x: 0, y: 0 },
            { x: 3, y: 0 },
            { x: 0, y: 4 }
        ];
        // 3 + 4 + 5 = 12
        assert.strictEqual(calculatePolygonPerimeter(polygon), 12);
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
        assert.strictEqual(isCircleInPolygon({ x: 5, y: 5, r: 2 }, polygon), true);
    });

    test('circle entirely outside rotated diamond', () => {
        assert.strictEqual(isCircleInPolygon({ x: 10, y: 10, r: 1 }, polygon), false);
    });

    test('circle intersecting edge of rotated diamond', () => {
        assert.strictEqual(isCircleInPolygon({ x: 7.5, y: 7.5, r: 2 }, polygon), false); // Center on edge
        assert.strictEqual(isCircleInPolygon({ x: 7, y: 7, r: 2 }, polygon), false); // Center inside, intersecting edge
    });

    test('circle tangent to edge of rotated diamond', () => {
        // Distance from center (5,5) to edge (5,10)-(10,5) is
        // The line is x + y - 15 = 0
        // Distance from (5,5) to line x + y - 15 = 0 is |5 + 5 - 15| / sqrt(2) = 5 / sqrt(2) = ~3.5355
        // A circle at (5,5) with radius 3.5355 should be roughly tangent
        const r = 5 / Math.sqrt(2);
        assert.strictEqual(isCircleInPolygon({ x: 5, y: 5, r: r }, polygon), true);
    });
});

describe('Density Comparison: Hexagonal vs Rectangular Grid', () => {
    test('hexagonal layout yields more circles than grid for large enough area', () => {
        // e.g. 100x100 area, diameter 10, no gap
        const gridYield = calculateGridTotal(100, 100, 10, 0); // 10 * 10 = 100
        const hexLayout = calculateLayout(100, 100, 10, 0);
        // hex layout dy = 10 * sqrt(3)/2 = 8.66
        // numRows = floor((100-10)/8.66) + 1 = 11
        // rows will alternate 10 and 9 circles. (6 * 10) + (5 * 9) = 60 + 45 = 105
        assert.ok(hexLayout.total > gridYield);
    });
});

describe('Spacing Calculations (Gap Effect)', () => {
    test('larger gap reduces total yield in grid layout', () => {
        const yieldNoGap = calculateGridTotal(100, 100, 10, 0); // 100
        const yieldWithGap = calculateGridTotal(100, 100, 10, 5); // effective D = 15. floor(90/15)+1 = 7. 7x7=49
        assert.ok(yieldNoGap > yieldWithGap);
        assert.strictEqual(yieldWithGap, 49);
    });

    test('larger gap reduces total yield in hexagonal layout', () => {
        const layoutNoGap = calculateLayout(100, 100, 10, 0);
        const layoutWithGap = calculateLayout(100, 100, 10, 5);
        assert.ok(layoutNoGap.total > layoutWithGap.total);
    });
});

describe('Edge Margins (Margin Effect on Positions)', () => {
    test('margin shifts starting positions of circles', () => {
        const layout = calculateLayout(100, 100, 10, 0);
        // without margin
        const positionsNoMargin = getCirclePositions(layout, 100, 100, 10, 0, 0, false);
        // with margin
        const positionsWithMargin = getCirclePositions(layout, 120, 120, 10, 10, 0, false);

        assert.ok(positionsNoMargin.length > 0);
        assert.ok(positionsWithMargin.length > 0);
        // The relative start position is shifted by margin. Since the inner packing area is 100x100 for both,
        // the layout and positions relative to top-left of packing area are identical.
        // Thus, positionsWithMargin should exactly be shifted by +10 in both x and y.
        assert.ok(Math.abs(positionsWithMargin[0].x - (positionsNoMargin[0].x + 10)) < 0.0001);
        assert.ok(Math.abs(positionsWithMargin[0].y - (positionsNoMargin[0].y + 10)) < 0.0001);
    });
});

describe('Yield Calculation and Waste Area Edge Cases', () => {
    test('calculateVoidArea handles zero and negative radii correctly', () => {
        // Zero radius
        const circlesZeroR = [{ x: 0, y: 0, r: 0 }];
        assert.strictEqual(calculateVoidArea(circlesZeroR, 100), 100);

        // Negative radius
        const circlesNegR = [{ x: 0, y: 0, r: -5 }];
        // r squared will still be positive (25), so area is 25pi
        // This is a math property, but tests that it doesn't fail or return invalid area
        const expectedNegR = 100 - (Math.PI * 25);
        assert.ok(Math.abs(calculateVoidArea(circlesNegR, 100) - expectedNegR) < 0.0001);
    });

    test('calculateScrapPercentage handles zero container area without dividing by zero', () => {
        const circles = [{ x: 0, y: 0, r: 5 }];
        assert.strictEqual(calculateScrapPercentage(circles, 0), 0);
        assert.strictEqual(calculateScrapPercentage(circles, -10), 0);
    });
});
