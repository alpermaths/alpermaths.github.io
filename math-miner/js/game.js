// --- 1. GLOBAL DEĞİŞKENLER VE YAPILANDIRMA ---
const WIDTH = 1366, HEIGHT = 768, ORIGIN_X = WIDTH / 2, SKY_HEIGHT = 180, ORIGIN_Y = SKY_HEIGHT - 50, MIN_ROPE = 70;

// Konular ve Müfredat
const curriculum = {
    "5. SINIF": ["Doğal Sayılar", "Kesirler", "Ondalık Gösterim", "Yüzdeler"],
    "6. SINIF": ["Çarpanlar ve Katlar", "Tam Sayılar", "Kesirlerle İşlemler", "Ondalık Gösterim"],
    "7. SINIF": ["Tam Sayılar", "Rasyonel Sayılar", "Cebirsel İfadeler", "Denklemler", "Yüzdeler"],
    "8. SINIF": ["Çarpanlar ve Katlar", "Üslü İfadeler", "Kareköklü İfadeler", "Olasılık"]
};

// Oyun Durumu
let currentSelection = { className: null, topicName: null, difficulty: 2 };
let gameState = 'START';
let score = 0;
let selectedDifficulty = 2;
let time = 60;
let timeInterval;
let minerState = 'IDLE';
let playerName = "Öğrenci";
let askedQuestionsHash = new Set();

// Fizik ve Kanca Değişkenleri
let swingSpeed = 0.015, SHOOT_SPEED = 20, PULL_FACTOR_ROCK = 40, PULL_FACTOR_GOLD = 70;
let hook = { x: ORIGIN_X, y: ORIGIN_Y + MIN_ROPE, angle: 0, length: MIN_ROPE, state: 'SWINGING', swingDir: 1, grabbedItem: null };
let items = [], groundLayers = [];
let animationFrameId;

// Soru Zamanlayıcıları
let questionTimerInterval, questionTime = 30, currentQuestionMaxTime = 30;

// DOM Elementleri
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const timerBadge = document.getElementById('timer-badge');
const mathModal = document.getElementById('math-modal');
const questionEl = document.getElementById('math-question');
const optionsContainer = document.getElementById('options-container');
const feedbackEl = document.getElementById('feedback');
const qTimerFill = document.getElementById('question-timer-fill');
const qTimerText = document.getElementById('question-timer-text');
const nameInput = document.getElementById('player-name-input');
const scoresList = document.getElementById('scores-list');
const currentInfoLabel = document.getElementById('current-info-label');
const currentTopicLabel = document.getElementById('current-topic-label');

// --- 2. YARDIMCI FONKSİYONLAR (SKOR, SES, EKRAN) ---

// Skor Fonksiyonları (En üstte tanımlı olması için buraya alındı)
function loadScores() {
    try {
        const data = localStorage.getItem('cebirAvcisiScores5');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.warn("Skor yüklenemedi:", e);
        return [];
    }
}

function saveScoreInDB(name, score) {
    try {
        let scores = loadScores();
        scores.push({ name: name, score: score });
        scores.sort((a, b) => b.score - a.score);
        scores = scores.slice(0, 5);
        localStorage.setItem('cebirAvcisiScores5', JSON.stringify(scores));
    } catch (e) {
        console.warn("Skor kaydedilemedi (Gizli mod veya kısıtlı tarayıcı):", e);
    }
}

function displayLeaderboard() {
    const scores = loadScores();
    scoresList.innerHTML = scores.length
        ? scores.map(s => `<div class="score-row"><span>${s.name}</span><span>${s.score} ₺</span></div>`).join('')
        : '<div style="color:#777; text-align:center;">Henüz skor yok</div>';
}

// Ses Sistemi
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx;
function initAudio() { if (!audioCtx) audioCtx = new AudioCtx(); if (audioCtx.state === 'suspended') audioCtx.resume(); }
function unlockAudioContext() { if (!audioCtx) initAudio(); if (audioCtx && audioCtx.state === 'suspended') { audioCtx.resume().then(() => { document.removeEventListener('touchstart', unlockAudioContext); document.removeEventListener('click', unlockAudioContext); }); } }
document.addEventListener('touchstart', unlockAudioContext, { passive: true });
document.addEventListener('click', unlockAudioContext);

