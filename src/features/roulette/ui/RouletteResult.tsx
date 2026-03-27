import { useState, useCallback, useEffect } from 'react';
import { Trophy, Coffee, ExternalLink, Copy, Check, Smartphone, ChevronLeft, X } from 'lucide-react';
import { getAvatarColor } from '../../../shared/utils';
import { GroupedCartItem } from '../../../shared/types';
import { useLayoutStore } from '../../../shared/store/useLayoutStore';
import { CAFE_DEEP_LINKS } from '../../../shared/config/cafeDeepLinks';

interface RouletteResultProps {
    winner: string;
    finishOrder?: string[];
    onReset: () => void;
    isWinner?: boolean;
    orderItems?: GroupedCartItem[];
    totalPrice?: number;
    cafeId?: string;
    cafeName?: string;
}

const RouletteResult = ({
    winner,
    finishOrder,
    onReset,
    isWinner = false,
    orderItems = [],
    totalPrice = 0,
    cafeId = '',
    cafeName = '',
}: RouletteResultProps) => {
    const [view, setView] = useState<'result' | 'redirect'>('result');
    const [copied, setCopied] = useState(false);
    const isDesktopDevice = useLayoutStore(state => state.isDesktopDevice);

    const orderText = [
        `[${cafeName}] 주문 목록`,
        ...orderItems.map(item => {
            const opt = item.option !== 'ONLY' ? ` (${item.option})` : '';
            return `- ${item.menuName}${opt} x${item.count}`;
        }),
        `총 ${orderItems.reduce((s, i) => s + i.count, 0)}잔 / ${totalPrice.toLocaleString()}원`,
    ].join('\n');

    const copyToClipboard = useCallback(async () => {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(orderText);
            } else {
                const el = document.createElement('textarea');
                el.value = orderText;
                el.style.position = 'fixed';
                el.style.left = '-9999px';
                document.body.appendChild(el);
                el.select();
                document.execCommand('copy');
                document.body.removeChild(el);
            }
            setCopied(true);
        } catch (e) {
            console.error('클립보드 복사 실패:', e);
        }
    }, [orderText]);

    // redirect 뷰로 전환 시 자동 복사
    useEffect(() => {
        if (view === 'redirect') {
            setCopied(false);
            copyToClipboard();
        }
    }, [view]);

    const handleOpenApp = useCallback(() => {
        const deepLink = CAFE_DEEP_LINKS[cafeId];
        if (!deepLink) return;
        copyToClipboard();
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const appUrl = isIOS ? deepLink.ios : deepLink.android;
        const fallbackUrl = isIOS ? deepLink.fallback.ios : deepLink.fallback.android;
        let appOpened = false;
        const onVisChange = () => { if (document.hidden) appOpened = true; };
        document.addEventListener('visibilitychange', onVisChange);
        window.location.href = appUrl;
        setTimeout(() => {
            document.removeEventListener('visibilitychange', onVisChange);
            if (!appOpened) window.open(fallbackUrl, '_blank');
        }, 3000);
    }, [cafeId, copyToClipboard]);

    const orderItemCard = (item: GroupedCartItem, index: number) => (
        <div key={index} className="flex justify-between items-center bg-white rounded-xl px-3 py-2.5 border border-gray-100">
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <span className="text-text-primary font-medium text-sm">{item.menuName}</span>
                    {item.option !== 'ONLY' && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-md font-bold ${
                            item.option === 'ICE' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'
                        }`}>
                            {item.option}
                        </span>
                    )}
                </div>
                <div className="text-xs text-text-secondary mt-0.5">{item.names.join(', ')}</div>
            </div>
            <div className="text-right">
                <span className="text-text-secondary text-sm">x{item.count}</span>
                <div className="text-primary font-bold text-sm">{(item.price * item.count).toLocaleString()}원</div>
            </div>
        </div>
    );

    // ── redirect 뷰 ──────────────────────────────────────────────
    if (view === 'redirect') {
        const webOrderUrl = CAFE_DEEP_LINKS[cafeId]?.webOrder;
        const hasDeepLink = !!CAFE_DEEP_LINKS[cafeId];
        const totalCount = orderItems.reduce((s, i) => s + i.count, 0);

        return (
            <div className="py-4 pinball-result-enter max-w-lg mx-auto">
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={() => setView('result')}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600 shrink-0"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <h3 className="text-base font-bold text-text-primary">
                        {cafeName} {isDesktopDevice && webOrderUrl ? '웹에서' : '앱에서'} 주문하기
                    </h3>
                    <button
                        onClick={onReset}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600 shrink-0"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* 주문 목록 */}
                <div className="bg-background rounded-2xl p-3 mb-3 max-h-44 overflow-y-auto custom-scrollbar">
                    <div className="space-y-1.5">
                        {orderItems.map((item, i) => (
                            <div key={i} className="flex justify-between items-center text-sm">
                                <span className="text-text-primary font-medium">
                                    {item.menuName}
                                    {item.option !== 'ONLY' && (
                                        <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-md font-bold ${
                                            item.option === 'ICE' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'
                                        }`}>{item.option}</span>
                                    )}
                                </span>
                                <span className="text-text-secondary ml-2">x{item.count}</span>
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-gray-200 mt-2.5 pt-2.5 flex justify-between text-sm">
                        <span className="text-text-secondary">총 {totalCount}잔</span>
                        <span className="text-primary font-bold">{totalPrice.toLocaleString()}원</span>
                    </div>
                </div>

                {/* 복사 완료 메시지 */}
                {copied && (
                    <div className="flex items-center gap-1.5 mb-3 text-xs text-green-600 font-medium">
                        <Check size={13} />주문 목록이 클립보드에 복사되었습니다
                    </div>
                )}

                {/* 데스크톱 안내 */}
                {isDesktopDevice && (
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 mb-3 flex gap-2">
                        <Smartphone size={15} className="text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-600 leading-relaxed">
                            {webOrderUrl
                                ? <>웹 주문 페이지로 이동하거나,<br />복사된 주문 목록을 모바일 앱에서 사용하세요.</>
                                : <>PC에서는 앱을 직접 열 수 없습니다.<br />복사된 주문 목록을 모바일 기기의 카페 앱에서 사용해주세요.</>
                            }
                        </p>
                    </div>
                )}

                {/* 버튼 */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setView('result')}
                        className="flex-1 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-text-secondary font-bold text-sm transition active:scale-[0.98]"
                    >
                        {isDesktopDevice && webOrderUrl ? '나중에 할게요' : '뒤로'}
                    </button>
                    {isDesktopDevice ? (
                        webOrderUrl ? (
                            <button
                                onClick={() => window.open(webOrderUrl, '_blank')}
                                className="flex-1 py-3 rounded-2xl bg-primary text-white font-bold text-sm hover:opacity-90 transition active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm"
                            >
                                <ExternalLink size={14} />웹으로 주문하기
                            </button>
                        ) : (
                            <button
                                onClick={copyToClipboard}
                                className="flex-1 py-3 rounded-2xl bg-primary text-white font-bold text-sm hover:opacity-90 transition active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm"
                            >
                                <Copy size={14} />주문 목록 복사
                            </button>
                        )
                    ) : hasDeepLink ? (
                        <button
                            onClick={handleOpenApp}
                            className="flex-1 py-3 rounded-2xl bg-primary text-white font-bold text-sm hover:opacity-90 transition active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm"
                        >
                            <ExternalLink size={14} />{cafeName} 앱 열기
                        </button>
                    ) : (
                        <button
                            onClick={copyToClipboard}
                            className="flex-1 py-3 rounded-2xl bg-primary text-white font-bold text-sm hover:opacity-90 transition active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm"
                        >
                            <Copy size={14} />주문 목록 복사
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // ── result 뷰 ────────────────────────────────────────────────
    return (
        <div className="text-center py-4 pinball-result-enter max-w-lg mx-auto">
            {/* 당첨자 발표 */}
            <div className="mb-5">
                <div className="text-6xl mb-3 animate-bounce">
                    {isWinner ? (
                        <Coffee className="inline-block text-amber-500" size={60} />
                    ) : (
                        <Trophy className="inline-block text-yellow-500" size={60} />
                    )}
                </div>
                <p className="text-text-secondary text-sm mb-2">
                    {isWinner ? '축하합니다! 오늘의 커피 당첨자' : '오늘의 커피 당첨자'}
                </p>
                <div className="flex items-center justify-center gap-3">
                    <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md"
                        style={{ backgroundColor: getAvatarColor(winner) }}
                    >
                        {winner.slice(0, 2)}
                    </div>
                    <span className="text-2xl font-bold text-text-primary">{winner}</span>
                </div>
                {isWinner && <p className="text-primary font-bold mt-2 text-lg">🎉 커피 쏘세요! 🎉</p>}
            </div>

            {/* 당첨자 주문 목록 */}
            {isWinner && orderItems.length > 0 && (
                <div className="bg-background rounded-2xl p-4 mb-5 text-left border border-gray-200">
                    <p className="text-sm text-text-secondary mb-3 font-bold flex items-center gap-2">
                        <Coffee size={15} className="text-primary" />주문해야 할 목록
                    </p>
                    <div className="space-y-1.5 max-h-44 overflow-y-auto custom-scrollbar">
                        {orderItems.map(orderItemCard)}
                    </div>
                    <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between items-center">
                        <span className="text-text-secondary font-bold text-sm">총 금액</span>
                        <span className="text-lg font-bold text-primary">{totalPrice.toLocaleString()}원</span>
                    </div>
                </div>
            )}

            {/* 비당첨자 주문 목록 */}
            {!isWinner && orderItems.length > 0 && (
                <div className="bg-background rounded-2xl p-4 mb-5 text-left border border-gray-200">
                    <p className="text-sm text-text-secondary mb-3 font-bold flex items-center gap-2">
                        <Coffee size={15} className="text-primary" />
                        <span className="text-primary">{winner}</span>님이 주문할 목록
                    </p>
                    <div className="space-y-1.5 max-h-44 overflow-y-auto custom-scrollbar">
                        {orderItems.map(orderItemCard)}
                    </div>
                    <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between items-center">
                        <span className="text-text-secondary font-bold text-sm">총 금액</span>
                        <span className="text-lg font-bold text-primary">{totalPrice.toLocaleString()}원</span>
                    </div>
                </div>
            )}

            {/* 도착 순서 */}
            {finishOrder && finishOrder.length > 0 && (
                <div className="bg-background rounded-2xl p-3 mb-5 border border-gray-200">
                    <p className="text-xs text-text-secondary mb-2 font-bold">도착 순서</p>
                    <div className="flex justify-center gap-1 flex-wrap">
                        {finishOrder.map((name, index) => (
                            <div
                                key={name}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                                    index === finishOrder.length - 1
                                        ? 'bg-red-50 text-red-500 font-bold'
                                        : 'bg-gray-100 text-text-secondary'
                                }`}
                            >
                                <span className="font-mono text-[10px] opacity-60">{index + 1}.</span>
                                <span>{name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 버튼 영역 */}
            <div className="flex gap-2 justify-center">
                <button
                    onClick={onReset}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-text-secondary rounded-2xl font-bold transition active:scale-[0.98]"
                >
                    닫기
                </button>
                {isWinner && orderItems.length > 0 && (
                    <button
                        onClick={() => setView('redirect')}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:opacity-90 text-white rounded-2xl font-bold transition active:scale-[0.98] shadow-sm"
                    >
                        <Coffee size={16} />주문하러 가기
                    </button>
                )}
            </div>
        </div>
    );
};

export default RouletteResult;
