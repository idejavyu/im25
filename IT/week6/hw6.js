AFRAME.registerComponent('geometry-calculator', {
    tick: function () {
        const markers = ['#markerA', '#markerB', '#markerC', '#markerD']
            .map(id => document.querySelector(id));

        if (markers.some(m => !m || !m.object3D.visible)) return;

        const pts = markers.map(m => m.object3D.position);

        const dist = (p1, p2) => Math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2 + (p1.z - p2.z)**2);

        const perimeter = dist(pts[0], pts[1]) + dist(pts[1], pts[2]) + 
                          dist(pts[2], pts[3]) + dist(pts[3], pts[0]);

        const getArea = (p1, p2, p3) => {
            const v1 = { x: p2.x - p1.x, y: p2.y - p1.y, z: p2.z - p1.z };
            const v2 = { x: p3.x - p1.x, y: p3.y - p1.y, z: p3.z - p1.z };
            const cp = {
                x: v1.y * v2.z - v1.z * v2.y,
                y: v1.z * v2.x - v1.x * v2.z,
                z: v1.x * v2.y - v1.y * v2.x
            };
            return 0.5 * Math.sqrt(cp.x**2 + cp.y**2 + cp.z**2);
        };

        const sABC = getArea(pts[0], pts[1], pts[2]);
        const sBCD = getArea(pts[1], pts[2], pts[3]);
        const sCDA = getArea(pts[2], pts[3], pts[0]);
        const sDAB = getArea(pts[3], pts[0], pts[1]);

        const output = `P: ${perimeter.toFixed(2)}\n` +
                       `ABC: ${sABC.toFixed(2)} | BCD: ${sBCD.toFixed(2)}\n` +
                       `CDA: ${sCDA.toFixed(2)} | DAB: ${sDAB.toFixed(2)}`;
        
        this.el.setAttribute('text', 'value', output);

        const lineIds = ['#lineAB', '#lineBC', '#lineCD', '#lineDA'];
        for (let i = 0; i < 4; i++) {
            const next = (i + 1) % 4;
            document.querySelector(lineIds[i]).setAttribute('line', { start: pts[i], end: pts[next] });
        }
    }
});