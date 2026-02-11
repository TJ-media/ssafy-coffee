import { useMemo, RefObject } from 'react'; // useState 제거 (부모가 제어함)
import { CartItem, GroupedCartItem, OptionType } from '../../types';
import { ShoppingCart, Trash2, ChevronDown, Plus, Minus } from 'lucide-react';
import { getAvatarColor, getTextContrastColor } from '../../utils';

interface Props {
    cart: CartItem[];
    totalPrice: number;
    userName: string;
    cartFabRef: RefObject<HTMLButtonElement | null>;
    cartSheetRef: RefObject<HTMLDivElement | null>;
    onRemove: (name: string, option: OptionType) => void;
    onAdd: (name: string, price: number, option: OptionType) => void;
    onClear: () => void;
    // 👇 추가된 Props (에러 해결 핵심)
    onClose: () => void;
    onEdit: (item: CartItem) => void;
}

const CartSheet = ({
                       cart, totalPrice, userName, cartSheetRef,
                       onRemove, onAdd, onClear, onClose
                   }: Props) => {

    // useMemo를 사용하여 장바구니 연산 최적화
    const groupedCart = useMemo(() => {
        return cart.reduce<Record<string, GroupedCartItem>>((acc, item) => {
            const key = `${item.menuName}_${item.option}`;
            if (!acc[key]) {
                acc[key] = {
                    count: 0,
                    names: [],
                    price: item.price,
                    menuName: item.menuName,
                    option: item.option
                };
            }
            acc[key].count += 1;
            acc[key].names.push(item.userName);
            return acc;
        }, {});
    }, [cart]);

    // 💡 중요: 이제 isOpen 상태와 FAB 버튼 렌더링은 OrderPage.tsx에서 담당하므로 여기선 제거합니다.
    // 오직 "열려있는 상태의 시트 UI"만 반환합니다.

    return (
        <>
            {/* 배경 클릭 시 닫기 */}
            <div className="absolute inset-0 bg-black/20 z-10 backdrop-blur-[2px]" onClick={onClose}></div>

            <div className="absolute bottom-0 w-full bg-surface rounded-t-3xl shadow-toss-up p-6 z-20 animate-slide-up flex flex-col max-h-[60%]">
                {/* 상단 핸들 클릭 시 닫기 */}
                <div className="flex justify-center -mt-2 mb-2 cursor-pointer" onClick={onClose}>
                    <div className="w-12 h-1.5 bg-gray-300 rounded-full mb-2"></div>
                </div>

                <div className="flex justify-between items-center mb-4 shrink-0">
                    <div ref={cartSheetRef}>
                        <h3 className="text-lg font-bold flex items-center gap-2 text-text-primary">
                            <ShoppingCart size={20} /> 장바구니 <span className="text-primary">{cart.length}</span>
                        </h3>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-text-primary">{totalPrice.toLocaleString()}원</span>
                        {/* 화살표 버튼 클릭 시 닫기 */}
                        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                            <ChevronDown size={24} className="text-gray-400"/>
                        </button>
                    </div>
                </div>

                <div className="overflow-y-auto space-y-3 mb-4 pr-1 custom-scrollbar flex-1">
                    {Object.entries(groupedCart).length === 0 ? (
                        <div className="text-center py-10 text-text-secondary bg-background rounded-xl">
                            <p>장바구니가 비어있어요.</p>
                        </div>
                    ) : (
                        Object.entries(groupedCart).map(([key, info]) => (
                            <div key={key} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-text-primary flex items-center gap-2">
                    {info.menuName}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${info.option === 'ICE' ? 'bg-blue-50 text-blue-500' : info.option === 'HOT' ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-500'}`}>
                      {info.option === 'ONLY' ? '-' : info.option}
                    </span>
                  </span>
                                    <span className="font-bold text-text-primary">{(info.price * info.count).toLocaleString()}원</span>
                                </div>

                                <div className="flex justify-between items-end">
                                    <div className="flex -space-x-2 py-1 max-w-[150px] overflow-hidden">
                                        {info.names.map((name, idx) => (
                                            <div
                                                key={idx}
                                                className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                                                style={{ backgroundColor: getAvatarColor(name), color: getTextContrastColor() }}
                                                title={name}
                                            >
                                                {name.slice(0,1)}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex items-center bg-white rounded-lg border border-gray-200 h-8 overflow-hidden">
                                        <button
                                            onClick={() => onRemove(info.menuName, info.option)}
                                            disabled={!info.names.includes(userName)}
                                            className="w-8 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-colors"
                                        >
                                            <Minus size={14}/>
                                        </button>
                                        <span className="w-8 text-center text-sm font-bold text-text-primary">{info.count}</span>
                                        <button
                                            onClick={() => onAdd(info.menuName, info.price, info.option)}
                                            className="w-8 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
                                        >
                                            <Plus size={14}/>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <button
                    onClick={onClear}
                    disabled={cart.length === 0}
                    className={`w-full py-4 rounded-xl flex justify-center items-center gap-2 font-bold text-lg shrink-0 transition-colors ${cart.length > 0 ? 'bg-primary text-white hover:bg-primary-dark shadow-md' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                >
                    <Trash2 size={20} /> 결제 완료
                </button>
            </div>
        </>
    );
};

export default CartSheet;