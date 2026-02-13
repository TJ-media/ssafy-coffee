import { useEffect, useRef, useState } from 'react';
import { RouletteGameState, CartItem, RouletteHistory } from '../../../shared/types';
import { Roulette } from '../components/roulette';
import { getNextBusinessDay } from '../../../shared/utils';
import { cartToHistoryItems } from '../utils/cartUtils';
import * as rouletteApi from '../api/rouletteApi';

interface UseRouletteGameProps {
    groupId: string;
    gameState: RouletteGameState | undefined;
    cart: CartItem[];
    marbleCounts: { [userName: string]: number };
    isOpen: boolean;
    userName: string;
}

export const useRouletteGame = ({
                                    groupId,
                                    gameState,
                                    cart,
                                    marbleCounts,
                                    isOpen,
                                    userName,
                                }: UseRouletteGameProps) => {
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
    const isHost = gameState?.hostName === userName;
    const participantsKey = gameState?.participants?.join(',') || '';
    const marbleCountsKey = JSON.stringify(marbleCounts);

    // 마운트/언마운트 추적
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // 장바구니 캐시 (게임 결과 화면용)
    useEffect(() => {
        if (status === 'waiting' && cart.length > 0) {
            setCachedCart(cart);
        }
    }, [status, cart]);

    // 참가자 확장 (공 개수 반영)
    const expandParticipants = (participants: string[], counts: { [name: string]: number }): string[] => {
        const expanded: string[] = [];
        participants.forEach((name) => {
            const count = counts[name] || 1;
            for (let i = 0; i < count; i++) {
                expanded.push(name);
            }
        });
        return expanded;
    };

    // 룰렛 초기화 및 이벤트 리스너 설정
    useEffect(() => {
        if (!isOpen) return;

        const initRoulette = async () => {
            if (canvasRef.current) {
                if (rouletteInstance.current) {
                    rouletteInstance.current.reset();
                } else {
                    rouletteInstance.current = new Roulette(canvasRef.current);
                }

                const checkReady = () => {
                    if (rouletteInstance.current?.isReady) {
                        setIsRouletteReady(true);
                        if (gameState?.participants) {
                            const expanded = expandParticipants(gameState.participants, marbleCounts);
                            rouletteInstance.current.setMarbles(expanded, gameState.seed);
                        }
                    } else {
                        setTimeout(checkReady, 100);
                    }
                };
                checkReady();
            }
        };

        initRoulette();
        setLocalFinished(false);
        setIsPlaying(false);
        setHistorySaved(false);

        return () => {
            if (rouletteInstance.current) {
                rouletteInstance.current.destroy();
                rouletteInstance.current = null;
            }
            setIsRouletteReady(false);
            setCachedCart([]);
        };
    }, [isOpen]);

    // 참가자/시드 변경 시 마블 재설정
    useEffect(() => {
        if (!isRouletteReady || !rouletteInstance.current) return;
        if (!gameState?.participants || gameState.participants.length === 0) return;

        rouletteInstance.current.reset();
        const expanded = expandParticipants(gameState.participants, marbleCounts);
        rouletteInstance.current.setMarbles(expanded, gameState.seed);
        setLocalFinished(false);
        setIsPlaying(false);
    }, [isRouletteReady, participantsKey, gameState?.seed, marbleCountsKey]);

    // 카운트다운 로직
    useEffect(() => {
        if (status !== 'ready') {
            setCountdown(null);
            return;
        }

        setCountdown(3);
        const interval = setInterval(() => {
            if (!isMountedRef.current) {
                clearInterval(interval);
                return;
            }

            setCountdown((prev) => {
                if (prev === null || prev <= 1) {
                    clearInterval(interval);
                    if (isHost && isMountedRef.current) {
                        rouletteApi.setGamePlaying(groupId).catch(console.error);
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [status, isHost, groupId]);

    // 게임 시작 (물리 엔진 시작)
    useEffect(() => {
        if (status === 'playing' && rouletteInstance.current && isRouletteReady && !isPlaying) {
            const participants = gameState?.participants || [];
            const expanded = expandParticipants(participants, marbleCounts);
            if (expanded.length > 0) {
                rouletteInstance.current.setWinningRank(expanded.length - 1);
            }
            rouletteInstance.current.start();
            setIsPlaying(true);
        }
    }, [status, isRouletteReady, marbleCounts, isPlaying, gameState?.participants]);

    // 결과 처리 (호스트만 수행)
    useEffect(() => {
        if (!isHost || !rouletteInstance.current) return;

        const instance = rouletteInstance.current;
        const handleGoal = (event: Event) => {
            if (!isMountedRef.current || localFinished) return;

            const customEvent = event as CustomEvent;
            const winnerName = customEvent.detail.winner;

            setIsPlaying(false);
            setLocalFinished(true);

            handleGameFinish(winnerName);
        };

        instance.addEventListener('goal', handleGoal);
        return () => {
            instance.removeEventListener('goal', handleGoal);
        };
    }, [groupId, isHost, localFinished, marbleCounts, gameState?.participants, cachedCart, historySaved]);

    const handleGameFinish = async (winnerName: string) => {
        try {
            await rouletteApi.finishGame(groupId, winnerName);
            if (isMountedRef.current && !historySaved && cachedCart.length > 0) {
                await saveHistory(winnerName);
            }
        } catch (e) {
            console.error('Failed to finish game:', e);
        }
    };

    const saveHistory = async (winnerName: string) => {
        const participants = gameState?.participants || [];
        const historyItem: RouletteHistory = {
            id: `roulette_${Date.now()}`,
            playedAt: getNextBusinessDay(),
            winner: winnerName,
            participants: participants,
            orderItems: cartToHistoryItems(cachedCart),
            totalPrice: cachedCart.reduce((sum, item) => sum + item.price, 0),
        };

        const newMarbleCounts = { ...marbleCounts };
        participants.forEach((name) => {
            if (name === winnerName) {
                newMarbleCounts[name] = 1;
            } else {
                newMarbleCounts[name] = (newMarbleCounts[name] || 1) + 1;
            }
        });

        await rouletteApi.saveRouletteHistory(groupId, historyItem, newMarbleCounts);
        setHistorySaved(true);
    };

    // 호스트 액션 핸들러
    const handleStartGame = () => {
        if (!isHost) return;
        rouletteApi.startRouletteGame(groupId).catch(console.error);
    };

    const handleShuffle = () => {
        if (!isHost || !gameState?.participants) return;
        rouletteApi.shuffleParticipants(groupId, gameState.participants).catch(console.error);
    };

    return {
        canvasRef,
        isRouletteReady,
        status,
        countdown,
        cachedCart,
        isHost,
        handleStartGame,
        handleShuffle,
    };
};