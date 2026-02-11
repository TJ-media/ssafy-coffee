import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { MEGA_MENUS, CATEGORIES } from '../menuData';
import { ShoppingCart, LogOut, Heart, Link, History, Target, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CartItem, GroupData, Menu, OptionType, GroupedCartItem, ToastMessage, OrderHistory, HistoryItem, RouletteGameState, RouletteHistory } from '../types';
import { getAvatarColor, getTextContrastColor, getFavorites, addFavorite, removeFavorite, isFavorite } from '../utils';
import Toast from '../components/Toast';
import HistoryModal from '../components/HistoryModal';
import RouletteModal from '../components/roulette/RouletteModal';
import CartSheet from '../components/order/CartSheet';

interface FlyingItem {
  id: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  color: string;
}

const OrderPage = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('커피');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('전체');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(true);

  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);
  const cartFabRef = useRef<HTMLButtonElement>(null);
  const cartSheetRef = useRef<HTMLDivElement>(null);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [history, setHistory] = useState<OrderHistory[]>([]);
  const [favoriteMenuIds, setFavoriteMenuIds] = useState<number[]>([]);

  const [rouletteGame, setRouletteGame] = useState<RouletteGameState | undefined>(undefined);
  const [rouletteHistory, setRouletteHistory] = useState<RouletteHistory[]>([]);
  const [marbleCounts, setMarbleCounts] = useState<{ [userName: string]: number }>({});
  const [isResultDismissed, setIsResultDismissed] = useState<boolean>(false);

  const [editingHistoryInfo, setEditingHistoryInfo] = useState<{
    id: string;
    type: 'normal' | 'roulette';
    count: number;
    animationKey: number;
  } | null>(null);

  const prevCartRef = useRef<CartItem[]>([]);

  const navigate = useNavigate();
  const groupId = localStorage.getItem('ssafy_groupId');
  const userName = localStorage.getItem('ssafy_userName') || '익명';

  useEffect(() => {
    const favorites = getFavorites();
    setFavoriteMenuIds(favorites.map(f => f.menuId));
  }, []);

  useEffect(() => {
    setSelectedSubCategory('전체');
  }, [selectedCategory]);

  useEffect(() => {
    if (!groupId || !userName) {
      navigate('/');
      return;
    }

    const unsub = onSnapshot(doc(db, 'groups', groupId), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data() as GroupData;
        const currentCart = data.cart || [];

        if (prevCartRef.current.length > 0 && currentCart.length > prevCartRef.current.length) {
          const prevIds = new Set(prevCartRef.current.map(item => item.id));
          const newItems = currentCart.filter(item => !prevIds.has(item.id));

          newItems.forEach(item => {
            if (item.userName !== userName) {
              addToast(`${item.userName}님이 ${item.menuName}을(를) 추가했어요`, 'info');
            }
          });
        }

        prevCartRef.current = currentCart;
        setCart(currentCart);

        const total = currentCart.reduce((sum, item) => sum + item.price, 0);
        setTotalPrice(total);

        setHistory(data.history || []);
        setRouletteHistory(data.rouletteHistory || []);
        setRouletteGame(data.rouletteGame);
        setMarbleCounts(data.marbleCounts || {});

        if (editingHistoryInfo) {
          const isNormal = editingHistoryInfo.type === 'normal';
          const targetList = isNormal ? (data.history || []) : (data.rouletteHistory || []);
          const targetObj = targetList.find(h => h.id === editingHistoryInfo.id);

          if (targetObj) {
            // @ts-ignore
            const items = isNormal ? targetObj.items : targetObj.orderItems;
            const itemCount = items ? items.reduce((sum: number, i: HistoryItem) => sum + i.count, 0) : 0;
            setEditingHistoryInfo(prev => prev ? ({ ...prev, count: itemCount }) : null);
          }
        }

      } else {
        alert('모임이 종료되었거나 존재하지 않습니다.');
        navigate('/');
      }
    });
    return () => unsub();
  }, [groupId, userName, navigate, editingHistoryInfo?.id]);

  const addToast = (message: string, type: ToastMessage['type'] = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const toggleFavorite = (menu: Menu) => {
    if (isFavorite(menu.id)) {
      removeFavorite(menu.id);
      setFavoriteMenuIds(prev => prev.filter(id => id !== menu.id));
    } else {
      addFavorite(menu.id, menu.name);
      setFavoriteMenuIds(prev => [...prev, menu.id]);
      addToast(`${menu.name}을(를) 즐겨찾기에 추가했어요`, 'success');
    }
  };

  const copyShareLink = async () => {
    const url = `${window.location.origin}?group=${groupId}`;
    try {
      await navigator.clipboard.writeText(url);
      addToast('공유 링크가 복사되었어요!', 'success');
    } catch {
      addToast('링크 복사에 실패했어요', 'warning');
    }
  };

  useEffect(() => {
    const currentStatus = rouletteGame?.status || 'idle';
    if (currentStatus === 'waiting' || currentStatus === 'ready' || currentStatus === 'playing') {
      setIsResultDismissed(false);
    }
  }, [rouletteGame?.status]);

  const handleStartRoulette = async () => {
    const rouletteParticipants = [...new Set(cart.map(item => item.userName))];
    if (rouletteParticipants.length < 2) {
      addToast('커피 내기에는 2명 이상이 필요해요!', 'warning');
      return;
    }
    if (!groupId) return;

    try {
      const groupRef = doc(db, 'groups', groupId);
      await updateDoc(groupRef, {
        rouletteGame: {
          status: 'waiting',
          participants: rouletteParticipants,
          seed: Date.now(),
          startedAt: new Date(),
          hostName: userName,
        },
      });
    } catch (e) {
      console.error(e);
      addToast('룰렛 시작에 실패했어요', 'warning');
    }
  };

  const handleCloseRouletteModal = async () => {
    const currentStatus = rouletteGame?.status || 'idle';
    if (currentStatus === 'waiting') {
      if (!groupId) return;
      try {
        await updateDoc(doc(db, 'groups', groupId), {
          rouletteGame: { status: 'idle', participants: [], seed: 0, chatMessages: [] },
        });
      } catch (e) { console.error(e); }
    } else if (currentStatus === 'finished') {
      setIsResultDismissed(true);
    }
  };

  const enableHistoryAddMode = (historyId: string, type: 'normal' | 'roulette') => {
    const isNormal = type === 'normal';
    const targetList = isNormal ? history : rouletteHistory;
    const targetObj = targetList.find(h => h.id === historyId);

    let currentCount = 0;
    if (targetObj) {
      // @ts-ignore
      const items = isNormal ? targetObj.items : targetObj.orderItems;
      currentCount = items ? items.reduce((sum: number, i: HistoryItem) => sum + i.count, 0) : 0;
    }

    setEditingHistoryInfo({
      id: historyId,
      type,
      count: currentCount,
      animationKey: Date.now()
    });

    setIsHistoryOpen(false);
    setIsCartOpen(false);
    addToast('메뉴를 선택하면 바로 추가됩니다!', 'success');
  };

  const addToHistory = async (menuName: string, price: number, option: OptionType, targetEl?: HTMLElement | null, e?: React.MouseEvent) => {
    if (!groupId || !editingHistoryInfo) return;

    if (e && targetEl) {
      const startX = e.clientX;
      const startY = e.clientY;
      const fab = document.getElementById('history-fab');
      let targetX = window.innerWidth - 50;
      let targetY = window.innerHeight - 50;

      if (fab) {
        const fabRect = fab.getBoundingClientRect();
        targetX = fabRect.left + fabRect.width / 2;
        targetY = fabRect.top + fabRect.height / 2;
      }

      const animId = Date.now();
      setFlyingItems(prev => [...prev, { id: animId, startX, startY, targetX, targetY, color: getAvatarColor(userName) }]);
      setTimeout(() => setFlyingItems(prev => prev.filter(i => i.id !== animId)), 600);
    }

    try {
      const groupRef = doc(db, 'groups', groupId);
      const groupSnap = await getDoc(groupRef);
      if (!groupSnap.exists()) return;

      const data = groupSnap.data() as GroupData;
      const isNormal = editingHistoryInfo.type === 'normal';
      let targetList = isNormal ? (data.history || []) : (data.rouletteHistory || []);

      const targetIndex = targetList.findIndex(h => h.id === editingHistoryInfo.id);
      if (targetIndex === -1) {
        addToast('해당 주문 내역을 찾을 수 없습니다.', 'warning');
        setEditingHistoryInfo(null);
        return;
      }

      const targetHistory = { ...targetList[targetIndex] };
      // @ts-ignore
      const items = isNormal ? targetHistory.items : targetHistory.orderItems;

      const existingItemIndex = items.findIndex((i: HistoryItem) => i.menuName === menuName && i.option === option);

      if (existingItemIndex !== -1) {
        items[existingItemIndex].count += 1;
        items[existingItemIndex].orderedBy.push(userName);
      } else {
        items.push({
          menuName, option, price, count: 1, orderedBy: [userName]
        });
      }

      targetHistory.totalPrice += price;
      // @ts-ignore
      if (targetHistory.totalItems !== undefined) targetHistory.totalItems += 1;

      targetList[targetIndex] = targetHistory;
      await updateDoc(groupRef, {
        [isNormal ? 'history' : 'rouletteHistory']: targetList
      });

    } catch (e) {
      console.error('Failed to add to history:', e);
      addToast('추가에 실패했습니다.', 'warning');
    }
  };

  const deleteFromHistory = async (historyId: string, type: 'normal' | 'roulette', itemIndex: number, targetUser?: string) => {
    if (!groupId) return;

    try {
      const groupRef = doc(db, 'groups', groupId);
      const groupSnap = await getDoc(groupRef);
      if (!groupSnap.exists()) return;

      const data = groupSnap.data() as GroupData;
      const isNormal = type === 'normal';
      const targetList = isNormal ? (data.history || []) : (data.rouletteHistory || []);
      const targetIndex = targetList.findIndex(h => h.id === historyId);

      if (targetIndex === -1) return;

      const targetHistory = { ...targetList[targetIndex] };
      // @ts-ignore
      const items = isNormal ? targetHistory.items : targetHistory.orderItems;
      const item = items[itemIndex];
      const price = item.price;

      if (targetUser) {
        const userIdx = item.orderedBy.indexOf(targetUser);
        if (userIdx > -1) {
          item.orderedBy.splice(userIdx, 1);
          item.count -= 1;
          targetHistory.totalPrice -= price;
          // @ts-ignore
          if (targetHistory.totalItems) targetHistory.totalItems -= 1;
        }
      } else {
        targetHistory.totalPrice -= (price * item.count);
        // @ts-ignore
        if (targetHistory.totalItems) targetHistory.totalItems -= item.count;
        item.count = 0;
      }

      // @ts-ignore
      if (isNormal) targetHistory.items = items.filter(i => i.count > 0);
      // @ts-ignore
      else targetHistory.orderItems = items.filter(i => i.count > 0);

      targetList[targetIndex] = targetHistory;

      await updateDoc(groupRef, {
        [isNormal ? 'history' : 'rouletteHistory']: targetList
      });

      addToast('메뉴가 삭제되었습니다.', 'info');

    } catch (e) {
      console.error(e);
      addToast('삭제 실패', 'warning');
    }
  };

  const handleAddToCart = async (e: React.MouseEvent, menu: Menu, option: OptionType) => {
    if (editingHistoryInfo) {
      const target = isCartOpen ? cartSheetRef.current : document.getElementById('history-fab');
      // @ts-ignore
      await addToHistory(menu.name, menu.price, option, target, e);
      return;
    }

    if (!groupId || !userName) return;
    if (menu.hasOption && !option) return;

    const startX = e.clientX;
    const startY = e.clientY;

    let targetX = 0;
    let targetY = 0;

    const targetEl = isCartOpen ? cartSheetRef.current : cartFabRef.current;

    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      targetX = rect.left + rect.width / 2;
      targetY = rect.top + rect.height / 2;
    } else {
      targetX = window.innerWidth - 50;
      targetY = window.innerHeight - 50;
    }

    const animId = Date.now();
    setFlyingItems(prev => [...prev, {
      id: animId,
      startX, startY, targetX, targetY,
      color: getAvatarColor(userName)
    }]);

    setTimeout(() => {
      setFlyingItems(prev => prev.filter(item => item.id !== animId));
    }, 600);

    const newItem: CartItem = {
      id: Date.now(),
      userName: userName,
      menuName: menu.name,
      price: menu.price,
      option: option,
      category: menu.categoryUpper
    };

    try {
      const groupRef = doc(db, 'groups', groupId);
      await updateDoc(groupRef, {
        cart: arrayUnion(newItem)
      });
    } catch (e) {
      console.error('Failed to add item to cart:', e);
    }
  };

  const addByPlusButton = async (menuName: string, price: number, option: OptionType) => {
    if (!groupId || !userName) return;
    try {
      const newItem: CartItem = {
        id: Date.now(),
        userName: userName,
        menuName: menuName,
        price: price,
        option: option,
        category: ''
      };
      const groupRef = doc(db, 'groups', groupId);
      await updateDoc(groupRef, { cart: arrayUnion(newItem) });
    } catch (e) {
      console.error('Failed to add item:', e);
    }
  };

  const removeFromCart = async (menuName: string, option: OptionType) => {
    if (!groupId) return;
    const targetItem = cart.find(
        item => item.menuName === menuName && item.option === option && item.userName === userName
    );
    if (!targetItem) {
      addToast('내가 담은 메뉴만 취소할 수 있습니다.', 'warning');
      return;
    }
    try {
      const newCart = cart.filter(item => item.id !== targetItem.id);
      const groupRef = doc(db, 'groups', groupId);
      await updateDoc(groupRef, { cart: newCart });
    } catch (e) {
      console.error('Failed to remove item:', e);
      addToast('메뉴 삭제에 실패했어요', 'warning');
    }
  };

  const clearCart = async () => {
    if (!groupId) return;
    if (confirm('정말 장바구니를 비우시겠습니까? (결제 완료 시 실행)')) {
      try {
        const groupedItems = Object.values(cart.reduce<Record<string, GroupedCartItem>>((acc, item) => {
          const key = `${item.menuName}_${item.option}`;
          if (!acc[key]) {
            acc[key] = { count: 0, names: [], price: item.price, menuName: item.menuName, option: item.option };
          }
          acc[key].count += 1; acc[key].names.push(item.userName);
          return acc;
        }, {}));

        const historyItems: HistoryItem[] = groupedItems.map(item => ({
          menuName: item.menuName,
          option: item.option,
          price: item.price,
          count: item.count,
          orderedBy: item.names
        }));

        const newHistory: OrderHistory = {
          id: `order-${Date.now()}`,
          orderedAt: new Date(),
          totalPrice,
          totalItems: cart.length,
          items: historyItems,
          participants: [...new Set(cart.map(item => item.userName))]
        };

        const groupRef = doc(db, 'groups', groupId);
        await updateDoc(groupRef, {
          cart: [],
          history: arrayUnion(newHistory)
        });

        addToast('결제가 완료되었어요!', 'success');
        setIsHistoryOpen(true);
      } catch (e) {
        console.error('Failed to clear cart:', e);
        addToast('결제 처리에 실패했어요', 'warning');
      }
    }
  };

  const favoriteMenus = MEGA_MENUS.filter(menu => favoriteMenuIds.includes(menu.id));
  const currentMenus = selectedCategory === '즐겨찾기'
      ? favoriteMenus
      : MEGA_MENUS.filter(m => m.categoryUpper === selectedCategory);

  const rouletteParticipants = [...new Set(cart.map(item => item.userName))];
  const rouletteStatus = rouletteGame?.status || 'idle';
  const isRouletteModalOpen = rouletteStatus !== 'idle' && !(rouletteStatus === 'finished' && isResultDismissed);

  return (
      <div className="h-full flex flex-col bg-background relative overflow-hidden">
        <Toast toasts={toasts} removeToast={removeToast} />

        <HistoryModal
            isOpen={isHistoryOpen}
            onClose={() => {
              setIsHistoryOpen(false);
              setEditingHistoryInfo(null);
            }}
            history={history}
            rouletteHistory={rouletteHistory}
            groupId={groupId || ''}
            userName={userName}
            onAddMode={enableHistoryAddMode}
            onDeleteItem={deleteFromHistory}
        />

        <RouletteModal
            isOpen={isRouletteModalOpen}
            onClose={handleCloseRouletteModal}
            groupId={groupId || ''}
            participants={rouletteParticipants}
            gameState={rouletteGame}
            cart={cart}
            marbleCounts={marbleCounts}
        />

        {flyingItems.map(item => (
            <div key={item.id} className="fixed w-6 h-6 rounded-full shadow-lg z-50 pointer-events-none transition-all duration-500 ease-in-out"
                 style={{
                   backgroundColor: item.color,
                   left: item.startX,
                   top: item.startY,
                   transform: `translate(${item.targetX - item.startX}px, ${item.targetY - item.startY}px) scale(0.5)`,
                   opacity: 0
                 }}
            />
        ))}
        <style>{`
        @keyframes flyToCart {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) scale(0.2); opacity: 0; }
        }
        .flying-ball {
          animation: flyToCart 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        
        @keyframes flyFromCenter {
          0% { 
            transform: translate(-45vw, -35vh) scale(0.3); 
            opacity: 0; 
            animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          50% {
            transform: translate(-20vw, -65vh) scale(1.15);
            opacity: 1;
            animation-timing-function: cubic-bezier(0.55, 0.085, 0.68, 0.53);
          }
          100% { 
            transform: translate(0, 0) scale(1); 
            opacity: 1; 
          }
        }
        .animate-fly-from-center {
          animation: flyFromCenter 0.7s forwards;
        }
      `}</style>
        {flyingItems.map(item => (
            <div
                key={item.id}
                className="fixed w-8 h-8 rounded-full shadow-md z-50 pointer-events-none flying-ball flex items-center justify-center text-[10px] font-bold text-white border-2 border-white"
                style={{
                  backgroundColor: item.color,
                  left: item.startX - 16,
                  top: item.startY - 16,
                  //@ts-ignore
                  '--tx': `${item.targetX - item.startX}px`,
                  //@ts-ignore
                  '--ty': `${item.targetY - item.startY}px`,
                  color: getTextContrastColor()
                }}
            >
              +1
            </div>
        ))}

        <div className="bg-surface sticky top-0 z-10 shadow-sm">
          <div className="flex justify-between items-center p-6 pb-2">
            <div className="flex items-center gap-3">
              <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-inner"
                  style={{ backgroundColor: getAvatarColor(userName), color: getTextContrastColor() }}
              >
                {userName.slice(0, 2)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-primary">메가커피</h2>
                <p className="text-xs text-text-secondary">{groupId}</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button onClick={copyShareLink} className="text-text-secondary hover:text-primary p-2 transition" title="공유 링크 복사">
                <Link size={20}/>
              </button>
              <button onClick={() => setIsHistoryOpen(true)} className="text-text-secondary hover:text-primary p-2 transition" title="주문 히스토리">
                <History size={20}/>
              </button>
              <button
                  onClick={handleStartRoulette}
                  className="text-text-secondary hover:text-primary p-2 transition"
                  title="커피 내기 룰렛"
              >
                <Target size={20}/>
              </button>
              <button onClick={() => {if(confirm('모임에서 나가시겠습니까?')) {localStorage.removeItem('ssafy_groupId'); navigate('/');}}} className="text-text-secondary hover:text-danger p-2 transition" title="나가기">
                <LogOut size={20}/>
              </button>
            </div>
          </div>

          {editingHistoryInfo && (
              <div className="bg-primary text-white text-center py-2 text-sm font-bold animate-pulse shadow-md">
                ✨ 지난 주문 내역을 수정 중입니다 (메뉴를 터치하세요)
              </div>
          )}

          <div className="flex overflow-x-auto space-x-2 no-scrollbar px-6 pb-2">
            <button
                onClick={() => setSelectedCategory('즐겨찾기')}
                className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex items-center gap-1 ${selectedCategory === '즐겨찾기' ? 'bg-primary text-white shadow-md transform scale-105' : 'bg-white text-text-primary hover:bg-gray-100'}`}
            >
              <Heart size={14} fill={selectedCategory === '즐겨찾기' ? 'white' : 'none'} /> 즐겨찾기
            </button>
            {CATEGORIES.map(cat => (
                <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-primary text-white shadow-md transform scale-105' : 'bg-white text-text-primary hover:bg-gray-100'}`}
                >
                  {cat}
                </button>
            ))}
          </div>

          {selectedCategory !== '즐겨찾기' && (
              <div className="flex overflow-x-auto space-x-2 no-scrollbar px-6 py-3 border-t border-dashed border-gray-100 bg-gray-50/50">
                {['전체', ...Array.from(new Set(MEGA_MENUS.filter(m => m.categoryUpper === selectedCategory).map(m => m.categoryLower)))].map(sub => (
                    <button
                        key={sub}
                        onClick={() => setSelectedSubCategory(sub)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${selectedSubCategory === sub ? 'bg-white border-primary text-primary shadow-sm' : 'bg-transparent border-transparent text-text-secondary hover:bg-gray-200'}`}
                    >
                      {sub}
                    </button>
                ))}
              </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 pb-32 custom-scrollbar">
          {selectedCategory === '즐겨찾기' && favoriteMenus.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-text-secondary">
                <Heart size={48} className="mb-4 opacity-30" />
                <p>즐겨찾기한 메뉴가 없어요</p>
              </div>
          ) : (
              <div className="grid grid-cols-2 gap-4">
                {currentMenus
                    .filter(m => selectedCategory === '즐겨찾기' || selectedSubCategory === '전체' || m.categoryLower === selectedSubCategory)
                    .map(menu => (
                        <div key={menu.id} className="bg-surface p-4 rounded-2xl shadow-toss flex flex-col items-center transition hover:-translate-y-1 relative group">
                          <button
                              onClick={() => toggleFavorite(menu)}
                              className="absolute top-3 right-3 p-1 hover:scale-110 transition z-10"
                          >
                            <Heart
                                size={20}
                                className={`${favoriteMenuIds.includes(menu.id) ? 'text-red-500 fill-red-500' : 'text-gray-300 hover:text-red-300'} transition-colors`}
                            />
                          </button>

                          <div className="text-5xl mb-3">{menu.img}</div>

                          {selectedSubCategory === '전체' && (
                              <span className="text-[10px] text-primary bg-blue-50 px-2 py-0.5 rounded-full mb-1 font-bold">
                      {menu.categoryLower}
                    </span>
                          )}

                          <h3 className="font-bold text-text-primary text-center break-keep mb-1 leading-tight">{menu.name}</h3>
                          <p className="text-sm text-primary font-bold mb-3">{menu.price.toLocaleString()}원</p>

                          {menu.hasOption ? (
                              <div className="flex w-full gap-2 mt-auto">
                                <button
                                    onClick={(e) => handleAddToCart(e, menu, 'ICE')}
                                    className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-xl text-xs font-bold hover:bg-blue-100 transition active:scale-95"
                                >ICE</button>
                                <button
                                    onClick={(e) => handleAddToCart(e, menu, 'HOT')}
                                    className="flex-1 bg-red-50 text-red-600 py-2 rounded-xl text-xs font-bold hover:bg-red-100 transition active:scale-95"
                                >HOT</button>
                              </div>
                          ) : (
                              <button
                                  onClick={(e) => handleAddToCart(e, menu, 'ONLY')}
                                  className="w-full bg-gray-100 text-gray-800 py-2 rounded-xl text-xs font-bold hover:bg-gray-200 transition active:scale-95 mt-auto"
                              >담기</button>
                          )}
                        </div>
                    ))}
              </div>
          )}
        </div>

        {!isCartOpen && (
            <button
                // Cart 모드일 때는 고정된 키('cart-fab')를 사용
                key={editingHistoryInfo ? `edit-${editingHistoryInfo.animationKey}` : `cart-fab`}
                id={editingHistoryInfo ? 'history-fab' : 'cart-fab'}
                ref={cartFabRef}
                onClick={() => {
                  if (editingHistoryInfo) {
                    setIsHistoryOpen(true);
                  } else {
                    setIsCartOpen(true);
                  }
                }}
                // 👇 [핵심 수정] 애니메이션 클래스 분기 처리
                className={`absolute bottom-6 right-6 w-16 h-16 rounded-full shadow-lg flex items-center justify-center text-white z-30 transition-transform hover:scale-110 active:scale-95 
            ${editingHistoryInfo
                    ? 'bg-indigo-500 hover:bg-indigo-600 animate-fly-from-center'  // 1. 수정 모드: 날아오는 효과
                    : 'bg-primary hover:bg-primary-dark animate-bounce-in'          // 2. 장바구니: 쫀득하게 팝업 효과
                }`}
            >
              <div className="relative">
                {editingHistoryInfo ? <Pencil size={28} /> : <ShoppingCart size={28} />}

                {(editingHistoryInfo ? editingHistoryInfo.count > 0 : cart.length > 0) && (
                    <span className="absolute -top-2 -right-2 bg-danger text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-surface shadow-sm transition-transform duration-200 transform scale-100">
                {editingHistoryInfo ? editingHistoryInfo.count : cart.length}
              </span>
                )}
              </div>
            </button>
        )}

        {isCartOpen && !editingHistoryInfo && (
            <CartSheet
                cart={cart}
                totalPrice={totalPrice}
                userName={userName}
                cartFabRef={cartFabRef}
                cartSheetRef={cartSheetRef}
                onRemove={removeFromCart}
                onAdd={addByPlusButton}
                onClear={clearCart}
                // 👇 [수정] 닫힐 때 키 업데이트 로직 삭제 (컴포넌트 언마운트로 충분함)
                onClose={() => setIsCartOpen(false)}
                onEdit={() => {}}
            />
        )}
      </div>
  );
};

export default OrderPage;