import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import { GroupData, CartItem, Menu, OptionType, ToastMessage, OrderHistory, HistoryItem, PinballGameState } from '../types';
import { getAvatarColor, getFavorites, addFavorite, removeFavorite, isFavorite } from '../utils';

// 애니메이션 타입
export interface FlyingItem {
  id: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  color: string;
}

export const useOrderLogic = () => {
  const navigate = useNavigate();
  const groupId = localStorage.getItem('ssafy_groupId');
  const userName = localStorage.getItem('ssafy_userName') || '익명';

  // State
  const [selectedCategory, setSelectedCategory] = useState<string>('커피');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('전체');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [favoriteMenuIds, setFavoriteMenuIds] = useState<number[]>([]);
  
  // 모달 상태
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isPinballOpen, setIsPinballOpen] = useState(false);
  const [isRaceOpen, setIsRaceOpen] = useState(false);
  const [history, setHistory] = useState<OrderHistory[]>([]);
  const [pinballGame, setPinballGame] = useState<PinballGameState | undefined>(undefined);

  // 애니메이션 상태
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);
  const prevCartRef = useRef<CartItem[]>([]);

  // 초기 로드
  useEffect(() => {
    const favorites = getFavorites();
    setFavoriteMenuIds(favorites.map(f => f.menuId));
  }, []);

  useEffect(() => {
    setSelectedSubCategory('전체');
  }, [selectedCategory]);

  // Firestore 구독
  useEffect(() => {
    if (!groupId || !userName) {
      navigate('/');
      return;
    }

    const unsub = onSnapshot(doc(db, 'groups', groupId), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data() as GroupData;
        const currentCart = data.cart || [];

        // 실시간 알림
        if (prevCartRef.current.length > 0 && currentCart.length > prevCartRef.current.length) {
          const prevIds = new Set(prevCartRef.current.map(item => item.id));
          const newItems = currentCart.filter(item => !prevIds.has(item.id));
          newItems.forEach(item => {
            if (item.userName !== userName) {
              addToast(`${item.userName}님이 ${item.menuName}을(를) 추가했어요`);
            }
          });
        }

        prevCartRef.current = currentCart;
        setCart(currentCart);
        setTotalPrice(currentCart.reduce((sum, item) => sum + item.price, 0));
        setHistory(data.history || []);
        setPinballGame(data.pinballGame);
      } else {
        alert('존재하지 않는 모임입니다.');
        navigate('/');
      }
    });
    return () => unsub();
  }, [groupId, userName, navigate]);

  // 기능 함수들
  const addToast = (message: string, type: ToastMessage['type'] = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  const toggleFavorite = (menu: Menu) => {
    if (isFavorite(menu.id)) {
      removeFavorite(menu.id);
      setFavoriteMenuIds(prev => prev.filter(id => id !== menu.id));
    } else {
      addFavorite(menu.id, menu.name);
      setFavoriteMenuIds(prev => [...prev, menu.id]);
      addToast(`${menu.name}을(를) 즐겨찾기에 추가함`, 'success');
    }
  };

  // 장바구니 추가 (애니메이션 포함)
  const addToCart = async (
    e: React.MouseEvent | null, 
    menuName: string, 
    price: number, 
    option: OptionType, 
    categoryUpper: string, 
    targetEl?: HTMLElement | null
  ) => {
    if (!groupId) return;

    // 1. 애니메이션
    if (e && targetEl) {
      const startX = e.clientX;
      const startY = e.clientY;
      const rect = targetEl.getBoundingClientRect();
      const targetX = rect.left + rect.width / 2;
      const targetY = rect.top + rect.height / 2;

      const animId = Date.now();
      setFlyingItems(prev => [...prev, {
        id: animId, startX, startY, targetX, targetY, color: getAvatarColor(userName)
      }]);
      setTimeout(() => setFlyingItems(prev => prev.filter(i => i.id !== animId)), 600);
    }

    // 2. DB 업데이트
    const newItem: CartItem = {
      id: Date.now(),
      userName,
      menuName,
      price,
      option,
      category: categoryUpper
    };
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, { cart: arrayUnion(newItem) });
  };

  const removeFromCart = async (menuName: string, option: OptionType) => {
    const targetItem = cart.find(item => item.menuName === menuName && item.option === option && item.userName === userName);
    if (!targetItem) return alert('내 메뉴만 취소 가능합니다.');
    
    const newCart = cart.filter(item => item.id !== targetItem.id);
    await updateDoc(doc(db, 'groups', groupId!), { cart: newCart });
  };

  const clearCart = async () => {
    if (!confirm('정말 비우시겠습니까?')) return;
    // 히스토리 생성 로직 생략 (간소화 위해, 필요시 기존 코드 복사)
    await updateDoc(doc(db, 'groups', groupId!), { cart: [] });
    addToast('장바구니가 비워졌습니다.', 'success');
  };

  return {
    // Data
    groupId, userName, cart, totalPrice, toasts, history, pinballGame,
    selectedCategory, selectedSubCategory, favoriteMenuIds,
    flyingItems,
    // Modals
    isHistoryOpen, setIsHistoryOpen,
    isPinballOpen, setIsPinballOpen,
    isRaceOpen, setIsRaceOpen,
    // Actions
    setSelectedCategory, setSelectedSubCategory,
    addToast, removeToast, toggleFavorite,
    addToCart, removeFromCart, clearCart
  };
};