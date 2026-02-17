import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { GroupData } from '../../../shared/types';

// ─── 슈퍼관리자 초기 비밀번호 ───
const DEFAULT_SUPER_ADMIN_PASSWORD = '0000';

/* 
 * 슈퍼관리자 비밀번호 조회
 * - system/config 문서가 없으면 기본 비밀번호('0000')로 자동 생성
 */
export const fetchSuperAdminPassword = async (): Promise<string> => {
    const configRef = doc(db, 'system', 'config');
    const configSnap = await getDoc(configRef);

    if (configSnap.exists()) {
        const data = configSnap.data();
        return data.superAdminPassword || DEFAULT_SUPER_ADMIN_PASSWORD;
    }

    // 문서가 없으면 기본 비밀번호로 생성
    await setDoc(configRef, { superAdminPassword: DEFAULT_SUPER_ADMIN_PASSWORD });
    return DEFAULT_SUPER_ADMIN_PASSWORD;
};

/**
 * 슈퍼관리자 비밀번호 변경
 */
export const updateSuperAdminPassword = async (newPassword: string) => {
    const configRef = doc(db, 'system', 'config');
    await setDoc(configRef, { superAdminPassword: newPassword }, { merge: true });
};

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
export interface TodayOrderGroup {
    id: string;
    todayAmount: number;
}

export interface SystemStats {
    totalGroups: number;
    todayTotalOrderAmount: number;
    activeGroups: number;       // 장바구니에 아이템이 있는 그룹
    totalParticipants: number;  // 전체 승인된 유저 수 합산
    allGroupsList: GroupInfo[];       // 전체 그룹 목록
    activeGroupsList: GroupInfo[];    // 활성 그룹 목록 (장바구니 아이템 있는)
    participantsGroupsList: GroupInfo[]; // 승인된 사용자가 있는 그룹 목록
    todayOrderGroupsList: TodayOrderGroup[]; // 오늘 주문이 있는 그룹별 금액
}

export const fetchSystemStats = async (): Promise<SystemStats> => {
    const groups = await fetchAllGroups();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let todayTotalOrderAmount = 0;
    let activeGroups = 0;
    let totalParticipants = 0;
    const activeGroupsList: GroupInfo[] = [];
    const participantsGroupsList: GroupInfo[] = [];
    const todayOrderGroupsList: TodayOrderGroup[] = [];

    groups.forEach(({ id, data }) => {
        // 활성 그룹: 장바구니에 아이템이 있거나 승인된 유저가 있는 경우
        if (data.cart && data.cart.length > 0) {
            activeGroups++;
            activeGroupsList.push({ id, data });
        }

        // 승인된 유저 수 합산
        if (data.approvedUsers && data.approvedUsers.length > 0) {
            totalParticipants += data.approvedUsers.length;
            participantsGroupsList.push({ id, data });
        }

        // 오늘 주문 내역의 금액 합산
        let groupTodayAmount = 0;
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
                    const amount = order.totalPrice || 0;
                    todayTotalOrderAmount += amount;
                    groupTodayAmount += amount;
                }
            });
        }
        if (groupTodayAmount > 0) {
            todayOrderGroupsList.push({ id, todayAmount: groupTodayAmount });
        }
    });

    return {
        totalGroups: groups.length,
        todayTotalOrderAmount,
        activeGroups,
        totalParticipants,
        allGroupsList: groups,
        activeGroupsList,
        participantsGroupsList,
        todayOrderGroupsList,
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
