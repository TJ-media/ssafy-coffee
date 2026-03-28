import React from 'react';
import { getMenuColors } from '../utils/menuColorMap';
import { OptionType } from '../types';

interface MenuIconProps {
  menuName: string;
  categoryUpper: string;
  categoryLower: string;
  option?: OptionType;
  hasOption?: boolean;
  size?: number;
}

// ---------------------------------------------------------------------------
// Shape selector
// ---------------------------------------------------------------------------
type ShapeKey = 'tallCup' | 'mug' | 'frappe' | 'glass' | 'teacup' | 'bottle' | 'cake' | 'snack' | 'setMenu' | 'giftCard' | 'addon';

function selectShape(
  categoryUpper: string,
  categoryLower: string,
  menuName: string,
  option: OptionType | undefined,
): ShapeKey {
  const upper = categoryUpper ?? '';
  const lower = categoryLower ?? '';
  const name = menuName ?? '';
  const combined = name + lower;

  if (upper === '추가') return 'addon';

  // 상품권: 상품 카테고리 내에서 먼저 분기
  if (combined.includes('상품권') || combined.includes('기프트카드')) return 'giftCard';

  if (['병음료', 'MD', '상품'].includes(upper)) return 'bottle';

  // 세트 메뉴
  if (combined.includes('세트')) return 'setMenu';

  // 푸드: 케이크 vs 스낵
  if (['푸드', '디저트', '베이커리'].includes(upper)) {
    if (combined.includes('케이크')) return 'cake';
    return 'snack';
  }

  if (['프라페', '스무디', '블렌디드', '쉐이크', '바나치노'].some(k => combined.includes(k))) return 'frappe';
  if (['에이드', '피지오', '리프레셔'].some(k => combined.includes(k))) return 'glass';
  if (['티', '티 음료', '티 & 에이드'].includes(upper) && !lower.includes('에이드')) return 'teacup';
  if (option === 'HOT') return 'mug';

  return 'tallCup';
}

// ---------------------------------------------------------------------------
// Steam lines (HOT indicator)
// ---------------------------------------------------------------------------
function SteamLines({ cx }: { cx: number }) {
  return (
    <g stroke="#AAAAAA" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity={0.7}>
      <path d={`M${cx - 4},8 q2,-4 0,-7`} />
      <path d={`M${cx},8 q2,-4 0,-7`} />
      <path d={`M${cx + 4},8 q2,-4 0,-7`} />
    </g>
  );
}

// ---------------------------------------------------------------------------
// Ice cubes (ICE indicator — reused in tallCup & glass)
// ---------------------------------------------------------------------------
function IceCubes({ y }: { y: number }) {
  return (
    <g>
      <rect x="15" y={y} width="7" height="7" rx="1.5" fill="white" opacity={0.75} />
      <rect x="23" y={y + 2} width="6" height="6" rx="1.5" fill="white" opacity={0.6} />
    </g>
  );
}

// ---------------------------------------------------------------------------
// SHAPE: tallCup — default takeout cup
// ---------------------------------------------------------------------------
function TallCup({ liquid, accent, option, clipId }: { liquid: string; accent: string; option?: OptionType; clipId: string }) {
  return (
    <>
      <defs>
        <clipPath id={clipId}>
          <polygon points="17,13 31,13 35,39 13,39" />
        </clipPath>
      </defs>

      {option === 'HOT' && <SteamLines cx={24} />}

      {/* Lid */}
      <rect x="15" y="9" width="18" height="5" rx="2.5" fill="#E0E0E0" />
      <rect x="14" y="13" width="20" height="1.5" rx="0.5" fill="#CACACA" />

      {/* Cup body */}
      <polygon points="17,13 31,13 35,39 13,39" fill="white" stroke="#D0D0D0" strokeWidth="0.8" />

      {/* Liquid fill */}
      <rect x="13" y="26" width="22" height="13" fill={liquid} opacity={0.9} clipPath={`url(#${clipId})`} />

      {option === 'ICE' && <IceCubes y={27} />}

      {/* Cup outline over liquid */}
      <polygon points="17,13 31,13 35,39 13,39" fill="none" stroke="#D0D0D0" strokeWidth="0.8" />

      {/* Base */}
      <rect x="13" y="39" width="22" height="2" rx="1" fill="#C8C8C8" />

      {/* Straw */}
      <line x1="29" y1="9" x2="33" y2="2" stroke={accent} strokeWidth="2" strokeLinecap="round" />
    </>
  );
}

