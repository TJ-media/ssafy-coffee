/**
 * 영어 키보드 입력을 한글 자판 매핑으로 변환하는 유틸리티
 * 예: "dkapflzksh" → "아메리카노"
 */

// 영문 → 한글 자모 매핑 (두벌식 키보드 기준)
const ENG_TO_KOR: Record<string, string> = {
    'q': 'ㅂ', 'w': 'ㅈ', 'e': 'ㄷ', 'r': 'ㄱ', 't': 'ㅅ',
    'y': 'ㅛ', 'u': 'ㅕ', 'i': 'ㅑ', 'o': 'ㅐ', 'p': 'ㅔ',
    'a': 'ㅁ', 's': 'ㄴ', 'd': 'ㅇ', 'f': 'ㄹ', 'g': 'ㅎ',
    'h': 'ㅗ', 'j': 'ㅓ', 'k': 'ㅏ', 'l': 'ㅣ',
    'z': 'ㅋ', 'x': 'ㅌ', 'c': 'ㅊ', 'v': 'ㅍ', 'b': 'ㅠ',
    'n': 'ㅜ', 'm': 'ㅡ',
    // 쉬프트 조합
    'Q': 'ㅃ', 'W': 'ㅉ', 'E': 'ㄸ', 'R': 'ㄲ', 'T': 'ㅆ',
    'O': 'ㅒ', 'P': 'ㅖ',
};

