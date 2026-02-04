const canvas = document.getElementById('colorWheel');
const ctx = canvas.getContext('2d');
const colorsDisplay = document.getElementById('colorsDisplay');
const harmonyTitle = document.getElementById('harmonyTitle');
const baseColorBadge = document.getElementById('baseColorBadge');
const manualHexInput = document.getElementById('manualHexInput');
const inputColorPreview = document.getElementById('inputColorPreview');
const themeToggle = document.getElementById('themeToggle');
const lightnessSlider = document.getElementById('lightnessSlider');
const lightnessValue = document.getElementById('lightnessValue');

let currentHue = 0;
let currentHarmony = 'complementary';
let currentLightness = 50;
let themeTokens = {
    canvasCenter: '#ffffff',
    canvasLine: '#0f172a',
    canvasDot: '#ffffff',
    toastBg: '#0f172a',
    toastText: '#ffffff'
};

const harmonyConfig = {
    complementary: { name: 'Complementares', offsets: [0, 180], type: 'line' },
    analogous: { name: 'Análogas', offsets: [-30, 0, 30], type: 'arc' },
    triadic: { name: 'Triangulação', offsets: [0, 120, 240], type: 'poly' },
    splitComplementary: { name: 'Meio-Complementares', offsets: [0, 150, 210], type: 'poly' },
    tetradic: { name: 'Retângulo', offsets: [0, 60, 180, 240], type: 'poly' },
    square: { name: 'Quadrado', offsets: [0, 90, 180, 270], type: 'poly' }
};

const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)');

function getStoredTheme() {
    try {
        return localStorage.getItem('ui-theme');
    } catch (err) {
        return null;
    }
}

function setStoredTheme(theme) {
    try {
        localStorage.setItem('ui-theme', theme);
    } catch (err) {
        // Ignore storage errors (private mode or blocked storage).
    }
}

function readThemeTokens() {
    const styles = getComputedStyle(document.documentElement);
    const read = (token, fallback) => {
        const value = styles.getPropertyValue(token).trim();
        return value || fallback;
    };

    themeTokens = {
        canvasCenter: read('--canvas-center', '#ffffff'),
        canvasLine: read('--canvas-line', '#0f172a'),
        canvasDot: read('--canvas-dot', '#ffffff'),
        toastBg: read('--toast-bg', '#0f172a'),
        toastText: read('--toast-text', '#ffffff')
    };
}

function applyTheme(theme, persist = false) {
    const root = document.documentElement;
    const isDark = theme === 'dark';

    if (isDark) {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }

    root.dataset.theme = theme;

    if (themeToggle) {
        themeToggle.setAttribute('aria-pressed', String(isDark));
        themeToggle.setAttribute('title', isDark ? 'Alternar para tema claro' : 'Alternar para tema escuro');
    }

    if (persist) {
        setStoredTheme(theme);
    }

    readThemeTokens();
    drawApp();
}

const storedTheme = getStoredTheme();
const initialTheme = storedTheme || (prefersDark?.matches ? 'dark' : 'light');
applyTheme(initialTheme, Boolean(storedTheme));

themeToggle?.addEventListener('click', () => {
    const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme, true);
});

prefersDark?.addEventListener('change', (event) => {
    if (!getStoredTheme()) {
        applyTheme(event.matches ? 'dark' : 'light');
    }
});

