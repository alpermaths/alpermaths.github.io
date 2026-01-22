// Kapsamlı Soru Bankası - 5-8. Sınıf Matematik
// Dinamik soru üretimi - GENİŞLETİLMİŞ SÜRÜM

// ===== SINIF VE KONU YAPISI (MEB Müfredatı) =====
const CURRICULUM = {
    0: {
        name: 'Okul Öncesi',
        topics: {
            'okul-toplama': { name: 'Toplama', icon: '➕' },
            'okul-cikarma': { name: 'Çıkarma', icon: '➖' },
            'okul-sekiller': { name: 'Şekiller ve Sayılar', icon: '⭐' },
            'okul-karisik': { name: 'Karışık', icon: '🎲' }
        }
    },
    5: {
        name: '5. Sınıf',
        topics: {
            'dogal-sayilar': { name: 'Doğal Sayılar', icon: '🔢' },
            'kesirler': { name: 'Kesirler', icon: '🥧' },
            'ondalik': { name: 'Ondalık Gösterim', icon: '📊' },
            'yuzde': { name: 'Yüzdeler', icon: '💯' },
            'geometri-5': { name: 'Geometrik Şekiller', icon: '📐' },
            'alan-cevre-5': { name: 'Alan ve Çevre', icon: '📏' }
        }
    },
    6: {
        name: '6. Sınıf',
        topics: {
            'dogal-islemler': { name: 'Doğal Sayılarla İşlemler', icon: '🔢' },
            'carpanlar-katlar': { name: 'Çarpanlar ve Katlar', icon: '✖️' },
            'tam-sayilar': { name: 'Tam Sayılar', icon: '➕➖' },
            'kesir-islemler': { name: 'Kesirlerle İşlemler', icon: '🥧' },
            'oran': { name: 'Oran', icon: '⚖️' },
            'cebir-6': { name: 'Cebirsel İfadeler', icon: '🔤' },
            'alan-olcme': { name: 'Alan Ölçme', icon: '📏' }
        }
    },
    7: {
        name: '7. Sınıf',
        topics: {
            'tam-islemler': { name: 'Tam Sayılarla İşlemler', icon: '➕➖' },
            'rasyonel': { name: 'Rasyonel Sayılar', icon: '🔢' },
            'cebir-7': { name: 'Cebirsel İfadeler', icon: '🔤' },
            'denklem-7': { name: 'Denklemler', icon: '⚖️' },
            'oran-oranti': { name: 'Oran ve Orantı', icon: '📊' },
            'yuzde-7': { name: 'Yüzdeler', icon: '💯' },
            'cokgenler': { name: 'Çokgenler', icon: '📐' }
        }
    },
    8: {
        name: '8. Sınıf',
        topics: {
            'carpanlar-8': { name: 'EBOB-EKOK', icon: '🔢' },
            'uslu': { name: 'Üslü İfadeler', icon: '📈' },
            'karekok': { name: 'Kareköklü İfadeler', icon: '√' },
            'ozdeslik': { name: 'Özdeşlikler', icon: '🔷' },
            'denklem-8': { name: 'Doğrusal Denklemler', icon: '⚖️' },
            'esitsizlik': { name: 'Eşitsizlikler', icon: '⚡' },
            'ucgenler': { name: 'Üçgenler', icon: '📐' },
            'olasilik': { name: 'Olasılık', icon: '🎲' }
        }
    }
};

