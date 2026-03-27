// 카페별 딥링크 / 앱스토어 링크 설정
// 실제 스킴은 각 앱의 AndroidManifest/Info.plist 확인 후 조정 필요

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
}

export const CAFE_DEEP_LINKS: Record<string, CafeDeepLink> = {
  mega: {
    android: 'intent://main/#Intent;scheme=megacoffee;package=com.megacoffee.app;end',
    ios: 'megacoffee://',
    fallback: {
      android: 'market://details?id=com.megacoffee.app',
      ios: 'https://apps.apple.com/kr/app/id1474883803',
    },
  },
  starbucks: {
    android: 'intent://main/#Intent;scheme=starbucks;package=com.starbucks.co;end',
    ios: 'starbucks://',
    fallback: {
      android: 'market://details?id=com.starbucks.co',
      ios: 'https://apps.apple.com/kr/app/id450353456',
    },
  },
  banapresso: {
    android: 'intent://main/#Intent;scheme=banapresso;package=com.banapresso.android;end',
    ios: 'banapresso://',
    fallback: {
      android: 'market://details?id=com.banapresso.android',
      ios: 'https://apps.apple.com/kr/app/id1438259595',
    },
  },
  compose: {
    android: 'intent://main/#Intent;scheme=composecoffee;package=com.compose.coffee;end',
    ios: 'composecoffee://',
    fallback: {
      android: 'market://details?id=com.compose.coffee',
      ios: 'https://apps.apple.com/kr/app/id1611916573',
    },
  },
};
