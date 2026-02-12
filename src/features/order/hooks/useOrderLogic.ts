import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase';
import { CartItem, GroupData, OrderHistory, HistoryItem, RouletteGameState, RouletteHistory, ToastMessage, Menu, OptionType } from '../../../shared/types';
import { getFavorites, addFavorite, removeFavorite, isFavorite } from '../../../shared/utils';
// 👇 [수정] startRouletteGameApi 추가 임포트
import { addToCartApi, resetRouletteGameApi, updateHistoryApi, startRouletteGameApi } from '../api/firebaseApi';

export const useOrderLogic = () => {
  const navigate = useNavigate();
  const groupId = localStorage.getItem('ssafy_groupId');
  const userName = localStorage.getItem('ssafy_userName') || '익명';

  // State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [history, setHistory] = useState<OrderHistory[]>([]);
  const [rouletteHistory, setRouletteHistory] = useState<RouletteHistory[]>([]);
  const [rouletteGame, setRouletteGame] = useState<RouletteGameState | undefined>(undefined);
  const [marbleCounts, setMarbleCounts] = useState<{ [userName: string]: number }>({});

  // UI State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isResultDismissed, setIsResultDismissed] = useState(false);

  const [editingHistoryInfo, setEditingHistoryInfo] = useState<{
    id: string; type: 'normal' | 'roulette'; count: number; animationKey: number;
  } | null>(null);

  const [favoriteMenuIds, setFavoriteMenuIds] = useState<number[]>([]);
  const prevCartRef = useRef<CartItem[]>([]);

  // 초기 로드
  useEffect(() => {
    setFavoriteMenuIds(getFavorites().map(f => f.menuId));
  }, []);

  // Firebase 구독
  useEffect(() => {
    if (!groupId) { navigate('/'); return; }

    const unsub = onSnapshot(doc(db, 'groups', groupId), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data() as GroupData;
        const currentCart = data.cart || [];

        // 알림 로직
        if (prevCartRef.current.length > 0 && currentCart.length > prevCartRef.current.length) {
          const prevIds = new Set(prevCartRef.current.map(item => item.id));
          const newItems = currentCart.filter(item => !prevIds.has(item.id));
          newItems.forEach(item => {
            if (item.userName !== userName) addToast(`${item.userName}님이 ${item.menuName} 추가!`);
          });
        }
        prevCartRef.current = currentCart;

        setCart(currentCart);
        setTotalPrice(currentCart.reduce((sum, item) => sum + item.price, 0));
        setHistory(data.history || []);
        setRouletteHistory(data.rouletteHistory || []);
        setRouletteGame(data.rouletteGame);
        setMarbleCounts(data.marbleCounts || {});

        // 새 게임이 시작되면 닫힘 상태 초기화
        const status = data.rouletteGame?.status || 'idle';
        if (status === 'waiting' || status === 'ready' || status === 'playing') {
          setIsResultDismissed(false);
        }

        // 수정 모드 동기화
        if (editingHistoryInfo) {
          const isNormal = editingHistoryInfo.type === 'normal';
          const targetList = isNormal ? (data.history || []) : (data.rouletteHistory || []);
          const targetObj = targetList.find(h => h.id === editingHistoryInfo.id);
          if (targetObj) {
            // @ts-ignore
            const items = isNormal ? targetObj.items : targetObj.orderItems;
            const count = items ? items.reduce((sum: number, i: HistoryItem) => sum + i.count, 0) : 0;
            setEditingHistoryInfo(prev => prev ? ({ ...prev, count }) : null);
          }
        }
      } else {
        alert('모임이 종료되었습니다.');
        navigate('/');
      }
    });
    return () => unsub();
  }, [groupId, userName, navigate, editingHistoryInfo?.id]);

  // Actions
  const addToast = (message: string, type: 'info'|'success'|'warning' = 'info') => {
    setToasts(prev => [...prev, { id: Math.random().toString(), message, type }]);
  };

  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  const toggleFavoriteHandler = (menu: Menu) => {
    if (isFavorite(menu.id)) {
      removeFavorite(menu.id);
      setFavoriteMenuIds(prev => prev.filter(id => id !== menu.id));
    } else {
      addFavorite(menu.id, menu.name);
      setFavoriteMenuIds(prev => [...prev, menu.id]);
      addToast('즐겨찾기 추가 완료', 'success');
    }
  };

  const addToCartHandler = async (menuName: string, price: number, option: OptionType) => {
    if (!groupId) return;

    // 1. 수정 모드
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
        items.push({ menuName, option, price, count: 1, orderedBy: [userName] });
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

    // 2. 일반 모드
    const newItem: CartItem = {
      id: Date.now(),
      userName,
      menuName,
      price,
      option,
      category: ''
    };
    await addToCartApi(groupId, newItem);
  };

  const handleCloseRoulette = () => {
    console.log("Closing roulette modal...");
    setIsResultDismissed(true);
    if (rouletteGame?.status === 'waiting' && groupId) {
      resetRouletteGameApi(groupId).catch(e => console.error("게임 초기화 실패:", e));
    }
  };

  // 👇 [추가] 룰렛 시작 핸들러
  const handleStartRoulette = async () => {
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
  };

  const isRouletteModalOpen = !!rouletteGame
      && rouletteGame.status !== 'idle'
      && !(rouletteGame.status === 'finished' && isResultDismissed);

  return {
    state: {
      groupId, userName, cart, totalPrice, history, rouletteHistory,
      rouletteGame, marbleCounts, toasts, favoriteMenuIds,
      isCartOpen, isHistoryOpen, editingHistoryInfo,
      isRouletteModalOpen
    },
    actions: {
      setIsCartOpen, setIsHistoryOpen, setEditingHistoryInfo,
      addToast, removeToast, toggleFavoriteHandler, addToCartHandler,
      handleCloseRoulette,
      handleStartRoulette // 👈 내보내기
    }
  };
};