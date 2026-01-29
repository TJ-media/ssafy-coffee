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
}

export interface GroupedCartItem {
  count: number;
  names: string[];
  price: number;
  menuName: string;
  option: OptionType;
}