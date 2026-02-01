const canvas = document.getElementById('colorWheel');
const ctx = canvas.getContext('2d');
const colorsDisplay = document.getElementById('colorsDisplay');
const harmonyTitle = document.getElementById('harmonyTitle');
const baseColorBadge = document.getElementById('baseColorBadge');
const manualHexInput = document.getElementById('manualHexInput');
const inputColorPreview = document.getElementById('inputColorPreview');

let currentHue = 0;
let currentHarmony = 'complementary';

const harmonyConfig = {
    complementary: { name: 'Complementares', offsets: [0, 180], type: 'line' },
    analogous: { name: 'Análogas', offsets: [-30, 0, 30], type: 'arc' },
    triadic: { name: 'Triangulação', offsets: [0, 120, 240], type: 'poly' },
    splitComplementary: { name: 'Meio-Complementares', offsets: [0, 150, 210], type: 'poly' },
    tetradic: { name: 'Retângulo', offsets: [0, 60, 180, 240], type: 'poly' },
    square: { name: 'Quadrado', offsets: [0, 90, 180, 270], type: 'poly' }
};

function drawApp() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2 - 40;
    const innerRadius = radius * 0.5;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let angle = 0; angle < 360; angle++) {
        const startAngle = (angle - 1) * Math.PI / 180;
        const endAngle = (angle + 1) * Math.PI / 180;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.fillStyle = `hsl(${angle}, 100%, 50%)`;
        ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    const config = harmonyConfig[currentHarmony];
    const points = config.offsets.map(offset => {
        const angle = (currentHue + offset) * Math.PI / 180;
        const dist = radius * 0.75;
        return {
            x: centerX + dist * Math.cos(angle),
            y: centerY + dist * Math.sin(angle),
            hue: (currentHue + offset + 360) % 360
        };
    });

    ctx.beginPath();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 6;
    ctx.lineJoin = 'round';
    if (config.type === 'line') {
        ctx.moveTo(points[0].x, points[0].y);
        ctx.lineTo(points[1].x, points[1].y);
    } else {
        ctx.moveTo(points[0].x, points[0].y);
        for(let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
        if(config.type === 'poly') ctx.closePath();
    }
    ctx.stroke();

    points.forEach((p, index) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 15, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x, p.y, index === 0 ? 11 : 9, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${p.hue}, 100%, 50%)`;
        ctx.fill();
        if(index === 0) { ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.stroke(); }
    });
}

function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

function hexToHue(hex) {
    hex = hex.replace(/^#/, '');
    if(hex.length === 3) hex = hex.split('').map(s => s + s).join('');

    let r = parseInt(hex.substring(0, 2), 16) / 255;
    let g = parseInt(hex.substring(2, 4), 16) / 255;
    let b = parseInt(hex.substring(4, 6), 16) / 255;

    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h;

    if (max === min) h = 0;
    else if (max === r) h = (g - b) / (max - min) + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / (max - min) + 2;
    else if (max === b) h = (r - g) / (max - min) + 4;

    return Math.round(h * 60);
}

function updateUI(fromInput = false) {
    const config = harmonyConfig[currentHarmony];
    harmonyTitle.innerText = config.name;

    const currentHex = hslToHex(currentHue, 100, 50);

    if (!fromInput) {
        manualHexInput.value = currentHex;
    }
    inputColorPreview.style.backgroundColor = '#' + currentHex;

    document.querySelectorAll('.harmony-btn').forEach(btn => {
        btn.className = `harmony-btn p-3 text-sm border-2 rounded-2xl font-bold transition-all ${btn.dataset.type === currentHarmony ? 'bg-slate-900 text-white border-slate-900' : 'bg-transparent text-slate-600 border-slate-100 hover:border-indigo-200'}`;
    });

    baseColorBadge.style.backgroundColor = '#' + currentHex;

    colorsDisplay.innerHTML = '';
    config.offsets.forEach((offset, idx) => {
        const h = (currentHue + offset + 360) % 360;
        const hex = '#' + hslToHex(h, 90, 50);

        const card = document.createElement('div');
        card.className = 'color-card group bg-slate-50 p-4 rounded-3xl border border-slate-100 flex items-center gap-4 hover:bg-white hover:shadow-md cursor-pointer';
        card.onclick = () => copyToClipboard(hex);
        card.innerHTML = `
            <div class="w-14 h-14 rounded-2xl shadow-inner flex-shrink-0" style="background-color: ${hex}"></div>
            <div class="flex-grow">
                <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">${idx === 0 ? 'Cor Base' : 'Harmônica'}</div>
                <div class="text-lg font-mono font-black text-slate-700">${hex}</div>
            </div>
        `;
        colorsDisplay.appendChild(card);
    });

    drawApp();
}

manualHexInput.addEventListener('input', (e) => {
    let val = e.target.value.replace(/[^0-9A-Fa-f]/g, '');
    e.target.value = val;

    if (val.length === 3 || val.length === 6) {
        currentHue = hexToHue(val);
        updateUI(true);
    }
});

function setHarmony(type) {
    currentHarmony = type;
    updateUI();
}

function handleInput(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || e.touches?.[0]?.clientX;
    const clientY = e.clientY || e.touches?.[0]?.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const angle = Math.atan2(y - centerY, x - centerX) * 180 / Math.PI;
    currentHue = (angle + 360) % 360;
    updateUI();
}

canvas.addEventListener('mousedown', (e) => {
    handleInput(e);
    window.addEventListener('mousemove', handleInput);
});
window.addEventListener('mouseup', () => window.removeEventListener('mousemove', handleInput));
canvas.addEventListener('touchstart', (e) => { handleInput(e); e.preventDefault(); }, { passive: false });
canvas.addEventListener('touchmove', (e) => { handleInput(e); e.preventDefault(); }, { passive: false });

function copyToClipboard(text) {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);

    const toast = document.createElement('div');
    toast.className = 'fixed top-10 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-2xl text-sm shadow-2xl z-50 font-bold';
    toast.innerText = `Copiado: ${text}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 1500);
}

window.onload = updateUI;
