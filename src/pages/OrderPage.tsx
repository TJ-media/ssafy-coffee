import React, { useRef, useMemo } from 'react';
import { useOrderLogic } from '../hooks/useOrderLogic';
import OrderHeader from '../components/order/OrderHeader';
import MenuGrid from '../components/order/MenuGrid';
import CartSheet from '../components/order/CartSheet';
import FlyingBall from '../components/order/FlyingBall';
import Toast from '../components/Toast';
import HistoryModal from '../components/HistoryModal';
import PinballModal from '../components/pinball/PinballModal';
import MarbleRaceModal from '../components/game/MarbleRaceModal'; // import 확인 필요

const OrderPage = () => {
  // 1. 커스텀 훅에서 모든 로직과 상태를 가져옵니다.
  const logic = useOrderLogic();
  
  // 2. 장바구니 애니메이션 타겟을 위한 Ref
  const cartFabRef = useRef<HTMLButtonElement>(null);
  const cartSheetRef = useRef<HTMLDivElement>(null);

  // 3. 레이스 참여자 목록 계산
  const raceParticipants = useMemo(() => {
    return [...new Set(logic.cart.map(item => item.userName))];
  }, [logic.cart]);

  // 4. 공유 링크 복사 핸들러
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
      {/* --- 기능성 컴포넌트 (UI 없음/오버레이) --- */}
      <FlyingBall items={logic.flyingItems} />
      <Toast toasts={logic.toasts} removeToast={logic.removeToast} />
      
      <HistoryModal 
        isOpen={logic.isHistoryOpen} 
        onClose={() => logic.setIsHistoryOpen(false)} 
        history={logic.history} 
      />
      
      <PinballModal 
        isOpen={logic.isPinballOpen} 
        onClose={() => logic.setIsPinballOpen(false)} 
        groupId={logic.groupId || ''}
        participants={[...new Set(logic.cart.map(i => i.userName))]}
        gameState={logic.pinballGame}
      />

      <MarbleRaceModal 
        isOpen={logic.isRaceOpen}
        onClose={() => logic.setIsRaceOpen(false)}
        participants={raceParticipants}
      />

      {/* --- 메인 UI 영역 --- */}
      
      {/* 1. 상단 헤더 */}
      <OrderHeader 
        groupId={logic.groupId || ''}
        userName={logic.userName}
        selectedCategory={logic.selectedCategory}
        setSelectedCategory={logic.setSelectedCategory}
        selectedSubCategory={logic.selectedSubCategory}
        setSelectedSubCategory={logic.setSelectedSubCategory}
        onOpenHistory={() => logic.setIsHistoryOpen(true)}
        onOpenPinball={() => logic.setIsPinballOpen(true)}
        onOpenRace={() => {
           if (raceParticipants.length < 2) {
             logic.addToast('최소 2명 이상이 필요해요!', 'warning');
             return;
           }
           logic.setIsRaceOpen(true);
        }}
        onCopyLink={handleCopyLink}
      />

      {/* 2. 메뉴 그리드 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <MenuGrid 
          selectedCategory={logic.selectedCategory}
          selectedSubCategory={logic.selectedSubCategory}
          favoriteMenuIds={logic.favoriteMenuIds}
          onToggleFavorite={logic.toggleFavorite}
          onAddToCart={(e, menu, option) => {
             // 장바구니 열림 여부에 따라 타겟 결정
             const target = cartSheetRef.current || cartFabRef.current;
             logic.addToCart(e, menu.name, menu.price, option, menu.categoryUpper, target);
          }}
        />
      </div>

      {/* 3. 하단 장바구니 */}
      <CartSheet 
        cart={logic.cart}
        totalPrice={logic.totalPrice}
        userName={logic.userName}
        cartFabRef={cartFabRef}
        cartSheetRef={cartSheetRef}
        onRemove={logic.removeFromCart}
        onAdd={(name, price, opt) => logic.addToCart(null, name, price, opt, '', null)}
        onClear={logic.clearCart}
      />
    </div>
  );
};

export default OrderPage;