import { useState, useMemo, useCallback } from 'react';
import { Menu } from '../../../shared/types';
import { convertEngToKor, isEnglishInput } from '../../../shared/utils/engToKor';
import { isAllChosung, matchChosung } from '../../../shared/utils/chosung';

interface UseMenuSearchReturn {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    isSearchMode: boolean;
    setIsSearchMode: (mode: boolean) => void;
    searchResults: Menu[];
    convertedQuery: string;
    clearSearch: () => void;
}

export const useMenuSearch = (menus: Menu[]): UseMenuSearchReturn => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchMode, setIsSearchMode] = useState(false);

    // 영문 입력을 한글로 변환한 결과
    const convertedQuery = useMemo(() => {
        if (!searchQuery) return '';
        if (isEnglishInput(searchQuery)) {
            return convertEngToKor(searchQuery);
        }
        return searchQuery;
    }, [searchQuery]);

    // 검색 결과 필터링
    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return [];

        const query = searchQuery.trim().toLowerCase();
        const korQuery = convertedQuery.trim();

        // 결과를 담을 Set (중복 방지)
        const resultSet = new Set<number>();
        const results: Menu[] = [];

        const addResult = (menu: Menu) => {
            if (!resultSet.has(menu.id)) {
                resultSet.add(menu.id);
                results.push(menu);
            }
        };

        // '추가' 카테고리는 검색 결과에서 제외
        const searchableMenus = menus.filter(m => m.categoryUpper !== '추가');

        for (const menu of searchableMenus) {
            const menuNameLower = menu.name.toLowerCase();

            // 1. 원본 입력으로 부분 일치 검색 (한글 직접 입력 시)
            if (menuNameLower.includes(query)) {
                addResult(menu);
                continue;
            }

            // 2. 영→한 변환된 입력으로 부분 일치 검색
            if (korQuery && korQuery !== query && menuNameLower.includes(korQuery.toLowerCase())) {
                addResult(menu);
                continue;
            }

            // 3. 초성 검색
            if (isAllChosung(korQuery)) {
                if (matchChosung(menu.name, korQuery)) {
                    addResult(menu);
                    continue;
                }
            }

            // 4. 원본 입력이 한글이고 초성인 경우
            if (isAllChosung(query)) {
                if (matchChosung(menu.name, query)) {
                    addResult(menu);
                    continue;
                }
            }
        }

        return results;
    }, [searchQuery, convertedQuery, menus]);

    const clearSearch = useCallback(() => {
        setSearchQuery('');
        setIsSearchMode(false);
    }, []);

    return {
        searchQuery,
        setSearchQuery,
        isSearchMode,
        setIsSearchMode,
        searchResults,
        convertedQuery,
        clearSearch,
    };
};
