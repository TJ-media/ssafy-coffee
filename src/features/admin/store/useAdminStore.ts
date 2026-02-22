import { create } from 'zustand';
import {
    sendGlobalNotice,
    fetchSystemStats,
    fetchOldGroups,
    fetchAllGroups,
    deleteGroup,
    fetchSuperAdminPassword,
    updateSuperAdminPassword,
    SystemStats,
    GroupInfo,
} from '../api/adminApi';
import { ToastMessage } from '../../../shared/types';

const SESSION_KEY = 'nugu_super_admin_auth';

interface AdminState {
    // ─── 인증 상태 ───
    isAuthenticated: boolean;
    isCheckingAuth: boolean;
    passwordInput: string;
    showPassword: boolean;
    loginError: string;
    isLoggingIn: boolean;

    // ─── 비밀번호 변경 상태 ───
    showPasswordChange: boolean;
    currentPwInput: string;
    newPwInput: string;
    newPwConfirm: string;
    isChangingPw: boolean;

    // ─── 탭/UI 상태 ───
    activeTab: 'notice' | 'stats' | 'cleanup' | 'menu';
    toasts: ToastMessage[];

    // ─── 공지사항 탭 상태 ───
    noticeMessage: string;
    isSending: boolean;

    // ─── 통계 탭 상태 ───
    stats: SystemStats | null;
    isLoadingStats: boolean;
    expandedStatCard: 'all' | 'active' | 'participants' | 'orders' | null;

    // ─── 방 청소 탭 상태 ───
    oldGroups: GroupInfo[];
    allGroups: GroupInfo[];
    isLoadingGroups: boolean;
    deletingIds: Set<string>;
}

interface AdminActions {
    // ─── 인증 액션 ───
    setPasswordInput: (value: string) => void;
    setShowPassword: (value: boolean) => void;
    setLoginError: (value: string) => void;
    handleLogin: (e: React.FormEvent) => Promise<void>;
    handleLogout: () => void;
    checkSession: () => void;

    // ─── 비밀번호 변경 액션 ───
    setShowPasswordChange: (value: boolean) => void;
    setCurrentPwInput: (value: string) => void;
    setNewPwInput: (value: string) => void;
    setNewPwConfirm: (value: string) => void;
    handleChangePassword: () => Promise<void>;
    resetPasswordChangeForm: () => void;

    // ─── 탭/UI 액션 ───
    setActiveTab: (tab: AdminState['activeTab']) => void;
    addToast: (message: string, type?: ToastMessage['type']) => void;
    removeToast: (id: string) => void;

    // ─── 공지사항 액션 ───
    setNoticeMessage: (value: string) => void;
    handleSendNotice: () => Promise<void>;

    // ─── 통계 액션 ───
    setExpandedStatCard: (card: AdminState['expandedStatCard']) => void;
    loadStats: () => Promise<void>;

    // ─── 방 청소 액션 ───
    loadOldGroups: () => Promise<void>;
    handleDeleteGroup: (groupId: string) => Promise<void>;
    handleDeleteAllOld: () => Promise<void>;
}

