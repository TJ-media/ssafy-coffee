/**
 * Firestore 메뉴 신청 API
 * menuRequests 컬렉션을 관리합니다.
 */
import { collection, addDoc, doc, deleteDoc, updateDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { MenuRequest } from '../../../shared/types';

const COLLECTION_NAME = 'menuRequests';

/**
 * 메뉴 신청 제출 (사용자)
 */
export const submitMenuRequest = async (
    menuName: string,
    price: number,
    optionType: 'both' | 'ice' | 'hot' | 'unknown',
    requesterName: string,
    groupId: string,
): Promise<void> => {
    await addDoc(collection(db, COLLECTION_NAME), {
        menuName,
        price,
        optionType,
        requesterName,
        groupId,
        status: 'pending',
        createdAt: serverTimestamp(),
    });
};

/**
 * 메뉴 신청 목록 실시간 구독 (관리자용)
 */
export const subscribeMenuRequests = (
    callback: (requests: MenuRequest[]) => void
): (() => void) => {
    const q = query(
        collection(db, COLLECTION_NAME),
        orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
        const requests: MenuRequest[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        } as MenuRequest));
        callback(requests);
    });
};

/**
 * 메뉴 신청 수락 (관리자)
 */
export const approveMenuRequest = async (requestId: string): Promise<void> => {
    await updateDoc(doc(db, COLLECTION_NAME, requestId), {
        status: 'approved',
        resolvedAt: serverTimestamp(),
    });
};

/**
 * 메뉴 신청 삭제 (관리자)
 */
export const deleteMenuRequest = async (requestId: string): Promise<void> => {
    await deleteDoc(doc(db, COLLECTION_NAME, requestId));
};
