// ==========================================
// MATEMATİK LİGİ - PAC-MAN v3.0
// Klasik Harita, Hayalet Evi, Düzeltmeler
// ==========================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- SABİTLER ---
const TILE = 40, COLS = 32, ROWS = 18;
const COLORS = {
    wall: '#2121DE', wallGlow: '#4040FF', dot: '#FFB897', pellet: '#FFFF00', pacman: '#FFFF00',
    ghosts: ['#FF0000', '#FFB8FF', '#00FFFF', '#FFB852']
};

// --- OYUN DURUMU ---
let gameState = 'START', score = 0, lives = 3, level = 1;
let powerTime = 0, safeTime = 0, frameCount = 0, gameId, questionTimer;
let playerName = "Öğrenci", askedQuestions = new Set();
let currentSelection = { className: "5. SINIF", topicName: "Doğal Sayılar" };

// Müfredat
const curriculum = {
    "5. SINIF": ["Doğal Sayılar", "Kesirler", "Geometrik Şekiller", "Çevre ve Alan"],
    "6. SINIF": ["Tam Sayılar", "Kesirler", "Oran-Orantı", "Denklem", "Açılar", "Hacim"],
    "7. SINIF": ["Rasyonel Sayılar", "Cebirsel İfadeler", "Denklemler", "Yüzdeler", "Dörtgenler", "Çember ve Daire"],
    "8. SINIF": ["Üslü İfadeler", "Kareköklü İfadeler", "Özdeşlikler", "Çarpanlara Ayırma", "Olasılık", "Denklemler", "Üçgenler"]
};

let map = [], pacman = {}, ghosts = [];