// ---------------------------------------------------------------------------
// SHAPE: mug — ceramic mug for HOT menus
// ---------------------------------------------------------------------------
function Mug({ liquid, option }: { liquid: string; option?: OptionType }) {
  return (
    <>
      {option === 'HOT' && <SteamLines cx={23} />}

      {/* Rim */}
      <rect x="11" y="12" width="24" height="3" rx="1.5" fill="#E8E8E8" />

      {/* Mug body */}
      <rect x="12" y="14" width="22" height="22" rx="3" fill="white" stroke="#D0D0D0" strokeWidth="0.8" />

      {/* Handle */}
      <path d="M34,18 Q43,18 43,25 Q43,32 34,32" fill="none" stroke="#D0D0D0" strokeWidth="2.5" strokeLinecap="round" />

      {/* Liquid */}
      <rect x="12.5" y="26" width="21" height="9.5" fill={liquid} opacity={0.9}
        style={{ clipPath: 'inset(0 0 0 0 round 0 0 3px 3px)' }} />

      {/* Base */}
      <rect x="11" y="36" width="24" height="2.5" rx="1.2" fill="#DADADA" />
    </>
  );
}

// ---------------------------------------------------------------------------
// SHAPE: frappe — tall glass with smooth blended slush + citrus garnish
// ---------------------------------------------------------------------------
function Frappe({ liquid, accent, clipId }: { liquid: string; accent: string; clipId: string }) {
  return (
    <>
      <defs>
        <clipPath id={clipId}>
          <polygon points="11,10 37,10 34,43 14,43" />
        </clipPath>
      </defs>

      {/* Glass body */}
      <polygon points="11,10 37,10 34,43 14,43" fill="rgba(255,255,255,0.12)" stroke="#C0C0C0" strokeWidth="0.9" />

      {/* Blended liquid fill */}
      <polygon points="11,10 37,10 34,43 14,43" fill={liquid} opacity={0.85} />

      {/* Fine slush texture dots */}
      <g clipPath={`url(#${clipId})`} opacity={0.38}>
        <circle cx="17" cy="15" r="1.5" fill="white" />
        <circle cx="28" cy="13" r="1.2" fill="white" />
        <circle cx="33" cy="19" r="1.4" fill="white" />
        <circle cx="14" cy="25" r="1.1" fill="white" />
        <circle cx="23" cy="22" r="1.6" fill="white" />
        <circle cx="32" cy="28" r="1.3" fill="white" />
        <circle cx="18" cy="33" r="1.4" fill="white" />
        <circle cx="28" cy="37" r="1.2" fill="white" />
        <circle cx="15" cy="40" r="1.1" fill="white" />
      </g>

      {/* Left glass highlight */}
      <line x1="13.5" y1="13" x2="15.5" y2="41" stroke="rgba(255,255,255,0.35)" strokeWidth="2.5" strokeLinecap="round" />

      {/* Domed top surface of blended drink */}
      <ellipse cx="24" cy="9.5" rx="13" ry="3.5" fill={liquid} opacity={0.9} />

      {/* Rim strip */}
      <rect x="10" y="8" width="28" height="3.5" rx="1.5" fill="#DCDCDC" opacity={0.85} />

      {/* Glass outline over content */}
      <polygon points="11,10 37,10 34,43 14,43" fill="none" stroke="#C0C0C0" strokeWidth="0.9" />

      {/* Base */}
      <rect x="14" y="43" width="20" height="2" rx="1" fill="#C4C4C4" />

      {/* Straw */}
      <line x1="32" y1="9" x2="36" y2="1" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />

      {/* Citrus garnish — lemon/lime slice perched on right rim */}
      <circle cx="37" cy="7" r="6.5" fill="#FFDA44" />
      <circle cx="37" cy="7" r="5" fill="white" opacity={0.5} />
      <line x1="37" y1="0.5" x2="37" y2="13.5" stroke="#CC8800" strokeWidth="0.8" opacity={0.75} />
      <line x1="31.4" y1="3.7" x2="42.6" y2="10.3" stroke="#CC8800" strokeWidth="0.8" opacity={0.75} />
      <line x1="31.4" y1="10.3" x2="42.6" y2="3.7" stroke="#CC8800" strokeWidth="0.8" opacity={0.75} />
      <circle cx="37" cy="7" r="1.8" fill="#FFAA00" opacity={0.65} />
      <circle cx="37" cy="7" r="6.5" fill="none" stroke="#CC8800" strokeWidth="0.7" />
    </>
  );
}

