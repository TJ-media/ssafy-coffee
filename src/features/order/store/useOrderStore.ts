import { create } from 'zustand';
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from '../../../firebase';
import { CartItem, GroupData, OrderHistory, HistoryItem, RouletteGameState, RouletteHistory, ToastMessage, Menu, OptionType } from '../../../shared/types';
import { getFavorites, addFavorite, removeFavorite, isFavorite } from '../../../shared/utils';
import { addToCartApi, resetRouletteGameApi, updateHistoryApi, startRouletteGameApi, updateCustomMenusApi } from '../api/firebaseApi';

interface EditingHistoryInfo {
    id: string;
    type: 'normal' | 'roulette';
    count: number;
    animationKey: number;
}

interface OrderState {
    // ─── 데이터 상태 ───
    groupId: string | null;
    userName: string;
    cart: CartItem[];
    totalPrice: number;
    history: OrderHistory[];
    rouletteHistory: RouletteHistory[];
    rouletteGame: RouletteGameState | undefined;
    marbleCounts: { [userName: string]: number };
    password: string;
    selectedCafe: string;

    // ─── 커스텀 메뉴 상태 ───
    allCustomMenus: { [key: string]: Menu[] };
    myCustomMenus: Menu[];

    // ─── UI 상태 ───
    toasts: ToastMessage[];
    isCartOpen: boolean;
    isHistoryOpen: boolean;
    isResultDismissed: boolean;
    editingHistoryInfo: EditingHistoryInfo | null;
    favoriteMenuIds: number[];
    isRouletteModalOpen: boolean;

    // ─── 내부 상태 (이전 카트 참조용) ───
    _prevCart: CartItem[];
    _unsubscribe: Unsubscribe | null;
}

interface OrderActions {
    // ─── 초기화 / 구독 ───
    initializeStore: (navigate: (path: string) => void) => void;
    cleanup: () => void;

    // ─── UI 액션 ───
    setIsCartOpen: (value: boolean) => void;
    setIsHistoryOpen: (value: boolean) => void;
    setEditingHistoryInfo: (info: EditingHistoryInfo | null) => void;

    // ─── Toast 액션 ───
    addToast: (message: string, type?: 'info' | 'success' | 'warning') => void;
    removeToast: (id: string) => void;

    // ─── 즐겨찾기 액션 ───
    toggleFavoriteHandler: (menu: Menu) => void;

    // ─── 커스텀 메뉴 액션 ───
    saveCustomMenuHandler: (menu: Menu) => Promise<void>;
    deleteCustomMenuHandler: (menuId: number) => Promise<void>;

    // ─── 장바구니 액션 ───
    addToCartHandler: (menuName: string, price: number, option: OptionType, category?: string) => Promise<void>;

    // ─── 룰렛 액션 ───
    handleCloseRoulette: () => void;
    handleStartRoulette: () => Promise<void>;
}