// --- KLASİK PAC-MAN HARİTASI (32x18) ---
// 1=Duvar, 0=Yem, 2=Boş, 3=Süper Yem, 4=Hayalet Kapısı, 5=Hayalet Evi İçi
const classicMap = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1],
    [1, 3, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 3, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 2, 2, 2, 2, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1],
    [2, 2, 2, 2, 1, 0, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 0, 1, 2, 2, 2, 2],
    [1, 1, 1, 1, 1, 0, 1, 1, 2, 1, 1, 1, 4, 4, 4, 4, 4, 4, 4, 4, 1, 1, 1, 2, 1, 1, 0, 1, 1, 1, 1, 1],
    [2, 2, 2, 2, 2, 0, 2, 2, 2, 1, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 1, 2, 2, 2, 0, 2, 2, 2, 2, 2],
    [1, 1, 1, 1, 1, 0, 1, 1, 2, 1, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 1, 2, 1, 1, 0, 1, 1, 1, 1, 1],
    [2, 2, 2, 2, 1, 0, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 0, 1, 2, 2, 2, 2],
    [1, 1, 1, 1, 1, 0, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 0, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1],
    [1, 3, 0, 0, 1, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 1, 0, 0, 3, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

function initMap() {
    map = classicMap.map(row => [...row]);
}

// --- HAYALET SINIFI ---
// Blinky(0/Kırmızı)=Direkt kovala, Pinky(1/Pembe)=Önden kes, Inky(2/Cyan)=Yanlardan gel, Clyde(3/Turuncu)=Rastgele/Kaç
class Ghost {
    constructor(x, y, colorIdx) {
        this.startX = x;
        this.startY = y;
        this.x = x;
        this.y = y;
        this.color = COLORS.ghosts[colorIdx];
        this.colorIdx = colorIdx;
        this.dir = { x: [-1, 1, 1, -1][colorIdx], y: 0 };
        this.inHouse = true;
        this.exitDelay = 30; // Aynı anda çıkış (0.5 saniye)
        this.lastTile = null;
        this.scatterMode = false;
    }

    getSpeed() {
        // Daha hızlı hayaletler, seviye arttıkça daha da hızlanır
        return Math.min(2.2 + (level - 1) * 0.2, 3.5);
    }

    // Her hayalet için hedef tile hesapla
    getTargetTile() {
        const pacCol = Math.floor(pacman.x / TILE);
        const pacRow = Math.floor(pacman.y / TILE);

        // Power mode: Kaç!
        if (powerTime > 0) {
            // Pac-Man'den uzağa git
            return { col: pacCol > 16 ? 1 : 30, row: pacRow > 9 ? 1 : 16 };
        }

        switch (this.colorIdx) {
            case 0: // BLINKY (Kırmızı) - Direkt kovala
                return { col: pacCol, row: pacRow };

            case 1: // PINKY (Pembe) - 4 kare önünü hedefle
                return {
                    col: Math.max(0, Math.min(COLS - 1, pacCol + pacman.dir.x * 4)),
                    row: Math.max(0, Math.min(ROWS - 1, pacRow + pacman.dir.y * 4))
                };

            case 2: // INKY (Cyan) - Blinky'nin simetriği (kuşatma)
                const blinky = ghosts[0];
                const blinkyCol = Math.floor(blinky.x / TILE);
                const blinkyRow = Math.floor(blinky.y / TILE);
                // Pac-Man'in 2 kare önü + Blinky'den uzaklık
                const aheadCol = pacCol + pacman.dir.x * 2;
                const aheadRow = pacRow + pacman.dir.y * 2;
                return {
                    col: Math.max(0, Math.min(COLS - 1, aheadCol + (aheadCol - blinkyCol))),
                    row: Math.max(0, Math.min(ROWS - 1, aheadRow + (aheadRow - blinkyRow)))
                };

            case 3: // CLYDE (Turuncu) - Yakınsa kaç, uzaksa kovala
                const dist = Math.hypot(this.x - pacman.x, this.y - pacman.y);
                if (dist < TILE * 8) {
                    // Yakın - köşeye kaç
                    return { col: 1, row: 16 };
                }
                return { col: pacCol, row: pacRow };

            default:
                return { col: pacCol, row: pacRow };
        }
    }

    update() {
        // --- Evden Çıkış ---
        if (this.inHouse) {
            this.exitDelay--;
            if (this.exitDelay <= 0) {
                this.inHouse = false;
                this.x = 15 * TILE + TILE / 2;
                this.y = 7 * TILE + TILE / 2;
                this.dir = { x: [-1, 1, -1, 1][this.colorIdx], y: 0 };
            }
            return;
        }

        const speed = powerTime > 0 ? 2 : 3; // Sabit hız

        const col = Math.floor(this.x / TILE);
        const row = Math.floor(this.y / TILE);
        const centerX = col * TILE + TILE / 2;
        const centerY = row * TILE + TILE / 2;

        // Merkeze ulaştı mı?
        const atCenterX = Math.abs(this.x - centerX) < speed;
        const atCenterY = Math.abs(this.y - centerY) < speed;

        if (atCenterX && atCenterY) {
            // Merkeze snap
            this.x = centerX;
            this.y = centerY;

            // Tünel kontrolü
            if (row === 10) {
                if (col <= 0) { this.x = (COLS - 2) * TILE + TILE / 2; return; }
                if (col >= COLS - 1) { this.x = TILE + TILE / 2; return; }
            }

            // Yeni yön seç
            const dirs = [
                { x: 0, y: -1 }, // yukarı
                { x: 0, y: 1 },  // aşağı
                { x: -1, y: 0 }, // sol
                { x: 1, y: 0 }   // sağ
            ];

            // Geçerli yönleri bul
            let valid = dirs.filter(d => {
                const nr = row + d.y;
                const nc = col + d.x;
                if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) return false;
                const tile = map[nr]?.[nc];
                return tile !== 1 && tile !== 4 && tile !== 5;
            });

            // Geri dönüşü engelle
            if (valid.length > 1) {
                valid = valid.filter(d => !(d.x === -this.dir.x && d.y === -this.dir.y));
            }

            if (valid.length > 0) {
                // Pac-Man'e doğru git (basit AI)
                const pacCol = Math.floor(pacman.x / TILE);
                const pacRow = Math.floor(pacman.y / TILE);

                if (powerTime > 0) {
                    // Kaç - en uzak yönü seç
                    valid.sort((a, b) => {
                        const distA = Math.abs(col + a.x - pacCol) + Math.abs(row + a.y - pacRow);
                        const distB = Math.abs(col + b.x - pacCol) + Math.abs(row + b.y - pacRow);
                        return distB - distA;
                    });
                } else {
                    // Kovala - en yakın yönü seç + biraz rastgelelik
                    valid.sort((a, b) => {
                        const distA = Math.abs(col + a.x - pacCol) + Math.abs(row + a.y - pacRow);
                        const distB = Math.abs(col + b.x - pacCol) + Math.abs(row + b.y - pacRow);
                        return distA - distB;
                    });
                }

                // %25 rastgele yön seç
                if (Math.random() < 0.25 && valid.length > 1) {
                    this.dir = valid[Math.floor(Math.random() * valid.length)];
                } else {
                    this.dir = valid[0];
                }
            }
        }

        // Hareket et
        this.x += this.dir.x * speed;
        this.y += this.dir.y * speed;
    }

    draw() {
        let color = this.color;
        if (powerTime > 0) {
            color = (powerTime < 120 && Math.floor(Date.now() / 200) % 2) ? '#FFF' : '#2121DE';
        }

        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;

        ctx.beginPath();
        ctx.arc(this.x, this.y - 5, 16, Math.PI, 0);
        ctx.lineTo(this.x + 16, this.y + 14);
        for (let i = 0; i < 4; i++) {
            ctx.lineTo(this.x + 16 - i * 8, this.y + 14 + (i % 2 ? 4 : 0));
        }
        ctx.lineTo(this.x - 16, this.y + 14);
        ctx.closePath();
        ctx.fill();

        if (powerTime <= 0 || this.inHouse) {
            ctx.fillStyle = '#FFF';
            ctx.beginPath();
            ctx.arc(this.x - 6, this.y - 5, 5, 0, Math.PI * 2);
            ctx.arc(this.x + 6, this.y - 5, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#00F';
            ctx.beginPath();
            ctx.arc(this.x - 6 + this.dir.x * 2, this.y - 5 + this.dir.y * 2, 3, 0, Math.PI * 2);
            ctx.arc(this.x + 6 + this.dir.x * 2, this.y - 5 + this.dir.y * 2, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;
    }

    reset() {
        this.x = this.startX;
        this.y = this.startY;
        this.inHouse = true;
        this.exitDelay = 30; // Aynı anda çıkış
        this.dir = { x: [-1, 1, 1, -1][this.colorIdx], y: 0 };
        this.lastTile = null;
    }
}

// Hayalet için duvar kontrolü (ev dışındayken kapıdan geri giremez)
function isWallForGhost(r, c, ghost = null) {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return true;
    const tile = map[r]?.[c];
    // Duvar her zaman engel
    if (tile === 1) return true;
    // Kapı: Hayalet evden çıktıktan sonra geri giremez
    if (tile === 4 && ghost && !ghost.inHouse) return true;
    return false;
}

// Pacman için hayalet evi kontrolü
function isGhostHouse(r, c) {
    const tile = map[r]?.[c];
    return tile === 4 || tile === 5; // Kapı veya ev içi
}

// --- SORU BANKASI ---
const questionBanks = {
    "5. SINIF": {
        "Doğal Sayılar": [
            { q: "24+36=?", a: "60", d: ["50", "70", "56"] }, { q: "85-27=?", a: "58", d: ["62", "52", "68"] },
            { q: "12×5=?", a: "60", d: ["55", "65", "50"] }, { q: "72÷8=?", a: "9", d: ["8", "7", "6"] },
            { q: "8×7=?", a: "56", d: ["54", "48", "63"] }, { q: "81÷9=?", a: "9", d: ["8", "7", "10"] },
            { q: "11×11=?", a: "121", d: ["111", "131", "122"] }, { q: "9×9=?", a: "81", d: ["72", "90", "79"] }
        ],
        "Kesirler": [
            { q: "1/2+1/2=?", a: "1", d: ["2", "1/4", "2/4"] }, { q: "3/4+1/4=?", a: "1", d: ["4/8", "2/4", "1/2"] },
            { q: "1/2+1/4=?", a: "3/4", d: ["2/6", "1/6", "2/4"] }, { q: "2/3+1/3=?", a: "1", d: ["3/6", "3/3", "2/3"] }
        ],
        "Geometrik Şekiller": [
            { q: "Üçgenin kaç kenarı var?", a: "3", d: ["4", "5", "2"] }, { q: "Karenin kaç köşesi var?", a: "4", d: ["3", "5", "6"] },
            { q: "Üçgenin iç açıları toplamı?", a: "180°", d: ["360°", "90°", "270°"] }, { q: "Dik açı kaç derece?", a: "90°", d: ["180°", "45°", "360°"] }
        ],
        "Çevre ve Alan": [
            { q: "Kenarı 5cm karenin çevresi?", a: "20cm", d: ["25cm", "15cm", "10cm"] }, { q: "Kenarı 4cm karenin alanı?", a: "16cm²", d: ["8cm²", "12cm²", "20cm²"] },
            { q: "5×3 dikdörtgenin alanı?", a: "15cm²", d: ["16cm²", "8cm²", "18cm²"] }
        ]
    },
    "6. SINIF": {
        "Tam Sayılar": [{ q: "(-5)+3=?", a: "-2", d: ["2", "-8", "8"] }, { q: "(-3)×(-4)=?", a: "12", d: ["-12", "7", "-7"] }],
        "Kesirler": [{ q: "2/3+1/6=?", a: "5/6", d: ["3/9", "3/6", "1/2"] }, { q: "3/4-1/2=?", a: "1/4", d: ["2/4", "1/2", "2/2"] }],
        "Oran-Orantı": [{ q: "4:6 sadeleştir", a: "2:3", d: ["1:2", "3:4", "4:6"] }, { q: "12'nin 3/4'ü?", a: "9", d: ["8", "6", "10"] }],
        "Denklem": [{ q: "x+5=12 ise x=?", a: "7", d: ["5", "17", "6"] }, { q: "2x=14 ise x=?", a: "7", d: ["6", "8", "28"] }],
        "Açılar": [{ q: "Dik açı kaç derece?", a: "90°", d: ["180°", "45°", "360°"] }, { q: "Doğru açı kaç derece?", a: "180°", d: ["90°", "360°", "270°"] }],
        "Hacim": [{ q: "2×3×4 hacmi?", a: "24", d: ["9", "14", "36"] }, { q: "Kenarı 3cm küpün hacmi?", a: "27cm³", d: ["9cm³", "18cm³", "81cm³"] }]
    },
    "7. SINIF": {
        "Rasyonel Sayılar": [{ q: "-3/4+1/4=?", a: "-1/2", d: ["-2/4", "1/2", "-1/4"] }, { q: "0.75 hangi kesir?", a: "3/4", d: ["2/3", "4/5", "7/10"] }],
        "Cebirsel İfadeler": [{ q: "3x+2x=?", a: "5x", d: ["6x", "5x²", "x"] }, { q: "2x×3x=?", a: "6x²", d: ["5x", "6x", "5x²"] }],
        "Denklemler": [{ q: "3x-5=10 ise x=?", a: "5", d: ["15", "3", "-5"] }, { q: "2(x+4)=14 ise x=?", a: "3", d: ["7", "5", "11"] }],
        "Yüzdeler": [{ q: "120'nin %50'si?", a: "60", d: ["50", "70", "24"] }, { q: "80'in %25'i?", a: "20", d: ["16", "25", "40"] }],
        "Dörtgenler": [{ q: "Karenin tüm açıları?", a: "90°", d: ["60°", "45°", "120°"] }, { q: "Yamukta kaç kenar paralel?", a: "2", d: ["0", "4", "1"] }],
        "Çember ve Daire": [{ q: "r yarıçaplı çemberin çevresi?", a: "2πr", d: ["πr", "πr²", "2r"] }, { q: "r yarıçaplı dairenin alanı?", a: "πr²", d: ["2πr", "πr", "r²"] }]
    },
    "8. SINIF": {
        "Üslü İfadeler": [{ q: "2³=?", a: "8", d: ["6", "9", "4"] }, { q: "5²=?", a: "25", d: ["10", "15", "125"] }, { q: "3³=?", a: "27", d: ["9", "81", "18"] }],
        "Kareköklü İfadeler": [{ q: "√9=?", a: "3", d: ["9", "81", "4.5"] }, { q: "√16=?", a: "4", d: ["8", "2", "256"] }, { q: "√25=?", a: "5", d: ["12.5", "625", "10"] }],
        "Özdeşlikler": [{ q: "(x+2)² açılımı?", a: "x²+4x+4", d: ["x²+4", "x²+2x+4", "x²+4x+2"] }, { q: "x²-9=?", a: "(x-3)(x+3)", d: ["(x-9)(x+9)", "(x-3)²", "(x+3)²"] }],
        "Çarpanlara Ayırma": [{ q: "x²+5x=?", a: "x(x+5)", d: ["x²+5", "(x+5)²", "5x²"] }, { q: "2x+4=?", a: "2(x+2)", d: ["2x+2", "(x+4)", "x+2"] }],
        "Olasılık": [{ q: "Yazı-tura yazı olasılığı?", a: "1/2", d: ["1", "1/4", "2"] }, { q: "Zarla 6 gelme olasılığı?", a: "1/6", d: ["1/3", "6", "1"] }],
        "Denklemler": [{ q: "x²=9 ise x=?", a: "±3", d: ["3", "-3", "81"] }, { q: "x²-4=0 ise x=?", a: "±2", d: ["2", "-2", "4"] }],
        "Üçgenler": [{ q: "Üçgenin iç açıları toplamı?", a: "180°", d: ["360°", "90°", "270°"] }, { q: "Eşkenar üçgende her açı?", a: "60°", d: ["90°", "45°", "120°"] }]
    }
};

function generateQuestion() {
    const cls = currentSelection.className, top = currentSelection.topicName;
    const bank = questionBanks[cls]?.[top] || questionBanks["5. SINIF"]["Doğal Sayılar"];
    const q = bank[Math.floor(Math.random() * bank.length)];
    return { q: q.q, a: q.a, opts: [q.a, ...q.d].sort(() => Math.random() - 0.5) };
}

// --- SES ---
const Sound = {
    ctx: null,
    init() { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } },
    play(f, t, d) {
        if (!this.ctx) return;
        try {
            const o = this.ctx.createOscillator(), g = this.ctx.createGain();
            o.type = t; o.frequency.value = f;
            g.gain.setValueAtTime(0.1, this.ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + d);
            o.connect(g); g.connect(this.ctx.destination);
            o.start(); o.stop(this.ctx.currentTime + d);
        } catch (e) { }
    },
    eat() { this.play(300, 'sine', 0.05); },
    correct() { this.play(600, 'sine', 0.1); setTimeout(() => this.play(900, 'sine', 0.2), 100); },
    wrong() { this.play(150, 'sawtooth', 0.3); },
    die() { this.play(200, 'sawtooth', 0.3); }
};

// --- SKOR ---
function loadScores() {
    try { return JSON.parse(localStorage.getItem('mathPacmanScores') || '[]'); } catch (e) { return []; }
}
function saveScore(name, s) {
    try {
        let scores = loadScores();
        scores.push({ name, score: s });
        scores.sort((a, b) => b.score - a.score);
        localStorage.setItem('mathPacmanScores', JSON.stringify(scores.slice(0, 5)));
    } catch (e) { }
}
function displayLeaderboard(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const scores = loadScores();
    el.innerHTML = scores.length ? scores.map(s => `<div class="score-row"><span>${s.name}</span><span>${s.score}</span></div>`).join('') : '<div style="color:#666">Henüz skor yok</div>';
}

// --- EKRAN YÖNETİMİ ---
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(el => el.style.display = 'none');
    if (id) document.getElementById(id).style.display = 'flex';

    // D-pad görünürlüğü
    const dpad = document.getElementById('dpad-container');
    const menuBtn = document.getElementById('game-menu-btn');
    if (id === null) {
        dpad.style.display = 'grid';
        menuBtn.style.display = 'block';
    } else {
        dpad.style.display = 'none';
        menuBtn.style.display = 'none';
    }
}

function goToClasses() {
    const name = document.getElementById('player-name-input').value.trim();
    if (!name) { alert("Lütfen ismini yaz!"); return; }
    playerName = name.toUpperCase();
    Sound.init();

    const grid = document.getElementById('class-grid');
    grid.innerHTML = '';
    Object.keys(curriculum).forEach(cls => {
        const btn = document.createElement('button');
        btn.className = 'class-btn';
        btn.innerText = cls;
        btn.onclick = () => selectClass(cls);
        grid.appendChild(btn);
    });
    showScreen('class-screen');
}

function selectClass(cls) {
    currentSelection.className = cls;
    document.getElementById('topic-title').innerText = cls + ' KONULARI';

    const grid = document.getElementById('topic-grid');
    grid.innerHTML = '';
    curriculum[cls].forEach(topic => {
        const btn = document.createElement('button');
        btn.className = 'topic-btn';
        btn.innerText = topic;
        btn.onclick = () => { currentSelection.topicName = topic; startGame(); };
        grid.appendChild(btn);
    });
    showScreen('topic-screen');
}

function startGame() {
    document.getElementById('current-info-label').innerText = currentSelection.className;
    document.getElementById('current-topic-label').innerText = currentSelection.topicName;
    document.getElementById('player-name-display').innerText = "OYUNCU: " + playerName;

    score = 0; lives = 3; level = 1; powerTime = 0; safeTime = 0;
    askedQuestions.clear();
    updateUI();
    initLevel();
    showScreen(null);
    gameState = 'PLAYING';
    if (gameId) cancelAnimationFrame(gameId);
    gameLoop();
}

function initLevel() {
    initMap();

    // Pacman - alt orta (satır 16, sütun 15-16 arası)
    pacman = {
        x: 15 * TILE + TILE / 2,
        y: 16 * TILE + TILE / 2,
        dir: { x: 0, y: 0 },
        nextDir: { x: 0, y: 0 }
    };

    // Hayaletler - ev içinde (satır 10-11, sütunlar 14-17 arası)
    ghosts = [
        new Ghost(14 * TILE + TILE / 2, 10 * TILE + TILE / 2, 0),
        new Ghost(15 * TILE + TILE / 2, 10 * TILE + TILE / 2, 1),
        new Ghost(16 * TILE + TILE / 2, 10 * TILE + TILE / 2, 2),
        new Ghost(17 * TILE + TILE / 2, 10 * TILE + TILE / 2, 3)
    ];
}

function goToMenu() {
    if (gameId) cancelAnimationFrame(gameId);
    gameState = 'START';
    displayLeaderboard('scores-list');
    showScreen('start-screen');
}

function toggleFS() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => { });
    else document.exitFullscreen().catch(() => { });
}

