import React, { useMemo } from 'react';
import { Link, History, Target, LogOut, Heart } from 'lucide-react';
import { CATEGORIES, MEGA_MENUS } from '../../menuData';
import { getAvatarColor, getTextContrastColor } from '../../utils';
import { useNavigate } from 'react-router-dom';

interface Props {
  groupId: string;
  userName: string;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedSubCategory: string;
  setSelectedSubCategory: (sub: string) => void;
  onOpenHistory: () => void;
  onOpenPinball: () => void;
  onOpenRace: () => void;
  onCopyLink: () => void;
}

const OrderHeader: React.FC<Props> = ({
  groupId, userName, selectedCategory, setSelectedCategory,
  selectedSubCategory, setSelectedSubCategory,
  onOpenHistory, onOpenPinball, onOpenRace, onCopyLink
}) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    if(confirm('나가시겠습니까?')) {
      localStorage.removeItem('ssafy_groupId');
      localStorage.removeItem('ssafy_userName');
      navigate('/');
    }
  };

  const subCategories = useMemo(() => {
    const menus = MEGA_MENUS.filter(m => m.categoryUpper === selectedCategory);
    return ['전체', ...new Set(menus.map(m => m.categoryLower))];
  }, [selectedCategory]);

  return (
    <div className="bg-surface sticky top-0 z-10 shadow-sm">
      <div className="flex justify-between items-center p-6 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-inner"
            style={{ backgroundColor: getAvatarColor(userName), color: getTextContrastColor() }}>
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
          <button onClick={onOpenRace} className="p-2 hover:text-primary animate-pulse">🏎️</button>
          <button onClick={handleLogout} className="p-2 hover:text-danger"><LogOut size={20}/></button>
        </div>
      </div>

      <div className="flex overflow-x-auto space-x-2 no-scrollbar px-6 pb-2">
        <button onClick={() => setSelectedCategory('즐겨찾기')}
          className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap flex items-center gap-1 ${selectedCategory === '즐겨찾기' ? 'bg-primary text-white shadow-md' : 'bg-white'}`}>
          <Heart size={14} fill={selectedCategory === '즐겨찾기' ? 'white' : 'none'} /> 즐겨찾기
        </button>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap ${selectedCategory === cat ? 'bg-primary text-white shadow-md' : 'bg-white'}`}>
            {cat}
          </button>
        ))}
      </div>

      {selectedCategory !== '즐겨찾기' && (
        <div className="flex overflow-x-auto space-x-2 no-scrollbar px-6 py-3 border-t border-dashed border-gray-100 bg-gray-50/50">
          {subCategories.map(sub => (
            <button key={sub} onClick={() => setSelectedSubCategory(sub)}
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