/**
 * Admin 페이지에서 사용하는 포맷/변환 유틸리티
 */

/** Firestore Timestamp 등 다양한 날짜 형식을 yyyy.MM.dd 문자열로 변환 */
export const formatDate = (createdAt: any): string => {
    if (!createdAt) return '알 수 없음';

    let date: Date;
    if (createdAt.toDate) {
        date = createdAt.toDate();
    } else if (createdAt.seconds) {
        date = new Date(createdAt.seconds * 1000);
    } else if (createdAt instanceof Date) {
        date = createdAt;
    } else if (typeof createdAt === 'string') {
        date = new Date(createdAt);
    } else {
        return '알 수 없음';
    }

    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
};

/** 생성일로부터 경과한 일 수를 계산 */
export const getDaysAgo = (createdAt: any): number => {
    if (!createdAt) return 0;

    let date: Date;
    if (createdAt.toDate) {
        date = createdAt.toDate();
    } else if (createdAt.seconds) {
        date = new Date(createdAt.seconds * 1000);
    } else if (createdAt instanceof Date) {
        date = createdAt;
    } else {
        return 0;
    }

    return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
};

/** 숫자를 한국식 금액 문자열로 포맷 */
export const formatPrice = (price: number): string => {
    return price.toLocaleString('ko-KR');
};
