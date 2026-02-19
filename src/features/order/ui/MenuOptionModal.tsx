import React, { useState } from 'react';
import { Menu, OptionType } from '../../../shared/types';
import { X, Snowflake, Flame, Plus, Minus } from 'lucide-react';

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
}

const MenuOptionModal: React.FC<Props> = ({ isOpen, menu, addonMenus, onClose, onAddToCart }) => {
    const [selectedOption, setSelectedOption] = useState<OptionType>('ICE');
    const [addonSelections, setAddonSelections] = useState<AddonSelection[]>([]);

    // 메뉴가 바뀔 때마다 상태 초기화
    React.useEffect(() => {
        if (menu) {
            setSelectedOption(menu.hasOption ? 'ICE' : 'ONLY');
            setAddonSelections([]);
        }
    }, [menu]);

    if (!isOpen || !menu) return null;

    // 현재 선택된 옵션에 따른 기본 가격 계산
    const basePrice = selectedOption === 'HOT' && menu.hotPrice !== undefined
        ? menu.hotPrice
        : menu.price;

    // 추가 옵션 총 가격
    const addonTotalPrice = addonSelections.reduce((sum, addon) => sum + (addon.menu.price * addon.quantity), 0);

    // 최종 가격
    const finalPrice = basePrice + addonTotalPrice;

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
                            <p className="text-sm text-gray-500">{menu.categoryUpper} · {menu.categoryLower}</p>
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
                    {/* ICE/HOT 선택 (hasOption일 때만) */}
                    {menu.hasOption && (
                        <div className="mb-5">
                            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">온도 선택</label>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setSelectedOption('ICE')}
                                    className={`flex-1 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 border-2 ${selectedOption === 'ICE'
                                        ? 'bg-blue-50 text-blue-600 border-blue-400 shadow-sm'
                                        : 'bg-gray-50 text-gray-400 border-transparent hover:bg-gray-100'
                                        }`}
                                >
                                    <Snowflake size={18} />
                                    <span>ICE</span>
                                    {menu.hotPrice !== undefined && (
                                        <span className="text-xs opacity-70">{menu.price.toLocaleString()}원</span>
                                    )}
                                </button>
                                <button
                                    onClick={() => setSelectedOption('HOT')}
                                    className={`flex-1 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 border-2 ${selectedOption === 'HOT'
                                        ? 'bg-red-50 text-red-600 border-red-400 shadow-sm'
                                        : 'bg-gray-50 text-gray-400 border-transparent hover:bg-gray-100'
                                        }`}
                                >
                                    <Flame size={18} />
                                    <span>HOT</span>
                                    {menu.hotPrice !== undefined && (
                                        <span className="text-xs opacity-70">{menu.hotPrice.toLocaleString()}원</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 추가 옵션 */}
                    {menu.categoryUpper !== '추가' && (
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">추가 옵션</label>
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
                                                    +{addon.price.toLocaleString()}원
                                                </span>
                                                {selected && (
                                                    <div
                                                        className="flex items-center bg-white rounded-lg border border-gray-200 h-7 overflow-hidden"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <button
                                                            onClick={() => {
                                                                if (selected.quantity <= 1) {
                                                                    toggleAddon(addon); // 1개일 때 빼면 제거
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
                        </div>
                    )}
                </div>

                {/* 하단 고정: 가격 + 담기 버튼 */}
                <div className="px-6 pb-6 pt-3 border-t border-gray-100 shrink-0 bg-white">
                    {/* 가격 상세 (추가 옵션이 있을 때만) */}
                    {addonSelections.length > 0 && (
                        <div className="mb-3 space-y-1">
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>{menu.name}</span>
                                <span>{basePrice.toLocaleString()}원</span>
                            </div>
                            {addonSelections.map(addon => (
                                <div key={addon.menu.id} className="flex justify-between text-sm text-gray-500">
                                    <span>{addon.menu.name}{addon.quantity > 1 ? ` x${addon.quantity}` : ''}</span>
                                    <span>+{(addon.menu.price * addon.quantity).toLocaleString()}원</span>
                                </div>
                            ))}
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
