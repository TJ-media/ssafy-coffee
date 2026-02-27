/**
 * Firestore 메뉴 관리 API
 * menus/{cafeId} 문서의 items 배열과 categories 배열을 관리합니다.
 */
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Menu } from '../../../shared/types';

const getMenuDocRef = (cafeId: string = 'mega') => doc(db, 'menus', cafeId);
const MENU_DOC_REF = getMenuDocRef('mega');

export interface MenuDocument {
    cafeId: string;
    cafeName: string;
    cafeImg: string;
    categories: string[];
    items: Menu[];
}

/**
 * 메뉴 문서 전체 조회
 */
export const fetchMenuDocument = async (): Promise<MenuDocument | null> => {
    const snapshot = await getDoc(MENU_DOC_REF);
    if (snapshot.exists()) {
        return snapshot.data() as MenuDocument;
    }
    return null;
};

/**
 * 메뉴 아이템 배열 업데이트 (추가/수정/삭제 후 전체 배열 저장)
 */
export const updateMenuItems = async (items: Menu[]): Promise<void> => {
    await updateDoc(MENU_DOC_REF, { items });
};

/**
 * 카테고리 배열 업데이트
 */
export const updateCategories = async (categories: string[]): Promise<void> => {
    await updateDoc(MENU_DOC_REF, { categories });
};

/**
 * 메뉴 아이템 추가
 */
export const addMenuItem = async (currentItems: Menu[], newItem: Menu): Promise<Menu[]> => {
    const updatedItems = [...currentItems, newItem];
    await updateMenuItems(updatedItems);
    return updatedItems;
};

/**
 * 메뉴 아이템 수정
 */
export const updateMenuItem = async (currentItems: Menu[], updatedItem: Menu): Promise<Menu[]> => {
    const updatedItems = currentItems.map(item =>
        item.id === updatedItem.id ? updatedItem : item
    );
    await updateMenuItems(updatedItems);
    return updatedItems;
};

/**
 * 메뉴 아이템 삭제
 */
export const deleteMenuItem = async (currentItems: Menu[], itemId: number): Promise<Menu[]> => {
    const updatedItems = currentItems.filter(item => item.id !== itemId);
    await updateMenuItems(updatedItems);
    return updatedItems;
};