// ---------------------------------------------------------------------------
// SHAPE: glass — tall glass for ades and fizzy drinks
// ---------------------------------------------------------------------------
function Glass({ liquid, option, clipId }: { liquid: string; option?: OptionType; clipId: string }) {
  return (
    <>
      <defs>
        <clipPath id={clipId}>
          <polygon points="13,8 35,8 32,40 16,40" />
        </clipPath>
      </defs>

      {/* Glass body */}
      <polygon points="13,8 35,8 32,40 16,40" fill="rgba(255,255,255,0.2)" stroke="#C4C4C4" strokeWidth="0.9" />

      {/* Liquid */}
      <rect x="16" y="19" width="16" height="21" fill={liquid} opacity={0.82} clipPath={`url(#${clipId})`} />

      {/* Rim highlight */}
      <line x1="13" y1="8" x2="35" y2="8" stroke="#E0E0E0" strokeWidth="1.5" />

      {/* Bubbles near liquid top */}
      <g opacity={0.65}>
        <circle cx="20" cy="22" r="1.6" fill="white" />
        <circle cx="27" cy="21" r="1.2" fill="white" />
        <circle cx="23" cy="24" r="1" fill="white" />
      </g>

      {option === 'ICE' && <IceCubes y={25} />}

      {/* Base */}
      <rect x="16" y="40" width="16" height="2" rx="1" fill="#C0C0C0" />
    </>
  );
}

// ---------------------------------------------------------------------------
// SHAPE: teacup — wide shallow cup with saucer and teabag
// ---------------------------------------------------------------------------
function Teacup({ liquid, accent, clipId }: { liquid: string; accent: string; clipId: string }) {
  return (
    <>
      <defs>
        <clipPath id={clipId}>
          <polygon points="10,22 38,22 35,36 13,36" />
        </clipPath>
      </defs>

      {/* Saucer */}
      <ellipse cx="24" cy="38" rx="15" ry="3.5" fill="#E0E0E0" stroke="#CACACA" strokeWidth="0.6" />

      {/* Cup body */}
      <polygon points="10,22 38,22 35,36 13,36" fill="white" stroke="#D0D0D0" strokeWidth="0.8" />

      {/* Liquid */}
      <rect x="13" y="30" width="22" height="6" fill={liquid} opacity={0.85} clipPath={`url(#${clipId})`} />

      {/* Cup outline */}
      <polygon points="10,22 38,22 35,36 13,36" fill="none" stroke="#D0D0D0" strokeWidth="0.8" />

      {/* Cup rim */}
      <rect x="9" y="19.5" width="30" height="3.5" rx="1.75" fill="#EBEBEB" stroke="#D8D8D8" strokeWidth="0.6" />

      {/* Handle on right */}
      <path d="M35,24 Q42,24 42,29 Q42,34 35,34" fill="none" stroke="#D0D0D0" strokeWidth="2.2" strokeLinecap="round" />

      {/* Teabag string */}
      <line x1="33" y1="20.5" x2="37" y2="13" stroke="#C0A88A" strokeWidth="1" />
      {/* Tag */}
      <rect x="35" y="10" width="5" height="4" rx="1" fill={accent} opacity={0.75} />
    </>
  );
}

// ---------------------------------------------------------------------------
// SHAPE: bottle — for 병음료 / MD items
// ---------------------------------------------------------------------------
function Bottle({ liquid, accent, clipId }: { liquid: string; accent: string; clipId: string }) {
  const bodyPath = 'M19,14 L19,9 L22,7 L26,7 L29,9 L29,14 Q35,18 35,26 L35,36 Q35,40 24,40 Q13,40 13,36 L13,26 Q13,18 19,14 Z';
  return (
    <>
      <defs>
        <clipPath id={clipId}>
          <path d={bodyPath} />
        </clipPath>
      </defs>

      <path d={bodyPath} fill="white" stroke="#C8C8C8" strokeWidth="0.9" />
      <rect x="13" y="27" width="22" height="13" fill={liquid} opacity={0.85} clipPath={`url(#${clipId})`} />
      <path d={bodyPath} fill="none" stroke="#C8C8C8" strokeWidth="0.9" />
      <rect x="21" y="5" width="6" height="5" rx="1.5" fill={accent} />
      <rect x="14" y="23" width="20" height="2.5" fill={accent} opacity={0.25} rx="1" />
    </>
  );
}

