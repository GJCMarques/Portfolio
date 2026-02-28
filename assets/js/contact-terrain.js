document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("hero-terrain");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width, height;
    const cols = 55;
    const rows = 55;
    const spacing = 35;
    let time = 0;

    // Interação do Rato para influenciar a rotação do mapa
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    window.addEventListener('mousemove', (e) => {
        targetX = (e.clientX / window.innerWidth) * 2 - 1;
        targetY = (e.clientY / window.innerHeight) * 2 - 1;
    });

    function resize() {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.parentElement.getBoundingClientRect();
        width = rect.width;
        height = rect.height;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
    }

    window.addEventListener("resize", resize);
    resize();

    // Vamos buscar a cor do container para a stroke
    let parentColor = 'rgba(18, 18, 18, 0.7)';

    function animate() {
        requestAnimationFrame(animate);
        ctx.clearRect(0, 0, width, height);

        // Easing do target do rato para movimento fluido
        mouseX += (targetX - mouseX) * 0.03;
        mouseY += (targetY - mouseY) * 0.03;

        time += 0.008; // Velocidade da onda

        // Rotações isométricas base + influência do rato
        const rotX = 1.05 + mouseY * 0.15; // Inclinado para parecer um terreno
        const rotY = time * 0.05 + mouseX * 0.3; // Rotação contínua lenta no eixo Y

        ctx.lineWidth = 1; // Linhas mais visíveis

        // Matriz de pontos 3D calculados
        const grid = [];
        for (let z = 0; z < rows; z++) {
            grid[z] = [];
            for (let x = 0; x < cols; x++) {
                // Centrar o grid
                let px = (x - cols / 2) * spacing;
                let pz = (z - rows / 2) * spacing;

                // Múltiplas ondas sinusoidais para criar o relevo "Topográfico"
                const dist = Math.sqrt(px * px + pz * pz);
                let py = Math.sin(dist * 0.008 - time * 3) * 60; // Onda circular do centro
                py += Math.cos(px * 0.015 + time) * 40; // Onda eixo X
                py += Math.sin(pz * 0.015 - time) * 40; // Onda eixo Z

                // Adicionar uma leve distorção adicional no centro para parecer uma montanha/pico digital
                const centerDist = Math.max(0, 400 - dist);
                py -= centerDist * 0.2;

                // Aplicar Rotação Y
                const cosY = Math.cos(rotY);
                const sinY = Math.sin(rotY);
                let rx = px * cosY - pz * sinY;
                let rz = px * sinY + pz * cosY;

                // Aplicar Rotação X (Camera pitch)
                const cosX = Math.cos(rotX);
                const sinX = Math.sin(rotX);
                let ryy = py * cosX - rz * sinX;
                let rzz = py * sinX + rz * cosX;

                // Projeção em Perspectiva Simples
                const fov = 1000;
                const zDist = fov + rzz + 200; // Offset depth

                if (zDist < 0.1) continue; // Atrás da camara

                const scale = fov / zDist;

                // Offset do desenho para o centro (-yOffset para subir o globo um bocado)
                const yOffset = 0;

                // sx and sy relative to normal width/height 
                // the canvas is already scaled by dpr in ctx.scale()
                const sx = width / 2 + rx * scale;
                const sy = height / 2 + ryy * scale - yOffset;

                grid[z][x] = { sx, sy, zDist };
            }
        }

        // Função auxiliar para desenhar a linha com Depth Of Field fingido (alpha)
        function drawLine(p1, p2) {
            if (!p1 || !p2) return;
            // Fade baseado na profundidade Z
            const avgZ = (p1.zDist + p2.zDist) / 2;
            const maxZDist = 1800;
            const minZDist = 600;

            let alpha = 1.0 - (avgZ - minZDist) / (maxZDist - minZDist);
            alpha = Math.max(0.1, Math.min(1.0, alpha)) * 0.9; // Opacidade máxima 90%

            ctx.strokeStyle = parentColor;
            ctx.globalAlpha = alpha;

            ctx.beginPath();
            ctx.moveTo(p1.sx, p1.sy);
            ctx.lineTo(p2.sx, p2.sy);
            ctx.stroke();
        }

        // Desenhar Malha - Linhas Horizontais
        for (let z = 0; z < rows; z++) {
            for (let x = 0; x < cols - 1; x++) {
                drawLine(grid[z][x], grid[z][x + 1]);
            }
        }

        // Desenhar Malha - Linhas Verticais
        for (let x = 0; x < cols; x++) {
            for (let z = 0; z < rows - 1; z++) {
                drawLine(grid[z][x], grid[z + 1][x]);
            }
        }

        ctx.globalAlpha = 1.0;
    }

    animate();
});
