import React, { useState, useMemo } from 'react';
import { Menu, OptionType, CupSize } from '../../../shared/types';
import { X, Snowflake, Flame, Plus, Minus, CupSoda, ChevronDown, ChevronRight, Store, MapPin } from 'lucide-react';

interface AddonSelection {
    menu: Menu;
    quantity: number;
}

interface Props {
    isOpen: boolean;
    menu: Menu | null;
    addonMenus: Menu[];
    onClose: () => void;
    onAddToCart: (e: React.MouseEvent, menuName: string, price: number, option: OptionType, category: string) => void;
    initialOption?: OptionType;
    selectedCafe?: string;
}

// 스타벅스 컵 사이즈별 가격 차이 (Tall 기준)
const CUP_SIZE_PRICE_DIFF: Record<string, number> = {
    Short: -800,
    Tall: 0,
    Grande: 600,
    Venti: 1400,
    '7oz': 0,
    '500ml': 0,
    Trenta: 0,
};

const CUP_SIZE_ML: Record<string, string> = {
    Short: '237ml',
    Tall: '355ml',
    Grande: '473ml',
    Venti: '591ml',
    '7oz': '207ml',
    '500ml': '500ml',
    Trenta: '887ml',
};



const MenuOptionModal: React.FC<Props> = ({ isOpen, menu, addonMenus, onClose, onAddToCart, initialOption, selectedCafe }) => {
    const [selectedOption, setSelectedOption] = useState<OptionType>('ICE');
    const [addonSelections, setAddonSelections] = useState<AddonSelection[]>([]);
    const [selectedCupSize, setSelectedCupSize] = useState<CupSize>('Tall');
    const [openAddonGroups, setOpenAddonGroups] = useState<Set<string>>(new Set());
    const [isTakeout, setIsTakeout] = useState(true);

    const isStarbucks = selectedCafe === 'starbucks';
    const isBanapresso = selectedCafe === 'banapresso';
    // 메뉴에 sizes가 있으면 컵 사이즈 표시
    const availableSizes = (isStarbucks && menu !== null && menu.sizes && menu.sizes.length >= 1) ? menu.sizes : null;
    const showCupSize = availableSizes !== null;

    // 추가 옵션 그룹화 (스타벅스 & 바나프레소)
    const addonGroups = useMemo(() => {
        if (!isStarbucks && !isBanapresso) return null;
        const groups: { groupName: string; items: Menu[] }[] = [];
        const groupMap = new Map<string, Menu[]>();
        addonMenus.forEach(addon => {
            const key = addon.categoryLower;
            if (!groupMap.has(key)) groupMap.set(key, []);
            groupMap.get(key)!.push(addon);
        });
        groupMap.forEach((items, groupName) => groups.push({ groupName, items }));
        return groups;
    }, [addonMenus, isStarbucks, isBanapresso]);

    // 메뉴가 바뀔 때마다 상태 초기화
    React.useEffect(() => {
        if (menu) {
            setSelectedOption(initialOption || (menu.hasOption ? (menu.defaultOption || 'ICE') : (menu.defaultOption || 'ONLY')));
            setAddonSelections([]);
            setOpenAddonGroups(new Set());
            setIsTakeout(true);
            // Tall이 있으면 Tall, 없으면 첫 번째 사이즈
            const sizes = menu.sizes || [];
            const defaultSize = sizes.includes('Tall') ? 'Tall' : (sizes[0] as CupSize || 'Tall');
            setSelectedCupSize(defaultSize);
        }
    }, [menu, initialOption]);

    if (!isOpen || !menu) return null;

    // 바나프레소 테이크아웃 가격 차이 여부
    const hasTakeoutOption = isBanapresso && menu.takeoutPrice !== undefined && menu.takeoutPrice !== menu.price;

    // 현재 선택된 옵션에 따른 기본 가격 계산
    const basePrice = (() => {
        if (isTakeout && hasTakeoutOption) {
            // 테이크아웃 가격
            if (selectedOption === 'HOT' && menu.takeoutHotPrice !== undefined) {
                return menu.takeoutHotPrice;
            }
            return menu.takeoutPrice!;
        }
        // 매장 가격
        if (selectedOption === 'HOT' && menu.hotPrice !== undefined) {
            return menu.hotPrice;
        }
        return menu.price;
    })();

    // 컵 사이즈 가격 차이
    const cupSizePriceDiff = showCupSize ? (CUP_SIZE_PRICE_DIFF[selectedCupSize] ?? 0) : 0;

    // 추가 옵션 총 가격 (시럽은 수량과 무관하게 800원 균일)
    const addonTotalPrice = addonSelections.reduce((sum, addon) => {
        if (addon.menu.categoryLower === '시럽') {
            return sum + (addon.quantity > 0 ? addon.menu.price : 0);
        }
        return sum + (addon.menu.price * addon.quantity);
    }, 0);

    // 최종 가격
    const finalPrice = basePrice + cupSizePriceDiff + addonTotalPrice;

    // 추가 옵션 토글
    const toggleAddon = (addonMenu: Menu) => {
        setAddonSelections(prev => {
            const existing = prev.find(a => a.menu.id === addonMenu.id);
            if (existing) {
                // 이미 있으면 제거
                return prev.filter(a => a.menu.id !== addonMenu.id);
            } else {
                // 없으면 추가 (기본 수량 1)
                return [...prev, { menu: addonMenu, quantity: 1 }];
            }
        });
    };

    // 추가 옵션 수량 변경
    const updateAddonQuantity = (addonId: number, delta: number) => {
        setAddonSelections(prev => prev.map(a => {
            if (a.menu.id === addonId) {
                const newQty = a.quantity + delta;
                if (newQty <= 0) return a; // 최소 1개
                return { ...a, quantity: newQty };
            }
            return a;
        }));
    };

    // 담기 버튼 클릭
    const handleAdd = (e: React.MouseEvent) => {
        // 메뉴명 조합
        let finalName = menu.name;
        // 스타벅스 컵 사이즈 표시 (Tall이 아닌 경우)
        if (showCupSize && selectedCupSize !== 'Tall') {
            finalName = `[${selectedCupSize}] ${finalName}`;
        }
        addonSelections.forEach(addon => {
            const suffix = addon.quantity > 1
                ? `${addon.menu.name}(x${addon.quantity})`
                : addon.menu.name;
            finalName += ` + ${suffix}`;
        });

        onAddToCart(e, finalName, finalPrice, selectedOption, menu.categoryUpper);
        onClose();
    };

    // 배경 클릭 시 닫기
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center backdrop-blur-[2px]"
            onClick={handleBackdropClick}
        >
            <div className="w-full max-w-lg bg-white rounded-t-3xl shadow-2xl animate-slide-up max-h-[85vh] flex flex-col">
                {/* 헤더 */}
                <div className="flex justify-center -mt-0 pt-3 pb-1 cursor-pointer" onClick={onClose}>
                    <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
                </div>

                <div className="px-6 pt-2 pb-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="text-4xl">{menu.img}</div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">{menu.name}</h3>
                            <p className="text-sm text-gray-500">{menu.categoryUpper}{menu.categoryLower && menu.categoryUpper !== '추가' ? ` · ${menu.categoryLower}` : ''}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                {/* 스크롤 영역 */}
                <div className="flex-1 overflow-y-auto px-6 pb-4">
                    {/* ICE/HOT 선택 */}
                    {(menu.hasOption || menu.defaultOption === 'ICE' || menu.defaultOption === 'HOT') && (
                        <div className="mb-5">
                            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">온도 선택</label>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setSelectedOption('ICE')}
                                    disabled={!menu.hasOption && menu.defaultOption === 'HOT'}
                                    className={`flex-1 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 border-2 ${selectedOption === 'ICE'
                                        ? 'bg-blue-50 text-blue-600 border-blue-400 shadow-sm'
                                        : 'bg-gray-50 text-gray-400 border-transparent hover:bg-gray-100'
                                        } ${!menu.hasOption && menu.defaultOption === 'HOT' ? 'opacity-30 cursor-not-allowed !active:scale-100' : ''}`}
                                >
                                    <Snowflake size={18} />
                                    <span>ICE</span>
                                </button>
                                <button
                                    onClick={() => setSelectedOption('HOT')}
                                    disabled={!menu.hasOption && menu.defaultOption === 'ICE'}
                                    className={`flex-1 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 border-2 ${selectedOption === 'HOT'
                                        ? 'bg-red-50 text-red-600 border-red-400 shadow-sm'
                                        : 'bg-gray-50 text-gray-400 border-transparent hover:bg-gray-100'
                                        } ${!menu.hasOption && menu.defaultOption === 'ICE' ? 'opacity-30 cursor-not-allowed !active:scale-100' : ''}`}
                                >
                                    <Flame size={18} />
                                    <span>HOT</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 바나프레소 매장/테이크아웃 선택 */}
                    {hasTakeoutOption && (
                        <div className="mb-5">
                            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">이용 방식</label>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsTakeout(true)}
                                    className={`flex-1 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 border-2 ${isTakeout
                                        ? 'bg-green-50 text-green-700 border-green-400 shadow-sm'
                                        : 'bg-gray-50 text-gray-400 border-transparent hover:bg-gray-100'
                                        }`}
                                >
                                    <MapPin size={18} />
                                    <span>테이크아웃</span>
                                </button>
                                <button
                                    onClick={() => setIsTakeout(false)}
                                    className={`flex-1 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 border-2 ${!isTakeout
                                        ? 'bg-amber-50 text-amber-700 border-amber-400 shadow-sm'
                                        : 'bg-gray-50 text-gray-400 border-transparent hover:bg-gray-100'
                                        }`}
                                >
                                    <Store size={18} />
                                    <span>매장</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 스타벅스 컵 사이즈 선택 */}
                    {showCupSize && availableSizes && (
                        <div className="mb-5">
                            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                                <CupSoda size={14} />
                                컵 사이즈
                            </label>
                            <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${Math.min(availableSizes.length, 4)}, 1fr)` }}>
                                {availableSizes.map((size) => {
                                    const diff = CUP_SIZE_PRICE_DIFF[size] ?? 0;
                                    const sizePrice = basePrice + diff;
                                    const isSelected = selectedCupSize === size;
                                    const ml = CUP_SIZE_ML[size] || '';
                                    return (
                                        <button
                                            key={size}
                                            onClick={() => setSelectedCupSize(size as CupSize)}
                                            className={`py-3 rounded-2xl font-bold text-xs flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95 border-2 ${isSelected
                                                ? 'bg-green-50 text-green-700 border-green-400 shadow-sm'
                                                : 'bg-gray-50 text-gray-400 border-transparent hover:bg-gray-100'
                                                }`}
                                        >
                                            <span className="font-extrabold text-sm">{size}</span>
                                            {ml && <span className="text-[10px] opacity-60">{ml}</span>}
                                            <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-green-600' : 'text-gray-400'}`}>
                                                {sizePrice.toLocaleString()}원
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* 추가 옵션 */}
                    {menu.categoryUpper !== '추가' && (
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">추가 옵션</label>
                            {isStarbucks && addonGroups ? (
                                /* 스타벅스: 그룹별 드롭다운 */
                                <div className="space-y-2">
                                    {addonGroups.map(({ groupName, items }) => {
                                        const isSingleItem = items.length === 1;
                                        const isOpen = openAddonGroups.has(groupName);
                                        const selectedInGroup = items.filter(item => addonSelections.find(a => a.menu.id === item.id));
                                        const groupTotalPrice = selectedInGroup.reduce((sum, item) => {
                                            const sel = addonSelections.find(a => a.menu.id === item.id);
                                            if (groupName === '시럽') {
                                                return sum + (sel && sel.quantity > 0 ? item.price : 0);
                                            }
                                            return sum + (sel ? item.price * sel.quantity : 0);
                                        }, 0);

                                        if (isSingleItem) {
                                            // 단일 항목 그룹: 바로 토글
                                            const addon = items[0];
                                            const selected = addonSelections.find(a => a.menu.id === addon.id);
                                            return (
                                                <div
                                                    key={addon.id}
                                                    className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer ${selected
                                                        ? 'border-primary bg-blue-50/50'
                                                        : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                                                        }`}
                                                    onClick={() => toggleAddon(addon)}
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <span className="text-lg">{addon.img}</span>
                                                        <span className={`text-sm font-bold ${selected ? 'text-gray-800' : 'text-gray-600'}`}>{addon.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-sm font-bold ${selected ? 'text-primary' : 'text-gray-400'}`}>
                                                            {addon.price === 0 ? '무료' : `+${addon.price.toLocaleString()}원`}
                                                        </span>
                                                        {selected && addon.price > 0 && (
                                                            <div className="flex items-center bg-white rounded-lg border border-gray-200 h-7 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                                                                <button onClick={() => { if (selected.quantity <= 1) toggleAddon(addon); else updateAddonQuantity(addon.id, -1); }} className="w-7 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50">
                                                                    <Minus size={12} />
                                                                </button>
                                                                <span className="w-6 text-center text-xs font-bold text-gray-800">{selected.quantity}</span>
                                                                <button onClick={() => updateAddonQuantity(addon.id, 1)} className="w-7 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50">
                                                                    <Plus size={12} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        }

                                        // 다중 항목 그룹: 접이식 드롭다운
                                        return (
                                            <div key={groupName} className="rounded-xl border-2 border-gray-100 overflow-hidden">
                                                <button
                                                    onClick={() => setOpenAddonGroups(prev => {
                                                        const next = new Set(prev);
                                                        if (next.has(groupName)) next.delete(groupName); else next.add(groupName);
                                                        return next;
                                                    })}
                                                    className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg">{items[0].img}</span>
                                                        <span className="text-sm font-bold text-gray-700">{groupName}</span>
                                                        {selectedInGroup.length > 0 && (
                                                            <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded-full font-bold">
                                                                {selectedInGroup.length}개
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        {groupTotalPrice > 0 && (
                                                            <span className="text-xs font-bold text-primary">+{groupTotalPrice.toLocaleString()}원</span>
                                                        )}
                                                        {isOpen ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                                                    </div>
                                                </button>
                                                {isOpen && (
                                                    <div className="p-2 space-y-1.5 bg-white">
                                                        {groupName === '시럽' ? (
                                                            /* 시럽 그룹: - 숫자 + 형식 */
                                                            items.map(addon => {
                                                                const selected = addonSelections.find(a => a.menu.id === addon.id);
                                                                const qty = selected ? selected.quantity : 0;
                                                                return (
                                                                    <div
                                                                        key={addon.id}
                                                                        className={`flex items-center justify-between p-2.5 rounded-lg transition-all ${qty > 0 ? 'bg-blue-50 border border-primary/30' : 'border border-transparent'}`}
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            <span className={`text-sm ${qty > 0 ? 'font-bold text-gray-800' : 'text-gray-600'}`}>{addon.name}</span>
                                                                            <span className={`text-[10px] ${qty > 0 ? 'text-primary font-bold' : 'text-gray-400'}`}>
                                                                                {qty > 0 ? '800원' : '무료'}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center bg-white rounded-lg border border-gray-200 h-7 overflow-hidden">
                                                                            <button
                                                                                onClick={() => {
                                                                                    if (qty <= 1) {
                                                                                        if (selected) toggleAddon(addon);
                                                                                    } else {
                                                                                        updateAddonQuantity(addon.id, -1);
                                                                                    }
                                                                                }}
                                                                                disabled={qty === 0}
                                                                                className="w-7 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30"
                                                                            >
                                                                                <Minus size={12} />
                                                                            </button>
                                                                            <span className="w-6 text-center text-xs font-bold text-gray-800">{qty}</span>
                                                                            <button
                                                                                onClick={() => {
                                                                                    if (qty === 0) {
                                                                                        toggleAddon(addon);
                                                                                    } else if (qty < 9) {
                                                                                        updateAddonQuantity(addon.id, 1);
                                                                                    }
                                                                                }}
                                                                                disabled={qty >= 9}
                                                                                className="w-7 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30"
                                                                            >
                                                                                <Plus size={12} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })
                                                        ) : (
                                                            /* 기타 그룹: 기존 토글 UI */
                                                            items.map(addon => {
                                                                const selected = addonSelections.find(a => a.menu.id === addon.id);
                                                                return (
                                                                    <div
                                                                        key={addon.id}
                                                                        className={`flex items-center justify-between p-2.5 rounded-lg transition-all cursor-pointer ${selected
                                                                            ? 'bg-blue-50 border border-primary/30'
                                                                            : 'hover:bg-gray-50 border border-transparent'
                                                                            }`}
                                                                        onClick={() => toggleAddon(addon)}
                                                                    >
                                                                        <span className={`text-sm ${selected ? 'font-bold text-gray-800' : 'text-gray-600'}`}>{addon.name}</span>
                                                                        <span className={`text-xs font-bold ${selected ? 'text-primary' : 'text-gray-400'}`}>
                                                                            {addon.price === 0 ? '무료' : `+${addon.price.toLocaleString()}원`}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : isBanapresso && addonGroups ? (() => {
                                /* 바나프레소: 선택된 온도에 따라 optionsIce/optionsHot 기반 필터링 */
                                const currentOptions = selectedOption === 'HOT'
                                    ? (menu.optionsHot || [])
                                    : (menu.optionsIce || []);
                                if (currentOptions.length === 0) return null;
                                const optionSet = new Set(currentOptions);
                                const filteredGroups = addonGroups
                                    .filter(({ groupName }) => optionSet.has(groupName))
                                    .map(({ groupName, items }) => ({ groupName, items }));
                                if (filteredGroups.length === 0) return null;
                                return (
                                    <div className="space-y-3">
                                        {filteredGroups.map(({ groupName, items }) => {
                                            const selectedInGroup = items.filter(item => addonSelections.find(a => a.menu.id === item.id));
                                            return (
                                                <div key={groupName} className="rounded-xl border border-gray-200 overflow-hidden">
                                                    <div className="px-3 py-2 bg-gray-50 flex items-center justify-between">
                                                        <span className="text-xs font-bold text-gray-500">{groupName}</span>
                                                        {selectedInGroup.length > 0 && (
                                                            <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded-full font-bold">
                                                                {selectedInGroup.length}개
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="p-2 flex flex-wrap gap-1.5">
                                                        {items.map(addon => {
                                                            const selected = addonSelections.find(a => a.menu.id === addon.id);
                                                            return (
                                                                <button
                                                                    key={addon.id}
                                                                    onClick={() => toggleAddon(addon)}
                                                                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 border ${selected
                                                                        ? 'bg-primary/10 text-primary border-primary'
                                                                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                                                        }`}
                                                                >
                                                                    {addon.name}
                                                                    {addon.price !== 0 && (
                                                                        <span className="ml-1 opacity-70">
                                                                            {addon.price < 0 ? addon.price.toLocaleString() : `+${addon.price.toLocaleString()}`}원
                                                                        </span>
                                                                    )}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()
                                : (() => {
                                    /* 기타 카페: 기존 flat 카드 UI */
                                    return addonMenus.length > 0 ? (
                                        <div className="space-y-2">
                                            {addonMenus.map(addon => {
                                                const selected = addonSelections.find(a => a.menu.id === addon.id);
                                                return (
                                                    <div
                                                        key={addon.id}
                                                        className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer ${selected
                                                            ? 'border-primary bg-blue-50/50'
                                                            : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                                                            }`}
                                                        onClick={() => toggleAddon(addon)}
                                                    >
                                                        <div className="flex items-center gap-2.5">
                                                            <span className="text-lg">{addon.img}</span>
                                                            <span className={`text-sm font-bold ${selected ? 'text-gray-800' : 'text-gray-600'}`}>
                                                                {addon.name}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-sm font-bold ${selected ? 'text-primary' : 'text-gray-400'}`}>
                                                                {addon.price === 0 ? '무료' : (addon.price < 0 ? `${addon.price.toLocaleString()}원` : `+${addon.price.toLocaleString()}원`)}
                                                            </span>
                                                            {selected && (
                                                                <div
                                                                    className="flex items-center bg-white rounded-lg border border-gray-200 h-7 overflow-hidden"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <button
                                                                        onClick={() => {
                                                                            if (selected.quantity <= 1) {
                                                                                toggleAddon(addon);
                                                                            } else {
                                                                                updateAddonQuantity(addon.id, -1);
                                                                            }
                                                                        }}
                                                                        className="w-7 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
                                                                    >
                                                                        <Minus size={12} />
                                                                    </button>
                                                                    <span className="w-6 text-center text-xs font-bold text-gray-800">{selected.quantity}</span>
                                                                    <button
                                                                        onClick={() => updateAddonQuantity(addon.id, 1)}
                                                                        className="w-7 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
                                                                    >
                                                                        <Plus size={12} />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : null;
                                })()
                            }
                        </div>
                    )}
                </div>

                {/* 하단 고정: 가격 + 담기 버튼 */}
                <div className="px-6 pb-6 pt-3 border-t border-gray-100 shrink-0 bg-white">
                    {/* 가격 상세 (추가 옵션이나 컵 사이즈 변경이 있을 때) */}
                    {(addonSelections.length > 0 || (showCupSize && selectedCupSize !== 'Tall')) && (
                        <div className="mb-3 space-y-1">
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>{menu.name}{showCupSize ? ` (${selectedCupSize})` : ''}</span>
                                <span>{basePrice.toLocaleString()}원</span>
                            </div>
                            {showCupSize && cupSizePriceDiff !== 0 && (
                                <div className="flex justify-between text-sm text-gray-500">
                                    <span>사이즈 변경 ({selectedCupSize})</span>
                                    <span>{cupSizePriceDiff > 0 ? '+' : ''}{cupSizePriceDiff.toLocaleString()}원</span>
                                </div>
                            )}
                            {addonSelections.map(addon => {
                                const isSyrup = addon.menu.categoryLower === '시럽';
                                const displayPrice = isSyrup ? addon.menu.price : addon.menu.price * addon.quantity;
                                return (
                                    <div key={addon.menu.id} className="flex justify-between text-sm text-gray-500">
                                        <span>{addon.menu.name}{addon.quantity > 1 ? ` x${addon.quantity}` : ''}</span>
                                        <span>{displayPrice > 0 ? `+${displayPrice.toLocaleString()}원` : '무료'}</span>
                                    </div>
                                );
                            })}
                            <div className="border-t border-dashed border-gray-200 pt-1"></div>
                        </div>
                    )}

                    <button
                        onClick={handleAdd}
                        className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg hover:bg-primary-dark transition-colors active:scale-[0.98] shadow-lg flex items-center justify-center gap-2"
                    >
                        <span>{finalPrice.toLocaleString()}원 담기</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MenuOptionModal;
