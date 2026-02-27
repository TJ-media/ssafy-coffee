/**
 * 스타벅스 메뉴 데이터 및 Firestore 업로드 유틸리티
 * 
 * 사용법: 브라우저 콘솔에서 uploadStarbucksMenus() 호출
 * 또는 임시 버튼을 통해 실행
 * 
 * 가격은 Tall 기준입니다.
 * Short: -800원, Grande: +600원, Venti: +1400원
 */
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Menu } from '../types';

export const STARBUCKS_CATEGORIES: string[] = [
    '메뉴 추가', '커피', '디카페인', '음료', '티', '푸드',
];

export const STARBUCKS_MENUS: Menu[] = [
    // ─── 커피 > 에스프레소 ───
    { id: 1, categoryUpper: '커피', categoryLower: '에스프레소', name: '에스프레소', price: 4000, img: '☕', hasOption: false },
    { id: 2, categoryUpper: '커피', categoryLower: '에스프레소', name: '에스프레소 마키아토', price: 4000, img: '☕', hasOption: false },
    { id: 3, categoryUpper: '커피', categoryLower: '에스프레소', name: '에스프레소 콘파나', price: 4500, img: '☕', hasOption: false },

    // ─── 커피 > 아메리카노 ───
    { id: 4, categoryUpper: '커피', categoryLower: '아메리카노', name: '아메리카노', price: 4500, img: '☕', hasOption: true },
    { id: 5, categoryUpper: '커피', categoryLower: '아메리카노', name: '바닐라 아메리카노', price: 5500, img: '☕', hasOption: true },
    { id: 6, categoryUpper: '커피', categoryLower: '아메리카노', name: '헤이즐넛 아메리카노', price: 5500, img: '☕', hasOption: true },

    // ─── 커피 > 라떼 ───
    { id: 7, categoryUpper: '커피', categoryLower: '라떼', name: '카페 라떼', price: 5000, img: '☕', hasOption: true },
    { id: 8, categoryUpper: '커피', categoryLower: '라떼', name: '바닐라 카페 라떼', price: 5500, img: '☕', hasOption: true },
    { id: 9, categoryUpper: '커피', categoryLower: '라떼', name: '카라멜 마키아토', price: 5900, img: '☕', hasOption: true },
    { id: 10, categoryUpper: '커피', categoryLower: '라떼', name: '카페 모카', price: 5500, img: '☕', hasOption: true },
    { id: 11, categoryUpper: '커피', categoryLower: '라떼', name: '화이트 초콜릿 모카', price: 5900, img: '☕', hasOption: true },
    { id: 12, categoryUpper: '커피', categoryLower: '라떼', name: '카푸치노', price: 5000, img: '☕', hasOption: true },
    { id: 13, categoryUpper: '커피', categoryLower: '라떼', name: '스타벅스 돌체 라떼', price: 5900, img: '☕', hasOption: true },
    { id: 14, categoryUpper: '커피', categoryLower: '라떼', name: '오트 라떼', price: 5800, img: '☕', hasOption: true },

    // ─── 커피 > 콜드브루 ───
    { id: 15, categoryUpper: '커피', categoryLower: '콜드브루', name: '콜드 브루', price: 4900, img: '☕', hasOption: false },
    { id: 16, categoryUpper: '커피', categoryLower: '콜드브루', name: '나이트로 콜드 브루', price: 6100, img: '☕', hasOption: false },
    { id: 17, categoryUpper: '커피', categoryLower: '콜드브루', name: '바닐라 크림 콜드 브루', price: 5800, img: '☕', hasOption: false },
    { id: 18, categoryUpper: '커피', categoryLower: '콜드브루', name: '돌체 콜드 브루', price: 5900, img: '☕', hasOption: false },
    { id: 19, categoryUpper: '커피', categoryLower: '콜드브루', name: '시그니처 더 블랙 콜드 브루', price: 5500, img: '☕', hasOption: false },

    // ─── 커피 > 블렌디드 ───
    { id: 20, categoryUpper: '커피', categoryLower: '블렌디드', name: '자바 칩 프라푸치노', price: 6300, img: '🧋', hasOption: false },
    { id: 21, categoryUpper: '커피', categoryLower: '블렌디드', name: '카라멜 프라푸치노', price: 5900, img: '🧋', hasOption: false },
    { id: 22, categoryUpper: '커피', categoryLower: '블렌디드', name: '에스프레소 프라푸치노', price: 5500, img: '🧋', hasOption: false },
    { id: 23, categoryUpper: '커피', categoryLower: '블렌디드', name: '모카 프라푸치노', price: 5900, img: '🧋', hasOption: false },

    // ─── 디카페인 > 에스프레소 ───
    { id: 24, categoryUpper: '디카페인', categoryLower: '에스프레소', name: '디카페인 아메리카노', price: 4500, img: '☕', hasOption: true },
    { id: 25, categoryUpper: '디카페인', categoryLower: '라떼', name: '디카페인 카페 라떼', price: 5000, img: '☕', hasOption: true },
    { id: 26, categoryUpper: '디카페인', categoryLower: '라떼', name: '디카페인 카라멜 마키아토', price: 5900, img: '☕', hasOption: true },
    { id: 27, categoryUpper: '디카페인', categoryLower: '라떼', name: '디카페인 카페 모카', price: 5500, img: '☕', hasOption: true },
    { id: 28, categoryUpper: '디카페인', categoryLower: '라떼', name: '디카페인 스타벅스 돌체 라떼', price: 5900, img: '☕', hasOption: true },

    // ─── 음료 > 피지오 ───
    { id: 29, categoryUpper: '음료', categoryLower: '피지오', name: '쿨 라임 피지오', price: 5800, img: '🥤', hasOption: false },
    { id: 30, categoryUpper: '음료', categoryLower: '피지오', name: '패션 탱고 티 레모네이드', price: 5400, img: '🥤', hasOption: false },
    { id: 31, categoryUpper: '음료', categoryLower: '피지오', name: '유자 패션 피지오', price: 5800, img: '🥤', hasOption: false },

    // ─── 음료 > 프라푸치노 ───
    { id: 32, categoryUpper: '음료', categoryLower: '프라푸치노', name: '바닐라 크림 프라푸치노', price: 5100, img: '🧋', hasOption: false },
    { id: 33, categoryUpper: '음료', categoryLower: '프라푸치노', name: '딸기 딜라이트 요거트 블렌디드', price: 6300, img: '🧋', hasOption: false },
    { id: 34, categoryUpper: '음료', categoryLower: '프라푸치노', name: '초콜릿 크림 칩 프라푸치노', price: 6000, img: '🧋', hasOption: false },
    { id: 35, categoryUpper: '음료', categoryLower: '프라푸치노', name: '망고 바나나 블렌디드', price: 5800, img: '🧋', hasOption: false },

    // ─── 음료 > 논커피 라떼 ───
    { id: 36, categoryUpper: '음료', categoryLower: '라떼', name: '녹차 라떼', price: 5800, img: '🍵', hasOption: true },
    { id: 37, categoryUpper: '음료', categoryLower: '라떼', name: '차이 티 라떼', price: 5400, img: '🍵', hasOption: true },
    { id: 38, categoryUpper: '음료', categoryLower: '라떼', name: '바닐라 플랫 화이트', price: 5900, img: '☕', hasOption: true },
    { id: 39, categoryUpper: '음료', categoryLower: '라떼', name: '초콜릿 라떼', price: 5500, img: '🥤', hasOption: true },

    // ─── 음료 > 주스 ───
    { id: 40, categoryUpper: '음료', categoryLower: '주스', name: '딸기 아사이 레모네이드', price: 5900, img: '🥤', hasOption: false },
    { id: 41, categoryUpper: '음료', categoryLower: '주스', name: '망고 용과 레모네이드', price: 5900, img: '🥤', hasOption: false },
    { id: 42, categoryUpper: '음료', categoryLower: '주스', name: '유자 민트 티', price: 5400, img: '🥤', hasOption: true },

    // ─── 티 ───
    { id: 43, categoryUpper: '티', categoryLower: '티바나', name: '얼 그레이 티', price: 4100, img: '🍵', hasOption: true },
    { id: 44, categoryUpper: '티', categoryLower: '티바나', name: '잉글리쉬 브렉퍼스트 티', price: 4100, img: '🍵', hasOption: true },
    { id: 45, categoryUpper: '티', categoryLower: '티바나', name: '캐모마일 블렌드 티', price: 4100, img: '🍵', hasOption: true },
    { id: 46, categoryUpper: '티', categoryLower: '티바나', name: '히비스커스 블렌드 티', price: 4100, img: '🍵', hasOption: true },
    { id: 47, categoryUpper: '티', categoryLower: '티바나', name: '민트 블렌드 티', price: 4100, img: '🍵', hasOption: true },
    { id: 48, categoryUpper: '티', categoryLower: '티바나', name: '유스베리 티', price: 5100, img: '🍵', hasOption: true },
    { id: 49, categoryUpper: '티', categoryLower: '티바나', name: '자몽 허니 블랙 티', price: 5700, img: '🍵', hasOption: true },
    { id: 50, categoryUpper: '티', categoryLower: '티바나', name: '제주 유기농 녹차', price: 4100, img: '🍵', hasOption: true },

    // ─── 푸드 > 베이커리 ───
    { id: 51, categoryUpper: '푸드', categoryLower: '베이커리', name: '크루아상', price: 3800, img: '🥐', hasOption: false },
    { id: 52, categoryUpper: '푸드', categoryLower: '베이커리', name: '더블 초콜릿 칩 쿠키', price: 3000, img: '🍪', hasOption: false },
    { id: 53, categoryUpper: '푸드', categoryLower: '베이커리', name: '소시지 & 치즈 만쥬', price: 3500, img: '🍞', hasOption: false },
    { id: 54, categoryUpper: '푸드', categoryLower: '베이커리', name: '올드 패션 도넛', price: 3800, img: '🍩', hasOption: false },
    { id: 55, categoryUpper: '푸드', categoryLower: '베이커리', name: '바니라 빈 스콘', price: 4200, img: '🍞', hasOption: false },

    // ─── 푸드 > 케이크 ───
    { id: 56, categoryUpper: '푸드', categoryLower: '케이크', name: '뉴욕 치즈케이크', price: 6500, img: '🍰', hasOption: false },
    { id: 57, categoryUpper: '푸드', categoryLower: '케이크', name: '티라미수', price: 5900, img: '🍰', hasOption: false },
    { id: 58, categoryUpper: '푸드', categoryLower: '케이크', name: '레드 벨벳 케이크', price: 6500, img: '🍰', hasOption: false },

    // ─── 푸드 > 샌드위치 ───
    { id: 59, categoryUpper: '푸드', categoryLower: '샌드위치', name: '햄 & 에그 샌드위치', price: 4500, img: '🥪', hasOption: false },
    { id: 60, categoryUpper: '푸드', categoryLower: '샌드위치', name: '클래식 치킨 샌드위치', price: 5200, img: '🥪', hasOption: false },
    { id: 61, categoryUpper: '푸드', categoryLower: '샌드위치', name: '클럽 샌드위치', price: 5400, img: '🥪', hasOption: false },

    // ─── 추가 ───
    { id: 62, categoryUpper: '추가', categoryLower: '추가', name: '샷 추가', price: 600, img: '➕', hasOption: false },
    { id: 63, categoryUpper: '추가', categoryLower: '추가', name: '바닐라 시럽 추가', price: 600, img: '➕', hasOption: false },
    { id: 64, categoryUpper: '추가', categoryLower: '추가', name: '카라멜 시럽 추가', price: 600, img: '➕', hasOption: false },
    { id: 65, categoryUpper: '추가', categoryLower: '추가', name: '헤이즐넛 시럽 추가', price: 600, img: '➕', hasOption: false },
    { id: 66, categoryUpper: '추가', categoryLower: '추가', name: '휘핑크림 추가', price: 600, img: '➕', hasOption: false },
    { id: 67, categoryUpper: '추가', categoryLower: '추가', name: '자바 칩 추가', price: 600, img: '➕', hasOption: false },
];

/**
 * 스타벅스 메뉴를 Firestore menus/starbucks 문서에 업로드
 */
export const uploadStarbucksMenus = async () => {
    const menuDocRef = doc(db, 'menus', 'starbucks');
    await setDoc(menuDocRef, {
        cafeId: 'starbucks',
        cafeName: '스타벅스',
        cafeImg: '🟢',
        categories: STARBUCKS_CATEGORIES,
        items: STARBUCKS_MENUS,
    });
    console.log('✅ 스타벅스 메뉴 업로드 완료!');
};