/**
 * 바나프레소 메뉴 데이터 및 Firestore 업로드 유틸리티
 * 
 * 사용법: 브라우저 콘솔에서 uploadBanapressoMenus() 호출
 * 또는 임시 버튼을 통해 실행
 * 
 * 가격은 역삼GS점 기준입니다.
 * 크롤링 데이터에서 자동 생성된 파일입니다.
 */
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export const uploadBanapressoData = async () => {
    const banapressoData = {
        cafeId: 'banapresso',
        cafeImg: '🟤',
        cafeName: '바나프레소',
        categories: ["추가","커피","저당&제로슈가","디카페인 커피","라떼","주스 & 드링크","바나치노 & 스무디","티 & 에이드","디저트","세트메뉴","MD"],
        items: [

            // --- 커피 ---
            { id: 600, categoryUpper: '커피', name: '아메리카노', price: 1800, hotPrice: 2500, takeoutPrice: 2000, img: '☕', hasOption: true, defaultOption: 'ICE', options: ["휘핑추가","매장에서 먹을게요","시럽제외","젤라또 종류 선택 2"] },
            { id: 601, categoryUpper: '커피', name: '시그니처아메리카노', price: 2400, hotPrice: 2900, img: '☕', hasOption: true, defaultOption: 'ICE', options: ["휘핑추가","매장에서 먹을게요","라떼로 변경(두유)_SET","시럽제외","젤라또 종류 선택 2"] },
            { id: 602, categoryUpper: '커피', name: '바나리카노', price: 3300, img: '☕', hasOption: false, defaultOption: 'ICE', options: ["휘핑추가","시럽제외","샷양(2샷)","젤라또 종류 선택 2"] },
            { id: 603, categoryUpper: '커피', name: '카페라떼', price: 3300, hotPrice: 3300, img: '☕', hasOption: true, defaultOption: 'ICE', options: ["시나몬","얼음","매장에서 먹을게요","시럽제외","연하게(라떼)","원두변경","젤라또 종류 선택 2"] },
            { id: 604, categoryUpper: '커피', name: '크리미라떼', price: 3900, img: '☕', hasOption: false, defaultOption: 'ICE', options: ["당도","시나몬","매장에서 먹을게요","시럽제외","연하게(라떼)","원두변경","젤라또 종류 선택 2"] },
            { id: 605, categoryUpper: '커피', name: '바닐라라떼', price: 3900, hotPrice: 3900, img: '☕', hasOption: true, defaultOption: 'ICE', options: ["휘핑","당도","시나몬","얼음","시럽제외","연하게(라떼)","원두변경","젤라또 종류 선택 2"] },

            // --- 저당&제로슈가 ---
            { id: 606, categoryUpper: '저당&제로슈가', name: '저당 바닐라라떼', price: 4400, hotPrice: 4400, img: '🍽️', hasOption: true, defaultOption: 'ICE', options: ["휘핑","당도","시나몬","얼음","시럽제외","연하게(라떼)","젤라또 종류 선택 2"] },

            // --- 커피 ---
            { id: 607, categoryUpper: '커피', name: '카푸치노', price: 3300, hotPrice: 3300, img: '☕', hasOption: false, defaultOption: 'HOT', options: ["휘핑","얼음","매장에서 먹을게요","연하게(라떼)","젤라또 종류 선택 2"] },
            { id: 608, categoryUpper: '커피', name: '클래식밀크커피', price: 2200, hotPrice: 2700, img: '☕', hasOption: true, defaultOption: 'ICE', options: ["휘핑","당도","시나몬","시럽제외","젤라또 종류 선택 2"] },
            { id: 609, categoryUpper: '커피', name: '허니카페라떼', price: 3900, hotPrice: 3900, img: '☕', hasOption: true, defaultOption: 'ICE', options: ["휘핑","당도","시나몬","얼음","시럽제외","연하게(라떼)","젤라또 종류 선택 2"] },
            { id: 610, categoryUpper: '커피', name: '스위티소금라떼', price: 4400, hotPrice: 4400, img: '☕', hasOption: true, defaultOption: 'ICE', options: ["휘핑","시나몬","얼음","시럽제외","연하게(라떼)","원두변경","젤라또 종류 선택 2"] },
            { id: 611, categoryUpper: '커피', name: '연유라떼', price: 4400, hotPrice: 4400, img: '☕', hasOption: true, defaultOption: 'ICE', options: ["휘핑","당도","시나몬","얼음","시럽제외","연하게(라떼)","원두변경","젤라또 종류 선택 2"] },
            { id: 612, categoryUpper: '커피', name: '카페모카', price: 4400, hotPrice: 4400, img: '☕', hasOption: true, defaultOption: 'ICE', options: ["휘핑","얼음","시럽제외","연하게(라떼)","원두변경","젤라또 종류 선택 2"] },
            { id: 613, categoryUpper: '커피', name: '밀크카라멜마키아또', price: 4400, hotPrice: 4400, img: '☕', hasOption: true, defaultOption: 'ICE', options: ["휘핑","당도","얼음","시럽제외","연하게(라떼)","원두변경","젤라또 종류 선택 2"] },
            { id: 614, categoryUpper: '커피', name: '화이트아메리카노', price: 2600, hotPrice: 3100, img: '☕', hasOption: true, defaultOption: 'ICE', options: ["얼음","매장에서 먹을게요","시럽제외","연하게(라떼)","젤라또 종류 선택 2"] },
            { id: 615, categoryUpper: '커피', name: '헛개리카노', price: 2600, hotPrice: 3100, img: '☕', hasOption: true, defaultOption: 'ICE', options: ["휘핑추가","시럽제외","젤라또 종류 선택 2"] },
            { id: 616, categoryUpper: '커피', name: '허니아메리카노', price: 3100, hotPrice: 3100, img: '☕', hasOption: true, defaultOption: 'ICE', options: ["휘핑","휘핑추가","시럽제외","연하게(라떼)","젤라또 종류 선택 2"] },
            { id: 617, categoryUpper: '커피', name: '핑크아메리카노', price: 3000, hotPrice: 3000, img: '☕', hasOption: true, defaultOption: 'ICE', options: ["휘핑추가","시럽제외","연하게(라떼)","젤라또 종류 선택 2"] },
            { id: 618, categoryUpper: '커피', name: '유자셔벗아메리카노', price: 4400, img: '☕', hasOption: false, defaultOption: 'ICE', options: ["휘핑","시럽제외","연하게(라떼)","젤라또 종류 선택 2"] },

            // --- 저당&제로슈가 ---
            { id: 619, categoryUpper: '저당&제로슈가', name: '제로슈가 스위트아메리카노', price: 3100, hotPrice: 3100, img: '🍽️', hasOption: true, defaultOption: 'ICE', options: ["휘핑추가","시럽제외","연하게(라떼)","젤라또 종류 선택 2"] },

            // --- 커피 ---
            { id: 620, categoryUpper: '커피', name: '핑크카페라떼', price: 3500, hotPrice: 3500, img: '☕', hasOption: true, defaultOption: 'ICE', options: ["시나몬","시럽제외","연하게(라떼)","젤라또 종류 선택 2"] },
            { id: 621, categoryUpper: '커피', name: '피스타치오카페라떼', price: 4400, hotPrice: 4400, img: '☕', hasOption: true, defaultOption: 'ICE', options: ["휘핑","당도","시나몬","얼음","시럽제외","연하게(라떼)","젤라또 종류 선택 2"] },
            { id: 622, categoryUpper: '커피', name: '시나몬라떼', price: 4400, img: '☕', hasOption: false, defaultOption: 'ONLY', options: ["휘핑","당도","얼음","시럽제외","연하게(라떼)","원두변경","젤라또 종류 선택 2"] },
            { id: 623, categoryUpper: '커피', name: '헛개크리미라떼', price: 4100, img: '☕', hasOption: false, defaultOption: 'ICE', options: ["당도","시럽제외","연하게(라떼)","젤라또 종류 선택 2"] },
            { id: 624, categoryUpper: '커피', name: '에스프레소', price: 1800, hotPrice: 2500, takeoutPrice: 2000, img: '☕', hasOption: false, defaultOption: 'HOT', options: ["당도","젤라또 종류 선택 2"] },
            { id: 625, categoryUpper: '커피', name: '빅바나 카페라떼', price: 4500, img: '☕', hasOption: false, defaultOption: 'ICE', options: ["얼음","시럽제외","라떼로 변경(우유)_SET","라떼로 변경(두유)_SET","젤라또 종류 선택 2"] },
            { id: 626, categoryUpper: '커피', name: '빅바나 크리미라떼', price: 5200, img: '☕', hasOption: false, defaultOption: 'ICE', options: ["시럽제외","라떼로 변경(우유)_SET","라떼로 변경(두유)_SET","젤라또 종류 선택 2"] },
            { id: 627, categoryUpper: '커피', name: '빅바나 바닐라라떼', price: 5200, img: '☕', hasOption: false, defaultOption: 'ICE', options: ["휘핑","얼음","시럽제외","라떼로 변경(두유)_SET","젤라또 종류 선택 2"] },

            // --- 저당&제로슈가 ---
            { id: 628, categoryUpper: '저당&제로슈가', name: '저당 빅바나 바닐라라떼', price: 5700, img: '🍽️', hasOption: false, defaultOption: 'ICE', options: ["휘핑","얼음","시럽제외","라떼로 변경(두유)_SET","젤라또 종류 선택 2"] },

            // --- 커피 ---
            { id: 629, categoryUpper: '커피', name: '빅바나 클래식밀크커피', price: 3200, img: '☕', hasOption: false, defaultOption: 'ICE', options: ["휘핑","당도","시럽제외","젤라또 종류 선택 2"] },
            { id: 630, categoryUpper: '커피', name: '빅바나 헛개리카노', price: 4100, img: '☕', hasOption: false, defaultOption: 'ICE', options: ["휘핑추가","시럽제외","젤라또 종류 선택 2"] },
            { id: 631, categoryUpper: '커피', name: '저당 크리미라떼', price: 4400, img: '☕', hasOption: false, defaultOption: 'ONLY', options: ["당도","시나몬","매장에서 먹을게요","시럽제외","연하게(라떼)","원두변경","젤라또 종류 선택 2"] },
            { id: 632, categoryUpper: '커피', name: '빅바나 저당 크리미라떼', price: 5700, img: '☕', hasOption: false, defaultOption: 'ONLY', options: ["시럽제외","라떼로 변경(우유)_SET","라떼로 변경(두유)_SET","젤라또 종류 선택 2"] },
            { id: 633, categoryUpper: '커피', name: '토피넛호핑슈페너', price: 4300, img: '☕', hasOption: false, defaultOption: 'ONLY', options: ["시나몬","얼음","쿠키","시럽제외","연하게(라떼)","젤라또 종류 선택 2"] },
            { id: 634, categoryUpper: '커피', name: '아샷추', price: 3700, img: '☕', hasOption: false, defaultOption: 'ICE', options: ["휘핑","시나몬","시럽제외","연하게(라떼)","젤라또 종류 선택 2"] },
            { id: 635, categoryUpper: '커피', name: '제로슈가 아샷추', price: 3700, img: '☕', hasOption: false, defaultOption: 'ICE', options: ["휘핑","시나몬","시럽제외","연하게(라떼)","젤라또 종류 선택 2"] },
            { id: 636, categoryUpper: '커피', name: '빅바나 아샷추', price: 5400, img: '☕', hasOption: false, defaultOption: 'ICE', options: ["휘핑","시나몬","시럽제외","라떼로 변경(두유)_SET","젤라또 종류 선택 2"] },
            { id: 637, categoryUpper: '커피', name: '빅바나 제로슈가 아샷추', price: 5400, img: '☕', hasOption: false, defaultOption: 'ICE', options: ["휘핑","시나몬","시럽제외","라떼로 변경(두유)_SET","젤라또 종류 선택 2"] },
            { id: 638, categoryUpper: '커피', name: '콜드브루', price: 3300, img: '☕', hasOption: false, defaultOption: 'ICE', options: ["시나몬","휘핑추가","매장에서 먹을게요","시럽제외","젤라또 종류 선택 2"] },
            { id: 639, categoryUpper: '커피', name: '콜드브루 라떼', price: 3800, img: '☕', hasOption: false, defaultOption: 'ICE', options: ["당도","시나몬","얼음","매장에서 먹을게요","시럽제외","젤라또 종류 선택 2"] },
            { id: 640, categoryUpper: '커피', name: '바닐라 콜드브루', price: 4000, img: '☕', hasOption: false, defaultOption: 'ICE', options: ["휘핑","당도","시나몬","얼음","시럽제외","젤라또 종류 선택 2"] },

            // --- 저당&제로슈가 ---
            { id: 641, categoryUpper: '저당&제로슈가', name: '저당 바닐라 콜드브루', price: 4500, img: '🍽️', hasOption: false, defaultOption: 'ICE', options: ["휘핑","당도","시나몬","얼음","시럽제외","젤라또 종류 선택 2"] },

            // --- 커피 ---
            { id: 642, categoryUpper: '커피', name: '제주말차 콜드브루', price: 4800, img: '☕', hasOption: false, defaultOption: 'ICE', options: ["휘핑","당도","시나몬","얼음","시럽제외","젤라또 종류 선택 2"] },
            { id: 643, categoryUpper: '커피', name: '돌체 콜드브루', price: 4500, img: '☕', hasOption: false, defaultOption: 'ICE', options: ["휘핑","당도","시나몬","얼음","시럽제외","젤라또 종류 선택 2"] },
            { id: 644, categoryUpper: '커피', name: '빅바나 콜드브루', price: 4300, img: '☕', hasOption: false, defaultOption: 'ICE', options: ["휘핑추가","시럽제외","라떼로 변경(우유)_SET","젤라또 종류 선택 2"] },

            // --- 디카페인 커피 ---
            { id: 645, categoryUpper: '디카페인 커피', name: '디카페인 아메리카노', price: 2500, hotPrice: 3000, img: '☕', hasOption: true, defaultOption: 'ICE', options: ["휘핑추가","매장에서 먹을게요","시럽제외","물 온도","젤라또 종류 선택 2"] },
            { id: 646, categoryUpper: '디카페인 커피', name: '디카페인 바나리카노', price: 4300, img: '☕', hasOption: false, defaultOption: 'ICE', options: ["휘핑추가","시럽제외","물 온도","젤라또 종류 선택 2"] },
            { id: 647, categoryUpper: '디카페인 커피', name: '디카페인 카페라떼', price: 3800, hotPrice: 3800, img: '☕', hasOption: true, defaultOption: 'ICE', options: ["시나몬","얼음","매장에서 먹을게요","시럽제외","물 온도","젤라또 종류 선택 2"] },
            { id: 648, categoryUpper: '디카페인 커피', name: '디카페인 크리미라떼', price: 4400, img: '☕', hasOption: false, defaultOption: 'ICE', options: ["당도","시나몬","매장에서 먹을게요","시럽제외","물 온도","젤라또 종류 선택 2","원두변경"] },
            { id: 649, categoryUpper: '디카페인 커피', name: '디카페인 바닐라라떼', price: 4400, hotPrice: 4400, img: '☕', hasOption: true, defaultOption: 'ICE', options: ["휘핑","당도","시나몬","얼음","시럽제외","물 온도","젤라또 종류 선택 2"] },

            // --- 저당&제로슈가 ---
            { id: 650, categoryUpper: '저당&제로슈가', name: '저당 디카페인 바닐라라떼', price: 4900, hotPrice: 4900, img: '🍽️', hasOption: true, defaultOption: 'ICE', options: ["휘핑","당도","시나몬","얼음","시럽제외","물 온도","젤라또 종류 선택 2"] },

            // --- 디카페인 커피 ---
            { id: 651, categoryUpper: '디카페인 커피', name: '디카페인 카푸치노', price: 3800, hotPrice: 3800, img: '☕', hasOption: false, defaultOption: 'HOT', options: ["휘핑","얼음","매장에서 먹을게요","물 온도","젤라또 종류 선택 2"] },
            { id: 652, categoryUpper: '디카페인 커피', name: '디카페인 토피넛호핑슈페너', price: 4800, img: '☕', hasOption: false, defaultOption: 'ONLY', options: ["시나몬","얼음","쿠키","시럽제외","물 온도","젤라또 종류 선택 2"] },
            { id: 653, categoryUpper: '디카페인 커피', name: '디카페인 허니카페라떼', price: 4400, hotPrice: 4400, img: '☕', hasOption: true, defaultOption: 'ICE', options: ["휘핑","당도","시나몬","얼음","시럽제외","물 온도","젤라또 종류 선택 2"] },
            { id: 654, categoryUpper: '디카페인 커피', name: '디카페인 스위티소금라떼', price: 4900, hotPrice: 4900, img: '☕', hasOption: true, defaultOption: 'ICE', options: ["휘핑","시나몬","얼음","시럽제외","물 온도","젤라또 종류 선택 2"] },
            { id: 655, categoryUpper: '디카페인 커피', name: '디카페인 연유라떼', price: 4900, hotPrice: 4900, img: '☕', hasOption: true, defaultOption: 'ICE', options: ["휘핑","당도","얼음","시럽제외","물 온도","젤라또 종류 선택 2"] },
            { id: 656, categoryUpper: '디카페인 커피', name: '디카페인 카페모카', price: 4900, hotPrice: 4900, img: '☕', hasOption: true, defaultOption: 'ICE', options: ["휘핑","얼음","시럽제외","물 온도","젤라또 종류 선택 2"] },
            { id: 657, categoryUpper: '디카페인 커피', name: '디카페인 밀크카라멜마키아또 ', price: 4900, hotPrice: 4900, img: '☕', hasOption: true, defaultOption: 'ICE', options: ["휘핑","당도","얼음","시럽제외","물 온도","젤라또 종류 선택 2"] },
            { id: 658, categoryUpper: '디카페인 커피', name: '디카페인 화이트아메리카노', price: 3100, hotPrice: 3600, img: '☕', hasOption: true, defaultOption: 'ICE', options: ["얼음","매장에서 먹을게요","시럽제외","물 온도","젤라또 종류 선택 2"] },
            { id: 659, categoryUpper: '디카페인 커피', name: '디카페인 헛개리카노', price: 3100, hotPrice: 3600, img: '☕', hasOption: true, defaultOption: 'ICE', options: ["휘핑추가","시럽제외","물 온도","젤라또 종류 선택 2"] },
            { id: 660, categoryUpper: '디카페인 커피', name: '디카페인 허니아메리카노', price: 3600, hotPrice: 3600, img: '☕', hasOption: true, defaultOption: 'ICE', options: ["휘핑","휘핑추가","시럽제외","물 온도","젤라또 종류 선택 2"] },
            { id: 661, categoryUpper: '디카페인 커피', name: '디카페인 핑크아메리카노', price: 3500, hotPrice: 3500, img: '☕', hasOption: true, defaultOption: 'ICE', options: ["휘핑추가","시럽제외","물 온도","젤라또 종류 선택 2"] },
            { id: 662, categoryUpper: '디카페인 커피', name: '디카페인 유자셔벗아메리카노', price: 4900, img: '☕', hasOption: false, defaultOption: 'ICE', options: ["휘핑","시럽제외","물 온도","젤라또 종류 선택 2"] },

            // --- 저당&제로슈가 ---
            { id: 663, categoryUpper: '저당&제로슈가', name: '디카페인 제로슈가 스위트아메리카노', price: 3600, hotPrice: 3600, img: '🍽️', hasOption: true, defaultOption: 'ICE', options: ["휘핑추가","시럽제외","물 온도","젤라또 종류 선택 2"] },

            // --- 디카페인 커피 ---
            { id: 664, categoryUpper: '디카페인 커피', name: '디카페인 핑크카페라떼', price: 4000, hotPrice: 4000, img: '☕', hasOption: true, defaultOption: 'ICE', options: ["시나몬","시럽제외","물 온도","젤라또 종류 선택 2"] },
            { id: 665, categoryUpper: '디카페인 커피', name: '디카페인 피스타치오카페라떼', price: 4900, hotPrice: 4900, img: '☕', hasOption: true, defaultOption: 'ICE', options: ["휘핑","당도","얼음","시럽제외","물 온도","젤라또 종류 선택 2"] },
            { id: 666, categoryUpper: '디카페인 커피', name: '디카페인 시나몬라떼', price: 4900, hotPrice: 4900, img: '☕', hasOption: true, defaultOption: 'ICE', options: ["휘핑","당도","얼음","시럽제외","물 온도","젤라또 종류 선택 2"] },
            { id: 667, categoryUpper: '디카페인 커피', name: '디카페인 헛개크리미라떼', price: 4600, img: '☕', hasOption: false, defaultOption: 'ICE', options: ["당도","시럽제외","물 온도","젤라또 종류 선택 2"] },
            { id: 668, categoryUpper: '디카페인 커피', name: '디카페인 에스프레소', price: 2500, hotPrice: 3000, img: '☕', hasOption: false, defaultOption: 'HOT', options: ["젤라또 종류 선택 2"] },
            { id: 669, categoryUpper: '디카페인 커피', name: '빅바나 디카페인 카페라떼', price: 5500, img: '☕', hasOption: false, defaultOption: 'ICE', options: ["얼음","시럽제외","물 온도","라떼로 변경(우유)_SET","젤라또 종류 선택 2"] },
            { id: 670, categoryUpper: '디카페인 커피', name: '빅바나 디카페인 크리미라떼', price: 6200, img: '☕', hasOption: false, defaultOption: 'ICE', options: ["시럽제외","물 온도","라떼로 변경(우유)_SET","젤라또 종류 선택 2"] },
            { id: 671, categoryUpper: '디카페인 커피', name: '빅바나 디카페인 바닐라라떼', price: 6200, img: '☕', hasOption: false, defaultOption: 'ICE', options: ["휘핑","얼음","시럽제외","물 온도","젤라또 종류 선택 2"] },

            // --- 저당&제로슈가 ---
            { id: 672, categoryUpper: '저당&제로슈가', name: '저당 빅바나 디카페인 바닐라라떼', price: 6700, img: '🍽️', hasOption: false, defaultOption: 'ICE', options: ["휘핑","얼음","시럽제외","물 온도","젤라또 종류 선택 2"] },

            // --- 디카페인 커피 ---
            { id: 673, categoryUpper: '디카페인 커피', name: '빅바나 디카페인 헛개리카노', price: 5100, img: '☕', hasOption: false, defaultOption: 'ICE', options: ["휘핑추가","시럽제외","물 온도","젤라또 종류 선택 2"] },
            { id: 674, categoryUpper: '디카페인 커피', name: '디카페인 저당 크리미라떼', price: 4900, img: '☕', hasOption: false, defaultOption: 'ONLY', options: ["당도","시나몬","매장에서 먹을게요","시럽제외","물 온도","원두변경","젤라또 종류 선택 2"] },
            { id: 675, categoryUpper: '디카페인 커피', name: '빅바나 디카페인 저당 크리미라떼', price: 6700, img: '☕', hasOption: false, defaultOption: 'ONLY', options: ["시럽제외","물 온도","라떼로 변경(우유)_SET","젤라또 종류 선택 2"] },
            { id: 676, categoryUpper: '디카페인 커피', name: '디카페인 아샷추 ', price: 3900, img: '☕', hasOption: false, defaultOption: 'ICE', options: ["휘핑","시나몬","시럽제외","물 온도","젤라또 종류 선택 2"] },
            { id: 677, categoryUpper: '디카페인 커피', name: '디카페인 제로슈가 아샷추 ', price: 3900, img: '☕', hasOption: false, defaultOption: 'ICE', options: ["휘핑","시나몬","시럽제외","물 온도","젤라또 종류 선택 2"] },
            { id: 678, categoryUpper: '디카페인 커피', name: '빅바나 디카페인 아샷추 ', price: 5800, img: '☕', hasOption: false, defaultOption: 'ICE', options: ["휘핑","시나몬","시럽제외","물 온도","젤라또 종류 선택 2"] },
            { id: 679, categoryUpper: '디카페인 커피', name: '빅바나 디카페인 제로슈가 아샷추 ', price: 5800, img: '☕', hasOption: false, defaultOption: 'ICE', options: ["휘핑","시나몬","시럽제외","물 온도","젤라또 종류 선택 2"] },

            // --- 라떼 ---
            { id: 680, categoryUpper: '라떼', name: '두바이초코라떼', price: 4300, img: '🍽️', hasOption: false, defaultOption: 'ONLY', options: ["당도","시나몬","얼음","시럽제외","젤라또 종류 선택 2"] },
            { id: 681, categoryUpper: '라떼', name: '제주말차라떼', price: 3800, hotPrice: 3800, img: '🍽️', hasOption: true, defaultOption: 'ICE', options: ["휘핑","당도","시나몬","얼음","시럽제외","젤라또 종류 선택 2"] },
            { id: 682, categoryUpper: '라떼', name: '제주말차딸기라떼', price: 4800, img: '🍽️', hasOption: false, defaultOption: 'ICE', options: ["당도","얼음","시럽제외","젤라또 종류 선택 2"] },
            { id: 683, categoryUpper: '라떼', name: '딸기크리미라떼', price: 4500, img: '🍽️', hasOption: false, defaultOption: 'ICE', options: ["당도","시럽제외","젤라또 종류 선택 2"] },
            { id: 684, categoryUpper: '라떼', name: '제주말차크리미라떼', price: 4300, img: '🍽️', hasOption: false, defaultOption: 'ONLY', options: ["당도","시나몬","시럽제외","젤라또 종류 선택 2"] },
            { id: 685, categoryUpper: '라떼', name: '영암고구마라떼', price: 3800, hotPrice: 3800, img: '🍽️', hasOption: true, defaultOption: 'ICE', options: ["휘핑","당도","시나몬","얼음","시럽제외","젤라또 종류 선택 2"] },
            { id: 686, categoryUpper: '라떼', name: '프로틴미숫가루라떼', price: 3800, img: '🍽️', hasOption: false, defaultOption: 'ICE', options: ["당도","시나몬","얼음","시럽제외","젤라또 종류 선택 2"] },
            { id: 687, categoryUpper: '라떼', name: '빅바나 프로틴미숫가루라떼', price: 5000, img: '🍽️', hasOption: false, defaultOption: 'ICE', options: ["당도","얼음","시럽제외","젤라또 종류 선택 2"] },
            { id: 688, categoryUpper: '라떼', name: '얼그레이밀크티', price: 3800, hotPrice: 3800, img: '🍽️', hasOption: true, defaultOption: 'ICE', options: ["휘핑","당도","시나몬","얼음","젤라또 종류 선택 2"] },

            // --- 저당&제로슈가 ---
            { id: 689, categoryUpper: '저당&제로슈가', name: '저당 얼그레이밀크티', price: 4300, hotPrice: 4300, img: '🍽️', hasOption: true, defaultOption: 'ICE', options: ["휘핑","당도","시나몬","얼음","젤라또 종류 선택 2"] },

            // --- 라떼 ---
            { id: 690, categoryUpper: '라떼', name: '얼그레이버블티', price: 4300, img: '🍽️', hasOption: false, defaultOption: 'ICE', options: ["휘핑","당도","시나몬","얼음","시럽제외","젤라또 종류 선택 2"] },

            // --- 저당&제로슈가 ---
            { id: 691, categoryUpper: '저당&제로슈가', name: '저당 얼그레이버블티', price: 4800, img: '🍽️', hasOption: false, defaultOption: 'ICE', options: ["휘핑","당도","시나몬","얼음","시럽제외","젤라또 종류 선택 2"] },

            // --- 라떼 ---
            { id: 692, categoryUpper: '라떼', name: '흑당밀크티', price: 3800, img: '🍽️', hasOption: false, defaultOption: 'ICE', options: ["휘핑","당도","시나몬","얼음","젤라또 종류 선택 2"] },
            { id: 693, categoryUpper: '라떼', name: '흑당버블티', price: 4300, img: '🍽️', hasOption: false, defaultOption: 'ICE', options: ["휘핑","당도","시나몬","얼음","시럽제외","젤라또 종류 선택 2"] },
            { id: 694, categoryUpper: '라떼', name: '헛개버블티', price: 4500, img: '🍽️', hasOption: false, defaultOption: 'ICE', options: ["당도","시럽제외","젤라또 종류 선택 2"] },
            { id: 695, categoryUpper: '라떼', name: '리얼초코', price: 3800, hotPrice: 3800, img: '🍽️', hasOption: true, defaultOption: 'ICE', options: ["휘핑","당도","시나몬","얼음","시럽제외","젤라또 종류 선택 2"] },
            { id: 696, categoryUpper: '라떼', name: '빅바나 리얼초코', price: 5000, img: '🍽️', hasOption: false, defaultOption: 'ICE', options: ["휘핑","당도","얼음","시럽제외","젤라또 종류 선택 2"] },
            { id: 697, categoryUpper: '라떼', name: '토피넛라떼', price: 3800, hotPrice: 3800, img: '🍽️', hasOption: true, defaultOption: 'ICE', options: ["휘핑","당도","얼음","쿠키","시럽제외","젤라또 종류 선택 2"] },
            { id: 698, categoryUpper: '라떼', name: '피스타치오라떼', price: 3800, hotPrice: 3800, img: '🍽️', hasOption: true, defaultOption: 'ICE', options: ["휘핑","당도","시나몬","얼음","시럽제외","젤라또 종류 선택 2"] },
            { id: 699, categoryUpper: '라떼', name: '통팥밀크티', price: 4500, img: '🍽️', hasOption: false, defaultOption: 'ONLY', options: ["당도","얼음","시럽제외","젤라또 종류 선택 2"] },
            { id: 700, categoryUpper: '라떼', name: '딸기라떼', price: 4000, img: '🍽️', hasOption: false, defaultOption: 'ICE', options: ["휘핑","당도","시나몬","얼음","시럽제외","젤라또 종류 선택 2"] },
            { id: 701, categoryUpper: '라떼', name: '홍시라떼', price: 4000, img: '🍽️', hasOption: false, defaultOption: 'ONLY', options: ["휘핑","당도","얼음","시럽제외","젤라또 종류 선택 2"] },
            { id: 702, categoryUpper: '라떼', name: '통팥라떼', price: 4300, img: '🍽️', hasOption: false, defaultOption: 'ONLY', options: ["당도","얼음","시럽제외","젤라또 종류 선택 2"] },
            { id: 703, categoryUpper: '라떼', name: '오곡미숫가루라떼', price: 3500, img: '🍽️', hasOption: false, defaultOption: 'ONLY', options: ["휘핑","당도","시나몬","얼음","시럽제외","젤라또 종류 선택 2"] },
            { id: 704, categoryUpper: '라떼', name: '딸기크림밀크티', price: 4300, img: '🍽️', hasOption: false, defaultOption: 'ONLY', options: ["당도","시나몬","쿠키","시럽제외","젤라또 종류 선택 2"] },
            { id: 705, categoryUpper: '라떼', name: '빅바나 오곡미숫가루라떼', price: 4700, img: '🍽️', hasOption: false, defaultOption: 'ONLY', options: ["휘핑","당도","얼음","시럽제외","젤라또 종류 선택 2"] },
            { id: 706, categoryUpper: '라떼', name: '생딸기라떼', price: 5500, img: '🍽️', hasOption: false, defaultOption: 'ONLY', options: ["휘핑","당도","얼음","시럽제외","젤라또 종류 선택 2"] },

            // --- 주스 & 드링크 ---
            { id: 707, categoryUpper: '주스 & 드링크', name: '망고쥬스', price: 4000, img: '🍹', hasOption: false, defaultOption: 'ICE', options: ["휘핑","당도","시럽제외","젤라또 종류 선택 2"] },
            { id: 708, categoryUpper: '주스 & 드링크', name: '홍시쥬스', price: 4000, img: '🍹', hasOption: false, defaultOption: 'ICE', options: ["휘핑","당도","시럽제외","젤라또 종류 선택 2"] },
            { id: 709, categoryUpper: '주스 & 드링크', name: '복숭아요거트드링크', price: 4300, img: '🍹', hasOption: false, defaultOption: 'ICE', options: ["당도","시럽제외","젤라또 종류 선택 2"] },
            { id: 710, categoryUpper: '주스 & 드링크', name: '딸기요거트드링크', price: 4000, img: '🍹', hasOption: false, defaultOption: 'ICE', options: ["당도","시럽제외","젤라또 종류 선택 2"] },
            { id: 711, categoryUpper: '주스 & 드링크', name: '플레인요거트드링크', price: 3800, img: '🍹', hasOption: false, defaultOption: 'ICE', options: ["당도","시럽제외","젤라또 종류 선택 2"] },
            { id: 712, categoryUpper: '주스 & 드링크', name: '생딸기쥬스', price: 5500, img: '🍹', hasOption: false, defaultOption: 'ONLY', options: ["휘핑","당도","시럽제외","젤라또 종류 선택 2"] },

            // --- 바나치노 & 스무디 ---
            { id: 713, categoryUpper: '바나치노 & 스무디', name: '딸기요거트스무디', price: 4000, img: '🥤', hasOption: false, defaultOption: 'ICE', options: ["당도","시럽제외","젤라또 종류 선택 2"] },
            { id: 714, categoryUpper: '바나치노 & 스무디', name: '플레인요거트스무디', price: 4000, img: '🥤', hasOption: false, defaultOption: 'ICE', options: ["당도","시럽제외","젤라또 종류 선택 2"] },
            { id: 715, categoryUpper: '바나치노 & 스무디', name: '레몬요거트스무디', price: 4000, img: '🥤', hasOption: false, defaultOption: 'ICE', options: ["당도","시럽제외","젤라또 종류 선택 2"] },
            { id: 716, categoryUpper: '바나치노 & 스무디', name: '망고요거트스무디', price: 4000, img: '🥤', hasOption: false, defaultOption: 'ICE', options: ["당도","시럽제외","젤라또 종류 선택 2"] },
            { id: 717, categoryUpper: '바나치노 & 스무디', name: '탐라는감귤스무디', price: 4000, img: '🥤', hasOption: false, defaultOption: 'ICE', options: ["당도","시럽제외","젤라또 종류 선택 2"] },
            { id: 718, categoryUpper: '바나치노 & 스무디', name: '제주말차바나치노', price: 4500, img: '🥤', hasOption: false, defaultOption: 'ICE', options: ["휘핑","당도","얼음","시럽제외","젤라또 종류 선택 2"] },
            { id: 719, categoryUpper: '바나치노 & 스무디', name: '꿀배스무디', price: 4000, img: '🥤', hasOption: false, defaultOption: 'ICE', options: ["당도","시럽제외","젤라또 종류 선택 2"] },
            { id: 720, categoryUpper: '바나치노 & 스무디', name: '꿀자몽스무디', price: 4000, img: '🥤', hasOption: false, defaultOption: 'ICE', options: ["당도","시럽제외","젤라또 종류 선택 2"] },
            { id: 721, categoryUpper: '바나치노 & 스무디', name: '콜드브루바나치노', price: 4500, img: '🥤', hasOption: false, defaultOption: 'ICE', options: ["휘핑","얼음","시럽제외","젤라또 종류 선택 2"] },
            { id: 722, categoryUpper: '바나치노 & 스무디', name: '초콜릿칩쉐이크', price: 4500, img: '🥤', hasOption: false, defaultOption: 'ICE', options: ["휘핑","당도","얼음","시럽제외","젤라또 종류 선택 2"] },
            { id: 723, categoryUpper: '바나치노 & 스무디', name: '커피칩쉐이크', price: 4500, img: '🥤', hasOption: false, defaultOption: 'ICE', options: ["휘핑","당도","얼음","시럽제외","젤라또 종류 선택 2"] },
            { id: 724, categoryUpper: '바나치노 & 스무디', name: '초코쉐이크', price: 4500, img: '🥤', hasOption: false, defaultOption: 'ICE', options: ["당도","얼음","시럽제외","젤라또 종류 선택 2"] },
            { id: 725, categoryUpper: '바나치노 & 스무디', name: '바닐라쉐이크', price: 4500, img: '🥤', hasOption: false, defaultOption: 'ICE', options: ["당도","얼음","시럽제외","젤라또 종류 선택 2"] },
            { id: 726, categoryUpper: '바나치노 & 스무디', name: '제주청귤레몬스무디', price: 4000, img: '🥤', hasOption: false, defaultOption: 'ICE', options: ["당도","시럽제외","젤라또 종류 선택 2"] },
            { id: 727, categoryUpper: '바나치노 & 스무디', name: '딸기복숭아스무디', price: 4000, img: '🥤', hasOption: false, defaultOption: 'ICE', options: ["당도","시럽제외","젤라또 종류 선택 2"] },
            { id: 728, categoryUpper: '바나치노 & 스무디', name: '딸기스무디', price: 4000, img: '🥤', hasOption: false, defaultOption: 'ICE', options: ["당도","얼음","시럽제외","젤라또 종류 선택 2"] },
            { id: 729, categoryUpper: '바나치노 & 스무디', name: '망고스무디', price: 4000, img: '🥤', hasOption: false, defaultOption: 'ICE', options: ["당도","시럽제외","젤라또 종류 선택 2"] },
            { id: 730, categoryUpper: '바나치노 & 스무디', name: '쿠앤크바나치노', price: 4500, img: '🥤', hasOption: false, defaultOption: 'ICE', options: ["휘핑","당도","얼음","시럽제외","젤라또 종류 선택 2"] },
            { id: 731, categoryUpper: '바나치노 & 스무디', name: '자바칩바나치노', price: 4500, img: '🥤', hasOption: false, defaultOption: 'ICE', options: ["휘핑","당도","얼음","시럽제외","젤라또 종류 선택 2"] },

            // --- 티 & 에이드 ---
            { id: 732, categoryUpper: '티 & 에이드', name: '레드뱅쇼', price: 4000, hotPrice: 4000, img: '🍵', hasOption: true, defaultOption: 'ICE', options: ["휘핑","당도","시럽제외","젤라또 종류 선택 2"] },
            { id: 733, categoryUpper: '티 & 에이드', name: '대추쌍화차', price: 4000, hotPrice: 4000, img: '🍵', hasOption: true, defaultOption: 'ICE', options: ["휘핑","당도","시럽제외","젤라또 종류 선택 2"] },
            { id: 734, categoryUpper: '티 & 에이드', name: '복숭아아이스티', price: 3000, img: '🍵', hasOption: false, defaultOption: 'ICE', options: ["휘핑","당도","시나몬","시럽제외","젤라또 종류 선택 2"] },
            { id: 735, categoryUpper: '티 & 에이드', name: '제주말차유자티', price: 4000, hotPrice: 4000, img: '🍵', hasOption: true, defaultOption: 'ICE', options: ["휘핑","당도","시나몬","시럽제외","젤라또 종류 선택 2"] },
            { id: 736, categoryUpper: '티 & 에이드', name: '루이보스오렌지', price: 2800, hotPrice: 2800, img: '🍵', hasOption: true, defaultOption: 'ICE', options: ["당도","시나몬","시럽제외","젤라또 종류 선택 1","젤라또 종류 선택 2"] },
            { id: 737, categoryUpper: '티 & 에이드', name: '탐라는감귤티', price: 3800, hotPrice: 3800, img: '🍵', hasOption: true, defaultOption: 'ICE', options: ["휘핑","당도","시럽제외","젤라또 종류 선택 2"] },
            { id: 738, categoryUpper: '티 & 에이드', name: '머스캣블랙티', price: 3800, hotPrice: 3800, img: '🍵', hasOption: true, defaultOption: 'ICE', options: ["당도","시럽제외","젤라또 종류 선택 1","젤라또 종류 선택 2"] },
            { id: 739, categoryUpper: '티 & 에이드', name: '라임민트스파클러', price: 3500, img: '🍵', hasOption: false, defaultOption: 'ICE', options: ["당도","시럽제외","젤라또 종류 선택 2"] },
            { id: 740, categoryUpper: '티 & 에이드', name: '체리콕', price: 3500, img: '🍵', hasOption: false, defaultOption: 'ICE', options: ["당도","시나몬","시럽제외","젤라또 종류 선택 2"] },
            { id: 741, categoryUpper: '티 & 에이드', name: '유자민트티', price: 3800, hotPrice: 3800, img: '🍵', hasOption: true, defaultOption: 'ICE', options: ["휘핑","당도","시럽제외","젤라또 종류 선택 1","젤라또 종류 선택 2"] },
            { id: 742, categoryUpper: '티 & 에이드', name: '헛개차', price: 2000, hotPrice: 2500, img: '🍵', hasOption: true, defaultOption: 'ICE', options: ["당도","젤라또 종류 선택 2"] },
            { id: 743, categoryUpper: '티 & 에이드', name: '빅바나 헛개차', price: 2900, img: '🍵', hasOption: false, defaultOption: 'ICE', options: ["당도","젤라또 종류 선택 2"] },
            { id: 744, categoryUpper: '티 & 에이드', name: '허니유자티', price: 3500, hotPrice: 3500, img: '🍵', hasOption: true, defaultOption: 'ICE', options: ["휘핑","당도","시나몬","시럽제외","젤라또 종류 선택 2"] },
            { id: 745, categoryUpper: '티 & 에이드', name: '빅바나 복숭아아이스티', price: 4000, img: '🍵', hasOption: false, defaultOption: 'ICE', options: ["휘핑","당도","시럽제외","젤라또 종류 선택 2"] },

            // --- 저당&제로슈가 ---
            { id: 746, categoryUpper: '저당&제로슈가', name: '제로슈가 레몬아이스티', price: 3000, img: '🍽️', hasOption: false, defaultOption: 'ICE', options: ["당도","시럽제외","젤라또 종류 선택 2"] },
            { id: 747, categoryUpper: '저당&제로슈가', name: '빅바나 제로슈가 레몬아이스티', price: 4000, img: '🍽️', hasOption: false, defaultOption: 'ICE', options: ["당도","시럽제외","젤라또 종류 선택 2"] },
            { id: 748, categoryUpper: '저당&제로슈가', name: '제로슈가 복숭아아이스티', price: 3000, img: '🍽️', hasOption: false, defaultOption: 'ICE', options: ["휘핑","당도","시나몬","시럽제외","젤라또 종류 선택 2"] },
            { id: 749, categoryUpper: '저당&제로슈가', name: '빅바나 제로슈가 복숭아아이스티', price: 4000, img: '🍽️', hasOption: false, defaultOption: 'ICE', options: ["휘핑","당도","시럽제외","젤라또 종류 선택 2"] },

            // --- 티 & 에이드 ---
            { id: 750, categoryUpper: '티 & 에이드', name: '아삭복숭아아이스티', price: 3500, img: '🍵', hasOption: false, defaultOption: 'ICE', options: ["당도","시나몬","시럽제외","젤라또 종류 선택 2"] },
            { id: 751, categoryUpper: '티 & 에이드', name: '얼음동동식혜', price: 3000, img: '🍵', hasOption: false, defaultOption: 'ICE', options: ["당도","쿠키","시럽제외","젤라또 종류 선택 2"] },
            { id: 752, categoryUpper: '티 & 에이드', name: '빅바나 얼음동동식혜', price: 4000, img: '🍵', hasOption: false, defaultOption: 'ICE', options: ["당도","쿠키","시럽제외","젤라또 종류 선택 2"] },
            { id: 753, categoryUpper: '티 & 에이드', name: '자몽허니블랙티', price: 3800, hotPrice: 3800, img: '🍵', hasOption: true, defaultOption: 'ICE', options: ["휘핑","당도","시나몬","시럽제외","젤라또 종류 선택 1","젤라또 종류 선택 2"] },
            { id: 754, categoryUpper: '티 & 에이드', name: '문경오미자티', price: 3800, hotPrice: 3800, img: '🍵', hasOption: true, defaultOption: 'ICE', options: ["당도","시럽제외","젤라또 종류 선택 2"] },
            { id: 755, categoryUpper: '티 & 에이드', name: '제주청귤티', price: 3500, hotPrice: 3500, img: '🍵', hasOption: true, defaultOption: 'ICE', options: ["휘핑","당도","시럽제외","젤라또 종류 선택 2"] },
            { id: 756, categoryUpper: '티 & 에이드', name: '제주청귤에이드', price: 3800, img: '🍵', hasOption: false, defaultOption: 'ICE', options: ["휘핑","당도","시나몬","시럽제외","젤라또 종류 선택 2"] },
            { id: 757, categoryUpper: '티 & 에이드', name: '복숭아에이드', price: 4300, img: '🍵', hasOption: false, defaultOption: 'ICE', options: ["당도","시나몬","시럽제외","젤라또 종류 선택 2"] },
            { id: 758, categoryUpper: '티 & 에이드', name: '레몬에이드', price: 3800, img: '🍵', hasOption: false, defaultOption: 'ICE', options: ["휘핑","당도","시나몬","시럽제외","젤라또 종류 선택 2"] },
            { id: 759, categoryUpper: '티 & 에이드', name: '자몽에이드', price: 3800, img: '🍵', hasOption: false, defaultOption: 'ICE', options: ["휘핑","당도","시나몬","시럽제외","젤라또 종류 선택 2"] },
            { id: 760, categoryUpper: '티 & 에이드', name: '청포도에이드', price: 3800, img: '🍵', hasOption: false, defaultOption: 'ICE', options: ["휘핑","당도","시나몬","시럽제외","젤라또 종류 선택 2"] },
            { id: 761, categoryUpper: '티 & 에이드', name: '레몬티', price: 3800, hotPrice: 3800, img: '🍵', hasOption: true, defaultOption: 'ICE', options: ["휘핑","당도","시나몬","시럽제외","젤라또 종류 선택 2"] },
            { id: 762, categoryUpper: '티 & 에이드', name: '자몽티', price: 3800, hotPrice: 3800, img: '🍵', hasOption: true, defaultOption: 'ICE', options: ["휘핑","당도","시나몬","시럽제외","젤라또 종류 선택 2"] },
            { id: 763, categoryUpper: '티 & 에이드', name: '캐모마일', price: 2800, hotPrice: 2800, img: '🍵', hasOption: true, defaultOption: 'ICE', options: ["당도","시나몬","시럽제외","젤라또 종류 선택 1","젤라또 종류 선택 2"] },
            { id: 764, categoryUpper: '티 & 에이드', name: '히비스커스', price: 2800, hotPrice: 2800, img: '🍵', hasOption: true, defaultOption: 'ICE', options: ["당도","시나몬","시럽제외","젤라또 종류 선택 1","젤라또 종류 선택 2"] },
            { id: 765, categoryUpper: '티 & 에이드', name: '얼그레이', price: 2800, hotPrice: 2800, img: '🍵', hasOption: true, defaultOption: 'ICE', options: ["당도","시나몬","시럽제외","젤라또 종류 선택 1","젤라또 종류 선택 2"] },
            { id: 766, categoryUpper: '티 & 에이드', name: '페퍼민트', price: 2800, hotPrice: 2800, img: '🍵', hasOption: true, defaultOption: 'ICE', options: ["당도","시나몬","시럽제외","젤라또 종류 선택 1","젤라또 종류 선택 2"] },

            // --- 디저트 ---
            { id: 767, categoryUpper: '디저트', name: '수플레치즈케이크', price: 3900, img: '🍰', hasOption: false, defaultOption: 'ONLY' },
            { id: 768, categoryUpper: '디저트', name: '티라미수케이크', price: 3900, img: '🍰', hasOption: false, defaultOption: 'ONLY' },
            { id: 769, categoryUpper: '디저트', name: '진짜감자빵', price: 3000, img: '🍰', hasOption: false, defaultOption: 'ONLY' },
            { id: 770, categoryUpper: '디저트', name: '바삭찰핫도그', price: 2200, img: '🍰', hasOption: false, defaultOption: 'ONLY' },
            { id: 771, categoryUpper: '디저트', name: '매콤떡볶이', price: 4800, img: '🍰', hasOption: false, defaultOption: 'ONLY' },
            { id: 772, categoryUpper: '디저트', name: '허니브레드', price: 4700, img: '🍰', hasOption: false, defaultOption: 'ONLY' },
            { id: 773, categoryUpper: '디저트', name: '아침란', price: 2000, img: '🍰', hasOption: false, defaultOption: 'ONLY' },
            { id: 774, categoryUpper: '디저트', name: '소불고기치즈파니니', price: 4900, img: '🍰', hasOption: false, defaultOption: 'ONLY' },
            { id: 775, categoryUpper: '디저트', name: '매콤닭가슴살파니니', price: 4900, img: '🍰', hasOption: false, defaultOption: 'ONLY' },
            { id: 776, categoryUpper: '디저트', name: '크로크무슈', price: 3500, img: '🍰', hasOption: false, defaultOption: 'ONLY' },
            { id: 777, categoryUpper: '디저트', name: '에그듬뿍모닝샌드위치', price: 2300, img: '🍰', hasOption: false, defaultOption: 'ONLY' },
            { id: 778, categoryUpper: '디저트', name: '게살듬뿍모닝샌드위치', price: 2300, img: '🍰', hasOption: false, defaultOption: 'ONLY' },
            { id: 779, categoryUpper: '디저트', name: '클래식카스테라', price: 2000, img: '🍰', hasOption: false, defaultOption: 'ONLY' },
            { id: 780, categoryUpper: '디저트', name: '핫치킨부리또', price: 4900, img: '🍰', hasOption: false, defaultOption: 'ONLY' },
            { id: 781, categoryUpper: '디저트', name: '버터리소금빵', price: 2800, img: '🍰', hasOption: false, defaultOption: 'ONLY' },
            { id: 782, categoryUpper: '디저트', name: '햄치즈잉글리시머핀', price: 3200, img: '🍰', hasOption: false, defaultOption: 'ONLY' },
            { id: 783, categoryUpper: '디저트', name: '플레인베이글', price: 1900, img: '🍰', hasOption: false, defaultOption: 'ONLY' },
            { id: 784, categoryUpper: '디저트', name: '어니언베이글', price: 1900, img: '🍰', hasOption: false, defaultOption: 'ONLY' },
            { id: 785, categoryUpper: '디저트', name: '폴리크림치즈', price: 900, img: '🍰', hasOption: false, defaultOption: 'ONLY' },
            { id: 786, categoryUpper: '디저트', name: '유자마카롱', price: 2100, img: '🍰', hasOption: false, defaultOption: 'ONLY' },
            { id: 787, categoryUpper: '디저트', name: '말차초코마카롱', price: 2100, img: '🍰', hasOption: false, defaultOption: 'ONLY' },
            { id: 788, categoryUpper: '디저트', name: '순우유마카롱', price: 2100, img: '🍰', hasOption: false, defaultOption: 'ONLY' },
            { id: 789, categoryUpper: '디저트', name: '블루베리요거트마카롱', price: 2100, img: '🍰', hasOption: false, defaultOption: 'ONLY' },
            { id: 790, categoryUpper: '디저트', name: '초코가나슈마카롱', price: 2100, img: '🍰', hasOption: false, defaultOption: 'ONLY' },
            { id: 791, categoryUpper: '디저트', name: '아메리칸쿠키', price: 2300, img: '🍰', hasOption: false, defaultOption: 'ONLY' },
            { id: 792, categoryUpper: '디저트', name: '더블초코칩쿠키', price: 2300, img: '🍰', hasOption: false, defaultOption: 'ONLY' },
            { id: 793, categoryUpper: '디저트', name: '오트밀크랜베리쿠키', price: 2300, img: '🍰', hasOption: false, defaultOption: 'ONLY' },
            { id: 794, categoryUpper: '디저트', name: '말렌카케이크호두', price: 5500, img: '🍰', hasOption: false, defaultOption: 'ONLY' },
            { id: 795, categoryUpper: '디저트', name: '말렌카케이크코코아', price: 5500, img: '🍰', hasOption: false, defaultOption: 'ONLY' },
            { id: 796, categoryUpper: '디저트', name: '베이커리 박스', price: 500, img: '🍰', hasOption: false, defaultOption: 'ONLY' },
            { id: 797, categoryUpper: '디저트', name: '팥듬뿍붕어빵', price: 2500, img: '🍰', hasOption: false, defaultOption: 'ONLY' },
            { id: 798, categoryUpper: '디저트', name: '슈듬뿍붕어빵', price: 2500, img: '🍰', hasOption: false, defaultOption: 'ONLY' },

            // --- 세트메뉴 ---
            { id: 799, categoryUpper: '세트메뉴', name: '아침란 세트', price: 3300, takeoutPrice: 3500, img: '📦', hasOption: false, defaultOption: 'ONLY', options: ["휘핑추가","매장에서 먹을게요","젤라또 종류 선택 2"] },
            { id: 800, categoryUpper: '세트메뉴', name: '소불고기치즈파니니 세트', price: 6200, takeoutPrice: 6400, img: '📦', hasOption: false, defaultOption: 'ONLY', options: ["휘핑추가","매장에서 먹을게요","젤라또 종류 선택 2"] },
            { id: 801, categoryUpper: '세트메뉴', name: '매콤 닭가슴살파니니 세트', price: 6200, takeoutPrice: 6400, img: '📦', hasOption: false, defaultOption: 'ONLY', options: ["휘핑추가","매장에서 먹을게요","젤라또 종류 선택 2"] },
            { id: 802, categoryUpper: '세트메뉴', name: '크로크무슈 세트', price: 4800, takeoutPrice: 5000, img: '📦', hasOption: false, defaultOption: 'ONLY', options: ["휘핑추가","매장에서 먹을게요","젤라또 종류 선택 2"] },
            { id: 803, categoryUpper: '세트메뉴', name: '핫치킨부리또 세트', price: 6200, takeoutPrice: 6400, img: '📦', hasOption: false, defaultOption: 'ONLY', options: ["휘핑추가","매장에서 먹을게요","젤라또 종류 선택 2"] },
            { id: 804, categoryUpper: '세트메뉴', name: '플레인베이글 세트', price: 3200, takeoutPrice: 3400, img: '📦', hasOption: false, defaultOption: 'ONLY', options: ["휘핑추가","매장에서 먹을게요","젤라또 종류 선택 2"] },
            { id: 805, categoryUpper: '세트메뉴', name: '어니언베이글 세트', price: 3200, takeoutPrice: 3400, img: '📦', hasOption: false, defaultOption: 'ONLY', options: ["휘핑추가","매장에서 먹을게요","젤라또 종류 선택 2"] },
            { id: 806, categoryUpper: '세트메뉴', name: '햄치즈머핀 세트', price: 4500, takeoutPrice: 4700, img: '📦', hasOption: false, defaultOption: 'ONLY', options: ["휘핑추가","매장에서 먹을게요","젤라또 종류 선택 2"] },

            // --- MD ---
            { id: 807, categoryUpper: 'MD', name: '1만원권 바나프레소 상품권', price: 10000, img: '🍽️', hasOption: false, defaultOption: 'ONLY' },
            { id: 808, categoryUpper: 'MD', name: '3만원권 바나프레소 상품권', price: 30000, img: '🍽️', hasOption: false, defaultOption: 'ONLY' },
            { id: 809, categoryUpper: 'MD', name: '5만원권 바나프레소 상품권', price: 50000, img: '🍽️', hasOption: false, defaultOption: 'ONLY' },
            { id: 810, categoryUpper: 'MD', name: '10만원권 바나프레소 상품권', price: 100000, img: '🍽️', hasOption: false, defaultOption: 'ONLY' },
            { id: 811, categoryUpper: 'MD', name: '리유저블텀블러(화이트)', price: 4500, img: '🍽️', hasOption: false, defaultOption: 'ONLY' },
            { id: 812, categoryUpper: 'MD', name: '리유저블텀블러(핑크)', price: 4500, img: '🍽️', hasOption: false, defaultOption: 'ONLY' },
            { id: 813, categoryUpper: 'MD', name: '바나프레소 핑크 텀블러 900ml', price: 14800, img: '🍽️', hasOption: false, defaultOption: 'ONLY' },
            { id: 814, categoryUpper: 'MD', name: '바나프레소 맥세이프 럭키 카드지갑', price: 7200, img: '🍽️', hasOption: false, defaultOption: 'ONLY' },
            { id: 815, categoryUpper: 'MD', name: '바나프레소 화이트 텀블러 900ml', price: 14800, img: '🍽️', hasOption: false, defaultOption: 'ONLY' },
            { id: 816, categoryUpper: 'MD', name: '바나프레소 민트 텀블러 900ml', price: 14800, img: '🍽️', hasOption: false, defaultOption: 'ONLY' },
            { id: 817, categoryUpper: 'MD', name: '바나프레소 빅머그컵 570ml', price: 9000, img: '🍽️', hasOption: false, defaultOption: 'ONLY' },

            // --- 추가 메뉴 옵션 ---
            // 휘핑
            { id: 818, categoryUpper: '추가', categoryLower: '휘핑', name: '휘핑제외', price: 0, img: '➕', hasOption: false },
            { id: 819, categoryUpper: '추가', categoryLower: '휘핑', name: '휘핑많이', price: 0, img: '➕', hasOption: false },
            { id: 820, categoryUpper: '추가', categoryLower: '휘핑', name: '휘핑적게', price: 0, img: '➕', hasOption: false },
            // 시럽추가
            { id: 821, categoryUpper: '추가', categoryLower: '시럽추가', name: '헤이즐넛 시럽추가', price: 600, img: '➕', hasOption: false },
            { id: 822, categoryUpper: '추가', categoryLower: '시럽추가', name: '시나몬 시럽추가', price: 600, img: '➕', hasOption: false },
            // 샷양(2샷)
            { id: 823, categoryUpper: '추가', categoryLower: '샷양(2샷)', name: '샷추가(2샷)', price: 700, img: '➕', hasOption: false },
            { id: 824, categoryUpper: '추가', categoryLower: '샷양(2샷)', name: '연한 샷', price: 0, img: '➕', hasOption: false },
            { id: 825, categoryUpper: '추가', categoryLower: '샷양(2샷)', name: '샷추가(2샷) 2회', price: 1400, img: '➕', hasOption: false },
            { id: 826, categoryUpper: '추가', categoryLower: '샷양(2샷)', name: '연한샷 추가', price: 500, img: '➕', hasOption: false },
            // 펄 추가
            { id: 827, categoryUpper: '추가', categoryLower: '펄 추가', name: '펄 추가', price: 1000, img: '➕', hasOption: false },
            { id: 828, categoryUpper: '추가', categoryLower: '펄 추가', name: '펄 추가 (배민용)', price: 1000, img: '➕', hasOption: false },
            // 시그니처 원두로 변경(2샷)
            { id: 829, categoryUpper: '추가', categoryLower: '시그니처 원두로 변경(2샷)', name: '시그니처 원두로 변경', price: 400, img: '➕', hasOption: false },
            { id: 830, categoryUpper: '추가', categoryLower: '시그니처 원두로 변경(2샷)', name: '원두변경+샷추가(2샷)', price: 1300, img: '➕', hasOption: false },
            { id: 831, categoryUpper: '추가', categoryLower: '시그니처 원두로 변경(2샷)', name: '원두변경+샷추가(2샷) 2회', price: 2200, img: '➕', hasOption: false },
            { id: 832, categoryUpper: '추가', categoryLower: '시그니처 원두로 변경(2샷)', name: '원두변경+연한샷 추가', price: 1100, img: '➕', hasOption: false },
            // 빅바나 시럽추가
            { id: 833, categoryUpper: '추가', categoryLower: '빅바나 시럽추가', name: '헤이즐넛 시럽추가', price: 900, img: '➕', hasOption: false },
            { id: 834, categoryUpper: '추가', categoryLower: '빅바나 시럽추가', name: '시나몬 시럽추가', price: 900, img: '➕', hasOption: false },
            // 샷빼기
            { id: 835, categoryUpper: '추가', categoryLower: '샷빼기', name: '샷빼기', price: -500, img: '➕', hasOption: false },
            // 오트로 변경
            { id: 836, categoryUpper: '추가', categoryLower: '오트로 변경', name: '오트로 변경', price: 500, img: '➕', hasOption: false },
            // 디카페인 원두로 변경
            { id: 837, categoryUpper: '추가', categoryLower: '디카페인 원두로 변경', name: '디카페인 원두로 변경', price: 300, img: '➕', hasOption: false },
            { id: 838, categoryUpper: '추가', categoryLower: '디카페인 원두로 변경', name: '디카페인변경+샷추가', price: 1000, img: '➕', hasOption: false },
            { id: 839, categoryUpper: '추가', categoryLower: '디카페인 원두로 변경', name: '디카페인변경+연하게', price: 300, img: '➕', hasOption: false },
            // 티백추가
            { id: 840, categoryUpper: '추가', categoryLower: '티백추가', name: '티백추가', price: 500, img: '➕', hasOption: false },
            // 아이스크림 추가
            { id: 841, categoryUpper: '추가', categoryLower: '아이스크림 추가', name: '아이스크림 추가', price: 500, img: '➕', hasOption: false },
            // 저당으로 변경
            { id: 842, categoryUpper: '추가', categoryLower: '저당으로 변경', name: '저당으로 변경', price: 500, img: '➕', hasOption: false },
            // 제로슈가로 변경
            { id: 843, categoryUpper: '추가', categoryLower: '제로슈가로 변경', name: '제로슈가로 변경', price: 0, img: '➕', hasOption: false },
        ]
    };

    try {
        await setDoc(doc(db, 'menus', 'banapresso'), banapressoData);
        alert('바나프레소 메뉴가 성공적으로 업로드되었습니다!');
    } catch (error) {
        console.error('바나프레소 데이터 업로드 실패:', error);
        alert('메뉴 업로드 중 오류가 발생했습니다.');
    }
};
