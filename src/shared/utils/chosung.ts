/**
 * 한글 초성 검색 유틸리티
 * 예: "ㅇㅁㄹㅋㄴ" → "아메리카노" 매칭
 */

// 초성 목록 (유니코드 순서)
const CHOSUNG_LIST = [
    'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
    'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

/**
 * 한글 완성형 문자에서 초성을 추출
 */
export function getChosung(str: string): string {
    let result = '';
    for (const ch of str) {
        const code = ch.charCodeAt(0);
        // 완성형 한글 범위 (가 ~ 힣)
        if (code >= 0xAC00 && code <= 0xD7A3) {
            const chosungIndex = Math.floor((code - 0xAC00) / (21 * 28));
            result += CHOSUNG_LIST[chosungIndex];
        } else {
            result += ch;
        }
    }
    return result;
}

/**
 * 문자가 한글 자음(초성)인지 판별
 */
function isChosung(ch: string): boolean {
    return CHOSUNG_LIST.includes(ch);
}

/**
 * 입력 문자열이 모두 초성(자음)으로만 이루어져 있는지 판별
 */
export function isAllChosung(str: string): boolean {
    if (!str) return false;
    for (const ch of str) {
        if (ch === ' ') continue; // 공백은 무시
        if (!isChosung(ch)) return false;
    }
    return true;
}

/**
 * 메뉴 이름이 초성 검색어와 매칭되는지 확인
 * 공백을 무시하고 연속으로 일치하는지 체크
 */
export function matchChosung(menuName: string, query: string): boolean {
    const menuChosung = getChosung(menuName.replace(/\s/g, ''));
    const cleanQuery = query.replace(/\s/g, '');
    return menuChosung.includes(cleanQuery);
}
