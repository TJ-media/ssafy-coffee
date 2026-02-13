import { CartItem, GroupedCartItem, HistoryItem } from '../../../shared/types';

// 장바구니를 그룹화하는 함수
export const groupCartItems = (cart: CartItem[]): GroupedCartItem[] => {
    const grouped: { [key: string]: GroupedCartItem } = {};

    cart.forEach((item) => {
        const key = `${item.menuName}-${item.option}`;
        if (grouped[key]) {
            grouped[key].count += 1;
            if (!grouped[key].names.includes(item.userName)) {
                grouped[key].names.push(item.userName);
            }
        } else {
            grouped[key] = {
                menuName: item.menuName,
                option: item.option,
                price: item.price,
                count: 1,
                names: [item.userName],
            };
        }
    });

    return Object.values(grouped);
};

// 히스토리용 아이템 변환
export const cartToHistoryItems = (cart: CartItem[]): HistoryItem[] => {
    const grouped = groupCartItems(cart);
    return grouped.map((item) => ({
        menuName: item.menuName,
        option: item.option,
        price: item.price,
        count: item.count,
        orderedBy: item.names,
    }));
};