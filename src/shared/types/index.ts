export type OptionType = 'ICE' | 'HOT' | 'ONLY';
export type CupSize = 'Short' | 'Tall' | 'Grande' | 'Venti' | '7oz' | '500ml' | 'Trenta';

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
  sizes?: string[]; // 스타벅스 메뉴별 가용 사이즈 (예: ['Short', 'Tall', 'Grande', 'Venti'])
  options?: string[]; // 해당 메뉴에 적용 가능한 추가 옵션 카테고리 목록 (바나프레소 등)
  optionsIce?: string[]; // ICE 선택 시 적용 가능한 추가 옵션 (바나프레소)
  optionsHot?: string[]; // HOT 선택 시 적용 가능한 추가 옵션 (바나프레소)
  takeoutPrice?: number; // 테이크아웃 ICE 가격이 다를 경우 (바나프레소)
  takeoutHotPrice?: number; // 테이크아웃 HOT 가격이 다를 경우 (바나프레소)
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
  cafeName?: string;
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
  cafeName?: string;
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