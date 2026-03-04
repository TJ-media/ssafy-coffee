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

export const uploadStarbucksData = async () => {
    const starbucksData = {
        cafeId: 'starbucks',
        cafeImg: '🟢',
        cafeName: '스타벅스',
        categories: ['메뉴 추가', '커피', '디카페인', '블론드', '콜드 브루', '프라푸치노', '티 음료', '피지오', '기타', '병음료', '트렌타', '투고백'],
        items: [
            // --- 1. 커피 (일반) ---
            { id: 200, categoryUpper: '커피', categoryLower: '커피', name: '스타벅스 에어로카노', price: 4900, hotPrice: 4900, img: '☕', hasOption: true, defaultOption: 'ICE', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 201, categoryUpper: '커피', categoryLower: '모카', name: '아이스 두바이 초콜릿 모카', price: 7300, hotPrice: 7300, img: '☕', hasOption: true, defaultOption: 'ICE', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 202, categoryUpper: '커피', categoryLower: '라떼', name: '에스프레소 크림 프렌치 바닐라 라떼', price: 6700, hotPrice: 6700, img: '☕', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 203, categoryUpper: '커피', categoryLower: '라떼', name: '더블 에스프레소 크림 라떼', price: 6500, hotPrice: 6500, img: '☕', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 204, categoryUpper: '커피', categoryLower: '커피', name: '시그니처 코르타도', price: 5800, hotPrice: 5800, img: '☕', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 205, categoryUpper: '커피', categoryLower: '라떼', name: '밀크카라멜 라떼', price: 5800, hotPrice: 5800, img: '☕', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 206, categoryUpper: '커피', categoryLower: '커피', name: '플랫화이트', price: 5800, hotPrice: 5800, img: '☕', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 207, categoryUpper: '커피', categoryLower: '커피', name: '카페 아메리카노', price: 4700, hotPrice: 4700, img: '☕', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 208, categoryUpper: '커피', categoryLower: '라떼', name: '카페 라떼', price: 5200, hotPrice: 5200, img: '☕', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 209, categoryUpper: '커피', categoryLower: '라떼', name: '바닐라 라떼', price: 5200, hotPrice: 5200, img: '☕', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 210, categoryUpper: '커피', categoryLower: '라떼', name: '스타벅스 돌체라떼', price: 6100, hotPrice: 6100, img: '☕', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 211, categoryUpper: '커피', categoryLower: '모카', name: '카페 모카', price: 5700, hotPrice: 5700, img: '☕', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 212, categoryUpper: '커피', categoryLower: '커피', name: '카푸치노', price: 5200, hotPrice: 5200, img: '☕', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 213, categoryUpper: '커피', categoryLower: '마키아또', name: '카라멜 마키아또', price: 6100, hotPrice: 6100, img: '☕', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 214, categoryUpper: '커피', categoryLower: '모카', name: '화이트 초콜릿 모카', price: 6100, hotPrice: 6100, img: '☕', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 215, categoryUpper: '커피', categoryLower: '더블샷', name: '커피 스타벅스 더블 샷', price: 5300, hotPrice: 5300, img: '☕', hasOption: true, defaultOption: 'ICE', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 216, categoryUpper: '커피', categoryLower: '더블샷', name: '바닐라 스타벅스 더블 샷', price: 5300, hotPrice: 5300, img: '☕', hasOption: true, defaultOption: 'ICE', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 217, categoryUpper: '커피', categoryLower: '더블샷', name: '헤이즐넛 스타벅스 더블 샷', price: 5300, hotPrice: 5300, img: '☕', hasOption: true, defaultOption: 'ICE', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 218, categoryUpper: '커피', categoryLower: '커피', name: '에스프레소', price: 3900, img: '☕', hasOption: false, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 219, categoryUpper: '커피', categoryLower: '커피', name: '에스프레소 마키아또', price: 3900, img: '☕', hasOption: false, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 220, categoryUpper: '커피', categoryLower: '커피', name: '에스프레소 콘 파나', price: 4100, img: '☕', hasOption: false, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },

            // --- 2. 디카페인 커피 ---
            { id: 221, categoryUpper: '디카페인', categoryLower: '모카', name: '아이스 디카페인 두바이 초콜릿 모카', price: 7600, hotPrice: 7600, img: '☕', hasOption: true, defaultOption: 'ICE', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 222, categoryUpper: '디카페인', categoryLower: '라떼', name: '디카페인 에스프레소 크림 프렌치 바닐라 라떼', price: 7000, hotPrice: 7000, img: '☕', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 223, categoryUpper: '디카페인', categoryLower: '라떼', name: '디카페인 더블 에스프레소 크림 라떼', price: 6800, hotPrice: 6800, img: '☕', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 224, categoryUpper: '디카페인', categoryLower: '모카', name: '아이스 1/2디카페인 두바이 초콜릿 모카', price: 7600, hotPrice: 7600, img: '☕', hasOption: true, defaultOption: 'ICE', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 225, categoryUpper: '디카페인', categoryLower: '라떼', name: '1/2디카페인 에스프레소 크림 프렌치 바닐라 라떼', price: 7000, hotPrice: 7000, img: '☕', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 226, categoryUpper: '디카페인', categoryLower: '라떼', name: '1/2디카페인 더블 에스프레소 크림 라떼', price: 6800, hotPrice: 6800, img: '☕', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 227, categoryUpper: '디카페인', categoryLower: '커피', name: '디카페인 스타벅스 에어로카노', price: 5200, hotPrice: 5200, img: '☕', hasOption: true, defaultOption: 'ICE', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 228, categoryUpper: '디카페인', categoryLower: '에스프레소', name: '디카페인 코르타도', price: 6100, hotPrice: 6100, img: '☕', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 229, categoryUpper: '디카페인', categoryLower: '라떼', name: '디카페인 밀크카라멜 라떼', price: 6100, hotPrice: 6100, img: '☕', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 230, categoryUpper: '디카페인', categoryLower: '커피', name: '디카페인 플랫 화이트', price: 6100, hotPrice: 6100, img: '☕', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 231, categoryUpper: '디카페인', categoryLower: '아메리카노', name: '디카페인 카페 아메리카노', price: 5000, hotPrice: 5000, img: '☕', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 232, categoryUpper: '디카페인', categoryLower: '라떼', name: '디카페인 카페 라떼', price: 5500, hotPrice: 5500, img: '☕', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 233, categoryUpper: '디카페인', categoryLower: '라떼', name: '디카페인 바닐라 라떼', price: 5500, hotPrice: 5500, img: '☕', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 234, categoryUpper: '디카페인', categoryLower: '라떼', name: '디카페인 스타벅스 돌체라떼', price: 6400, hotPrice: 6400, img: '☕', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 235, categoryUpper: '디카페인', categoryLower: '마키아또', name: '디카페인 카라멜 마키아또', price: 6400, hotPrice: 6400, img: '☕', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 236, categoryUpper: '디카페인', categoryLower: '모카', name: '디카페인 카페 모카', price: 6000, hotPrice: 6000, img: '☕', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 237, categoryUpper: '디카페인', categoryLower: '커피', name: '디카페인 카푸치노', price: 5500, hotPrice: 5500, img: '☕', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 238, categoryUpper: '디카페인', categoryLower: '모카', name: '디카페인 화이트 초콜릿 모카', price: 6400, hotPrice: 6400, img: '☕', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 239, categoryUpper: '디카페인', categoryLower: '더블샷', name: '디카페인 커피 스타벅스 더블 샷', price: 5600, hotPrice: 5600, img: '☕', hasOption: true, defaultOption: 'ICE', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 240, categoryUpper: '디카페인', categoryLower: '더블샷', name: '디카페인 바닐라 스타벅스 더블 샷', price: 5600, hotPrice: 5600, img: '☕', hasOption: true, defaultOption: 'ICE', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 241, categoryUpper: '디카페인', categoryLower: '더블샷', name: '디카페인 헤이즐넛 스타벅스 더블 샷', price: 5600, hotPrice: 5600, img: '☕', hasOption: true, defaultOption: 'ICE', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 242, categoryUpper: '디카페인', categoryLower: '에스프레소', name: '디카페인 에스프레소', price: 4200, img: '☕', hasOption: false, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 243, categoryUpper: '디카페인', categoryLower: '에스프레소', name: '디카페인 에스프레소 콘 파나', price: 4400, img: '☕', hasOption: false, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 244, categoryUpper: '디카페인', categoryLower: '에스프레소', name: '디카페인 에스프레소 마키아또', price: 4200, img: '☕', hasOption: false, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            // 1/2 디카페인 시리즈
            { id: 245, categoryUpper: '디카페인', categoryLower: '커피', name: '1/2디카페인 스타벅스 에어로카노', price: 5200, hotPrice: 5200, img: '☕', hasOption: true, defaultOption: 'ICE', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 246, categoryUpper: '디카페인', categoryLower: '에스프레소', name: '1/2디카페인 코르타도', price: 6100, hotPrice: 6100, img: '☕', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 247, categoryUpper: '디카페인', categoryLower: '라떼', name: '1/2디카페인 밀크카라멜 라떼', price: 6100, hotPrice: 6100, img: '☕', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 248, categoryUpper: '디카페인', categoryLower: '커피', name: '1/2디카페인 플랫 화이트', price: 6100, hotPrice: 6100, img: '☕', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 249, categoryUpper: '디카페인', categoryLower: '아메리카노', name: '1/2디카페인 카페 아메리카노', price: 5000, hotPrice: 5000, img: '☕', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 250, categoryUpper: '디카페인', categoryLower: '라떼', name: '1/2디카페인 카페 라떼', price: 5500, hotPrice: 5500, img: '☕', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 251, categoryUpper: '디카페인', categoryLower: '라떼', name: '1/2디카페인 바닐라 라떼', price: 5500, hotPrice: 5500, img: '☕', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 252, categoryUpper: '디카페인', categoryLower: '라떼', name: '1/2디카페인 스타벅스 돌체라떼', price: 6400, hotPrice: 6400, img: '☕', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 253, categoryUpper: '디카페인', categoryLower: '마키아또', name: '1/2디카페인 카라멜 마키아또', price: 6400, hotPrice: 6400, img: '☕', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 254, categoryUpper: '디카페인', categoryLower: '모카', name: '1/2디카페인 카페 모카', price: 6000, hotPrice: 6000, img: '☕', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 255, categoryUpper: '디카페인', categoryLower: '커피', name: '1/2디카페인 카푸치노', price: 5500, hotPrice: 5500, img: '☕', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 256, categoryUpper: '디카페인', categoryLower: '모카', name: '1/2디카페인 화이트 초콜릿 모카', price: 6400, hotPrice: 6400, img: '☕', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 257, categoryUpper: '디카페인', categoryLower: '더블샷', name: '1/2디카페인 커피 스타벅스 더블 샷', price: 5600, hotPrice: 5600, img: '☕', hasOption: true, defaultOption: 'ICE', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 258, categoryUpper: '디카페인', categoryLower: '더블샷', name: '1/2디카페인 바닐라 스타벅스 더블 샷', price: 5600, hotPrice: 5600, img: '☕', hasOption: true, defaultOption: 'ICE', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 259, categoryUpper: '디카페인', categoryLower: '더블샷', name: '1/2디카페인 헤이즐넛 스타벅스 더블 샷', price: 5600, hotPrice: 5600, img: '☕', hasOption: true, defaultOption: 'ICE', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 260, categoryUpper: '디카페인', categoryLower: '에스프레소', name: '1/2디카페인 에스프레소', price: 4200, img: '☕', hasOption: false, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 261, categoryUpper: '디카페인', categoryLower: '에스프레소', name: '1/2디카페인 에스프레소 콘 파나', price: 4400, img: '☕', hasOption: false, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 262, categoryUpper: '디카페인', categoryLower: '에스프레소', name: '1/2디카페인 에스프레소 마키아또', price: 4200, img: '☕', hasOption: false, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },

            // --- 3. 커피 (블론드) ---
            { id: 263, categoryUpper: '블론드', categoryLower: '라떼', name: '블론드 에스프레소 크림 프렌치 바닐라 라떼', price: 6700, hotPrice: 6700, img: '☕', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 264, categoryUpper: '블론드', categoryLower: '모카', name: '아이스 블론드 두바이 초콜릿 모카', price: 7300, hotPrice: 7300, img: '☕', hasOption: true, defaultOption: 'ICE', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 265, categoryUpper: '블론드', categoryLower: '라떼', name: '블론드 더블 에스프레소 크림 라떼', price: 6500, hotPrice: 6500, img: '☕', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 266, categoryUpper: '블론드', categoryLower: '커피', name: '블론드 스타벅스 에어로카노', price: 4900, hotPrice: 4900, img: '☕', hasOption: true, defaultOption: 'ICE', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 267, categoryUpper: '블론드', categoryLower: '에스프레소', name: '코르타도 (블론드)', price: 5800, hotPrice: 5800, img: '☕', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 268, categoryUpper: '블론드', categoryLower: '라떼', name: '블론드 밀크카라멜 라떼', price: 5800, hotPrice: 5800, img: '☕', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 269, categoryUpper: '블론드', categoryLower: '커피', name: '블론드 플랫 화이트', price: 5800, hotPrice: 5800, img: '☕', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 270, categoryUpper: '블론드', categoryLower: '아메리카노', name: '블론드 카페 아메리카노', price: 4700, hotPrice: 4700, img: '☕', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 271, categoryUpper: '블론드', categoryLower: '라떼', name: '블론드 카페 라떼', price: 5200, hotPrice: 5200, img: '☕', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 272, categoryUpper: '블론드', categoryLower: '라떼', name: '블론드 바닐라 라떼', price: 5200, hotPrice: 5200, img: '☕', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 273, categoryUpper: '블론드', categoryLower: '라떼', name: '블론드 스타벅스 돌체라떼', price: 6100, hotPrice: 6100, img: '☕', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 274, categoryUpper: '블론드', categoryLower: '모카', name: '블론드 카페 모카', price: 5700, hotPrice: 5700, img: '☕', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 275, categoryUpper: '블론드', categoryLower: '커피', name: '블론드 카푸치노', price: 5200, hotPrice: 5200, img: '☕', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 276, categoryUpper: '블론드', categoryLower: '마키아또', name: '블론드 카라멜 마키아또', price: 6100, hotPrice: 6100, img: '☕', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 277, categoryUpper: '블론드', categoryLower: '모카', name: '블론드 화이트 초콜릿 모카', price: 6100, hotPrice: 6100, img: '☕', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 278, categoryUpper: '블론드', categoryLower: '더블샷', name: '블론드 커피 스타벅스 더블 샷', price: 5300, hotPrice: 5300, img: '☕', hasOption: true, defaultOption: 'ICE', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 279, categoryUpper: '블론드', categoryLower: '더블샷', name: '블론드 바닐라 스타벅스 더블 샷', price: 5300, hotPrice: 5300, img: '☕', hasOption: true, defaultOption: 'ICE', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 280, categoryUpper: '블론드', categoryLower: '더블샷', name: '블론드 헤이즐넛 스타벅스 더블 샷', price: 5300, hotPrice: 5300, img: '☕', hasOption: true, defaultOption: 'ICE', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 281, categoryUpper: '블론드', categoryLower: '에스프레소', name: '블론드 에스프레소', price: 3900, img: '☕', hasOption: false, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 282, categoryUpper: '블론드', categoryLower: '에스프레소', name: '블론드 에스프레소 마키아또', price: 3900, img: '☕', hasOption: false, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 283, categoryUpper: '블론드', categoryLower: '에스프레소', name: '블론드 에스프레소 콘 파나', price: 4100, img: '☕', hasOption: false, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },

            // --- 4. 콜드 브루 ---
            { id: 284, categoryUpper: '콜드 브루', categoryLower: '콜드브루', name: '바닐라 크림 콜드 브루', price: 6000, img: '☕', hasOption: true, defaultOption: 'ICE', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 285, categoryUpper: '콜드 브루', categoryLower: '콜드브루', name: '콜드 브루', price: 5100, img: '☕', hasOption: true, defaultOption: 'ICE', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 286, categoryUpper: '콜드 브루', categoryLower: '콜드브루', name: '시그니처 더 블랙 콜드 브루', price: 20400, img: '☕', hasOption: false, defaultOption: 'ICE', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 287, categoryUpper: '콜드 브루', categoryLower: '콜드브루', name: '돌체 콜드 브루', price: 6000, img: '☕', hasOption: true, defaultOption: 'ICE', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 288, categoryUpper: '콜드 브루', categoryLower: '콜드브루', name: '베르가못 콜드 브루', price: 6000, img: '☕', hasOption: true, defaultOption: 'ICE', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 289, categoryUpper: '콜드 브루', categoryLower: '콜드브루', name: '오트 콜드 브루', price: 6000, img: '☕', hasOption: true, defaultOption: 'ICE', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },

            // --- 5. 프라푸치노 / 블렌디드 ---
            { id: 290, categoryUpper: '프라푸치노', categoryLower: '블렌디드', name: '자몽 허니 레몬 블렌디드', price: 6300, img: '🥤', hasOption: true, defaultOption: 'ICE', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 291, categoryUpper: '프라푸치노', categoryLower: '프라푸치노', name: '더블 에스프레소 칩 프라푸치노', price: 6500, img: '🥤', hasOption: true, defaultOption: 'ICE', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 292, categoryUpper: '프라푸치노', categoryLower: '프라푸치노', name: '제주 말차 크림 프라푸치노', price: 6500, img: '🥤', hasOption: true, defaultOption: 'ICE', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 293, categoryUpper: '프라푸치노', categoryLower: '프라푸치노', name: '자바칩 프라푸치노', price: 6500, img: '🥤', hasOption: true, defaultOption: 'ICE', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 294, categoryUpper: '프라푸치노', categoryLower: '블렌디드', name: '딸기 딜라이트 요거트 블렌디드', price: 6500, img: '🥤', hasOption: true, defaultOption: 'ICE', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 295, categoryUpper: '프라푸치노', categoryLower: '프라푸치노', name: '초콜릿 크림 칩 프라푸치노', price: 6200, img: '🥤', hasOption: true, defaultOption: 'ICE', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 296, categoryUpper: '프라푸치노', categoryLower: '프라푸치노', name: '카라멜 프라푸치노', price: 6100, img: '🥤', hasOption: true, defaultOption: 'ICE', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 297, categoryUpper: '프라푸치노', categoryLower: '프라푸치노', name: '에스프레소 프라푸치노', price: 5700, img: '🥤', hasOption: true, defaultOption: 'ICE', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 298, categoryUpper: '프라푸치노', categoryLower: '블렌디드', name: '망고 패션 프루트 블렌디드', price: 5600, img: '🥤', hasOption: true, defaultOption: 'ICE', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 299, categoryUpper: '프라푸치노', categoryLower: '블렌디드', name: '망고 바나나 블렌디드', price: 4500, hotPrice: 4500, img: '🥤', hasOption: true, defaultOption: 'ICE', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },

            // --- 6. 티 음료 ---
            { id: 300, categoryUpper: '티 음료', categoryLower: '티', name: '아이스 두바이 초콜릿 말차', price: 7300, img: '🍵', hasOption: true, defaultOption: 'ICE', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 301, categoryUpper: '티 음료', categoryLower: '티', name: '유자 배 캐모마일 티', price: 6300, img: '🍵', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 302, categoryUpper: '티 음료', categoryLower: '티 라떼', name: '얼 그레이 바닐라 티 라떼', price: 6100, img: '🍵', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 303, categoryUpper: '티 음료', categoryLower: '아이스티', name: '복숭아 아이스 티', price: 6100, img: '🍵', hasOption: true, defaultOption: 'ICE', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 304, categoryUpper: '티 음료', categoryLower: '티 라떼', name: '스타벅스 클래식 밀크 티', price: 6100, img: '🍵', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 305, categoryUpper: '티 음료', categoryLower: '티 라떼', name: '스타벅스 클래식 밀크티 보틀', price: 13400, img: '🍵', hasOption: false, defaultOption: 'ONLY', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 306, categoryUpper: '티 음료', categoryLower: '티 라떼', name: '제주 말차 라떼', price: 6100, img: '🍵', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 307, categoryUpper: '티 음료', categoryLower: '티', name: '유자 민트 티', price: 6100, img: '🍵', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 308, categoryUpper: '티 음료', categoryLower: '티', name: '자몽 허니 블랙 티', price: 5900, img: '🍵', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 309, categoryUpper: '티 음료', categoryLower: '티', name: '제주 유기농 녹차로 만든 티', price: 5300, img: '🍵', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 310, categoryUpper: '티 음료', categoryLower: '티', name: '잉글리쉬 브렉퍼스트 티', price: 4500, img: '🍵', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 311, categoryUpper: '티 음료', categoryLower: '티', name: '얼 그레이 티', price: 4500, img: '🍵', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 312, categoryUpper: '티 음료', categoryLower: '티', name: '유스베리 티', price: 4500, img: '🍵', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 313, categoryUpper: '티 음료', categoryLower: '티', name: '히비스커스 블렌드 티', price: 4500, img: '🍵', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 314, categoryUpper: '티 음료', categoryLower: '티', name: '민트 블렌드 티', price: 4500, img: '🍵', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 315, categoryUpper: '티 음료', categoryLower: '티', name: '캐모마일 블렌드 티', price: 4500, img: '🍵', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },

            // --- 7. 피지오 / 리프레셔 (기타) ---
            { id: 316, categoryUpper: '피지오', categoryLower: '피지오', name: '체리&자두 에너지 피지오', price: 6300, img: '🥤', hasOption: true, defaultOption: 'ICE', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 317, categoryUpper: '피지오', categoryLower: '피지오', name: '피치 딸기 피지오', price: 6100, img: '🥤', hasOption: true, defaultOption: 'ICE', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 318, categoryUpper: '피지오', categoryLower: '피지오', name: '쿨 라임 피지오', price: 6100, img: '🥤', hasOption: true, defaultOption: 'ICE', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 319, categoryUpper: '피지오', categoryLower: '피지오', name: '라이트 핑크 자몽 피지오', price: 6300, img: '🥤', hasOption: true, defaultOption: 'ICE', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 320, categoryUpper: '피지오', categoryLower: '리프레셔', name: '딸기 아사이 레모네이드 스타벅스 리프레셔', price: 6100, img: '🥤', hasOption: true, defaultOption: 'ICE', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },

            // --- 8. 라떼, 초콜릿 음료 (기타) ---
            { id: 321, categoryUpper: '기타', categoryLower: '모카', name: '붉은 로즈 초콜릿', price: 6500, hotPrice: 6500, img: '🥤', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 322, categoryUpper: '기타', categoryLower: '라떼', name: '스타벅스 딸기 라떼', price: 6500, img: '🥤', hasOption: true, defaultOption: 'ICE', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 323, categoryUpper: '기타', categoryLower: '모카', name: '시그니처 핫 초콜릿', price: 5900, hotPrice: 5900, img: '🥤', hasOption: true, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 324, categoryUpper: '기타', categoryLower: '라떼', name: '스팀 우유', price: 4100, img: '🥤', hasOption: false, defaultOption: 'HOT', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },
            { id: 325, categoryUpper: '기타', categoryLower: '라떼', name: '우유', price: 4100, img: '🥤', hasOption: false, defaultOption: 'ICE', sizes: ['Short', 'Tall', 'Grande', 'Venti'] },

            // --- 9. 병음료 ---
            { id: 326, categoryUpper: '병음료', categoryLower: '주스', name: '스퀴즈드 오렌지 주스 100ML', price: 3800, img: '🍾', hasOption: false, defaultOption: 'ONLY' },
            { id: 327, categoryUpper: '병음료', categoryLower: '주스', name: '딸기주스 190ML', price: 4500, img: '🍾', hasOption: false, defaultOption: 'ONLY' },
            { id: 328, categoryUpper: '병음료', categoryLower: '주스', name: '유기농 오렌지 100% 주스 190ML', price: 4900, img: '🍾', hasOption: false, defaultOption: 'ONLY' },
            { id: 329, categoryUpper: '병음료', categoryLower: '주스', name: '햇사과 주스 190ML', price: 4700, img: '🍾', hasOption: false, defaultOption: 'ONLY' },
            { id: 330, categoryUpper: '병음료', categoryLower: '주스', name: '한라봉주스 190ML', price: 4700, img: '🍾', hasOption: false, defaultOption: 'ONLY' },
            { id: 331, categoryUpper: '병음료', categoryLower: '생수/기타', name: '에비앙 500ML', price: 3300, img: '💧', hasOption: false, defaultOption: 'ONLY' },
            { id: 332, categoryUpper: '병음료', categoryLower: '생수/기타', name: '에비앙 스파클링 330ML', price: 3800, img: '💧', hasOption: false, defaultOption: 'ONLY' },
            { id: 333, categoryUpper: '병음료', categoryLower: '생수/기타', name: '페리에 플레인 330ML', price: 3300, img: '💧', hasOption: false, defaultOption: 'ONLY' },
            { id: 334, categoryUpper: '병음료', categoryLower: '주스', name: '유기농 스파클링 애플 주스 296ML', price: 4800, img: '🍾', hasOption: false, defaultOption: 'ONLY' },
            { id: 335, categoryUpper: '병음료', categoryLower: '주스', name: '수박 주스 190ML', price: 4500, img: '🍾', hasOption: false, defaultOption: 'ONLY' },
            { id: 336, categoryUpper: '병음료', categoryLower: '생수/기타', name: '딸기 가득 요거트 190ML', price: 4500, img: '🥤', hasOption: false, defaultOption: 'ONLY' },
            { id: 337, categoryUpper: '병음료', categoryLower: '주스', name: '망고주스 190ML', price: 4500, img: '🍾', hasOption: false, defaultOption: 'ONLY' },
            { id: 338, categoryUpper: '병음료', categoryLower: '주스', name: '케일&사과주스 190ML', price: 4500, img: '🍾', hasOption: false, defaultOption: 'ONLY' },
            { id: 339, categoryUpper: '병음료', categoryLower: '생수/기타', name: '블루베리 요거트 190ML', price: 4500, img: '🥤', hasOption: false, defaultOption: 'ONLY' },

            // --- 10. TRENTA (트렌타) ---
            { id: 340, categoryUpper: '트렌타', categoryLower: '트렌타', name: 'TRENTA 복숭아 아이스티', price: 8300, img: '🍵', hasOption: true, defaultOption: 'ICE', sizes: ['Trenta'] },
            { id: 341, categoryUpper: '트렌타', categoryLower: '트렌타', name: 'TRENTA 콜드 브루', price: 7300, img: '☕', hasOption: true, defaultOption: 'ICE', sizes: ['Trenta'] },
            { id: 342, categoryUpper: '트렌타', categoryLower: '트렌타', name: 'TRENTA 아이스 자몽 허니 블랙 티', price: 8100, img: '🍵', hasOption: true, defaultOption: 'ICE', sizes: ['Trenta'] },
            { id: 343, categoryUpper: '트렌타', categoryLower: '트렌타', name: 'TRENTA 딸기 아사이 레모네이드 스타벅스 리프레셔', price: 8300, img: '🥤', hasOption: true, defaultOption: 'ICE', sizes: ['Trenta'] },

            // --- 11. To Go Bag (투고백) ---
            { id: 344, categoryUpper: '투고백', categoryLower: '투고백', name: '투고 백 아메리카노 8잔', price: 37600, img: '📦', hasOption: false, defaultOption: 'HOT' },
            { id: 345, categoryUpper: '투고백', categoryLower: '투고백', name: '투고 백 블론드 아메리카노 8잔', price: 37600, img: '📦', hasOption: false, defaultOption: 'HOT' },
            { id: 346, categoryUpper: '투고백', categoryLower: '투고백', name: '투고 백 디카페인 아메리카노 8잔', price: 40000, img: '📦', hasOption: false, defaultOption: 'HOT' },
            { id: 347, categoryUpper: '투고백', categoryLower: '투고백', name: '투고 백 아이스 아메리카노 6잔', price: 28200, img: '📦', hasOption: false, defaultOption: 'ICE' },
            { id: 348, categoryUpper: '투고백', categoryLower: '투고백', name: '투고 백 아이스 블론드 아메리카노 6잔', price: 28200, img: '📦', hasOption: false, defaultOption: 'ICE' },
            { id: 349, categoryUpper: '투고백', categoryLower: '투고백', name: '투고 백 아이스 디카페인 아메리카노 6잔', price: 30000, img: '📦', hasOption: false, defaultOption: 'ICE' },
            { id: 350, categoryUpper: '투고백', categoryLower: '투고백', name: '투고 백 라떼 8잔', price: 41600, img: '📦', hasOption: false, defaultOption: 'HOT' },
            { id: 351, categoryUpper: '투고백', categoryLower: '투고백', name: '투고 백 아이스 라떼 6잔', price: 31200, img: '📦', hasOption: false, defaultOption: 'ICE' },
            { id: 352, categoryUpper: '투고백', categoryLower: '투고백', name: '투고 백 콜드브루 6잔', price: 30600, img: '📦', hasOption: false, defaultOption: 'ICE' },
            { id: 353, categoryUpper: '투고백', categoryLower: '투고백', name: '투고 백 아이스 자몽 허니 블랙 티 6잔', price: 35400, img: '📦', hasOption: false, defaultOption: 'ICE' },
            { id: 354, categoryUpper: '투고백', categoryLower: '투고백', name: '투고 백 아이스 유자 민트 티 6잔', price: 36600, img: '📦', hasOption: false, defaultOption: 'ICE' },
            { id: 355, categoryUpper: '투고백', categoryLower: '투고백', name: '투고 백 시그니처 핫 초콜릿 8잔', price: 47200, img: '📦', hasOption: false, defaultOption: 'HOT' },

            // --- 12. 추가 옵션 ---
            // 에스프레소 샷
            { id: 400, categoryUpper: '추가', categoryLower: '에스프레소 샷', name: '에스프레소 샷', price: 800, img: '☕', hasOption: false },

            // 시럽
            { id: 401, categoryUpper: '추가', categoryLower: '시럽', name: '바닐라 시럽', price: 800, img: '🍯', hasOption: false },
            { id: 402, categoryUpper: '추가', categoryLower: '시럽', name: '헤이즐넛 시럽', price: 800, img: '🍯', hasOption: false },
            { id: 403, categoryUpper: '추가', categoryLower: '시럽', name: '카라멜 시럽', price: 800, img: '🍯', hasOption: false },
            { id: 424, categoryUpper: '추가', categoryLower: '시럽', name: '모카 시럽', price: 800, img: '🍯', hasOption: false },

            // 베이스
            { id: 404, categoryUpper: '추가', categoryLower: '베이스', name: '물 적게', price: 0, img: '💧', hasOption: false },
            { id: 405, categoryUpper: '추가', categoryLower: '베이스', name: '물 보통', price: 0, img: '💧', hasOption: false },
            { id: 406, categoryUpper: '추가', categoryLower: '베이스', name: '우유', price: 0, img: '🥛', hasOption: false },
            { id: 407, categoryUpper: '추가', categoryLower: '베이스', name: '저지방 우유', price: 0, img: '🥛', hasOption: false },
            { id: 408, categoryUpper: '추가', categoryLower: '베이스', name: '무지방 우유', price: 0, img: '🥛', hasOption: false },
            { id: 409, categoryUpper: '추가', categoryLower: '베이스', name: '두유', price: 0, img: '🥛', hasOption: false },
            { id: 410, categoryUpper: '추가', categoryLower: '베이스', name: '오트(귀리)', price: 800, img: '🥛', hasOption: false },

            // 얼음
            { id: 411, categoryUpper: '추가', categoryLower: '얼음', name: '얼음 적게', price: 0, img: '🧊', hasOption: false },

            // 휘핑 크림
            { id: 412, categoryUpper: '추가', categoryLower: '휘핑 크림', name: '휘핑 크림 없음', price: 0, img: '🍦', hasOption: false },
            { id: 413, categoryUpper: '추가', categoryLower: '휘핑 크림', name: '휘핑 크림 적게', price: 800, img: '🍦', hasOption: false },
            { id: 414, categoryUpper: '추가', categoryLower: '휘핑 크림', name: '휘핑 크림 보통', price: 800, img: '🍦', hasOption: false },
            { id: 415, categoryUpper: '추가', categoryLower: '휘핑 크림', name: '휘핑 크림 많이', price: 800, img: '🍦', hasOption: false },

            // 드리즐
            { id: 416, categoryUpper: '추가', categoryLower: '드리즐', name: '카라멜 드리즐 없음', price: 0, img: '🍯', hasOption: false },
            { id: 417, categoryUpper: '추가', categoryLower: '드리즐', name: '카라멜 드리즐 적게', price: 800, img: '🍯', hasOption: false },
            { id: 418, categoryUpper: '추가', categoryLower: '드리즐', name: '카라멜 드리즐 보통', price: 800, img: '🍯', hasOption: false },
            { id: 419, categoryUpper: '추가', categoryLower: '드리즐', name: '카라멜 드리즐 많이', price: 800, img: '🍯', hasOption: false },
            { id: 420, categoryUpper: '추가', categoryLower: '드리즐', name: '초콜릿 드리즐 없음', price: 0, img: '🍫', hasOption: false },
            { id: 421, categoryUpper: '추가', categoryLower: '드리즐', name: '초콜릿 드리즐 적게', price: 800, img: '🍫', hasOption: false },
            { id: 422, categoryUpper: '추가', categoryLower: '드리즐', name: '초콜릿 드리즐 보통', price: 800, img: '🍫', hasOption: false },
            { id: 423, categoryUpper: '추가', categoryLower: '드리즐', name: '초콜릿 드리즐 많이', price: 800, img: '🍫', hasOption: false },
        ]
    };

    try {
        // Firestore의 'menus' 콜렉션 내 'starbucks' 문서에 데이터 저장 (덮어쓰기)
        await setDoc(doc(db, 'menus', 'starbucks'), starbucksData);
        alert('스타벅스 메뉴가 성공적으로 업로드되었습니다!');
    } catch (error) {
        console.error('스타벅스 데이터 업로드 실패:', error);
        alert('메뉴 업로드 중 오류가 발생했습니다.');
    }
};