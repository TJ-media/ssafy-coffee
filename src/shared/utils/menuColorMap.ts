export interface MenuColors {
  liquid: string;
  accent: string;
}

// Priority-ordered keyword list — first match wins.
const COLOR_MAP: [string[], MenuColors][] = [
  // 과일/맛 키워드 (구체적인 것 먼저)
  [['딸기'],                         { liquid: '#FF6B8A', accent: '#FF4D6D' }],
  [['블루베리'],                      { liquid: '#6B5CA5', accent: '#8B7CC8' }],
  [['복숭아', '피치'],                { liquid: '#FFB085', accent: '#FF9966' }],
  [['망고'],                         { liquid: '#FFD166', accent: '#FFBA08' }],
  [['자몽', '그레이프프루트'],        { liquid: '#FF8585', accent: '#FF6B6B' }],
  [['레몬', '라임'],                  { liquid: '#F0E68C', accent: '#DAA520' }],
  [['청포도', '머스캣'],              { liquid: '#B8E986', accent: '#7DC95E' }],
  [['유자'],                         { liquid: '#FFE066', accent: '#FFD000' }],
  [['체리'],                         { liquid: '#DC143C', accent: '#B22222' }],
  [['오렌지'],                       { liquid: '#FFA54F', accent: '#FF8C00' }],
  [['수박'],                         { liquid: '#FF6B6B', accent: '#EE4444' }],
  [['사과'],                         { liquid: '#FF6961', accent: '#E74C3C' }],
  [['키위'],                         { liquid: '#8DB600', accent: '#6B8E23' }],
  [['감귤', '청귤'],                  { liquid: '#FFA500', accent: '#FF8C00' }],
  [['오미자'],                       { liquid: '#C71585', accent: '#DB2777' }],
  [['홍시'],                         { liquid: '#FF6347', accent: '#E55B3C' }],
  // 맛/베이스 키워드
  [['말차', '녹차', '그린티'],        { liquid: '#7BC67E', accent: '#4CAF50' }],
  [['초코', '모카', '초콜릿', '코코아'], { liquid: '#6B4423', accent: '#8B5E3C' }],
  [['카라멜'],                       { liquid: '#C68642', accent: '#A0522D' }],
  [['바닐라'],                       { liquid: '#F3E5AB', accent: '#DAA520' }],
  [['헤이즐넛'],                     { liquid: '#A0522D', accent: '#8B4513' }],
  [['토피넛'],                       { liquid: '#C19A6B', accent: '#A0522D' }],
  [['시나몬'],                       { liquid: '#D2691E', accent: '#A0522D' }],
  [['피스타치오'],                    { liquid: '#93C572', accent: '#6B8E23' }],
  [['민트'],                         { liquid: '#98FFE0', accent: '#3EB489' }],
  [['꿀', '허니'],                    { liquid: '#FFD700', accent: '#DAA520' }],
  [['연유'],                         { liquid: '#FFFDD0', accent: '#F5DEB3' }],
  [['흑당'],                         { liquid: '#3C1414', accent: '#5C2626' }],
  [['곡물', '미숫가루', '오곡'],      { liquid: '#C4A35A', accent: '#A0884A' }],
  [['고구마'],                       { liquid: '#9B59B6', accent: '#8E44AD' }],
  [['팥', '통팥'],                    { liquid: '#722F37', accent: '#5C2626' }],
  [['두바이'],                       { liquid: '#2E8B57', accent: '#006400' }],
  [['로즈'],                         { liquid: '#FFB6C1', accent: '#FF69B4' }],
  [['핑크'],                         { liquid: '#FFB6C1', accent: '#FF69B4' }],
  [['식혜'],                         { liquid: '#F5DEB3', accent: '#DEB887' }],
  // 티 키워드
  [['캐모마일'],                     { liquid: '#FFFACD', accent: '#F0E68C' }],
  [['히비스커스'],                    { liquid: '#C71585', accent: '#DB2777' }],
  [['페퍼민트'],                     { liquid: '#98FFE0', accent: '#3EB489' }],
  [['얼그레이'],                     { liquid: '#B8860B', accent: '#996515' }],
  [['루이보스'],                     { liquid: '#CD5C5C', accent: '#A0522D' }],
  [['뱅쇼'],                         { liquid: '#722F37', accent: '#8B0000' }],
  [['쌍화'],                         { liquid: '#4A3728', accent: '#3C2A1E' }],
  // 커피 기본
  [['콜드브루'],                     { liquid: '#3C2415', accent: '#2C1810' }],
  [['에스프레소'],                    { liquid: '#3C1C0C', accent: '#2C1408' }],
  [['아메리카노', '리카노'],          { liquid: '#6F4E37', accent: '#5C3D2E' }],
  [['라떼'],                         { liquid: '#D2B48C', accent: '#C4A47A' }],
  [['카푸치노'],                     { liquid: '#C4A47A', accent: '#A08060' }],
  // 기타
  [['헛개'],                         { liquid: '#8B7355', accent: '#6B5B45' }],
  [['프로틴'],                       { liquid: '#F5DEB3', accent: '#DEB887' }],
  [['요거트', '요구르트'],            { liquid: '#FAFAD2', accent: '#EEE8AA' }],
];

const DEFAULT_COLORS: MenuColors = { liquid: '#A0825C', accent: '#8B6B4A' };

export function getMenuColors(menuName: string): MenuColors {
  for (const [keywords, colors] of COLOR_MAP) {
    if (keywords.some(kw => menuName.includes(kw))) return colors;
  }
  return DEFAULT_COLORS;
}
