import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../../firebase';
import { CartItem, Menu, OrderHistory, RouletteHistory } from '../../../shared/types';

export const addToCartApi = async (groupId: string, item: CartItem) => {
    const groupRef = doc(db, 'groups', groupId);
    // arrayUnion은 배열에 요소를 추가합니다.
    await updateDoc(groupRef, {
        cart: arrayUnion(item)
    });
};

export const updateCartApi = async (groupId: string, newCart: CartItem[]) => {
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
        cart: newCart
    });
};

export const updateHistoryApi = async (groupId: string, newHistory: OrderHistory[] | RouletteHistory[], type: 'normal' | 'roulette') => {
    const groupRef = doc(db, 'groups', groupId);
    if (type === 'normal') {
        await updateDoc(groupRef, { history: newHistory });
    } else {
        await updateDoc(groupRef, { rouletteHistory: newHistory });
    }
};

export const startRouletteGameApi = async (groupId: string, participants: string[], hostName: string) => {
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
        rouletteGame: {
            status: 'waiting',
            participants,
            seed: Math.random(),
            startedAt: Date.now(),
            chatMessages: [],
            hostName
        },
        // 게임 시작 시 해당 유저들의 구슬 카운트 초기화 (없으면 0)
        marbleCounts: {}
    });
};

export const resetRouletteGameApi = async (groupId: string) => {
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
        'rouletteGame.status': 'idle',
        'rouletteGame.participants': [],
        'rouletteGame.winner': null
    });
};

// 👇 추가: 커스텀 메뉴 업데이트 API
export const updateCustomMenusApi = async (groupId: string, customMenus: { [userName: string]: Menu[] }) => {
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, { customMenus });
};