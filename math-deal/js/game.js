// Anlaşmalı Matematik - Deal or No Deal Oyun Mantığı

class DealOrNoDealGame {
    constructor() {
        // Para değerleri (25 kutu)
        this.moneyValues = [
            1, 5, 10, 25, 50, 100, 200, 300, 400, 500, 750, 1000, 5000,
            10000, 20000, 30000, 40000, 50000, 100000, 150000, 200000, 250000, 500000, 750000, 1000000
        ];

        // Oyun durumu
        this.gameMode = 'ai'; // 'ai', 'pvp', 'pvp3', 'pvp4'
        this.gamePhase = 'menu';
        this.boxes = [];
        this.players = []; // { id, name, money, box: null, finished: false, type: 'human'/'ai' }
        this.currentPlayerIndex = 0;

        // Sınıf ve Konu seçimi
        this.selectedGrade = 8; // Varsayılan 8. sınıf
        this.selectedTopic = 'ozdeslik'; // Varsayılan özdeşlikler

        this.boxesOpenedTotal = 0;
        this.selectedBoxId = null;
        this.currentQuestion = null;
        this.soundEnabled = true;

        // Soru zamanlayıcı
        this.questionTimer = 15; // 15 saniye
        this.questionTimerInterval = null;
        this.isAnimating = false; // Animasyon kilidi

        // Final turu (3 Kutu Kuralı)
        this.finalRound = false;
        this.finalRoundBoxesLeft = 0;
        this.finalRoundPlayerIndex = -1;

        // Banka teklifi
        this.bankOfferIntervals = [5, 10, 15, 18, 21];
        this.lastBankOfferAt = 0;
        this.currentBankOffer = 0;

        // Ses efektleri
        this.audioContext = null;
        this.playerName = 'Oyuncu'; // Varsayılan isim

        // Çoklu oyuncu isim girişi
        this.pendingGameMode = null; // Bekleyen oyun modu
        this.playerNames = []; // Toplanan oyuncu isimleri
        this.nameInputPlayerIndex = 0; // Şu an ismi alınan oyuncu indeksi
        this.totalPlayersToName = 0; // Toplam ismi alınacak oyuncu sayısı

        this.init();
    }

    init() {
        this.setupMenuListeners();
        // Ses sistemi ilk tıklamada başlasın
        document.body.addEventListener('click', () => {
            if (!this.audioContext) this.initSounds();
        }, { once: true });
    }

    setupMenuListeners() {
        // Ana menü - İsim girişine git (Oyun başlangıcı)
        this.bindClick('start-btn', () => this.showScreen('name-input-screen'));
        this.bindClick('how-to-play-btn', () => this.showScreen('how-to-play'));
        this.bindClick('back-to-menu-btn', () => this.showScreen('main-menu'));

        // İsim Onayı
        this.bindClick('confirm-name-btn', () => this.confirmName());

        // Zafer Ekranı
        this.bindClick('victory-close-btn', () => {
            document.getElementById('victory-overlay').classList.add('hidden');
            this.showScreen('main-menu');
        });

        // Sınıf seçimi
        this.bindClick('grade-0-btn', () => this.selectGrade(0));
        this.bindClick('grade-5-btn', () => this.selectGrade(5));
        this.bindClick('grade-6-btn', () => this.selectGrade(6));
        this.bindClick('grade-7-btn', () => this.selectGrade(7));
        this.bindClick('grade-8-btn', () => this.selectGrade(8));
        this.bindClick('back-from-grade-btn', () => this.showScreen('main-menu'));

        // Konu seçimi - Dinamik olarak oluşturulacak
        this.bindClick('back-from-topic-btn', () => this.showScreen('grade-select'));

        // Mod seçimi - Önce isim girişine yönlendir
        this.bindClick('vs-ai-btn', () => this.prepareMultiplayerNameInput('ai'));
        this.bindClick('vs-player-btn', () => this.prepareMultiplayerNameInput('pvp'));
        this.bindClick('vs-player-3-btn', () => this.prepareMultiplayerNameInput('pvp3'));
        this.bindClick('vs-player-4-btn', () => this.prepareMultiplayerNameInput('pvp4'));
        this.bindClick('back-from-mode-btn', () => this.showScreen('topic-select'));

        // Oyun içi
        this.bindClick('menu-btn', () => this.goToMenu());
        this.bindClick('sound-btn', () => this.toggleSound());

        // Banka
        this.bindClick('accept-offer-btn', () => this.acceptBankOffer());
        this.bindClick('reject-offer-btn', () => this.rejectBankOffer());

        // Oyun sonu
        this.bindClick('go-menu-btn', () => this.showScreen('main-menu'));
        this.bindClick('play-again-btn', () => this.showScreen('grade-select'));
    }

    // Sınıf seçimi
    selectGrade(grade) {
        this.selectedGrade = grade;
        this.renderTopicSelection();
        this.showScreen('topic-select');
    }

    // Konu seçim ekranını oluştur
    renderTopicSelection() {
        const topics = typeof getTopicsForGrade === 'function' ? getTopicsForGrade(this.selectedGrade) : {};
        const container = document.getElementById('topic-buttons');
        const title = document.getElementById('topic-select-title');

        if (this.selectedGrade === 0) {
            title.textContent = `🧸 Okul Öncesi - Konu Seç`;
        } else {
            title.textContent = `📖 ${this.selectedGrade}. Sınıf - Konu Seç`;
        }
        container.innerHTML = '';

        Object.entries(topics).forEach(([key, topic]) => {
            const btn = document.createElement('button');
            btn.className = 'topic-btn';
            btn.innerHTML = `${topic.icon} ${topic.name}`;
            btn.onclick = () => {
                this.playSound('click');
                this.selectTopic(key);
            };
            container.appendChild(btn);
        });
    }

    // Konu seçimi
    selectTopic(topic) {
        this.selectedTopic = topic;
        this.showScreen('mode-select');
    }

