import { useState, useEffect, useMemo, useRef } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import { MEGA_MENUS, CATEGORIES } from '../menuData';
import { Trash2, ShoppingCart, LogOut, ChevronDown, Plus, Minus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CartItem, GroupData, Menu, OptionType, GroupedCartItem } from '../types';
import { getAvatarColor, getTextContrastColor } from '../utils';

// 애니메이션 아이템 타입 정의
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
  
  // 애니메이션 상태 관리
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);
  
  // 장바구니 위치 참조용 Refs
  const cartFabRef = useRef<HTMLButtonElement>(null); // 닫혀있을 때 (동그란 버튼)
  const cartSheetRef = useRef<HTMLDivElement>(null); // 열려있을 때 (시트 상단 아이콘)

  const navigate = useNavigate();
  const groupId = localStorage.getItem('ssafy_groupId');
  const userName = localStorage.getItem('ssafy_userName') || '익명';

  useEffect(() => {
    setSelectedSubCategory('전체');
  }, [selectedCategory]);

  const subCategories = useMemo(() => {
    const menusInUpper = MEGA_MENUS.filter(m => m.categoryUpper === selectedCategory);
    const lowers = Array.from(new Set(menusInUpper.map(m => m.categoryLower)));
    return ['전체', ...lowers];
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
        setCart(currentCart);
        const total = currentCart.reduce((sum, item) => sum + item.price, 0);
        setTotalPrice(total);
      } else {
        alert('모임이 종료되었거나 존재하지 않습니다.');
        navigate('/');
      }
    });
    return () => unsub();
  }, [groupId, userName, navigate]);

  // 애니메이션 트리거 + DB 업데이트 함수
  const handleAddToCart = async (e: React.MouseEvent, menu: Menu, option: OptionType) => {
    if (!groupId || !userName) return;
    if (menu.hasOption && !option) return;

    // 1. 애니메이션 시작 좌표 (클릭 위치)
    const startX = e.clientX;
    const startY = e.clientY;

    // 2. 애니메이션 목표 좌표 (장바구니 위치)
    let targetX = 0;
    let targetY = 0;

    // 장바구니가 열려있으면 시트 상단 아이콘, 닫혀있으면 FAB 버튼을 목표로 설정
    const targetEl = isCartOpen ? cartSheetRef.current : cartFabRef.current;
    
    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      targetX = rect.left + rect.width / 2;
      targetY = rect.top + rect.height / 2;
    } else {
      // fallback (화면 우측 하단)
      targetX = window.innerWidth - 50;
      targetY = window.innerHeight - 50;
    }

    // 3. 나는 아이템 생성 및 상태 추가
    const animId = Date.now();
    setFlyingItems(prev => [...prev, {
      id: animId,
      startX, startY, targetX, targetY,
      color: getAvatarColor(userName)
    }]);

    // 4. 애니메이션 종료 후 상태 제거 (0.6초 뒤)
    setTimeout(() => {
      setFlyingItems(prev => prev.filter(item => item.id !== animId));
    }, 600);

    // 5. 실제 데이터 추가 (DB)
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

  // 장바구니 내부 + 버튼용 (애니메이션 없이 추가)
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

  const clearCart = async () => {
    if (!groupId) return;
    if (confirm('정말 장바구니를 비우시겠습니까? (결제 완료 시 실행)')) {
      const groupRef = doc(db, 'groups', groupId);
      await updateDoc(groupRef, { cart: [] });
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

  return (
    <div className="h-full flex flex-col bg-background relative overflow-hidden">
      {/* 애니메이션 레이어 (최상위) */}
      {flyingItems.map(item => (
        <div
          key={item.id}
          className="fixed w-6 h-6 rounded-full shadow-lg z-50 pointer-events-none transition-all duration-500 ease-in-out"
          style={{
            backgroundColor: item.color,
            left: item.startX,
            top: item.startY,
            // 애니메이션이 마운트된 직후 바로 target 위치로 이동시키기 위해 transform 사용
            transform: `translate(${item.targetX - item.startX}px, ${item.targetY - item.startY}px) scale(0.5)`,
            opacity: 0
          }}
          // React의 ref callback이나 onAnimationEnd 대신, 
          // 렌더링 직후 스타일 변경을 위해 keyframes 애니메이션을 쓰는게 더 확실하지만
          // 간단하게 인라인 스타일 + setTimeout 조합으로 구현 (위 transition이 작동하려면 초기값 -> 변경값이 필요함)
          // 여기서는 CSS Animation Class를 활용하는 방식이 더 부드러움.
        />
      ))}
      
      {/* 실제로 움직이는 공 (CSS Animation 활용 버전) */}
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
            left: item.startX - 16, // 센터 정렬 보정
            top: item.startY - 16,
            // CSS 변수로 목표 거리 전달
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
        {/* 상단바 */}
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
          <button onClick={handleLogout} className="text-text-secondary hover:text-danger p-2 transition">
            <LogOut size={20}/>
          </button>
        </div>
        
        {/* 1차 카테고리 */}
        <div className="flex overflow-x-auto space-x-2 no-scrollbar px-6 pb-2">
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

        {/* 2차 카테고리 */}
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
      </div>

      {/* 메뉴 리스트 */}
      <div className="flex-1 overflow-y-auto p-4 pb-32 custom-scrollbar">
        <div className="grid grid-cols-2 gap-4">
          {MEGA_MENUS
            .filter(m => m.categoryUpper === selectedCategory)
            .filter(m => selectedSubCategory === '전체' || m.categoryLower === selectedSubCategory)
            .map(menu => (
              /* 테두리 제거, 그림자 부활 */
              <div key={menu.id} className="bg-surface p-4 rounded-2xl shadow-toss flex flex-col items-center transition hover:-translate-y-1 relative group">
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
      </div>

      {/* 장바구니 버튼 (FAB) */}
      {!isCartOpen && (
        <button 
          ref={cartFabRef}
          onClick={() => setIsCartOpen(true)}
          className="absolute bottom-6 right-6 w-16 h-16 bg-primary rounded-full shadow-lg flex items-center justify-center text-white z-30 hover:bg-primary-dark transition-transform hover:scale-110 active:scale-95 animate-bounce-in"
        >
          <div className="relative">
            <ShoppingCart size={28} />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-danger text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-surface shadow-sm transition-transform duration-200 transform scale-100 key={cart.length}">
                {cart.length}
              </span>
            )}
          </div>
        </button>
      )}

      {/* 장바구니 시트 */}
      {isCartOpen && (
        <>
          <div className="absolute inset-0 bg-black/20 z-10 backdrop-blur-[2px]" onClick={() => setIsCartOpen(false)}></div>
          
          <div className="absolute bottom-0 w-full bg-surface rounded-t-3xl shadow-toss-up p-6 z-20 animate-slide-up flex flex-col max-h-[60%]">
            <div className="flex justify-center -mt-2 mb-2 cursor-pointer" onClick={() => setIsCartOpen(false)}>
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mb-2"></div>
            </div>
            
            <div className="flex justify-between items-center mb-4 shrink-0">
              {/* 장바구니 아이콘 Ref 추가 (열려있을 때 타겟) */}
              <div ref={cartSheetRef}> 
                <h3 className="text-lg font-bold flex items-center gap-2 text-text-primary">
                  <ShoppingCart size={20} /> 장바구니 <span className="text-primary">{cart.length}</span>
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold text-text-primary">{totalPrice.toLocaleString()}원</span>
                <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <ChevronDown size={24}/>
                </button>
              </div>
            </div>

            <div className="overflow-y-auto space-y-3 mb-4 pr-1 custom-scrollbar flex-1">
              {Object.entries(groupedCart).length === 0 ? (
                <div className="text-text-secondary text-center py-10 bg-background rounded-xl border border-dashed border-gray-300 flex flex-col items-center">
                  <p>아직 담긴 메뉴가 없어요.</p>
                </div>
              ) : (
                Object.entries(groupedCart).map(([key, info]) => (
                  <div key={key} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-text-primary">{info.menuName}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${info.option === 'ICE' ? 'bg-blue-100 text-blue-800' : info.option === 'HOT' ? 'bg-red-100 text-red-800' : 'bg-gray-200 text-gray-800'}`}>
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
                                    className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold shadow-sm"
                                    style={{ backgroundColor: getAvatarColor(name), color: getTextContrastColor() }}
                                    title={name}
                                >
                                    {name.slice(0,1)}
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center bg-white rounded-lg border border-gray-200 h-8 overflow-hidden shadow-sm">
                            <button 
                                onClick={() => removeFromCart(info.menuName, info.option)}
                                className="w-8 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:bg-gray-50"
                                disabled={!info.names.includes(userName)} 
                            >
                                <Minus size={14} />
                            </button>
                            <span className="w-8 text-center text-sm font-bold text-text-primary">{info.count}</span>
                            {/* 장바구니 내부에서 추가할 땐 애니메이션 없이 바로 추가 */}
                            <button 
                                onClick={() => addByPlusButton(info.menuName, info.price, info.option)}
                                className="w-8 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50"
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
              className={`w-full py-4 rounded-xl flex justify-center items-center gap-2 transition font-bold text-lg shrink-0 ${cart.length > 0 ? 'bg-primary text-white shadow-lg hover:bg-primary-dark' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
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