// ── Wireframe Dotted Globe — Pure Canvas 2D, zero dependencies ──────────────

export function initGlobe() {
    const canvas = document.getElementById('globe-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ── Config ─────────────────────────────────────────────────────────────────
    const dpr = window.devicePixelRatio || 1;
    let W, H, R;

    function resize() {
        W = canvas.clientWidth;
        H = canvas.clientHeight;
        R = Math.min(W, H) / 2.2;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', () => { resize(); });

    // ── Projection (Orthographic) ──────────────────────────────────────────────
    const DEG = Math.PI / 180;
    let rotLng = -8; // Start facing Porto/Europe
    let rotLat = 25;
    let scale = 1;

    // Convert [lng, lat] → [x, y] or null if on back side
    function project(lng, lat) {
        const λ = lng * DEG;
        const φ = lat * DEG;
        const λ0 = rotLng * DEG;
        const φ0 = rotLat * DEG;

        const cosφ = Math.cos(φ);
        const sinφ = Math.sin(φ);
        const cosφ0 = Math.cos(φ0);
        const sinφ0 = Math.sin(φ0);
        const cosΔλ = Math.cos(λ - λ0);

        // Check if point is on visible hemisphere (cosC > 0)
        const cosC = sinφ0 * sinφ + cosφ0 * cosφ * cosΔλ;
        if (cosC < 0) return null;

        const x = R * scale * cosφ * Math.sin(λ - λ0);
        const y = R * scale * (cosφ0 * sinφ - sinφ0 * cosφ * cosΔλ);

        return [W / 2 + x, H / 2 - y];
    }

    // ── Graticule ──────────────────────────────────────────────────────────────
    function drawGraticule() {
        ctx.strokeStyle = 'rgba(18, 18, 18, 0.12)';
        ctx.lineWidth = 0.6 * scale;

        // Meridians (every 30°)
        for (let lng = -180; lng <= 180; lng += 30) {
            ctx.beginPath();
            let started = false;
            for (let lat = -90; lat <= 90; lat += 2) {
                const p = project(lng, lat);
                if (p) {
                    if (!started) { ctx.moveTo(p[0], p[1]); started = true; }
                    else ctx.lineTo(p[0], p[1]);
                } else {
                    started = false;
                }
            }
            ctx.stroke();
        }

        // Parallels (every 30°)
        for (let lat = -60; lat <= 60; lat += 30) {
            ctx.beginPath();
            let started = false;
            for (let lng = -180; lng <= 180; lng += 2) {
                const p = project(lng, lat);
                if (p) {
                    if (!started) { ctx.moveTo(p[0], p[1]); started = true; }
                    else ctx.lineTo(p[0], p[1]);
                } else {
                    started = false;
                }
            }
            ctx.stroke();
        }
    }

    // ── Land rendering ─────────────────────────────────────────────────────────
    let landFeatures = null;
    let landDots = [];

    function generateDotsForPolygon(coords, spacing) {
        const dots = [];
        // Find bounding box
        let minLng = 360, maxLng = -360, minLat = 180, maxLat = -180;
        for (const pt of coords) {
            if (pt[0] < minLng) minLng = pt[0];
            if (pt[0] > maxLng) maxLng = pt[0];
            if (pt[1] < minLat) minLat = pt[1];
            if (pt[1] > maxLat) maxLat = pt[1];
        }

        const step = spacing;
        for (let lng = minLng; lng <= maxLng; lng += step) {
            for (let lat = minLat; lat <= maxLat; lat += step) {
                if (pointInRing(lng, lat, coords)) {
                    dots.push([lng, lat]);
                }
            }
        }
        return dots;
    }

    function pointInRing(x, y, ring) {
        let inside = false;
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
            const xi = ring[i][0], yi = ring[i][1];
            const xj = ring[j][0], yj = ring[j][1];
            if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
                inside = !inside;
            }
        }
        return inside;
    }

    function processFeatures(features) {
        const dots = [];
        const spacing = 1.4; // degrees between dots

        for (const feature of features) {
            const geom = feature.geometry;
            if (geom.type === 'Polygon') {
                const outerRing = geom.coordinates[0];
                const polyDots = generateDotsForPolygon(outerRing, spacing);
                // Exclude holes
                for (const dot of polyDots) {
                    let inHole = false;
                    for (let h = 1; h < geom.coordinates.length; h++) {
                        if (pointInRing(dot[0], dot[1], geom.coordinates[h])) { inHole = true; break; }
                    }
                    if (!inHole) dots.push(dot);
                }
            } else if (geom.type === 'MultiPolygon') {
                for (const polygon of geom.coordinates) {
                    const outerRing = polygon[0];
                    const polyDots = generateDotsForPolygon(outerRing, spacing);
                    for (const dot of polyDots) {
                        let inHole = false;
                        for (let h = 1; h < polygon.length; h++) {
                            if (pointInRing(dot[0], dot[1], polygon[h])) { inHole = true; break; }
                        }
                        if (!inHole) dots.push(dot);
                    }
                }
            }
        }
        return dots;
    }

    function drawLandOutlines() {
        if (!landFeatures) return;

        ctx.strokeStyle = 'rgba(18, 18, 18, 0.35)';
        ctx.lineWidth = 0.8 * scale;

        for (const feature of landFeatures) {
            const geom = feature.geometry;
            const rings = geom.type === 'Polygon'
                ? geom.coordinates
                : geom.type === 'MultiPolygon'
                    ? geom.coordinates.flat()
                    : [];

            for (const ring of rings) {
                ctx.beginPath();
                let started = false;
                for (const coord of ring) {
                    const p = project(coord[0], coord[1]);
                    if (p) {
                        if (!started) { ctx.moveTo(p[0], p[1]); started = true; }
                        else ctx.lineTo(p[0], p[1]);
                    } else {
                        started = false;
                    }
                }
                ctx.stroke();
            }
        }
    }

    function drawLandDots() {
        const dotR = 1.1 * scale;
        ctx.fillStyle = 'rgba(51, 51, 51, 0.5)'; // carbon/50

        for (const dot of landDots) {
            const p = project(dot[0], dot[1]);
            if (p) {
                ctx.beginPath();
                ctx.arc(p[0], p[1], dotR, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // ── Render ─────────────────────────────────────────────────────────────────
    function render() {
        ctx.clearRect(0, 0, W, H);

        const r = R * scale;

        // Globe circle (subtle outline)
        ctx.beginPath();
        ctx.arc(W / 2, H / 2, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(18, 18, 18, 0.1)';
        ctx.lineWidth = 1;
        ctx.stroke();

        drawGraticule();
        drawLandOutlines();
        drawLandDots();
        drawPortoMarker();
    }

    // ── Load GeoJSON ───────────────────────────────────────────────────────────
    async function loadData() {
        try {
            const res = await fetch(
                'https://raw.githubusercontent.com/martynafford/natural-earth-geojson/refs/heads/master/110m/physical/ne_110m_land.json'
            );
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            landFeatures = data.features;
            landDots = processFeatures(landFeatures);
            render();
        } catch (e) {
            console.warn('[Globe] Could not load land data:', e);
        }
    }

    loadData();

    // ── Porto Marker ─────────────────────────────────────────────────────────
    const PORTO = { lng: -8.61, lat: 41.15 };
    let markerPulse = 0;

    function drawPortoMarker() {
        const p = project(PORTO.lng, PORTO.lat);
        if (!p) return;

        const s = scale;
        markerPulse += 0.04;
        const pulseR = 3 * s + Math.sin(markerPulse) * 1.5 * s;

        // Outer pulsing ring
        ctx.beginPath();
        ctx.arc(p[0], p[1], pulseR + 4 * s, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(51, 51, 51, ${0.15 + Math.sin(markerPulse) * 0.1})`;
        ctx.lineWidth = 1.2 * s;
        ctx.stroke();

        // Solid dot
        ctx.beginPath();
        ctx.arc(p[0], p[1], 3 * s, 0, Math.PI * 2);
        ctx.fillStyle = '#333333';
        ctx.fill();

        // Inner bright core
        ctx.beginPath();
        ctx.arc(p[0], p[1], 1.2 * s, 0, Math.PI * 2);
        ctx.fillStyle = '#EBE9E4';
        ctx.fill();

        // Label
        ctx.font = `${10 * s}px "Plus Jakarta Sans", sans-serif`;
        ctx.fillStyle = '#333333';
        ctx.textAlign = 'left';
        ctx.fillText('Porto, PT', p[0] + 8 * s, p[1] + 4 * s);
    }

    // ── Auto-rotation ──────────────────────────────────────────────────────────
    let autoRotate = true;
    const rotSpeed = 0.15; // degrees per frame

    function tick() {
        if (autoRotate) {
            rotLng += rotSpeed;
            if (rotLng > 360) rotLng -= 360;
        }
        render();
        requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    // ── Drag interaction ───────────────────────────────────────────────────────
    let dragging = false;
    let dragStartX, dragStartY, dragStartLng, dragStartLat;

    canvas.addEventListener('mousedown', (e) => {
        dragging = true;
        autoRotate = false;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        dragStartLng = rotLng;
        dragStartLat = rotLat;
        canvas.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
        if (!dragging) return;
        const sensitivity = 0.3;
        rotLng = dragStartLng - (e.clientX - dragStartX) * sensitivity;
        rotLat = dragStartLat + (e.clientY - dragStartY) * sensitivity;
        rotLat = Math.max(-80, Math.min(80, rotLat));
    });

    window.addEventListener('mouseup', () => {
        if (!dragging) return;
        dragging = false;
        canvas.style.cursor = 'grab';
        setTimeout(() => { autoRotate = true; }, 2000);
    });

    // Touch
    canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 1) return;
        dragging = true;
        autoRotate = false;
        dragStartX = e.touches[0].clientX;
        dragStartY = e.touches[0].clientY;
        dragStartLng = rotLng;
        dragStartLat = rotLat;
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
        if (!dragging || e.touches.length !== 1) return;
        const sensitivity = 0.3;
        rotLng = dragStartLng - (e.touches[0].clientX - dragStartX) * sensitivity;
        rotLat = dragStartLat + (e.touches[0].clientY - dragStartY) * sensitivity;
        rotLat = Math.max(-80, Math.min(80, rotLat));
    }, { passive: true });

    canvas.addEventListener('touchend', () => {
        dragging = false;
        setTimeout(() => { autoRotate = true; }, 2000);
    });

    // Scroll zoom
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 0.95 : 1.05;
        scale = Math.max(0.5, Math.min(2.5, scale * factor));
    }, { passive: false });

    canvas.style.cursor = 'grab';
}