// --- OYUN DÖNGÜSÜ (30 FPS) ---
let lastFrameTime = 0;
const targetFPS = 30;
const frameInterval = 1000 / targetFPS;

function gameLoop(currentTime) {
    gameId = requestAnimationFrame(gameLoop);

    const deltaTime = currentTime - lastFrameTime;
    if (deltaTime < frameInterval) return;

    lastFrameTime = currentTime - (deltaTime % frameInterval);
    update();
    draw();
}

function update() {
    if (gameState !== 'PLAYING') return;
    frameCount++;
    if (powerTime > 0) powerTime--;
    if (safeTime > 0) safeTime--;

    // Pacman hareketi
    const speed = 4;

    // Dönüş kontrolü
    if (pacman.nextDir.x !== 0 || pacman.nextDir.y !== 0) {
        const col = Math.floor(pacman.x / TILE), row = Math.floor(pacman.y / TILE);
        const cx = col * TILE + TILE / 2, cy = row * TILE + TILE / 2;
        if (Math.abs(pacman.x - cx) <= speed && Math.abs(pacman.y - cy) <= speed) {
            const nc = col + pacman.nextDir.x, nr = row + pacman.nextDir.y;
            if (!isWall(nr, nc)) {
                pacman.x = cx; pacman.y = cy;
                pacman.dir = { ...pacman.nextDir };
                pacman.nextDir = { x: 0, y: 0 };
            }
        }
    }

    // İleri hareket
    if (pacman.dir.x !== 0 || pacman.dir.y !== 0) {
        const nextX = pacman.x + pacman.dir.x * speed;
        const nextY = pacman.y + pacman.dir.y * speed;

        // Tünel kontrolü - sadece satır 10'da
        const currentRow = Math.floor(pacman.y / TILE);
        if (currentRow === 10) {
            if (nextX < TILE / 2) { pacman.x = (COLS - 1) * TILE + TILE / 2; return; }
            if (nextX > (COLS - 1) * TILE + TILE / 2) { pacman.x = TILE / 2; return; }
        }

        const frontX = nextX + pacman.dir.x * (TILE / 2 - 4);
        const frontY = nextY + pacman.dir.y * (TILE / 2 - 4);
        const fc = Math.floor(frontX / TILE), fr = Math.floor(frontY / TILE);

        if (fc >= 0 && fc < COLS && !isWall(fr, fc)) {
            pacman.x = nextX;
            pacman.y = nextY;
        }
    }

    // Yem yeme
    const c = Math.floor(pacman.x / TILE), r = Math.floor(pacman.y / TILE);
    if (map[r]?.[c] === 0) { map[r][c] = 2; score += 10; updateUI(); Sound.eat(); }
    else if (map[r]?.[c] === 3) { map[r][c] = 2; askQuestion(); }

    // Hayaletler
    ghosts.forEach(g => g.update());

    // Çarpışma (sadece 1 hayalet kontrolü)
    if (safeTime <= 0) {
        for (let i = 0; i < ghosts.length; i++) {
            const g = ghosts[i];
            if (g.inHouse) continue;
            if (Math.hypot(g.x - pacman.x, g.y - pacman.y) < TILE * 0.8) {
                if (powerTime > 0) {
                    score += 200; updateUI();
                    showNotif("YAKALADIN!", "#FFFF00");
                    g.reset();
                    break; // Sadece 1 hayalet yenebilir
                } else {
                    handleDeath();
                    break;
                }
            }
        }
    }

    // Seviye tamamlama
    let remaining = false;
    for (let rr = 0; rr < ROWS; rr++) for (let cc = 0; cc < COLS; cc++) if (map[rr][cc] === 0 || map[rr][cc] === 3) remaining = true;
    if (!remaining) {
        level++;
        showNotif("SEVİYE " + level, "#00FF00");
        setTimeout(() => initLevel(), 2000);
    }
}

