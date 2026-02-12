import { FavoriteItem } from '../types';

const PASTEL_PALETTE = [
  '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF',
  '#E2F0CB', '#B5EAD7', '#C7CEEA', '#F0E68C', '#FFD1DC',
  '#E6E6FA', '#D8BFD8', '#FF9999', '#FFCC99', '#99FF99',
  '#99CCFF', '#CC99FF', '#FFB6C1', '#ADD8E6', '#F08080'
];

export const getAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PASTEL_PALETTE.length;
  return PASTEL_PALETTE[index];
};

export const getTextContrastColor = () => {
  return '#374151';
};

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

export const getNextBusinessDay = (date: Date = new Date()): Date => {
  const result = new Date(date);
  const dayOfWeek = result.getDay();

  if (dayOfWeek === 5) {
    result.setDate(result.getDate() + 3);
  } else if (dayOfWeek === 6) {
    result.setDate(result.getDate() + 2);
  } else {
    result.setDate(result.getDate() + 1);
  }

  return result;
};