// ---------------------------------------------------------------------------
// SHAPE: cake — 조각 케이크 (우상단 뷰)
//
//         P3 (꼭짓점, 케이크 중심)
//        / \
//     a /   \ b     ← 같은 길이, 단면
//      /     \
//    P1-------P2
//        c          ← 바깥 곡면
//
// 정면: 변a (P1→P3) 직사각형 — 단면 레이어
// 윗면: 삼각형 P1→P3→P2, P2는 좌상단으로 빠짐
// 변b, c: 안보임
// ---------------------------------------------------------------------------
function Cake({ liquid, accent }: { liquid: string; accent: string }) {
  // P1(바깥모서리, 좌)=(8,22), P3(꼭짓점, 우)=(34,22)
  // 정면(변a): (8,22)-(34,22)-(34,44)-(8,44)  w=26, h=22
  // P2(뒤쪽, 좌상단)=(16,14)
  // 윗면삼각형: (8,22)-(34,22)-(16,14)

  return (
    <>
      {/* 접시 */}
      <ellipse cx="22" cy="46" rx="18" ry="2" fill="#E8E8E8" stroke="#D0D0D0" strokeWidth="0.6" />

      {/* 윗면 — 삼각형 (P1→P3→P2, 화이트 프로스팅) */}
      <polygon points="8,22 34,22 16,14" fill="white" stroke="#E8E0D8" strokeWidth="0.5" />

      {/* 정면 — 변a (P1→P3, 흰 프로스팅 프레임 + 내부 레이어) */}
      <rect x="8" y="22" width="26" height="22" fill="white" />

      {/* 레이어 (프로스팅 테두리 2px 안쪽) */}
      {/* 스펀지 1 (y=24→29) */}
      <rect x="10" y="24" width="22" height="5" fill={liquid} opacity={0.82} />

      {/* 크림 + 딸기 (y=29→31) */}
      <rect x="10" y="29" width="22" height="2" fill="#FFF8F2" />
      <ellipse cx="16" cy="30" rx="2.2" ry="0.8" fill="#FFB0B8" opacity={0.65} />
      <ellipse cx="25" cy="30" rx="2" ry="0.7" fill="#FFB0B8" opacity={0.55} />

      {/* 스펀지 2 (y=31→36) */}
      <rect x="10" y="31" width="22" height="5" fill={liquid} opacity={0.82} />

      {/* 크림 + 딸기 (y=36→38) */}
      <rect x="10" y="36" width="22" height="2" fill="#FFF8F2" />
      <ellipse cx="17" cy="37" rx="2.5" ry="0.8" fill="#FFB0B8" opacity={0.7} />
      <ellipse cx="26" cy="37" rx="2.2" ry="0.7" fill="#FFB0B8" opacity={0.6} />

      {/* 스펀지 3 (y=38→44) */}
      <rect x="10" y="38" width="22" height="6" fill={liquid} opacity={0.82} />

      {/* 정면 아웃라인 */}
      <rect x="8" y="22" width="26" height="22" fill="none" stroke={accent} strokeWidth="0.7" opacity={0.25} />

      {/* 휘핑크림 (윗면 위, 삼각형 안쪽) */}
      <ellipse cx="20" cy="18.5" rx="4" ry="1.8" fill="white" stroke="#E8E0D8" strokeWidth="0.3" />
      <ellipse cx="20" cy="17.8" rx="2.8" ry="1.3" fill="white" />
      <ellipse cx="20" cy="17.5" rx="1.6" ry="0.8" fill="#FAFAFA" />

      {/* 딸기 */}
      <ellipse cx="20" cy="16" rx="3" ry="2.5" fill="#FF4B5C" />
      <circle cx="18.5" cy="15.5" r="0.35" fill="#FF8A94" opacity={0.7} />
      <circle cx="20.8" cy="14.8" r="0.35" fill="#FF8A94" opacity={0.7} />
      <circle cx="19.5" cy="17.3" r="0.35" fill="#FF8A94" opacity={0.6} />
      <circle cx="21.5" cy="16.7" r="0.3" fill="#FF8A94" opacity={0.6} />
      <path d="M19,13.8 L20,12.3 L21,13.8" fill="#4CAF50" stroke="#388E3C" strokeWidth="0.5" />
      <path d="M18.3,14.3 L19.5,12.6" stroke="#4CAF50" strokeWidth="0.6" strokeLinecap="round" fill="none" />
      <path d="M21.7,14.3 L20.5,12.6" stroke="#4CAF50" strokeWidth="0.6" strokeLinecap="round" fill="none" />
    </>
  );
}