function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Harita
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const t = map[r][c], px = c * TILE, py = r * TILE;

            if (t === 1) {
                // Duvar - neon çizgi stili
                ctx.strokeStyle = COLORS.wall;
                ctx.lineWidth = 3;
                ctx.shadowColor = COLORS.wallGlow;
                ctx.shadowBlur = 5;

                // Komşulara göre kenar çiz
                const hasTop = r > 0 && map[r - 1][c] === 1;
                const hasBottom = r < ROWS - 1 && map[r + 1][c] === 1;
                const hasLeft = c > 0 && map[r][c - 1] === 1;
                const hasRight = c < COLS - 1 && map[r][c + 1] === 1;

                ctx.beginPath();
                if (!hasTop) { ctx.moveTo(px + 4, py + 4); ctx.lineTo(px + TILE - 4, py + 4); }
                if (!hasBottom) { ctx.moveTo(px + 4, py + TILE - 4); ctx.lineTo(px + TILE - 4, py + TILE - 4); }
                if (!hasLeft) { ctx.moveTo(px + 4, py + 4); ctx.lineTo(px + 4, py + TILE - 4); }
                if (!hasRight) { ctx.moveTo(px + TILE - 4, py + 4); ctx.lineTo(px + TILE - 4, py + TILE - 4); }
                ctx.stroke();
                ctx.shadowBlur = 0;
            } else if (t === 0) {
                ctx.fillStyle = COLORS.dot;
                ctx.beginPath();
                ctx.arc(px + TILE / 2, py + TILE / 2, 3, 0, Math.PI * 2);
                ctx.fill();
            } else if (t === 3) {
                const pulse = 8 + Math.sin(Date.now() / 150) * 2;
                ctx.fillStyle = COLORS.pellet;
                ctx.shadowColor = COLORS.pellet;
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.arc(px + TILE / 2, py + TILE / 2, pulse, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            } else if (t === 4) {
                // Hayalet kapısı
                ctx.fillStyle = '#FFB8FF';
                ctx.fillRect(px + 2, py + TILE / 2 - 3, TILE - 4, 6);
            }
        }
    }

    // Pacman
    ctx.fillStyle = (safeTime > 0 && Math.floor(Date.now() / 100) % 2) ? 'rgba(255,255,0,0.5)' : COLORS.pacman;
    ctx.shadowColor = COLORS.pacman; ctx.shadowBlur = 10;
    ctx.beginPath();
    const mouth = Math.abs(Math.sin(Date.now() / 80)) * 0.3 * Math.PI;
    let angle = 0;
    if (pacman.dir.y === 1) angle = Math.PI / 2;
    if (pacman.dir.x === -1) angle = Math.PI;
    if (pacman.dir.y === -1) angle = Math.PI * 1.5;
    ctx.moveTo(pacman.x, pacman.y);
    ctx.arc(pacman.x, pacman.y, TILE / 2 - 4, angle + mouth, angle + Math.PI * 2 - mouth);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Hayaletler
    ghosts.forEach(g => g.draw());
}

