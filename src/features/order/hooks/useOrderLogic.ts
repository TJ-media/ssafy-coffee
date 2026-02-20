import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrderStore } from '../store/useOrderStore';

/**
 * useOrderLogic - Zustand 스토어 래퍼 훅
 *
 * 기존 인터페이스({ state, actions })를 유지하면서 내부적으로 useOrderStore를 사용합니다.
 * Firestore onSnapshot 리스너의 라이프사이클을 컴포넌트에 맞게 관리합니다.
 */
export const useOrderLogic = () => {
  const navigate = useNavigate();
  const store = useOrderStore();

  // Firestore 구독 시작/해제를 컴포넌트 라이프사이클에 맞춤
  useEffect(() => {
    store.initializeStore(navigate);
    return () => {
      store.cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    state: {
      groupId: store.groupId,
      userName: store.userName,
      cart: store.cart,
      totalPrice: store.totalPrice,
      history: store.history,
      rouletteHistory: store.rouletteHistory,
      rouletteGame: store.rouletteGame,
      marbleCounts: store.marbleCounts,
      toasts: store.toasts,
      favoriteMenuIds: store.favoriteMenuIds,
      isCartOpen: store.isCartOpen,
      isHistoryOpen: store.isHistoryOpen,
      editingHistoryInfo: store.editingHistoryInfo,
      isRouletteModalOpen: store.isRouletteModalOpen,
      myCustomMenus: store.myCustomMenus,
      password: store.password,
    },
    actions: {
      setIsCartOpen: store.setIsCartOpen,
      setIsHistoryOpen: store.setIsHistoryOpen,
      setEditingHistoryInfo: store.setEditingHistoryInfo,
      addToast: store.addToast,
      removeToast: store.removeToast,
      toggleFavoriteHandler: store.toggleFavoriteHandler,
      addToCartHandler: store.addToCartHandler,
      handleCloseRoulette: store.handleCloseRoulette,
      handleStartRoulette: store.handleStartRoulette,
      saveCustomMenuHandler: store.saveCustomMenuHandler,
      deleteCustomMenuHandler: store.deleteCustomMenuHandler,
    },
  };
};