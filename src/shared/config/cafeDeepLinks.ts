// 카페별 딥링크 / 앱스토어 링크 설정

export interface CafeDeepLink {
  /** Android intent URL */
  android: string;
  /** iOS URL scheme */
  ios: string;
  /** 앱 미설치 시 폴백 URL */
  fallback: {
    android: string;
    ios: string;
  };
  /** 웹 주문 URL (데스크톱에서 사용, 바나프레소 등) */
  webOrder?: string;
}

export const CAFE_DEEP_LINKS: Record<string, CafeDeepLink> = {
  mega: {
    android: 'intent://open/#Intent;scheme=megacoffee;package=co.kr.waldlust.megacoffee;end',
    ios: 'megacoffee://',
    fallback: {
      android: 'https://play.google.com/store/apps/details?id=co.kr.waldlust.megacoffee',
      ios: 'https://apps.apple.com/kr/app/id1473428031',
    },
  },
  starbucks: {
    android: 'intent://open/#Intent;scheme=starbucks;package=com.starbucks.co;end',
    ios: 'starbucks://',
    fallback: {
      android: 'https://play.google.com/store/apps/details?id=com.starbucks.co',
      ios: 'https://apps.apple.com/kr/app/id585076744',
    },
  },
  banapresso: {
    android: 'intent://app-deep-link#Intent;scheme=banapressoAppDeep;package=com.banaple.foodproapp.banapresso;end',
    ios: 'banapapp://',
    fallback: {
      android: 'https://play.google.com/store/apps/details?id=com.banaple.foodproapp.banapresso',
      ios: 'https://apps.apple.com/kr/app/id1319211939',
    },
    webOrder: 'https://order.banapresso.com/#COFFEE',
  },
  compose: {
    android: 'intent://open/#Intent;scheme=composecoffee;package=com.compose.coffee;end',
    ios: 'composecoffee://',
    fallback: {
      android: 'https://play.google.com/store/apps/details?id=com.compose.coffee',
      ios: 'https://apps.apple.com/kr/app/id1611916573',
    },
  },
};
