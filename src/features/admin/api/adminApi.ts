import { collection, doc, getDocs, setDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { GroupData } from '../../../shared/types';

// ─── 공지사항 전송 ───
export const sendGlobalNotice = async (message: string) => {
    const noticeRef = doc(db, 'system', 'notice');
    await setDoc(noticeRef, {
        message,
        sentAt: Timestamp.now(),
    });
};

// ─── 모든 그룹 조회 ───
export interface GroupInfo {
    id: string;
    data: GroupData;
}

export const fetchAllGroups = async (): Promise<GroupInfo[]> => {
    const groupsCol = collection(db, 'groups');
    const snapshot = await getDocs(groupsCol);
    return snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        data: docSnap.data() as GroupData,
    }));
};

// ─── 시스템 통계 조회 ───
export interface SystemStats {
    totalGroups: number;
    todayTotalOrderAmount: number;
    activeGroups: number;       // 장바구니에 아이템이 있는 그룹
    totalParticipants: number;  // 전체 승인된 유저 수 합산
}

export const fetchSystemStats = async (): Promise<SystemStats> => {
    const groups = await fetchAllGroups();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let todayTotalOrderAmount = 0;
    let activeGroups = 0;
    let totalParticipants = 0;

    groups.forEach(({ data }) => {
        // 활성 그룹: 장바구니에 아이템이 있거나 승인된 유저가 있는 경우
        if (data.cart && data.cart.length > 0) {
            activeGroups++;
        }

        // 승인된 유저 수 합산
        if (data.approvedUsers) {
            totalParticipants += data.approvedUsers.length;
        }

        // 오늘 주문 내역의 금액 합산
        if (data.history) {
            data.history.forEach((order) => {
                const orderedAt = order.orderedAt;
                let orderDate: Date | null = null;

                if (orderedAt && orderedAt.toDate) {
                    // Firestore Timestamp
                    orderDate = orderedAt.toDate();
                } else if (orderedAt && orderedAt.seconds) {
                    orderDate = new Date(orderedAt.seconds * 1000);
                } else if (orderedAt instanceof Date) {
                    orderDate = orderedAt;
                } else if (typeof orderedAt === 'number') {
                    orderDate = new Date(orderedAt);
                }

                if (orderDate && orderDate >= todayStart) {
                    todayTotalOrderAmount += order.totalPrice || 0;
                }
            });
        }
    });

    return {
        totalGroups: groups.length,
        todayTotalOrderAmount,
        activeGroups,
        totalParticipants,
    };
};

// ─── 7일 이상 지난 그룹 조회 ───
export const fetchOldGroups = async (): Promise<GroupInfo[]> => {
    const groups = await fetchAllGroups();
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return groups.filter(({ data }) => {
        if (!data.createdAt) return false;

        let createdDate: Date | null = null;
        if (data.createdAt.toDate) {
            createdDate = data.createdAt.toDate();
        } else if (data.createdAt.seconds) {
            createdDate = new Date(data.createdAt.seconds * 1000);
        } else if (data.createdAt instanceof Date) {
            createdDate = data.createdAt;
        } else if (typeof data.createdAt === 'string') {
            createdDate = new Date(data.createdAt);
        }

        return createdDate && createdDate < sevenDaysAgo;
    });
};

// ─── 그룹 삭제 ───
export const deleteGroup = async (groupId: string) => {
    const groupRef = doc(db, 'groups', groupId);
    await deleteDoc(groupRef);
};
