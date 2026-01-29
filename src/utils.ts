import { FavoriteItem } from './types';

// 이름 문자열을 받아 항상 같은 색상 코드를 반환하는 함수
export const getAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
};

// ========== 즐겨찾기 유틸 함수 ==========
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