// ===== DİNAMİK SORU ÜRETİCİLERİ =====
const QuestionGenerators = {
    rand: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
    pick: (arr) => arr[Math.floor(Math.random() * arr.length)],

    wrongAnswers: (correct, count = 3, spread = 15, noNegative = false) => {
        const wrongs = new Set();
        let attempts = 0;
        while (wrongs.size < count && attempts < 100) {
            let offset = QuestionGenerators.rand(-spread, spread);
            if (offset === 0) offset = QuestionGenerators.rand(1, 5);
            const wrong = correct + offset;
            // Negatif sayıları filtrele (doğal sayılar için)
            if (noNegative && wrong < 0) {
                attempts++;
                continue;
            }
            if (wrong !== correct && !wrongs.has(wrong)) {
                wrongs.add(wrong);
            }
            attempts++;
        }
        return Array.from(wrongs);
    },

    shuffleWithCorrect: (correct, wrongs) => {
        // Doğru cevabı bir marker objesi ile takip et (indexOf hatası önleme)
        const correctMarker = { value: correct, isCorrect: true };
        const all = [correctMarker, ...wrongs.map(w => ({ value: w, isCorrect: false }))];

        // Fisher-Yates shuffle
        for (let i = all.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [all[i], all[j]] = [all[j], all[i]];
        }

        // Shuffle sonrası doğru cevabın index'ini bul
        const correctIndex = all.findIndex(item => item.isCorrect);

        return {
            options: all.map(item => String(item.value)),
            correct: correctIndex
        };
    },

    // ===== OKUL ÖNCESİ =====
    preschoolToplama: () => {
        const a = QuestionGenerators.rand(10, 50);
        const b = QuestionGenerators.rand(1, 9);
        const q = `${a} + ${b} = ?`;
        const ans = a + b;
        const { options, correct } = QuestionGenerators.shuffleWithCorrect(ans, QuestionGenerators.wrongAnswers(ans, 3, 5));
        return { question: q, options, correct, difficulty: 1 };
    },

    preschoolCikarma: () => {
        const a = QuestionGenerators.rand(10, 50);
        const b = QuestionGenerators.rand(1, 9);
        const q = `${a} - ${b} = ?`;
        const ans = a - b;
        const { options, correct } = QuestionGenerators.shuffleWithCorrect(ans, QuestionGenerators.wrongAnswers(ans, 3, 5));
        return { question: q, options, correct, difficulty: 1 };
    },

    preschoolSekiller: () => {
        const type = QuestionGenerators.rand(1, 10);
        let q, options, correct;

        switch (type) {
            case 1: q = 'Üçgenin kaç kenarı vardır?'; options = ['3', '4', '2', '5']; correct = 0; break;
            case 2: q = 'Karenin kaç kenarı vardır?'; options = ['4', '3', '5', '6']; correct = 0; break;
            case 3: q = 'Hangi şekil yuvarlaktır?'; options = ['Daire', 'Kare', 'Üçgen', 'Dikdörtgen']; correct = 0; break;
            case 4: q = 'Bir elin kaç parmağı vardır?'; options = ['5', '4', '6', '10']; correct = 0; break;
            case 5: q = 'Hangi sayı 5\'ten sonra gelir?'; options = ['6', '4', '7', '3']; correct = 0; break;
            case 6: q = '10\'dan geriye sayarken 10, 9, ...?'; options = ['8', '7', '11', '12']; correct = 0; break;
            case 7: q = 'Hangi şeklin köşesi yoktur?'; options = ['Daire', 'Kare', 'Üçgen', 'Dikdörtgen']; correct = 0; break;
            case 8: q = '2 elma 1 elma daha kaç elma eder?'; options = ['3', '2', '4', '1']; correct = 0; break;
            case 9: q = 'Civcivin kaç ayağı vardır?'; options = ['2', '4', '3', '6']; correct = 0; break;
            case 10: q = 'Gökkuşağı kaç renklidir?'; options = ['7', '5', '3', '10']; correct = 0; break;
        }
        return { question: q, options, correct, difficulty: 1 };
    },

    preschoolKarisik: () => {
        const gens = [QuestionGenerators.preschoolToplama, QuestionGenerators.preschoolCikarma, QuestionGenerators.preschoolSekiller];
        const gen = QuestionGenerators.pick(gens);
        return gen();
    },

    // ===== 5. SINIF - DOĞAL SAYILAR (10+ çeşit) =====
    dogalSayilar: () => {
        const type = QuestionGenerators.rand(1, 12);
        let q, a;

        switch (type) {
            case 1: // Toplama 3 basamak
                const a1 = QuestionGenerators.rand(100, 999);
                const b1 = QuestionGenerators.rand(100, 999);
                q = `${a1} + ${b1} = ?`;
                a = a1 + b1;
                break;
            case 2: // Toplama 2 basamak
                const a2 = QuestionGenerators.rand(10, 99);
                const b2 = QuestionGenerators.rand(10, 99);
                q = `${a2} + ${b2} = ?`;
                a = a2 + b2;
                break;
            case 3: // Çıkarma 3 basamak
                const a3 = QuestionGenerators.rand(500, 999);
                const b3 = QuestionGenerators.rand(100, a3 - 1);
                q = `${a3} - ${b3} = ?`;
                a = a3 - b3;
                break;
            case 4: // Çıkarma 2 basamak  
                const a4 = QuestionGenerators.rand(50, 99);
                const b4 = QuestionGenerators.rand(10, a4 - 1);
                q = `${a4} - ${b4} = ?`;
                a = a4 - b4;
                break;
            case 5: // Çarpma 2x1
                const a5 = QuestionGenerators.rand(12, 50);
                const b5 = QuestionGenerators.rand(2, 9);
                q = `${a5} × ${b5} = ?`;
                a = a5 * b5;
                break;
            case 6: // Çarpma 2x2
                const a6 = QuestionGenerators.rand(11, 25);
                const b6 = QuestionGenerators.rand(11, 25);
                q = `${a6} × ${b6} = ?`;
                a = a6 * b6;
                break;
            case 7: // Bölme tam
                const b7 = QuestionGenerators.rand(2, 12);
                const a7 = b7 * QuestionGenerators.rand(5, 25);
                q = `${a7} ÷ ${b7} = ?`;
                a = a7 / b7;
                break;
            case 8: // 3 sayı toplama
                const x8 = QuestionGenerators.rand(10, 50);
                const y8 = QuestionGenerators.rand(10, 50);
                const z8 = QuestionGenerators.rand(10, 50);
                q = `${x8} + ${y8} + ${z8} = ?`;
                a = x8 + y8 + z8;
                break;
            case 9: // Karışık işlem
                const x9 = QuestionGenerators.rand(10, 30);
                const y9 = QuestionGenerators.rand(2, 5);
                q = `${x9} × ${y9} + ${QuestionGenerators.rand(1, 10)} = ?`;
                const add9 = QuestionGenerators.rand(1, 10);
                q = `${x9} × ${y9} + ${add9} = ?`;
                a = x9 * y9 + add9;
                break;
            case 10: // Eksik sayı bulma
                const sum10 = QuestionGenerators.rand(50, 150);
                const part10 = QuestionGenerators.rand(10, sum10 - 10);
                q = `${part10} + ? = ${sum10}`;
                a = sum10 - part10;
                break;
            case 11: // Çarpım tablosu
                const m11 = QuestionGenerators.rand(6, 12);
                const n11 = QuestionGenerators.rand(6, 12);
                q = `${m11} × ${n11} = ?`;
                a = m11 * n11;
                break;
            case 12: // Ardışık sayılar toplamı
                const start12 = QuestionGenerators.rand(1, 10);
                q = `${start12} + ${start12 + 1} + ${start12 + 2} = ?`;
                a = start12 + (start12 + 1) + (start12 + 2);
                break;
        }

        const { options, correct } = QuestionGenerators.shuffleWithCorrect(a, QuestionGenerators.wrongAnswers(a, 3, 15, true));
        return { question: q, options, correct, difficulty: 1 };
    },

    // ===== 5. SINIF - KESİRLER (8+ çeşit) =====
    kesirler: () => {
        const type = QuestionGenerators.rand(1, 8);
        let q, options, correct;

        const denoms = [2, 3, 4, 5, 6, 8, 10, 12];

        switch (type) {
            case 1: // Kesir karşılaştırma
                const d1 = QuestionGenerators.pick(denoms);
                const n1a = QuestionGenerators.rand(1, d1 - 1);
                const n1b = QuestionGenerators.rand(1, d1 - 1);
                if (n1a === n1b) return QuestionGenerators.kesirler();
                q = `${n1a}/${d1} ile ${n1b}/${d1} kesirlerinden hangisi büyüktür?`;
                options = [`${n1a}/${d1}`, `${n1b}/${d1}`, 'Eşittir', 'Bilinemez'];
                correct = n1a > n1b ? 0 : 1;
                break;
            case 2: // Kesir toplama aynı payda
                const d2 = QuestionGenerators.pick([4, 5, 6, 8, 10]);
                const a2 = QuestionGenerators.rand(1, d2 - 2);
                const b2 = QuestionGenerators.rand(1, d2 - a2 - 1);
                q = `${a2}/${d2} + ${b2}/${d2} = ?`;
                const sum2 = a2 + b2;
                options = [`${sum2}/${d2}`, `${sum2}/${d2 * 2}`, `${a2 * b2}/${d2}`, `${sum2 + 1}/${d2}`];
                correct = 0;
                break;
            case 3: // Tam sayıya çevirme
                const d3 = QuestionGenerators.pick([2, 3, 4, 5, 6]);
                const mult3 = QuestionGenerators.rand(2, 6);
                const n3 = d3 * mult3;
                q = `${n3}/${d3} = ?`;
                const { options: opts3, correct: c3 } = QuestionGenerators.shuffleWithCorrect(mult3, QuestionGenerators.wrongAnswers(mult3, 3, 5));
                return { question: q, options: opts3, correct: c3, difficulty: 1 };
            case 4: // Kesir çıkarma
                const d4 = QuestionGenerators.pick([4, 5, 6, 8]);
                const a4 = QuestionGenerators.rand(3, d4 - 1);
                const b4 = QuestionGenerators.rand(1, a4 - 1);
                q = `${a4}/${d4} - ${b4}/${d4} = ?`;
                const diff4 = a4 - b4;
                options = [`${diff4}/${d4}`, `${diff4}/${d4 * 2}`, `${a4 + b4}/${d4}`, `${diff4 - 1}/${d4}`];
                correct = 0;
                break;
            case 5: // Bileşik kesir
                const whole5 = QuestionGenerators.rand(1, 4);
                const d5 = QuestionGenerators.pick([2, 3, 4]);
                const n5 = QuestionGenerators.rand(1, d5 - 1);
                q = `${whole5} tam ${n5}/${d5} kaç ${d5}'lüktür?`;
                const result5 = whole5 * d5 + n5;
                const { options: opts5, correct: c5 } = QuestionGenerators.shuffleWithCorrect(result5, QuestionGenerators.wrongAnswers(result5, 3, 8));
                return { question: q, options: opts5, correct: c5, difficulty: 1 };
            case 6: // Yarım kaç
                const num6 = QuestionGenerators.rand(4, 20) * 2;
                q = `${num6} sayısının yarısı kaçtır?`;
                const { options: opts6, correct: c6 } = QuestionGenerators.shuffleWithCorrect(num6 / 2, QuestionGenerators.wrongAnswers(num6 / 2, 3, 10));
                return { question: q, options: opts6, correct: c6, difficulty: 1 };
            case 7: // Çeyrek kaç
                const num7 = QuestionGenerators.rand(3, 10) * 4;
                q = `${num7} sayısının çeyreği kaçtır?`;
                const { options: opts7, correct: c7 } = QuestionGenerators.shuffleWithCorrect(num7 / 4, QuestionGenerators.wrongAnswers(num7 / 4, 3, 8));
                return { question: q, options: opts7, correct: c7, difficulty: 1 };
            case 8: // Denk kesir
                const d8 = QuestionGenerators.pick([2, 3, 4, 5]);
                const n8 = QuestionGenerators.rand(1, d8 - 1);
                const mult8 = QuestionGenerators.rand(2, 4);
                q = `${n8}/${d8} kesrinin ${mult8} ile genişletilmişi nedir?`;
                options = [`${n8 * mult8}/${d8 * mult8}`, `${n8 + mult8}/${d8 + mult8}`, `${n8}/${d8 * mult8}`, `${n8 * mult8}/${d8}`];
                correct = 0;
                break;
        }

        return { question: q, options, correct, difficulty: 1 };
    },

    // ===== 5. SINIF - YÜZDELER (8+ çeşit) =====
    yuzde: () => {
        const type = QuestionGenerators.rand(1, 10);
        let q, a, options, correct;

        switch (type) {
            case 1: // Kesri yüzdeye çevirme (Payda 100)
                const n1 = QuestionGenerators.rand(1, 99);
                q = `${n1}/100 kesrinin yüzde sembolüyle gösterimi nedir?`;
                options = [`%${n1}`, `%${n1 * 10}`, `%${100 - n1}`, `%${n1 + 10}`];
                correct = 0;
                break;
            case 2: // Kesri yüzdeye çevirme (Genişletme/Sadeleştirme)
                const facts2 = [
                    { d: 2, m: 50 }, { d: 4, m: 25 }, { d: 5, m: 20 },
                    { d: 10, m: 10 }, { d: 20, m: 5 }, { d: 25, m: 4 }, { d: 50, m: 2 }
                ];
                const f2 = QuestionGenerators.pick(facts2);
                const n2 = QuestionGenerators.rand(1, f2.d - 1);
                q = `${n2}/${f2.d} kesrinin yüzde olarak gösterimi nedir?`;
                const a2 = n2 * f2.m;
                options = [`%${a2}`, `%${n2}`, `%${f2.d}`, `%${(n2 * f2.m) + 5}`];
                correct = 0;
                // Şıkları karıştır
                const res2 = QuestionGenerators.shuffleWithCorrect(options[0], options.slice(1));
                options = res2.options; correct = res2.correct;
                break;
            case 3: // Yüzde sembolünü okuma
                const n3 = QuestionGenerators.rand(1, 99);
                q = `"${n3}/100" ifadesi hangi seçenekte doğru gösterilmiştir?`;
                options = [`%${n3}`, `%${n3 * 10}`, `%${100 + n3}`, `%${100 - n3}`];
                correct = 0;
                break;
            case 4: // Ondalık gösterimi yüzde yapma
                const n4 = QuestionGenerators.rand(1, 99);
                // 0.35 gibi
                const dec4 = (n4 / 100).toFixed(2);
                q = `${dec4} ondalık gösteriminin yüzde olarak ifadesi nedir?`;
                options = [`%${n4}`, `%${n4 * 10}`, `%${Math.floor(n4 / 10)}`, `%${100 - n4}`];
                correct = 0;
                break;
            case 5: // Bir çokluğun belirtilen yüzdesini bulma (Basit)
                // 200'ün %20'si gibi
                const base5 = QuestionGenerators.rand(1, 10) * 100;
                const pct5 = QuestionGenerators.rand(1, 9) * 10;
                q = `${base5} sayısının %${pct5}'i kaçtır?`;
                a = (base5 * pct5) / 100;
                const { options: opts5, correct: c5 } = QuestionGenerators.shuffleWithCorrect(a, QuestionGenerators.wrongAnswers(a, 3, a / 2));
                return { question: q, options: opts5, correct: c5, difficulty: 1 };
            case 6: // Şekil boyama (Basit) -> Metinle ifade
                const parts6 = QuestionGenerators.pick([100, 10, 20]);
                const painted6 = QuestionGenerators.rand(1, parts6 - 1);
                const pct6 = Math.round((painted6 / parts6) * 100);
                q = `${parts6} eş kareye ayrılmış bir bütünün ${painted6} karesi boyanmıştır. Boyalı kısım yüzde kaçı ifade eder?`;
                options = [`%${pct6}`, `%${parts6}`, `%${painted6}`, `%${100 - pct6}`];
                correct = 0;
                // Şıkları karıştır
                const res6 = QuestionGenerators.shuffleWithCorrect(options[0], options.slice(1));
                options = res6.options; correct = res6.correct;
                break;
            case 7: // Karşılaştırma
                const n7 = QuestionGenerators.rand(10, 90);
                const comp7 = QuestionGenerators.rand(1, 100);
                q = `%${n7} ... %${comp7} ifadesinde noktalı yere ne gelmelidir?`;
                if (n7 > comp7) {
                    options = ['>', '<', '=', '+'];
                    correct = 0;
                } else if (n7 < comp7) {
                    options = ['<', '>', '=', '+'];
                    correct = 0;
                } else {
                    options = ['=', '>', '<', '+'];
                    correct = 0;
                }
                break;
            case 8: // Problem (İndirim)
                const price8 = QuestionGenerators.rand(2, 20) * 10;
                const disc8 = QuestionGenerators.pick([10, 20, 25, 50]);
                q = `${price8} TL olan bir ürüne %${disc8} indirim yapılırsa yeni fiyat kaç TL olur?`;
                a = price8 - (price8 * disc8 / 100);
                const { options: opts8, correct: c8 } = QuestionGenerators.shuffleWithCorrect(a, QuestionGenerators.wrongAnswers(a, 3, 20));
                return { question: q, options: opts8, correct: c8, difficulty: 1 };
            case 9: // Problem (Yol)
                const total9 = QuestionGenerators.rand(2, 10) * 100; // 200, 300...
                const pct9 = QuestionGenerators.pick([25, 50, 75]);
                q = `${total9} km yolun %${pct9}'i gidilmiştir. Kaç km yol gidilmiştir?`;
                a = (total9 * pct9) / 100;
                const { options: opts9, correct: c9 } = QuestionGenerators.shuffleWithCorrect(a, QuestionGenerators.wrongAnswers(a, 3, 50));
                return { question: q, options: opts9, correct: c9, difficulty: 1 };
            case 10: // Kesir - Yüzde Karşılaştırma
                const f10 = QuestionGenerators.pick([{ n: 1, d: 2, p: 50 }, { n: 1, d: 4, p: 25 }, { n: 3, d: 4, p: 75 }, { n: 1, d: 5, p: 20 }]);
                q = `${f10.n}/${f10.d} kesri yüzde kaçı ifade eder?`;
                options = [`%${f10.p}`, `%${f10.n}`, `%${f10.d}`, `%${f10.p + 10}`];
                correct = 0;
                // Şıkları karıştır
                const res10 = QuestionGenerators.shuffleWithCorrect(options[0], options.slice(1));
                options = res10.options; correct = res10.correct;
                break;
        }

        if (!options) return QuestionGenerators.yuzde(); // Fallback

        return { question: q, options, correct, difficulty: 1 };
    },

    // ===== 5. SINIF - GEOMETRİ (Temel Kavramlar) =====
    geometri5: () => {
        const type = QuestionGenerators.rand(1, 6);
        let q, options, correct;

        switch (type) {
            case 1: // Açı çeşitleri
                const angle = QuestionGenerators.rand(1, 179);
                let typeName = 'Dar';
                if (angle === 90) typeName = 'Dik';
                else if (angle > 90) typeName = 'Geniş';

                // Soru: Derece verip türünü sorma veya tam tersi
                if (Math.random() > 0.5) {
                    q = `Ölçüsü ${angle} derece olan açı çeşidi hangisidir?`;
                    options = ['Dar Açı', 'Dik Açı', 'Geniş Açı', 'Doğru Açı'];
                    if (angle < 90) correct = 0;
                    else if (angle === 90) correct = 1;
                    else correct = 2;
                } else {
                    // Tanım sorusu
                    const types = ['Dar', 'Dik', 'Geniş', 'Doğru'];
                    const t = QuestionGenerators.pick(types);
                    if (t === 'Dar') {
                        q = 'Ölçüsü 0 ile 90 derece arasında olan açılara ne denir?';
                        correct = 0;
                    } else if (t === 'Dik') {
                        q = 'Ölçüsü 90 derece olan açıya ne denir?';
                        correct = 1;
                    } else if (t === 'Geniş') {
                        q = 'Ölçüsü 90 ile 180 derece arasında olan açılara ne denir?';
                        correct = 2;
                    } else {
                        q = 'Ölçüsü 180 derece olan açıya ne denir?';
                        correct = 3;
                    }
                    options = ['Dar Açı', 'Dik Açı', 'Geniş Açı', 'Doğru Açı'];
                }
                break;
            case 2: // Doğrular
                const rels = ['Paralel', 'Dik', 'Kesişen'];
                const chosen = QuestionGenerators.pick(rels);
                if (chosen === 'Paralel') {
                    q = 'Birbirini asla kesmeyen doğrulara ne denir?';
                    options = ['Paralel', 'Dik', 'Kesişen', 'Çakışık'];
                    correct = 0;
                } else if (chosen === 'Dik') {
                    q = 'Birbirini 90 derecelik açıyla kesen doğrulara ne denir?';
                    options = ['Dik', 'Paralel', 'Teğet', 'Yamuk'];
                    correct = 0;
                } else {
                    q = 'Ortak bir noktası olan doğrulara ne denir?';
                    options = ['Kesişen', 'Paralel', 'Aylık', 'Uzak'];
                    correct = 0;
                }
                break;
            case 3: // Üçgen Çeşitleri (Kenarlarına Göre)
                q = 'Tüm kenar uzunlukları eşit olan üçgene ne denir?';
                options = ['Eşkenar Üçgen', 'İkizkenar Üçgen', 'Çeşitkenar Üçgen', 'Dik Üçgen'];
                correct = 0;
                break;
            case 4: // Üçgen Çeşitleri (Açılarına Göre)
                q = 'Bir açısı 90 derece olan üçgene ne denir?';
                options = ['Dik Üçgen', 'Dar Açılı Üçgen', 'Geniş Açılı Üçgen', 'Eşkenar Üçgen'];
                correct = 0;
                break;
            case 5: // Çokgen köşe/kenar
                const sides = QuestionGenerators.rand(3, 8);
                const names = { 3: 'Üçgen', 4: 'Dörtgen', 5: 'Beşgen', 6: 'Altıgen', 8: 'Sekizgen' };
                if (names[sides]) {
                    q = `${sides} kenarlı çokgene ne ad verilir?`;
                    options = [names[sides], names[sides] + 'sel', 'Çokgen', sides + 'Gen'];
                    // Şıkları doldur
                    const opts = new Set([names[sides]]);
                    while (opts.size < 4) opts.add(Object.values(names)[Math.floor(Math.random() * 5)]);
                    const res = QuestionGenerators.shuffleWithCorrect(names[sides], Array.from(opts).filter(x => x !== names[sides]));
                    return { question: q, options: res.options, correct: res.correct, difficulty: 1 };
                }
                q = 'Beş kenarı olan çokgene ne denir?';
                options = ['Beşgen', 'Dörtgen', 'Altıgen', 'Yedigen'];
                correct = 0;
                break;
            case 6: // Açı hesap (Basit doğru açı)
                const a6 = QuestionGenerators.rand(20, 160);
                q = `Bir doğru üzerindeki açılardan biri ${a6} derece ise bütünleri (diğeri) kaç derecedir?`;
                const ans6 = 180 - a6;
                const { options: opts6, correct: c6 } = QuestionGenerators.shuffleWithCorrect(ans6, QuestionGenerators.wrongAnswers(ans6, 3, 20));
                return { question: q, options: opts6, correct: c6, difficulty: 1 };
        }

        if (!options) return QuestionGenerators.geometri5();
        return { question: q, options, correct, difficulty: 1 };
    },

    // ===== 5. SINIF - ALAN VE ÇEVRE (Kare, Dikdörtgen) =====
    alanCevre5: () => {
        const type = QuestionGenerators.rand(1, 5);
        let q, a;

        switch (type) {
            case 1: // Kare Çevre
                const s1 = QuestionGenerators.rand(2, 20);
                q = `Bir kenarı ${s1} cm olan karenin çevresi kaç cm'dir?`;
                a = s1 * 4;
                break;
            case 2: // Dikdörtgen Çevre
                const l2 = QuestionGenerators.rand(5, 20);
                const w2 = QuestionGenerators.rand(2, l2 - 1);
                q = `Uzun kenarı ${l2} cm, kısa kenarı ${w2} cm olan dikdörtgenin çevresi kaç cm'dir?`;
                a = 2 * (l2 + w2);
                break;
            case 3: // Kare Alan
                const s3 = QuestionGenerators.rand(2, 12);
                q = `Bir kenarı ${s3} cm olan karenin alanı kaç cm²'dir?`;
                a = s3 * s3;
                break;
            case 4: // Dikdörtgen Alan
                const l4 = QuestionGenerators.rand(4, 12);
                const w4 = QuestionGenerators.rand(2, l4 - 1);
                q = `Kenarları ${l4} cm ve ${w4} cm olan dikdörtgenin alanı kaç cm²'dir?`;
                a = l4 * w4;
                break;
            case 5: // Alanı verilen karenin kenarı (Tam kare)
                const s5 = QuestionGenerators.rand(2, 10);
                const area5 = s5 * s5;
                q = `Alanı ${area5} cm² olan karenin bir kenarı kaç cm'dir?`;
                a = s5;
                break;
        }

        const { options: opts, correct: c } = QuestionGenerators.shuffleWithCorrect(a, QuestionGenerators.wrongAnswers(a, 3, 10));
        return { question: q, options: opts, correct: c, difficulty: 1 };
    },

    tamSayilar: () => {
        const type = QuestionGenerators.rand(1, 10);
        let q, a;

        switch (type) {
            case 1: // Pozitif + Negatif
                const a1 = QuestionGenerators.rand(10, 30);
                const b1 = -QuestionGenerators.rand(5, 20);
                q = `${a1} + (${b1}) = ?`;
                a = a1 + b1;
                break;
            case 2: // Negatif + Negatif
                const a2 = -QuestionGenerators.rand(5, 20);
                const b2 = -QuestionGenerators.rand(5, 20);
                q = `(${a2}) + (${b2}) = ?`;
                a = a2 + b2;
                break;
            case 3: // Negatif - Pozitif
                const a3 = -QuestionGenerators.rand(5, 15);
                const b3 = QuestionGenerators.rand(5, 15);
                q = `(${a3}) - ${b3} = ?`;
                a = a3 - b3;
                break;
            case 4: // Pozitif - Negatif
                const a4 = QuestionGenerators.rand(10, 25);
                const b4 = -QuestionGenerators.rand(5, 15);
                q = `${a4} - (${b4}) = ?`;
                a = a4 - b4;
                break;
            case 5: // Negatif × Negatif
                const a5 = -QuestionGenerators.rand(2, 8);
                const b5 = -QuestionGenerators.rand(2, 8);
                q = `(${a5}) × (${b5}) = ?`;
                a = a5 * b5;
                break;
            case 6: // Negatif × Pozitif
                const a6 = -QuestionGenerators.rand(2, 10);
                const b6 = QuestionGenerators.rand(2, 10);
                q = `(${a6}) × ${b6} = ?`;
                a = a6 * b6;
                break;
            case 7: // 3 tam sayı toplama
                const x7 = QuestionGenerators.rand(-10, 10);
                const y7 = QuestionGenerators.rand(-10, 10);
                const z7 = QuestionGenerators.rand(-10, 10);
                q = `(${x7}) + (${y7}) + (${z7}) = ?`;
                a = x7 + y7 + z7;
                break;
            case 8: // Mutlak değer
                const num8 = QuestionGenerators.rand(-20, -5);
                q = `|${num8}| = ?`;
                a = Math.abs(num8);
                break;
            case 9: // Karşıt sayı
                const num9 = QuestionGenerators.rand(-15, 15);
                if (num9 === 0) return QuestionGenerators.tamSayilar();
                q = `${num9} sayısının karşıtı kaçtır?`;
                a = -num9;
                break;
            case 10: // Sıralama
                const nums10 = [QuestionGenerators.rand(-10, 10), QuestionGenerators.rand(-10, 10), QuestionGenerators.rand(-10, 10)];
                const sorted = [...nums10].sort((x, y) => x - y);
                q = `${nums10.join(', ')} sayılarından en küçüğü hangisidir?`;
                a = sorted[0];
                break;
        }

        const { options, correct } = QuestionGenerators.shuffleWithCorrect(a, QuestionGenerators.wrongAnswers(a, 3, 20));
        return { question: q, options, correct, difficulty: 2 };
    },

    // ===== 6. SINIF - ORAN ORANTI (8+ çeşit) =====
    oranOranti: () => {
        const type = QuestionGenerators.rand(1, 8);
        let q, a, options, correct;

        switch (type) {
            case 1: // Basit oran
                const mult1 = QuestionGenerators.rand(2, 8);
                const x1 = QuestionGenerators.rand(2, 10);
                const y1 = x1 * mult1;
                q = `${x1} ile ${y1} sayılarının oranı kaçtır?`;
                options = [`1/${mult1}`, `${mult1}/1`, `${x1}/${y1}`, `${mult1}/${x1}`];
                correct = 0;
                break;
            case 2: // Orantı çözme x
                const a2 = QuestionGenerators.rand(2, 8);
                const b2 = QuestionGenerators.rand(2, 8);
                const m2 = QuestionGenerators.rand(2, 5);
                const c2 = a2 * m2;
                q = `${a2}/${b2} = ${c2}/x ise x = ?`;
                a = b2 * m2;
                const { options: opts2, correct: c2r } = QuestionGenerators.shuffleWithCorrect(a, QuestionGenerators.wrongAnswers(a));
                return { question: q, options: opts2, correct: c2r, difficulty: 2 };
            case 3: // Yüzde hesaplama
                const base3 = QuestionGenerators.rand(2, 10) * 10;
                const pct3 = QuestionGenerators.pick([10, 20, 25, 50]);
                q = `${base3} sayısının %${pct3}'i kaçtır?`;
                a = base3 * pct3 / 100;
                break;
            case 4: // Ters orantı
                const x4 = QuestionGenerators.rand(2, 6);
                const y4 = QuestionGenerators.rand(2, 6);
                const prod = x4 * y4;
                q = `x × y = ${prod} ve x = ${x4} ise y = ?`;
                a = y4;
                break;
            case 5: // Birim fiyat
                const count5 = QuestionGenerators.rand(3, 8);
                const unit5 = QuestionGenerators.rand(5, 20);
                const total5 = count5 * unit5;
                q = `${count5} kalem ${total5} TL ise 1 kalem kaç TL?`;
                a = unit5;
                break;
            case 6: // Orantılı bölme
                const ratio6 = QuestionGenerators.rand(2, 4);
                const total6 = 10 * (1 + ratio6);
                q = `Bir sayı 1/${ratio6} oranında bölününce büyük parça ${10 * ratio6} ise toplam kaçtır?`;
                a = total6;
                break;
            case 7: // İşçi problemi
                const workers7 = QuestionGenerators.rand(2, 5);
                const days7 = QuestionGenerators.rand(2, 6);
                const newWorkers = workers7 * 2;
                q = `${workers7} işçi bir işi ${days7} günde bitirir. ${newWorkers} işçi kaç günde bitirir?`;
                a = days7 / 2;
                break;
            case 8: // Hız-zaman
                const speed8 = QuestionGenerators.rand(3, 8) * 10;
                const time8 = QuestionGenerators.rand(2, 5);
                const dist8 = speed8 * time8;
                q = `Saatte ${speed8} km hızla giden araç ${time8} saatte kaç km yol alır?`;
                a = dist8;
                break;
        }

        if (a !== undefined) {
            const { options: opts, correct: c } = QuestionGenerators.shuffleWithCorrect(a, QuestionGenerators.wrongAnswers(a));
            return { question: q, options: opts, correct: c, difficulty: 2 };
        }
        return { question: q, options, correct, difficulty: 2 };
    },

    // ===== 7. SINIF - RASYONEL SAYILAR =====
    rasyonelSayilar: () => {
        const type = QuestionGenerators.rand(1, 6);
        let q, options, correct;

        switch (type) {
            case 1:
                const n1 = QuestionGenerators.rand(-8, 8);
                const d1 = QuestionGenerators.rand(2, 6);
                const n2 = QuestionGenerators.rand(-8, 8);
                q = `${n1}/${d1} + ${n2}/${d1} = ?`;
                const sum1 = n1 + n2;
                options = [`${sum1}/${d1}`, `${sum1}/${d1 * 2}`, `${n1 * n2}/${d1}`, `${sum1 + d1}/${d1}`];
                correct = 0;
                break;
            case 2:
                const num2 = QuestionGenerators.rand(2, 10);
                const den2 = QuestionGenerators.rand(2, 5);
                q = `-${num2}/${den2} × (-1) = ?`;
                options = [`${num2}/${den2}`, `-${num2}/${den2}`, `${num2 * den2}`, `0`];
                correct = 0;
                break;
            case 3:
                const a3 = QuestionGenerators.rand(1, 5);
                const b3 = QuestionGenerators.rand(2, 4);
                q = `${a3}/${b3} + ${a3}/${b3} = ?`;
                options = [`${2 * a3}/${b3}`, `${a3}/${2 * b3}`, `${a3 * a3}/${b3}`, `${2 * a3}/${2 * b3}`];
                correct = 0;
                break;
            case 4:
                const x4 = QuestionGenerators.rand(2, 8);
                q = `${x4}/1 = ?`;
                const { options: opts4, correct: c4 } = QuestionGenerators.shuffleWithCorrect(x4, QuestionGenerators.wrongAnswers(x4));
                return { question: q, options: opts4, correct: c4, difficulty: 3 };
            case 5:
                const n5 = QuestionGenerators.rand(2, 6);
                const d5 = QuestionGenerators.rand(2, 4);
                const mult5 = QuestionGenerators.rand(2, 3);
                q = `${n5}/${d5} × ${mult5} = ?`;
                options = [`${n5 * mult5}/${d5}`, `${n5}/${d5 * mult5}`, `${n5 + mult5}/${d5}`, `${n5 * mult5}/${d5 * mult5}`];
                correct = 0;
                break;
            case 6:
                const base6 = QuestionGenerators.rand(2, 5);
                const exp6 = 2;
                q = `(${base6}/1)² = ?`;
                const result6 = base6 * base6;
                const { options: opts6, correct: c6 } = QuestionGenerators.shuffleWithCorrect(result6, QuestionGenerators.wrongAnswers(result6));
                return { question: q, options: opts6, correct: c6, difficulty: 3 };
        }

        return { question: q, options, correct, difficulty: 3 };
    },

    // ===== 7. SINIF - DENKLEMLER (10+ çeşit) =====
    denklem7: () => {
        const type = QuestionGenerators.rand(1, 10);
        let q, a;

        switch (type) {
            case 1: // ax + b = c
                const a1 = QuestionGenerators.rand(2, 8);
                const x1 = QuestionGenerators.rand(1, 12);
                const b1 = QuestionGenerators.rand(1, 20);
                const result1 = a1 * x1 + b1;
                q = `${a1}x + ${b1} = ${result1} → x = ?`;
                a = x1;
                break;
            case 2: // ax - b = c
                const a2 = QuestionGenerators.rand(2, 6);
                const x2 = QuestionGenerators.rand(3, 10);
                const b2 = QuestionGenerators.rand(1, 10);
                const result2 = a2 * x2 - b2;
                q = `${a2}x - ${b2} = ${result2} → x = ?`;
                a = x2;
                break;
            case 3: // x + a = b
                const add3 = QuestionGenerators.rand(5, 25);
                const result3 = QuestionGenerators.rand(30, 60);
                q = `x + ${add3} = ${result3} → x = ?`;
                a = result3 - add3;
                break;
            case 4: // x - a = b
                const sub4 = QuestionGenerators.rand(5, 20);
                const result4 = QuestionGenerators.rand(10, 40);
                q = `x - ${sub4} = ${result4} → x = ?`;
                a = result4 + sub4;
                break;
            case 5: // ax = b
                const mult5 = QuestionGenerators.rand(3, 9);
                const x5 = QuestionGenerators.rand(2, 12);
                const result5 = mult5 * x5;
                q = `${mult5}x = ${result5} → x = ?`;
                a = x5;
                break;
            case 6: // x/a = b
                const div6 = QuestionGenerators.rand(2, 8);
                const result6 = QuestionGenerators.rand(3, 10);
                q = `x/${div6} = ${result6} → x = ?`;
                a = div6 * result6;
                break;
            case 7: // 2x + 3x = b
                const x7 = QuestionGenerators.rand(2, 10);
                const coef7a = QuestionGenerators.rand(2, 5);
                const coef7b = QuestionGenerators.rand(2, 5);
                const result7 = (coef7a + coef7b) * x7;
                q = `${coef7a}x + ${coef7b}x = ${result7} → x = ?`;
                a = x7;
                break;
            case 8: // Parantezli
                const x8 = QuestionGenerators.rand(2, 8);
                const add8 = QuestionGenerators.rand(1, 5);
                const mult8 = QuestionGenerators.rand(2, 4);
                const result8 = mult8 * (x8 + add8);
                q = `${mult8}(x + ${add8}) = ${result8} → x = ?`;
                a = x8;
                break;
            case 9: // Negatif sonuç
                const sub9 = QuestionGenerators.rand(10, 30);
                const result9 = QuestionGenerators.rand(1, 9);
                q = `x + ${sub9} = ${result9 + sub9} → x = ?`;
                a = result9;
                break;
            case 10: // İki taraflı
                const x10 = QuestionGenerators.rand(2, 10);
                const coef10 = QuestionGenerators.rand(3, 6);
                const add10 = QuestionGenerators.rand(5, 15);
                q = `${coef10}x = ${coef10 - 1}x + ${x10} → x = ?`;
                a = x10;
                break;
        }

        const { options, correct } = QuestionGenerators.shuffleWithCorrect(a, QuestionGenerators.wrongAnswers(a));
        return { question: q, options, correct, difficulty: 3 };
    },

    // ===== 8. SINIF - ÜSLÜ SAYILAR (10+ çeşit) =====
    usluSayilar: () => {
        const type = QuestionGenerators.rand(1, 10);
        let q, a, options, correct;

        switch (type) {
            case 1: // Basit üs
                const base1 = QuestionGenerators.rand(2, 5);
                const exp1 = QuestionGenerators.rand(2, 4);
                q = `${base1}^${exp1} = ?`;
                a = Math.pow(base1, exp1);
                break;
            case 2: // Üs çarpma
                const b2 = QuestionGenerators.rand(2, 4);
                const e2a = QuestionGenerators.rand(2, 4);
                const e2b = QuestionGenerators.rand(1, 3);
                q = `${b2}^${e2a} × ${b2}^${e2b} = ${b2}^?`;
                a = e2a + e2b;
                break;
            case 3: // Üs bölme
                const b3 = QuestionGenerators.rand(2, 5);
                const e3a = QuestionGenerators.rand(4, 7);
                const e3b = QuestionGenerators.rand(1, 3);
                q = `${b3}^${e3a} ÷ ${b3}^${e3b} = ${b3}^?`;
                a = e3a - e3b;
                break;
            case 4: // Sıfır üs
                const b4 = QuestionGenerators.rand(2, 10);
                q = `${b4}^0 = ?`;
                options = ['0', '1', `${b4}`, 'Tanımsız'];
                correct = 1;
                return { question: q, options, correct, difficulty: 4 };
            case 5: // Negatif üs
                const b5 = QuestionGenerators.rand(2, 4);
                q = `${b5}^(-1) = ?`;
                options = [`1/${b5}`, `-${b5}`, `${b5}`, `-1/${b5}`];
                correct = 0;
                return { question: q, options, correct, difficulty: 4 };
            case 6: // Üssün üssü
                const b6 = 2;
                const e6a = QuestionGenerators.rand(2, 3);
                const e6b = QuestionGenerators.rand(2, 3);
                q = `(${b6}^${e6a})^${e6b} = ${b6}^?`;
                a = e6a * e6b;
                break;
            case 7: // 10 üssü
                const e7 = QuestionGenerators.rand(2, 5);
                q = `10^${e7} = ?`;
                a = Math.pow(10, e7);
                break;
            case 8: // Karşılaştırma
                q = `2^10 ile 10^3 karşılaştırıldığında?`;
                options = ['2^10 > 10^3', '2^10 < 10^3', '2^10 = 10^3', 'Karşılaştırılamaz'];
                correct = 0; // 1024 > 1000
                return { question: q, options, correct, difficulty: 4 };
            case 9: // 1 üssü
                const e9 = QuestionGenerators.rand(5, 100);
                q = `1^${e9} = ?`;
                options = ['0', '1', `${e9}`, 'Tanımsız'];
                correct = 1;
                return { question: q, options, correct, difficulty: 4 };
            case 10: // Çift üs
                const b10 = QuestionGenerators.rand(2, 4);
                q = `${b10}² × ${b10}² = ?`;
                a = Math.pow(b10, 4);
                break;
        }

        const { options: opts, correct: c } = QuestionGenerators.shuffleWithCorrect(a, QuestionGenerators.wrongAnswers(a, 3, 50));
        return { question: q, options: opts, correct: c, difficulty: 4 };
    },

    // ===== 8. SINIF - KAREKÖKLÜ SAYILAR (8+ çeşit) =====
    karekok: () => {
        const type = QuestionGenerators.rand(1, 8);
        let q, a, options, correct;

        const squares = [4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144, 169, 196, 225];

        switch (type) {
            case 1: // Basit karekök
                const s1 = QuestionGenerators.pick(squares);
                a = Math.sqrt(s1);
                q = `√${s1} = ?`;
                break;
            case 2: // Karekök toplama
                const r2a = QuestionGenerators.rand(2, 6);
                const r2b = QuestionGenerators.rand(2, 6);
                q = `${r2a}√5 + ${r2b}√5 = ?√5`;
                a = r2a + r2b;
                break;
            case 3: // Karekök çarpma
                const v3a = QuestionGenerators.pick([2, 3, 5]);
                const v3b = QuestionGenerators.pick([2, 3, 8, 12]);
                q = `√${v3a} × √${v3a} = ?`;
                a = v3a;
                break;
            case 4: // Tam kare bulma
                const n4 = QuestionGenerators.rand(2, 12);
                const sq4 = n4 * n4;
                q = `${sq4} sayısı ${n4} sayısının karesidir. √${sq4} = ?`;
                a = n4;
                break;
            case 5: // Karekök karşılaştırma
                const s5a = QuestionGenerators.pick([16, 25, 36]);
                const s5b = QuestionGenerators.pick([9, 16, 25]);
                if (s5a === s5b) return QuestionGenerators.karekok();
                q = `√${s5a} ile √${s5b} karşılaştırıldığında?`;
                const r5a = Math.sqrt(s5a), r5b = Math.sqrt(s5b);
                options = [`√${s5a} > √${s5b}`, `√${s5a} < √${s5b}`, `√${s5a} = √${s5b}`, 'Bilinemez'];
                correct = r5a > r5b ? 0 : 1;
                return { question: q, options, correct, difficulty: 4 };
            case 6: // √a² = |a|
                const n6 = -QuestionGenerators.rand(2, 10);
                q = `√(${n6})² = ?`;
                a = Math.abs(n6);
                break;
            case 7: // Basit hesap
                q = `√9 + √16 = ?`;
                a = 7;
                break;
            case 8: // Çarpımın karekökü
                const m8a = QuestionGenerators.rand(2, 5);
                const m8b = QuestionGenerators.rand(2, 5);
                q = `√(${m8a * m8a} × ${m8b * m8b}) = ?`;
                a = m8a * m8b;
                break;
        }

        const { options: opts, correct: c } = QuestionGenerators.shuffleWithCorrect(a, QuestionGenerators.wrongAnswers(a, 3, 10));
        return { question: q, options: opts, correct: c, difficulty: 4 };
    },

    // ===== 8. SINIF - ÖZDEŞLİKLER (12+ çeşit) =====
    ozdeslik: () => {
        const type = QuestionGenerators.rand(1, 12);
        let q, options, correct, a;

        switch (type) {
            case 1:
                q = '(a + b)² ifadesinin açılımı nedir?';
                options = ['a² + b²', 'a² + 2ab + b²', 'a² - 2ab + b²', 'a² - b²'];
                correct = 1;
                break;
            case 2:
                q = '(a - b)² ifadesinin açılımı nedir?';
                options = ['a² - b²', 'a² + 2ab + b²', 'a² - 2ab + b²', 'a² + b²'];
                correct = 2;
                break;
            case 3:
                q = 'a² - b² ifadesi nasıl çarpanlarına ayrılır?';
                options = ['(a+b)(a+b)', '(a-b)(a-b)', '(a+b)(a-b)', '(a+b)²'];
                correct = 2;
                break;
            case 4:
                const x4 = QuestionGenerators.rand(2, 6);
                const r4 = (x4 + 3) * (x4 + 3);
                q = `(x + 3)² ifadesinde x = ${x4} ise sonuç?`;
                const { options: opts4, correct: c4 } = QuestionGenerators.shuffleWithCorrect(r4, QuestionGenerators.wrongAnswers(r4));
                return { question: q, options: opts4, correct: c4, difficulty: 4 };
            case 5:
                q = '(x + 2)² açılımı nedir?';
                options = ['x² + 4', 'x² + 2x + 4', 'x² + 4x + 4', 'x² - 4x + 4'];
                correct = 2;
                break;
            case 6:
                q = '(x - 5)² açılımı nedir?';
                options = ['x² - 25', 'x² - 5x + 25', 'x² - 10x + 25', 'x² + 10x + 25'];
                correct = 2;
                break;
            case 7:
                q = 'x² - 9 ifadesi nasıl çarpanlarına ayrılır?';
                options = ['(x-3)²', '(x+3)²', '(x+3)(x-3)', '(x-9)(x+1)'];
                correct = 2;
                break;
            case 8:
                q = 'x² - 16 ifadesi nasıl çarpanlarına ayrılır?';
                options = ['(x-4)²', '(x+4)(x-4)', '(x-8)(x+2)', '(x+16)(x-1)'];
                correct = 1;
                break;
            case 9:
                q = '(2x + 1)² açılımı nedir?';
                options = ['4x² + 1', '4x² + 2x + 1', '4x² + 4x + 1', '2x² + 2x + 1'];
                correct = 2;
                break;
            case 10:
                q = '4x² - 9 ifadesi nasıl çarpanlarına ayrılır?';
                options = ['(2x-3)²', '(2x+3)(2x-3)', '(4x+3)(x-3)', '(2x+9)(2x-1)'];
                correct = 1;
                break;
            case 11:
                q = '(a + b)(a - b) işleminin sonucu nedir?';
                options = ['a² + b²', 'a² - b²', 'a² - 2ab + b²', '(a-b)²'];
                correct = 1;
                break;
            case 12:
                const n12 = QuestionGenerators.rand(10, 20);
                const r12 = n12 * n12 - 1;
                q = `${n12}² - 1 = ?`;
                const { options: opts12, correct: c12 } = QuestionGenerators.shuffleWithCorrect(r12, QuestionGenerators.wrongAnswers(r12, 3, 30));
                return { question: q, options: opts12, correct: c12, difficulty: 4 };
        }

        return { question: q, options, correct, difficulty: 4 };
    },

    // ===== 6. SINIF - ALAN ÖLÇME (Dikdörtgen, Kare, Üçgen, Paralelkenar) =====
    alanOlcme6: () => {
        const type = QuestionGenerators.rand(1, 10);
        let q, a;

        switch (type) {
            case 1: // Dikdörtgen Alan
                const l1 = QuestionGenerators.rand(4, 15);
                const w1 = QuestionGenerators.rand(3, 10);
                q = `Uzunluğu ${l1} cm, genişliği ${w1} cm olan dikdörtgenin alanı kaç cm²'dir?`;
                a = l1 * w1;
                break;
            case 2: // Kare Alan
                const s2 = QuestionGenerators.rand(3, 12);
                q = `Bir kenarı ${s2} cm olan karenin alanı kaç cm²'dir?`;
                a = s2 * s2;
                break;
            case 3: // Üçgen Alan
                const t3 = QuestionGenerators.rand(4, 12);
                const h3 = QuestionGenerators.rand(4, 10);
                q = `Tabanı ${t3} cm, yüksekliği ${h3} cm olan üçgenin alanı kaç cm²'dir?`;
                a = (t3 * h3) / 2;
                break;
            case 4: // Paralelkenar Alan
                const b4 = QuestionGenerators.rand(5, 12);
                const h4 = QuestionGenerators.rand(3, 8);
                q = `Tabanı ${b4} cm, yüksekliği ${h4} cm olan paralelkenarın alanı kaç cm²'dir?`;
                a = b4 * h4;
                break;
            case 5: // Dikdörtgen Çevre
                const l5 = QuestionGenerators.rand(5, 15);
                const w5 = QuestionGenerators.rand(3, 10);
                q = `Kenarları ${l5} cm ve ${w5} cm olan dikdörtgenin çevresi kaç cm'dir?`;
                a = 2 * (l5 + w5);
                break;
            case 6: // Alan verilen karenin kenarı
                const s6 = QuestionGenerators.rand(3, 10);
                const area6 = s6 * s6;
                q = `Alanı ${area6} cm² olan karenin bir kenarı kaç cm'dir?`;
                a = s6;
                break;
            case 7: // Yamuk Alan
                const a7 = QuestionGenerators.rand(4, 10);
                const c7 = QuestionGenerators.rand(6, 12);
                const h7 = QuestionGenerators.rand(3, 8);
                q = `Paralel kenarları ${a7} cm ve ${c7} cm, yüksekliği ${h7} cm olan yamuğun alanı kaç cm²'dir?`;
                a = ((a7 + c7) * h7) / 2;
                break;
            case 8: // Eşkenar dörtgen
                const d8a = QuestionGenerators.rand(4, 10) * 2; // Köşegen 1 (çift sayı)
                const d8b = QuestionGenerators.rand(3, 8) * 2;  // Köşegen 2 (çift sayı)
                q = `Köşegenleri ${d8a} cm ve ${d8b} cm olan eşkenar dörtgenin alanı kaç cm²'dir?`;
                a = (d8a * d8b) / 2;
                break;
            case 9: // Birleşik şekil
                const l9 = QuestionGenerators.rand(6, 10);
                const w9 = QuestionGenerators.rand(4, 6);
                const s9 = QuestionGenerators.rand(2, 3);
                q = `${l9}×${w9} cm dikdörtgenden ${s9}×${s9} cm'lik bir kare kesilirse kalan alan kaç cm²?`;
                a = (l9 * w9) - (s9 * s9);
                break;
            case 10: // Problem
                const wall = QuestionGenerators.rand(3, 6) * 2;
                const wallH = QuestionGenerators.rand(2, 4);
                q = `${wall} m x ${wallH} m boyutlarındaki duvarı boyamak için metrekaresi 10 TL'den kaç TL ödenir?`;
                a = wall * wallH * 10;
                break;
        }

        const { options: opts, correct: c } = QuestionGenerators.shuffleWithCorrect(a, QuestionGenerators.wrongAnswers(a, 3, 15, true));
        return { question: q, options: opts, correct: c, difficulty: 2 };
    },

    // ===== 6. SINIF - ÇARPANLAR VE KATLAR (OBEB-OKEK) =====
    carpanlarKatlar: () => {
        const type = QuestionGenerators.rand(1, 10);
        let q, a, options, correct;

        switch (type) {
            case 1: // Asal sayı tespiti
                const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31];
                const notPrimes = [4, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21, 22, 24, 25];
                if (Math.random() > 0.5) {
                    const p = QuestionGenerators.pick(primes);
                    q = `${p} sayısı asal mıdır?`;
                    options = ['Evet', 'Hayır', 'Bileşik', 'Belirsiz'];
                    correct = 0;
                } else {
                    const np = QuestionGenerators.pick(notPrimes);
                    q = `${np} sayısı asal mıdır?`;
                    options = ['Hayır', 'Evet', 'Asal', 'Belirsiz'];
                    correct = 0;
                }
                return { question: q, options, correct, difficulty: 2 };
            case 2: // EBOB (basit)
                const pairs2 = [[12, 18, 6], [20, 30, 10], [24, 36, 12], [15, 25, 5], [8, 12, 4], [18, 24, 6]];
                const p2 = QuestionGenerators.pick(pairs2);
                q = `EBOB(${p2[0]}, ${p2[1]}) = ?`;
                a = p2[2];
                break;
            case 3: // EKOK (basit)
                const pairs3 = [[4, 6, 12], [3, 5, 15], [6, 8, 24], [4, 10, 20], [6, 9, 18], [8, 12, 24]];
                const p3 = QuestionGenerators.pick(pairs3);
                q = `EKOK(${p3[0]}, ${p3[1]}) = ?`;
                a = p3[2];
                break;
            case 4: // Bölünebilme 2
                const n4 = QuestionGenerators.rand(100, 500);
                const isDiv2 = n4 % 2 === 0;
                q = `${n4} sayısı 2'ye bölünebilir mi?`;
                options = isDiv2 ? ['Evet', 'Hayır', 'Bazen', 'Belirsiz'] : ['Hayır', 'Evet', 'Bazen', 'Belirsiz'];
                correct = 0;
                return { question: q, options, correct, difficulty: 2 };
            case 5: // Bölünebilme 3
                const n5 = QuestionGenerators.rand(100, 500);
                const isDiv3 = n5 % 3 === 0;
                q = `${n5} sayısı 3'e bölünebilir mi?`;
                options = isDiv3 ? ['Evet', 'Hayır', 'Bazen', 'Belirsiz'] : ['Hayır', 'Evet', 'Bazen', 'Belirsiz'];
                correct = 0;
                return { question: q, options, correct, difficulty: 2 };
            case 6: // Bölünebilme 5
                const n6 = QuestionGenerators.rand(10, 50) * 10 + QuestionGenerators.rand(0, 9);
                const isDiv5 = n6 % 5 === 0;
                q = `${n6} sayısı 5'e bölünebilir mi?`;
                options = isDiv5 ? ['Evet', 'Hayır', 'Bazen', 'Belirsiz'] : ['Hayır', 'Evet', 'Bazen', 'Belirsiz'];
                correct = 0;
                return { question: q, options, correct, difficulty: 2 };
            case 7: // Çarpan sayısı
                const nums7 = [12, 18, 24, 36, 20, 28];
                const factors7 = { 12: 6, 18: 6, 24: 8, 36: 9, 20: 6, 28: 6 };
                const n7 = QuestionGenerators.pick(nums7);
                q = `${n7} sayısının kaç tane çarpanı vardır?`;
                a = factors7[n7];
                break;
            case 8: // Ortak kat problemi
                const a8 = QuestionGenerators.rand(2, 5);
                const b8 = QuestionGenerators.rand(3, 6);
                while (a8 === b8) b8 = QuestionGenerators.rand(3, 6);
                q = `${a8} ve ${b8} sayılarının en küçük ortak katı kaçtır?`;
                // Basit EKOK hesabı (küçük sayılar için)
                let ekok = a8;
                while (ekok % b8 !== 0) ekok += a8;
                a = ekok;
                break;
            case 9: // Asal çarpanlara ayırma
                const nums9 = [[12, '2² × 3'], [18, '2 × 3²'], [24, '2³ × 3'], [20, '2² × 5'], [30, '2 × 3 × 5']];
                const pick9 = QuestionGenerators.pick(nums9);
                q = `${pick9[0]} sayısının asal çarpanlarına ayrılmış hali hangisidir?`;
                options = [pick9[1], '2 × 6', '3 × 4', '2 + 3 + ' + (pick9[0] - 5)];
                correct = 0;
                // Şıkları karıştır
                const res9 = QuestionGenerators.shuffleWithCorrect(options[0], options.slice(1));
                return { question: q, options: res9.options, correct: res9.correct, difficulty: 2 };
            case 10: // Problem - EKOK
                const int10a = QuestionGenerators.pick([6, 8, 12]);
                const int10b = QuestionGenerators.pick([4, 5, 10]);
                let ekok10 = int10a;
                while (ekok10 % int10b !== 0) ekok10 += int10a;
                q = `Ayşe her ${int10a} günde, Ali her ${int10b} günde markete gidiyor. Bugün birlikte gittilerse kaç gün sonra tekrar birlikte giderler?`;
                a = ekok10;
                break;
        }

        if (a !== undefined) {
            const { options: opts, correct: c } = QuestionGenerators.shuffleWithCorrect(a, QuestionGenerators.wrongAnswers(a, 3, 10, true));
            return { question: q, options: opts, correct: c, difficulty: 2 };
        }
        return { question: q, options, correct, difficulty: 2 };
    },

    // ===== 6-7. SINIF - CEBİRSEL İFADELER =====
    cebirsel: () => {
        const type = QuestionGenerators.rand(1, 10);
        let q, a, options, correct;

        switch (type) {
            case 1: // Değer hesaplama
                const x1 = QuestionGenerators.rand(2, 8);
                const coef1 = QuestionGenerators.rand(2, 5);
                const add1 = QuestionGenerators.rand(1, 10);
                q = `${coef1}x + ${add1} ifadesinde x = ${x1} ise sonuç?`;
                a = coef1 * x1 + add1;
                break;
            case 2: // İki değişkenli
                const x2 = QuestionGenerators.rand(2, 6);
                const y2 = QuestionGenerators.rand(1, 5);
                q = `2x + 3y ifadesinde x = ${x2}, y = ${y2} ise sonuç?`;
                a = 2 * x2 + 3 * y2;
                break;
            case 3: // Benzer terimleri toplama
                const c3a = QuestionGenerators.rand(2, 8);
                const c3b = QuestionGenerators.rand(2, 8);
                q = `${c3a}x + ${c3b}x = ?`;
                options = [`${c3a + c3b}x`, `${c3a * c3b}x`, `${c3a + c3b}x²`, `${c3a}x + ${c3b}`];
                correct = 0;
                return { question: q, options, correct, difficulty: 2 };
            case 4: // Çıkarma
                const c4a = QuestionGenerators.rand(8, 15);
                const c4b = QuestionGenerators.rand(2, 7);
                q = `${c4a}y - ${c4b}y = ?`;
                options = [`${c4a - c4b}y`, `${c4a + c4b}y`, `${c4a - c4b}`, `${c4a}y²`];
                correct = 0;
                return { question: q, options, correct, difficulty: 2 };
            case 5: // Çarpma
                const c5 = QuestionGenerators.rand(2, 6);
                const exp5 = QuestionGenerators.rand(2, 4);
                q = `${c5} × ${exp5}x = ?`;
                options = [`${c5 * exp5}x`, `${c5 + exp5}x`, `${c5}x + ${exp5}`, `${c5 * exp5}`];
                correct = 0;
                return { question: q, options, correct, difficulty: 2 };
            case 6: // İfade oluşturma
                q = '"Bir sayının 3 katının 5 fazlası" ifadesi nasıl yazılır?';
                options = ['3x + 5', '3 + 5x', '3(x + 5)', '5x + 3'];
                correct = 0;
                return { question: q, options, correct, difficulty: 2 };
            case 7: // İfade oluşturma 2
                q = '"Bir sayının 4 eksiği" ifadesi nasıl yazılır?';
                options = ['x - 4', '4 - x', '4x', 'x + 4'];
                correct = 0;
                return { question: q, options, correct, difficulty: 2 };
            case 8: // Parantez açma
                const c8 = QuestionGenerators.rand(2, 5);
                const a8 = QuestionGenerators.rand(1, 5);
                const b8 = QuestionGenerators.rand(1, 5);
                q = `${c8}(x + ${a8}) + ${b8} ifadesini sadeleştirin.`;
                options = [`${c8}x + ${c8 * a8 + b8}`, `${c8}x + ${a8 + b8}`, `${c8 + a8}x + ${b8}`, `${c8}x + ${a8} + ${b8}`];
                correct = 0;
                return { question: q, options, correct, difficulty: 2 };
            case 9: // Katsayı bulma
                const coef9 = QuestionGenerators.rand(3, 9);
                q = `${coef9}x² + 5x - 3 ifadesinde x²'nin katsayısı kaçtır?`;
                a = coef9;
                break;
            case 10: // Sabit terim
                const const10 = QuestionGenerators.rand(2, 15);
                q = `4x + 7y - ${const10} ifadesinde sabit terim kaçtır?`;
                a = -const10;
                break;
        }

        if (a !== undefined) {
            const { options: opts, correct: c } = QuestionGenerators.shuffleWithCorrect(a, QuestionGenerators.wrongAnswers(a, 3, 10));
            return { question: q, options: opts, correct: c, difficulty: 2 };
        }
        return { question: q, options, correct, difficulty: 2 };
    },

    // ===== 7. SINIF - ÇOKGENLER =====
    cokgenler: () => {
        const type = QuestionGenerators.rand(1, 10);
        let q, a, options, correct;

        switch (type) {
            case 1: // İç açılar toplamı
                const n1 = QuestionGenerators.rand(4, 8);
                const names = { 4: 'Dörtgen', 5: 'Beşgen', 6: 'Altıgen', 7: 'Yedigen', 8: 'Sekizgen' };
                q = `Bir ${names[n1] || n1 + 'gen'}'in iç açıları toplamı kaç derecedir?`;
                a = (n1 - 2) * 180;
                break;
            case 2: // Dış açılar toplamı
                const n2 = QuestionGenerators.rand(4, 10);
                q = `${n2} kenarlı bir çokgenin dış açıları toplamı kaç derecedir?`;
                a = 360;
                break;
            case 3: // Düzgün çokgen bir iç açı
                const n3 = QuestionGenerators.rand(3, 6);
                const names3 = { 3: 'eşkenar üçgen', 4: 'kare', 5: 'düzgün beşgen', 6: 'düzgün altıgen' };
                const angles = { 3: 60, 4: 90, 5: 108, 6: 120 };
                q = `Bir ${names3[n3]}'in bir iç açısı kaç derecedir?`;
                a = angles[n3];
                break;
            case 4: // Köşegen sayısı
                const n4 = QuestionGenerators.rand(4, 8);
                q = `${n4} kenarlı bir çokgenin köşegen sayısı kaçtır?`;
                a = (n4 * (n4 - 3)) / 2;
                break;
            case 5: // Üçgenin açıları
                const a5a = QuestionGenerators.rand(30, 80);
                const a5b = QuestionGenerators.rand(30, 80);
                q = `Bir üçgenin iki açısı ${a5a}° ve ${a5b}° ise üçüncü açı kaç derecedir?`;
                a = 180 - a5a - a5b;
                break;
            case 6: // Dörtgen açı
                const a6a = QuestionGenerators.rand(60, 100);
                const a6b = QuestionGenerators.rand(60, 100);
                const a6c = QuestionGenerators.rand(60, 100);
                q = `Bir dörtgenin üç açısı ${a6a}°, ${a6b}° ve ${a6c}° ise dördüncü açı kaç derecedir?`;
                a = 360 - a6a - a6b - a6c;
                break;
            case 7: // Çokgen ismi
                q = '8 kenarlı çokgenin adı nedir?';
                options = ['Sekizgen', 'Yedigen', 'Dokuzgen', 'Altıgen'];
                correct = 0;
                return { question: q, options, correct, difficulty: 3 };
            case 8: // Düzgün çokgen özellikleri
                q = 'Düzgün bir çokgende hangi özellik YOKTUR?';
                options = ['Kenarları farklı uzunluktadır', 'Tüm kenarları eşittir', 'Tüm açıları eşittir', 'Köşegenleri eşit olabilir'];
                correct = 0;
                return { question: q, options, correct, difficulty: 3 };
            case 9: // Paralelkenar
                const angle9 = QuestionGenerators.rand(50, 80);
                q = `Bir paralelkenarın bir açısı ${angle9}° ise komşu açısı kaç derecedir?`;
                a = 180 - angle9;
                break;
            case 10: // Yamuk
                q = 'Bir yamuğun kaç çift paralel kenarı vardır?';
                options = ['1', '2', '0', '4'];
                correct = 0;
                return { question: q, options, correct, difficulty: 3 };
        }

        if (a !== undefined) {
            const { options: opts, correct: c } = QuestionGenerators.shuffleWithCorrect(a, QuestionGenerators.wrongAnswers(a, 3, 30, true));
            return { question: q, options: opts, correct: c, difficulty: 3 };
        }
        return { question: q, options, correct, difficulty: 3 };
    },

    // ===== 8. SINIF - ÜÇGENLER (Pisagor, Benzerlik, Eşlik) =====
    ucgenler8: () => {
        const type = QuestionGenerators.rand(1, 10);
        let q, a, options, correct;

        switch (type) {
            case 1: // Pisagor (3-4-5)
                q = 'Dik kenarları 3 cm ve 4 cm olan dik üçgenin hipotenüsü kaç cm?';
                a = 5;
                break;
            case 2: // Pisagor (5-12-13)
                q = 'Dik kenarları 5 cm ve 12 cm olan dik üçgenin hipotenüsü kaç cm?';
                a = 13;
                break;
            case 3: // Pisagor (6-8-10)
                q = 'Hipotenüsü 10 cm, bir dik kenarı 6 cm olan dik üçgenin diğer dik kenarı kaç cm?';
                a = 8;
                break;
            case 4: // Pisagor (8-15-17)
                q = 'Dik kenarları 8 cm ve 15 cm olan dik üçgenin hipotenüsü kaç cm?';
                a = 17;
                break;
            case 5: // Üçgen eşitsizliği
                q = 'Kenarları 3 cm, 4 cm ve 8 cm olan bir üçgen oluşturulabilir mi?';
                options = ['Hayır', 'Evet', 'Bazen', 'Belirsiz'];
                correct = 0;
                return { question: q, options, correct, difficulty: 4 };
            case 6: // Açıortay
                q = 'Bir üçgenin açıortayları hangi noktada kesişir?';
                options = ['İç teğet merkezi', 'Ağırlık merkezi', 'Çevrel merkezi', 'Diklik merkezi'];
                correct = 0;
                return { question: q, options, correct, difficulty: 4 };
            case 7: // Kenarortay
                q = 'Bir üçgenin kenarortayları hangi noktada kesişir?';
                options = ['Ağırlık merkezi', 'İç teğet merkezi', 'Çevrel merkezi', 'Diklik merkezi'];
                correct = 0;
                return { question: q, options, correct, difficulty: 4 };
            case 8: // Benzer üçgen
                const scale = QuestionGenerators.rand(2, 4);
                const side = QuestionGenerators.rand(3, 8);
                q = `Benzerlik oranı 1/${scale} olan iki üçgenden büyüğünün bir kenarı ${side * scale} cm ise küçüğün karşılık gelen kenarı kaç cm?`;
                a = side;
                break;
            case 9: // Eşkenar üçgen
                const s9 = QuestionGenerators.rand(4, 10);
                q = `Bir kenarı ${s9} cm olan eşkenar üçgenin çevresi kaç cm?`;
                a = s9 * 3;
                break;
            case 10: // İkizkenar üçgen
                const base10 = QuestionGenerators.rand(4, 8);
                const leg10 = QuestionGenerators.rand(5, 10);
                q = `Tabanı ${base10} cm, eşit kenarları ${leg10} cm olan ikizkenar üçgenin çevresi kaç cm?`;
                a = base10 + 2 * leg10;
                break;
        }

        if (a !== undefined) {
            const { options: opts, correct: c } = QuestionGenerators.shuffleWithCorrect(a, QuestionGenerators.wrongAnswers(a, 3, 10, true));
            return { question: q, options: opts, correct: c, difficulty: 4 };
        }
        return { question: q, options, correct, difficulty: 4 };
    }
};

