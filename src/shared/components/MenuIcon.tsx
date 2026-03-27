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

  if (['프라페', '스무디', '블렌디드', '쉐이크', '바나치노'].some(k => lower.includes(k))) return 'frappe';
  if (['에이드', '피지오', '리프레셔'].some(k => lower.includes(k))) return 'glass';
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
// SHAPE: frappe — wide cup filled to brim with blended ice drink
// ---------------------------------------------------------------------------
function Frappe({ liquid, accent, clipId }: { liquid: string; accent: string; clipId: string }) {
  // Wider cup (smoothie style), no lid, liquid+ice fills to the rim
  return (
    <>
      <defs>
        <clipPath id={clipId}>
          <polygon points="9,16 39,16 36,42 12,42" />
        </clipPath>
      </defs>

      {/* Rim */}
      <rect x="7" y="13" width="34" height="4" rx="2" fill="#DCDCDC" />

      {/* Cup body — filled with blended liquid to the brim */}
      <polygon points="9,16 39,16 36,42 12,42" fill={liquid} opacity={0.82} />

      {/* Crushed ice chunks scattered throughout */}
      <g clipPath={`url(#${clipId})`}>
        <rect x="10" y="17" width="8" height="6" rx="1.8" fill="white" opacity={0.72} transform="rotate(-14, 14, 20)" />
        <rect x="22" y="15" width="7" height="5" rx="1.5" fill="white" opacity={0.65} transform="rotate(9, 25.5, 17.5)" />
        <rect x="31" y="19" width="7" height="6" rx="1.8" fill="white" opacity={0.7} transform="rotate(-7, 34.5, 22)" />
        <rect x="13" y="28" width="7" height="5" rx="1.5" fill="white" opacity={0.62} transform="rotate(16, 16.5, 30.5)" />
        <rect x="24" y="30" width="8" height="5" rx="1.8" fill="white" opacity={0.68} transform="rotate(-10, 28, 32.5)" />
        <rect x="31" y="35" width="6" height="5" rx="1.5" fill="white" opacity={0.6} transform="rotate(5, 34, 37.5)" />
        <rect x="11" y="37" width="7" height="4" rx="1.5" fill="white" opacity={0.58} transform="rotate(-8, 14.5, 39)" />
      </g>

      {/* Slightly wavy blended surface on top */}
      <path d="M9,16 Q12,13 16,16 Q20,13 24,16 Q28,13 32,16 Q36,13 39,16"
        fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.8" strokeLinecap="round" />

      {/* Cup outline */}
      <polygon points="9,16 39,16 36,42 12,42" fill="none" stroke="#C0C0C0" strokeWidth="1" />

      {/* Base */}
      <rect x="12" y="42" width="24" height="2" rx="1" fill="#C8C8C8" />

      {/* Straw */}
      <line x1="32" y1="14" x2="36" y2="2" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
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
// SHAPE: cake — 조각 케이크 (trapezoid cross-section with layers)
// ---------------------------------------------------------------------------
function Cake({ liquid, accent }: { liquid: string; accent: string }) {
  // Trapezoid: bottom (8,40)-(40,40), top (16,15)-(32,15)
  // Layers computed at interpolated x-coords:
  //   y=19: left≈14.8→15,  right≈33.2→33
  //   y=27: left≈12.1→12,  right≈35.9→36
  //   y=29: left≈11.5,     right≈36.5
  return (
    <>
      {/* Plate */}
      <ellipse cx="24" cy="43" rx="17" ry="3.5" fill="#E8E8E8" stroke="#D4D4D4" strokeWidth="0.6" />

      {/* Lower sponge (widest layer) */}
      <polygon points="8,40 40,40 36.5,29 11.5,29" fill={liquid} opacity={0.9} />

      {/* Cream divider */}
      <polygon points="11.5,29 36.5,29 36,27 12,27" fill="white" opacity={0.92} />

      {/* Upper sponge */}
      <polygon points="12,27 36,27 33,19 15,19" fill={liquid} opacity={0.9} />

      {/* Frosting band */}
      <polygon points="15,19 33,19 32,15 16,15" fill={accent} opacity={0.82} />

      {/* Wavy frosting top */}
      <path d="M16,15 Q18,11.5 20,15 Q22,11.5 24,15 Q26,11.5 28,15 Q30,11.5 32,15"
        fill="none" stroke={accent} strokeWidth="2.2" strokeLinecap="round" />

      {/* Full outline */}
      <polygon points="8,40 40,40 32,15 16,15" fill="none" stroke="#C8C8C8" strokeWidth="0.9" />

      {/* Cherry on top */}
      <circle cx="24" cy="8" r="3.5" fill="#FF6B8A" />
      <path d="M24,4.5 Q22,1 23.5,0" stroke="#5CB85C" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </>
  );
}

// ---------------------------------------------------------------------------
// SHAPE: snack — 쿠키/과자 (two overlapping round cookies)
// ---------------------------------------------------------------------------
function Snack(): React.ReactElement {
  // Fixed warm cookie colors — not tied to menu liquid/accent
  return (
    <>
      {/* Back cookie */}
      <circle cx="28" cy="25" r="13" fill="#E8C87A" stroke="#C4A050" strokeWidth="0.9" />
      <circle cx="25" cy="21" r="2.2" fill="#6B4423" />
      <circle cx="31" cy="25" r="2.2" fill="#6B4423" />
      <circle cx="25" cy="30" r="2.2" fill="#6B4423" />
      <circle cx="33" cy="19" r="1.6" fill="#6B4423" />

      {/* Front cookie */}
      <circle cx="20" cy="27" r="13" fill="#F0D080" stroke="#C4A050" strokeWidth="0.9" />
      <circle cx="16" cy="23" r="2.2" fill="#3C2415" />
      <circle cx="23" cy="25" r="2.2" fill="#3C2415" />
      <circle cx="15" cy="30" r="2.2" fill="#3C2415" />
      <circle cx="22" cy="32" r="2.2" fill="#3C2415" />

      {/* Highlight */}
      <circle cx="15" cy="21" r="3.5" fill="white" opacity={0.22} />
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

      {/* === Mini cookie (right) === */}
      <circle cx="36" cy="28" r="12" fill="#F0D080" stroke="#C4A050" strokeWidth="0.8" />
      <circle cx="33" cy="24" r="2" fill="#3C2415" />
      <circle cx="39" cy="26" r="2" fill="#3C2415" />
      <circle cx="33" cy="31" r="2" fill="#3C2415" />
      <circle cx="38" cy="33" r="2" fill="#3C2415" />
      <circle cx="32" cy="22" r="2.8" fill="white" opacity={0.2} />
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
      case 'tallCup':  return <TallCup liquid={liquid} accent={accent} option={option} clipId={clipId} />;
      case 'mug':      return <Mug liquid={liquid} option={option} />;
      case 'frappe':   return <Frappe liquid={liquid} accent={accent} clipId={clipId} />;
      case 'glass':    return <Glass liquid={liquid} option={option} clipId={clipId} />;
      case 'teacup':   return <Teacup liquid={liquid} accent={accent} clipId={clipId} />;
      case 'bottle':   return <Bottle liquid={liquid} accent={accent} clipId={clipId} />;
      case 'cake':     return <Cake liquid={liquid} accent={accent} />;
      case 'snack':    return <Snack />;
      case 'setMenu':  return <SetMenu liquid={liquid} accent={accent} clipId={clipId} />;
      case 'giftCard': return <GiftCard accent={accent} />;
      case 'addon':    return <Addon accent={accent} />;
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
