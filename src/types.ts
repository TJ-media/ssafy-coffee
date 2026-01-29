export type OptionType = 'ICE' | 'HOT' | 'ONLY';

export interface Menu {
  id: number;
  categoryUpper: string; // 대분류 (커피, 음료 등)
  categoryLower: string; // 소분류 (에스프레소, 라떼 등)
  name: string;
  price: number;
  img: string;
  hasOption: boolean;
}

export interface CartItem {
  id: number;
  userName: string;
  menuName: string;
  price: number;
  option: OptionType;
  category: string; // CartItem은 단순하게 유지
}

export interface GroupData {
  password?: string;
  createdAt?: any;
  cart: CartItem[];
  selectedCafe: string;
  history?: OrderHistory[];
  pinballGame?: PinballGameState;
}

export interface GroupedCartItem {
  count: number;
  names: string[];
  price: number;
  menuName: string;
  option: OptionType;
}

// 즐겨찾기 아이템
export interface FavoriteItem {
  menuId: number;
  menuName: string;
  addedAt: number;
}

// 주문 히스토리 개별 아이템
export interface HistoryItem {
  menuName: string;
  option: OptionType;
  price: number;
  count: number;
  orderedBy: string[];
}

// 주문 히스토리
export interface OrderHistory {
  id: string;
  orderedAt: any;
  totalPrice: number;
  totalItems: number;
  items: HistoryItem[];
  participants: string[];
}

// 토스트 메시지
export interface ToastMessage {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning';
}

// 핀볼 게임 상태
export interface PinballGameState {
  status: 'idle' | 'ready' | 'playing' | 'finished';
  participants: string[];
  seed: number;
  startedAt?: any;
  winner?: string;
  finishOrder?: string[];
}