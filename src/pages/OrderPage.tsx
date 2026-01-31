import { useRef, useMemo } from 'react'; // React 제거됨
import { useOrderLogic } from '../hooks/useOrderLogic';

// 분리된 컴포넌트들 임포트
import OrderHeader from '../components/order/OrderHeader';
import MenuGrid from '../components/order/MenuGrid';
import CartSheet from '../components/order/CartSheet';
import FlyingBall from '../components/order/FlyingBall';
import Toast from '../components/Toast';
import HistoryModal from '../components/HistoryModal';
import PinballModal from '../components/pinball/PinballModal';

const OrderPage = () => {
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