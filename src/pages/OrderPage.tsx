import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import { MEGA_MENUS, CATEGORIES } from '../menuData';
import { Trash2, ShoppingCart, LogOut, ChevronDown, Plus, Minus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CartItem, GroupData, Menu, OptionType, GroupedCartItem } from '../types';
import { getAvatarColor } from '../utils';

const OrderPage = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('커피');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(true);
  
  const navigate = useNavigate();
  const groupId = localStorage.getItem('ssafy_groupId');
  const userName = localStorage.getItem('ssafy_userName') || '익명';

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
        
        // price가 이제 숫자이므로 바로 더하면 됨
        const total = currentCart.reduce((sum, item) => sum + item.price, 0);
        setTotalPrice(total);
      } else {
        alert('모임이 종료되었거나 존재하지 않습니다.');
        navigate('/');
      }
    });
    return () => unsub();
  }, [groupId, userName, navigate]);

  const addToCart = async (menu: Menu, option: OptionType) => {
    if (!groupId || !userName) return;
    if (menu.hasOption && !option) return;

    const finalOption = menu.hasOption ? option : 'ONLY';
    
    const newItem: CartItem = {
      id: Date.now(),
      userName: userName,
      menuName: menu.name,
      price: menu.price, // 숫자 그대로 사용
      option: finalOption,
      category: menu.categoryUpper // 대분류 저장
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
    <div className="h-full flex flex-col bg-background relative">
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
          <button onClick={handleLogout} className="text-text-secondary hover:text-danger p-2 transition">
            <LogOut size={20}/>
          </button>
        </div>
        
        <div className="flex overflow-x-auto space-x-2 no-scrollbar py-1">
          {CATEGORIES.map(cat => (
            <button 
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-primary text-white shadow-md transform scale-105' : 'bg-background text-text-secondary hover:bg-gray-200'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-32 custom-scrollbar">
        <div className="grid grid-cols-2 gap-4">
          {/* categoryUpper로 필터링 */}
          {MEGA_MENUS.filter(m => m.categoryUpper === selectedCategory).map(menu => (
            <div key={menu.id} className="bg-surface p-4 rounded-2xl shadow-toss flex flex-col items-center transition hover:-translate-y-1 relative group">
              <div className="text-5xl mb-3">{menu.img}</div>
              {/* 소분류 배지 추가 */}
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
                            {/* 장바구니에서 추가할 때 필요한 가짜 메뉴 객체 생성 (기존 정보 활용) */}
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