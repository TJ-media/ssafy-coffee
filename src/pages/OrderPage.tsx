import React, { useState, useRef, useMemo } from 'react';
import { ShoppingCart, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useOrderLogic } from '../features/order/hooks/useOrderLogic';
import { MEGA_MENUS } from '../menuData';
import MenuGrid from '../features/order/ui/MenuGrid';
import OrderHeader from '../features/order/ui/OrderHeader';
import FlyingBall, { FlyingItem } from '../features/order/ui/FlyingBall';
import CartSheet from '../features/order/ui/CartSheet';
import HistoryModal from '../features/order/ui/HistoryModal';
import RouletteModal from '../features/roulette/ui/RouletteModal';
import SettingsModal from '../features/order/ui/SettingsModal';
import Toast from '../shared/ui/Toast';
import {addToCartApi, updateCartApi} from "../features/order/api/firebaseApi.ts";

const OrderPage = () => {
  const { state, actions } = useOrderLogic();
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] = useState('커피');
  const [selectedSubCategory, setSelectedSubCategory] = useState('전체');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // 👇 설정 모달 상태
  const cartFabRef = useRef<HTMLButtonElement>(null);
  const cartSheetRef = useRef<HTMLDivElement>(null);
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);

  const subCategories = useMemo(() => {
    const menus = MEGA_MENUS.filter(m => m.categoryUpper === selectedCategory);
    const uniqueLowers = Array.from(new Set(menus.map(m => m.categoryLower)));
    return ['전체', ...uniqueLowers];
  }, [selectedCategory]);

  const handleLogout = () => {
    if(confirm('나가시겠습니까?')) {
      localStorage.removeItem('ssafy_groupId');
      localStorage.removeItem('ssafy_userName');
      navigate('/');
    }
  };

  const triggerFlyAnimation = (e: React.MouseEvent, color: string) => {
    const startX = e.clientX;
    const startY = e.clientY;
    let targetX = window.innerWidth - 50;
    let targetY = window.innerHeight - 50;

    const targetEl = state.isCartOpen ? cartSheetRef.current : cartFabRef.current;
    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      targetX = rect.left + rect.width / 2;
      targetY = rect.top + rect.height / 2;
    }

    const animId = Date.now();
    setFlyingItems(prev => [...prev, { id: animId, startX, startY, targetX, targetY, color }]);
    setTimeout(() => setFlyingItems(prev => prev.filter(i => i.id !== animId)), 600);
  };

  const handleAddToCartWrapper = async (e: React.MouseEvent, menu: any, option: any) => {
    triggerFlyAnimation(e, '#3a9df2');
    await actions.addToCartHandler(menu.name, menu.price, option, menu.categoryUpper);
  };

  return (
      <div className="h-full flex flex-col bg-background relative overflow-hidden">
        <Toast toasts={state.toasts} removeToast={actions.removeToast} />

        <style>{`
          @keyframes flyFromCenter {
            0% { transform: translate(-45vw, -35vh) scale(0.3); opacity: 0; animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94); }
            50% { transform: translate(-15vw, -55vh) scale(1.15); opacity: 1; animation-timing-function: cubic-bezier(0.55, 0.085, 0.68, 0.53); }
            100% { transform: translate(0, 0) scale(1); opacity: 1; }
          }
          .animate-fly-from-center { animation: flyFromCenter 0.7s forwards; }
        `}</style>

        <FlyingBall items={flyingItems} />

        <HistoryModal
            isOpen={state.isHistoryOpen}
            onClose={() => { actions.setIsHistoryOpen(false); actions.setEditingHistoryInfo(null); }}
            history={state.history}
            rouletteHistory={state.rouletteHistory}
            groupId={state.groupId || ''}
            userName={state.userName}
            onAddMode={actions.enableHistoryAddMode}
            onDeleteItem={actions.deleteHistoryItem}
        />

        <RouletteModal
            isOpen={state.isRouletteModalOpen}
            onClose={actions.handleCloseRoulette}
            groupId={state.groupId || ''}
            gameState={state.rouletteGame}
            cart={state.cart}
            marbleCounts={state.marbleCounts}
        />

        {/* 👇 설정 모달 */}
        <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            groupId={state.groupId || ''}
        />

        <OrderHeader
            userName={state.userName}
            groupId={state.groupId || ''}
            selectedCategory={selectedCategory}
            selectedSubCategory={selectedSubCategory}
            subCategories={subCategories}
            onSelectCategory={setSelectedCategory}
            onSelectSubCategory={setSelectedSubCategory}
            onCopyLink={() => { navigator.clipboard.writeText(window.location.href); actions.addToast('복사 완료'); }}
            onOpenHistory={() => actions.setIsHistoryOpen(true)}
            onOpenPinball={actions.handleStartRoulette}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onLogout={handleLogout}
        />

        {state.editingHistoryInfo && (
            <div className="bg-primary text-white text-center py-2 text-sm font-bold animate-pulse shadow-md relative z-20">
              ✨ 지난 주문 내역을 수정 중입니다 (메뉴를 터치하세요)
            </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 pb-32 custom-scrollbar">
          <MenuGrid
              selectedCategory={selectedCategory}
              selectedSubCategory={selectedSubCategory}
              favoriteMenuIds={state.favoriteMenuIds}
              onToggleFavorite={actions.toggleFavoriteHandler}
              onAddToCart={handleAddToCartWrapper}
          />
        </div>

        {!state.isCartOpen && (
            <button
                key={state.editingHistoryInfo ? `edit-${state.editingHistoryInfo.animationKey}` : 'cart-fab'}
                ref={cartFabRef}
                onClick={() => {
                  if (state.editingHistoryInfo) actions.setIsHistoryOpen(true);
                  else actions.setIsCartOpen(true);
                }}
                className={`absolute bottom-6 right-6 w-16 h-16 rounded-full shadow-lg flex items-center justify-center text-white z-30 transition-transform active:scale-95 
                  ${state.editingHistoryInfo
                    ? 'bg-indigo-500 hover:bg-indigo-600 animate-fly-from-center'
                    : 'bg-primary hover:bg-primary-dark animate-bounce-in'}`}
            >
              <div className="relative">
                {state.editingHistoryInfo ? <Pencil size={28}/> : <ShoppingCart size={28}/>}
                {(state.editingHistoryInfo ? state.editingHistoryInfo.count : state.cart.length) > 0 && (
                    <span className="absolute -top-2 -right-2 bg-danger text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white">
                {state.editingHistoryInfo ? state.editingHistoryInfo.count : state.cart.length}
              </span>
                )}
              </div>
            </button>
        )}

        {state.isCartOpen && !state.editingHistoryInfo && (
            <CartSheet
                cart={state.cart}
                totalPrice={state.totalPrice}
                userName={state.userName}
                cartFabRef={cartFabRef}
                cartSheetRef={cartSheetRef}
                onRemove={async (name, option) => {
                  const target = state.cart.find(i => i.menuName === name && i.option === option && i.userName === state.userName);
                  if (target && state.groupId) await updateCartApi(state.groupId, state.cart.filter(c => c.id !== target.id));
                }}
                onAdd={async (name, price, option, category) => {
                  if (state.groupId) await addToCartApi(state.groupId, { id: Date.now(), userName: state.userName, menuName: name, price, option, category: category || '' });
                }}
                onClear={async () => {
                  if (confirm('정말 결제 완료하시겠습니까?')) {
                    // 결제 로직
                  }
                }}
                onClose={() => actions.setIsCartOpen(false)}
                onEdit={() => {}}
            />
        )}
      </div>
  );
};

export default OrderPage;