export const useAdminStore = create<AdminState & AdminActions>((set, get) => ({
    // ═══════════════════════════════════════════
    // ─── 초기 상태 ───
    // ═══════════════════════════════════════════

    // 인증
    isAuthenticated: false,
    isCheckingAuth: true,
    passwordInput: '',
    showPassword: false,
    loginError: '',
    isLoggingIn: false,

    // 비밀번호 변경
    showPasswordChange: false,
    currentPwInput: '',
    newPwInput: '',
    newPwConfirm: '',
    isChangingPw: false,

    // 탭/UI
    activeTab: 'notice',
    toasts: [],

    // 공지사항
    noticeMessage: '',
    isSending: false,

    // 통계
    stats: null,
    isLoadingStats: false,
    expandedStatCard: null,

    // 방 청소
    oldGroups: [],
    allGroups: [],
    isLoadingGroups: false,
    deletingIds: new Set(),

    // ═══════════════════════════════════════════
    // ─── 인증 액션 ───
    // ═══════════════════════════════════════════

    setPasswordInput: (value) => {
        set({ passwordInput: value, loginError: '' });
    },

    setShowPassword: (value) => set({ showPassword: value }),

    setLoginError: (value) => set({ loginError: value }),

    checkSession: () => {
        const sessionAuth = sessionStorage.getItem(SESSION_KEY);
        if (sessionAuth === 'true') {
            set({ isAuthenticated: true });
        }
        set({ isCheckingAuth: false });
    },

    handleLogin: async (e) => {
        e.preventDefault();
        const { passwordInput } = get();
        if (!passwordInput.trim()) {
            set({ loginError: '비밀번호를 입력해주세요.' });
            return;
        }

        set({ isLoggingIn: true, loginError: '' });

        try {
            const correctPassword = await fetchSuperAdminPassword();
            if (passwordInput === correctPassword) {
                set({ isAuthenticated: true });
                sessionStorage.setItem(SESSION_KEY, 'true');
            } else {
                set({ loginError: '비밀번호가 일치하지 않습니다.', passwordInput: '' });
            }
        } catch (err) {
            console.error('로그인 실패:', err);
            set({ loginError: '서버 연결에 실패했습니다. 다시 시도해주세요.' });
        } finally {
            set({ isLoggingIn: false });
        }
    },

    handleLogout: () => {
        sessionStorage.removeItem(SESSION_KEY);
        set({ isAuthenticated: false, passwordInput: '' });
    },

    // ═══════════════════════════════════════════
    // ─── 비밀번호 변경 액션 ───
    // ═══════════════════════════════════════════

    setShowPasswordChange: (value) => set({ showPasswordChange: value }),
    setCurrentPwInput: (value) => set({ currentPwInput: value }),
    setNewPwInput: (value) => set({ newPwInput: value }),
    setNewPwConfirm: (value) => set({ newPwConfirm: value }),

    resetPasswordChangeForm: () => {
        set({
            showPasswordChange: false,
            currentPwInput: '',
            newPwInput: '',
            newPwConfirm: '',
        });
    },

    handleChangePassword: async () => {
        const { currentPwInput, newPwInput, newPwConfirm, addToast } = get();

        if (!currentPwInput || !newPwInput || !newPwConfirm) {
            addToast('모든 항목을 입력해주세요.', 'warning');
            return;
        }
        if (newPwInput !== newPwConfirm) {
            addToast('새 비밀번호가 일치하지 않습니다.', 'warning');
            return;
        }
        if (newPwInput.length < 4) {
            addToast('비밀번호는 4자리 이상이어야 합니다.', 'warning');
            return;
        }

        set({ isChangingPw: true });
        try {
            const correctPassword = await fetchSuperAdminPassword();
            if (currentPwInput !== correctPassword) {
                addToast('현재 비밀번호가 일치하지 않습니다.', 'warning');
                return;
            }

            await updateSuperAdminPassword(newPwInput);
            addToast('비밀번호가 변경되었습니다!', 'success');
            get().resetPasswordChangeForm();
        } catch (err) {
            console.error('비밀번호 변경 실패:', err);
            addToast('비밀번호 변경에 실패했습니다.', 'warning');
        } finally {
            set({ isChangingPw: false });
        }
    },

    // ═══════════════════════════════════════════
    // ─── 탭/UI 액션 ───
    // ═══════════════════════════════════════════

    setActiveTab: (tab) => set({ activeTab: tab }),

    addToast: (message, type = 'info') => {
        const id = `toast-${Date.now()}-${Math.random()}`;
        set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    },

    removeToast: (id) => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    },

    // ═══════════════════════════════════════════
    // ─── 공지사항 액션 ───
    // ═══════════════════════════════════════════

    setNoticeMessage: (value) => set({ noticeMessage: value }),

    handleSendNotice: async () => {
        const { noticeMessage, addToast } = get();
        if (!noticeMessage.trim()) {
            addToast('공지 내용을 입력해주세요.', 'warning');
            return;
        }
        set({ isSending: true });
        try {
            await sendGlobalNotice(noticeMessage.trim());
            addToast('긴급 공지가 전송되었습니다!', 'success');
            set({ noticeMessage: '' });
        } catch (err) {
            console.error('공지 전송 실패:', err);
            addToast('공지 전송에 실패했습니다.', 'warning');
        } finally {
            set({ isSending: false });
        }
    },

    // ═══════════════════════════════════════════
    // ─── 통계 액션 ───
    // ═══════════════════════════════════════════

    setExpandedStatCard: (card) => set({ expandedStatCard: card }),

    loadStats: async () => {
        set({ isLoadingStats: true });
        try {
            const result = await fetchSystemStats();
            set({ stats: result });
        } catch (err) {
            console.error('통계 로드 실패:', err);
            get().addToast('통계를 불러오는데 실패했습니다.', 'warning');
        } finally {
            set({ isLoadingStats: false });
        }
    },

    // ═══════════════════════════════════════════
    // ─── 방 청소 액션 ───
    // ═══════════════════════════════════════════

    loadOldGroups: async () => {
        set({ isLoadingGroups: true });
        try {
            const [old, all] = await Promise.all([fetchOldGroups(), fetchAllGroups()]);
            set({ oldGroups: old, allGroups: all });
        } catch (err) {
            console.error('그룹 목록 로드 실패:', err);
            get().addToast('그룹 목록을 불러오는데 실패했습니다.', 'warning');
        } finally {
            set({ isLoadingGroups: false });
        }
    },

    handleDeleteGroup: async (groupId) => {
        if (!confirm(`정말 "${groupId}" 그룹을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return;

        set((state) => {
            const newIds = new Set(state.deletingIds);
            newIds.add(groupId);
            return { deletingIds: newIds };
        });

        try {
            await deleteGroup(groupId);
            set((state) => ({
                oldGroups: state.oldGroups.filter((g) => g.id !== groupId),
                allGroups: state.allGroups.filter((g) => g.id !== groupId),
            }));
            get().addToast(`"${groupId}" 그룹이 삭제되었습니다.`, 'success');
        } catch (err) {
            console.error('그룹 삭제 실패:', err);
            get().addToast('그룹 삭제에 실패했습니다.', 'warning');
        } finally {
            set((state) => {
                const newIds = new Set(state.deletingIds);
                newIds.delete(groupId);
                return { deletingIds: newIds };
            });
        }
    },

    handleDeleteAllOld: async () => {
        const { oldGroups, addToast, loadOldGroups } = get();
        if (oldGroups.length === 0) {
            addToast('삭제할 그룹이 없습니다.', 'warning');
            return;
        }
        if (!confirm(`7일 이상 된 ${oldGroups.length}개의 그룹을 모두 삭제하시겠습니까?`)) return;

        for (const group of oldGroups) {
            set((state) => {
                const newIds = new Set(state.deletingIds);
                newIds.add(group.id);
                return { deletingIds: newIds };
            });
            try {
                await deleteGroup(group.id);
            } catch (err) {
                console.error(`그룹 ${group.id} 삭제 실패:`, err);
            }
        }
        addToast(`${oldGroups.length}개 그룹이 삭제되었습니다.`, 'success');
        await loadOldGroups();
        set({ deletingIds: new Set() });
    },
}));
