import { FavoriteItem } from './types';

// 20가지 파스텔 톤 색상 팔레트 (HEAD 버전 유지)
const PASTEL_PALETTE = [
  '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF', 
  '#E2F0CB', '#B5EAD7', '#C7CEEA', '#F0E68C', '#FFD1DC', 
  '#E6E6FA', '#D8BFD8', '#FF9999', '#FFCC99', '#99FF99', 
  '#99CCFF', '#CC99FF', '#FFB6C1', '#ADD8E6', '#F08080'
];

// 이름을 입력받아 20가지 색상 중 하나를 고정적으로 반환
export const getAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PASTEL_PALETTE.length;
  return PASTEL_PALETTE[index];
};

// 배경색이 밝으므로 글자색은 어두운 색으로 반환
export const getTextContrastColor = () => {
  return '#374151'; // gray-700
};

// ========== 즐겨찾기 유틸 함수 (Remote 버전 추가) ==========
const FAVORITES_KEY = 'ssafy_favorites';

export const getFavorites = (): FavoriteItem[] => {
  const stored = localStorage.getItem(FAVORITES_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

export const addFavorite = (menuId: number, menuName: string): void => {
  const favorites = getFavorites();
  if (favorites.some(f => f.menuId === menuId)) return;

  const newFavorite: FavoriteItem = {
    menuId,
    menuName,
    addedAt: Date.now()
  };
  favorites.push(newFavorite);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
};

export const removeFavorite = (menuId: number): void => {
  const favorites = getFavorites();
  const filtered = favorites.filter(f => f.menuId !== menuId);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));
};

export const isFavorite = (menuId: number): boolean => {
  const favorites = getFavorites();
  return favorites.some(f => f.menuId === menuId);
};

// ========== 다음 영업일 계산 ==========
// 오늘 게임하면 내일 커피 사기, 금요일이면 월요일
export const getNextBusinessDay = (date: Date = new Date()): Date => {
  const result = new Date(date);
  const dayOfWeek = result.getDay(); // 0=일, 1=월, ..., 5=금, 6=토

  if (dayOfWeek === 5) {
    // 금요일 → 월요일 (+3일)
    result.setDate(result.getDate() + 3);
  } else if (dayOfWeek === 6) {
    // 토요일 → 월요일 (+2일)
    result.setDate(result.getDate() + 2);
  } else {
    // 일~목요일 → 다음 날 (+1일)
    result.setDate(result.getDate() + 1);
  }

  return result;
};