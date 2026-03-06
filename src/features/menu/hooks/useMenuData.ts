import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Menu } from '../../../shared/types';

interface MenuData {
    cafeId: string;
    cafeName: string;
    cafeImg: string;
    categories: string[];
    items: Menu[];
}

interface UseMenuDataReturn {
    menus: Menu[];
    categories: string[];
    loading: boolean;
    error: string | null;
}

export const useMenuData = (cafeId: string = 'mega'): UseMenuDataReturn => {
    const [menus, setMenus] = useState<Menu[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const docRef = doc(db, 'menus', cafeId);

        setLoading(true);
        setError(null);

        const unsubscribe = onSnapshot(
            docRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.data() as MenuData;
                    setMenus((data.items || []).sort((a, b) => a.id - b.id));
                    const rawCats = (data.categories || []).filter((c: string) => c !== '추가');
                    setCategories(rawCats.includes('메뉴 추가') ? rawCats : ['메뉴 추가', ...rawCats]);
                } else {
                    setError('메뉴 데이터를 찾을 수 없습니다.');
                    setMenus([]);
                    setCategories([]);
                }
                setLoading(false);
            },
            (err) => {
                console.error('메뉴 데이터 로딩 실패:', err);
                setError('메뉴 데이터를 불러오는데 실패했습니다.');
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [cafeId]);

    return { menus, categories, loading, error };
};
