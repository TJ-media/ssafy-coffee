export type OptionType = 'ICE' | 'HOT' | 'ONLY';
export type CupSize = 'Short' | 'Tall' | 'Grande' | 'Venti';

export interface Menu {
  id: number;
  categoryUpper: string;
  categoryLower: string;
  name: string;
  price: number;
  hotPrice?: number; // HOT 가격이 다를 경우에만 설정 (없으면 price와 동일)
  img: string;
  hasOption: boolean;
  defaultOption?: OptionType; // 커스텀 메뉴의 기본 옵션 저장 (ICE/HOT)
}

export interface CartItem {
  id: number;
  userName: string;
  menuName: string;
  price: number;
  option: OptionType;
  category: string;
  cupSize?: CupSize; // 스타벅스 컵 사이즈 (선택)
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
  winner?: string | null;
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

export interface MenuRequest {
  id: string;
  menuName: string;
  price: number;
  optionType: 'both' | 'ice' | 'hot' | 'unknown';
  requesterName: string;
  groupId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
  resolvedAt?: any;
}