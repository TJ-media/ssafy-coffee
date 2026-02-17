import React, { useRef, useState, useEffect } from 'react';
import { Link, History, Target, LogOut, Heart, ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { CATEGORIES } from '../../../menuData';
import { getAvatarColor, getTextContrastColor } from '../../../shared/utils';

interface Props {
    groupId: string;
    userName: string;
    selectedCategory: string;
    selectedSubCategory: string;
    onSelectCategory: (cat: string) => void;
    onSelectSubCategory: (sub: string) => void;
    subCategories: string[];
    onOpenHistory: () => void;
    onOpenPinball: () => void;
    onOpenSettings: () => void; // 👇 추가
    onCopyLink: () => void;
    onLogout: () => void;
}

const OrderHeader: React.FC<Props> = ({
    groupId, userName, selectedCategory, selectedSubCategory,
    onSelectCategory, onSelectSubCategory, subCategories,
    onOpenHistory, onOpenPinball, onOpenSettings, onCopyLink, onLogout
}) => {
    const categoryScrollRef = useRef<HTMLDivElement>(null);
    const subCategoryScrollRef = useRef<HTMLDivElement>(null);

    const [canScrollCatLeft, setCanScrollCatLeft] = useState(false);
    const [canScrollCatRight, setCanScrollCatRight] = useState(false);
    const [canScrollSubLeft, setCanScrollSubLeft] = useState(false);
    const [canScrollSubRight, setCanScrollSubRight] = useState(false);

    const checkScroll = (ref: React.RefObject<HTMLDivElement | null>, setLeft: (v: boolean) => void, setRight: (v: boolean) => void) => {
        if (ref.current) {
            const { scrollLeft, scrollWidth, clientWidth } = ref.current;
            setLeft(scrollLeft > 0);
            setRight(scrollLeft < scrollWidth - clientWidth - 1);
        }
    };

    useEffect(() => {
        const handleResize = () => {
            checkScroll(categoryScrollRef, setCanScrollCatLeft, setCanScrollCatRight);
            checkScroll(subCategoryScrollRef, setCanScrollSubLeft, setCanScrollSubRight);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        const timer = setTimeout(handleResize, 100);
        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(timer);
        };
    }, [selectedCategory, subCategories]);

    const scrollContainer = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
        if (ref.current) {
            const scrollAmount = 200;
            ref.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
        }
    };

    return (
        <div className="bg-surface sticky top-0 z-10 shadow-sm">
            <div className="flex justify-between items-center p-6 pb-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-inner" style={{ backgroundColor: getAvatarColor(userName), color: getTextContrastColor() }}>
                        {userName.slice(0, 2)}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-text-primary">메가커피</h2>
                        <p className="text-xs text-text-secondary">{groupId}</p>
                    </div>
                </div>
                <div className="flex items-start gap-0.5">
                    <button onClick={onCopyLink} className="relative group flex flex-col items-center px-1.5 py-1 hover:text-primary transition-colors rounded-lg hover:bg-gray-50">
                        <Link size={18} />
                        <span className="text-[9px] mt-0.5 text-text-secondary group-hover:text-primary">초대</span>
                        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">초대 링크 복사</span>
                    </button>
                    <button onClick={onOpenHistory} className="relative group flex flex-col items-center px-1.5 py-1 hover:text-primary transition-colors rounded-lg hover:bg-gray-50">
                        <History size={18} />
                        <span className="text-[9px] mt-0.5 text-text-secondary group-hover:text-primary">내역</span>
                        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">주문 내역 보기</span>
                    </button>
                    <button onClick={onOpenPinball} className="relative group flex flex-col items-center px-1.5 py-1 hover:text-primary transition-colors rounded-lg hover:bg-gray-50">
                        <Target size={18} />
                        <span className="text-[9px] mt-0.5 text-text-secondary group-hover:text-primary">게임</span>
                        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">커피 내기 게임</span>
                    </button>
                    <button onClick={onOpenSettings} className="relative group flex flex-col items-center px-1.5 py-1 hover:text-primary transition-colors rounded-lg hover:bg-gray-50">
                        <Settings size={18} />
                        <span className="text-[9px] mt-0.5 text-text-secondary group-hover:text-primary">설정</span>
                        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">그룹 설정</span>
                    </button>
                    <button onClick={onLogout} className="relative group flex flex-col items-center px-1.5 py-1 hover:text-danger transition-colors rounded-lg hover:bg-red-50">
                        <LogOut size={18} />
                        <span className="text-[9px] mt-0.5 text-text-secondary group-hover:text-danger">나가기</span>
                        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">방에서 나가기</span>
                    </button>
                </div>
            </div>

            {/* 카테고리 스크롤 영역 */}
            <div className="relative group px-6 pb-2">
                {canScrollCatLeft && <button onClick={() => scrollContainer(categoryScrollRef, 'left')} className="absolute left-0 top-0 bottom-2 z-10 w-14 bg-gradient-to-r from-white via-white/80 to-transparent flex items-center justify-start pl-3 text-gray-400 hover:text-primary transition-colors"><ChevronLeft size={24} /></button>}
                <div ref={categoryScrollRef} onScroll={() => checkScroll(categoryScrollRef, setCanScrollCatLeft, setCanScrollCatRight)} className="flex overflow-x-auto space-x-2 no-scrollbar">
                    <button onClick={() => onSelectCategory('즐겨찾기')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap flex items-center gap-1 shrink-0 ${selectedCategory === '즐겨찾기' ? 'bg-primary text-white shadow-md' : 'bg-white hover:bg-gray-50'}`}><Heart size={14} fill={selectedCategory === '즐겨찾기' ? 'white' : 'none'} /> 즐겨찾기</button>
                    {CATEGORIES.map(cat => (
                        <button key={cat} onClick={() => onSelectCategory(cat)} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap shrink-0 ${selectedCategory === cat ? 'bg-primary text-white shadow-md' : 'bg-white hover:bg-gray-50'}`}>{cat}</button>
                    ))}
                </div>
                {canScrollCatRight && <button onClick={() => scrollContainer(categoryScrollRef, 'right')} className="absolute right-0 top-0 bottom-2 z-10 w-14 bg-gradient-to-l from-white via-white/80 to-transparent flex items-center justify-end pr-3 text-gray-400 hover:text-primary transition-colors"><ChevronRight size={24} /></button>}
            </div>

            {/* 서브카테고리 영역 */}
            {selectedCategory !== '즐겨찾기' && (
                <div className="relative px-6 py-3 border-t border-dashed border-gray-100 bg-gray-50/50">
                    {canScrollSubLeft && <button onClick={() => scrollContainer(subCategoryScrollRef, 'left')} className="absolute left-0 top-3 bottom-3 z-10 w-12 bg-gradient-to-r from-gray-50 via-gray-50/80 to-transparent flex items-center justify-start pl-3 text-gray-400 hover:text-primary transition-colors"><ChevronLeft size={20} /></button>}
                    <div ref={subCategoryScrollRef} onScroll={() => checkScroll(subCategoryScrollRef, setCanScrollSubLeft, setCanScrollSubRight)} className="flex overflow-x-auto space-x-2 no-scrollbar">
                        {subCategories.map(sub => (
                            <button key={sub} onClick={() => onSelectSubCategory(sub)} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap border shrink-0 ${selectedSubCategory === sub ? 'bg-white border-primary text-primary' : 'border-transparent text-text-secondary hover:bg-gray-200'}`}>{sub}</button>
                        ))}
                    </div>
                    {canScrollSubRight && <button onClick={() => scrollContainer(subCategoryScrollRef, 'right')} className="absolute right-0 top-3 bottom-3 z-10 w-12 bg-gradient-to-l from-gray-50 via-gray-50/80 to-transparent flex items-center justify-end pr-3 text-gray-400 hover:text-primary transition-colors"><ChevronRight size={20} /></button>}
                </div>
            )}
        </div>
    );
};

export default OrderHeader;