function isWall(r, c) {
    if (r < 0 || r >= ROWS) return true;
    if (c < 0 || c >= COLS) return false; // Tünel için
    const tile = map[r]?.[c];
    // Duvar, hayalet kapısı ve hayalet evi içi Pacman için geçilmez
    return tile === 1 || tile === 4 || tile === 5;
}

// --- KONTROLLER ---
function handleDpad(key) {
    const d = { x: 0, y: 0 };
    if (key === 'ArrowUp') d.y = -1;
    if (key === 'ArrowDown') d.y = 1;
    if (key === 'ArrowLeft') d.x = -1;
    if (key === 'ArrowRight') d.x = 1;
    pacman.nextDir = d;
}
document.addEventListener('keydown', e => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        handleDpad(e.key);
    }
});

// --- SORU SİSTEMİ ---
function askQuestion() {
    gameState = 'QUESTION';
    const data = generateQuestion();

    document.getElementById('math-modal').style.display = 'block';
    document.getElementById('question-text').innerText = data.q;
    document.getElementById('feedback-modal').innerText = "";

    const cont = document.getElementById('options-container');
    cont.innerHTML = "";
    data.opts.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt;
        btn.onclick = () => answer(opt, data.a);
        cont.appendChild(btn);
    });
    startTimer();
}