const playSound = (type) => {
    if (!audioCtx || audioCtx.state !== 'running') return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    if (type === 'shoot') { osc.type = 'triangle'; osc.frequency.setValueAtTime(600, now); osc.frequency.exponentialRampToValueAtTime(100, now + 0.3); gain.gain.setValueAtTime(0.3, now); gain.gain.linearRampToValueAtTime(0, now + 0.3); osc.start(now); osc.stop(now + 0.3); }
    else if (type === 'hit') { osc.type = 'square'; osc.frequency.setValueAtTime(200, now); gain.gain.setValueAtTime(0.2, now); gain.gain.linearRampToValueAtTime(0, now + 0.1); osc.start(now); osc.stop(now + 0.1); }
    else if (type === 'boom') { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(100, now); osc.frequency.exponentialRampToValueAtTime(10, now + 0.5); gain.gain.setValueAtTime(0.5, now); gain.gain.linearRampToValueAtTime(0, now + 0.5); osc.start(now); osc.stop(now + 0.5); }
    else if (type === 'correct') { osc.type = 'sine'; osc.frequency.setValueAtTime(600, now); osc.frequency.setValueAtTime(800, now + 0.1); gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.3); osc.start(now); osc.stop(now + 0.3); }
    else if (type === 'wrong') { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, now); osc.frequency.linearRampToValueAtTime(100, now + 0.3); gain.gain.setValueAtTime(0.2, now); gain.gain.linearRampToValueAtTime(0, now + 0.3); osc.start(now); osc.stop(now + 0.3); }
    else if (type === 'bag') { osc.type = 'triangle'; osc.frequency.setValueAtTime(400, now); osc.frequency.linearRampToValueAtTime(800, now + 0.1); osc.frequency.linearRampToValueAtTime(1200, now + 0.2); gain.gain.setValueAtTime(0.2, now); gain.gain.linearRampToValueAtTime(0, now + 0.3); osc.start(now); osc.stop(now + 0.3); }
};

// Ekran Yönetimi
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(el => el.style.display = 'none');
    const el = document.getElementById(screenId);
    if (el) el.style.display = 'flex';
}

function resizeGame() {
    const container = document.getElementById('game-container');
    const targetW = 1366, targetH = 768;
    const winW = window.innerWidth, winH = window.innerHeight;
    const scale = Math.min(winW / targetW, winH / targetH) * 0.98;
    container.style.transform = `scale(${scale})`;
}
window.addEventListener('resize', resizeGame);
window.addEventListener('load', () => { resizeGame(); setTimeout(resizeGame, 500); displayLeaderboard(); });

// --- 3. OYUN NESNELERİ (SINIFLAR) ---
class Item {
    constructor(type, x, y) {
        this.type = type; this.x = x; this.y = y; this.active = true;
        this.rot = Math.random() * Math.PI;
        this.weight = 'medium'; this.value = 0; this.speed = 5;

        if (type === 'gold_huge') { this.radius = 70; this.value = 500; this.speed = PULL_FACTOR_GOLD / 70; this.color = '#FFD700'; }
        else if (type === 'gold_med') { this.radius = 45; this.value = 250; this.speed = PULL_FACTOR_GOLD / 45; this.color = '#FFD700'; }
        else if (type === 'gold_small') { this.radius = 25; this.value = 100; this.speed = PULL_FACTOR_GOLD / 25; this.color = '#FFD700'; }
        else if (type === 'rock') { this.radius = 30 + Math.random() * 40; this.value = 25; this.speed = PULL_FACTOR_ROCK / this.radius; this.color = '#7f8c8d'; }
        else if (type === 'diamond') { this.radius = 15; this.value = 800; this.speed = 12; this.color = '#00FFFF'; }
        else if (type === 'ruby') { this.radius = 15; this.value = 900; this.speed = 12; this.color = '#E91E63'; }
        else if (type === 'emerald') { this.radius = 15; this.value = 1000; this.speed = 12; this.color = '#2ECC71'; }
        else if (type === 'tnt') { this.radius = 40; this.value = -350; this.speed = 9; }
        else if (type === 'mouse') { this.radius = 25; this.value = 5; this.speed = 2; this.dir = Math.random() > 0.5 ? 1 : -1; }
        else if (type === 'bag') { this.radius = 30; this.value = 0; this.speed = 8; }
        else if (type === 'skull') { this.radius = 30; this.value = 0; this.speed = 2; }
        else if (type === 'bone') { this.radius = 25; this.value = 0; this.speed = 5; }

        this.poly = [];
        if (type.includes('gold') || type === 'rock') {
            const steps = 8;
            for (let i = 0; i < steps; i++) {
                let ang = (Math.PI * 2 / steps) * i;
                let r = this.radius * (0.85 + Math.random() * 0.3);
                this.poly.push({ x: Math.cos(ang) * r, y: Math.sin(ang) * r });
            }
        }
    }

