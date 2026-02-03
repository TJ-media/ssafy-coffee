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
  rouletteGame?: RouletteGameState;
  rouletteHistory?: RouletteHistory[];
  marbleCounts?: { [userName: string]: number }; // 사용자별 공 개수 (가중치)
  approvedUsers?: string[]; // 승인된 사용자 목록
  pendingUsers?: string[]; // 승인 대기 중인 사용자 목록
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

// 핀볼 채팅 메시지
export interface PinballChatMessage {
  id: string;
  userName: string;
  message: string;
  timestamp: number;
}

// 핀볼 게임 상태
export interface PinballGameState {
  status: 'idle' | 'waiting' | 'ready' | 'playing' | 'finished';
  participants: string[];
  seed: number;
  startedAt?: any;
  winner?: string;
  finishOrder?: string[];
  chatMessages?: PinballChatMessage[];
  hostName?: string; // 게임을 시작한 사람 (시작 버튼 권한)
}

// 마블 위치 데이터
export interface MarblePositionData {
  id: number;
  name: string;
  x: number;
  y: number;
  angle: number;
  hue: number;
}

// 룰렛 게임 상태
export interface RouletteGameState {
  status: 'idle' | 'waiting' | 'ready' | 'playing' | 'finished';
  participants: string[];
  seed: number;
  startedAt?: any;
  winner?: string;
  finishOrder?: string[];
  chatMessages?: PinballChatMessage[];
  hostName?: string;
  marblePositions?: MarblePositionData[]; // 호스트가 브로드캐스트하는 마블 위치
}

// 룰렛 히스토리
export interface RouletteHistory {
  id: string;
  playedAt: any;
  winner: string; // 커피 사야하는 사람
  participants: string[];
  orderItems: HistoryItem[]; // 주문 목록
  totalPrice: number;
  paid?: boolean; // 결제 완료 여부
}