function startTimer() {
    let t = 20;
    const bar = document.getElementById('timer-bar');
    const text = document.getElementById('timer-text');
    bar.style.width = '100%';
    bar.style.background = 'linear-gradient(to right, #27AE60, #2ECC71)';
    text.innerText = t + ' sn';

    if (questionTimer) clearInterval(questionTimer);
    questionTimer = setInterval(() => {
        t--;
        bar.style.width = (t / 20 * 100) + '%';
        text.innerText = t + ' sn';
        if (t <= 5) bar.style.background = '#E74C3C';
        if (t <= 0) { clearInterval(questionTimer); answer(null, 'x'); }
    }, 1000);
}

function answer(sel, correct) {
    clearInterval(questionTimer);
    const fb = document.getElementById('feedback-modal');
    document.querySelectorAll('.option-btn').forEach(b => {
        b.disabled = true;
        if (b.innerText === correct) b.classList.add('correct');
        else if (b.innerText === sel) b.classList.add('wrong');
    });

    if (sel === correct) {
        fb.style.color = '#2ECC71';
        fb.innerText = "✓ DOĞRU! +500";
        score += 500; powerTime = 300;
        Sound.correct();
    } else {
        fb.style.color = '#E74C3C';
        fb.innerText = "✗ YANLIŞ!";
        Sound.wrong();
    }
    updateUI();

    setTimeout(() => {
        document.getElementById('math-modal').style.display = 'none';
        gameState = 'PLAYING';
        safeTime = 60;
    }, 1500);
}

