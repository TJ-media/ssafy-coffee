import { Menu } from './types';

export const CAFE_LIST = [
  { id: 'mega', name: '메가커피', img: '🟡' },
  { id: 'bana', name: '바나프레소', img: '🐰' },
  { id: 'starbucks', name: '스타벅스', img: '🟢' },
  { id: 'compose', name: '컴포즈', img: '🟡' },
];

export const CATEGORIES: string[] = ['즐겨찾기', '커피', '디카페인', '음료', '티', '푸드', '상품'];

export const MEGA_MENUS: Menu[] = [
  // 1. 커피 > 에스프레소
  { id: 1, categoryUpper: '커피', categoryLower: '에스프레소', name: '메가리카노', price: 3000, img: '☕', hasOption: false },
  { id: 2, categoryUpper: '커피', categoryLower: '에스프레소', name: '아메리카노', price: 1700, img: '☕', hasOption: true },
  { id: 3, categoryUpper: '커피', categoryLower: '에스프레소', name: '헛개리카노', price: 2400, img: '☕', hasOption: true },
  { id: 4, categoryUpper: '커피', categoryLower: '에스프레소', name: '왕메가헛개리카노', price: 3400, img: '☕', hasOption: false },
  { id: 5, categoryUpper: '커피', categoryLower: '에스프레소', name: '할메가커피', price: 2100, img: '☕', hasOption: false },
  { id: 6, categoryUpper: '커피', categoryLower: '에스프레소', name: '할메가미숫커피', price: 2900, img: '☕', hasOption: false },
  { id: 7, categoryUpper: '커피', categoryLower: '에스프레소', name: '왕할메가커피', price: 3200, img: '☕', hasOption: false },
  { id: 8, categoryUpper: '커피', categoryLower: '에스프레소', name: '꿀아메리카노', price: 2700, img: '☕', hasOption: true },
  { id: 9, categoryUpper: '커피', categoryLower: '에스프레소', name: '바닐라 아메리카노', price: 2700, img: '☕', hasOption: true },
  { id: 10, categoryUpper: '커피', categoryLower: '에스프레소', name: '헤이즐넛 아메리카노', price: 2700, img: '☕', hasOption: true },
  { id: 11, categoryUpper: '커피', categoryLower: '에스프레소', name: '에스프레소', price: 1500, img: '☕', hasOption: false },
  { id: 12, categoryUpper: '커피', categoryLower: '에스프레소', name: '에스프레소 도피오', price: 2000, img: '☕', hasOption: false },

  // 2. 커피 > 라떼
  { id: 13, categoryUpper: '커피', categoryLower: '라떼', name: '왕메가카페라떼', price: 4400, img: '☕', hasOption: false },
  { id: 14, categoryUpper: '커피', categoryLower: '라떼', name: '라이트 바닐라 아몬드라떼', price: 3900, img: '☕', hasOption: false },
  { id: 15, categoryUpper: '커피', categoryLower: '라떼', name: '카페라떼', price: 2900, img: '☕', hasOption: true },
  { id: 16, categoryUpper: '커피', categoryLower: '라떼', name: '바닐라라떼', price: 3400, img: '☕', hasOption: true },
  { id: 17, categoryUpper: '커피', categoryLower: '라떼', name: '큐브라떼', price: 4200, img: '☕', hasOption: false },
  { id: 18, categoryUpper: '커피', categoryLower: '라떼', name: '카페모카', price: 3900, img: '☕', hasOption: true },
  { id: 19, categoryUpper: '커피', categoryLower: '라떼', name: '카라멜마끼아또', price: 3700, img: '☕', hasOption: true },
  { id: 20, categoryUpper: '커피', categoryLower: '라떼', name: '연유라떼', price: 3900, img: '☕', hasOption: true },
  { id: 21, categoryUpper: '커피', categoryLower: '라떼', name: '카푸치노', price: 2900, img: '☕', hasOption: true },
  { id: 22, categoryUpper: '커피', categoryLower: '라떼', name: '헤이즐넛라떼', price: 3400, img: '☕', hasOption: true },

  // 3. 커피 > 콜드브루
  { id: 23, categoryUpper: '커피', categoryLower: '콜드브루', name: '콜드브루 오리지널', price: 3500, img: '☕', hasOption: true },
  { id: 24, categoryUpper: '커피', categoryLower: '콜드브루', name: '콜드브루 라떼', price: 4000, img: '☕', hasOption: true },
  { id: 25, categoryUpper: '커피', categoryLower: '콜드브루', name: '콜드브루 상품용', price: 20000, img: '☕', hasOption: false },

  // 4. 디카페인 > 에스프레소
  { id: 26, categoryUpper: '디카페인', categoryLower: '에스프레소', name: '디카페인 메가리카노', price: 4500, img: '☕', hasOption: false },
  { id: 27, categoryUpper: '디카페인', categoryLower: '에스프레소', name: '디카페인 아메리카노', price: 2500, img: '☕', hasOption: true },
  { id: 28, categoryUpper: '디카페인', categoryLower: '에스프레소', name: '디카페인 헛개리카노', price: 3400, img: '☕', hasOption: true },
  { id: 29, categoryUpper: '디카페인', categoryLower: '에스프레소', name: '디카페인 왕메가헛개리카노', price: 4900, img: '☕', hasOption: false },
  { id: 30, categoryUpper: '디카페인', categoryLower: '에스프레소', name: '디카페인 꿀아메리카노', price: 3700, img: '☕', hasOption: true },
  { id: 31, categoryUpper: '디카페인', categoryLower: '에스프레소', name: '디카페인 바닐라 아메리카노', price: 3700, img: '☕', hasOption: true },
  { id: 32, categoryUpper: '디카페인', categoryLower: '에스프레소', name: '디카페인 헤이즐넛 아메리카노', price: 3700, img: '☕', hasOption: true },
  { id: 33, categoryUpper: '디카페인', categoryLower: '에스프레소', name: '디카페인 에스프레소', price: 2500, img: '☕', hasOption: false },

  // 5. 디카페인 > 라떼
  { id: 34, categoryUpper: '디카페인', categoryLower: '라떼', name: '디카페인 왕메가카페라떼', price: 5900, img: '☕', hasOption: false },
  { id: 35, categoryUpper: '디카페인', categoryLower: '라떼', name: '디카페인 라이트 바닐라 아몬드라떼', price: 4900, img: '☕', hasOption: false },
  { id: 36, categoryUpper: '디카페인', categoryLower: '라떼', name: '디카페인 카페라떼', price: 3900, img: '☕', hasOption: true },
  { id: 37, categoryUpper: '디카페인', categoryLower: '라떼', name: '디카페인 바닐라라떼', price: 4400, img: '☕', hasOption: true },
  { id: 38, categoryUpper: '디카페인', categoryLower: '라떼', name: '디카페인 연유라떼', price: 4900, img: '☕', hasOption: true },
  { id: 39, categoryUpper: '디카페인', categoryLower: '라떼', name: '디카페인 카페모카', price: 4900, img: '☕', hasOption: true },
  { id: 40, categoryUpper: '디카페인', categoryLower: '라떼', name: '디카페인 카푸치노', price: 3900, img: '☕', hasOption: true },
  { id: 41, categoryUpper: '디카페인', categoryLower: '라떼', name: '디카페인 카라멜마끼아또', price: 4700, img: '☕', hasOption: true },
  { id: 42, categoryUpper: '디카페인', categoryLower: '라떼', name: '디카페인 헤이즐넛라떼', price: 4400, img: '☕', hasOption: true },

  // 6. 디카페인 > 콜드브루
  { id: 43, categoryUpper: '디카페인', categoryLower: '콜드브루', name: '콜드브루 디카페인', price: 3500, img: '☕', hasOption: true },
  { id: 44, categoryUpper: '디카페인', categoryLower: '콜드브루', name: '콜드브루 디카페인 라떼', price: 4000, img: '☕', hasOption: true },
  { id: 45, categoryUpper: '디카페인', categoryLower: '콜드브루', name: '콜드브루 디카페인 상품용', price: 20000, img: '☕', hasOption: false },

  // 7. 음료 > 에이드
  { id: 46, categoryUpper: '음료', categoryLower: '에이드', name: '제로 부스트 에이드', price: 3000, img: '🥤', hasOption: false },
  { id: 47, categoryUpper: '음료', categoryLower: '에이드', name: '메가에이드', price: 3900, img: '🥤', hasOption: false },
  { id: 48, categoryUpper: '음료', categoryLower: '에이드', name: '레몬에이드', price: 3500, img: '🥤', hasOption: false },
  { id: 49, categoryUpper: '음료', categoryLower: '에이드', name: '블루레몬에이드', price: 3500, img: '🥤', hasOption: false },
  { id: 50, categoryUpper: '음료', categoryLower: '에이드', name: '자몽에이드', price: 3500, img: '🥤', hasOption: false },
  { id: 51, categoryUpper: '음료', categoryLower: '에이드', name: '청포도에이드', price: 3500, img: '🥤', hasOption: false },
  { id: 52, categoryUpper: '음료', categoryLower: '에이드', name: '라임모히또', price: 3800, img: '🥤', hasOption: false },
  { id: 53, categoryUpper: '음료', categoryLower: '에이드', name: '체리콕', price: 3300, img: '🥤', hasOption: false },

  // 8. 음료 > 프라페
  { id: 54, categoryUpper: '음료', categoryLower: '프라페', name: '말차젤라또 퐁당 딸기프라페', price: 4400, img: '🥤', hasOption: false },
  { id: 55, categoryUpper: '음료', categoryLower: '프라페', name: '감튀스틱 밀크쉐이크', price: 3400, img: '🥤', hasOption: false },
  { id: 56, categoryUpper: '음료', categoryLower: '프라페', name: '밀크쉐이크', price: 2900, img: '🥤', hasOption: false },
  { id: 57, categoryUpper: '음료', categoryLower: '프라페', name: '플레인퐁크러쉬', price: 3900, img: '🥤', hasOption: false },
  { id: 58, categoryUpper: '음료', categoryLower: '프라페', name: '딸기퐁크러쉬', price: 3900, img: '🥤', hasOption: false },
  { id: 59, categoryUpper: '음료', categoryLower: '프라페', name: '쿠키프라페', price: 3900, img: '🥤', hasOption: false },
  { id: 60, categoryUpper: '음료', categoryLower: '프라페', name: '리얼초코프라페', price: 3900, img: '🥤', hasOption: false },
  { id: 61, categoryUpper: '음료', categoryLower: '프라페', name: '민트프라페', price: 3900, img: '🥤', hasOption: false },

  // 9. 음료 > 스무디&주스
  { id: 62, categoryUpper: '음료', categoryLower: '스무디&주스', name: '그린키위 꽉꽉 딸기스무디', price: 4000, img: '🥤', hasOption: false },
  { id: 63, categoryUpper: '음료', categoryLower: '스무디&주스', name: '골드키위주스', price: 4000, img: '🥤', hasOption: false },
  { id: 64, categoryUpper: '음료', categoryLower: '스무디&주스', name: '블루베리 요거트 스무디', price: 3900, img: '🥤', hasOption: false },
  { id: 65, categoryUpper: '음료', categoryLower: '스무디&주스', name: '코코넛커피 스무디', price: 4800, img: '🥤', hasOption: false },
  { id: 66, categoryUpper: '음료', categoryLower: '스무디&주스', name: '딸기요거트스무디', price: 3900, img: '🥤', hasOption: false },
  { id: 67, categoryUpper: '음료', categoryLower: '스무디&주스', name: '플레인요거트스무디', price: 3900, img: '🥤', hasOption: false },
  { id: 68, categoryUpper: '음료', categoryLower: '스무디&주스', name: '딸기바나나주스', price: 4000, img: '🥤', hasOption: false },

  // 10. 음료 > 논-커피 라떼
  { id: 69, categoryUpper: '음료', categoryLower: '논-커피 라떼', name: '딸기라떼', price: 3700, img: '🥤', hasOption: false },
  { id: 70, categoryUpper: '음료', categoryLower: '논-커피 라떼', name: '오레오초코라떼', price: 3900, img: '🥤', hasOption: false },
  { id: 71, categoryUpper: '음료', categoryLower: '논-커피 라떼', name: '곡물라떼', price: 3300, img: '🥤', hasOption: true },
  { id: 72, categoryUpper: '음료', categoryLower: '논-커피 라떼', name: '녹차라떼', price: 3500, img: '🥤', hasOption: true },
  { id: 73, categoryUpper: '음료', categoryLower: '논-커피 라떼', name: '토피넛라떼', price: 3800, img: '🥤', hasOption: true },
  { id: 74, categoryUpper: '음료', categoryLower: '논-커피 라떼', name: '고구마라떼', price: 3500, img: '🥤', hasOption: true },
  { id: 75, categoryUpper: '음료', categoryLower: '논-커피 라떼', name: '로얄밀크티라떼', price: 3700, img: '🥤', hasOption: true },
  { id: 76, categoryUpper: '음료', categoryLower: '논-커피 라떼', name: '흑당버블라떼', price: 3700, img: '🥤', hasOption: false },

  // 11. 티 > 티플레저 & 클래식
  { id: 77, categoryUpper: '티', categoryLower: '티플레저', name: '허니자몽블랙티', price: 3700, img: '🍵', hasOption: true },
  { id: 78, categoryUpper: '티', categoryLower: '티플레저', name: '사과유자차', price: 3500, img: '🍵', hasOption: true },
  { id: 79, categoryUpper: '티', categoryLower: '티플레저', name: '유자차', price: 3300, img: '🍵', hasOption: true },
  { id: 80, categoryUpper: '티', categoryLower: '티플레저', name: '복숭아아이스티', price: 3000, img: '🍵', hasOption: false },
  { id: 81, categoryUpper: '티', categoryLower: '클래식', name: '캐모마일', price: 2500, img: '🍵', hasOption: true },
  { id: 82, categoryUpper: '티', categoryLower: '클래식', name: '페퍼민트', price: 2500, img: '🍵', hasOption: true },
  { id: 83, categoryUpper: '티', categoryLower: '클래식', name: '녹차', price: 2500, img: '🍵', hasOption: true },

  // 12. 푸드
  { id: 84, categoryUpper: '푸드', categoryLower: '디저트', name: '로꾸거 딸기젤라또 콘케이크', price: 3900, img: '🍰', hasOption: false },
  { id: 85, categoryUpper: '푸드', categoryLower: '디저트', name: '초코스모어쿠키', price: 2900, img: '🍰', hasOption: false },
  { id: 86, categoryUpper: '푸드', categoryLower: '디저트', name: '메가초코 마카롱', price: 2100, img: '🍰', hasOption: false },
  { id: 87, categoryUpper: '푸드', categoryLower: '베이커리', name: '딸기 크림치즈 뚠뚠빵', price: 3200, img: '🍰', hasOption: false },
  { id: 88, categoryUpper: '푸드', categoryLower: '베이커리', name: '감자빵', price: 3500, img: '🍰', hasOption: false },
  { id: 89, categoryUpper: '푸드', categoryLower: '베이커리', name: '크로크무슈', price: 3800, img: '🍰', hasOption: false },
  { id: 90, categoryUpper: '푸드', categoryLower: '케이크', name: '치즈케익', price: 3500, img: '🍰', hasOption: false },
  { id: 91, categoryUpper: '푸드', categoryLower: '케이크', name: '티라미수케익', price: 3500, img: '🍰', hasOption: false },
//   { id: 91, categoryUpper: '푸드', categoryLower: '밥', name: '햇반', price: 150000, img: '🍚', hasOption: false },

  // 13. 상품
  { id: 92, categoryUpper: '상품', categoryLower: '굿즈', name: '엠지씨 머그', price: 9300, img: '🎁', hasOption: false },
  { id: 93, categoryUpper: '상품', categoryLower: '굿즈', name: '엠지씨 텀블러(스카이)', price: 19800, img: '🎁', hasOption: false },
  { id: 94, categoryUpper: '상품', categoryLower: '홈카페', name: '스테비아 믹스커피', price: 5900, img: '🎁', hasOption: false },
  { id: 95, categoryUpper: '상품', categoryLower: '홈카페', name: '콜드브루 상품용', price: 20000, img: '🎁', hasOption: false }
];