// ===== KONU - GENERATOR EŞLEME =====
const TOPIC_GENERATORS = {
    // Okul Öncesi
    'okul-toplama': QuestionGenerators.preschoolToplama,
    'okul-cikarma': QuestionGenerators.preschoolCikarma,
    'okul-sekiller': QuestionGenerators.preschoolSekiller,
    'okul-karisik': QuestionGenerators.preschoolKarisik,

    // 5. Sınıf
    'dogal-sayilar': QuestionGenerators.dogalSayilar,
    'kesirler': QuestionGenerators.kesirler,
    'ondalik': QuestionGenerators.dogalSayilar,
    'yuzde': QuestionGenerators.yuzde,
    'geometri-5': QuestionGenerators.geometri5,
    'alan-cevre-5': QuestionGenerators.alanCevre5,

    // 6. Sınıf
    'dogal-islemler': QuestionGenerators.dogalSayilar,
    'carpanlar-katlar': QuestionGenerators.carpanlarKatlar,
    'tam-sayilar': QuestionGenerators.tamSayilar,
    'kesir-islemler': QuestionGenerators.kesirler,
    'oran': QuestionGenerators.oranOranti,
    'cebir-6': QuestionGenerators.cebirsel,
    'alan-olcme': QuestionGenerators.alanOlcme6,

    // 7. Sınıf
    'tam-islemler': QuestionGenerators.tamSayilar,
    'rasyonel': QuestionGenerators.rasyonelSayilar,
    'cebir-7': QuestionGenerators.cebirsel,
    'denklem-7': QuestionGenerators.denklem7,
    'oran-oranti': QuestionGenerators.oranOranti,
    'yuzde-7': QuestionGenerators.yuzde,
    'cokgenler': QuestionGenerators.cokgenler,

    // 8. Sınıf
    'carpanlar-8': QuestionGenerators.carpanlarKatlar,
    'uslu': QuestionGenerators.usluSayilar,
    'karekok': QuestionGenerators.karekok,
    'ozdeslik': QuestionGenerators.ozdeslik,
    'denklem-8': QuestionGenerators.denklem7,
    'esitsizlik': QuestionGenerators.denklem7,
    'ucgenler': QuestionGenerators.ucgenler8,
    'olasilik': QuestionGenerators.oranOranti
};

// ===== ANA FONKSİYONLAR =====
function getTopicsForGrade(grade) {
    return CURRICULUM[grade]?.topics || {};
}

function generateQuestion(topic) {
    const generator = TOPIC_GENERATORS[topic];
    if (generator) {
        return generator();
    }
    return QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
}

function generateQuestionByDifficulty(difficulty) {
    const generators = {
        1: [QuestionGenerators.dogalSayilar, QuestionGenerators.kesirler],
        2: [QuestionGenerators.tamSayilar, QuestionGenerators.oranOranti],
        3: [QuestionGenerators.rasyonelSayilar, QuestionGenerators.denklem7],
        4: [QuestionGenerators.usluSayilar, QuestionGenerators.karekok, QuestionGenerators.ozdeslik]
    };

    const level = Math.min(4, Math.max(1, difficulty));
    const gen = QuestionGenerators.pick(generators[level]);
    return gen();
}

function getQuestionsForLevel(level) {
    const questions = [];
    for (let i = 0; i < 10; i++) {
        questions.push(generateQuestionByDifficulty(Math.ceil(level / 2)));
    }
    return questions;
}
