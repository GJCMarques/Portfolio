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
        const spacing = 1.8; // degrees between dots (fewer = faster)

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
        ctx.fillStyle = 'rgba(51, 51, 51, 0.5)';
        ctx.beginPath();

        for (const dot of landDots) {
            const p = project(dot[0], dot[1]);
            if (p) {
                ctx.moveTo(p[0] + dotR, p[1]);
                ctx.arc(p[0], p[1], dotR, 0, Math.PI * 2);
            }
        }
        ctx.fill();
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
        drawMarkers();
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

    // ── City Markers ─────────────────────────────────────────────────────────
    const CITIES = [
        // ── Principal (pulsing markers) ──
        { name: 'Porto', lng: -8.61, lat: 41.15, home: true },
        { name: 'Orléans', lng: 1.91, lat: 47.90, home: true },
        { name: 'Vilnius', lng: 25.28, lat: 54.69, home: true },
        { name: 'Tallinn', lng: 24.75, lat: 59.44, home: true },

        // ── Europa ──
        { name: 'Londres', lng: -0.13, lat: 51.51 },
        { name: 'Paris', lng: 2.35, lat: 48.86 },
        { name: 'Madrid', lng: -3.70, lat: 40.42 },
        { name: 'Berlim', lng: 13.41, lat: 52.52 },
        { name: 'Roma', lng: 12.50, lat: 41.90 },
        { name: 'Genebra', lng: 6.14, lat: 46.20 },
        { name: 'Amesterdão', lng: 4.90, lat: 52.37 },
        { name: 'Bruxelas', lng: 4.35, lat: 50.85 },
        { name: 'Viena', lng: 16.37, lat: 48.21 },
        { name: 'Praga', lng: 14.42, lat: 50.08 },
        { name: 'Varsóvia', lng: 21.01, lat: 52.23 },
        { name: 'Copenhaga', lng: 12.57, lat: 55.68 },
        { name: 'Estocolmo', lng: 18.07, lat: 59.33 },
        { name: 'Helsínquia', lng: 24.94, lat: 60.17 },
        { name: 'Oslo', lng: 10.75, lat: 59.91 },
        { name: 'Atenas', lng: 23.73, lat: 37.98 },
        { name: 'Bucareste', lng: 26.10, lat: 44.43 },
        { name: 'Moscovo', lng: 37.62, lat: 55.76 },
        { name: 'Kiev', lng: 30.52, lat: 50.45 },
        { name: 'Dublin', lng: -6.26, lat: 53.35 },
        { name: 'Lisboa', lng: -9.14, lat: 38.72 },

        // ── Américas ──
        { name: 'Nova York', lng: -74.01, lat: 40.71 },
        { name: 'Washington', lng: -77.04, lat: 38.91 },
        { name: 'Ottawa', lng: -75.70, lat: 45.42 },
        { name: 'Cidade México', lng: -99.13, lat: 19.43 },
        { name: 'Brasília', lng: -47.93, lat: -15.78 },
        { name: 'Buenos Aires', lng: -58.38, lat: -34.60 },
        { name: 'Lima', lng: -77.04, lat: -12.05 },
        { name: 'Bogotá', lng: -74.07, lat: 4.71 },
        { name: 'Santiago', lng: -70.67, lat: -33.45 },

        // ── Ásia & Médio Oriente ──
        { name: 'Tóquio', lng: 139.69, lat: 35.69 },
        { name: 'Pequim', lng: 116.40, lat: 39.90 },
        { name: 'Seul', lng: 126.98, lat: 37.57 },
        { name: 'Nova Deli', lng: 77.21, lat: 28.61 },
        { name: 'Dubai', lng: 55.27, lat: 25.20 },
        { name: 'Singapura', lng: 103.82, lat: 1.35 },
        { name: 'Ancara', lng: 32.87, lat: 39.93 },
        { name: 'Riade', lng: 46.68, lat: 24.69 },
        { name: 'Bangkok', lng: 100.50, lat: 13.76 },

        // ── África & Oceânia ──
        { name: 'Cairo', lng: 31.24, lat: 30.04 },
        { name: 'Nairobi', lng: 36.82, lat: -1.29 },
        { name: 'Cidade Cabo', lng: 18.42, lat: -33.93 },
        { name: 'Canberra', lng: 149.13, lat: -35.28 },
        { name: 'Wellington', lng: 174.78, lat: -41.29 },
    ];
    let markerPulse = 0;

    function drawMarkers() {
        const s = scale;
        markerPulse += 0.04;

        for (const city of CITIES) {
            const p = project(city.lng, city.lat);
            if (!p) continue;

            if (city.home) {
                // ── Porto: special pulsing marker ──
                const pulseR = 3.5 * s + Math.sin(markerPulse) * 1.5 * s;

                // Outer pulsing ring
                ctx.beginPath();
                ctx.arc(p[0], p[1], pulseR + 4 * s, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(51, 51, 51, ${0.15 + Math.sin(markerPulse) * 0.1})`;
                ctx.lineWidth = 1.2 * s;
                ctx.stroke();

                // Solid dot
                ctx.beginPath();
                ctx.arc(p[0], p[1], 3.5 * s, 0, Math.PI * 2);
                ctx.fillStyle = '#333333';
                ctx.fill();

                // Inner core
                ctx.beginPath();
                ctx.arc(p[0], p[1], 1.3 * s, 0, Math.PI * 2);
                ctx.fillStyle = '#EBE9E4';
                ctx.fill();

                // Label (bolder)
                ctx.font = `600 ${10 * s}px "Plus Jakarta Sans", sans-serif`;
                ctx.fillStyle = '#1A1A1A';
                ctx.textAlign = 'left';
                ctx.fillText(city.name, p[0] + 9 * s, p[1] + 4 * s);
            } else {
                // ── Other cities: small dot + label ──
                ctx.beginPath();
                ctx.arc(p[0], p[1], 2 * s, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(51, 51, 51, 0.6)';
                ctx.fill();

                // Label
                ctx.font = `${8 * s}px "Plus Jakarta Sans", sans-serif`;
                ctx.fillStyle = 'rgba(51, 51, 51, 0.55)';
                ctx.textAlign = 'left';
                ctx.fillText(city.name, p[0] + 6 * s, p[1] + 3 * s);
            }
        }
    }

    // ── Auto-rotation ──────────────────────────────────────────────────────────
    let autoRotate = true;
    let returningHome = false;
    const rotSpeed = 0.15;
    const HOME_LAT = 25;
    const HOME_SCALE = 1;

    let globeVisible = true;
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(([e]) => { globeVisible = e.isIntersecting; }, { threshold: 0 }).observe(canvas);
    }

    let lastTick = 0;
    function tick(now) {
        requestAnimationFrame(tick);
        if (!globeVisible) return;

        // Throttle to ~30fps when auto-rotating
        if (autoRotate && !dragging && now - lastTick < 33) return;
        lastTick = now;
        if (autoRotate) {
            rotLng += rotSpeed;
            if (rotLng > 360) rotLng -= 360;
        }
        // Smoothly lerp rotLat and scale back to defaults when returning
        if (returningHome && !dragging) {
            const latDiff = HOME_LAT - rotLat;
            const scaleDiff = HOME_SCALE - scale;
            let settled = true;

            if (Math.abs(latDiff) > 0.1) {
                rotLat += latDiff * 0.015;
                settled = false;
            } else {
                rotLat = HOME_LAT;
            }

            if (Math.abs(scaleDiff) > 0.005) {
                scale += scaleDiff * 0.03;
                settled = false;
            } else {
                scale = HOME_SCALE;
            }

            if (settled) returningHome = false;
        }
        render();
    }
    requestAnimationFrame(tick);

    // ── Drag interaction ───────────────────────────────────────────────────────
    let dragging = false;
    let dragStartX, dragStartY, dragStartLng, dragStartLat;
    let resumeTimer = null;

    function scheduleResume() {
        if (resumeTimer) clearTimeout(resumeTimer);
        resumeTimer = setTimeout(() => {
            autoRotate = true;
            returningHome = true;
        }, 2000);
    }

    canvas.addEventListener('mousedown', (e) => {
        dragging = true;
        autoRotate = false;
        returningHome = false;
        if (resumeTimer) clearTimeout(resumeTimer);
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
        scheduleResume();
    });

    // Touch
    canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 1) return;
        dragging = true;
        autoRotate = false;
        returningHome = false;
        if (resumeTimer) clearTimeout(resumeTimer);
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
        scheduleResume();
    });

    // Scroll zoom
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 0.95 : 1.05;
        scale = Math.max(0.5, Math.min(2.5, scale * factor));
    }, { passive: false });

    canvas.style.cursor = 'grab';
}
