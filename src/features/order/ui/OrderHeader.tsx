import React from 'react';
import { Link, History, Target, LogOut, Heart } from 'lucide-react';
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
  onCopyLink: () => void;
  onLogout: () => void;
}

const OrderHeader: React.FC<Props> = ({
                                        groupId, userName, selectedCategory, selectedSubCategory,
                                        onSelectCategory, onSelectSubCategory, subCategories,
                                        onOpenHistory, onOpenPinball, onCopyLink, onLogout
                                      }) => {

  return (
      <div className="bg-surface sticky top-0 z-10 shadow-sm">
        <div className="flex justify-between items-center p-6 pb-2">
          <div className="flex items-center gap-3">
            <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-inner"
                style={{ backgroundColor: getAvatarColor(userName), color: getTextContrastColor() }}
            >
              {userName.slice(0, 2)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">메가커피</h2>
              <p className="text-xs text-text-secondary">{groupId}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={onCopyLink} className="p-2 hover:text-primary"><Link size={20}/></button>
            <button onClick={onOpenHistory} className="p-2 hover:text-primary"><History size={20}/></button>
            <button onClick={onOpenPinball} className="p-2 hover:text-primary"><Target size={20}/></button>
            <button onClick={onLogout} className="p-2 hover:text-danger"><LogOut size={20}/></button>
          </div>
        </div>

        <div className="flex overflow-x-auto space-x-2 no-scrollbar px-6 pb-2">
          <button onClick={() => onSelectCategory('즐겨찾기')}
                  className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap flex items-center gap-1 ${selectedCategory === '즐겨찾기' ? 'bg-primary text-white shadow-md' : 'bg-white'}`}>
            <Heart size={14} fill={selectedCategory === '즐겨찾기' ? 'white' : 'none'} /> 즐겨찾기
          </button>
          {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => onSelectCategory(cat)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap ${selectedCategory === cat ? 'bg-primary text-white shadow-md' : 'bg-white'}`}>
                {cat}
              </button>
          ))}
        </div>

        {selectedCategory !== '즐겨찾기' && (
            <div className="flex overflow-x-auto space-x-2 no-scrollbar px-6 py-3 border-t border-dashed border-gray-100 bg-gray-50/50">
              {subCategories.map(sub => (
                  <button key={sub} onClick={() => onSelectSubCategory(sub)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap border ${selectedSubCategory === sub ? 'bg-white border-primary text-primary' : 'border-transparent text-text-secondary'}`}>
                    {sub}
                  </button>
              ))}
            </div>
        )}
      </div>
  );
};

export default OrderHeader;