// 초성 목록
const CHOSEONG = [
    'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
    'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

// 중성 목록
const JUNGSEONG = [
    'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ',
    'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'
];

// 종성 목록 (빈 문자열 = 종성 없음)
const JONGSEONG = [
    '', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ',
    'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ',
    'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

// 복합 중성 조합 테이블
const COMPLEX_JUNGSEONG: Record<string, string> = {
    'ㅗㅏ': 'ㅘ', 'ㅗㅐ': 'ㅙ', 'ㅗㅣ': 'ㅚ',
    'ㅜㅓ': 'ㅝ', 'ㅜㅔ': 'ㅞ', 'ㅜㅣ': 'ㅟ',
    'ㅡㅣ': 'ㅢ'
};

// 복합 종성 조합 테이블
const COMPLEX_JONGSEONG: Record<string, string> = {
    'ㄱㅅ': 'ㄳ', 'ㄴㅈ': 'ㄵ', 'ㄴㅎ': 'ㄶ',
    'ㄹㄱ': 'ㄺ', 'ㄹㅁ': 'ㄻ', 'ㄹㅂ': 'ㄼ',
    'ㄹㅅ': 'ㄽ', 'ㄹㅌ': 'ㄾ', 'ㄹㅍ': 'ㄿ',
    'ㄹㅎ': 'ㅀ', 'ㅂㅅ': 'ㅄ'
};

// 복합 종성 분리 테이블
const SPLIT_JONGSEONG: Record<string, [string, string]> = {
    'ㄳ': ['ㄱ', 'ㅅ'], 'ㄵ': ['ㄴ', 'ㅈ'], 'ㄶ': ['ㄴ', 'ㅎ'],
    'ㄺ': ['ㄹ', 'ㄱ'], 'ㄻ': ['ㄹ', 'ㅁ'], 'ㄼ': ['ㄹ', 'ㅂ'],
    'ㄽ': ['ㄹ', 'ㅅ'], 'ㄾ': ['ㄹ', 'ㅌ'], 'ㄿ': ['ㄹ', 'ㅍ'],
    'ㅀ': ['ㄹ', 'ㅎ'], 'ㅄ': ['ㅂ', 'ㅅ']
};

function isChoseong(c: string): boolean {
    return CHOSEONG.includes(c);
}

function isJungseong(c: string): boolean {
    return JUNGSEONG.includes(c);
}

function composeHangul(cho: number, jung: number, jong: number): string {
    return String.fromCharCode(0xAC00 + cho * 21 * 28 + jung * 28 + jong);
}

/**
 * 영어 키보드 입력을 한글 자판 매핑으로 변환
 * @param input 영어 문자열
 * @returns 한글로 변환된 문자열
 */
export function convertEngToKor(input: string): string {
    // 한글이 이미 포함되어 있으면 변환하지 않음
    if (/[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(input)) {
        return input;
    }

    // 영문을 자모로 변환
    const jamos: string[] = [];
    for (const ch of input) {
        if (ENG_TO_KOR[ch]) {
            jamos.push(ENG_TO_KOR[ch]);
        } else {
            jamos.push(ch);
        }
    }

    // 자모 조합
    return assembleJamos(jamos);
}

function assembleJamos(jamos: string[]): string {
    let result = '';
    let cho = -1;
    let jung = -1;
    let jong = -1;

    const flush = () => {
        if (cho >= 0 && jung >= 0) {
            result += composeHangul(cho, jung, jong >= 0 ? jong : 0);
        } else if (cho >= 0) {
            result += CHOSEONG[cho];
        }
        cho = -1;
        jung = -1;
        jong = -1;
    };

    for (let i = 0; i < jamos.length; i++) {
        const c = jamos[i];

        if (isChoseong(c) && !isJungseong(c)) {
            // 순수 자음
            if (cho < 0) {
                cho = CHOSEONG.indexOf(c);
            } else if (jung < 0) {
                flush();
                cho = CHOSEONG.indexOf(c);
            } else if (jong < 0) {
                // 종성 후보
                jong = JONGSEONG.indexOf(c);
                if (jong < 0) {
                    // 종성이 될 수 없는 자음 → flush 후 새 초성
                    jong = -1;
                    flush();
                    cho = CHOSEONG.indexOf(c);
                }
            } else {
                // 이미 종성이 있음 → 복합 종성 시도
                const currentJong = JONGSEONG[jong];
                const complex = COMPLEX_JONGSEONG[currentJong + c];
                if (complex) {
                    jong = JONGSEONG.indexOf(complex);
                } else {
                    flush();
                    cho = CHOSEONG.indexOf(c);
                }
            }
        } else if (isJungseong(c)) {
            // 모음
            if (cho < 0) {
                // 초성 없이 모음만
                result += c;
            } else if (jung < 0) {
                jung = JUNGSEONG.indexOf(c);
            } else if (jong < 0) {
                // 복합 중성 시도
                const currentJung = JUNGSEONG[jung];
                const complex = COMPLEX_JUNGSEONG[currentJung + c];
                if (complex) {
                    jung = JUNGSEONG.indexOf(complex);
                } else {
                    flush();
                    result += c;
                }
            } else {
                // 종성이 있는데 모음이 오면 → 종성을 다음 글자의 초성으로
                const currentJong = JONGSEONG[jong];
                const split = SPLIT_JONGSEONG[currentJong];

                if (split) {
                    // 복합 종성 분리
                    jong = JONGSEONG.indexOf(split[0]);
                    flush();
                    cho = CHOSEONG.indexOf(split[1]);
                    jung = JUNGSEONG.indexOf(c);
                } else {
                    const prevJong = currentJong;
                    jong = -1;
                    flush();
                    cho = CHOSEONG.indexOf(prevJong);
                    if (cho >= 0) {
                        jung = JUNGSEONG.indexOf(c);
                    } else {
                        result += prevJong + c;
                    }
                }
            }
        } else if (isChoseong(c) && isJungseong(c)) {
            // 자음이면서 모음인 경우는 없지만 안전장치
            flush();
            result += c;
        } else {
            // 한글이 아닌 문자
            flush();
            result += c;
        }
    }

    flush();
    return result;
}

/**
 * 입력이 영문 키보드 입력인지 판별
 */
export function isEnglishInput(input: string): boolean {
    return /^[a-zA-Z\s]+$/.test(input);
}
