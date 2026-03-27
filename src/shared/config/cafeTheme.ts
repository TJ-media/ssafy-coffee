// 카페별 UI 테마 설정
// 각 카페의 색상, 레이아웃 등을 분기하여 동일 컴포넌트에서 다른 UI를 렌더링

export interface CafeTheme {
  /** 선택된 탭 배경 Tailwind 클래스 */
  primaryColor: string;
  /** 선택된 탭 텍스트 Tailwind 클래스 */
  primaryTextColor: string;
  /** 밝은 톤 배경 (선택 상태 하이라이트) */
  primaryBgLight: string;
  /** 포커스 링 색상 */
  ringColor: string;
  /** 가격 텍스트 색상 */
  priceTextColor: string;
  /** 서브카테고리 표시 여부 */
  showSubCategory: boolean;
  /** 카페 대표 이모지 */
  brandEmoji: string;
}

const CAFE_THEMES: Record<string, CafeTheme> = {
  mega: {
    primaryColor: 'bg-yellow-400',
    primaryTextColor: 'text-yellow-700',
    primaryBgLight: 'bg-yellow-50',
    ringColor: 'ring-yellow-400',
    priceTextColor: 'text-yellow-600',
    showSubCategory: true,
    brandEmoji: '🟡',
  },
  banapresso: {
    primaryColor: 'bg-pink-400',
    primaryTextColor: 'text-pink-600',
    primaryBgLight: 'bg-pink-50',
    ringColor: 'ring-pink-400',
    priceTextColor: 'text-pink-600',
    showSubCategory: true,
    brandEmoji: '🐰',
  },
  starbucks: {
    primaryColor: 'bg-emerald-700',
    primaryTextColor: 'text-emerald-700',
    primaryBgLight: 'bg-emerald-50',
    ringColor: 'ring-emerald-600',
    priceTextColor: 'text-emerald-700',
    showSubCategory: true,
    brandEmoji: '🟢',
  },
  compose: {
    primaryColor: 'bg-yellow-400',
    primaryTextColor: 'text-yellow-700',
    primaryBgLight: 'bg-yellow-50',
    ringColor: 'ring-yellow-400',
    priceTextColor: 'text-yellow-600',
    showSubCategory: true,
    brandEmoji: '🟡',
  },
};

/** 기본 테마 (정의되지 않은 카페 ID용 폴백) */
const DEFAULT_THEME: CafeTheme = CAFE_THEMES.mega;

/**
 * 카페 ID로 해당 테마 설정 객체를 반환합니다.
 * 등록되지 않은 카페 ID는 기본 테마(mega)를 반환합니다.
 */
export function getCafeTheme(cafeId: string): CafeTheme {
  return CAFE_THEMES[cafeId] ?? DEFAULT_THEME;
}
