// Aguarda o carregamento da página e inicializa o jogo
window.addEventListener('DOMContentLoaded', () => {
    // 1. Criação e estilização do container do jogo
    const gameContainer = document.createElement('div');
    gameContainer.style.display = 'flex';
    gameContainer.style.flexDirection = 'column';
    gameContainer.style.alignItems = 'center';
    gameContainer.style.fontFamily = 'Arial, sans-serif';
    gameContainer.style.backgroundColor = '#1a1a1a';
    gameContainer.style.padding = '20px';
    gameContainer.style.borderRadius = '10px';
    gameContainer.style.color = '#fff';
    gameContainer.style.maxWidth = '840px';
    gameContainer.style.margin = '0 auto';

    // Título do Jogo
    const title = document.createElement('h2');
    title.innerText = '🎱 SIBUNDA - SINUCA';
    title.style.margin = '0 0 10px 0';
    title.style.color = '#4caf50';
    gameContainer.appendChild(title);

    // Instruções
    const instructions = document.createElement('p');
    instructions.innerText = 'Como jogar: Use o mouse para mirar, clique e arraste para trás para dar força, solte para chutar a bola branca.';
    instructions.style.margin = '0 0 15px 0';
    instructions.style.fontSize = '14px';
    instructions.style.textAlign = 'center';
    gameContainer.appendChild(instructions);

    // Tela do Jogo (Canvas)
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 400;
    canvas.style.border = '12px solid #8b5a2b'; // Moldura de madeira da mesa
    canvas.style.borderRadius = '5px';
    canvas.style.boxShadow = '0 10px 20px rgba(0,0,0,0.5)';
    gameContainer.appendChild(canvas);

    // Injeta o container no final do body (ou você pode mover para uma div específica)
    document.body.appendChild(gameContainer);

    const ctx = canvas.getContext('2d');

    // 2. Configurações de Física e Jogo
    const FRICTION = 0.985;
    const BALL_RADIUS = 12;
    let isAiming = false;
    let mouseX = 0;
    let mouseY = 0;

    // Definição das Caçapas (Buracos)
    const pockets = [
        { x: 0, y: 0 }, { x: canvas.width / 2, y: 0 }, { x: canvas.width, y: 0 },
        { x: 0, y: canvas.height }, { x: canvas.width / 2, y: canvas.height }, { x: canvas.width, y: canvas.height }
    ];

    class Ball {
        constructor(x, y, color, isWhite = false) {
            this.x = x;
            this.y = y;
            this.vx = 0;
            this.vy = 0;
            this.color = color;
            this.isWhite = isWhite;
            this.pocketed = false;
        }

        update() {
            if (this.pocketed) return;

            this.x += this.vx;
            this.y += this.vy;

            // Atrito mecânico
            this.vx *= FRICTION;
            this.vy *= FRICTION;

            // Parar a bola se estiver muito lenta
            if (Math.abs(this.vx) < 0.05) this.vx = 0;
            if (Math.abs(this.vy) < 0.05) this.vy = 0;

            // Colisão com as tabelas (paredes)
            if (this.x < BALL_RADIUS) { this.x = BALL_RADIUS; this.vx *= -1; }
            if (this.x > canvas.width - BALL_RADIUS) { this.x = canvas.width - BALL_RADIUS; this.vx *= -1; }
            if (this.y < BALL_RADIUS) { this.y = BALL_RADIUS; this.vy *= -1; }
            if (this.y > canvas.height - BALL_RADIUS) { this.y = canvas.height - BALL_RADIUS; this.vy *= -1; }

            // Verifica se caiu na caçapa
            pockets.forEach(p => {
                const dist = Math.hypot(this.x - p.x, this.y - p.y);
                if (dist < BALL_RADIUS * 1.5) {
                    this.pocketed = true;
                    if (this.isWhite) {
                        // Reposiciona a branca se cair
                        setTimeout(() => {
                            this.x = 200;
                            this.y = 200;
                            this.vx = 0;
                            this.vy = 0;
                            this.pocketed = false;
                        }, 1000);
                    }
                }
            });
        }

        draw() {
            if (this.pocketed) return;
            ctx.beginPath();
            ctx.arc(this.x, this.y, BALL_RADIUS, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.closePath();
        }
    }

    // Inicialização das bolas
    const balls = [];
    const whiteBall = new Ball(200, 200, '#ffffff', true);
    balls.push(whiteBall);

    // Montagem da pirâmide de bolas coloridas
    const colors = ['#e53935', '#d81b60', '#8e24aa', '#3949ab', '#1e88e5', '#00acc1', '#00897b', '#43a047', '#ffb300', '#f4511e'];
    let startX = 550;
    let startY = 200;
    let row = 1;
    let colIndex = 0;

    for (let i = 0; i < 15; i++) {
        const x = startX + (row * BALL_RADIUS * 1.7);
        const y = startY + (colIndex * BALL_RADIUS * 2.1) - (row * BALL_RADIUS);
        balls.push(new Ball(x, y, colors[i % colors.length]));
        
        colIndex++;
        if (colIndex >= row) {
            row++;
            colIndex = 0;
        }
    }

    // 3. Controle de Vetores e Colisão entre Bolas
    function resolveCollision(b1, b2) {
        const xDist = b2.x - b1.x;
        const yDist = b2.y - b1.y;
        const dist = Math.hypot(xDist, yDist);

        if (dist < BALL_RADIUS * 2) {
            // Evita engajamento sobreposto preso
            const overlap = (BALL_RADIUS * 2) - dist;
            const nx = xDist / dist;
            const ny = yDist / dist;

            b1.x -= nx * overlap / 2;
            b1.y -= ny * overlap / 2;
            b2.x += nx * overlap / 2;
            b2.y += ny * overlap / 2;

            // Física de colisão elástica bidimensional rápida
            const kx = b1.vx - b2.vx;
            const ky = b1.vy - b2.vy;
            const p = 2 * (nx * kx + ny * ky) / 2;

            b1.vx -= p * nx;
            b1.vy -= p * ny;
            b2.vx += p * nx;
            b2.vy += p * ny;
        }
    }

    // 4. Input de Controles (Mouse)
    canvas.addEventListener('mousedown', (e) => {
        if (whiteBall.vx === 0 && whiteBall.vy === 0) {
            isAiming = true;
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    });

    canvas.addEventListener('mouseup', (e) => {
        if (isAiming) {
            const angle = Math.atan2(whiteBall.y - mouseY, whiteBall.x - mouseX);
            const dist = Math.min(Math.hypot(whiteBall.x - mouseX, whiteBall.y - mouseY), 150);
            
            // Força baseada no tamanho do arrasto
            whiteBall.vx = Math.cos(angle) * (dist * 0.15);
            whiteBall.vy = Math.sin(angle) * (dist * 0.15);
            isAiming = false;
        }
    });

    // 5. Loop Principal do Jogo
    function gameLoop() {
        // Limpa e desenha o pano verde da mesa
        ctx.fillStyle = '#2e7d32';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Desenha as Caçapas
        pockets.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, BALL_RADIUS * 1.8, 0, Math.PI * 2);
            ctx.fillStyle = '#111';
            ctx.fill();
            ctx.closePath();
        });

        // Atualiza Física e Colisões
        for (let i = 0; i < balls.length; i++) {
            balls[i].update();
            for (let j = i + 1; j < balls.length; j++) {
                if (!balls[i].pocketed && !balls[j].pocketed) {
                    resolveCollision(balls[i], balls[j]);
                }
            }
        }

        // Desenha as Bolas
        balls.forEach(ball => ball.draw());

        // Desenha a linha de mira (Taco / Vetor de Força)
        if (isAiming) {
            ctx.beginPath();
            ctx.moveTo(whiteBall.x, whiteBall.y);
            
            // Inverte a linha para dar sensação de "puxar elástico" do taco
            const angle = Math.atan2(whiteBall.y - mouseY, whiteBall.x - mouseX);
            const dist = Math.min(Math.hypot(whiteBall.x - mouseX, whiteBall.y - mouseY), 150);
            
            const targetX = whiteBall.x + Math.cos(angle) * dist;
            const targetY = whiteBall.y + Math.sin(angle) * dist;

            ctx.lineTo(targetX, targetY);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 4;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.closePath();

            // Indicador de mira no fundo da bola
            ctx.beginPath();
            ctx.arc(whiteBall.x, whiteBall.y, BALL_RADIUS + 2, 0, Math.PI*2);
            ctx.strokeStyle = '#ffeb3b';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.closePath();
        }

        requestAnimationFrame(gameLoop);
    }

    // Inicia o Loop
    gameLoop();
});

