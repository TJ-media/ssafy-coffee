export type OptionType = 'ICE' | 'HOT' | 'ONLY';

export interface Menu {
  id: number;
  categoryUpper: string;
  categoryLower: string;
  name: string;
  price: number;
  img: string;
  hasOption: boolean;
  defaultOption?: OptionType; // 👈 추가: 커스텀 메뉴의 기본 옵션 저장 (ICE/HOT)
}

export interface CartItem {
  id: number;
  userName: string;
  menuName: string;
  price: number;
  option: OptionType;
  category: string;
}

export interface GroupData {
  password?: string;
  adminPassword?: string;
  createdAt?: any;
  cart: CartItem[];
  selectedCafe: string;
  history?: OrderHistory[];
  rouletteGame?: RouletteGameState;
  rouletteHistory?: RouletteHistory[];
  marbleCounts?: { [userName: string]: number };
  approvedUsers?: string[];
  pendingUsers?: string[];
  customMenus?: { [userName: string]: Menu[] };
}

export interface GroupedCartItem {
  count: number;
  names: string[];
  price: number;
  menuName: string;
  option: OptionType;
}

export interface FavoriteItem {
  menuId: number;
  menuName: string;
  addedAt: number;
  // defaultOption?: OptionType; // 즐겨찾기에도 옵션 저장이 필요하다면 추후 고려
}

export interface HistoryItem {
  menuName: string;
  option: OptionType;
  price: number;
  count: number;
  orderedBy: string[];
}

export interface OrderHistory {
  id: string;
  orderedAt: any;
  totalPrice: number;
  totalItems: number;
  items: HistoryItem[];
  participants: string[];
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning';
}

export interface ChatMessage {
  id: string;
  userName: string;
  message: string;
  timestamp: number;
}

export interface MarblePositionData {
  id: number;
  name: string;
  x: number;
  y: number;
  angle: number;
  hue: number;
}

export interface RouletteGameState {
  status: 'idle' | 'waiting' | 'ready' | 'playing' | 'finished';
  participants: string[];
  seed: number;
  startedAt?: any;
  winner?: string;
  finishOrder?: string[];
  chatMessages?: ChatMessage[];
  hostName?: string;
  marblePositions?: MarblePositionData[];
}

export interface RouletteHistory {
  id: string;
  playedAt: any;
  winner: string;
  participants: string[];
  orderItems: HistoryItem[];
  totalPrice: number;
  paid?: boolean;
}