// --- YARDIMCI ---
function handleDeath() {
    Sound.die();
    lives--;
    updateUI();
    if (lives <= 0) {
        gameState = 'GAMEOVER';
        saveScore(playerName, score);
        document.getElementById('final-score').innerText = score;
        displayLeaderboard('final-scores-list');
        showScreen('game-over-screen');
    } else {
        showNotif("CAN KAYBETTİN!", "#FF0000");
        pacman.x = 15 * TILE + TILE / 2; pacman.y = 16 * TILE + TILE / 2;
        pacman.dir = { x: -1, y: 0 }; // Otomatik sola hareket başla
        pacman.nextDir = { x: 0, y: 0 };

        // Hayaletleri sıfırla ve hemen saldır
        ghosts.forEach(g => g.reset());

        safeTime = 120;
    }
}

function showNotif(msg, color) {
    const n = document.getElementById('notification');
    n.innerText = msg; n.style.color = color;
    n.style.textShadow = `4px 4px 0 #000, 0 0 20px ${color}`;
    n.style.opacity = 1;
    setTimeout(() => n.style.opacity = 0, 2000);
}

function updateUI() {
    document.getElementById('score').innerText = score;
    let hearts = '';
    for (let i = 0; i < lives; i++) hearts += '❤️';
    document.getElementById('lives-display').innerText = hearts || '💔';
}

function resizeGame() {
    const c = document.getElementById('game-container');
    const s = Math.min(window.innerWidth / 1280, window.innerHeight / 720) * 0.95;
    c.style.transform = `scale(${s})`;
}
window.addEventListener('resize', resizeGame);
window.addEventListener('load', () => { resizeGame(); displayLeaderboard('scores-list'); });
displayLeaderboard('scores-list');
