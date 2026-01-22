// Matematik Soruları - 8. Sınıf Özdeşlikler ve Cebirsel İfadeler

const QUESTIONS = [
    // Kolay Sorular (Seviye 1-2)
    {
        id: 1,
        question: "(a + b)² ifadesinin açılımı nedir?",
        options: [
            "a² + b²",
            "a² + 2ab + b²",
            "a² - 2ab + b²",
            "a² - b²"
        ],
        correct: 1,
        difficulty: 1
    },
    {
        id: 2,
        question: "(a - b)² ifadesinin açılımı nedir?",
        options: [
            "a² - b²",
            "a² + 2ab + b²",
            "a² - 2ab + b²",
            "a² + b²"
        ],
        correct: 2,
        difficulty: 1
    },
    {
        id: 3,
        question: "(x + 3)² ifadesini açınız.",
        options: [
            "x² + 9",
            "x² + 3x + 9",
            "x² + 6x + 9",
            "x² - 6x + 9"
        ],
        correct: 2,
        difficulty: 1
    },
    {
        id: 4,
        question: "(y - 2)² ifadesini açınız.",
        options: [
            "y² - 4",
            "y² - 4y + 4",
            "y² + 4y + 4",
            "y² - 2y + 4"
        ],
        correct: 1,
        difficulty: 1
    },
    {
        id: 5,
        question: "a² - b² ifadesi nasıl çarpanlarına ayrılır?",
        options: [
            "(a + b)(a + b)",
            "(a - b)(a - b)",
            "(a + b)(a - b)",
            "(a + b)²"
        ],
        correct: 2,
        difficulty: 1
    },
    {
        id: 6,
        question: "x² - 9 ifadesini çarpanlarına ayırınız.",
        options: [
            "(x - 3)²",
            "(x + 3)²",
            "(x + 3)(x - 3)",
            "(x - 9)(x + 1)"
        ],
        correct: 2,
        difficulty: 1
    },
    {
        id: 7,
        question: "(2 + x)² ifadesini açınız.",
        options: [
            "4 + x²",
            "4 + 2x + x²",
            "4 + 4x + x²",
            "2 + 4x + x²"
        ],
        correct: 2,
        difficulty: 1
    },
    {
        id: 8,
        question: "x² - 16 ifadesini çarpanlarına ayırınız.",
        options: [
            "(x - 4)²",
            "(x + 4)(x - 4)",
            "(x - 8)(x + 2)",
            "(x + 16)(x - 1)"
        ],
        correct: 1,
        difficulty: 1
    },

    // Orta Sorular (Seviye 3-4)
    {
        id: 9,
        question: "(2x + 3)² ifadesini açınız.",
        options: [
            "4x² + 9",
            "2x² + 6x + 9",
            "4x² + 6x + 9",
            "4x² + 12x + 9"
        ],
        correct: 3,
        difficulty: 2
    },
    {
        id: 10,
        question: "(3a - 2b)² ifadesini açınız.",
        options: [
            "9a² - 4b²",
            "9a² - 6ab + 4b²",
            "9a² - 12ab + 4b²",
            "9a² + 12ab + 4b²"
        ],
        correct: 2,
        difficulty: 2
    },
    {
        id: 11,
        question: "x² + 6x + 9 ifadesini çarpanlarına ayırınız.",
        options: [
            "(x + 3)²",
            "(x - 3)²",
            "(x + 9)(x + 1)",
            "(x + 6)(x + 3)"
        ],
        correct: 0,
        difficulty: 2
    },
    {
        id: 12,
        question: "4x² - 25 ifadesini çarpanlarına ayırınız.",
        options: [
            "(2x - 5)²",
            "(2x + 5)²",
            "(2x + 5)(2x - 5)",
            "(4x + 5)(x - 5)"
        ],
        correct: 2,
        difficulty: 2
    },
    {
        id: 13,
        question: "a² - 10a + 25 ifadesini çarpanlarına ayırınız.",
        options: [
            "(a + 5)²",
            "(a - 5)²",
            "(a - 25)(a - 1)",
            "(a + 5)(a - 5)"
        ],
        correct: 1,
        difficulty: 2
    },
    {
        id: 14,
        question: "9x² + 12x + 4 ifadesini çarpanlarına ayırınız.",
        options: [
            "(3x + 2)²",
            "(3x - 2)²",
            "(9x + 4)(x + 1)",
            "(3x + 4)(3x + 1)"
        ],
        correct: 0,
        difficulty: 2
    },
    {
        id: 15,
        question: "16a² - 49b² ifadesini çarpanlarına ayırınız.",
        options: [
            "(4a - 7b)²",
            "(4a + 7b)(4a - 7b)",
            "(8a + 7b)(2a - 7b)",
            "(4a + 49b)(4a - b)"
        ],
        correct: 1,
        difficulty: 2
    },
    {
        id: 16,
        question: "(x + 2)(x - 2) işleminin sonucu nedir?",
        options: [
            "x² + 4",
            "x² - 4",
            "x² - 2x - 4",
            "x² + 2x - 4"
        ],
        correct: 1,
        difficulty: 2
    },

    // Zor Sorular (Seviye 5-6)
    {
        id: 17,
        question: "(a + b)³ ifadesinin açılımı nedir?",
        options: [
            "a³ + b³",
            "a³ + 3a²b + 3ab² + b³",
            "a³ - 3a²b + 3ab² - b³",
            "a³ + a²b + ab² + b³"
        ],
        correct: 1,
        difficulty: 3
    },
    {
        id: 18,
        question: "(x - 1)³ ifadesini açınız.",
        options: [
            "x³ - 1",
            "x³ - 3x² + 3x - 1",
            "x³ + 3x² - 3x + 1",
            "x³ - x² + x - 1"
        ],
        correct: 1,
        difficulty: 3
    },
    {
        id: 19,
        question: "a³ + b³ ifadesi nasıl çarpanlarına ayrılır?",
        options: [
            "(a + b)(a² + ab + b²)",
            "(a + b)(a² - ab + b²)",
            "(a - b)(a² + ab + b²)",
            "(a + b)³"
        ],
        correct: 1,
        difficulty: 3
    },
    {
        id: 20,
        question: "a³ - b³ ifadesi nasıl çarpanlarına ayrılır?",
        options: [
            "(a - b)(a² + ab + b²)",
            "(a - b)(a² - ab + b²)",
            "(a + b)(a² - ab - b²)",
            "(a - b)³"
        ],
        correct: 0,
        difficulty: 3
    },
    {
        id: 21,
        question: "(2x + 1)² - (x - 1)² işlemini sadeleştiriniz.",
        options: [
            "3x² + 6x",
            "3x² + 2x",
            "3x² + 6x + 2",
            "x² + 6x"
        ],
        correct: 0,
        difficulty: 3
    },
    {
        id: 22,
        question: "x³ - 8 ifadesini çarpanlarına ayırınız.",
        options: [
            "(x - 2)(x² + 2x + 4)",
            "(x - 2)(x² - 2x + 4)",
            "(x + 2)(x² - 2x + 4)",
            "(x - 2)³"
        ],
        correct: 0,
        difficulty: 3
    },
    {
        id: 23,
        question: "x³ + 27 ifadesini çarpanlarına ayırınız.",
        options: [
            "(x + 3)(x² + 3x + 9)",
            "(x + 3)(x² - 3x + 9)",
            "(x - 3)(x² + 3x + 9)",
            "(x + 3)³"
        ],
        correct: 1,
        difficulty: 3
    },
    {
        id: 24,
        question: "(a + b + c)² açılımında a² + b² + c² dışında hangi terimler vardır?",
        options: [
            "ab + bc + ca",
            "2ab + 2bc + 2ca",
            "abc",
            "a + b + c"
        ],
        correct: 1,
        difficulty: 3
    },

    // Çok Zor Sorular (Seviye 7+)
    {
        id: 25,
        question: "(x + 2)³ - (x - 2)³ işlemini sadeleştiriniz.",
        options: [
            "16",
            "12x² + 16",
            "12x² + 32",
            "6x² + 16"
        ],
        correct: 1,
        difficulty: 4
    },
    {
        id: 26,
        question: "x⁴ - 16 ifadesini çarpanlarına ayırınız.",
        options: [
            "(x² + 4)(x² - 4)",
            "(x² + 4)(x + 2)(x - 2)",
            "(x + 2)²(x - 2)²",
            "(x⁴ - 16)"
        ],
        correct: 1,
        difficulty: 4
    },
    {
        id: 27,
        question: "(a² + ab + b²)(a - b) işleminin sonucu nedir?",
        options: [
            "a³ - b³",
            "a³ + b³",
            "a³ - ab² - b³",
            "(a - b)³"
        ],
        correct: 0,
        difficulty: 4
    },
    {
        id: 28,
        question: "x = 99 ise x² + 2x + 1 değeri kaçtır?",
        options: [
            "9801",
            "10000",
            "9900",
            "10201"
        ],
        correct: 1,
        difficulty: 4
    },
    {
        id: 29,
        question: "101² - 99² işleminin sonucu kaçtır?",
        options: [
            "200",
            "400",
            "4",
            "20000"
        ],
        correct: 1,
        difficulty: 4
    },
    {
        id: 30,
        question: "(x + y)² - (x - y)² işlemini sadeleştiriniz.",
        options: [
            "4xy",
            "2xy",
            "2x² + 2y²",
            "4x² - 4y²"
        ],
        correct: 0,
        difficulty: 4
    }
];

// Zorluk seviyesine göre soruları filtrele
function getQuestionsByDifficulty(difficulty) {
    return QUESTIONS.filter(q => q.difficulty === difficulty);
}

// Rastgele soru seç
function getRandomQuestion(difficulty = null) {
    let pool = difficulty ? getQuestionsByDifficulty(difficulty) : QUESTIONS;
    return pool[Math.floor(Math.random() * pool.length)];
}

// Seviye için uygun zorlukta sorular al
function getQuestionsForLevel(level) {
    let difficulty;
    if (level <= 2) difficulty = 1;
    else if (level <= 4) difficulty = 2;
    else if (level <= 6) difficulty = 3;
    else difficulty = 4;
    
    return getQuestionsByDifficulty(difficulty);
}