    update() {
        if (this.type === 'mouse' && this.active) {
            let nextX = this.x + this.speed * this.dir;
            let hitObstacle = false;
            if (nextX < 60 || nextX > WIDTH - 60) { this.dir *= -1; hitObstacle = true; }
            else {
                for (let other of items) {
                    if (other !== this && other.active && ['rock', 'gold_huge', 'gold_med', 'tnt'].includes(other.type)) {
                        let dx = nextX - other.x, dy = this.y - other.y;
                        if (Math.sqrt(dx * dx + dy * dy) < this.radius + other.radius + 5) { this.dir *= -1; hitObstacle = true; break; }
                    }
                }
            }
            if (!hitObstacle) this.x += this.speed * this.dir;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        if (this.type.includes('gold')) {
            ctx.fillStyle = this.color; ctx.beginPath();
            this.poly.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
            ctx.closePath(); ctx.fill();
            ctx.strokeStyle = '#F39C12'; ctx.lineWidth = 3; ctx.stroke();
            ctx.fillStyle = 'white'; ctx.globalAlpha = 0.3; ctx.beginPath(); ctx.arc(-10, -10, 10, 0, Math.PI * 2); ctx.fill();
        } else if (this.type === 'rock') {
            ctx.fillStyle = '#7f8c8d'; ctx.beginPath();
            this.poly.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
            ctx.fill(); ctx.strokeStyle = '#555'; ctx.lineWidth = 3; ctx.stroke();
        } else if (['diamond', 'ruby', 'emerald'].includes(this.type)) {
            ctx.fillStyle = this.color; ctx.beginPath(); ctx.moveTo(0, -this.radius); ctx.lineTo(this.radius, -this.radius / 3); ctx.lineTo(0, this.radius); ctx.lineTo(-this.radius, -this.radius / 3); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.stroke();
            ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.moveTo(0, -this.radius); ctx.lineTo(5, -this.radius / 3); ctx.lineTo(0, 0); ctx.lineTo(-5, -this.radius / 3); ctx.fill();
        } else if (this.type === 'tnt') {
            ctx.fillStyle = '#c0392b'; ctx.fillRect(-15, -25, 10, 50); ctx.fillRect(5, -25, 10, 50);
            ctx.fillStyle = '#e74c3c'; ctx.fillRect(-5, -25, 10, 50);
            ctx.fillStyle = '#333'; ctx.fillRect(-16, -10, 32, 10);
            ctx.fillStyle = 'white'; ctx.font = 'bold 12px Arial'; ctx.fillText("TNT", -12, 0);
        } else if (this.type === 'bag') {
            ctx.fillStyle = '#8E24AA'; ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#FFD700'; ctx.font = 'bold 30px Arial'; ctx.fillText('?', -8, 10);
        } else if (this.type === 'skull') {
            ctx.rotate(this.rot); ctx.fillStyle = '#CFD8DC'; ctx.beginPath(); ctx.arc(0, -5, 20, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(-15, 5, 30, 20);
            ctx.fillStyle = '#263238'; ctx.beginPath(); ctx.arc(-8, -5, 6, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(8, -5, 6, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.moveTo(0, 5); ctx.lineTo(-4, 12); ctx.lineTo(4, 12); ctx.fill();
        } else if (this.type === 'bone') {
            ctx.rotate(this.rot); ctx.fillStyle = '#EFEBE9'; ctx.fillRect(-20, -5, 40, 10);
            ctx.beginPath(); ctx.arc(-20, -8, 8, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(-20, 8, 8, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(20, -8, 8, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(20, 8, 8, 0, Math.PI * 2); ctx.fill();
        } else if (this.type === 'mouse') {
            ctx.scale(this.dir, 1); ctx.fillStyle = '#7f8c8d'; ctx.beginPath(); ctx.ellipse(0, 0, 20, 14, 0, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#FFAB91'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-20, 0); ctx.quadraticCurveTo(-30, -5, -35, 5); ctx.stroke();
            ctx.fillStyle = '#7f8c8d'; ctx.beginPath(); ctx.arc(12, -10, 8, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#FFAB91'; ctx.beginPath(); ctx.arc(12, -10, 4, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'black'; ctx.beginPath(); ctx.arc(14, -2, 2, 0, Math.PI * 2); ctx.fill();
            let legOffset = Math.sin(Date.now() / 50) * 3; ctx.fillStyle = '#7f8c8d'; ctx.beginPath(); ctx.arc(-10 + legOffset, 12, 3, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(10 - legOffset, 12, 3, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    }
}

// --- 4. MATEMATİK SORU MOTORU ---
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const generateWrongOptions = (correct, isInt = true) => {
    let opts = new Set([correct.toString()]);
    let range = Math.max(5, Math.abs(parseFloat(correct)) * 0.5);
    while (opts.size < 3) {
        let val;
        if (isInt) val = parseInt(correct) + rand(-range, range);
        else val = (parseFloat(correct) + (Math.random() * range - range / 2)).toFixed(2);
        if (val != correct) opts.add(val.toString());
    }
    return Array.from(opts).sort(() => Math.random() - 0.5);
};

function getGeneratorFunction(cls, top) {
    // 5. SINIF
    if (cls === "5. SINIF") {
        if (top === "Doğal Sayılar") return (d) => {
            let max = d === 1 ? 100 : d === 2 ? 1000 : 10000;
            let n1 = rand(10, max), n2 = rand(10, max);
            let op = randChoice(['+', '-']);
            if (op === '-' && n1 < n2) [n1, n2] = [n2, n1];
            return { q: `${n1} ${op} ${n2} = ?`, a: eval(`${n1}${op}${n2}`), opts: generateWrongOptions(eval(`${n1}${op}${n2}`)) };
        };
        if (top === "Kesirler") return (d) => {
            let payda = d === 1 ? rand(2, 10) : rand(10, 20);
            let p1 = rand(1, payda - 1), p2 = rand(1, payda - 1);
            let res = p1 + p2;
            return { q: `${p1}/${payda} + ${p2}/${payda} = ?`, a: `${res}/${payda}`, opts: [`${res - 1}/${payda}`, `${res + 1}/${payda}`, `${res}/${payda + 1}`].sort(() => Math.random() - 0.5) };
        };
        if (top === "Ondalık Gösterim") return (d) => {
            let n = (Math.random() * (d * 10)).toFixed(1);
            return { q: `${n} sayısının okunuşu?`, a: n.replace('.', ','), opts: [n.replace('.', ''), (parseFloat(n) + 0.1).toFixed(1).replace('.', ','), (parseFloat(n) - 0.1).toFixed(1).replace('.', ',')].sort(() => Math.random() - 0.5) };
        };
        if (top === "Yüzdeler") return (d) => {
            let n = rand(1, d * 2) * 5;
            return { q: `${n}/100 kesrinin yüzde sembolü ile gösterimi?`, a: `%${n}`, opts: [`%${n + 10}`, `%${n - 5}`, `%${n * 2}`].sort(() => Math.random() - 0.5) };
        };
    }

    // 6. SINIF
    if (cls === "6. SINIF") {
        if (top === "Çarpanlar ve Katlar") return (d) => {
            let n = rand(2, d * 5);
            let k = rand(2, 5);
            return { q: `${n} sayısının ${k} katı kaçtır?`, a: n * k, opts: generateWrongOptions(n * k) };
        };
        if (top === "Tam Sayılar") return (d) => {
            let n1 = rand(-10 * d, 10 * d), n2 = rand(-10 * d, 10 * d);
            let ans = n1 > n2 ? ">" : (n1 < n2 ? "<" : "=");
            return { q: `${n1} ... ${n2} (Boşluğa ne gelir?)`, a: ans, opts: [">", "<", "="].sort(() => Math.random() - 0.5) };
        };
        if (top === "Kesirlerle İşlemler") return (d) => {
            let a = rand(1, 5), b = rand(1, 5);
            return { q: `(${a}/2) * (${b}/3) işleminin sonucu?`, a: `${a * b}/6`, opts: [`${a + b}/6`, `${a * b}/5`, `${a}/6`].sort(() => Math.random() - 0.5) };
        };
        if (top === "Ondalık Gösterim") return (d) => {
            let n = rand(1, 10), k = rand(1, 10);
            return { q: `${n},${k} sayısının 10 ile çarpımı?`, a: `${n * 10 + k}`, opts: [`${n},${k}0`, `${n}${k}0`, `${n},0${k}`].sort(() => Math.random() - 0.5) };
        };
    }

    // 7. SINIF
    if (cls === "7. SINIF") {
        if (top === "Tam Sayılar") return (d) => {
            let n1 = rand(-10 * d, 10 * d), n2 = rand(-10 * d, 10 * d);
            let op = randChoice(['+', '-', '*']);
            if (op === '*') { n1 = rand(-5 * d, 5 * d); n2 = rand(-5, 5); }
            let res = op === '+' ? n1 + n2 : op === '-' ? n1 - n2 : n1 * n2;
            return { q: `(${n1}) ${op} (${n2}) = ?`, a: res, opts: generateWrongOptions(res) };
        };
        if (top === "Cebirsel İfadeler") return (d) => {
            let x = rand(2, 5 * d);
            return { q: `x = ${x} ise, 3x - 5 kaçtır?`, a: 3 * x - 5, opts: generateWrongOptions(3 * x - 5) };
        };
        if (top === "Denklemler") return (d) => {
            let x = rand(1, 10);
            let b = rand(1, 20);
            return { q: `x + ${b} = ${x + b} ise x kaçtır?`, a: x, opts: generateWrongOptions(x) };
        };
        if (top === "Yüzdeler") return (d) => {
            let val = rand(1, 10) * 10;
            let perc = d === 1 ? 10 : d === 2 ? 20 : 25;
            return { q: `${val} sayısının %${perc}'si kaçtır?`, a: (val * perc) / 100, opts: generateWrongOptions((val * perc) / 100) };
        };
    }

    // 8. SINIF
    if (cls === "8. SINIF") {
        if (top === "Çarpanlar ve Katlar") return (d) => {
            let primes = [2, 3, 5, 7, 11];
            let p = primes[rand(0, d)];
            return { q: `${p} ile aralarında asal olan sayı hangisidir?`, a: p + 1, opts: [p * 2, p * 3, p * 5].sort(() => Math.random() - 0.5) };
        };
        if (top === "Üslü İfadeler") return (d) => {
            let base = rand(2, 3 + d);
            let exp = rand(2, 3);
            return { q: `${base} üssü ${exp} kaçtır?`, a: Math.pow(base, exp), opts: generateWrongOptions(Math.pow(base, exp)) };
        };
        if (top === "Kareköklü İfadeler") return (d) => {
            let n = rand(2, 10 + d * 2);
            return { q: `√${n * n} işleminin sonucu?`, a: n, opts: generateWrongOptions(n) };
        };
        if (top === "Olasılık") return (d) => {
            return { q: "Bir zar atıldığında çift gelme olasılığı?", a: "1/2", opts: ["1/6", "1/3", "2/3"].sort(() => Math.random() - 0.5) };
        };
    }

    // Fallback
    let n1 = rand(5, 50), n2 = rand(5, 50);
    return { q: `${n1} + ${n2} = ?`, a: n1 + n2, opts: generateWrongOptions(n1 + n2) };
}

function generateMath() {
    const cls = currentSelection.className;
    const top = currentSelection.topicName;
    const diff = currentSelection.difficulty;

    let qFunc = getGeneratorFunction(cls, top);
    let data = { q: "Hata", a: "0", opts: ["0", "1", "2"] };

    for (let i = 0; i < 5; i++) {
        data = qFunc(diff);
        let hash = data.q + data.a;
        if (!askedQuestionsHash.has(hash)) {
            askedQuestionsHash.add(hash);
            break;
        }
    }
    return data;
}

// --- 5. OYUN MANTIĞI VE DÖNGÜLER ---
function generateGroundLayers() {
    groundLayers = [];
    const depths = [0, 160, 340, 520];
    const colors = ['#795548', '#5D4037', '#4E342E', '#212121'];
    for (let i = 0; i < depths.length; i++) {
        let points = [];
        for (let x = 0; x <= WIDTH; x += 60) {
            points.push({ x: x, y: SKY_HEIGHT + depths[i] + Math.random() * 30 - 15 });
        }
        groundLayers.push({ points: points, color: colors[i] });
    }
}

function drawBackground(ctx) {
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, WIDTH, SKY_HEIGHT);
    for (let i = 0; i < groundLayers.length; i++) {
        let layer = groundLayers[i];
        ctx.fillStyle = layer.color;
        ctx.beginPath();
        let pts = layer.points;
        ctx.moveTo(0, pts[0].y);
        for (let j = 0; j < pts.length - 1; j++) {
            let xc = (pts[j].x + pts[j + 1].x) / 2;
            let yc = (pts[j].y + pts[j + 1].y) / 2;
            ctx.quadraticCurveTo(pts[j].x, pts[j].y, xc, yc);
        }
        ctx.lineTo(WIDTH, pts[pts.length - 1].y);
        ctx.lineTo(WIDTH, HEIGHT);
        ctx.lineTo(0, HEIGHT);
        ctx.fill();
    }
}

function initLevel() {
    items = [];
    generateGroundLayers();

    if (selectedDifficulty === 1) { // KOLAY
        swingSpeed = 0.008;
        spawnMany('gold_huge', 4); spawnMany('gold_med', 5); spawnMany('gold_small', 6);
        spawnMany('bag', 4); spawnMany('diamond', 3); spawnMany('rock', 2);
        spawnMany('tnt', 1); spawnMany('mouse', 1);
    } else if (selectedDifficulty === 2) { // ORTA
        swingSpeed = 0.014;
        spawnMany('gold_huge', 3); spawnMany('gold_med', 4); spawnMany('gold_small', 5);
        spawnMany('bag', 3); spawnMany('diamond', 2); spawnMany('rock', 6);
        spawnMany('tnt', 3); spawnMany('mouse', 4); spawnMany('bone', 3);
    } else { // ZOR
        swingSpeed = 0.022;
        spawnMany('gold_huge', 2); spawnMany('gold_med', 3); spawnMany('gold_small', 4);
        spawnMany('bag', 2); spawnMany('diamond', 1); spawnMany('rock', 10);
        spawnMany('tnt', 6); spawnMany('mouse', 8); spawnMany('skull', 4); spawnMany('bone', 5);
    }

    hook.x = ORIGIN_X; hook.y = ORIGIN_Y + MIN_ROPE; hook.angle = 0; hook.state = 'SWINGING'; hook.grabbedItem = null; hook.length = MIN_ROPE;
    scoreEl.innerText = score;
    time = 60;
    timerBadge.innerText = time;
    timerBadge.style.backgroundColor = '#e74c3c';

    clearInterval(timeInterval);
    timeInterval = setInterval(() => {
        if (gameState === 'PLAYING') {
            time--;
            timerBadge.innerText = time;
            if (time <= 10) timerBadge.style.transform = 'scale(1.1)';
            if (time <= 0) endLevel();
        }
    }, 1000);
}

function spawnMany(type, count) {
    let spawnedCount = 0, attempts = 0;
    const safeZoneX = ORIGIN_X, safeZoneY = ORIGIN_Y + MIN_ROPE, safeRadius = 200;
    while (spawnedCount < count && attempts < 2000) {
        let r = type.includes('huge') ? 70 : 40;
        let yMin = type.includes('gold') ? 300 : 200;
        let x = Math.random() * (WIDTH - 150) + 75;
        let y = Math.random() * (HEIGHT - 50 - yMin) + yMin;
        let distToHook = Math.sqrt(Math.pow(x - safeZoneX, 2) + Math.pow(y - safeZoneY, 2));
        if (distToHook > safeRadius && !checkOverlap(x, y, r)) {
            items.push(new Item(type, x, y));
            spawnedCount++;
        }
        attempts++;
    }
}

function checkOverlap(x, y, r) {
    for (let i of items) {
        let dx = x - i.x, dy = y - i.y;
        if (Math.sqrt(dx * dx + dy * dy) < r + i.radius + 30) return true;
    }
    return false;
}

function update() {
    if (gameState === 'PLAYING' || gameState === 'GRAB_WAIT') items.forEach(i => i.update());
    if (gameState !== 'PLAYING') return;

    if (hook.state === 'SWINGING') {
        minerState = 'IDLE';
        hook.angle += swingSpeed * hook.swingDir;
        if (hook.angle > 1.5 || hook.angle < -1.5) hook.swingDir *= -1;
        hook.x = ORIGIN_X + Math.cos(Math.PI / 2 + hook.angle) * hook.length;
        hook.y = ORIGIN_Y + Math.sin(Math.PI / 2 + hook.angle) * hook.length;
    } else if (hook.state === 'SHOOTING') {
        minerState = 'SHOOTING';
        hook.length += SHOOT_SPEED;
        hook.x = ORIGIN_X + Math.cos(Math.PI / 2 + hook.angle) * hook.length;
        hook.y = ORIGIN_Y + Math.sin(Math.PI / 2 + hook.angle) * hook.length;
        if (hook.x < 0 || hook.x > WIDTH || hook.y > HEIGHT) hook.state = 'RETRACTING';
        for (let item of items) {
            if (item.active) {
                let dist = Math.sqrt(Math.pow(hook.x - item.x, 2) + Math.pow(hook.y - item.y, 2));
                if (dist < item.radius + 15) {
                    playSound('hit');
                    hook.grabbedItem = item;
                    item.active = false;
                    if (item.type === 'tnt') {
                        playSound('boom'); hook.grabbedItem = null;
                        score -= 250; showFeedback("PATLADI! -250", "#c0392b"); scoreEl.innerText = score;
                        hook.state = 'RETRACTING'; createExplosion(item.x, item.y);
                    } else if (['bag', 'rock', 'mouse', 'skull', 'bone'].includes(item.type)) {
                        hook.state = 'PULLING';
                        if (item.type === 'bag') playSound('bag');
                        else if (item.type === 'skull' || item.type === 'bone') showFeedback("DEĞERSİZ!", "#795548");
                    } else {
                        gameState = 'GRAB_WAIT';
                        setTimeout(() => { gameState = 'MATH'; showMath(item); }, 500);
                    }
                    return;
                }
            }
        }
    } else if (hook.state === 'RETRACTING') {
        minerState = 'PULLING'; hook.length -= 15;
        hook.x = ORIGIN_X + Math.cos(Math.PI / 2 + hook.angle) * hook.length;
        hook.y = ORIGIN_Y + Math.sin(Math.PI / 2 + hook.angle) * hook.length;
        if (hook.length <= MIN_ROPE) { hook.length = MIN_ROPE; hook.state = 'SWINGING'; }
    } else if (hook.state === 'PULLING') {
        let spd = 12;
        if (hook.grabbedItem) spd = hook.grabbedItem.speed;
        minerState = (spd < 3) ? 'STRAINING' : 'PULLING';
        hook.length -= spd;
        hook.x = ORIGIN_X + Math.cos(Math.PI / 2 + hook.angle) * hook.length;
        hook.y = ORIGIN_Y + Math.sin(Math.PI / 2 + hook.angle) * hook.length;
        if (hook.length <= MIN_ROPE) {
            hook.length = MIN_ROPE; hook.state = 'SWINGING';
            if (hook.grabbedItem) {
                if (hook.grabbedItem.type === 'bag') applyMysteryEffect();
                else if (hook.grabbedItem.type === 'mouse') { showFeedback("FARE! 5 ₺", "#999"); score += 5; }
                else if (hook.grabbedItem.type !== 'skull' && hook.grabbedItem.type !== 'bone') {
                    score += hook.grabbedItem.value; playSound('correct'); showFeedback(`+${hook.grabbedItem.value} ₺`, '#2ecc71');
                }
                scoreEl.innerText = score;
                hook.grabbedItem = null;
            }
        }
    }
}

function applyMysteryEffect() {
    const effects = [
        { text: "SÜPER! +500₺", act: () => score += 500 },
        { text: "VERGİ! -100₺", act: () => score -= 100 },
        { text: "+20 SN", act: () => time += 20 },
        { text: "BOŞ! 1₺", act: () => score += 1 }
    ];
    const e = effects[Math.floor(Math.random() * effects.length)];
    e.act(); showFeedback(e.text, "#F39C12");
}

function createExplosion(x, y) {
    let r = 10, op = 1;
    let int = setInterval(() => {
        ctx.fillStyle = `rgba(255, 69, 0, ${op})`;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        r += 5; op -= 0.1;
        if (op <= 0) clearInterval(int);
    }, 50);
}

function draw() {
    drawBackground(ctx);
    ctx.fillStyle = '#444'; ctx.fillRect(ORIGIN_X - 40, SKY_HEIGHT - 100, 80, 100);
    drawMiner(ctx, minerState);
    ctx.fillStyle = '#7f8c8d'; ctx.beginPath(); ctx.arc(ORIGIN_X, ORIGIN_Y, 30, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#222'; ctx.lineWidth = 5; ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.moveTo(ORIGIN_X, ORIGIN_Y); ctx.lineTo(hook.x, hook.y); ctx.lineWidth = 4; ctx.strokeStyle = '#3E2723'; ctx.setLineDash([5, 5]); ctx.stroke(); ctx.restore();
    items.filter(i => i.active).forEach(i => i.draw(ctx));
    ctx.save(); ctx.translate(hook.x, hook.y); ctx.rotate(Math.PI / 2 + hook.angle);
    if (hook.grabbedItem) { ctx.save(); ctx.translate(0, 30); ctx.rotate(-Math.PI / 2); let tx = hook.grabbedItem.x, ty = hook.grabbedItem.y; hook.grabbedItem.x = 0; hook.grabbedItem.y = 0; hook.grabbedItem.draw(ctx); hook.grabbedItem.x = tx; hook.grabbedItem.y = ty; ctx.restore(); }
    ctx.fillStyle = '#546E7A'; ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#455A64'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-5, 5); ctx.quadraticCurveTo(-15, 15, -20, 5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(5, 5); ctx.quadraticCurveTo(15, 15, 20, 5); ctx.stroke();
    ctx.fillStyle = '#CFD8DC'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
}

function drawMiner(ctx, state) {
    ctx.save();
    let shake = (state === 'STRAINING') ? Math.random() * 3 - 1.5 : 0;
    ctx.translate(shake, shake);
    ctx.fillStyle = '#E65100'; ctx.fillRect(ORIGIN_X - 25, SKY_HEIGHT - 90, 50, 60);
    ctx.fillStyle = '#FFCCBC'; ctx.beginPath(); ctx.arc(ORIGIN_X, SKY_HEIGHT - 105, 22, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'black';
    if (state === 'STRAINING') {
        ctx.beginPath(); ctx.moveTo(ORIGIN_X - 10, SKY_HEIGHT - 110); ctx.lineTo(ORIGIN_X - 5, SKY_HEIGHT - 108); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ORIGIN_X + 10, SKY_HEIGHT - 110); ctx.lineTo(ORIGIN_X + 5, SKY_HEIGHT - 108); ctx.stroke();
        ctx.fillStyle = 'white'; ctx.fillRect(ORIGIN_X - 8, SKY_HEIGHT - 100, 16, 6);
        ctx.beginPath(); ctx.moveTo(ORIGIN_X - 8, SKY_HEIGHT - 97); ctx.lineTo(ORIGIN_X + 8, SKY_HEIGHT - 97); ctx.stroke();
        ctx.fillStyle = '#00BFFF'; ctx.beginPath(); ctx.arc(ORIGIN_X + 22, SKY_HEIGHT - 115, 4, 0, Math.PI * 2); ctx.fill();
    } else {
        ctx.beginPath(); ctx.arc(ORIGIN_X - 8, SKY_HEIGHT - 108, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(ORIGIN_X + 8, SKY_HEIGHT - 108, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(ORIGIN_X, SKY_HEIGHT - 100, 8, 0, Math.PI); ctx.stroke();
    }
    ctx.fillStyle = '#FFEB3B'; ctx.beginPath(); ctx.arc(ORIGIN_X, SKY_HEIGHT - 115, 24, Math.PI, 0); ctx.fill();
    ctx.fillRect(ORIGIN_X - 24, SKY_HEIGHT - 115, 48, 5);
    ctx.strokeStyle = '#FFCCBC'; ctx.lineWidth = 12; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(ORIGIN_X - 25, SKY_HEIGHT - 80);
    let handY = (state === 'PULLING' || state === 'STRAINING') ? SKY_HEIGHT - 60 + Math.sin(Date.now() / 100) * 8 : SKY_HEIGHT - 50;
    ctx.lineTo(ORIGIN_X + 15, handY); ctx.stroke();
    ctx.restore();
}

function showMath(item) {
    const data = generateMath();
    questionEl.innerText = `${data.q}`;
    optionsContainer.innerHTML = '';
    data.opts.forEach(opt => {
        let btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt;
        btn.onclick = (e) => { e.stopPropagation(); resolveMath(opt == data.a, item); };
        optionsContainer.appendChild(btn);
    });
    mathModal.style.display = 'block';
    clearInterval(questionTimerInterval);
    currentQuestionMaxTime = 30; questionTime = currentQuestionMaxTime;
    qTimerText.innerText = questionTime; qTimerFill.style.width = "100%";
    questionTimerInterval = setInterval(() => {
        questionTime--; qTimerText.innerText = questionTime;
        qTimerFill.style.width = (questionTime / currentQuestionMaxTime * 100) + "%";
        if (questionTime <= 0) { resolveMath(false, item); }
    }, 1000);
}

function resolveMath(correct, item) {
    clearInterval(questionTimerInterval);
    mathModal.style.display = 'none';
    gameState = 'PLAYING';
    if (correct) { playSound('correct'); hook.state = 'PULLING'; }
    else { playSound('wrong'); hook.grabbedItem = null; hook.state = 'RETRACTING'; showFeedback("YANLIŞ!", "#e74c3c"); item.active = true; }
}

function showFeedback(txt, col) {
    feedbackEl.innerText = txt; feedbackEl.style.color = col; feedbackEl.style.opacity = 1; feedbackEl.style.top = '40%';
    setTimeout(() => { feedbackEl.style.opacity = 0; feedbackEl.style.top = '35%'; }, 1500);
}

function initAudioAndStart(diff) {
    initAudio(); selectedDifficulty = diff; currentSelection.difficulty = diff; startGame();
}

function startGame() {
    showScreen(''); document.getElementById('ui-layer').style.display = 'flex';
    currentInfoLabel.innerText = currentSelection.className || "6. SINIF";
    currentTopicLabel.innerText = currentSelection.topicName || "Genel";
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    score = 0; askedQuestionsHash.clear(); initLevel(); gameState = 'PLAYING'; loop();
}

function resetGame() {
    showScreen('start-screen'); if (animationFrameId) cancelAnimationFrame(animationFrameId);
    displayLeaderboard(); nameInput.value = ""; score = 0; gameState = 'START';
}

// Navigasyon Fonksiyonları
function goToClasses() {
    let name = nameInput.value.trim();
    if (!name) { alert("Lütfen isminizi girin!"); return; }
    playerName = name;
    const grid = document.getElementById('class-grid');
    grid.innerHTML = '';
    Object.keys(curriculum).forEach(cls => {
        let btn = document.createElement('button');
        btn.className = 'btn-primary';
        btn.innerText = cls;
        btn.onclick = () => { currentSelection.className = cls; goToTopics(cls); };
        grid.appendChild(btn);
    });
    showScreen('class-screen');
}

function goToTopics(className) {
    const grid = document.getElementById('topic-grid');
    grid.innerHTML = '';
    document.getElementById('topic-title').innerText = className + " - KONU SEÇ";
    curriculum[className].forEach(topic => {
        let btn = document.createElement('button');
        btn.className = 'btn-primary';
        btn.innerText = topic;
        btn.onclick = () => { currentSelection.topicName = topic; goToDifficulty(); };
        grid.appendChild(btn);
    });
    showScreen('topic-screen');
}

function goToDifficulty() { showScreen('difficulty-screen'); }

function goToMenu() { clearInterval(timeInterval); clearInterval(questionTimerInterval); saveScoreInDB(playerName, score); resetGame(); }
function endLevel() { clearInterval(timeInterval); clearInterval(questionTimerInterval); saveScoreInDB(playerName, score); document.getElementById('final-score').innerText = score; showScreen('game-over-screen'); gameState = 'GAME_OVER'; }

const trigger = (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return;
    if (e.type === 'touchstart') e.preventDefault();
    if (gameState === 'PLAYING' && hook.state === 'SWINGING') { playSound('shoot'); hook.state = 'SHOOTING'; }
};
window.addEventListener('keydown', (e) => { if (e.code === 'Space') trigger(e); });
window.addEventListener('mousedown', trigger);
window.addEventListener('touchstart', trigger, { passive: false });

function loop() { if (gameState !== 'START') { update(); draw(); } animationFrameId = requestAnimationFrame(loop); }

// Başlangıç
generateGroundLayers(); drawBackground(ctx); showScreen('start-screen');