// ---------------------------------------------------------------------------
// SHAPE: snack — 쿠키/과자 (two overlapping cookies, large irregular chips)
// ---------------------------------------------------------------------------
function Snack(): React.ReactElement {
  return (
    <>
      {/* Back cookie — darker golden amber */}
      <circle cx="27" cy="22" r="12" fill="#A06818" stroke="#7A5010" strokeWidth="0.9" />
      {/* Back chips — visible in upper portion above front cookie */}
      <ellipse cx="30" cy="15" rx="3.5" ry="1.8" fill="#1C0E05" opacity={0.88} transform="rotate(-22, 30, 15)" />
      <rect x="21.5" y="13" width="4" height="2.3" rx="0.6" fill="#1C0E05" opacity={0.88} transform="rotate(8, 23.5, 14.15)" />
      <ellipse cx="35" cy="20" rx="1.8" ry="2.8" fill="#1C0E05" opacity={0.88} transform="rotate(15, 35, 20)" />

      {/* Front cookie — lighter golden amber */}
      <circle cx="21" cy="30" r="13" fill="#C8922E" stroke="#946818" strokeWidth="0.9" />
      {/* Front chips — large and irregular */}
      <ellipse cx="15" cy="23" rx="3.8" ry="2" fill="#1C0E05" transform="rotate(-30, 15, 23)" />
      <rect x="22" y="21.5" width="4.5" height="2.5" rx="0.6" fill="#1C0E05" transform="rotate(15, 24.25, 22.75)" />
      <ellipse cx="13" cy="31" rx="2" ry="3.2" fill="#1C0E05" transform="rotate(20, 13, 31)" />
      <polygon points="21,33 25,32.5 25.5,36 21.5,36.5" fill="#1C0E05" />
      <ellipse cx="18" cy="38" rx="3.2" ry="1.6" fill="#1C0E05" transform="rotate(-15, 18, 38)" />
      <rect x="25.5" y="37" width="3.2" height="2" rx="0.5" fill="#1C0E05" transform="rotate(10, 27.1, 38)" />

      {/* Highlight on front cookie */}
      <circle cx="15" cy="24" r="4" fill="white" opacity={0.16} />
    </>
  );
}

// ---------------------------------------------------------------------------
// SHAPE: setMenu — 세트 메뉴 (mini cup + mini cookie)
// ---------------------------------------------------------------------------
function SetMenu({ liquid, accent, clipId }: { liquid: string; accent: string; clipId: string }) {
  return (
    <>
      <defs>
        <clipPath id={clipId}>
          <polygon points="4,16 18,16 21,40 1,40" />
        </clipPath>
      </defs>

      {/* === Mini cup (left) === */}
      <rect x="2" y="11" width="18" height="5" rx="2.5" fill="#E0E0E0" />
      <polygon points="4,16 18,16 21,40 1,40" fill="white" stroke="#D0D0D0" strokeWidth="0.7" />
      <rect x="1" y="27" width="20" height="13" fill={liquid} opacity={0.88} clipPath={`url(#${clipId})`} />
      <polygon points="4,16 18,16 21,40 1,40" fill="none" stroke="#D0D0D0" strokeWidth="0.7" />
      <rect x="1" y="40" width="20" height="1.5" rx="0.75" fill="#C8C8C8" />
      <line x1="16" y1="11" x2="19" y2="4" stroke={accent} strokeWidth="2" strokeLinecap="round" />

      {/* === Mini cookie (right, darker amber + prominent irregular chips) === */}
      <circle cx="36" cy="28" r="12" fill="#A06818" stroke="#7A5010" strokeWidth="0.8" />
      <ellipse cx="32.5" cy="23" rx="3" ry="1.6" fill="#1C0E05" transform="rotate(-22, 32.5, 23)" />
      <rect x="37" y="23" width="4" height="2.2" rx="0.5" fill="#1C0E05" transform="rotate(10, 39, 24.1)" />
      <ellipse cx="32" cy="31" rx="1.6" ry="2.4" fill="#1C0E05" transform="rotate(20, 32, 31)" />
      <polygon points="37.5,30.5 41,30 41.5,33 38,33.5" fill="#1C0E05" />
      <rect x="33" y="36" width="3.5" height="1.8" rx="0.4" fill="#1C0E05" transform="rotate(-10, 34.75, 36.9)" />
      <circle cx="33.5" cy="22" r="2.5" fill="white" opacity={0.18} />
    </>
  );
}