function drawApp() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2 - 40;
    const innerRadius = radius * 0.5;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let angle = 0; angle < 360; angle += 1) {
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
    ctx.fillStyle = themeTokens.canvasCenter;
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
    ctx.strokeStyle = themeTokens.canvasLine;
    ctx.lineWidth = 6;
    ctx.lineJoin = 'round';
    if (config.type === 'line') {
        ctx.moveTo(points[0].x, points[0].y);
        ctx.lineTo(points[1].x, points[1].y);
    } else {
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i += 1) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        if (config.type === 'poly') ctx.closePath();
    }
    ctx.stroke();

    points.forEach((p, index) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 15, 0, Math.PI * 2);
        ctx.fillStyle = themeTokens.canvasDot;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x, p.y, index === 0 ? 11 : 9, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${p.hue}, 100%, ${currentLightness}%)`;
        ctx.fill();
        if (index === 0) {
            ctx.strokeStyle = themeTokens.canvasLine;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    });
}

function hslToHex(h, s, l) {
    const lValue = l / 100;
    const a = (s * Math.min(lValue, 1 - lValue)) / 100;
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = lValue - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

function hexToHue(hex) {
    const sanitized = hex.replace(/^#/, '');
    const normalized = sanitized.length === 3 ? sanitized.split('').map(s => s + s).join('') : sanitized;

    const r = parseInt(normalized.substring(0, 2), 16) / 255;
    const g = parseInt(normalized.substring(2, 4), 16) / 255;
    const b = parseInt(normalized.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h;

    if (max === min) {
        h = 0;
    } else if (max === r) {
        h = (g - b) / (max - min) + (g < b ? 6 : 0);
    } else if (max === g) {
        h = (b - r) / (max - min) + 2;
    } else {
        h = (r - g) / (max - min) + 4;
    }

    return Math.round(h * 60);
}

function updateUI(fromInput = false) {
    const config = harmonyConfig[currentHarmony];
    harmonyTitle.innerText = config.name;
    const currentHex = hslToHex(currentHue, 100, currentLightness);

    if (!fromInput) {
        manualHexInput.value = currentHex;
    }
    inputColorPreview.style.backgroundColor = `#${currentHex}`;
    baseColorBadge.style.backgroundColor = `#${currentHex}`;

    document.querySelectorAll('.harmony-btn').forEach(btn => {
        btn.classList.toggle('is-active', btn.dataset.type === currentHarmony);
    });

    colorsDisplay.innerHTML = '';
    config.offsets.forEach((offset, idx) => {
        const h = (currentHue + offset + 360) % 360;
        const hexWithoutHash = hslToHex(h, 90, currentLightness);
        const hex = `#${hexWithoutHash}`;

        const card = document.createElement('div');
        card.className = 'color-card';
        card.onclick = () => copyToClipboard(hexWithoutHash);
        card.innerHTML = `
            <div class="color-card__swatch" style="background-color: ${hex}"></div>
            <div class="color-card__meta">
                <div class="color-card__label">${idx === 0 ? 'Cor Base' : 'Harmônica'}</div>
                <div class="color-card__value">${hex}</div>
            </div>
        `;
        colorsDisplay.appendChild(card);
    });

    drawApp();
}

manualHexInput.addEventListener('input', (event) => {
    const inputValue = event.target.value.replace(/[^0-9A-Fa-f]/g, '');
    event.target.value = inputValue;

    if (inputValue.length === 3 || inputValue.length === 6) {
        currentHue = hexToHue(inputValue);
        updateUI(true);
    }
});

lightnessSlider.addEventListener('input', (event) => {
    currentLightness = parseInt(event.target.value);
    lightnessValue.textContent = `${currentLightness}%`;
    updateUI();
});

function setHarmony(type) {
    currentHarmony = type;
    updateUI();
}

function handleInput(event) {
    const rect = canvas.getBoundingClientRect();
    const clientX = event.clientX || event.touches?.[0]?.clientX;
    const clientY = event.clientY || event.touches?.[0]?.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const angle = Math.atan2(y - centerY, x - centerX) * 180 / Math.PI;
    currentHue = (angle + 360) % 360;
    updateUI();
}

canvas.addEventListener('mousedown', (event) => {
    handleInput(event);
    window.addEventListener('mousemove', handleInput);
});
window.addEventListener('mouseup', () => window.removeEventListener('mousemove', handleInput));
canvas.addEventListener('touchstart', (event) => {
    handleInput(event);
    event.preventDefault();
}, { passive: false });
canvas.addEventListener('touchmove', (event) => {
    handleInput(event);
    event.preventDefault();
}, { passive: false });

function copyToClipboard(text) {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);

    const toast = document.createElement('div');
    toast.className = 'fixed top-10 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-2xl text-sm shadow-2xl z-50 font-bold';
    toast.style.backgroundColor = themeTokens.toastBg;
    toast.style.color = themeTokens.toastText;
    toast.innerText = `Copiado: ${text}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 1500);
}

window.onload = updateUI;
