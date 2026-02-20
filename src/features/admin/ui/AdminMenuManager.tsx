import React, { useState, useMemo } from 'react';
import {
    Plus,
    Pencil,
    Trash2,
    X,
    Loader2,
    Search,
    Coffee,
    Save,
    AlertTriangle,
    Tag,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { useMenuData } from '../../menu/hooks/useMenuData';
import { addMenuItem, updateMenuItem, deleteMenuItem, updateCategories } from '../api/menuAdminApi';
import { Menu } from '../../../shared/types';

interface ToastFn {
    (message: string, type?: 'info' | 'success' | 'warning'): void;
}

interface Props {
    addToast: ToastFn;
}

interface MenuFormData {
    name: string;
    price: string;
    hotPrice: string;
    categoryUpper: string;
    categoryLower: string;
    img: string;
    hasOption: boolean;
}

const EMPTY_FORM: MenuFormData = {
    name: '',
    price: '',
    hotPrice: '',
    categoryUpper: '',
    categoryLower: '',
    img: '☕',
    hasOption: false,
};

const EMOJI_OPTIONS = ['☕', '🥤', '🧋', '🍵', '🥛', '🧃', '🍹', '🍨', '🍞', '🎁', '💊', '🍰', '🥐', '🫖', '🍫', '🥜'];

const AdminMenuManager: React.FC<Props> = ({ addToast }) => {
    const { menus, categories, loading, error } = useMenuData();

    // ─── UI 상태 ───
    const [filterCategory, setFilterCategory] = useState<string>('전체');
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
    const [formData, setFormData] = useState<MenuFormData>(EMPTY_FORM);
    const [isSaving, setIsSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    // ─── 카테고리 관리 상태 ───
    const [showCategoryManager, setShowCategoryManager] = useState(false);
    const [newCategory, setNewCategory] = useState('');

    // ─── 필터링된 메뉴 ───
    const filteredMenus = useMemo(() => {
        let result = menus;

        if (filterCategory !== '전체') {
            result = result.filter(m => m.categoryUpper === filterCategory);
        }

        if (searchQuery.trim()) {
            const q = searchQuery.trim().toLowerCase();
            result = result.filter(m =>
                m.name.toLowerCase().includes(q) ||
                m.categoryLower.toLowerCase().includes(q)
            );
        }

        return result;
    }, [menus, filterCategory, searchQuery]);

    // ─── 상위 카테고리별 하위 카테고리 목록 ───
    const lowerCategoriesForUpper = useMemo(() => {
        const map: Record<string, string[]> = {};
        menus.forEach(m => {
            if (!map[m.categoryUpper]) map[m.categoryUpper] = [];
            if (!map[m.categoryUpper].includes(m.categoryLower)) {
                map[m.categoryUpper].push(m.categoryLower);
            }
        });
        return map;
    }, [menus]);

    // ─── 다음 ID 계산 ───
    const getNextId = (): number => {
        if (menus.length === 0) return 1;
        return Math.max(...menus.map(m => m.id)) + 1;
    };

    // ─── 모달 열기 (추가) ───
    const handleOpenAdd = () => {
        setEditingMenu(null);
        setFormData({
            ...EMPTY_FORM,
            categoryUpper: categories.filter(c => c !== '메뉴 추가')[0] || '',
        });
        setIsModalOpen(true);
    };

    // ─── 모달 열기 (수정) ───
    const handleOpenEdit = (menu: Menu) => {
        setEditingMenu(menu);
        setFormData({
            name: menu.name,
            price: String(menu.price),
            hotPrice: menu.hotPrice !== undefined ? String(menu.hotPrice) : '',
            categoryUpper: menu.categoryUpper,
            categoryLower: menu.categoryLower,
            img: menu.img,
            hasOption: menu.hasOption,
        });
        setIsModalOpen(true);
    };

    // ─── 모달 닫기 ───
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingMenu(null);
        setFormData(EMPTY_FORM);
    };

    // ─── 저장 (추가/수정) ───
    const handleSave = async () => {
        // 유효성 검사
        if (!formData.name.trim()) {
            addToast('메뉴 이름을 입력해주세요.', 'warning');
            return;
        }
        if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
            addToast('올바른 가격을 입력해주세요.', 'warning');
            return;
        }
        if (!formData.categoryUpper.trim()) {
            addToast('상위 카테고리를 선택해주세요.', 'warning');
            return;
        }
        if (!formData.categoryLower.trim()) {
            addToast('하위 카테고리를 입력해주세요.', 'warning');
            return;
        }
        if (formData.hotPrice && (isNaN(Number(formData.hotPrice)) || Number(formData.hotPrice) <= 0)) {
            addToast('올바른 HOT 가격을 입력해주세요.', 'warning');
            return;
        }

        setIsSaving(true);
        try {
            const menuItem: Menu = {
                id: editingMenu ? editingMenu.id : getNextId(),
                name: formData.name.trim(),
                price: Number(formData.price),
                ...(formData.hotPrice ? { hotPrice: Number(formData.hotPrice) } : {}),
                categoryUpper: formData.categoryUpper.trim(),
                categoryLower: formData.categoryLower.trim(),
                img: formData.img,
                hasOption: formData.hasOption,
            };

            if (editingMenu) {
                await updateMenuItem(menus, menuItem);
                addToast(`"${menuItem.name}" 메뉴가 수정되었습니다.`, 'success');
            } else {
                await addMenuItem(menus, menuItem);
                addToast(`"${menuItem.name}" 메뉴가 추가되었습니다.`, 'success');
            }
            handleCloseModal();
        } catch (err) {
            console.error('메뉴 저장 실패:', err);
            addToast('메뉴 저장에 실패했습니다.', 'warning');
        } finally {
            setIsSaving(false);
        }
    };

    // ─── 삭제 ───
    const handleDelete = async (menu: Menu) => {
        if (!confirm(`"${menu.name}" 메뉴를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;

        setDeletingId(menu.id);
        try {
            await deleteMenuItem(menus, menu.id);
            addToast(`"${menu.name}" 메뉴가 삭제되었습니다.`, 'success');
        } catch (err) {
            console.error('메뉴 삭제 실패:', err);
            addToast('메뉴 삭제에 실패했습니다.', 'warning');
        } finally {
            setDeletingId(null);
        }
    };

    // ─── 카테고리 추가 ───
    const handleAddCategory = async () => {
        const name = newCategory.trim();
        if (!name) {
            addToast('카테고리 이름을 입력해주세요.', 'warning');
            return;
        }
        if (categories.includes(name)) {
            addToast('이미 존재하는 카테고리입니다.', 'warning');
            return;
        }

        try {
            await updateCategories([...categories, name]);
            addToast(`"${name}" 카테고리가 추가되었습니다.`, 'success');
            setNewCategory('');
        } catch (err) {
            console.error('카테고리 추가 실패:', err);
            addToast('카테고리 추가에 실패했습니다.', 'warning');
        }
    };

    // ─── 카테고리 삭제 ───
    const handleDeleteCategory = async (cat: string) => {
        const menusInCategory = menus.filter(m => m.categoryUpper === cat);
        if (menusInCategory.length > 0) {
            addToast(`"${cat}" 카테고리에 ${menusInCategory.length}개의 메뉴가 있어 삭제할 수 없습니다.`, 'warning');
            return;
        }
        if (!confirm(`"${cat}" 카테고리를 삭제하시겠습니까?`)) return;

        try {
            await updateCategories(categories.filter(c => c !== cat));
            addToast(`"${cat}" 카테고리가 삭제되었습니다.`, 'success');
            if (filterCategory === cat) setFilterCategory('전체');
        } catch (err) {
            console.error('카테고리 삭제 실패:', err);
            addToast('카테고리 삭제에 실패했습니다.', 'warning');
        }
    };

    // ─── 로딩/에러 상태 ───
    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 size={32} className="animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                <AlertTriangle size={32} className="text-danger mx-auto mb-3" />
                <p className="text-sm text-danger font-medium">{error}</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in-up">
            {/* ─── 헤더 ─── */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                        <Coffee size={22} className="text-orange-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-text-primary">메뉴 관리</h2>
                        <p className="text-sm text-text-secondary">
                            총 {menus.length}개 메뉴 · {categories.filter(c => c !== '메뉴 추가').length}개 카테고리
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowCategoryManager(!showCategoryManager)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition ${showCategoryManager
                            ? 'bg-orange-100 text-orange-600'
                            : 'bg-white border border-gray-200 text-text-secondary hover:bg-gray-50'
                            }`}
                    >
                        <Tag size={16} />
                        카테고리
                        {showCategoryManager ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    <button
                        onClick={handleOpenAdd}
                        className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition shadow-md shadow-primary/20"
                    >
                        <Plus size={16} />
                        메뉴 추가
                    </button>
                </div>
            </div>

            {/* ─── 카테고리 관리 영역 ─── */}
            {showCategoryManager && (
                <div className="bg-white rounded-2xl shadow-toss p-5 mb-6 animate-fade-in-up">
                    <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                        <Tag size={16} className="text-orange-500" />
                        카테고리 관리
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {categories.map(cat => (
                            <div
                                key={cat}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg text-sm"
                            >
                                <span className="text-text-primary font-medium">{cat}</span>
                                <span className="text-xs text-text-secondary">
                                    ({menus.filter(m => m.categoryUpper === cat).length})
                                </span>
                                {cat !== '메뉴 추가' && (
                                    <button
                                        onClick={() => handleDeleteCategory(cat)}
                                        className="ml-1 p-0.5 rounded hover:bg-red-100 text-gray-400 hover:text-danger transition"
                                        title="삭제"
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newCategory}
                            onChange={e => setNewCategory(e.target.value)}
                            placeholder="새 카테고리 이름"
                            className="flex-1 px-3 py-2 bg-background rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                        />
                        <button
                            onClick={handleAddCategory}
                            className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition"
                        >
                            추가
                        </button>
                    </div>
                </div>
            )}

            {/* ─── 필터 & 검색 ─── */}
            <div className="bg-white rounded-2xl shadow-toss p-4 mb-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* 카테고리 필터 */}
                    <div className="flex overflow-x-auto gap-1.5 no-scrollbar">
                        <button
                            onClick={() => setFilterCategory('전체')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition ${filterCategory === '전체'
                                ? 'bg-primary text-white shadow-sm'
                                : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                                }`}
                        >
                            전체 ({menus.length})
                        </button>
                        {categories.filter(c => c !== '메뉴 추가').map(cat => {
                            const count = menus.filter(m => m.categoryUpper === cat).length;
                            return (
                                <button
                                    key={cat}
                                    onClick={() => setFilterCategory(cat)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition ${filterCategory === cat
                                        ? 'bg-primary text-white shadow-sm'
                                        : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                                        }`}
                                >
                                    {cat} ({count})
                                </button>
                            );
                        })}
                    </div>

                    {/* 검색 */}
                    <div className="relative sm:ml-auto sm:w-56 shrink-0">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="메뉴 검색..."
                            className="w-full pl-9 pr-3 py-1.5 bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                </div>
            </div>

            {/* ─── 메뉴 목록 ─── */}
            {filteredMenus.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-toss p-10 text-center">
                    <Coffee size={32} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-text-secondary">
                        {searchQuery ? '검색 결과가 없습니다.' : '등록된 메뉴가 없습니다.'}
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-toss overflow-hidden">
                    {/* 목록 헤더 */}
                    <div className="hidden sm:grid grid-cols-[3fr_1fr_1fr_1fr_auto] gap-3 px-5 py-3 bg-gray-50 text-xs font-bold text-text-secondary uppercase tracking-wider border-b border-gray-100">
                        <span>메뉴</span>
                        <span>가격</span>
                        <span>카테고리</span>
                        <span>옵션</span>
                        <span className="w-20 text-center">관리</span>
                    </div>

                    <div className="divide-y divide-gray-50 max-h-[60vh] overflow-y-auto">
                        {filteredMenus.map(menu => (
                            <div
                                key={menu.id}
                                className="px-5 py-4 hover:bg-gray-50/50 transition grid grid-cols-1 sm:grid-cols-[3fr_1fr_1fr_1fr_auto] gap-2 sm:gap-3 items-center"
                            >
                                {/* 메뉴 정보 */}
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl shrink-0">{menu.img}</span>
                                    <div className="min-w-0">
                                        <p className="font-bold text-text-primary text-sm truncate">{menu.name}</p>
                                        <p className="text-xs text-text-secondary sm:hidden">
                                            {menu.categoryUpper} · {menu.categoryLower}
                                        </p>
                                    </div>
                                </div>

                                {/* 가격 */}
                                <div className="text-sm">
                                    <span className="font-bold text-text-primary">{menu.price.toLocaleString()}원</span>
                                    {menu.hotPrice !== undefined && (
                                        <span className="text-xs text-orange-500 ml-1">
                                            (HOT {menu.hotPrice.toLocaleString()}원)
                                        </span>
                                    )}
                                </div>

                                {/* 카테고리 */}
                                <div className="hidden sm:block">
                                    <span className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-600 rounded-md">
                                        {menu.categoryUpper}
                                    </span>
                                    <span className="text-xs text-text-secondary ml-1">{menu.categoryLower}</span>
                                </div>

                                {/* 옵션 */}
                                <div className="hidden sm:block">
                                    {menu.hasOption ? (
                                        <span className="text-xs font-medium px-2 py-1 bg-green-50 text-green-600 rounded-md">ICE/HOT</span>
                                    ) : (
                                        <span className="text-xs text-text-secondary">—</span>
                                    )}
                                </div>

                                {/* 관리 버튼 */}
                                <div className="flex items-center gap-1.5 w-20 justify-end sm:justify-center">
                                    <button
                                        onClick={() => handleOpenEdit(menu)}
                                        className="p-2 rounded-lg hover:bg-blue-50 text-text-secondary hover:text-primary transition"
                                        title="수정"
                                    >
                                        <Pencil size={15} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(menu)}
                                        disabled={deletingId === menu.id}
                                        className="p-2 rounded-lg hover:bg-red-50 text-text-secondary hover:text-danger transition disabled:opacity-50"
                                        title="삭제"
                                    >
                                        {deletingId === menu.id ? (
                                            <Loader2 size={15} className="animate-spin" />
                                        ) : (
                                            <Trash2 size={15} />
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* 목록 푸터 */}
                    <div className="px-5 py-3 bg-gray-50 text-xs text-text-secondary border-t border-gray-100 flex justify-between">
                        <span>총 {filteredMenus.length}개 메뉴</span>
                        {filterCategory !== '전체' && (
                            <button
                                onClick={() => setFilterCategory('전체')}
                                className="text-primary hover:underline font-medium"
                            >
                                전체 보기
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════ */}
            {/* ─── 추가/수정 모달 ─── */}
            {/* ═══════════════════════════════════════════ */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-in-up">
                        {/* 모달 헤더 */}
                        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                                    {editingMenu ? <Pencil size={20} className="text-orange-500" /> : <Plus size={20} className="text-orange-500" />}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-text-primary">
                                        {editingMenu ? '메뉴 수정' : '새 메뉴 추가'}
                                    </h3>
                                    <p className="text-xs text-text-secondary">
                                        {editingMenu ? `ID: ${editingMenu.id}` : `ID: ${getNextId()} (자동 부여)`}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleCloseModal}
                                className="p-2 rounded-lg hover:bg-gray-100 transition text-text-secondary"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* 모달 내용 */}
                        <div className="px-6 py-5 space-y-4">
                            {/* 이모지 선택 */}
                            <div>
                                <label className="block text-xs font-bold text-text-secondary mb-2 uppercase tracking-wider">아이콘</label>
                                <div className="flex flex-wrap gap-1.5">
                                    {EMOJI_OPTIONS.map(emoji => (
                                        <button
                                            key={emoji}
                                            onClick={() => setFormData(prev => ({ ...prev, img: emoji }))}
                                            className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${formData.img === emoji
                                                ? 'bg-primary/10 ring-2 ring-primary scale-110'
                                                : 'bg-gray-50 hover:bg-gray-100'
                                                }`}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 메뉴 이름 */}
                            <div>
                                <label className="block text-xs font-bold text-text-secondary mb-2 uppercase tracking-wider">메뉴 이름 *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="예: 아메리카노"
                                    className="w-full px-4 py-3 bg-background rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                                />
                            </div>

                            {/* 가격 */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-text-secondary mb-2 uppercase tracking-wider">가격 (원) *</label>
                                    <input
                                        type="number"
                                        value={formData.price}
                                        onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                                        placeholder="2000"
                                        className="w-full px-4 py-3 bg-background rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-text-secondary mb-2 uppercase tracking-wider">HOT 가격 (선택)</label>
                                    <input
                                        type="number"
                                        value={formData.hotPrice}
                                        onChange={e => setFormData(prev => ({ ...prev, hotPrice: e.target.value }))}
                                        placeholder="비워두면 동일"
                                        className="w-full px-4 py-3 bg-background rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                                    />
                                </div>
                            </div>

                            {/* 카테고리 */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-text-secondary mb-2 uppercase tracking-wider">상위 카테고리 *</label>
                                    <select
                                        value={formData.categoryUpper}
                                        onChange={e => setFormData(prev => ({ ...prev, categoryUpper: e.target.value, categoryLower: '' }))}
                                        className="w-full px-4 py-3 bg-background rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition appearance-none cursor-pointer"
                                    >
                                        <option value="">선택</option>
                                        {categories.filter(c => c !== '메뉴 추가').map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-text-secondary mb-2 uppercase tracking-wider">하위 카테고리 *</label>
                                    <input
                                        type="text"
                                        value={formData.categoryLower}
                                        onChange={e => setFormData(prev => ({ ...prev, categoryLower: e.target.value }))}
                                        placeholder="예: 에스프레소"
                                        list="lower-categories"
                                        className="w-full px-4 py-3 bg-background rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                                    />
                                    <datalist id="lower-categories">
                                        {(lowerCategoriesForUpper[formData.categoryUpper] || []).map(lc => (
                                            <option key={lc} value={lc} />
                                        ))}
                                    </datalist>
                                </div>
                            </div>

                            {/* ICE/HOT 옵션 */}
                            <div>
                                <label className="block text-xs font-bold text-text-secondary mb-2 uppercase tracking-wider">ICE/HOT 선택 가능</label>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setFormData(prev => ({ ...prev, hasOption: true }))}
                                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition border-2 ${formData.hasOption
                                            ? 'bg-green-50 text-green-600 border-green-400'
                                            : 'bg-gray-50 text-gray-400 border-transparent hover:bg-gray-100'
                                            }`}
                                    >
                                        ✅ 예
                                    </button>
                                    <button
                                        onClick={() => setFormData(prev => ({ ...prev, hasOption: false }))}
                                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition border-2 ${!formData.hasOption
                                            ? 'bg-gray-100 text-gray-600 border-gray-400'
                                            : 'bg-gray-50 text-gray-400 border-transparent hover:bg-gray-100'
                                            }`}
                                    >
                                        ❌ 아니오
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 모달 푸터 */}
                        <div className="px-6 pb-6 pt-2 flex gap-3">
                            <button
                                onClick={handleCloseModal}
                                className="flex-1 py-3.5 rounded-xl border border-gray-200 text-text-secondary font-medium text-sm hover:bg-gray-50 transition"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex-1 py-3.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-dark transition disabled:bg-gray-300 flex items-center justify-center gap-2 shadow-md shadow-primary/20"
                            >
                                {isSaving ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <>
                                        <Save size={18} />
                                        {editingMenu ? '수정 완료' : '메뉴 추가'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminMenuManager;
