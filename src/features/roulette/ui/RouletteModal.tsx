import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Users, Shuffle } from 'lucide-react';
import { RouletteGameState, CartItem, GroupedCartItem, HistoryItem, RouletteHistory } from '../../../shared/types';
import RouletteResult from './RouletteResult';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../../firebase';
import { getAvatarColor, getTextContrastColor, getNextBusinessDay } from '../../../shared/utils';
import { Roulette } from '../game-engine/roulette';

// 👇 인터페이스에 participants가 명시되어 있는지 확인하세요
interface RouletteModalProps {
    isOpen: boolean;
    onClose: () => void;
    groupId: string;
    participants: string[];
    gameState: RouletteGameState | undefined;
    cart?: CartItem[];
    marbleCounts?: { [userName: string]: number };
}

const groupCartItems = (cart: CartItem[]): GroupedCartItem[] => {
    const grouped: { [key: string]: GroupedCartItem } = {};
    cart.forEach((item) => {
        const key = `${item.menuName}-${item.option}`;
        if (grouped[key]) {
            grouped[key].count += 1;
            if (!grouped[key].names.includes(item.userName)) grouped[key].names.push(item.userName);
        } else {
            grouped[key] = {
                menuName: item.menuName, option: item.option, price: item.price, count: 1, names: [item.userName],
            };
        }
    });
    return Object.values(grouped);
};

const cartToHistoryItems = (cart: CartItem[]): HistoryItem[] => {
    const grouped = groupCartItems(cart);
    return grouped.map((item) => ({
        menuName: item.menuName, option: item.option, price: item.price, count: item.count, orderedBy: item.names,
    }));
};

