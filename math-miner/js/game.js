// --- 1. GLOBAL DEĞİŞKENLER VE YAPILANDIRMA ---
const WIDTH = 1366, HEIGHT = 768, ORIGIN_X = WIDTH / 2, SKY_HEIGHT = 180, ORIGIN_Y = SKY_HEIGHT - 50, MIN_ROPE = 70;

// Konular ve Müfredat (Genişletilmiş)
const curriculum = {
    "5. SINIF": ["Doğal Sayılar", "Kesirler", "Geometrik Şekiller", "Çevre ve Alan"],
    "6. SINIF": ["Tam Sayılar", "Kesirler", "Oran-Orantı", "Denklem", "Açılar", "Hacim"],
    "7. SINIF": ["Rasyonel Sayılar", "Cebirsel İfadeler", "Denklemler", "Oran ve Orantı", "Yüzdeler", "Dörtgenler", "Çember ve Daire"],
    "8. SINIF": ["Üslü İfadeler", "Kareköklü İfadeler", "Özdeşlikler", "Çarpanlara Ayırma", "Olasılık", "Denklemler", "Üçgenler", "Eşitsizlikler"]
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

// SORU BANKALARI (Statik sorular - çeşitlilik için)
const questionBanks = {
    "5. SINIF": {
        "Doğal Sayılar": [
            { q: "24 + 36 = ?", a: "60", d: ["50", "70", "56"] },
            { q: "85 - 27 = ?", a: "58", d: ["62", "52", "68"] },
            { q: "12 × 5 = ?", a: "60", d: ["55", "65", "50"] },
            { q: "72 ÷ 8 = ?", a: "9", d: ["8", "7", "6"] },
            { q: "15 × 4 = ?", a: "60", d: ["45", "55", "65"] },
            { q: "8 × 7 = ?", a: "56", d: ["54", "48", "63"] },
            { q: "81 ÷ 9 = ?", a: "9", d: ["8", "7", "10"] },
            { q: "11 × 11 = ?", a: "121", d: ["111", "131", "122"] },
            { q: "9 × 9 = ?", a: "81", d: ["72", "90", "79"] }
        ],
        "Kesirler": [
            { q: "1/2 + 1/2 = ?", a: "1", d: ["2", "1/4", "2/4"] },
            { q: "3/4 + 1/4 = ?", a: "1", d: ["4/8", "2/4", "1/2"] },
            { q: "1/2 + 1/4 = ?", a: "3/4", d: ["2/6", "1/6", "2/4"] },
            { q: "2/3 + 1/3 = ?", a: "1", d: ["3/6", "3/3", "2/3"] },
            { q: "1 tam = kaç yarım?", a: "2", d: ["1", "3", "4"] }
        ],
        "Geometrik Şekiller": [
            { q: "Üçgenin kaç kenarı var?", a: "3", d: ["4", "5", "2"] },
            { q: "Karenin kaç köşesi var?", a: "4", d: ["3", "5", "6"] },
            { q: "Üçgenin iç açıları toplamı?", a: "180°", d: ["360°", "90°", "270°"] },
            { q: "Karede tüm açılar kaç derece?", a: "90", d: ["60", "45", "180"] }
        ],
        "Çevre ve Alan": [
            { q: "Kenarı 5 cm olan karenin çevresi?", a: "20 cm", d: ["25 cm", "15 cm", "10 cm"] },
            { q: "Kenarı 4 cm olan karenin alanı?", a: "16 cm²", d: ["8 cm²", "12 cm²", "20 cm²"] },
            { q: "5×3 dikdörtgenin alanı?", a: "15 cm²", d: ["16 cm²", "8 cm²", "18 cm²"] }
        ]
    },
    "6. SINIF": {
        "Tam Sayılar": [
            { q: "(-5) + 3 = ?", a: "-2", d: ["2", "-8", "8"] },
            { q: "(-7) + (-4) = ?", a: "-11", d: ["11", "-3", "3"] },
            { q: "(-6) × 2 = ?", a: "-12", d: ["12", "-8", "8"] },
            { q: "(-3) × (-4) = ?", a: "12", d: ["-12", "7", "-7"] },
            { q: "(-20) ÷ (-4) = ?", a: "5", d: ["-5", "4", "-4"] },
            { q: "|−7| = ?", a: "7", d: ["-7", "0", "1"] }
        ],
        "Kesirler": [
            { q: "2/3 + 1/6 = ?", a: "5/6", d: ["3/9", "3/6", "1/2"] },
            { q: "3/4 - 1/2 = ?", a: "1/4", d: ["2/4", "1/2", "2/2"] },
            { q: "1/2 ÷ 1/4 = ?", a: "2", d: ["1/8", "4", "1/2"] }
        ],
        "Oran-Orantı": [
            { q: "4:6 oranını sadeleştir", a: "2:3", d: ["1:2", "3:4", "4:6"] },
            { q: "12'nin 3/4'ü kaçtır?", a: "9", d: ["8", "6", "10"] },
            { q: "20'nin %25'i kaçtır?", a: "5", d: ["4", "6", "10"] }
        ],
        "Denklem": [
            { q: "x + 5 = 12 ise x = ?", a: "7", d: ["5", "17", "6"] },
            { q: "2x = 14 ise x = ?", a: "7", d: ["6", "8", "28"] },
            { q: "3x + 2 = 11 ise x = ?", a: "3", d: ["4", "2", "5"] }
        ],
        "Açılar": [
            { q: "Dik açı kaç derece?", a: "90°", d: ["180°", "45°", "360°"] },
            { q: "Doğru açı kaç derece?", a: "180°", d: ["90°", "360°", "270°"] },
            { q: "60°'nin bütünleyeni kaç derece?", a: "120°", d: ["30°", "60°", "90°"] }
        ],
        "Hacim": [
            { q: "2×3×4 küpün hacmi?", a: "24", d: ["9", "14", "36"] },
            { q: "Kenarı 3 cm küpün hacmi?", a: "27 cm³", d: ["9 cm³", "18 cm³", "81 cm³"] }
        ]
    },
    "7. SINIF": {
        "Rasyonel Sayılar": [
            { q: "-3/4 + 1/4 = ?", a: "-1/2", d: ["-2/4", "1/2", "-1/4"] },
            { q: "(-1/2) ÷ (1/4) = ?", a: "-2", d: ["2", "-1/8", "1/8"] },
            { q: "-0.5 + 0.3 = ?", a: "-0.2", d: ["0.2", "-0.8", "0.8"] },
            { q: "|-3/5| = ?", a: "3/5", d: ["-3/5", "5/3", "-5/3"] },
            { q: "0.75 hangi kesir?", a: "3/4", d: ["2/3", "4/5", "7/10"] }
        ],
        "Cebirsel İfadeler": [
            { q: "3x + 2x = ?", a: "5x", d: ["6x", "5x²", "x"] },
            { q: "2x × 3x = ?", a: "6x²", d: ["5x", "6x", "5x²"] },
            { q: "2(x + 3) = ?", a: "2x + 6", d: ["2x + 3", "x + 6", "2x + 5"] },
            { q: "x × x × x = ?", a: "x³", d: ["3x", "x + 3", "3x²"] }
        ],
        "Denklemler": [
            { q: "3x - 5 = 10 ise x = ?", a: "5", d: ["15", "3", "-5"] },
            { q: "2(x + 4) = 14 ise x = ?", a: "3", d: ["7", "5", "11"] },
            { q: "-2x + 8 = 0 ise x = ?", a: "4", d: ["-4", "2", "-2"] }
        ],
        "Oran ve Orantı": [
            { q: "6:9 oranını sadeleştir", a: "2:3", d: ["3:4", "1:2", "6:9"] },
            { q: "24'ün 3/4'ü kaçtır?", a: "18", d: ["16", "12", "20"] },
            { q: "50'nin %20'si kaçtır?", a: "10", d: ["25", "5", "20"] }
        ],
        "Yüzdeler": [
            { q: "120'nin %50'si kaçtır?", a: "60", d: ["50", "70", "24"] },
            { q: "80'in %25'i kaçtır?", a: "20", d: ["16", "25", "40"] },
            { q: "Fiyatı %10 artan 100 TL kaç olur?", a: "110", d: ["10", "90", "101"] }
        ],
        "Dörtgenler": [
            { q: "Paralelkenarın karşı açıları?", a: "Eşit", d: ["Farklı", "90°", "Bütünler"] },
            { q: "Karenin tüm açıları?", a: "90°", d: ["60°", "45°", "120°"] },
            { q: "Yamuğun kaç kenarı paralel?", a: "2", d: ["0", "4", "1"] }
        ],
        "Çember ve Daire": [
            { q: "Yarıçapı r olan çemberin çevresi?", a: "2πr", d: ["πr", "πr²", "2r"] },
            { q: "Yarıçapı r olan dairenin alanı?", a: "πr²", d: ["2πr", "πr", "r²"] },
            { q: "Çapı 10 cm olan dairenin yarıçapı?", a: "5 cm", d: ["10 cm", "20 cm", "2.5 cm"] }
        ]
    },
    "8. SINIF": {
        "Üslü İfadeler": [
            { q: "2³ = ?", a: "8", d: ["6", "9", "4"] },
            { q: "5² = ?", a: "25", d: ["10", "15", "125"] },
            { q: "2⁴ = ?", a: "16", d: ["8", "32", "12"] },
            { q: "3³ = ?", a: "27", d: ["9", "81", "18"] },
            { q: "(-2)² = ?", a: "4", d: ["-4", "2", "-2"] },
            { q: "(-3)³ = ?", a: "-27", d: ["27", "-9", "9"] },
            { q: "7⁰ = ?", a: "1", d: ["0", "7", "-1"] },
            { q: "2³ × 2² = ?", a: "32", d: ["12", "64", "10"] }
        ],
        "Kareköklü İfadeler": [
            { q: "√9 = ?", a: "3", d: ["9", "81", "4.5"] },
            { q: "√16 = ?", a: "4", d: ["8", "2", "256"] },
            { q: "√25 = ?", a: "5", d: ["12.5", "625", "10"] },
            { q: "√49 = ?", a: "7", d: ["24.5", "14", "343"] },
            { q: "√100 = ?", a: "10", d: ["50", "1000", "20"] },
            { q: "√64 = ?", a: "8", d: ["32", "4", "16"] },
            { q: "√144 = ?", a: "12", d: ["72", "14", "24"] },
            { q: "√4 + √9 = ?", a: "5", d: ["√13", "6", "13"] }
        ],
        "Özdeşlikler": [
            { q: "(x + 2)² açılımı?", a: "x² + 4x + 4", d: ["x² + 4", "x² + 2x + 4", "x² + 4x + 2"] },
            { q: "(a - 3)² açılımı?", a: "a² - 6a + 9", d: ["a² - 9", "a² - 3a + 9", "a² + 6a + 9"] },
            { q: "(x + 5)(x - 5) = ?", a: "x² - 25", d: ["x² + 25", "x² - 10x - 25", "2x - 25"] },
            { q: "x² - 9 = ?", a: "(x-3)(x+3)", d: ["(x-9)(x+9)", "(x-3)²", "(x+3)²"] },
            { q: "(a + b)² = ?", a: "a² + 2ab + b²", d: ["a² + b²", "a² + ab + b²", "2a² + 2b²"] }
        ],
        "Çarpanlara Ayırma": [
            { q: "x² + 5x = ?", a: "x(x + 5)", d: ["x² + 5", "(x+5)²", "5x²"] },
            { q: "2x + 4 = ?", a: "2(x + 2)", d: ["2x + 2", "(x+4)", "x + 2"] },
            { q: "x² - 4 = ?", a: "(x-2)(x+2)", d: ["(x-4)(x+4)", "(x-2)²", "x² + 4"] },
            { q: "x² + 6x + 9 = ?", a: "(x+3)²", d: ["(x-3)²", "(x+9)²", "x(x+6)+9"] }
        ],
        "Olasılık": [
            { q: "Yazı-tura atışında yazı gelme olası?", a: "1/2", d: ["1", "1/4", "2"] },
            { q: "Zarla 6 gelme olasılığı?", a: "1/6", d: ["1/3", "6", "1"] },
            { q: "Zarla çift sayı gelme olasılığı?", a: "1/2", d: ["1/3", "1/6", "2/3"] },
            { q: "İmkansız olayın olasılığı?", a: "0", d: ["1", "-1", "∞"] },
            { q: "Kesin olayın olasılığı?", a: "1", d: ["0", "100", "∞"] }
        ],
        "Denklemler": [
            { q: "x² = 9 ise x = ?", a: "±3", d: ["3", "-3", "81"] },
            { q: "x² - 4 = 0 ise x = ?", a: "±2", d: ["2", "-2", "4"] },
            { q: "x² = 25 ise x = ?", a: "±5", d: ["5", "-5", "625"] },
            { q: "x² = 100 ise x = ?", a: "±10", d: ["10", "50", "0"] }
        ],
        "Üçgenler": [
            { q: "Üçgenin iç açıları toplamı?", a: "180°", d: ["360°", "90°", "270°"] },
            { q: "Eşkenar üçgende her açı?", a: "60°", d: ["90°", "45°", "120°"] },
            { q: "3-4-5 üçgeni hangi tür?", a: "Dik üçgen", d: ["Eşkenar", "İkizkenar", "Geniş açılı"] },
            { q: "Pisagor teoremi: a² + b² = ?", a: "c²", d: ["(a+b)²", "2ab", "ab"] }
        ],
        "Eşitsizlikler": [
            { q: "x + 3 > 5 ise x > ?", a: "2", d: ["3", "5", "8"] },
            { q: "2x < 10 ise x < ?", a: "5", d: ["10", "2", "20"] },
            { q: "x - 4 ≥ 6 ise x ≥ ?", a: "10", d: ["2", "6", "-10"] },
            { q: "-2x > 6 ise x < ?", a: "-3", d: ["3", "-6", "12"] }
        ]
    }
};

// --- DİNAMİK SORU ÜRETİCİLER ---
const dynamicGenerators = {
    "5. SINIF": {
        "Doğal Sayılar": (d) => {
            const ops = [['+', (a, b) => a + b], ['-', (a, b) => a - b], ['×', (a, b) => a * b]];
            const [op, fn] = ops[rand(0, 2)];
            let a = rand(5, 30 * d), b = rand(2, 15 * d);
            if (op === '-' && a < b) [a, b] = [b, a];
            if (op === '×') { a = rand(2, 10 + d); b = rand(2, 10); }
            const ans = fn(a, b);
            return { q: `${a} ${op} ${b} = ?`, a: ans, opts: generateWrongOptions(ans) };
        },
        "Kesirler": (d) => {
            const payda = rand(2, 8 + d);
            const p1 = rand(1, payda - 1), p2 = rand(1, Math.min(payda - p1, payda - 1));
            const ans = p1 + p2;
            return { q: `${p1}/${payda} + ${p2}/${payda} = ?`, a: `${ans}/${payda}`, opts: [`${ans - 1}/${payda}`, `${ans + 1}/${payda}`, `${ans}/${payda + 1}`].sort(() => Math.random() - 0.5) };
        },
        "Çevre ve Alan": (d) => {
            const kenar = rand(2, 8 + d * 2);
            if (rand(0, 1) === 0) {
                return { q: `Kenarı ${kenar} cm karenin çevresi?`, a: kenar * 4, opts: generateWrongOptions(kenar * 4) };
            }
            return { q: `Kenarı ${kenar} cm karenin alanı?`, a: kenar * kenar, opts: generateWrongOptions(kenar * kenar) };
        }
    },
    "6. SINIF": {
        "Tam Sayılar": (d) => {
            const a = rand(-10 * d, 10 * d), b = rand(-10 * d, 10 * d);
            const ops = [['+', a + b], ['-', a - b], ['×', a * b]];
            const [op, ans] = ops[rand(0, 2)];
            return { q: `(${a}) ${op} (${b}) = ?`, a: ans, opts: generateWrongOptions(ans) };
        },
        "Oran-Orantı": (d) => {
            const a = rand(2, 8), b = rand(2, 5);
            const x = a * b;
            return { q: `${a}:${b} = ${x}:? (? = ?)`, a: b * b, opts: generateWrongOptions(b * b) };
        },
        "Denklem": (d) => {
            const x = rand(1, 10 + d * 3);
            const b = rand(1, 15);
            return { q: `x + ${b} = ${x + b} ise x = ?`, a: x, opts: generateWrongOptions(x) };
        },
        "Hacim": (d) => {
            const a = rand(2, 4 + d), b = rand(2, 4 + d), c = rand(2, 4 + d);
            return { q: `${a}×${b}×${c} hacmi?`, a: a * b * c, opts: generateWrongOptions(a * b * c) };
        },
        "Açılar": (d) => {
            const aci = rand(20, 80);
            return { q: `${aci}° açının bütünleyeni?`, a: 180 - aci, opts: generateWrongOptions(180 - aci) };
        }
    },
    "7. SINIF": {
        "Rasyonel Sayılar": (d) => {
            const n = rand(1, 15);
            return { q: `|-${n}| = ?`, a: n, opts: generateWrongOptions(n) };
        },
        "Cebirsel İfadeler": (d) => {
            const a = rand(2, 6 + d), b = rand(2, 6 + d);
            return { q: `${a}x + ${b}x = ?`, a: `${a + b}x`, opts: [`${a * b}x`, `${a + b}`, `${a}x`].sort(() => Math.random() - 0.5) };
        },
        "Denklemler": (d) => {
            const x = rand(1, 8 + d * 2);
            const a = rand(2, 4), b = rand(1, 15);
            return { q: `${a}x + ${b} = ${a * x + b} ise x = ?`, a: x, opts: generateWrongOptions(x) };
        },
        "Oran ve Orantı": (d) => {
            const sayi = rand(2, 10) * 10;
            const oran = [10, 20, 25, 50][rand(0, 3)];
            return { q: `${sayi}'nin %${oran}'si?`, a: sayi * oran / 100, opts: generateWrongOptions(sayi * oran / 100) };
        },
        "Yüzdeler": (d) => {
            const fiyat = rand(5, 15) * 10;
            const oran = [10, 20, 25][rand(0, 2)];
            const yeni = fiyat + (fiyat * oran / 100);
            return { q: `%${oran} artışla ${fiyat} TL → ?`, a: yeni, opts: generateWrongOptions(yeni) };
        },
        "Çember ve Daire": (d) => {
            const r = rand(2, 8 + d);
            if (rand(0, 1) === 0) {
                return { q: `r=${r}, çevre≈? (π≈3)`, a: 6 * r, opts: generateWrongOptions(6 * r) };
            }
            return { q: `r=${r}, alan≈? (π≈3)`, a: 3 * r * r, opts: generateWrongOptions(3 * r * r) };
        }
    },
    "8. SINIF": {
        "Üslü İfadeler": (d) => {
            const base = rand(2, 4 + d);
            const exp = rand(2, 3);
            const ans = Math.pow(base, exp);
            return { q: `${base}^${exp} = ?`, a: ans, opts: generateWrongOptions(ans) };
        },
        "Kareköklü İfadeler": (d) => {
            const n = rand(2, 12 + d * 2);
            return { q: `√${n * n} = ?`, a: n, opts: generateWrongOptions(n) };
        },
        "Özdeşlikler": (d) => {
            const a = rand(1, 5 + d);
            return { q: `(x+${a})² açılımı?`, a: `x²+${2 * a}x+${a * a}`, opts: [`x²+${a * a}`, `x²+${a}x+${a * a}`, `x²+${2 * a}x+${a}`].sort(() => Math.random() - 0.5) };
        },
        "Çarpanlara Ayırma": (d) => {
            const a = rand(2, 6), b = rand(2, 6);
            return { q: `${a}x + ${a * b} = ?`, a: `${a}(x+${b})`, opts: [`${b}(x+${a})`, `x(${a}+${b})`, `${a * b}x`].sort(() => Math.random() - 0.5) };
        },
        "Denklemler": (d) => {
            const x = rand(2, 10 + d);
            return { q: `x² = ${x * x} ise x = ?`, a: `±${x}`, opts: [`${x}`, `-${x}`, `${x * x / 2}`].sort(() => Math.random() - 0.5) };
        },
        "Üçgenler": (d) => {
            const pairs = [[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17]];
            const [a, b, c] = pairs[rand(0, 3)];
            return { q: `${a},${b} dik kenar → hipotenüs?`, a: c, opts: generateWrongOptions(c) };
        },
        "Eşitsizlikler": (d) => {
            const a = rand(2, 5);
            const b = rand(10, 30);
            const ans = Math.floor(b / a);
            return { q: `${a}x < ${b} ise x < ?`, a: ans, opts: generateWrongOptions(ans) };
        }
    }
};

function getGeneratorFunction(cls, top) {
    // Dinamik üretici var mı?
    const dynamicGen = dynamicGenerators[cls]?.[top];
    const bank = questionBanks[cls]?.[top];

    return (d) => {
        // %50 dinamik, %50 statik (her ikisi de varsa)
        const useDynamic = dynamicGen && (!bank || bank.length === 0 || Math.random() > 0.5);

        if (useDynamic) {
            return dynamicGen(d);
        }

        if (bank && bank.length > 0) {
            const q = bank[Math.floor(Math.random() * bank.length)];
            return { q: q.q, a: q.a, opts: [q.a, ...q.d].sort(() => Math.random() - 0.5) };
        }

        // Fallback
        let n1 = rand(5, 50), n2 = rand(5, 50);
        return { q: `${n1} + ${n2} = ?`, a: n1 + n2, opts: generateWrongOptions(n1 + n2) };
    };
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
