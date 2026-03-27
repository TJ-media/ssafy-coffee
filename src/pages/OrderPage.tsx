import React, { useState, useRef, useMemo, useEffect } from 'react';
import { ShoppingCart, Pencil, X, ExternalLink, Copy, Check, Smartphone, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useOrderInitialize } from '../features/order/hooks/useOrderLogic';
import { useOrderStore } from '../features/order/store/useOrderStore';
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
import { updateHistoryApi, updateCartApi, addToCartApi, createInviteTokenApi, changeCafeApi } from '../features/order/api/firebaseApi';
import { OrderHistory, RouletteHistory, HistoryItem, Menu, OptionType, GroupedCartItem } from '../shared/types';
import { CAFE_LIST } from '../menuData';
import { getCafeTheme } from '../shared/config/cafeTheme';
import { useLayoutStore } from '../shared/store/useLayoutStore';
import { CAFE_DEEP_LINKS } from '../shared/config/cafeDeepLinks';

const OrderPage = () => {
    // 1. Firebase 실시간 구독 생명주기 연결
    useOrderInitialize();

    const selectedCafe = useOrderStore(state => state.selectedCafe);
    const { menus: allMenus, categories } = useMenuData(selectedCafe);
    const navigate = useNavigate();
    const { searchQuery, setSearchQuery, isSearchMode, setIsSearchMode, searchResults, convertedQuery, clearSearch } = useMenuSearch(allMenus);
    const cafeTheme = getCafeTheme(selectedCafe);

    // 2. Zustand 선택적 구독 (Selector를 통해 필요한 상태만 개별 구독하여 렌더링 방어)
    const groupId = useOrderStore(state => state.groupId);
    const userName = useOrderStore(state => state.userName);
    const cart = useOrderStore(state => state.cart);
    const totalPrice = useOrderStore(state => state.totalPrice);
    const history = useOrderStore(state => state.history);
    const rouletteHistory = useOrderStore(state => state.rouletteHistory);
    const rouletteGame = useOrderStore(state => state.rouletteGame);
    const marbleCounts = useOrderStore(state => state.marbleCounts);
    const toasts = useOrderStore(state => state.toasts);
    const favoriteMenuIds = useOrderStore(state => state.favoriteMenuIds);
    const isCartOpen = useOrderStore(state => state.isCartOpen);
    const isHistoryOpen = useOrderStore(state => state.isHistoryOpen);
    const editingHistoryInfo = useOrderStore(state => state.editingHistoryInfo);
    const isRouletteModalOpen = useOrderStore(state => state.isRouletteModalOpen);
    const myCustomMenus = useOrderStore(state => state.myCustomMenus);
    const password = useOrderStore(state => state.password);

    // 액션들 (함수는 레퍼런스가 변하지 않으므로 리렌더링을 유발하지 않음)
    const setIsCartOpen = useOrderStore(state => state.setIsCartOpen);
    const setIsHistoryOpen = useOrderStore(state => state.setIsHistoryOpen);
    const setEditingHistoryInfo = useOrderStore(state => state.setEditingHistoryInfo);
    const addToast = useOrderStore(state => state.addToast);
    const removeToast = useOrderStore(state => state.removeToast);
    const toggleFavoriteHandler = useOrderStore(state => state.toggleFavoriteHandler);
    const addToCartHandler = useOrderStore(state => state.addToCartHandler);
    const handleCloseRoulette = useOrderStore(state => state.handleCloseRoulette);
    const handleStartRoulette = useOrderStore(state => state.handleStartRoulette);
    const saveCustomMenuHandler = useOrderStore(state => state.saveCustomMenuHandler);
    const deleteCustomMenuHandler = useOrderStore(state => state.deleteCustomMenuHandler);

    // 3. 페이지 내부 컴포넌트 상태
    const [selectedCategory, setSelectedCategory] = useState('메뉴 추가');
    const [selectedSubCategory, setSelectedSubCategory] = useState('직접 입력');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const cartFabRef = useRef<HTMLButtonElement>(null);
    const cartSheetRef = useRef<HTMLDivElement>(null);
    const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);
    const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
    const [selectedInitialOption, setSelectedInitialOption] = useState<OptionType | undefined>(undefined);
    const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);

    // 카페 변경 관련 상태
    const [isCafeSelectOpen, setIsCafeSelectOpen] = useState(false);
    const [pendingCafe, setPendingCafe] = useState<string | null>(null);
    const [isCafeConfirmOpen, setIsCafeConfirmOpen] = useState(false);

    // 주문 완료 통합 모달 상태
    const [orderModalStep, setOrderModalStep] = useState<null | 'confirm' | 'redirect'>(null);
    const [orderRedirectItems, setOrderRedirectItems] = useState<GroupedCartItem[]>([]);
    const [orderRedirectTotal, setOrderRedirectTotal] = useState(0);
    const [orderRedirectCopied, setOrderRedirectCopied] = useState(false);
    const [pendingHistory, setPendingHistory] = useState<OrderHistory | null>(null);
    const isDesktopDevice = useLayoutStore(state => state.isDesktopDevice);

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

        const targetEl = isCartOpen ? cartSheetRef.current : cartFabRef.current;
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
        await addToCartHandler(menu.name, menu.price, option, menu.categoryUpper);
    };

    const handleModalAddToCart = async (e: React.MouseEvent, menuName: string, price: number, option: OptionType, category: string) => {
        triggerFlyAnimation(e, '#3a9df2');
        await addToCartHandler(menuName, price, option, category);
    };

    const handleMenuSelect = (menu: Menu, initialOption?: OptionType) => {
        setSelectedMenu(menu);
        setSelectedInitialOption(initialOption);
        setIsMenuModalOpen(true);
    };

    const handleHistoryAddMode = (historyId: string, type: 'normal' | 'roulette') => {
        const isNormal = type === 'normal';
        const targetList = isNormal ? history : rouletteHistory;
        const targetObj = targetList.find(h => h.id === historyId);
        let currentCount = 0;
        if (targetObj) {
            // @ts-ignore
            const items = isNormal ? targetObj.items : targetObj.orderItems;
            currentCount = items ? items.reduce((sum: number, i: any) => sum + i.count, 0) : 0;
        }
        setEditingHistoryInfo({
            id: historyId, type, count: currentCount, animationKey: Date.now()
        });
        setIsHistoryOpen(false);
        setIsCartOpen(false);
        addToast('메뉴를 선택하면 바로 추가됩니다!', 'success');
    };

    const handleDeleteItem = async (historyId: string, type: 'normal' | 'roulette', index: number, targetUser?: string) => {
        if (!groupId) return;
        const isNormal = type === 'normal';
        const list = isNormal ? history : rouletteHistory;
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
            await updateHistoryApi(groupId, updatedList as OrderHistory[], 'normal');
        } else {
            await updateHistoryApi(groupId, updatedList as RouletteHistory[], 'roulette');
        }

        addToast('삭제되었습니다');
    };

    const buildOrderText = (name: string, items: GroupedCartItem[], total: number) => [
        `[${name}] 주문 목록`,
        ...items.map(item => `- ${item.menuName}${item.option !== 'ONLY' ? ` (${item.option})` : ''} x${item.count}`),
        `총 ${items.reduce((s, i) => s + i.count, 0)}잔 / ${total.toLocaleString()}원`,
    ].join('\n');

    const copyText = async (text: string) => {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                const el = document.createElement('textarea');
                el.value = text; el.style.position = 'fixed'; el.style.left = '-9999px';
                document.body.appendChild(el); el.select(); document.execCommand('copy');
                document.body.removeChild(el);
            }
            return true;
        } catch { return false; }
    };

    const handleOrderComplete = () => {
        if (!groupId || cart.length === 0) return;
        setOrderModalStep('confirm');
    };

    const executeOrderComplete = async (openRedirect: boolean) => {
        if (!groupId || cart.length === 0) return;

        const itemMap: Record<string, HistoryItem> = {};
        cart.forEach(cartItem => {
            const key = `${cartItem.menuName}_${cartItem.option}`;
            if (!itemMap[key]) {
                itemMap[key] = { menuName: cartItem.menuName, option: cartItem.option, price: cartItem.price, count: 0, orderedBy: [] };
            }
            itemMap[key].count += 1;
            itemMap[key].orderedBy.push(cartItem.userName);
        });

        const historyItems = Object.values(itemMap);
        const participants = [...new Set(cart.map(c => c.userName))];
        const snapshotItems: GroupedCartItem[] = historyItems.map(item => ({
            menuName: item.menuName, option: item.option, price: item.price, count: item.count, names: item.orderedBy,
        }));
        const snapshotTotal = totalPrice;
        const cafeName = CAFE_LIST.find(c => c.id === selectedCafe)?.name ?? '';

        const newHistory: OrderHistory = {
            id: Date.now().toString(), orderedAt: new Date(),
            totalPrice: snapshotTotal, totalItems: cart.length,
            items: historyItems, participants, winner: null, cafeName,
        };

        setIsCartOpen(false);
        if (openRedirect) {
            // 리다이렉트 단계로 즉시 전환 — Firebase 쓰기는 finalizeOrder에서 처리
            setOrderRedirectItems(snapshotItems);
            setOrderRedirectTotal(snapshotTotal);
            setPendingHistory(newHistory);
            setOrderModalStep('redirect');
            copyText(buildOrderText(cafeName, snapshotItems, snapshotTotal)).then(ok => setOrderRedirectCopied(ok));
        } else {
            // 기록만 할게요 — 즉시 저장
            setOrderModalStep(null);
            try {
                await Promise.all([
                    updateHistoryApi(groupId, [newHistory, ...history], 'normal'),
                    updateCartApi(groupId, []),
                ]);
                addToast('주문이 완료되었습니다!', 'success');
            } catch (e) {
                console.error('주문 완료 실패:', e);
                addToast('주문 완료에 실패했습니다.', 'warning');
            }
        }
    };

    const handleRedirectCopy = async () => {
        const cafeName = CAFE_LIST.find(c => c.id === selectedCafe)?.name ?? '';
        const ok = await copyText(buildOrderText(cafeName, orderRedirectItems, orderRedirectTotal));
        if (ok) setOrderRedirectCopied(true);
    };

    const finalizeOrder = async () => {
        const saved = pendingHistory;
        setOrderModalStep(null);
        setPendingHistory(null);
        if (!groupId || !saved) return;
        try {
            await Promise.all([
                updateHistoryApi(groupId, [saved, ...history], 'normal'),
                updateCartApi(groupId, []),
            ]);
            addToast('주문이 완료되었습니다!', 'success');
        } catch (e) {
            console.error('주문 완료 실패:', e);
            addToast('주문 완료에 실패했습니다.', 'warning');
        }
    };

    const handleRedirectOpenApp = () => {
        const deepLink = CAFE_DEEP_LINKS[selectedCafe];
        if (!deepLink) return;
        handleRedirectCopy();
        finalizeOrder();
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const appUrl = isIOS ? deepLink.ios : deepLink.android;
        const fallbackUrl = isIOS ? deepLink.fallback.ios : deepLink.fallback.android;
        let appOpened = false;
        const onVis = () => { if (document.hidden) appOpened = true; };
        document.addEventListener('visibilitychange', onVis);
        window.location.href = appUrl;
        setTimeout(() => {
            document.removeEventListener('visibilitychange', onVis);
            if (!appOpened) window.open(fallbackUrl, '_blank');
        }, 3000);
    };

    const handleUpdateWinner = async (historyId: string, type: 'normal' | 'roulette', winner: string) => {
        if (!groupId) return;
        const isNormal = type === 'normal';
        const list = isNormal ? [...history] : [...rouletteHistory];
        const targetIdx = list.findIndex(h => h.id === historyId);
        if (targetIdx === -1) return;

        const updated = { ...list[targetIdx], winner };
        list[targetIdx] = updated;

        if (isNormal) {
            await updateHistoryApi(groupId, list as OrderHistory[], 'normal');
        } else {
            await updateHistoryApi(groupId, list as RouletteHistory[], 'roulette');
        }
        addToast(`${winner}님이 결제자로 지정되었습니다.`, 'success');
    };

    const handleAddItemToHistory = async (historyId: string, type: 'normal' | 'roulette', index: number) => {
        if (!groupId) return;
        const isNormal = type === 'normal';
        const list = isNormal ? [...history] : [...rouletteHistory];
        const targetIdx = list.findIndex(h => h.id === historyId);
        if (targetIdx === -1) return;

        const targetHistory = { ...list[targetIdx] };
        // @ts-ignore
        const items = isNormal ? [...targetHistory.items] : [...targetHistory.orderItems];
        const item = { ...items[index] };

        item.orderedBy = [...item.orderedBy, userName];
        item.count += 1;
        targetHistory.totalPrice = (targetHistory.totalPrice || 0) + item.price;
        items[index] = item;

        // @ts-ignore
        if (isNormal) targetHistory.items = items;
        else { // @ts-ignore
            targetHistory.orderItems = items;
        }

        const updatedList = list.map((h, i) => i === targetIdx ? targetHistory : h);

        if (isNormal) {
            await updateHistoryApi(groupId, updatedList as OrderHistory[], 'normal');
        } else {
            await updateHistoryApi(groupId, updatedList as RouletteHistory[], 'roulette');
        }
        addToast('메뉴가 추가되었습니다.', 'success');
    };

    return (
        <div className="h-full flex flex-col bg-background relative overflow-hidden">
            <Toast toasts={toasts} removeToast={removeToast} />

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
                isOpen={isHistoryOpen}
                onClose={() => { setIsHistoryOpen(false); setEditingHistoryInfo(null); }}
                history={history}
                rouletteHistory={rouletteHistory}
                groupId={groupId || ''}
                userName={userName}
                onAddMode={handleHistoryAddMode}
                onDeleteItem={handleDeleteItem}
                onUpdateWinner={handleUpdateWinner}
                onAddItem={handleAddItemToHistory}
            />

            <RouletteModal
                isOpen={isRouletteModalOpen}
                onClose={handleCloseRoulette}
                groupId={groupId || ''}
                participants={rouletteGame?.participants || []}
                gameState={rouletteGame}
                cart={cart}
                marbleCounts={marbleCounts}
                selectedCafe={selectedCafe}
            />

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                groupId={groupId || ''}
            />

            <OrderHeader
                userName={userName}
                groupId={groupId || ''}
                selectedCategory={selectedCategory}
                selectedSubCategory={selectedSubCategory}
                subCategories={subCategories}
                categories={categories}
                onSelectCategory={setSelectedCategory}
                onSelectSubCategory={setSelectedSubCategory}
                onCopyLink={async () => {
                    try {
                        const token = await createInviteTokenApi(groupId || '', password);
                        const inviteUrl = `${window.location.origin}/?invite=${token}`;
                        if (navigator.clipboard && window.isSecureContext) {
                            await navigator.clipboard.writeText(inviteUrl);
                        } else {
                            // 폴백: textarea를 이용한 복사
                            const textarea = document.createElement('textarea');
                            textarea.value = inviteUrl;
                            textarea.style.position = 'fixed';
                            textarea.style.left = '-9999px';
                            document.body.appendChild(textarea);
                            textarea.select();
                            document.execCommand('copy');
                            document.body.removeChild(textarea);
                        }
                        addToast('초대 링크가 복사되었습니다!', 'success');
                    } catch (err) {
                        console.error('링크 복사 실패:', err);
                        addToast('링크 복사에 실패했습니다.', 'warning');
                    }
                }}
                onOpenHistory={() => setIsHistoryOpen(true)}
                onOpenPinball={handleStartRoulette}
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
                selectedCafe={selectedCafe}
                onChangeCafe={() => setIsCafeSelectOpen(true)}
            />

            {editingHistoryInfo && (
                <div className="bg-primary text-white text-center py-2 text-sm font-bold shadow-md relative z-20 flex items-center justify-center">
                    <span className="flex-1">✨ 지난 주문 내역을 수정 중입니다 (메뉴를 터치하세요)</span>
                    <button
                        onClick={() => {
                            setEditingHistoryInfo(null);
                            setIsHistoryOpen(true);
                        }}
                        className="mr-3 px-3 py-1 bg-white text-primary rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors shrink-0"
                    >
                        수정 완료
                    </button>
                </div>
            )}

            <MenuOptionModal
                isOpen={isMenuModalOpen}
                menu={selectedMenu}
                addonMenus={addonMenus}
                onClose={() => { setIsMenuModalOpen(false); setSelectedMenu(null); setSelectedInitialOption(undefined); }}
                onAddToCart={handleModalAddToCart}
                initialOption={selectedInitialOption}
                selectedCafe={selectedCafe}
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
                <div className="flex-1 overflow-y-auto p-4 pb-16 custom-scrollbar">
                    <MenuGrid
                        selectedCategory={selectedCategory}
                        selectedSubCategory={selectedSubCategory}
                        favoriteMenuIds={favoriteMenuIds}
                        onToggleFavorite={toggleFavoriteHandler}
                        onAddToCart={handleAddToCartWrapper}
                        onMenuSelect={handleMenuSelect}
                        menus={allMenus}
                        customMenus={myCustomMenus}
                        onSaveCustomMenu={saveCustomMenuHandler}
                        onDeleteCustomMenu={deleteCustomMenuHandler}
                        groupId={groupId || ''}
                        userName={userName}
                        selectedCafe={selectedCafe}
                    />
                </div>
            )}

            {!isCartOpen && (
                <button
                    key={editingHistoryInfo ? `edit-${editingHistoryInfo.animationKey}` : 'cart-fab'}
                    ref={cartFabRef}
                    onClick={() => {
                        if (editingHistoryInfo) setIsHistoryOpen(true);
                        else setIsCartOpen(true);
                    }}
                    className={`absolute bottom-6 right-6 w-16 h-16 rounded-full shadow-lg flex items-center justify-center text-white z-30 transition-transform active:scale-95 
                  ${editingHistoryInfo
                            ? 'bg-indigo-500 hover:bg-indigo-600 animate-fly-from-center'
                            : `${cafeTheme.primaryColor} animate-bounce-in`}`}
                >
                    <div className="relative">
                        {editingHistoryInfo ? <Pencil size={28} /> : <ShoppingCart size={28} />}
                        {(editingHistoryInfo ? editingHistoryInfo.count : cart.length) > 0 && (
                            <span className="absolute -top-2 -right-2 bg-danger text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white">
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
                    onRemove={async (name, option) => {
                        const target = cart.find(i => i.menuName === name && i.option === option && i.userName === userName);
                        if (target && groupId) await updateCartApi(groupId, cart.filter(c => c.id !== target.id));
                    }}
                    onAdd={async (name, price, option, category) => {
                        if (groupId) await addToCartApi(groupId, { id: Date.now(), userName: userName, menuName: name, price, option, category: category || '' });
                    }}
                    onClear={handleOrderComplete}
                    onClose={() => setIsCartOpen(false)}
                    onEdit={() => { }}
                    selectedCafe={selectedCafe}
                />
            )}

            {/* 주문 완료 통합 모달 */}
            {orderModalStep && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => orderModalStep === 'redirect' ? finalizeOrder() : setOrderModalStep(null)} />
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm animate-bounce-in overflow-hidden min-h-[400px] flex flex-col">
                        {/* 핸들 */}
                        <div className="flex justify-center pt-3 pb-1 shrink-0">
                            <div className="w-10 h-1 bg-gray-200 rounded-full" />
                        </div>

                        {orderModalStep === 'confirm' ? (
                            <div className="flex-1 flex flex-col justify-center px-6 py-8">
                                <div className="text-center mb-7">
                                    <div className="text-4xl mb-3">🛒</div>
                                    <h3 className="text-lg font-bold mb-2">주문을 완료할까요?</h3>
                                    <p className="text-sm text-gray-500">
                                        주문 기록이 저장되고<br />장바구니가 비워집니다.
                                    </p>
                                </div>
                                <div className="flex flex-col gap-2 w-full">
                                    <button
                                        onClick={() => executeOrderComplete(true)}
                                        className="w-full py-3 rounded-2xl bg-primary text-white font-bold text-sm hover:opacity-90 transition active:scale-[0.98]"
                                    >
                                        기록하고 주문하러 가기
                                    </button>
                                    <button
                                        onClick={() => executeOrderComplete(false)}
                                        className="w-full py-3 rounded-2xl bg-gray-100 text-gray-600 font-bold text-sm hover:bg-gray-200 transition active:scale-[0.98]"
                                    >
                                        기록만 할게요
                                    </button>
                                    <button
                                        onClick={() => setOrderModalStep(null)}
                                        className="w-full py-2 text-gray-400 text-sm hover:text-gray-600 transition"
                                    >
                                        취소
                                    </button>
                                </div>
                            </div>
                        ) : (() => {
                            const cafeName = CAFE_LIST.find(c => c.id === selectedCafe)?.name ?? '';
                            const hasDeepLink = !!CAFE_DEEP_LINKS[selectedCafe];
                            const webOrderUrl = CAFE_DEEP_LINKS[selectedCafe]?.webOrder;
                            const totalCount = orderRedirectItems.reduce((s, i) => s + i.count, 0);
                            return (
                                <div className="flex-1 flex flex-col">
                                    {/* 헤더 */}
                                    <div className="flex items-center justify-between px-5 pt-2 pb-3 shrink-0">
                                        <button
                                            onClick={() => setOrderModalStep('confirm')}
                                            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600 shrink-0"
                                        >
                                            <ChevronLeft size={18} />
                                        </button>
                                        <h3 className="text-base font-bold text-text-primary">
                                            {cafeName} {isDesktopDevice && webOrderUrl ? '웹에서' : '앱에서'} 주문하기
                                        </h3>
                                        <button
                                            onClick={finalizeOrder}
                                            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600 shrink-0"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>

                                    {/* 중앙 콘텐츠 */}
                                    <div className="flex-1 flex flex-col justify-center px-5 py-2 gap-4">
                                        {/* 주문 목록 */}
                                        <div>
                                            <div className="bg-background rounded-2xl p-3 max-h-44 overflow-y-auto custom-scrollbar">
                                                <div className="space-y-1.5">
                                                    {orderRedirectItems.map((item, i) => (
                                                        <div key={i} className="flex justify-between items-center text-sm">
                                                            <span className="text-text-primary font-medium">
                                                                {item.menuName}
                                                                {item.option !== 'ONLY' && (
                                                                    <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-md font-bold ${item.option === 'ICE' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                                                                        {item.option}
                                                                    </span>
                                                                )}
                                                            </span>
                                                            <span className="text-text-secondary ml-2">x{item.count}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="border-t border-gray-200 mt-2.5 pt-2.5 flex justify-between text-sm">
                                                    <span className="text-text-secondary">총 {totalCount}잔</span>
                                                    <span className="text-primary font-bold">{orderRedirectTotal.toLocaleString()}원</span>
                                                </div>
                                            </div>
                                            {orderRedirectCopied && (
                                                <div className="flex items-center gap-1.5 mt-2 text-xs text-green-600 font-medium">
                                                    <Check size={13} />주문 목록이 클립보드에 복사되었습니다
                                                </div>
                                            )}
                                        </div>

                                        {/* 데스크톱 안내 */}
                                        {isDesktopDevice && (
                                            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 flex gap-2">
                                                <Smartphone size={15} className="text-blue-500 shrink-0 mt-0.5" />
                                                {webOrderUrl ? (
                                                    <p className="text-xs text-blue-600 leading-relaxed">
                                                        웹 주문 페이지로 이동하거나,<br />복사된 주문 목록을 모바일 앱에서 사용하세요.
                                                    </p>
                                                ) : (
                                                    <p className="text-xs text-blue-600 leading-relaxed">
                                                        PC에서는 앱을 직접 열 수 없습니다.<br />복사된 주문 목록을 모바일 기기의 카페 앱에서 사용해주세요.
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* 버튼 */}
                                    <div className="px-5 pb-6 pt-3 flex gap-2">
                                        {isDesktopDevice ? (
                                            <>
                                                <button
                                                    onClick={finalizeOrder}
                                                    className="flex-1 py-3.5 rounded-2xl bg-gray-100 text-text-secondary font-bold text-sm hover:bg-gray-200 transition active:scale-[0.98]"
                                                >
                                                    {webOrderUrl ? '나중에 할게요' : '닫기'}
                                                </button>
                                                {webOrderUrl ? (
                                                    <button
                                                        onClick={() => { finalizeOrder(); window.open(webOrderUrl, '_blank'); }}
                                                        className="flex-1 py-3.5 rounded-2xl bg-primary text-white font-bold text-sm hover:opacity-90 transition active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm"
                                                    >
                                                        <ExternalLink size={14} />웹으로 주문하기
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={handleRedirectCopy}
                                                        className="flex-1 py-3.5 rounded-2xl bg-primary text-white font-bold text-sm hover:opacity-90 transition active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm"
                                                    >
                                                        <Copy size={14} />주문 목록 복사
                                                    </button>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={finalizeOrder}
                                                    className="flex-1 py-3.5 rounded-2xl bg-gray-100 text-text-secondary font-bold text-sm hover:bg-gray-200 transition active:scale-[0.98]"
                                                >
                                                    나중에 할게요
                                                </button>
                                                {hasDeepLink ? (
                                                    <button
                                                        onClick={handleRedirectOpenApp}
                                                        className="flex-1 py-3.5 rounded-2xl bg-primary text-white font-bold text-sm hover:opacity-90 transition active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm"
                                                    >
                                                        <ExternalLink size={14} />{cafeName} 앱 열기
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={handleRedirectCopy}
                                                        className="flex-1 py-3.5 rounded-2xl bg-primary text-white font-bold text-sm hover:opacity-90 transition active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm"
                                                    >
                                                        <Copy size={14} />주문 목록 복사
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}

            {/* 카페 선택 모달 */}
            {isCafeSelectOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setIsCafeSelectOpen(false)} />
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-slide-up">
                        <h3 className="text-lg font-bold text-center mb-1">카페 선택</h3>
                        <p className="text-xs text-gray-400 text-center mb-5">주문할 카페를 변경합니다</p>
                        <div className="space-y-2">
                            {CAFE_LIST.map(cafe => (
                                <button
                                    key={cafe.id}
                                    onClick={() => {
                                        if (cafe.id === selectedCafe) {
                                            setIsCafeSelectOpen(false);
                                            return;
                                        }
                                        if (cart.length > 0) {
                                            setPendingCafe(cafe.id);
                                            setIsCafeSelectOpen(false);
                                            setIsCafeConfirmOpen(true);
                                        } else {
                                            if (groupId) changeCafeApi(groupId, cafe.id);
                                            setIsCafeSelectOpen(false);
                                            setSelectedCategory('커피');
                                            addToast(`${cafe.name}(으)로 변경되었습니다!`, 'success');
                                        }
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all active:scale-[0.98] border-2 ${cafe.id === selectedCafe
                                        ? 'bg-primary/10 border-primary text-primary font-bold'
                                        : 'bg-gray-50 border-transparent hover:bg-gray-100 text-gray-700'
                                        }`}
                                >
                                    <span className="text-2xl">{cafe.img}</span>
                                    <span className="font-bold">{cafe.name}</span>
                                    {cafe.id === selectedCafe && (
                                        <span className="ml-auto text-xs bg-primary text-white px-2 py-0.5 rounded-full">현재</span>
                                    )}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setIsCafeSelectOpen(false)}
                            className="w-full mt-4 py-3 rounded-2xl bg-gray-100 text-gray-500 font-bold text-sm hover:bg-gray-200 transition-colors active:scale-[0.98]"
                        >
                            취소
                        </button>
                    </div>
                </div>
            )}

            {/* 카페 변경 확인 모달 */}
            {isCafeConfirmOpen && pendingCafe && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" />
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xs p-6 animate-bounce-in">
                        <div className="text-center">
                            <div className="text-4xl mb-3">⚠️</div>
                            <h3 className="text-lg font-bold mb-2">카페를 변경할까요?</h3>
                            <p className="text-sm text-gray-500 mb-5">
                                카페를 변경하면 현재 장바구니에 담긴<br />
                                <strong className="text-danger">{cart.length}개의 메뉴가 사라져요.</strong>
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setIsCafeConfirmOpen(false);
                                    setPendingCafe(null);
                                }}
                                className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-600 font-bold text-sm hover:bg-gray-200 transition-colors active:scale-[0.98]"
                            >
                                취소
                            </button>
                            <button
                                onClick={() => {
                                    if (groupId && pendingCafe) {
                                        changeCafeApi(groupId, pendingCafe);
                                        const cafeName = CAFE_LIST.find(c => c.id === pendingCafe)?.name || '카페';
                                        addToast(`${cafeName}(으)로 변경되었습니다!`, 'success');
                                        setSelectedCategory('커피');
                                    }
                                    setIsCafeConfirmOpen(false);
                                    setPendingCafe(null);
                                }}
                                className="flex-1 py-3 rounded-2xl bg-danger text-white font-bold text-sm hover:bg-red-600 transition-colors active:scale-[0.98]"
                            >
                                변경하기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderPage;