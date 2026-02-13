import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../../firebase';
import { RouletteHistory } from '../../../shared/types';

export const startRouletteGame = async (groupId: string) => {
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
        'rouletteGame.status': 'ready',
    });
};

export const setGamePlaying = async (groupId: string) => {
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
        'rouletteGame.status': 'playing',
    });
};

export const shuffleParticipants = async (groupId: string, participants: string[]) => {
    const shuffled = [...participants];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
        'rouletteGame.participants': shuffled,
        'rouletteGame.seed': Date.now(),
    });
};

export const finishGame = async (groupId: string, winnerName: string) => {
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
        'rouletteGame.status': 'finished',
        'rouletteGame.winner': winnerName,
    });
};

export const saveRouletteHistory = async (
    groupId: string,
    historyItem: RouletteHistory,
    newMarbleCounts: { [userName: string]: number }
) => {
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
        rouletteHistory: arrayUnion(historyItem),
        cart: [], // 장바구니 비우기
        marbleCounts: newMarbleCounts, // 공 개수 업데이트
    });
};