import React, { useState, useEffect, useMemo, useRef } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import { MEGA_MENUS, CATEGORIES } from '../menuData';
import { Trash2, ShoppingCart, LogOut, ChevronDown, Plus, Minus, Heart, Link, History, Target, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CartItem, GroupData, Menu, OptionType, GroupedCartItem, ToastMessage, OrderHistory, HistoryItem, RouletteGameState, RouletteHistory } from '../types';
import { getAvatarColor, getTextContrastColor, getFavorites, addFavorite, removeFavorite, isFavorite } from '../utils';
import { useRef, useMemo } from 'react'; // React 제거됨
import { useOrderLogic } from '../hooks/useOrderLogic';

// 분리된 컴포넌트들 임포트
import OrderHeader from '../components/order/OrderHeader';
import MenuGrid from '../components/order/MenuGrid';
import CartSheet from '../components/order/CartSheet';
import FlyingBall from '../components/order/FlyingBall';
import Toast from '../components/Toast';
import HistoryModal from '../components/HistoryModal';
import RouletteModal from '../components/roulette/RouletteModal';
import MarbleAdminModal from '../components/MarbleAdminModal';

const OrderPage = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('커피');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('전체');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(true);
  
  // 애니메이션 상태
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);
  const cartFabRef = useRef<HTMLButtonElement>(null);
  const cartSheetRef = useRef<HTMLDivElement>(null);

  // 새로운 기능 상태 (토스트, 히스토리, 즐겨찾기, 룰렛)
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isMarbleAdminOpen, setIsMarbleAdminOpen] = useState<boolean>(false);
  const [history, setHistory] = useState<OrderHistory[]>([]);
  const [favoriteMenuIds, setFavoriteMenuIds] = useState<number[]>([]);
  
  // 룰렛 관련 상태
  const [rouletteGame, setRouletteGame] = useState<RouletteGameState | undefined>(undefined);
  const [rouletteHistory, setRouletteHistory] = useState<RouletteHistory[]>([]);
  const [marbleCounts, setMarbleCounts] = useState<{ [userName: string]: number }>({});
  
  const prevCartRef = useRef<CartItem[]>([]); // 실시간 알림용

  const navigate = useNavigate();
  const groupId = localStorage.getItem('ssafy_groupId');
  const userName = localStorage.getItem('ssafy_userName') || '익명';

  // 초기 로드: 즐겨찾기 불러오기
  useEffect(() => {
    const favorites = getFavorites();
    setFavoriteMenuIds(favorites.map(f => f.menuId));
  }, []);

  // 카테고리 변경 시 소분류 초기화
  useEffect(() => {
    setSelectedSubCategory('전체');
  }, [selectedCategory]);

  // 소분류 계산
  const subCategories = useMemo(() => {
    const menusInUpper = MEGA_MENUS.filter(m => m.categoryUpper === selectedCategory);
    const lowers = Array.from(new Set(menusInUpper.map(m => m.categoryLower)));
    return ['전체', ...lowers];
  }, [selectedCategory]);

  // Firestore 구독 (장바구니 + 히스토리 + 실시간 알림 + 룰렛)
  useEffect(() => {
    if (!groupId || !userName) {
      navigate('/');
      return;
    }

    const unsub = onSnapshot(doc(db, 'groups', groupId), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data() as GroupData;
        const currentCart = data.cart || [];

        // 실시간 알림 로직: 카트 아이템이 늘어났을 때
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

        // 히스토리 업데이트
        setHistory(data.history || []);
        setRouletteHistory(data.rouletteHistory || []);

        // 룰렛 게임 상태 및 공 개수 업데이트
        setRouletteGame(data.rouletteGame);
        setMarbleCounts(data.marbleCounts || {});
      } else {
        alert('모임이 종료되었거나 존재하지 않습니다.');
        navigate('/');
      }
    });
    return () => unsub();
  }, [groupId, userName, navigate]);

  // === 유틸리티 함수들 ===

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

  // === 룰렛 게임 시작/종료 로직 ===
  const handleStartRoulette = async () => {
    const rouletteParticipants = [...new Set(cart.map(item => item.userName))];
    if (rouletteParticipants.length < 2) {
      addToast('커피 내기에는 2명 이상이 필요해요!', 'warning');
      return;
    }
    if (!groupId) return;

    const seed = Date.now();
    const groupRef = doc(db, 'groups', groupId);

    const newGameState: RouletteGameState = {
      status: 'waiting', // 대기실로 이동 (시작 버튼을 눌러야 게임 시작)
      participants: rouletteParticipants,
      seed: seed,
      startedAt: new Date(),
      hostName: userName, // 게임을 연 사람이 호스트
    };

    await updateDoc(groupRef, {
      rouletteGame: newGameState,
    });
  };

  const handleEndRoulette = async () => {
    if (!groupId) return;
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      rouletteGame: {
        status: 'idle',
        participants: [],
        seed: 0,
        chatMessages: [], // 채팅 메시지 초기화
      },
    });
  };
  
  // === 핵심 로직: 장바구니 담기 (애니메이션 포함) ===
  const handleAddToCart = async (e: React.MouseEvent, menu: Menu, option: OptionType) => {
    if (!groupId || !userName) return;
    if (menu.hasOption && !option) return;

    // 1. 애니메이션 좌표 계산
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

    // 2. 애니메이션 실행
    const animId = Date.now();
    setFlyingItems(prev => [...prev, {
      id: animId,
      startX, startY, targetX, targetY,
      color: getAvatarColor(userName)
    }]);

    setTimeout(() => {
      setFlyingItems(prev => prev.filter(item => item.id !== animId));
    }, 600);

    // 3. DB 업데이트
    const finalOption = menu.hasOption ? option : 'ONLY';
    const newItem: CartItem = {
      id: Date.now(),
      userName: userName,
      menuName: menu.name,
      price: menu.price,
      option: finalOption,
      category: menu.categoryUpper
    };

    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      cart: arrayUnion(newItem)
    });
  };

  // 장바구니 내부 + 버튼 (애니메이션 없음)
  const addByPlusButton = async (menuName: string, price: number, option: OptionType) => {
     if (!groupId || !userName) return;
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
  };

  const removeFromCart = async (menuName: string, option: OptionType) => {
    if (!groupId) return;
    const targetItem = cart.find(
      item => item.menuName === menuName && item.option === option && item.userName === userName
    );
    if (!targetItem) {
      alert('내가 담은 메뉴만 취소할 수 있습니다.');
      return;
    }
    const newCart = cart.filter(item => item.id !== targetItem.id);
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, { cart: newCart });
  };

  // 결제 완료 (히스토리 저장 포함)
  const clearCart = async () => {
    if (!groupId) return;
    if (confirm('정말 장바구니를 비우시겠습니까? (결제 완료 시 실행)')) {
      const groupedItems = Object.values(groupedCart);
      const participants = [...new Set(cart.map(item => item.userName))];

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
        participants
      };

      const groupRef = doc(db, 'groups', groupId);
      await updateDoc(groupRef, {
        cart: [],
        history: arrayUnion(newHistory)
      });

      addToast('결제가 완료되었어요!', 'success');
    }
  };

  const handleLogout = () => {
    if(confirm('모임에서 나가시겠습니까?')) {
        localStorage.removeItem('ssafy_groupId');
        localStorage.removeItem('ssafy_userName');
        navigate('/');
    }
  }

  const groupedCart = cart.reduce<Record<string, GroupedCartItem>>((acc, item) => {
    const key = `${item.menuName}_${item.option}`;
    if (!acc[key]) {
        acc[key] = { 
          count: 0, 
          names: [], 
          price: item.price, 
          menuName: item.menuName, 
          option: item.option 
        };
    }
    acc[key].count += 1;
    acc[key].names.push(item.userName);
    return acc;
  }, {});

  // 즐겨찾기 메뉴 필터링
  const favoriteMenus = MEGA_MENUS.filter(menu => favoriteMenuIds.includes(menu.id));

  // 현재 화면에 보여줄 메뉴 리스트 계산
  const currentMenus = selectedCategory === '즐겨찾기'
    ? favoriteMenus
    : MEGA_MENUS.filter(m => m.categoryUpper === selectedCategory);

  // 룰렛 게임 참여자 (장바구니에 담은 사람들)
  const rouletteParticipants = [...new Set(cart.map(item => item.userName))];
  const isRouletteModalOpen = !!(rouletteGame?.status && rouletteGame.status !== 'idle');


  return (
    <div className="h-full flex flex-col bg-background relative overflow-hidden">
      {/* 1. 기능 오버레이들 (토스트, 히스토리, 룰렛) */}
      <Toast toasts={toasts} removeToast={removeToast} />
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        rouletteHistory={rouletteHistory}
        groupId={groupId || ''}
      />
      <RouletteModal
        isOpen={isRouletteModalOpen}
        onClose={handleEndRoulette}
        groupId={groupId || ''}
        participants={rouletteParticipants}
        gameState={rouletteGame}
        cart={cart}
        marbleCounts={marbleCounts}
      />
      <MarbleAdminModal
        isOpen={isMarbleAdminOpen}
        onClose={() => setIsMarbleAdminOpen(false)}
        marbleCounts={marbleCounts}
        groupId={groupId || ''}
      />

      {/* 2. 애니메이션 레이어 */}
      {flyingItems.map(item => (
        <div
          key={item.id}
          className="fixed w-6 h-6 rounded-full shadow-lg z-50 pointer-events-none transition-all duration-500 ease-in-out"
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

      {/* 3. 상단 헤더 영역 */}
      <div className="bg-surface sticky top-0 z-10 shadow-sm">
        <div className="flex justify-between items-center p-6 pb-2">
          {/* 유저 정보 */}
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
          
          {/* 상단 버튼들 */}
          <div className="flex items-center gap-1">
            <button onClick={copyShareLink} className="text-text-secondary hover:text-primary p-2 transition" title="공유 링크 복사">
              <Link size={20}/>
            </button>
            <button onClick={() => setIsHistoryOpen(true)} className="text-text-secondary hover:text-primary p-2 transition" title="주문 히스토리">
              <History size={20}/>
            </button>
            <button onClick={() => setIsMarbleAdminOpen(true)} className="text-text-secondary hover:text-primary p-2 transition" title="공 개수 관리">
              <Settings size={20}/>
            </button>
            {/* 룰렛 게임 버튼 */}
            <button
              onClick={handleStartRoulette}
              className="text-text-secondary hover:text-primary p-2 transition"
              title="커피 내기 룰렛"
            >
              <Target size={20}/>
            </button>
            <button onClick={handleLogout} className="text-text-secondary hover:text-danger p-2 transition" title="나가기">
              <LogOut size={20}/>
            </button>
          </div>
        </div>
        
        {/* 대분류 (즐겨찾기 포함) */}
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

        {/* 소분류 (즐겨찾기가 아닐 때만) */}
        {selectedCategory !== '즐겨찾기' && (
          <div className="flex overflow-x-auto space-x-2 no-scrollbar px-6 py-3 border-t border-dashed border-gray-100 bg-gray-50/50">
            {subCategories.map(sub => (
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

      {/* 4. 메뉴 리스트 */}
      <div className="flex-1 overflow-y-auto p-4 pb-32 custom-scrollbar">
        {selectedCategory === '즐겨찾기' && favoriteMenus.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-20 text-text-secondary">
             <Heart size={48} className="mb-4 opacity-30" />
             <p>즐겨찾기한 메뉴가 없어요</p>
             <p className="text-sm mt-1">메뉴 카드의 하트를 눌러 추가해보세요</p>
           </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {/* 메뉴 필터링 및 매핑 */}
            {currentMenus
              .filter(m => selectedCategory === '즐겨찾기' || selectedSubCategory === '전체' || m.categoryLower === selectedSubCategory)
              .map(menu => (
                <div key={menu.id} className="bg-surface p-4 rounded-2xl shadow-toss flex flex-col items-center transition hover:-translate-y-1 relative group">
                  
                  {/* 즐겨찾기 버튼 */}
                  <button
                    onClick={() => toggleFavorite(menu)}
                    className="absolute top-3 right-3 p-1 hover:scale-110 transition z-10"
                  >
                    <Heart
                      size={20}
                      className={`${favoriteMenuIds.includes(menu.id) ? 'text-red-500 fill-red-500' : 'text-gray-300 hover:text-red-300'} transition-colors`}
                    />
                  </button>
    // 1. 모든 비즈니스 로직을 커스텀 훅에서 가져옵니다.
    const logic = useOrderLogic();

    // 2. 애니메이션 타겟 위치를 잡기 위한 Ref (장바구니 버튼/아이콘)
    const cartFabRef = useRef<HTMLButtonElement>(null);
    const cartSheetRef = useRef<HTMLDivElement>(null);

    // 3. 핀볼 게임 참여자 목록 (장바구니에 담긴 사람 이름 중복 제거) - 레이스 -> 핀볼로 변경
    const participants = useMemo(() => {
        return Array.from(new Set(logic.cart.map(item => item.userName)));
    }, [logic.cart]);

    // 4. 공유 링크 복사 기능
    const handleCopyLink = async () => {
        const url = `${window.location.origin}?group=${logic.groupId}`;
        try {
            await navigator.clipboard.writeText(url);
            logic.addToast('링크가 복사되었습니다!', 'success');
        } catch {
            logic.addToast('복사 실패', 'warning');
        }
    };

    return (
        <div className="h-full flex flex-col bg-background relative overflow-hidden">
            {/* ── [1] 화면에 보이지 않는 기능성/오버레이 컴포넌트들 ── */}

            {/* 날아가는 공 애니메이션 */}
            <FlyingBall items={logic.flyingItems} />

            {/* 토스트 알림 메시지 */}
            <Toast toasts={logic.toasts} removeToast={logic.removeToast} />

            {/* 각종 모달들 (히스토리, 핀볼) */}
            <HistoryModal
                isOpen={logic.isHistoryOpen}
                onClose={() => logic.setIsHistoryOpen(false)}
                history={logic.history}
            />

            <PinballModal
                isOpen={logic.isPinballOpen}
                onClose={() => logic.setIsPinballOpen(false)}
                groupId={logic.groupId || ''}
                participants={participants}
                gameState={logic.pinballGame}
            />

            {/* ── [2] 메인 UI 영역 ── */}

            {/* 상단 헤더 (프로필, 카테고리, 버튼들) */}
            <OrderHeader
                groupId={logic.groupId || ''}
                userName={logic.userName}
                selectedCategory={logic.selectedCategory}
                setSelectedCategory={logic.setSelectedCategory}
                selectedSubCategory={logic.selectedSubCategory}
                setSelectedSubCategory={logic.setSelectedSubCategory}
                onOpenHistory={() => logic.setIsHistoryOpen(true)}
                onOpenPinball={() => logic.setIsPinballOpen(true)}
                onCopyLink={handleCopyLink}
            />

            {/* 중앙 메뉴 리스트 (스크롤 영역) */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <MenuGrid
                    selectedCategory={logic.selectedCategory}
                    selectedSubCategory={logic.selectedSubCategory}
                    favoriteMenuIds={logic.favoriteMenuIds}
                    onToggleFavorite={logic.toggleFavorite}
                    onAddToCart={(e, menu, option) => {
                        // 클릭 시 장바구니가 열려있으면 시트 아이콘으로, 닫혀있으면 FAB 버튼으로 날아가게 타겟 설정
                        const target = cartSheetRef.current || cartFabRef.current;
                        logic.addToCart(e, menu.name, menu.price, option, menu.categoryUpper, target);
                    }}
                />
            </div>

            {/* 하단 장바구니 (버튼 및 시트) */}
            <CartSheet
                cart={logic.cart}
                totalPrice={logic.totalPrice}
                userName={logic.userName}
                cartFabRef={cartFabRef}
                cartSheetRef={cartSheetRef}
                onRemove={logic.removeFromCart}
                // 장바구니 내부에서 + 버튼 누를 땐 애니메이션 없이 바로 추가
                onAdd={(name, price, opt) => logic.addToCart(null, name, price, opt, '', null)}
                onClear={logic.clearCart}
            />
        </div>
    );
};

export default OrderPage;