import React, { useState } from 'react';
import { Menu, OptionType } from '../../../shared/types';
import { Heart, Plus, Coffee, History, Trash2, Snowflake, Flame, Send, MessageSquarePlus, Loader2, CheckCircle } from 'lucide-react';
import { submitMenuRequest } from '../api/menuRequestApi';

interface Props {
    selectedCategory: string;
    selectedSubCategory: string;
    favoriteMenuIds: number[];
    onAddToCart: (e: React.MouseEvent, menu: Menu, option: OptionType) => void;
    onToggleFavorite: (menu: Menu) => void;
    onMenuSelect: (menu: Menu) => void;
    menus: Menu[];
    customMenus: Menu[];
    onSaveCustomMenu: (menu: Menu) => void;
    onDeleteCustomMenu: (id: number) => void;
    groupId: string;
    userName: string;
}

const MenuGrid: React.FC<Props> = ({
    selectedCategory, selectedSubCategory, favoriteMenuIds,
    onAddToCart, onToggleFavorite, onMenuSelect,
    menus, customMenus, onSaveCustomMenu, onDeleteCustomMenu,
    groupId, userName
}) => {
    const [customName, setCustomName] = useState('');
    const [customPrice, setCustomPrice] = useState('');
    const [customOption, setCustomOption] = useState<OptionType>('ICE');

    // 메뉴 신청 상태
    const [requestMenuName, setRequestMenuName] = useState('');
    const [requestPrice, setRequestPrice] = useState('');
    const [requestOptionType, setRequestOptionType] = useState<'both' | 'ice' | 'hot' | 'unknown'>('both');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    // 1. 메뉴 직접 담기 & 최근 기록 탭
    if (selectedCategory === '메뉴 추가') {
        // 1-1. 직접 입력 탭
        if (selectedSubCategory === '직접 입력') {
            const handleCustomAdd = (e: React.MouseEvent) => {
                if (!customName.trim()) {
                    alert('메뉴 이름을 입력해주세요');
                    return;
                }
                if (!customPrice || parseInt(customPrice) <= 0) {
                    alert('가격을 올바르게 입력해주세요');
                    return;
                }

                const customMenu: Menu = {
                    id: Date.now(),
                    categoryUpper: '',
                    categoryLower: 'custom',
                    name: customName,
                    price: parseInt(customPrice),
                    img: '✨',
                    hasOption: false,
                    defaultOption: customOption
                };

                // 선택한 옵션으로 장바구니 추가
                onAddToCart(e, customMenu, customOption);
                onSaveCustomMenu(customMenu);

                // 초기화 (이름, 가격만 초기화하고 옵션은 유지하거나 ICE로 리셋)
                setCustomName('');
                setCustomPrice('');
            };

            return (
                <div className="flex flex-col p-6 bg-white rounded-2xl shadow-sm mx-1 min-h-[460px]">
                    <div className="flex items-center gap-2 mb-2">
                        <Plus size={24} className="text-blue-500" />
                        <h3 className="text-lg font-bold text-gray-800">메뉴 직접 담기</h3>
                    </div>
                    <p className="text-xs text-gray-500 mb-6 ml-8">
                        메뉴판에 없는 메뉴를 직접 입력해주세요.<br />
                        입력한 메뉴는 '최근 기록' 탭에 저장되어<br />
                        언제든 다시 불러올 수 있습니다.
                    </p>

                    <div className="w-full space-y-4 mb-8">
                        {/* 메뉴 이름 입력 */}
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1 ml-1">메뉴 이름</label>
                            <div className="relative group">
                                <Coffee size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    value={customName}
                                    onChange={(e) => setCustomName(e.target.value)}
                                    placeholder="예) 아이스티 샷추가"
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        {/* 옵션 선택 (ICE / HOT) */}
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1 ml-1">옵션</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCustomOption('ICE')}
                                    className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 ${customOption === 'ICE'
                                        ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-500 shadow-sm'
                                        : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                                        }`}
                                >
                                    <Snowflake size={16} /> ICE
                                </button>
                                <button
                                    onClick={() => setCustomOption('HOT')}
                                    className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 ${customOption === 'HOT'
                                        ? 'bg-red-100 text-red-600 ring-2 ring-red-500 shadow-sm'
                                        : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                                        }`}
                                >
                                    <Flame size={16} /> HOT
                                </button>
                            </div>
                        </div>

                        {/* 가격 입력 */}
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1 ml-1">가격</label>
                            <div className="relative group">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold group-focus-within:text-primary transition-colors">₩</span>
                                <input
                                    type="number"
                                    value={customPrice}
                                    onChange={(e) => setCustomPrice(e.target.value)}
                                    placeholder="가격 입력"
                                    className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleCustomAdd}
                        className="w-full bg-primary text-white py-3.5 rounded-xl font-bold hover:bg-primary-dark transition-colors active:scale-95 shadow-md flex items-center justify-center gap-2 mt-auto"
                    >
                        <span>장바구니 담기</span>
                    </button>
                </div>
            );
        }

        // 1-2. 최근 기록 탭
        if (selectedSubCategory === '최근 기록') {
            if (!customMenus || customMenus.length === 0) {
                return (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <History size={48} className="mb-4 opacity-30" />
                        <p>최근에 직접 입력한 메뉴가 없어요</p>
                    </div>
                );
            }

            return (
                <div className="space-y-3 pb-32">
                    {customMenus.map(menu => (
                        <div
                            key={menu.id}
                            onClick={(e) => onAddToCart(e, menu, menu.defaultOption || 'ONLY')} // 저장된 옵션 사용
                            className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between active:scale-98 transition-transform cursor-pointer border border-transparent hover:border-blue-100"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-xl">
                                    {menu.img}
                                </div>
                                <div>
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                        <h4 className="font-bold text-gray-800">{menu.name}</h4>
                                        {/* 옵션 뱃지 표시 */}
                                        {menu.defaultOption && (
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${menu.defaultOption === 'ICE' ? 'bg-blue-100 text-blue-600' :
                                                menu.defaultOption === 'HOT' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {menu.defaultOption}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-blue-500 font-bold">{menu.price.toLocaleString()}원</p>
                                </div>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteCustomMenu(menu.id);
                                }}
                                className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            );
        }

        // 1-3. 메뉴 신청 탭
        if (selectedSubCategory === '메뉴 신청') {
            const handleSubmitRequest = async () => {
                if (!requestMenuName.trim()) {
                    alert('메뉴 이름을 입력해주세요');
                    return;
                }
                if (!requestPrice || parseInt(requestPrice) <= 0) {
                    alert('가격을 올바르게 입력해주세요');
                    return;
                }

                setIsSubmitting(true);
                try {
                    await submitMenuRequest(
                        requestMenuName.trim(),
                        parseInt(requestPrice),
                        requestOptionType,
                        userName,
                        groupId
                    );
                    setSubmitSuccess(true);
                    setRequestMenuName('');
                    setRequestPrice('');
                    setRequestOptionType('both');

                    // 3초 후 성공 화면 리셋
                    setTimeout(() => setSubmitSuccess(false), 3000);
                } catch (err) {
                    console.error('메뉴 신청 실패:', err);
                    alert('메뉴 신청에 실패했습니다.');
                } finally {
                    setIsSubmitting(false);
                }
            };

            // 성공 화면
            if (submitSuccess) {
                return (
                    <div className="flex flex-col items-center justify-center py-20 animate-fade-in-up">
                        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle size={40} className="text-green-500" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">신청 완료!</h3>
                        <p className="text-sm text-gray-500 text-center">
                            관리자가 확인 후 메뉴를 추가해드립니다.
                        </p>
                    </div>
                );
            }

            const OPTION_LABELS: Record<string, string> = {
                both: '🧊🔥 ICE / HOT 선택가능',
                ice: '🧊 ICE ONLY',
                hot: '🔥 HOT ONLY',
                unknown: '❓ 모름',
            };

            return (
                <div className="flex flex-col p-6 bg-white rounded-2xl shadow-sm mx-1 min-h-[460px]">
                    <div className="flex items-center gap-2 mb-2">
                        <MessageSquarePlus size={24} className="text-purple-500" />
                        <h3 className="text-lg font-bold text-gray-800">메뉴 신청</h3>
                    </div>
                    <p className="text-xs text-gray-500 mb-6 ml-8">
                        메뉴판에 없는 메뉴를 관리자에게 신청해주세요.<br />
                        관리자가 확인 후 메뉴에 추가해드립니다.
                    </p>

                    <div className="w-full space-y-4 mb-8">
                        {/* 메뉴 이름 */}
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1 ml-1">메뉴 이름 *</label>
                            <div className="relative group">
                                <Coffee size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                                <input
                                    type="text"
                                    value={requestMenuName}
                                    onChange={(e) => setRequestMenuName(e.target.value)}
                                    placeholder="예) 바닐라 라떼"
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        {/* 가격 */}
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1 ml-1">가격 *</label>
                            <div className="relative group">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold group-focus-within:text-purple-500 transition-colors">₩</span>
                                <input
                                    type="number"
                                    value={requestPrice}
                                    onChange={(e) => setRequestPrice(e.target.value)}
                                    placeholder="가격 입력"
                                    className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        {/* 음료 온도 옵션 */}
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1 ml-1">음료 온도 옵션 *</label>
                            <select
                                value={requestOptionType}
                                onChange={(e) => setRequestOptionType(e.target.value as 'both' | 'ice' | 'hot' | 'unknown')}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all appearance-none cursor-pointer"
                                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%239CA3AF\' d=\'M6 8L1 3h10z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                            >
                                {Object.entries(OPTION_LABELS).map(([value, label]) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </select>
                        </div>

                        {/* 신청자 정보 */}
                        <div className="bg-gray-50 rounded-xl px-4 py-3">
                            <p className="text-xs text-gray-400">신청자</p>
                            <p className="text-sm font-bold text-gray-700">{userName}</p>
                        </div>
                    </div>

                    <button
                        onClick={handleSubmitRequest}
                        disabled={isSubmitting}
                        className="w-full bg-purple-500 text-white py-3.5 rounded-xl font-bold hover:bg-purple-600 transition-colors active:scale-95 shadow-md flex items-center justify-center gap-2 mt-auto disabled:bg-gray-300"
                    >
                        {isSubmitting ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            <>
                                <Send size={18} />
                                <span>메뉴 신청하기</span>
                            </>
                        )}
                    </button>
                </div>
            );
        }
    }

    // 2. 즐겨찾기 탭 로직 
    const favoriteMenus = menus.filter(m => favoriteMenuIds.includes(m.id));
    const currentMenus = selectedCategory === '즐겨찾기'
        ? favoriteMenus
        : menus.filter(m => m.categoryUpper === selectedCategory);

    if (selectedCategory === '즐겨찾기' && favoriteMenus.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Heart size={48} className="mb-4 opacity-30" />
                <p>즐겨찾기한 메뉴가 없어요</p>
            </div>
        );
    }

    // 3. 일반 메뉴 그리드 
    return (
        <div className="grid grid-cols-2 gap-4 pb-32">
            {currentMenus
                .filter(m => selectedCategory === '즐겨찾기' || selectedSubCategory === '전체' || m.categoryLower === selectedSubCategory)
                .map(menu => (
                    <div
                        key={menu.id}
                        onClick={() => onMenuSelect(menu)}
                        className="bg-white p-4 rounded-2xl shadow-sm flex flex-col items-center transition hover:-translate-y-1 relative group cursor-pointer"
                    >
                        <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(menu); }} className="absolute top-3 right-3 p-1 hover:scale-110 transition z-10">
                            <Heart size={20} className={`${favoriteMenuIds.includes(menu.id) ? 'text-red-500 fill-red-500' : 'text-gray-300'} transition-colors`} />
                        </button>

                        <div className="text-5xl mb-3">{menu.img}</div>

                        {selectedSubCategory === '전체' && (
                            <span className="text-[10px] text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full mb-1 font-bold">{menu.categoryLower}</span>
                        )}

                        <h3 className="font-bold text-gray-800 text-center break-keep mb-1 leading-tight">{menu.name}</h3>
                        <p className="text-sm text-blue-500 font-bold mb-3">
                            {menu.price.toLocaleString()}원
                            {menu.hotPrice !== undefined && menu.hotPrice !== menu.price && (
                                <span className="text-[10px] text-gray-400 ml-1">~</span>
                            )}
                        </p>

                        <div className="flex w-full gap-2 mt-auto">
                            <div className={`w-full py-2 rounded-xl text-xs font-bold text-center ${menu.hasOption
                                ? 'bg-green-50 text-green-600'
                                : menu.defaultOption === 'HOT'
                                    ? 'bg-red-50 text-red-500'
                                    : 'bg-primary/10 text-primary'
                                }`}>
                                {menu.hasOption ? 'ICE / HOT 선택' :
                                    menu.defaultOption === 'HOT' ? '🔥 ONLY HOT' :
                                        menu.defaultOption === 'ICE' ? '🧊 ONLY ICE' : '선택하기'}
                            </div>
                        </div>
                    </div>
                ))}
        </div>
    );
};

export default MenuGrid;