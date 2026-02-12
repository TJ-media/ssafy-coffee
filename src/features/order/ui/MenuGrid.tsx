import React from 'react';
import { MEGA_MENUS } from '../../../menuData';
import { Menu, OptionType } from '../../../shared/types';
import { Heart } from 'lucide-react';

interface Props {
  selectedCategory: string;
  selectedSubCategory: string;
  favoriteMenuIds: number[];
  onAddToCart: (e: React.MouseEvent, menu: Menu, option: OptionType) => void;
  onToggleFavorite: (menu: Menu) => void;
}

const MenuGrid: React.FC<Props> = ({
                                     selectedCategory, selectedSubCategory, favoriteMenuIds, onAddToCart, onToggleFavorite
                                   }) => {
  const favoriteMenus = MEGA_MENUS.filter(m => favoriteMenuIds.includes(m.id));
  const currentMenus = selectedCategory === '즐겨찾기'
      ? favoriteMenus
      : MEGA_MENUS.filter(m => m.categoryUpper === selectedCategory);

  if (selectedCategory === '즐겨찾기' && favoriteMenus.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Heart size={48} className="mb-4 opacity-30" />
          <p>즐겨찾기한 메뉴가 없어요</p>
        </div>
    );
  }

  return (
      <div className="grid grid-cols-2 gap-4 pb-32">
        {currentMenus
            .filter(m => selectedCategory === '즐겨찾기' || selectedSubCategory === '전체' || m.categoryLower === selectedSubCategory)
            .map(menu => (
                <div key={menu.id} className="bg-white p-4 rounded-2xl shadow-sm flex flex-col items-center transition hover:-translate-y-1 relative group">
                  <button onClick={() => onToggleFavorite(menu)} className="absolute top-3 right-3 p-1 hover:scale-110 transition z-10">
                    <Heart size={20} className={`${favoriteMenuIds.includes(menu.id) ? 'text-red-500 fill-red-500' : 'text-gray-300'} transition-colors`} />
                  </button>

                  <div className="text-5xl mb-3">{menu.img}</div>

                  {selectedSubCategory === '전체' && (
                      <span className="text-[10px] text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full mb-1 font-bold">{menu.categoryLower}</span>
                  )}

                  <h3 className="font-bold text-gray-800 text-center break-keep mb-1 leading-tight">{menu.name}</h3>
                  <p className="text-sm text-blue-500 font-bold mb-3">{menu.price.toLocaleString()}원</p>

                  <div className="flex w-full gap-2 mt-auto">
                    {menu.hasOption ? (
                        <>
                          <button onClick={(e) => onAddToCart(e, menu, 'ICE')} className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-xl text-xs font-bold hover:bg-blue-100 active:scale-95">ICE</button>
                          <button onClick={(e) => onAddToCart(e, menu, 'HOT')} className="flex-1 bg-red-50 text-red-600 py-2 rounded-xl text-xs font-bold hover:bg-red-100 active:scale-95">HOT</button>
                        </>
                    ) : (
                        <button onClick={(e) => onAddToCart(e, menu, 'ONLY')} className="w-full bg-gray-100 text-gray-800 py-2 rounded-xl text-xs font-bold hover:bg-gray-200 active:scale-95">담기</button>
                    )}
                  </div>
                </div>
            ))}
      </div>
  );
};

export default MenuGrid;