// ---------------------------------------------------------------------------
// SHAPE: giftCard — 상품권 (card with colored stripe and chip)
// ---------------------------------------------------------------------------
function GiftCard({ accent }: { accent: string }) {
  return (
    <>
      {/* Card shadow */}
      <rect x="6" y="14" width="36" height="22" rx="3.5" fill="#D0D0D0" />

      {/* Card body */}
      <rect x="5" y="13" width="36" height="22" rx="3.5" fill="white" stroke="#E0E0E0" strokeWidth="0.8" />

      {/* Top color stripe */}
      <rect x="5" y="13" width="36" height="9" rx="3.5" fill={accent} opacity={0.88} />
      <rect x="5" y="18" width="36" height="4" fill={accent} opacity={0.88} />

      {/* EMV Chip */}
      <rect x="9" y="25" width="10" height="7" rx="1.5" fill="#D4AF37" opacity={0.88} />
      <line x1="11.5" y1="25" x2="11.5" y2="32" stroke="#A08000" strokeWidth="0.7" opacity={0.7} />
      <line x1="14" y1="25" x2="14" y2="32" stroke="#A08000" strokeWidth="0.7" opacity={0.7} />
      <line x1="16.5" y1="25" x2="16.5" y2="32" stroke="#A08000" strokeWidth="0.7" opacity={0.7} />
      <line x1="9" y1="28.5" x2="19" y2="28.5" stroke="#A08000" strokeWidth="0.7" opacity={0.7} />

      {/* Number/info lines */}
      <rect x="23" y="26" width="14" height="2" rx="1" fill="#EEEEEE" />
      <rect x="23" y="30" width="9" height="2" rx="1" fill="#EEEEEE" />
    </>
  );
}

// ---------------------------------------------------------------------------
// SHAPE: addon — simple circle with + symbol
// ---------------------------------------------------------------------------
function Addon({ accent }: { accent: string }) {
  return (
    <>
      <circle cx="24" cy="24" r="15" fill={accent} opacity={0.88} />
      <line x1="24" y1="16" x2="24" y2="32" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <line x1="16" y1="24" x2="32" y2="24" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
const MenuIcon: React.FC<MenuIconProps> = React.memo(({
  menuName,
  categoryUpper,
  categoryLower,
  option,
  size = 40,
}) => {
  const uid = React.useId();
  const clipId = `mc-${uid.replace(/:/g, '')}`;
  const { liquid, accent } = getMenuColors(menuName ?? '');
  const shape = selectShape(categoryUpper, categoryLower, menuName ?? '', option);

  const renderShape = () => {
    switch (shape) {
      case 'tallCup': return <TallCup liquid={liquid} accent={accent} option={option} clipId={clipId} />;
      case 'mug': return <Mug liquid={liquid} option={option} />;
      case 'frappe': return <Frappe liquid={liquid} accent={accent} clipId={clipId} />;
      case 'glass': return <Glass liquid={liquid} option={option} clipId={clipId} />;
      case 'teacup': return <Teacup liquid={liquid} accent={accent} clipId={clipId} />;
      case 'bottle': return <Bottle liquid={liquid} accent={accent} clipId={clipId} />;
      case 'cake': return <Cake liquid={liquid} accent={accent} />;
      case 'snack': return <Snack />;
      case 'setMenu': return <SetMenu liquid={liquid} accent={accent} clipId={clipId} />;
      case 'giftCard': return <GiftCard accent={accent} />;
      case 'addon': return <Addon accent={accent} />;
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      {renderShape()}
    </svg>
  );
});

MenuIcon.displayName = 'MenuIcon';
export default MenuIcon;