    bindClick(id, handler) {
        const el = document.getElementById(id);
        if (el) {
            // addEventListener kullan - daha güvenilir
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                this.playSound('click');
                handler();
            });
        }
    }

    // ===== SES SİSTEMİ (Web Audio API) =====
    initSounds() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API desteklenmiyor');
        }
    }

    playSound(type) {
        if (!this.soundEnabled || !this.audioContext) return;
        if (this.audioContext.state === 'suspended') this.audioContext.resume();

        switch (type) {
            case 'click': this.playTone(400, 0.1, 'square', 0.2); break;
            case 'correct':
                this.playTone(523, 0.15, 'sine', 0.4);
                setTimeout(() => this.playTone(784, 0.2, 'sine', 0.4), 150);
                break;
            case 'wrong':
                this.playTone(300, 0.3, 'sawtooth', 0.3);
                setTimeout(() => this.playTone(200, 0.4, 'sawtooth', 0.3), 150);
                break;
            case 'boxOpen':
                this.playTone(440, 0.1, 'triangle', 0.3);
                break;
            case 'applause': this.playApplause(); break;
            case 'tuhh': this.playTuhh(); break;
            case 'bigWin':
                this.playTone(523, 0.1, 'sine', 0.5);
                setTimeout(() => this.playTone(659, 0.1, 'sine', 0.5), 100);
                setTimeout(() => this.playTone(784, 0.3, 'sine', 0.5), 200);
                break;
            case 'moneyLoss':
                this.playTone(150, 0.4, 'sawtooth', 0.4);
                break;
            case 'phone': this.playPhoneRing(); break;
            case 'turnChange':
                this.playTone(600, 0.1, 'sine', 0.3);
                break;
        }
    }

    playTone(freq, dur, type = 'sine', vol = 0.5) {
        if (!this.audioContext) return;
        const ctx = this.audioContext;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = type;
        gain.gain.setValueAtTime(vol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);
        osc.start();
        osc.stop(ctx.currentTime + dur);
    }

    playApplause() {
        if (!this.audioContext) return;
        const ctx = this.audioContext;
        const dur = 1.5;
        const bufferSize = ctx.sampleRate * dur;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3 * Math.sin(Math.PI * i / bufferSize);

        const src = ctx.createBufferSource();
        src.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 2000;
        src.connect(filter);
        filter.connect(ctx.destination);
        src.start();
    }

    playPhoneRing() {
        if (!this.audioContext) return;
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.playTone(440, 0.1, 'square', 0.2);
                setTimeout(() => this.playTone(480, 0.1, 'square', 0.2), 150);
            }, i * 400);
        }
    }

    // Tüh sesi - düşük değerli (mavi) kutular için hayal kırıklığı
    playTuhh() {
        if (!this.audioContext) return;
        const ctx = this.audioContext;
        // Düşen ton efekti
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.8);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
        osc.start();
        osc.stop(ctx.currentTime + 0.8);
        // "Aww" sesi
        setTimeout(() => this.playTone(150, 0.4, 'triangle', 0.15), 200);
    }

    // Yüksek/düşük değer eşiği (10.000+ kırmızı = alkış, altı mavi = tüh)
    isHighValue(value) {
        return value >= 10000;
    }

    // ===== OYUN KURULUMU =====
    startBoxSelection(mode) {
        this.gameMode = mode;
        this.gamePhase = 'boxSelect';
        this.currentPlayerIndex = 0;
        this.players = [];

        // Oyuncuları oluştur
        if (mode === 'ai') {
            this.players.push({ id: 1, name: this.playerName || 'Oyuncu', money: 0, box: null, finished: false, type: 'human' });
            this.players.push({ id: 2, name: 'Bilgisayar', money: 0, box: null, finished: false, type: 'ai' });
        } else {
            const playerCount = mode === 'pvp' ? 2 : (mode === 'pvp3' ? 3 : 4);
            for (let i = 1; i <= playerCount; i++) {
                const name = i === 1 ? (this.playerName || 'Oyuncu 1') : `Oyuncu ${i}`;
                this.players.push({ id: i, name: name, money: 0, box: null, finished: false, type: 'human' });
            }
        }

        this.initBoxValues();
        this.renderBoxSelectGrid();

        document.getElementById('box-select-title').textContent = `📦 ${this.players[0].name} - Kutunu Seç!`;
        this.showScreen('box-select');
    }

    initBoxValues() {
        const shuffled = [...this.moneyValues].sort(() => Math.random() - 0.5);
        this.boxes = [];
        for (let i = 0; i < 25; i++) {
            this.boxes.push({ id: i + 1, value: shuffled[i], opened: false, openedBy: null, isPlayerBox: false });
        }
    }

    renderBoxSelectGrid() {
        const grid = document.getElementById('box-select-grid');
        grid.innerHTML = '';
        this.boxes.forEach(box => {
            const el = document.createElement('div');
            el.className = 'box';
            if (this.players.some(p => p.box === box.id)) el.classList.add('reserved');

            el.innerHTML = `<div class="box-3d"><div class="box-top"></div><div class="box-front"><div class="box-number">${box.id}</div></div></div>`;
            el.onclick = () => this.handleBoxSelection(box.id);
            grid.appendChild(el);
        });
    }

    handleBoxSelection(boxId) {
        const player = this.players[this.currentPlayerIndex];
        if (this.players.some(p => p.box === boxId)) return; // Dolu kutu

        this.playSound('select');
        player.box = boxId;
        this.boxes.find(b => b.id === boxId).isPlayerBox = true;

        // Sonraki oyuncuya geç veya oyuna başla
        this.currentPlayerIndex++;
        if (this.currentPlayerIndex < this.players.length) {
            const nextPlayer = this.players[this.currentPlayerIndex];
            if (nextPlayer.type === 'ai') {
                this.aiSelectBox();
            } else {
                document.getElementById('box-select-title').textContent = `📦 ${nextPlayer.name} - Kutunu Seç!`;
                this.renderBoxSelectGrid();
            }
        } else {
            this.startGame();
        }
    }

    aiSelectBox() {
        const available = this.boxes.filter(b => !b.isPlayerBox);
        const randomBox = available[Math.floor(Math.random() * available.length)];
        this.players[1].box = randomBox.id; // AI her zaman player 2
        randomBox.isPlayerBox = true;
        setTimeout(() => this.startGame(), 1000);
    }

    // ===== OYUN BAŞLATMA =====
    startGame() {
        this.newStartGame();
    }

    old_startGame() {
        this.gamePhase = 'playing';
        this.currentPlayerIndex = 0;
        this.boxesOpenedTotal = 0;
        this.lastBankOfferAt = 0;

        // UI Güncelleme (Oyuncu isimleri ve sidebar)
        const p2Name = this.players[1].name;
        document.getElementById('player2-name').textContent = p2Name;
        document.getElementById('sidebar-box-2-label').textContent = p2Name;

        // 3. ve 4. Oyuncular
        const extraPanel = document.getElementById('extra-players-info');
        const p3Panel = document.getElementById('player3-info-panel');
        const p4Panel = document.getElementById('player4-info-panel');

        if (this.players.length > 2) {
            extraPanel.classList.remove('hidden');
            p3Panel.classList.remove('hidden');
            document.getElementById('player3-box').textContent = '?';

            if (this.players.length > 3) {
                p4Panel.classList.remove('hidden');
                document.getElementById('player4-box').textContent = '?';
            } else {
                p4Panel.classList.add('hidden');
            }
        } else {
            extraPanel.classList.add('hidden');
            p3Panel.classList.add('hidden');
            p4Panel.classList.add('hidden');
        }

        document.getElementById('player1-box').textContent = '?';
        document.getElementById('player2-box').textContent = '?';
        document.querySelector('#sidebar-box-1 .sidebar-box-number').textContent = '?';
        document.querySelector('#sidebar-box-2 .sidebar-box-number').textContent = '?';

        this.resetMoneyPanels();
        this.renderGameBoxes();
        this.updateUI();
        this.showScreen('game-screen');
    }

    renderGameBoxes() {
        const container = document.getElementById('boxes-container');
        container.innerHTML = '';
        this.boxes.forEach(box => {
            if (this.players.some(p => p.box === box.id)) return; // Oyuncu kutularını gizle

            const el = document.createElement('div');
            el.className = `box ${box.opened ? 'opened' : ''}`;
            el.innerHTML = `<div class="box-3d"><div class="box-top"></div><div class="box-front"><div class="box-number">${box.id}</div><div class="box-value">${this.formatMoney(box.value)}</div></div></div>`;
            el.onclick = () => this.clickBox(box.id);
            container.appendChild(el);
        });
    }

    // ===== OYNANIŞ =====
    clickBox(boxId) {
        const box = this.boxes.find(b => b.id === boxId);
        const player = this.players[this.currentPlayerIndex];

        if (!box || box.opened || player.type === 'ai') return;

        this.selectedBoxId = boxId;
        this.playSound('click');
        this.showQuestion();
    }

    showQuestion() {
        // Seçilen konuya göre dinamik soru üret
        if (typeof generateQuestion === 'function') {
            this.currentQuestion = generateQuestion(this.selectedTopic);
        } else {
            // Fallback: Mevcut soru havuzundan
            const difficulty = Math.min(4, Math.floor(this.boxesOpenedTotal / 5) + 1);
            const questions = typeof getQuestionsForLevel !== 'undefined' ? getQuestionsForLevel(difficulty) : QUESTIONS;
            this.currentQuestion = questions[Math.floor(Math.random() * questions.length)];
        }

        document.getElementById('selected-box-number').textContent = this.selectedBoxId;
        document.getElementById('question-text').textContent = this.currentQuestion.question;
        const opts = document.getElementById('answer-options');
        opts.innerHTML = '';

        this.currentQuestion.options.forEach((opt, i) => {
            const btn = document.createElement('button');
            btn.className = 'answer-btn';
            btn.textContent = opt;
            btn.onclick = () => this.answerQuestion(i);
            opts.appendChild(btn);
        });

        document.getElementById('question-panel').classList.remove('hidden');

        // Zamanlayıcıyı başlat
        this.startQuestionTimer();
    }

    startQuestionTimer() {
        // Önceki zamanlayıcıyı temizle
        this.clearQuestionTimer();

        let timeLeft = 15;
        // Okul öncesi için süreyi artır
        if (this.selectedGrade === 0) timeLeft = 30;

        const timerDisplay = document.getElementById('question-timer');
        if (timerDisplay) {
            timerDisplay.textContent = timeLeft;
            timerDisplay.classList.remove('warning');
        }

        this.questionTimerInterval = setInterval(() => {
            timeLeft--;
            if (timerDisplay) {
                timerDisplay.textContent = timeLeft;
                if (timeLeft <= 5) {
                    timerDisplay.classList.add('warning');
                    this.playSound('click'); // Tik sesi
                }
            }

            if (timeLeft <= 0) {
                this.clearQuestionTimer();
                // Süre doldu - yanlış cevap gibi işle
                this.timeoutAnswer();
            }
        }, 1000);
    }

    clearQuestionTimer() {
        if (this.questionTimerInterval) {
            clearInterval(this.questionTimerInterval);
            this.questionTimerInterval = null;
        }
    }

    timeoutAnswer() {
        const box = this.boxes.find(b => b.id === this.selectedBoxId);
        const player = this.players[this.currentPlayerIndex];

        // Butonları kilitle ve doğru cevabı göster
        const btns = document.querySelectorAll('.answer-btn');
        btns.forEach((b, i) => {
            b.disabled = true;
            if (i === this.currentQuestion.correct) b.classList.add('correct');
        });

        this.playSound('wrong');

        setTimeout(() => {
            document.getElementById('question-panel').classList.add('hidden');
            this.applyWrongPenalty(player, box);
        }, 1000);
    }

    answerQuestion(index) {
        // Zamanlayıcıyı durdur
        this.clearQuestionTimer();

        const isCorrect = index === this.currentQuestion.correct;
        const box = this.boxes.find(b => b.id === this.selectedBoxId);
        const player = this.players[this.currentPlayerIndex];

        // Butonları kilitle ve renklendir
        const btns = document.querySelectorAll('.answer-btn');
        btns.forEach((b, i) => {
            b.disabled = true;
            if (i === this.currentQuestion.correct) b.classList.add('correct');
            else if (i === index) b.classList.add('wrong');
        });

        if (isCorrect) {
            this.playSound('correct');
            setTimeout(() => {
                document.getElementById('question-panel').classList.add('hidden');
                this.openBox(box, player);
            }, 1000);
        } else {
            this.playSound('wrong');
            // Yanlış cevap: Kutu açılır ve yarım para cezası kesilir!
            setTimeout(() => {
                document.getElementById('question-panel').classList.add('hidden');
                this.applyWrongPenalty(player, box);
            }, 1000);
        }
    }

    applyWrongPenalty(player, box) {
        const penalty = Math.floor(box.value / 2);
        player.money -= penalty;
        // Negatif puan olmasın
        if (player.money < 0) player.money = 0;

        // Yanlış cevapta da kutu açılır ve açık kalır!
        this.openBoxWithPenalty(box, player, penalty);
    }

    // Yanlış cevap sonrası kutu açma (ceza ile)
    openBoxWithPenalty(box, player, penalty) {
        this.playSound('boxOpen');
        const panel = document.getElementById('box-reveal-panel');

        // Kutu numarasını güncelle
        document.getElementById('box-number-reveal').textContent = box.id;

        // Kutu değerini ve cezayı göster
        const revealValue = document.getElementById('reveal-value');
        const revealResult = document.getElementById('reveal-result');

        revealValue.textContent = this.formatMoney(box.value);
        revealResult.textContent = `❌ Yanlış! -${this.formatMoney(penalty)} ceza!`;
        revealResult.classList.remove('hidden');
        revealResult.classList.add('wrong');

        panel.classList.remove('hidden');
        setTimeout(() => document.getElementById('reveal-box').classList.add('opening'), 300);
        setTimeout(() => revealValue.classList.remove('hidden'), 1500);

        // Kutu açıldı olarak işaretle (tekrar kapanmaz!)
        box.opened = true;
        this.boxesOpenedTotal++;

        setTimeout(() => {
            // Değere göre ses efekti çal (Kayıp olduğu için ters mantık)
            // Yüksek meblağ kaybettiysek üzül, düşük meblağ gittiyse sevin
            if (this.isHighValue(box.value)) {
                this.playSound('tuhh'); // Eyvah büyük para gitti!
            } else {
                this.playSound('applause'); // Oh ucuz atlattık!
            }

            setTimeout(() => {
                panel.classList.add('hidden');
                document.getElementById('reveal-box').classList.remove('opening');
                revealValue.classList.add('hidden');
                revealResult.classList.add('hidden');
                revealResult.classList.remove('wrong');

                // Para panelini güncelle
                document.querySelector(`.money-item[data-value="${box.value}"]`)?.classList.add('eliminated');
                this.renderGameBoxes();
                this.updateUI();

                // Final turu kontrolü
                if (this.checkFinalRoundEnd()) {
                    return; // Oyun bitiyor
                }

                // Sıra değişir (final turunda sıra değişmez)
                if (!this.finalRound) {
                    this.nextTurn();
                } else {
                    // Final turunda aynı oyuncu devam eder
                    const player = this.players[this.finalRoundPlayerIndex];
                    if (player.type === 'ai') {
                        setTimeout(() => this.aiTurn(), 1000);
                    }
                }
            }, 2000);
        }, 1500);
    }

    openBox(box, player) {
        this.playSound('boxOpen');
        const panel = document.getElementById('box-reveal-panel');

        // Kutu numarasını güncelle
        document.getElementById('box-number-reveal').textContent = box.id;

        const revealValue = document.getElementById('reveal-value');
        const revealResult = document.getElementById('reveal-result');

        revealValue.textContent = this.formatMoney(box.value);
        revealResult.textContent = '✅ Doğru! Para kazanıldı!';
        revealResult.classList.remove('hidden');
        revealResult.classList.add('correct');

        panel.classList.remove('hidden');
        setTimeout(() => document.getElementById('reveal-box').classList.add('opening'), 300);
        setTimeout(() => revealValue.classList.remove('hidden'), 1500);

        player.money += box.value;
        box.opened = true;
        this.boxesOpenedTotal++;

        setTimeout(() => {
            // Değere göre ses efekti çal
            if (this.isHighValue(box.value)) {
                this.playSound('applause'); // Yüksek değer - alkış!
            } else {
                this.playSound('tuhh'); // Düşük değer - tüh
            }

            setTimeout(() => {
                panel.classList.add('hidden');
                document.getElementById('reveal-box').classList.remove('opening');
                revealValue.classList.add('hidden');
                revealResult.classList.add('hidden');
                revealResult.classList.remove('correct');

                // Paneli güncelle
                document.querySelector(`.money-item[data-value="${box.value}"]`)?.classList.add('eliminated');
                this.renderGameBoxes();
                this.updateUI();

                // Final turu kontrolü
                if (this.checkFinalRoundEnd()) {
                    return; // Oyun bitiyor
                }

                // Oyun sonu veya sıra değişimi kontrolü
                if (this.finalRound) {
                    // Final turunda aynı oyuncu devam eder
                    const player = this.players[this.finalRoundPlayerIndex];
                    if (player.type === 'ai') {
                        setTimeout(() => this.aiTurn(), 1000);
                    }
                } else if (this.shouldShowBankOffer()) {
                    this.showBankOffer();
                } else {
                    this.nextTurn();
                }
            }, 2000);
        }, 1500);
    }

    nextTurn() {
        // Sıradaki bitmemiş oyuncuyu bul
        let nextIndex = (this.currentPlayerIndex + 1) % this.players.length;
        let loopCount = 0;

        while (this.players[nextIndex].finished && loopCount < this.players.length) {
            nextIndex = (nextIndex + 1) % this.players.length;
            loopCount++;
        }

        if (loopCount >= this.players.length) {
            this.endGame();
            return;
        }

        this.currentPlayerIndex = nextIndex;
        this.updateUI();
        this.playSound('turnChange');

        // Eğer bitmemiş tek oyuncu kaldıysa ve diğer kutular bittiyse oyun biter
        const activePlayers = this.players.filter(p => !p.finished);
        const remainingBoxes = this.boxes.filter(b => !b.opened && !b.isPlayerBox);

        if (remainingBoxes.length === 0 && activePlayers.length > 0) {
            this.endGame();
            return;
        }

        // AI sırası ise otomatik oyna - biraz daha geç tetikle
        if (this.players[this.currentPlayerIndex].type === 'ai') {
            setTimeout(() => {
                // Double check: hala AI sırası mı ve oyun devam ediyor mu
                if (this.players[this.currentPlayerIndex].type === 'ai' &&
                    !this.players[this.currentPlayerIndex].finished &&
                    this.gamePhase === 'playing') {
                    this.aiTurn();
                }
            }, 1500);
        }
    }

    aiTurn() {
        // AI oynama mantığı
        const available = this.boxes.filter(b => !b.opened && !b.isPlayerBox);
        if (available.length === 0) { this.endGame(); return; }

        const box = available[Math.floor(Math.random() * available.length)];
        this.selectedBoxId = box.id;

        // Düşünme efekti
        document.getElementById('ai-thinking-panel').classList.remove('hidden');
        document.getElementById('ai-box-number').textContent = box.id;

        setTimeout(() => {
            document.getElementById('ai-thinking-panel').classList.add('hidden');
            const isCorrect = Math.random() < 0.92; // %92 Doğru bilme ihtimali (neredeyse hep doğru)

            if (isCorrect) {
                this.playSound('correct');
                this.openBox(box, this.players[this.currentPlayerIndex]);
            } else {
                this.playSound('wrong');
                this.applyWrongPenalty(this.players[this.currentPlayerIndex], box);
            }
        }, 2000);
    }

    // ===== BANKA =====
    shouldShowBankOffer() {
        for (const interval of this.bankOfferIntervals) {
            if (this.boxesOpenedTotal >= interval && this.lastBankOfferAt < interval) {
                this.lastBankOfferAt = interval;
                return true;
            }
        }
        return false;
    }

    showBankOffer() {
        this.playSound('phone');
        const player = this.players[this.currentPlayerIndex];

        // Kalan kutuları analiz et
        const remainingBoxes = this.boxes.filter(b => !b.opened);
        const sum = remainingBoxes.reduce((s, b) => s + b.value, 0);
        const avg = sum / remainingBoxes.length;

        // Yüksek değerli kutu oranı (10.000+ TL)
        const highValueCount = remainingBoxes.filter(b => b.value >= 10000).length;
        const highValueRatio = highValueCount / remainingBoxes.length;

        // Kafa karıştırıcı teklif:
        // - Yüksek değerli kutu çoksa düşük teklif (oyuncu devam etsin)
        // - Yüksek değerli kutu azsa yüksek teklif (oyuncu kabul etsin)
        const baseMultiplier = 0.55 + (1 - highValueRatio) * 0.35; // 0.55 - 0.90 arası

        // Kalan kutu sayısına göre bonus (az kutu = daha iyi teklif)
        const boxBonus = 1 + (0.15 * (25 - remainingBoxes.length) / 25);

        let offer = Math.floor(avg * baseMultiplier * boxBonus);

        // Teklif oyuncunun mevcut parasından az olmamalı
        offer = Math.max(offer, Math.floor(player.money * 0.85));

        // Minimum teklif: kalan en düşük değerin 2 katı
        const minValue = Math.min(...remainingBoxes.map(b => b.value));
        offer = Math.max(offer, minValue * 2);

        this.currentBankOffer = offer;

        // AI ise kendi karar versin
        if (player.type === 'ai') {
            document.getElementById('bank-panel').classList.remove('hidden');
            setTimeout(() => this.aiDecideBankOffer(offer, avg), 2000);
        } else {
            // İnsan oyuncu için UI göster
            document.getElementById('bank-panel').classList.remove('hidden');
            document.getElementById('bank-offer-player').textContent = `📣 ${player.name} için`;
            document.getElementById('bank-offer').textContent = this.formatMoney(offer);
            document.getElementById('bank-amount').textContent = this.formatMoney(offer);
            document.getElementById('bank-offer-reveal').classList.remove('hidden');
        }
    }

    aiDecideBankOffer(offer, avg) {
        // AI Karar Mantığı - PROFESYONEL VE AÇ GÖZLÜ (Büyük Ödül Canavarı)

        const remainingBoxes = this.boxes.filter(b => !b.opened);
        const count = remainingBoxes.length;
        const has1M = remainingBoxes.some(b => b.value === 1000000);
        const has750k = remainingBoxes.some(b => b.value === 750000);
        const has500k = remainingBoxes.some(b => b.value === 500000);
        const has250k = remainingBoxes.some(b => b.value === 250000);

        let shouldAccept = false;

        if (has1M) {
            // 1 Milyon Varsa: 850k altını REDDET.
            if (offer > 850000) shouldAccept = true;
            else shouldAccept = false;
        }
        else if (has750k) {
            // 750k Varsa: 620k altını REDDET.
            if (offer > 620000) shouldAccept = true;
            else shouldAccept = false;
        }
        else if (has500k) {
            // 500k Varsa: 410k altını REDDET.
            if (offer > 410000) shouldAccept = true;
            else shouldAccept = false;
        }
        else if (has250k) {
            // 250k Varsa: 200k altını REDDET.
            if (offer > 200000) shouldAccept = true;
            else shouldAccept = false;
        }
        else {
            if (offer < avg) {
                shouldAccept = false;
            } else {
                const betterBoxes = remainingBoxes.filter(b => b.value > offer).length;
                const probBetter = betterBoxes / count;
                if (probBetter >= 0.40) shouldAccept = false;
                else shouldAccept = true;
            }
        }

        if (shouldAccept) {
            this.playSound('applause');
            const player = this.players[this.currentPlayerIndex];
            player.money = offer;
            player.finished = true;
            document.getElementById('bank-panel').classList.add('hidden');

            // 3 Kutu Kuralı: Diğer oyuncuya 3 kutu hakkı ver
            this.showDealAcceptedNotification(player, offer);
        } else {
            this.playSound('click');
            document.getElementById('bank-panel').classList.add('hidden');
            this.nextTurn();
        }
    }

    acceptBankOffer() {
        this.playSound('applause');
        const player = this.players[this.currentPlayerIndex];
        player.money = this.currentBankOffer;
        player.finished = true;
        document.getElementById('bank-panel').classList.add('hidden');

        // Bildirim göster ve sonra final turuna geç
        this.showDealAcceptedNotification(player, this.currentBankOffer);
    }

    rejectBankOffer() {
        this.playSound('click');
        document.getElementById('bank-panel').classList.add('hidden');
        this.nextTurn();
    }

    // ===== 3 KUTU KURALI - FİNAL TURU =====
    showDealAcceptedNotification(player, amount) {
        const notif = document.getElementById('deal-accepted-notification');
        if (notif) {
            document.getElementById('notif-player-name').textContent = player.name;
            document.getElementById('notif-amount').textContent = this.formatMoney(amount);

            notif.classList.remove('hidden');
            this.playSound('applause');

            setTimeout(() => {
                notif.classList.add('hidden');

                const activePlayers = this.players.filter(p => !p.finished);
                if (activePlayers.length <= 1) {
                    this.startFinalRound();
                } else {
                    this.updateUI();
                    this.nextTurn();
                }
            }, 3000);
        } else {
            const activePlayers = this.players.filter(p => !p.finished);
            if (activePlayers.length <= 1) this.startFinalRound();
            else this.nextTurn();
        }
    }

    startFinalRound() {
        // Bitirmemiş oyuncuyu bul
        const remainingPlayerIndex = this.players.findIndex(p => !p.finished);

        if (remainingPlayerIndex === -1) {
            // Herkes bitirdi, oyun biter
            this.endGame();
            return;
        }

        this.finalRound = true;
        this.finalRoundBoxesLeft = 3;
        this.finalRoundPlayerIndex = remainingPlayerIndex;
        this.currentPlayerIndex = remainingPlayerIndex;

        // Final turu bildirimi göster
        this.showFinalRoundNotification();
    }

    showFinalRoundNotification() {
        const player = this.players[this.finalRoundPlayerIndex];
        const notification = document.getElementById('final-round-panel');

        if (notification) {
            document.getElementById('final-round-player-name').textContent = player.name;
            notification.classList.remove('hidden');

            setTimeout(() => {
                notification.classList.add('hidden');
                this.updateUI();

                // Eğer AI sırası ise otomatik oyna
                if (player.type === 'ai') {
                    setTimeout(() => this.aiTurn(), 1000);
                }
            }, 2500);
        } else {
            // Panel yoksa direkt devam et
            this.updateUI();
            if (player.type === 'ai') {
                setTimeout(() => this.aiTurn(), 1000);
            }
        }
    }

    // Final turunda kutu açıldıktan sonra kontrol
    checkFinalRoundEnd() {
        if (this.finalRound) {
            this.finalRoundBoxesLeft--;

            // Final tur göstergesini güncelle
            this.updateFinalRoundIndicator();

            if (this.finalRoundBoxesLeft <= 0) {
                // 3 kutu açıldı, oyun biter
                setTimeout(() => this.endGame(), 1500);
                return true;
            }
        }
        return false;
    }

    updateFinalRoundIndicator() {
        const indicator = document.getElementById('final-round-indicator');
        if (indicator && this.finalRound) {
            indicator.classList.remove('hidden');
            document.getElementById('final-round-boxes-left').textContent = this.finalRoundBoxesLeft;
        }
    }

    // ===== OYUN SONU =====
    endGame() {
        this.playSound('bigWin');
        this.gamePhase = 'ended';

        // Final tur göstergesini gizle
        const indicator = document.getElementById('final-round-indicator');
        if (indicator) indicator.classList.add('hidden');

        // Final turunu sıfırla
        this.finalRound = false;
        this.finalRoundBoxesLeft = 0;

        // Tüm oyuncuların kendi kutularını aç ve paralarına ekle
        this.players.forEach(p => {
            const playerBox = this.boxes.find(b => b.id === p.box);
            if (playerBox) {
                // Sadece anlaşma yapmamış (sona kalmış) oyuncular kutudaki parayı alır (Kasa + Kutu)
                if (!p.finished) {
                    p.money += playerBox.value;
                }
                // Anlaşma yapanlar zaten bankadan parayı aldı, kutu değeri eklenmez.
            }
        });

        // Kazananı bul
        const sorted = [...this.players].sort((a, b) => b.money - a.money);
        const winner = sorted[0];

        // ZAFER KUTLAMASI (Sadece İnsan kazandıysa)
        if (winner.type === 'human') {
            setTimeout(() => this.showVictoryEffect(winner.name), 1500);
        }

        // UI Doldur
        document.getElementById('winner-title').textContent = `${winner.name} Kazandı!`;
        document.getElementById('final-player1-money').textContent = this.formatMoney(this.players[0].money);
        document.getElementById('final-player1-box').textContent = this.players[0].box;

        const winningBoxVal = this.boxes.find(b => b.id === this.players[0].box).value;
        document.getElementById('final-player1-box-value').textContent = `Kutu: ${this.formatMoney(winningBoxVal)}`;

        // Player 2 / AI
        if (this.players[1]) {
            document.getElementById('final-player2-money').textContent = this.formatMoney(this.players[1].money);
            document.getElementById('final-player2-box').textContent = this.players[1].box;
            const p2BoxVal = this.boxes.find(b => b.id === this.players[1].box).value;
            document.getElementById('final-player2-box-value').textContent = `Kutu: ${this.formatMoney(p2BoxVal)}`;
        }

        this.showScreen('game-over');
    }

    // ===== YARDIMCI =====
    updateUI() {
        this.newUpdateUI();
    }

    old_updateUI() {
        const p1 = this.players[0];
        const p2 = this.players[1];

        // Para durumları
        document.getElementById('player1-money').textContent = this.formatMoney(p1.money);
        if (p2) document.getElementById('player2-money').textContent = this.formatMoney(p2.money);

        // Sıra göstergesi
        const currentP = this.players[this.currentPlayerIndex];

        // Çoklu oyuncuda isim güncelle
        if (this.players.length > 2) {
            document.querySelector('.player1-info .player-name').textContent = currentP.name;
            document.getElementById('player1-turn').innerHTML = "◀ SIRA SİZDE";
            document.getElementById('player1-turn').classList.add('active');
            document.getElementById('player2-turn').classList.remove('active');
        } else {
            // 2 kişilik standart mod
            if (this.currentPlayerIndex === 0) {
                document.getElementById('player1-turn').classList.add('active');
                document.getElementById('player2-turn').classList.remove('active');
            } else {
                document.getElementById('player1-turn').classList.remove('active');
                document.getElementById('player2-turn').classList.add('active');
            }
        }

        // Çoklu oyuncu (3 ve 4) para güncellemeleri
        if (this.players.length > 2) {
            const p3 = this.players[2];
            if (p3) {
                document.getElementById('player3-money').textContent = this.formatMoney(p3.money);
                if (this.currentPlayerIndex === 2) document.getElementById('player3-turn').classList.add('active');
                else document.getElementById('player3-turn').classList.remove('active');

                // Finished state
                if (p3.finished) {
                    document.getElementById('player3-info-panel').classList.add('finished');
                    document.getElementById('player3-turn').textContent = 'ANLAŞTI';
                }
            }

            const p4 = this.players[3];
            if (p4) {
                document.getElementById('player4-money').textContent = this.formatMoney(p4.money);
                if (this.currentPlayerIndex === 3) document.getElementById('player4-turn').classList.add('active');
                else document.getElementById('player4-turn').classList.remove('active');

                if (p4.finished) {
                    document.getElementById('player4-info-panel').classList.add('finished');
                    document.getElementById('player4-turn').textContent = 'ANLAŞTI';
                }
            }
        }

        // P1 ve P2 finished state
        if (p1.finished) {
            document.querySelector('.player1-info').classList.add('finished');
            document.getElementById('player1-turn').textContent = 'ANLAŞTI';
            document.getElementById('player1-turn').classList.add('active');
            document.getElementById('player1-turn').style.background = '#6b7280'; // Gray
        }

        if (p2.finished) {
            document.querySelector('.player2-info').classList.add('finished');
            document.getElementById('player2-turn').textContent = 'ANLAŞTI';
            document.getElementById('player2-turn').classList.add('active');
            document.getElementById('player2-turn').style.background = '#6b7280'; // Gray
        }

        const rem = this.boxes.filter(b => !b.opened && !b.isPlayerBox).length;
        document.getElementById('boxes-count').textContent = rem;
    }

    formatMoney(val) {
        if (val >= 1000000) return (val / 1000000).toFixed(1).replace('.0', '') + ' Milyon TL';
        if (val >= 1000) return val.toLocaleString('tr-TR') + ' TL';
        return val + ' TL';
    }

    showScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(id).classList.add('active');
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        document.getElementById('sound-btn').textContent = this.soundEnabled ? '🔊' : '🔇';
    }

    goToMenu() {
        if (confirm('Çıkmak istediğine emin misin?')) {
            this.showScreen('main-menu');
            this.gamePhase = 'menu';
            // Para panellerini sıfırla
            this.resetMoneyPanels();
        }
    }

    resetMoneyPanels() {
        this.newResetMoneyPanels();
    }

    old_resetMoneyPanels() {
        document.querySelectorAll('.money-item').forEach(d => d.classList.remove('eliminated'));

        // Bildirimleri ve ekstra panelleri gizle
        document.getElementById('deal-accepted-notification').classList.add('hidden');
        document.getElementById('final-round-panel').classList.add('hidden');
        document.getElementById('final-round-indicator').classList.add('hidden');
        document.getElementById('bank-panel').classList.add('hidden');

        // Oyuncu panellerini sıfırla
        document.querySelectorAll('.player-info').forEach(el => {
            el.classList.remove('finished');
            el.classList.remove('active'); // Sıra aktifliğini kaldır
        });

        // Ekstra oyuncu panellerini gizle
        document.getElementById('extra-players-info').classList.add('hidden');
        document.getElementById('player3-info-panel').classList.add('hidden');
        document.getElementById('player4-info-panel').classList.add('hidden');

        // Sıra göstergelerini sıfırla
        document.querySelectorAll('.turn-indicator').forEach(el => {
            el.textContent = 'SIRA';
            el.classList.remove('active');
            el.style.background = '';
        });

        // Oyun durumunu sıfırla
        this.finalRound = false;
        this.finalRoundBoxesLeft = 0;
        this.currentBankOffer = 0;
    }

    initPlayerDashboard() {
        const container = document.getElementById('players-grid');
        if (!container) return;

        container.innerHTML = '';

        this.players.forEach((p, index) => {
            const card = document.createElement('div');
            card.className = 'player-card';
            card.id = `p-card-${index}`;
            card.dataset.index = index;

            let avatar = '👤';
            if (p.type === 'ai') avatar = '🤖';

            card.innerHTML = `
                <div class="player-card-header">
                    <div class="player-avatar">${avatar}</div>
                    <div class="player-name">${p.name}</div>
                </div>
                <div class="player-card-body">
                    <div class="player-box-info">
                        <span class="box-icon">📦</span>
                        <span class="box-num" id="p-box-${index}">?</span>
                    </div>
                    <div class="player-money" id="p-money-${index}">0 TL</div>
                </div>
                <div class="turn-badge" id="p-badge-${index}">SIRA SİZDE</div>
                <div class="finished-badge">🤝</div>
            `;
            container.appendChild(card);
        });
    }

    newStartGame() {
        this.gamePhase = 'playing';
        this.currentPlayerIndex = 0;
        this.boxesOpenedTotal = 0;
        this.lastBankOfferAt = 0;

        this.initPlayerDashboard();
        this.newResetMoneyPanels();
        this.renderGameBoxes();
        this.updateUI();
        this.showScreen('game-screen');
    }

    newResetMoneyPanels() {
        document.querySelectorAll('.money-item').forEach(d => d.classList.remove('eliminated'));

        document.getElementById('deal-accepted-notification').classList.add('hidden');
        document.getElementById('final-round-panel').classList.add('hidden');
        document.getElementById('final-round-indicator').classList.add('hidden');
        document.getElementById('bank-panel').classList.add('hidden');

        // Reset Player Cards
        document.querySelectorAll('.player-card').forEach(el => {
            el.classList.remove('finished');
            el.classList.remove('active-turn');
        });

        this.finalRound = false;
        this.finalRoundBoxesLeft = 0;
        this.currentBankOffer = 0;
    }

    newUpdateUI() {
        // Dashboard güncellemesi
        this.players.forEach((p, index) => {
            const card = document.getElementById(`p-card-${index}`);
            if (!card) return;

            // Sıra kimde?
            if (index === this.currentPlayerIndex && !p.finished) {
                card.classList.add('active-turn');
                const badge = document.getElementById(`p-badge-${index}`);
                if (badge) badge.textContent = (p.type === 'human' && index === 0) ? "SIRA SİZDE" : "SIRA";
            } else {
                card.classList.remove('active-turn');
            }

            // Para
            const moneyEl = document.getElementById(`p-money-${index}`);
            if (moneyEl) moneyEl.textContent = this.formatMoney(p.money);

            // Kutu
            const boxEl = document.getElementById(`p-box-${index}`);
            if (boxEl) boxEl.innerText = p.box || '?';

            // Finished Durumu
            if (p.finished) {
                card.classList.add('finished');
                const badge = document.getElementById(`p-badge-${index}`);
                if (badge) badge.textContent = "ANLAŞTI";
            } else {
                card.classList.remove('finished');
            }
        });

        const rem = this.boxes.filter(b => !b.opened && !b.isPlayerBox).length;
        const countEl = document.getElementById('boxes-count');
        if (countEl) countEl.textContent = rem;

        // Banka teklifini güncelle (üst panel)
        const bankOfferEl = document.getElementById('bank-offer');
        if (bankOfferEl) {
            bankOfferEl.textContent = this.currentBankOffer > 0 ? this.formatMoney(this.currentBankOffer) : '-';
        }

        // Final Turu Göstergesi
        if (this.updateFinalRoundIndicator) this.updateFinalRoundIndicator();
    }

    // Çoklu oyuncu isim girişi için hazırlık
    prepareMultiplayerNameInput(mode) {
        this.pendingGameMode = mode;
        this.playerNames = [];
        this.nameInputPlayerIndex = 0;

        // Oyun moduna göre toplam oyuncu sayısını belirle (İnsanlar için)
        if (mode === 'ai') {
            this.totalPlayersToName = 1; // Sadece insan oyuncu
        } else if (mode === 'pvp') {
            this.totalPlayersToName = 2;
        } else if (mode === 'pvp3') {
            this.totalPlayersToName = 3;
        } else {
            this.totalPlayersToName = 4;
        }

        // İlk oyuncu için isim giriş ekranını göster
        this.showNameInputForPlayer(0);
    }

    // Belirli bir oyuncu için isim giriş ekranını güncelle
    showNameInputForPlayer(playerIndex) {
        const titleEl = document.getElementById('name-input-title');
        const descEl = document.getElementById('name-input-desc');
        const input = document.getElementById('player-name-input');

        const playerNum = playerIndex + 1;

        if (this.totalPlayersToName === 1) {
            titleEl.textContent = '👋 Merhaba!';
            descEl.textContent = 'Yarışmacının adını girelim:';
        } else {
            titleEl.textContent = `👤 Oyuncu ${playerNum}`;
            descEl.textContent = `${playerNum}. oyuncunun adını girin (${playerNum}/${this.totalPlayersToName}):`;
        }

        input.value = `Oyuncu ${playerNum}`;
        input.focus();
        input.select();

        this.showScreen('name-input-screen');
    }

    confirmName() {
        const input = document.getElementById('player-name-input');
        const name = input && input.value.trim() ? input.value.trim() : `Oyuncu ${this.nameInputPlayerIndex + 1}`;

        // İsmi kaydet
        this.playerNames.push(name);

        // Eğer ana menüden geldiyse (eski akış)
        if (!this.pendingGameMode) {
            this.playerName = name;
            this.showScreen('grade-select');
            return;
        }

        // Çoklu oyuncu isim girişi akışı
        this.nameInputPlayerIndex++;

        if (this.nameInputPlayerIndex < this.totalPlayersToName) {
            // Sıradaki oyuncu için isim al
            this.showNameInputForPlayer(this.nameInputPlayerIndex);
        } else {
            // Tüm isimler alındı, oyunu başlat
            this.playerName = this.playerNames[0]; // İlk oyuncu ismi (eski uyumluluk için)
            this.startBoxSelectionWithNames(this.pendingGameMode);
        }
    }

    // İsimler toplandıktan sonra kutu seçimine geç
    startBoxSelectionWithNames(mode) {
        this.gameMode = mode;
        this.gamePhase = 'boxSelect';
        this.currentPlayerIndex = 0;
        this.players = [];

        // Oyuncuları oluştur (toplanan isimlerle)
        if (mode === 'ai') {
            this.players.push({ id: 1, name: this.playerNames[0] || 'Oyuncu', money: 0, box: null, finished: false, type: 'human' });
            this.players.push({ id: 2, name: 'Bilgisayar', money: 0, box: null, finished: false, type: 'ai' });
        } else {
            const playerCount = mode === 'pvp' ? 2 : (mode === 'pvp3' ? 3 : 4);
            for (let i = 0; i < playerCount; i++) {
                const name = this.playerNames[i] || `Oyuncu ${i + 1}`;
                this.players.push({ id: i + 1, name: name, money: 0, box: null, finished: false, type: 'human' });
            }
        }

        this.initBoxValues();
        this.renderBoxSelectGrid();

        document.getElementById('box-select-title').textContent = `📦 ${this.players[0].name} - Kutunu Seç!`;
        this.showScreen('box-select');

        // Bekleyen modu temizle
        this.pendingGameMode = null;
    }

    showVictoryEffect(winnerName) {
        const overlay = document.getElementById('victory-overlay');
        const msg = document.getElementById('victory-message');
        if (overlay && msg) {
            msg.textContent = `Tebrikler ${winnerName}!`;
            overlay.classList.remove('hidden');
            this.playSound('applause');
            // Victory music or confetti trigger
        }
    }
}

window.onload = () => new DealOrNoDealGame();
