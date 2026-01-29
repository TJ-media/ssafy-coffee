import { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import { MEGA_MENUS, CATEGORIES } from '../menuData';
import { Trash2, ShoppingCart, LogOut, ChevronDown, Plus, Minus, Heart, Link, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CartItem, GroupData, Menu, OptionType, GroupedCartItem, ToastMessage, OrderHistory, HistoryItem } from '../types';
import { getAvatarColor, getFavorites, addFavorite, removeFavorite, isFavorite } from '../utils';
import Toast from '../components/Toast';
import HistoryModal from '../components/HistoryModal';

const OrderPage = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('커피');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [history, setHistory] = useState<OrderHistory[]>([]);
  const [favoriteMenuIds, setFavoriteMenuIds] = useState<number[]>([]);

  const navigate = useNavigate();
  const groupId = localStorage.getItem('ssafy_groupId');
  const userName = localStorage.getItem('ssafy_userName') || '익명';

  // 이전 cart 상태를 저장 (실시간 알림용)
  const prevCartRef = useRef<CartItem[]>([]);

  // 즐겨찾기 목록 로드
  useEffect(() => {
    const favorites = getFavorites();
    setFavoriteMenuIds(favorites.map(f => f.menuId));
  }, []);

  useEffect(() => {
    if (!groupId || !userName) {
      navigate('/');
      return;
    }

    const unsub = onSnapshot(doc(db, 'groups', groupId), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data() as GroupData;
        const currentCart = data.cart || [];

        // 실시간 알림: 새로 추가된 아이템 감지
        if (prevCartRef.current.length > 0 && currentCart.length > prevCartRef.current.length) {
          const prevIds = new Set(prevCartRef.current.map(item => item.id));
          const newItems = currentCart.filter(item => !prevIds.has(item.id));

          newItems.forEach(item => {
            // 본인이 추가한 건 제외
            if (item.userName !== userName) {
              addToast(`${item.userName}님이 ${item.menuName}을(를) 추가했어요`, 'info');
            }
          });
        }

        prevCartRef.current = currentCart;
        setCart(currentCart);

        const total = currentCart.reduce((sum, item) => sum + item.price, 0);
        setTotalPrice(total);

        // 히스토리 로드
        setHistory(data.history || []);
      } else {
        alert('모임이 종료되었거나 존재하지 않습니다.');
        navigate('/');
      }
    });
    return () => unsub();
  }, [groupId, userName, navigate]);

  // 토스트 추가
  const addToast = (message: string, type: ToastMessage['type'] = 'info') => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, message, type }]);
  };

  // 토스트 제거
  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // 즐겨찾기 토글
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

  // 공유 링크 복사
  const copyShareLink = async () => {
    const url = `${window.location.origin}?group=${groupId}`;
    try {
      await navigator.clipboard.writeText(url);
      addToast('공유 링크가 복사되었어요!', 'success');
    } catch {
      addToast('링크 복사에 실패했어요', 'warning');
    }
  };

  const addToCart = async (menu: Menu, option: OptionType) => {
    if (!groupId || !userName) return;
    if (menu.hasOption && !option) return;

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

  const clearCart = async () => {
    if (!groupId) return;
    if (confirm('정말 장바구니를 비우시겠습니까? (결제 완료 시 실행)')) {
      // 히스토리 기록 생성
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
  };

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

  // 현재 카테고리의 메뉴
  const currentMenus = selectedCategory === '즐겨찾기'
    ? favoriteMenus
    : MEGA_MENUS.filter(m => m.categoryUpper === selectedCategory);

  return (
    <div className="h-full flex flex-col bg-background relative">
      {/* 토스트 알림 */}
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* 히스토리 모달 */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
      />

      <div className="bg-surface p-6 pb-4 sticky top-0 z-10 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm"
              style={{ backgroundColor: getAvatarColor(userName) }}
            >
              {userName.slice(0, 2)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">메가커피</h2>
              <p className="text-xs text-text-secondary">{groupId}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* 공유 링크 버튼 */}
            <button
              onClick={copyShareLink}
              className="text-text-secondary hover:text-primary p-2 transition"
              title="공유 링크 복사"
            >
              <Link size={20}/>
            </button>
            {/* 히스토리 버튼 */}
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="text-text-secondary hover:text-primary p-2 transition"
              title="주문 히스토리"
            >
              <History size={20}/>
            </button>
            {/* 로그아웃 버튼 */}
            <button
              onClick={handleLogout}
              className="text-text-secondary hover:text-danger p-2 transition"
            >
              <LogOut size={20}/>
            </button>
          </div>
        </div>

        <div className="flex overflow-x-auto space-x-2 no-scrollbar py-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-primary text-white shadow-md transform scale-105'
                  : 'bg-background text-text-secondary hover:bg-gray-200'
              } ${cat === '즐겨찾기' ? 'flex items-center gap-1' : ''}`}
            >
              {cat === '즐겨찾기' && <Heart size={14} fill={selectedCategory === '즐겨찾기' ? 'white' : 'none'} />}
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-32 custom-scrollbar">
        {selectedCategory === '즐겨찾기' && favoriteMenus.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-secondary">
            <Heart size={48} className="mb-4 opacity-30" />
            <p>즐겨찾기한 메뉴가 없어요</p>
            <p className="text-sm mt-1">메뉴 카드의 하트를 눌러 추가해보세요</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {currentMenus.map(menu => (
              <div key={menu.id} className="bg-surface p-4 rounded-2xl shadow-toss flex flex-col items-center transition hover:-translate-y-1 relative group">
                {/* 즐겨찾기 하트 아이콘 */}
                <button
                  onClick={() => toggleFavorite(menu)}
                  className="absolute top-3 right-3 p-1 hover:scale-110 transition"
                >
                  <Heart
                    size={20}
                    className={`${favoriteMenuIds.includes(menu.id) ? 'text-red-500 fill-red-500 heart-pop' : 'text-gray-300 hover:text-red-300'} transition-colors`}
                  />
                </button>

                <div className="text-5xl mb-3">{menu.img}</div>
                <span className="text-[10px] text-primary bg-blue-50 px-2 py-0.5 rounded-full mb-1 font-bold">
                  {menu.categoryLower}
                </span>
                <h3 className="font-bold text-text-primary text-center break-keep mb-1 leading-tight">{menu.name}</h3>
                <p className="text-sm text-primary font-bold mb-3">{menu.price.toLocaleString()}원</p>

                {menu.hasOption ? (
                  <div className="flex w-full gap-2 mt-auto">
                    <button
                      onClick={() => addToCart(menu, 'ICE')}
                      className="flex-1 bg-blue-50 text-blue-500 py-2 rounded-xl text-xs font-bold hover:bg-blue-100 transition active:scale-95"
                    >ICE</button>
                    <button
                      onClick={() => addToCart(menu, 'HOT')}
                      className="flex-1 bg-red-50 text-red-500 py-2 rounded-xl text-xs font-bold hover:bg-red-100 transition active:scale-95"
                    >HOT</button>
                  </div>
                ) : (
                  <button
                      onClick={() => addToCart(menu, 'ONLY')}
                      className="w-full bg-gray-100 text-gray-600 py-2 rounded-xl text-xs font-bold hover:bg-gray-200 transition active:scale-95 mt-auto"
                    >담기</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {!isCartOpen && (
        <button
          onClick={() => setIsCartOpen(true)}
          className="absolute bottom-6 right-6 w-16 h-16 bg-primary rounded-full shadow-lg flex items-center justify-center text-white z-30 hover:bg-primary-dark transition-transform hover:scale-110 active:scale-95 animate-bounce-in"
        >
          <div className="relative">
            <ShoppingCart size={28} />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-danger text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-primary">
                {cart.length}
              </span>
            )}
          </div>
        </button>
      )}

      {isCartOpen && (
        <>
          <div className="absolute inset-0 bg-black/20 z-10" onClick={() => setIsCartOpen(false)}></div>

          <div className="absolute bottom-0 w-full bg-surface rounded-t-toss shadow-toss-up p-6 z-20 animate-slide-up flex flex-col max-h-[60%]">
            <div className="flex justify-center -mt-2 mb-2 cursor-pointer" onClick={() => setIsCartOpen(false)}>
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mb-2"></div>
            </div>

            <div className="flex justify-between items-center mb-4 shrink-0">
              <h3 className="text-lg font-bold flex items-center gap-2 text-text-primary">
                <ShoppingCart size={20} /> 장바구니 <span className="text-primary">{cart.length}</span>
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold text-text-primary">{totalPrice.toLocaleString()}원</span>
                <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <ChevronDown size={24}/>
                </button>
              </div>
            </div>

            <div className="overflow-y-auto space-y-3 mb-4 pr-1 custom-scrollbar flex-1">
              {Object.entries(groupedCart).length === 0 ? (
                <div className="text-text-secondary text-center py-10 bg-background rounded-xl flex flex-col items-center">
                  <p>아직 담긴 메뉴가 없어요.</p>
                </div>
              ) : (
                Object.entries(groupedCart).map(([key, info]) => (
                  <div key={key} className="bg-background p-3 rounded-xl">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-text-primary">{info.menuName}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${info.option === 'ICE' ? 'bg-blue-100 text-blue-600' : info.option === 'HOT' ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-600'}`}>
                                {info.option === 'ONLY' ? '-' : info.option}
                            </span>
                        </div>
                        <span className="font-bold text-text-primary">{(info.price * info.count).toLocaleString()}원</span>
                    </div>

                    <div className="flex justify-between items-end">
                        <div className="flex -space-x-2 overflow-hidden py-1 max-w-[150px]">
                            {info.names.map((name, idx) => (
                                <div
                                    key={idx}
                                    className="w-6 h-6 rounded-full border-2 border-background flex items-center justify-center text-[10px] text-white font-bold"
                                    style={{ backgroundColor: getAvatarColor(name) }}
                                    title={name}
                                >
                                    {name.slice(0,1)}
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200 h-8">
                            <button
                                onClick={() => removeFromCart(info.menuName, info.option)}
                                className="w-8 h-full flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-l-lg disabled:opacity-30"
                                disabled={!info.names.includes(userName)}
                            >
                                <Minus size={14} />
                            </button>
                            <span className="w-8 text-center text-sm font-bold text-text-primary">{info.count}</span>
                            <button
                                onClick={() => addToCart({
                                  id: 0,
                                  categoryUpper: '',
                                  categoryLower: '',
                                  name: info.menuName,
                                  price: info.price,
                                  img: '',
                                  hasOption: info.option !== 'ONLY'
                                }, info.option)}
                                className="w-8 h-full flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-r-lg"
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={clearCart}
              className={`w-full py-4 rounded-xl flex justify-center items-center gap-2 transition font-bold text-lg shrink-0 ${cart.length > 0 ? 'bg-primary text-white hover:bg-primary-dark' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              disabled={cart.length === 0}
            >
              <Trash2 size={20} /> 결제 완료 (비우기)
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default OrderPage;
