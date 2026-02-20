import React, { useState, useRef, useMemo, useEffect } from 'react';
import { ShoppingCart, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useOrderLogic } from '../features/order/hooks/useOrderLogic';
import { useMenuData } from '../features/menu/hooks/useMenuData';
import { useMenuSearch } from '../features/order/hooks/useMenuSearch';
import MenuGrid from '../features/order/ui/MenuGrid';
import MenuOptionModal from '../features/order/ui/MenuOptionModal';
import OrderHeader from '../features/order/ui/OrderHeader';
import FlyingBall, { FlyingItem } from '../features/order/ui/FlyingBall';
import CartSheet from '../features/order/ui/CartSheet';
import HistoryModal from '../features/order/ui/HistoryModal';
import RouletteModal from '../features/roulette/ui/RouletteModal';
import SettingsModal from '../features/order/ui/SettingsModal';
import SearchBar from '../features/order/ui/SearchBar';
import Toast from '../shared/ui/Toast';
import { updateHistoryApi, updateCartApi, addToCartApi, createInviteTokenApi } from '../features/order/api/firebaseApi';
import { OrderHistory, RouletteHistory, HistoryItem, Menu, OptionType } from '../shared/types';

const OrderPage = () => {
    const { state, actions } = useOrderLogic();
    const { menus: allMenus, categories } = useMenuData();
    const navigate = useNavigate();
    const { searchQuery, setSearchQuery, isSearchMode, setIsSearchMode, searchResults, convertedQuery, clearSearch } = useMenuSearch(allMenus);

    const [selectedCategory, setSelectedCategory] = useState('커피');
    const [selectedSubCategory, setSelectedSubCategory] = useState('전체');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const cartFabRef = useRef<HTMLButtonElement>(null);
    const cartSheetRef = useRef<HTMLDivElement>(null);
    const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);
    const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
    const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);

    useEffect(() => {
        if (selectedCategory === '메뉴 추가') {
            setSelectedSubCategory('직접 입력');
        } else {
            setSelectedSubCategory('전체');
        }
    }, [selectedCategory]);

    const subCategories = useMemo(() => {
        if (selectedCategory === '메뉴 추가') {
            return ['직접 입력', '최근 기록', '메뉴 신청'];
        }

        const filtered = allMenus.filter(m => m.categoryUpper === selectedCategory);
        const uniqueLowers = Array.from(new Set(filtered.map(m => m.categoryLower)));
        return ['전체', ...uniqueLowers];
    }, [selectedCategory, allMenus]);

    // Firestore 메뉴에서 '추가' 카테고리 아이템만 필터 (MenuOptionModal용)
    const addonMenus = useMemo(() => {
        return allMenus.filter(m => m.categoryUpper === '추가');
    }, [allMenus]);

    const handleLogout = () => {
        if (confirm('나가시겠습니까?')) {
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

    // 👈 모달에서 담기 시 호출되는 핸들러
    const handleModalAddToCart = async (e: React.MouseEvent, menuName: string, price: number, option: OptionType, category: string) => {
        triggerFlyAnimation(e, '#3a9df2');
        await actions.addToCartHandler(menuName, price, option, category);
    };

    // 👈 메뉴 카드 클릭 시 모달 열기
    const handleMenuSelect = (menu: Menu) => {
        setSelectedMenu(menu);
        setIsMenuModalOpen(true);
    };

    const handleHistoryAddMode = (historyId: string, type: 'normal' | 'roulette') => {
        const isNormal = type === 'normal';
        const targetList = isNormal ? state.history : state.rouletteHistory;
        const targetObj = targetList.find(h => h.id === historyId);
        let currentCount = 0;
        if (targetObj) {
            // @ts-ignore
            const items = isNormal ? targetObj.items : targetObj.orderItems;
            currentCount = items ? items.reduce((sum: number, i: any) => sum + i.count, 0) : 0;
        }
        actions.setEditingHistoryInfo({
            id: historyId, type, count: currentCount, animationKey: Date.now()
        });
        actions.setIsHistoryOpen(false);
        actions.setIsCartOpen(false);
        actions.addToast('메뉴를 선택하면 바로 추가됩니다!', 'success');
    };

    const handleDeleteItem = async (historyId: string, type: 'normal' | 'roulette', index: number, targetUser?: string) => {
        if (!state.groupId) return;
        const isNormal = type === 'normal';
        const list = isNormal ? state.history : state.rouletteHistory;
        const targetIdx = list.findIndex(h => h.id === historyId);
        if (targetIdx === -1) return;

        const targetHistory = { ...list[targetIdx] };
        // @ts-ignore
        const items = isNormal ? targetHistory.items : targetHistory.orderItems;
        const item = items[index];

        if (targetUser) {
            const userIdx = item.orderedBy.indexOf(targetUser);
            if (userIdx > -1) {
                item.orderedBy.splice(userIdx, 1);
                item.count -= 1;
                targetHistory.totalPrice -= item.price;
            }
        } else {
            targetHistory.totalPrice -= (item.price * item.count);
            item.count = 0;
        }

        // @ts-ignore
        if (isNormal) targetHistory.items = items.filter((i: any) => i.count > 0);
        else { // @ts-ignore
            targetHistory.orderItems = items.filter((i: any) => i.count > 0);
        }

        const updatedList = list.map((h, i) => i === targetIdx ? targetHistory : h);

        if (isNormal) {
            await updateHistoryApi(state.groupId, updatedList as OrderHistory[], 'normal');
        } else {
            await updateHistoryApi(state.groupId, updatedList as RouletteHistory[], 'roulette');
        }

        actions.addToast('삭제되었습니다');
    };

    // 👇 주문 완료 핸들러: 카트를 OrderHistory로 변환 후 저장, 카트 비움
    const handleOrderComplete = async () => {
        if (!state.groupId || state.cart.length === 0) return;
        if (!confirm('정말 주문을 완료하시겠습니까?')) return;

        try {
            // 카트 아이템을 HistoryItem 형태로 그룹화
            const itemMap: Record<string, HistoryItem> = {};
            state.cart.forEach(cartItem => {
                const key = `${cartItem.menuName}_${cartItem.option}`;
                if (!itemMap[key]) {
                    itemMap[key] = {
                        menuName: cartItem.menuName,
                        option: cartItem.option,
                        price: cartItem.price,
                        count: 0,
                        orderedBy: []
                    };
                }
                itemMap[key].count += 1;
                itemMap[key].orderedBy.push(cartItem.userName);
            });

            const historyItems = Object.values(itemMap);
            const participants = [...new Set(state.cart.map(c => c.userName))];

            const newHistory: OrderHistory = {
                id: Date.now().toString(),
                orderedAt: new Date(),
                totalPrice: state.totalPrice,
                totalItems: state.cart.length,
                items: historyItems,
                participants,
                winner: null
            };

            const updatedHistory = [newHistory, ...state.history];
            await updateHistoryApi(state.groupId, updatedHistory, 'normal');
            await updateCartApi(state.groupId, []);

            actions.setIsCartOpen(false);
            actions.addToast('주문이 완료되었습니다!', 'success');
        } catch (e) {
            console.error('주문 완료 실패:', e);
            actions.addToast('주문 완료에 실패했습니다.', 'warning');
        }
    };

    // 👇 결제자 업데이트 핸들러
    const handleUpdateWinner = async (historyId: string, type: 'normal' | 'roulette', winner: string) => {
        if (!state.groupId) return;
        const isNormal = type === 'normal';
        const list = isNormal ? [...state.history] : [...state.rouletteHistory];
        const targetIdx = list.findIndex(h => h.id === historyId);
        if (targetIdx === -1) return;

        const updated = { ...list[targetIdx], winner };
        list[targetIdx] = updated;

        if (isNormal) {
            await updateHistoryApi(state.groupId, list as OrderHistory[], 'normal');
        } else {
            await updateHistoryApi(state.groupId, list as RouletteHistory[], 'roulette');
        }
        actions.addToast(`${winner}님이 결제자로 지정되었습니다.`, 'success');
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
                onAddMode={handleHistoryAddMode}
                onDeleteItem={handleDeleteItem}
                onUpdateWinner={handleUpdateWinner}
            />

            <RouletteModal
                isOpen={state.isRouletteModalOpen}
                onClose={actions.handleCloseRoulette}
                groupId={state.groupId || ''}
                participants={state.rouletteGame?.participants || []}
                gameState={state.rouletteGame}
                cart={state.cart}
                marbleCounts={state.marbleCounts}
            />

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
                categories={categories}
                onSelectCategory={setSelectedCategory}
                onSelectSubCategory={setSelectedSubCategory}
                onCopyLink={async () => {
                    const token = await createInviteTokenApi(state.groupId || '', state.password);
                    const inviteUrl = `${window.location.origin}/?invite=${token}`;
                    navigator.clipboard.writeText(inviteUrl);
                    actions.addToast('초대 링크가 복사되었습니다!', 'success');
                }}
                onOpenHistory={() => actions.setIsHistoryOpen(true)}
                onOpenPinball={actions.handleStartRoulette}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onLogout={handleLogout}
                onToggleSearch={() => {
                    if (isSearchMode) {
                        clearSearch();
                    } else {
                        setIsSearchMode(true);
                    }
                }}
                isSearchMode={isSearchMode}
            />

            {state.editingHistoryInfo && (
                <div className="bg-primary text-white text-center py-2 text-sm font-bold animate-pulse shadow-md relative z-20">
                    ✨ 지난 주문 내역을 수정 중입니다 (메뉴를 터치하세요)
                </div>
            )}

            <MenuOptionModal
                isOpen={isMenuModalOpen}
                menu={selectedMenu}
                addonMenus={addonMenus}
                onClose={() => { setIsMenuModalOpen(false); setSelectedMenu(null); }}
                onAddToCart={handleModalAddToCart}
            />

            {isSearchMode && (
                <SearchBar
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    convertedQuery={convertedQuery}
                    searchResults={searchResults}
                    onMenuSelect={(menu) => {
                        handleMenuSelect(menu);
                    }}
                    onClose={clearSearch}
                />
            )}

            {!isSearchMode && (
                <div className="flex-1 overflow-y-auto p-4 pb-32 custom-scrollbar">
                    <MenuGrid
                        selectedCategory={selectedCategory}
                        selectedSubCategory={selectedSubCategory}
                        favoriteMenuIds={state.favoriteMenuIds}
                        onToggleFavorite={actions.toggleFavoriteHandler}
                        onAddToCart={handleAddToCartWrapper}
                        onMenuSelect={handleMenuSelect}
                        menus={allMenus}
                        customMenus={state.myCustomMenus}
                        onSaveCustomMenu={actions.saveCustomMenuHandler}
                        onDeleteCustomMenu={actions.deleteCustomMenuHandler}
                        groupId={state.groupId || ''}
                        userName={state.userName}
                    />
                </div>
            )}

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
                        {state.editingHistoryInfo ? <Pencil size={28} /> : <ShoppingCart size={28} />}
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
                    onClear={handleOrderComplete}
                    onClose={() => actions.setIsCartOpen(false)}
                    onEdit={() => { }}
                />
            )}
        </div>
    );
};

export default OrderPage;