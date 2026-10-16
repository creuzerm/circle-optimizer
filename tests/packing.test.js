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
    });
});
