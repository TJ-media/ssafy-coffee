import React, { useRef, useEffect, useMemo } from 'react';
import { Search, X, ArrowLeft } from 'lucide-react';
import { Menu } from '../../../shared/types';
import { isEnglishInput } from '../../../shared/utils/engToKor';

interface Props {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    convertedQuery: string;
    searchResults: Menu[];
    onMenuSelect: (menu: Menu) => void;
    onClose: () => void;
}

/**
 * 검색어에서 매칭된 부분을 하이라이트 처리하여 JSX로 반환
 */
function highlightMatch(text: string, query: string, convertedQuery: string): React.ReactNode {
    if (!query && !convertedQuery) return text;

    // 매칭할 쿼리 결정 (변환된 쿼리 우선)
    const queries = [convertedQuery, query].filter(Boolean);
    let matchStart = -1;
    let matchLength = 0;

    for (const q of queries) {
        const idx = text.toLowerCase().indexOf(q.toLowerCase());
        if (idx >= 0) {
            matchStart = idx;
            matchLength = q.length;
            break;
        }
    }

    if (matchStart < 0) return text;

    return (
        <>
            {text.slice(0, matchStart)}
            <span className="text-primary font-extrabold">{text.slice(matchStart, matchStart + matchLength)}</span>
            {text.slice(matchStart + matchLength)}
        </>
    );
}

const SearchBar: React.FC<Props> = ({
    searchQuery, onSearchChange, convertedQuery,
    searchResults, onMenuSelect, onClose
}) => {
    const inputRef = useRef<HTMLInputElement>(null);

    // 자동 포커스
    useEffect(() => {
        const timer = setTimeout(() => {
            inputRef.current?.focus();
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    // ESC 키로 닫기
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // 영→한 변환 안내 표시 여부
    const showConversionHint = useMemo(() => {
        return searchQuery && isEnglishInput(searchQuery) && convertedQuery !== searchQuery;
    }, [searchQuery, convertedQuery]);

    return (
        <div className="bg-surface sticky top-0 z-20 shadow-md">
            {/* 검색 입력 영역 */}
            <div className="flex items-center gap-2 px-4 py-3">
                <button
                    onClick={onClose}
                    className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500 shrink-0"
                >
                    <ArrowLeft size={20} />
                </button>

                <div className="relative flex-1">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="메뉴 검색 (한글, 영어, 초성)"
                        className="w-full pl-10 pr-10 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-white transition-all"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => onSearchChange('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* 영→한 변환 힌트 */}
            {showConversionHint && (
                <div className="px-6 pb-2 flex items-center gap-1.5">
                    <span className="text-xs text-gray-400">🔄</span>
                    <span className="text-xs text-primary font-bold">{convertedQuery}</span>
                    <span className="text-xs text-gray-400">(으)로 검색 중</span>
                </div>
            )}

            {/* 검색 결과 드롭다운 */}
            {searchQuery.trim() && (
                <div className="border-t border-gray-100">
                    {searchResults.length > 0 ? (
                        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {/* 결과 개수 */}
                            <div className="px-6 py-2 text-xs text-gray-400 bg-gray-50/50">
                                검색 결과 <span className="font-bold text-primary">{searchResults.length}</span>건
                            </div>

                            {searchResults.map((menu) => (
                                <button
                                    key={menu.id}
                                    onClick={() => onMenuSelect(menu)}
                                    className="w-full flex items-center gap-3 px-6 py-3 hover:bg-blue-50/50 active:bg-blue-100/50 transition-colors text-left border-b border-gray-50 last:border-b-0"
                                >
                                    {/* 메뉴 아이콘 */}
                                    <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-xl shrink-0">
                                        {menu.img}
                                    </div>

                                    {/* 메뉴 정보 */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            <span className="font-bold text-gray-800 text-sm truncate">
                                                {highlightMatch(menu.name, searchQuery, convertedQuery)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-blue-500 font-bold">
                                                {menu.price.toLocaleString()}원
                                            </span>
                                            {menu.hasOption && (
                                                <span className="text-[10px] text-gray-400">ICE/HOT</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* 카테고리 뱃지 */}
                                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-500 font-bold whitespace-nowrap">
                                            {menu.categoryUpper}
                                        </span>
                                        <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                            {menu.categoryLower}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <Search size={36} className="mb-3 opacity-30" />
                            <p className="text-sm font-bold mb-1">검색 결과가 없습니다</p>
                            <p className="text-xs">다른 검색어로 시도해보세요</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchBar;