export const useOrderStore = create<OrderState & OrderActions>((set, get) => ({
    // ═══════════════════════════════════════════
    // ─── 초기 상태 ───
    // ═══════════════════════════════════════════

    // 데이터
    groupId: localStorage.getItem('ssafy_groupId'),
    userName: localStorage.getItem('ssafy_userName') || '익명',
    cart: [],
    totalPrice: 0,
    history: [],
    rouletteHistory: [],
    rouletteGame: undefined,
    marbleCounts: {},
    password: '',
    selectedCafe: 'mega',

    // 커스텀 메뉴
    allCustomMenus: {},
    myCustomMenus: [],

    // UI
    toasts: [],
    isCartOpen: true,
    isHistoryOpen: false,
    isResultDismissed: false,
    editingHistoryInfo: null,
    favoriteMenuIds: getFavorites().map(f => f.menuId),
    isRouletteModalOpen: false,

    // 내부
    _prevCart: [],
    _unsubscribe: null,

    // ═══════════════════════════════════════════
    // ─── 초기화 / 구독 ───
    // ═══════════════════════════════════════════

    initializeStore: (navigate) => {
        // 스토어 초기값이 아닌 localStorage에서 최신 값을 읽어옴
        const groupId = localStorage.getItem('ssafy_groupId');
        const userName = localStorage.getItem('ssafy_userName') || '익명';

        // 스토어 상태를 최신 값으로 업데이트
        set({ groupId, userName });

        if (!groupId) {
            navigate('/');
            return;
        }

        const unsub = onSnapshot(doc(db, 'groups', groupId), (docSnapshot) => {
            if (docSnapshot.exists()) {
                const data = docSnapshot.data() as GroupData;
                const currentCart = data.cart || [];
                const prevCart = get()._prevCart;
                const currentUserName = get().userName;

                // 다른 사용자가 카트에 추가했을 때 알림
                if (prevCart.length > 0 && currentCart.length > prevCart.length) {
                    const prevIds = new Set(prevCart.map(item => item.id));
                    const newItems = currentCart.filter(item => !prevIds.has(item.id));
                    newItems.forEach(item => {
                        if (item.userName !== currentUserName) {
                            get().addToast(`${item.userName}님이 ${item.menuName} 추가!`);
                        }
                    });
                }

                const loadedCustomMenus = data.customMenus || {};
                const status = data.rouletteGame?.status || 'idle';

                // editingHistoryInfo 업데이트
                const currentEditingInfo = get().editingHistoryInfo;
                let updatedEditingInfo = currentEditingInfo;
                if (currentEditingInfo) {
                    const isNormal = currentEditingInfo.type === 'normal';
                    const targetList = isNormal ? (data.history || []) : (data.rouletteHistory || []);
                    const targetObj = targetList.find(h => h.id === currentEditingInfo.id);
                    if (targetObj) {
                        // @ts-ignore
                        const items = isNormal ? targetObj.items : targetObj.orderItems;
                        const count = items ? items.reduce((sum: number, i: HistoryItem) => sum + i.count, 0) : 0;
                        updatedEditingInfo = { ...currentEditingInfo, count };
                    }
                }

                const isResultDismissed = get().isResultDismissed;
                const rouletteGame = data.rouletteGame;
                const isRouletteModalOpen = !!rouletteGame
                    && rouletteGame.status !== 'idle'
                    && !(rouletteGame.status === 'finished' && isResultDismissed);

                set({
                    cart: currentCart,
                    totalPrice: currentCart.reduce((sum, item) => sum + item.price, 0),
                    history: data.history || [],
                    rouletteHistory: data.rouletteHistory || [],
                    rouletteGame: data.rouletteGame,
                    marbleCounts: data.marbleCounts || {},
                    password: data.password || '',
                    selectedCafe: data.selectedCafe || 'mega',
                    allCustomMenus: loadedCustomMenus,
                    myCustomMenus: loadedCustomMenus[currentUserName] || [],
                    _prevCart: currentCart,
                    editingHistoryInfo: updatedEditingInfo,
                    isResultDismissed: (status === 'waiting' || status === 'ready' || status === 'playing')
                        ? false
                        : get().isResultDismissed,
                    isRouletteModalOpen,
                });
            } else {
                alert('모임이 종료되었습니다.');
                navigate('/');
            }
        });

        set({ _unsubscribe: unsub });
    },

    cleanup: () => {
        const { _unsubscribe } = get();
        if (_unsubscribe) {
            _unsubscribe();
            set({ _unsubscribe: null });
        }
    },

    // ═══════════════════════════════════════════
    // ─── UI 액션 ───
    // ═══════════════════════════════════════════

    setIsCartOpen: (value) => set({ isCartOpen: value }),
    setIsHistoryOpen: (value) => set({ isHistoryOpen: value }),
    setEditingHistoryInfo: (info) => set({ editingHistoryInfo: info }),

    // ═══════════════════════════════════════════
    // ─── Toast 액션 ───
    // ═══════════════════════════════════════════

    addToast: (message, type = 'info') => {
        set((state) => ({
            toasts: [...state.toasts, { id: Math.random().toString(), message, type }]
        }));
    },

    removeToast: (id) => {
        set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) }));
    },

    // ═══════════════════════════════════════════
    // ─── 즐겨찾기 액션 ───
    // ═══════════════════════════════════════════

    toggleFavoriteHandler: (menu) => {
        if (isFavorite(menu.id)) {
            removeFavorite(menu.id);
            set((state) => ({
                favoriteMenuIds: state.favoriteMenuIds.filter(id => id !== menu.id)
            }));
        } else {
            addFavorite(menu.id, menu.name);
            set((state) => ({
                favoriteMenuIds: [...state.favoriteMenuIds, menu.id]
            }));
            get().addToast('즐겨찾기 추가 완료', 'success');
        }
    },

    // ═══════════════════════════════════════════
    // ─── 커스텀 메뉴 액션 ───
    // ═══════════════════════════════════════════

    saveCustomMenuHandler: async (menu) => {
        const { groupId, userName, myCustomMenus, allCustomMenus, addToast } = get();
        if (!groupId) return;

        const newMyList = [menu, ...myCustomMenus.filter(m => m.name !== menu.name)].slice(0, 10);
        const newAllMenus = { ...allCustomMenus, [userName]: newMyList };

        try {
            await updateCustomMenusApi(groupId, newAllMenus);
            addToast('메뉴가 기록에 저장되었습니다', 'success');
        } catch (e) {
            console.error("Failed to save custom menu", e);
            addToast('기록 저장 실패', 'warning');
        }
    },

    deleteCustomMenuHandler: async (menuId) => {
        const { groupId, userName, myCustomMenus, allCustomMenus, addToast } = get();
        if (!groupId) return;

        const newMyList = myCustomMenus.filter(m => m.id !== menuId);
        const newAllMenus = { ...allCustomMenus, [userName]: newMyList };

        try {
            await updateCustomMenusApi(groupId, newAllMenus);
        } catch (e) {
            console.error(e);
            addToast('삭제 실패', 'warning');
        }
    },

    // ═══════════════════════════════════════════
    // ─── 장바구니 액션 ───
    // ═══════════════════════════════════════════

    addToCartHandler: async (menuName, price, option, category = '') => {
        const { groupId, userName, editingHistoryInfo, history, rouletteHistory, addToast } = get();
        if (!groupId) return;

        if (editingHistoryInfo) {
            const isNormal = editingHistoryInfo.type === 'normal';
            const targetList = isNormal ? [...history] : [...rouletteHistory];
            const targetIndex = targetList.findIndex(h => h.id === editingHistoryInfo.id);

            if (targetIndex === -1) {
                addToast('해당 주문 내역을 찾을 수 없습니다.', 'warning');
                return;
            }

            const targetHistory = { ...targetList[targetIndex] };
            // @ts-ignore
            const items = isNormal ? [...targetHistory.items] : [...targetHistory.orderItems];
            const existingItemIndex = items.findIndex((i: HistoryItem) => i.menuName === menuName && i.option === option);

            if (existingItemIndex !== -1) {
                const existingItem = { ...items[existingItemIndex] };
                existingItem.count += 1;
                existingItem.orderedBy = [...existingItem.orderedBy, userName];
                items[existingItemIndex] = existingItem;
            } else {
                items.push({
                    menuName,
                    option,
                    price,
                    count: 1,
                    orderedBy: [userName]
                });
            }

            targetHistory.totalPrice += price;
            // @ts-ignore
            if (targetHistory.totalItems !== undefined) targetHistory.totalItems += 1;
            // @ts-ignore
            if (isNormal) targetHistory.items = items; else targetHistory.orderItems = items;

            targetList[targetIndex] = targetHistory;
            await updateHistoryApi(groupId, targetList, editingHistoryInfo.type);
            addToast('주문 내역에 추가되었습니다.', 'success');
            return;
        }

        const newItem: CartItem = {
            id: Date.now(),
            userName,
            menuName,
            price,
            option,
            category,
        };
        await addToCartApi(groupId, newItem);
    },

    // ═══════════════════════════════════════════
    // ─── 룰렛 액션 ───
    // ═══════════════════════════════════════════

    handleCloseRoulette: () => {
        const { rouletteGame, groupId } = get();
        set({ isResultDismissed: true, isRouletteModalOpen: false });
        if (rouletteGame?.status === 'waiting' && groupId) {
            resetRouletteGameApi(groupId).catch(e => console.error("게임 초기화 실패:", e));
        }
    },

    handleStartRoulette: async () => {
        const { cart, groupId, userName, addToast } = get();
        const participants = [...new Set(cart.map(item => item.userName))];
        if (participants.length < 2) {
            addToast('커피 내기에는 2명 이상이 필요해요!', 'warning');
            return;
        }
        if (!groupId) return;

        try {
            await startRouletteGameApi(groupId, participants, userName);
        } catch (e) {
            console.error(e);
            addToast('룰렛 시작에 실패했어요', 'warning');
        }
    },
}));
