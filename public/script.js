

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const CONFIG = {
    orbSize: 30,
    colors: {
        core: '#FFFFFF',
        mid: '#ff0000ff',
        dark: '#6d0000ff',
        glow: '#b20707ff',
        line: '#ff0000ff'
    },
    wave: {
        amplitude: 5,
        frequency: 0.02,
        speed: 0.07
    }
};

const WINDOW_ID = Math.random().toString(36).substr(2, 9);
let animationId;
let globalTime = 0;

const state = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2
};

const channel = new BroadcastChannel('electro-volt-network');
let peers = {};

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    state.x = canvas.width / 2;
    state.y = canvas.height / 2;
}
window.addEventListener('resize', resize);
resize();

function broadcast() {
    channel.postMessage({
        id: WINDOW_ID,
        sx: window.screenX,
        sy: window.screenY,
        cx: state.x,
        cy: state.y,
        timestamp: Date.now()
    });
    requestAnimationFrame(broadcast);
}


channel.onmessage = (e) => {
    const data = e.data;
    if (data.id !== WINDOW_ID) {
        peers[data.id] = data;
    }
};

function drawOrb(x, y, radius) {
    ctx.save();

    ctx.shadowBlur = 40;
    ctx.shadowColor = CONFIG.colors.glow;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = CONFIG.colors.dark;
    ctx.fill();

    ctx.shadowBlur = 0;

    const gradient = ctx.createRadialGradient(
        x - radius / 3, y - radius / 3, radius * 0.1,
        x, y, radius
    );

    gradient.addColorStop(0, CONFIG.colors.core);
    gradient.addColorStop(0.2, CONFIG.colors.mid);
    gradient.addColorStop(0.8, CONFIG.colors.dark);
    gradient.addColorStop(1, '#000000');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(x - radius / 2.5, y - radius / 2.5, radius / 3, radius / 5, Math.PI / 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.fill();

    ctx.restore();
}

function drawSineConnection(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    ctx.save();
    ctx.translate(x1, y1);
    ctx.rotate(angle);

    ctx.beginPath();
    ctx.shadowBlur = 20;
    ctx.shadowColor = CONFIG.colors.line;
    ctx.strokeStyle = CONFIG.colors.line;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    ctx.moveTo(0, 0);
    const step = 2;
    for (let i = 0; i <= distance; i += step) {
        const y = Math.sin(i * CONFIG.wave.frequency - globalTime * CONFIG.wave.speed) * CONFIG.wave.amplitude;
        ctx.lineTo(i, y);
    }

    ctx.stroke();
    ctx.restore();
}

function render() {
    ctx.fillStyle = 'rgba(5, 5, 5, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    globalTime += 1;
    const now = Date.now();

    for (const id in peers) {
        const p = peers[id];
        if (now - p.timestamp > 1000) {
            delete peers[id];
            continue;
        }
        const peerRelX = (p.sx + p.cx) - window.screenX;
        const peerRelY = (p.sy + p.cy) - window.screenY;

        drawSineConnection(state.x, state.y, peerRelX, peerRelY);
        drawOrb(peerRelX, peerRelY, CONFIG.orbSize);
    }

    drawOrb(state.x, state.y, CONFIG.orbSize);

    animationId = requestAnimationFrame(render);
}

broadcast();
render();