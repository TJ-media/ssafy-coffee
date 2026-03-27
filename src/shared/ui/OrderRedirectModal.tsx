import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Copy, Check, ExternalLink, Smartphone } from 'lucide-react';
import { GroupedCartItem } from '../types';
import { useLayoutStore } from '../store/useLayoutStore';
import { CAFE_DEEP_LINKS } from '../config/cafeDeepLinks';

interface OrderRedirectModalProps {
    isOpen: boolean;
    onClose: () => void;
    cafeName: string;
    cafeId: string;
    orderItems: GroupedCartItem[];
    totalPrice: number;
    winner?: string;
}

const buildOrderText = (cafeName: string, orderItems: GroupedCartItem[], totalPrice: number): string => {
    const lines = [`[${cafeName}] 주문 목록`];
    orderItems.forEach(item => {
        const optionStr = item.option !== 'ONLY' ? ` (${item.option})` : '';
        lines.push(`- ${item.menuName}${optionStr} x${item.count}`);
    });
    const totalCount = orderItems.reduce((sum, item) => sum + item.count, 0);
    lines.push(`총 ${totalCount}잔 / ${totalPrice.toLocaleString()}원`);
    return lines.join('\n');
};

const OrderRedirectModal: React.FC<OrderRedirectModalProps> = ({
    isOpen, onClose, cafeName, cafeId, orderItems, totalPrice,
}) => {
    const isDesktopDevice = useLayoutStore(state => state.isDesktopDevice);
    const [copied, setCopied] = useState(false);

    const orderText = buildOrderText(cafeName, orderItems, totalPrice);

    const copyToClipboard = useCallback(async () => {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(orderText);
            } else {
                const textarea = document.createElement('textarea');
                textarea.value = orderText;
                textarea.style.position = 'fixed';
                textarea.style.left = '-9999px';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
            }
            setCopied(true);
        } catch (e) {
            console.error('클립보드 복사 실패:', e);
        }
    }, [orderText]);

    // 모달 열릴 때 자동 복사 + 상태 초기화
    useEffect(() => {
        if (isOpen) {
            setCopied(false);
            copyToClipboard();
        }
    }, [isOpen]);

    const handleOpenApp = () => {
        const deepLink = CAFE_DEEP_LINKS[cafeId];
        if (!deepLink) return;

        copyToClipboard();

        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const appUrl = isIOS ? deepLink.ios : deepLink.android;
        const fallbackUrl = isIOS ? deepLink.fallback.ios : deepLink.fallback.android;

        let appOpened = false;
        const handleVisibilityChange = () => {
            if (document.hidden) appOpened = true;
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        window.location.href = appUrl;

        setTimeout(() => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (!appOpened) {
                window.open(fallbackUrl, '_blank');
            }
        }, 3000);
    };

    if (!isOpen) return null;

    const totalCount = orderItems.reduce((sum, item) => sum + item.count, 0);
    const hasDeepLink = !!CAFE_DEEP_LINKS[cafeId];
    const webOrderUrl = CAFE_DEEP_LINKS[cafeId]?.webOrder;

    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm animate-bounce-in overflow-hidden">
                {/* 핸들 */}
                <div className="flex justify-center pt-3 pb-1">
                    <div className="w-10 h-1 bg-gray-200 rounded-full" />
                </div>

                {/* 헤더 */}
                <div className="flex items-center justify-between px-5 pt-2 pb-3">
                    <h3 className="text-base font-bold text-text-primary">
                        {cafeName} 앱에서 주문하시겠어요?
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* 주문 목록 요약 */}
                <div className="px-5 pb-3">
                    <div className="bg-background rounded-2xl p-3 max-h-44 overflow-y-auto custom-scrollbar">
                        <div className="space-y-1.5">
                            {orderItems.map((item, i) => (
                                <div key={i} className="flex justify-between items-center text-sm">
                                    <span className="text-text-primary font-medium">
                                        {item.menuName}
                                        {item.option !== 'ONLY' && (
                                            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-md font-bold ${
                                                item.option === 'ICE'
                                                    ? 'bg-blue-50 text-blue-600'
                                                    : 'bg-red-50 text-red-600'
                                            }`}>
                                                {item.option}
                                            </span>
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

                    {/* 클립보드 복사 완료 메시지 (복사 후에만 표시) */}
                    {copied && (
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-green-600 font-medium">
                            <Check size={13} />
                            주문 목록이 클립보드에 복사되었습니다
                        </div>
                    )}
                </div>

                {/* 데스크톱 안내 */}
                {isDesktopDevice && (
                    <div className="px-5 pb-3">
                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 flex gap-2">
                            <Smartphone size={15} className="text-blue-500 shrink-0 mt-0.5" />
                            {webOrderUrl ? (
                                <p className="text-xs text-blue-600 leading-relaxed">
                                    웹 주문 페이지로 이동하거나,<br />
                                    복사된 주문 목록을 모바일 앱에서 사용하세요.
                                </p>
                            ) : (
                                <p className="text-xs text-blue-600 leading-relaxed">
                                    PC에서는 앱을 직접 열 수 없습니다.<br />
                                    복사된 주문 목록을 모바일 기기의 카페 앱에서 사용해주세요.
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* 버튼 영역 */}
                <div className="px-5 pb-6 flex gap-2">
                    {isDesktopDevice ? (
                        <>
                            <button
                                onClick={onClose}
                                className="flex-1 py-3.5 rounded-2xl bg-gray-100 text-text-secondary font-bold text-sm hover:bg-gray-200 transition active:scale-[0.98]"
                            >
                                {webOrderUrl ? '나중에 할게요' : '닫기'}
                            </button>
                            {webOrderUrl ? (
                                <button
                                    onClick={() => window.open(webOrderUrl, '_blank')}
                                    className="flex-1 py-3.5 rounded-2xl bg-primary text-white font-bold text-sm hover:opacity-90 transition active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm"
                                >
                                    <ExternalLink size={14} />
                                    웹으로 주문하기
                                </button>
                            ) : (
                                <button
                                    onClick={copyToClipboard}
                                    className="flex-1 py-3.5 rounded-2xl bg-primary text-white font-bold text-sm hover:opacity-90 transition active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm"
                                >
                                    <Copy size={14} />
                                    주문 목록 복사
                                </button>
                            )}
                        </>
                    ) : (
                        <>
                            <button
                                onClick={onClose}
                                className="flex-1 py-3.5 rounded-2xl bg-gray-100 text-text-secondary font-bold text-sm hover:bg-gray-200 transition active:scale-[0.98]"
                            >
                                나중에 할게요
                            </button>
                            {hasDeepLink ? (
                                <button
                                    onClick={handleOpenApp}
                                    className="flex-1 py-3.5 rounded-2xl bg-primary text-white font-bold text-sm hover:opacity-90 transition active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm"
                                >
                                    <ExternalLink size={14} />
                                    {cafeName} 앱 열기
                                </button>
                            ) : (
                                <button
                                    onClick={copyToClipboard}
                                    className="flex-1 py-3.5 rounded-2xl bg-primary text-white font-bold text-sm hover:opacity-90 transition active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm"
                                >
                                    <Copy size={14} />
                                    주문 목록 복사
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default OrderRedirectModal;
