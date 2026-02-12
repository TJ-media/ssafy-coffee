import { db } from '../../../firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { CartItem, OrderHistory } from '../../../shared/types';

const getGroupRef = (groupId: string) => doc(db, 'groups', groupId);

export const addToCartApi = async (groupId: string, item: CartItem) => {
    await updateDoc(getGroupRef(groupId), {
        cart: arrayUnion(item)
    });
};

export const updateCartApi = async (groupId: string, newCart: CartItem[]) => {
    await updateDoc(getGroupRef(groupId), { cart: newCart });
};

export const updateHistoryApi = async (
    groupId: string,
    historyList: OrderHistory[] | any[],
    type: 'normal' | 'roulette'
) => {
    const field = type === 'normal' ? 'history' : 'rouletteHistory';
    await updateDoc(getGroupRef(groupId), {
        [field]: historyList
    });
};

export const checkoutApi = async (groupId: string, newHistory: OrderHistory) => {
    await updateDoc(getGroupRef(groupId), {
        cart: [],
        history: arrayUnion(newHistory)
    });
};

// 👇 [추가] 룰렛 게임 초기화 (대기방 폭파)
export const resetRouletteGameApi = async (groupId: string) => {
    await updateDoc(getGroupRef(groupId), {
        rouletteGame: { status: 'idle', participants: [], seed: 0, chatMessages: [] }
    });
};