const RouletteModal: React.FC<RouletteModalProps> = ({
                                                         isOpen, onClose, groupId, gameState, cart = [], marbleCounts = {}
                                                     }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rouletteInstance = useRef<Roulette | null>(null);
    const isMountedRef = useRef(true);

    const [isRouletteReady, setIsRouletteReady] = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [localFinished, setLocalFinished] = useState(false);
    const [historySaved, setHistorySaved] = useState(false);
    const [cachedCart, setCachedCart] = useState<CartItem[]>([]);

    const status = gameState?.status || 'idle';
    const userName = localStorage.getItem('ssafy_userName') || '익명';
    const isHost = gameState?.hostName === userName;
    const isWinner = gameState?.winner === userName;

    useEffect(() => {
        isMountedRef.current = true;
        return () => { isMountedRef.current = false; };
    }, []);

    const participantsKey = gameState?.participants?.join(',') || '';
    const marbleCountsKey = JSON.stringify(marbleCounts);

    useEffect(() => {
        if (status === 'waiting' && cart.length > 0) setCachedCart(cart);
    }, [status, cart]);

    const displayCart = cachedCart.length > 0 ? cachedCart : cart;
    const groupedCart = groupCartItems(displayCart);
    const totalPrice = displayCart.reduce((sum, item) => sum + item.price, 0);

    const expandParticipants = (participants: string[], counts: { [name: string]: number }): string[] => {
        const expanded: string[] = [];
        participants.forEach(name => {
            const count = counts[name] || 1;
            for (let i = 0; i < count; i++) expanded.push(name);
        });
        return expanded;
    };

    const getParticipantMarbleCount = (name: string): number => marbleCounts[name] || 1;

    const handleStartGame = async () => {
        if (!isHost) return;
        try {
            await updateDoc(doc(db, 'groups', groupId), { 'rouletteGame.status': 'ready' });
        } catch (e) { console.error('Failed to start game:', e); }
    };

    const handleShuffle = async () => {
        if (!isHost || !gameState?.participants) return;
        try {
            const shuffled = [...gameState.participants];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            await updateDoc(doc(db, 'groups', groupId), {
                'rouletteGame.participants': shuffled, 'rouletteGame.seed': Date.now(),
            });
        } catch (e) { console.error('Failed to shuffle:', e); }
    };

    const saveRouletteHistory = async (winnerName: string) => {
        if (historySaved || cachedCart.length === 0) return;
        const participants = gameState?.participants || [];
        const historyItem: RouletteHistory = {
            id: `roulette_${Date.now()}`, playedAt: getNextBusinessDay(), winner: winnerName,
            participants: participants, orderItems: cartToHistoryItems(cachedCart),
            totalPrice: cachedCart.reduce((sum, item) => sum + item.price, 0),
        };
        const newMarbleCounts = { ...marbleCounts };
        participants.forEach(name => {
            if (name === winnerName) newMarbleCounts[name] = 1;
            else newMarbleCounts[name] = (newMarbleCounts[name] || 1) + 1;
        });
        try {
            await updateDoc(doc(db, 'groups', groupId), {
                rouletteHistory: arrayUnion(historyItem), cart: [], marbleCounts: newMarbleCounts,
            });
            setHistorySaved(true);
        } catch (e) { console.error('Failed to save roulette history:', e); }
    };

    useEffect(() => {
        if (!isOpen) return;
        const initRoulette = async () => {
            if (canvasRef.current) {
                if (rouletteInstance.current) rouletteInstance.current.reset();
                else rouletteInstance.current = new Roulette(canvasRef.current);

                const checkReady = () => {
                    if (rouletteInstance.current?.isReady) {
                        setIsRouletteReady(true);
                        if (gameState?.participants) {
                            const expanded = expandParticipants(gameState.participants, marbleCounts);
                            rouletteInstance.current.setMarbles(expanded, gameState.seed);
                        }
                    } else setTimeout(checkReady, 100);
                };
                checkReady();
            }
        };
        initRoulette();
        setLocalFinished(false); setIsPlaying(false); setHistorySaved(false);
        return () => {
            if (rouletteInstance.current) { rouletteInstance.current.destroy(); rouletteInstance.current = null; }
            setIsRouletteReady(false); setCachedCart([]);
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isRouletteReady || !rouletteInstance.current) return;
        if (!gameState?.participants || gameState.participants.length === 0) return;
        rouletteInstance.current.reset();
        const expanded = expandParticipants(gameState.participants, marbleCounts);
        rouletteInstance.current.setMarbles(expanded, gameState.seed);
        setLocalFinished(false); setIsPlaying(false);
    }, [isRouletteReady, participantsKey, gameState?.seed, marbleCountsKey]);

    useEffect(() => {
        if (status !== 'ready') { setCountdown(null); return; }
        setCountdown(3);
        const interval = setInterval(() => {
            if (!isMountedRef.current) { clearInterval(interval); return; }
            setCountdown((prev) => {
                if (prev === null || prev <= 1) {
                    clearInterval(interval);
                    if (isHost && isMountedRef.current) {
                        updateDoc(doc(db, 'groups', groupId), { 'rouletteGame.status': 'playing' }).catch(console.error);
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [status, isHost, groupId]);

    useEffect(() => {
        if (status === 'playing' && rouletteInstance.current && isRouletteReady && !isPlaying) {
            const participants = gameState?.participants || [];
            const expanded = expandParticipants(participants, marbleCounts);
            if (expanded.length > 0) rouletteInstance.current.setWinningRank(expanded.length - 1);
            rouletteInstance.current.start();
            setIsPlaying(true);
        }
    }, [status, isRouletteReady, marbleCounts, isPlaying]);

    useEffect(() => {
        if (!isHost || !rouletteInstance.current) return;
        const instance = rouletteInstance.current;
        const handleGoal = (event: Event) => {
            if (!isMountedRef.current || localFinished) return;
            const customEvent = event as CustomEvent;
            const winnerName = customEvent.detail.winner;
            setIsPlaying(false); setLocalFinished(true);
            (async () => {
                try {
                    await updateDoc(doc(db, 'groups', groupId), { 'rouletteGame.status': 'finished', 'rouletteGame.winner': winnerName });
                    if (isMountedRef.current) await saveRouletteHistory(winnerName);
                } catch (e) { console.error('Failed to update game state:', e); }
            })();
        };
        instance.addEventListener('goal', handleGoal);
        return () => { instance.removeEventListener('goal', handleGoal); };
    }, [groupId, isHost, localFinished, historySaved, cachedCart, marbleCounts, gameState?.participants]);

    if (!isOpen) return null;

    if (status === 'finished' && gameState?.winner) {
        return (
            <>
                <div className="fixed inset-0 bg-black/80 z-40" onClick={onClose} />
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-gray-700 pinball-modal-enter max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <RouletteResult
                            winner={gameState.winner}
                            finishOrder={gameState.finishOrder}
                            onReset={onClose}
                            isWinner={isWinner}
                            orderItems={groupedCart}
                            totalPrice={totalPrice}
                        />
                    </div>
                </div>
            </>
        );
    }

    const canClose = status === 'waiting';

    return (
        <>
            <div className="fixed inset-0 bg-black/80 z-40" onClick={canClose ? onClose : undefined} />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-2">
                <div className="bg-gray-900 rounded-2xl shadow-2xl w-[95vw] h-[95vh] overflow-hidden flex flex-col pinball-modal-enter border border-gray-700">
                    <div className="flex justify-between items-center px-4 py-2 border-b border-gray-700 shrink-0">
                        <h2 className="text-lg font-bold flex items-center gap-2 text-white"><span className="text-2xl">🎡</span>커피 내기 룰렛</h2>
                        {canClose && <button onClick={onClose} className="text-gray-400 hover:text-white transition p-1"><X size={24} /></button>}
                    </div>
                    <div className="flex-1 flex flex-col p-2 min-h-0 overflow-hidden">
                        <div className="flex-1 relative">
                            <canvas ref={canvasRef} className={`w-full h-full rounded-xl bg-black ${!isRouletteReady ? 'hidden' : ''}`}></canvas>
                            {!isRouletteReady && (
                                <div className="absolute inset-0 bg-gray-800 rounded-xl flex items-center justify-center">
                                    <div className="text-center text-gray-400">
                                        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                                        <p className="text-lg">룰렛 로딩 중...</p>
                                    </div>
                                </div>
                            )}
                            {status === 'waiting' && isRouletteReady && (
                                <div className="absolute inset-0 bg-black/60 rounded-xl flex flex-col items-center justify-center p-4 h-full">
                                    <div className="bg-gray-800/95 rounded-2xl p-6 shadow-xl max-w-[320px] w-full border border-gray-600">
                                        <div className="text-center mb-4">
                                            <Users size={40} className="text-primary mx-auto mb-2" />
                                            <h3 className="text-xl font-bold text-white">대기실</h3>
                                            <p className="text-sm text-gray-400">참가자들을 확인하세요!</p>
                                        </div>
                                        <div className="bg-gray-700/50 rounded-xl p-3 mb-4">
                                            <p className="text-xs text-gray-400 mb-2 font-bold">참가자 ({gameState?.participants?.length || 0}명) · 🎱 = 당첨 확률</p>
                                            <div className="flex flex-wrap gap-1.5 justify-center">
                                                {gameState?.participants?.map((name) => {
                                                    const marbleCount = getParticipantMarbleCount(name);
                                                    return (
                                                        <div key={name} className="flex items-center gap-1.5 px-2 py-1 bg-gray-600 rounded-full">
                                                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ backgroundColor: getAvatarColor(name), color: getTextContrastColor() }}>{name.slice(0, 1)}</div>
                                                            <span className="text-xs font-medium text-gray-200">{name}{name === gameState?.hostName && <span className="ml-0.5 text-[10px] text-primary">(방장)</span>}</span>
                                                            {marbleCount > 1 && <span className="text-[10px] bg-amber-500/30 text-amber-300 px-1 rounded font-bold">🎱x{marbleCount}</span>}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        {isHost ? (
                                            <div className="flex flex-col gap-2">
                                                <button onClick={handleStartGame} className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition shadow-md text-lg"><Play size={20} />게임 시작!</button>
                                                <button onClick={handleShuffle} className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-gray-600 text-gray-200 rounded-xl font-medium hover:bg-gray-500 transition text-sm"><Shuffle size={14} />위치 셔플</button>
                                            </div>
                                        ) : (
                                            <div className="text-center">
                                                <p className="text-sm text-gray-400"><span className="font-bold text-primary">{gameState?.hostName}</span>님이 시작하면 게임이 시작돼요</p>
                                                <div className="mt-2 flex items-center justify-center gap-1">
                                                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            {status === 'ready' && countdown !== null && countdown > 0 && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                                    <span className="text-[120px] font-bold text-white countdown-pop drop-shadow-lg">{countdown}</span>
                                </div>
                            )}
                        </div>
                        <div className="py-2 text-center shrink-0">
                            {status === 'waiting' && (
                                <button onClick={onClose} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-xl font-bold transition text-sm"><X size={16} />대기실 나가기</button>
                            )}
                            {status === 'playing' && <p className="text-gray-400 text-sm">🎡 룰렛이 돌아가고 있어요... 마지막에 도착하면 커피 당첨!</p>}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default RouletteModal;