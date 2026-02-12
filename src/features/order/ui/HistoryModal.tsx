import { useState, useMemo } from 'react';
import { OrderHistory, RouletteHistory } from '../../../shared/types';
import { X, Coffee, Plus, Trash2, Pencil, Check, TrendingUp, TrendingDown, BarChart2 } from 'lucide-react';
import { getAvatarColor, getTextContrastColor } from '../../../shared/utils';
import dayjs from 'dayjs';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  history: OrderHistory[];
  rouletteHistory: RouletteHistory[];
  groupId: string;
  userName: string;
  onAddMode: (historyId: string, type: 'normal' | 'roulette') => void;
  onDeleteItem: (historyId: string, type: 'normal' | 'roulette', itemIndex: number, targetUser?: string) => void;
}

const HistoryModal = ({ isOpen, onClose, history, rouletteHistory, onAddMode, onDeleteItem }: Props) => {
  const [activeTab, setActiveTab] = useState<'list' | 'stats'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [coffeePrice, setCoffeePrice] = useState<string>('4500');

  // --- 통계 계산 로직 (AdminPage에서 이식) ---
  const userStats = useMemo(() => {
    const stats: { [userName: string]: { spent: number; received: number; winCount: number; playCount: number } } = {};
    rouletteHistory.forEach((game) => {
      const winner = game.winner;
      game.participants.forEach((participant) => {
        if (!stats[participant]) stats[participant] = { spent: 0, received: 0, winCount: 0, playCount: 0 };
        stats[participant].playCount++;
      });
      if (stats[winner]) {
        stats[winner].spent += game.totalPrice;
        stats[winner].winCount++;
      }
      game.orderItems.forEach((item) => {
        const pricePerPerson = item.price;
        item.orderedBy.forEach((person) => {
          if (person !== winner && stats[person]) stats[person].received += pricePerPerson;
        });
      });
    });
    return stats;
  }, [rouletteHistory]);

  const sortedStats = useMemo(() => {
    return Object.entries(userStats)
        .map(([name, data]) => ({
          name,
          ...data,
          profit: data.received - data.spent,
          winRate: data.playCount > 0 ? (data.winCount / data.playCount) * 100 : 0,
          luckIndex: data.playCount > 0 ? Math.round((1 - (data.winCount / data.playCount)) * 100) : 50,
        }))
        .sort((a, b) => b.profit - a.profit);
  }, [userStats]);

  const globalStats = useMemo(() => {
    const totalGames = rouletteHistory.length;
    const totalAmount = rouletteHistory.reduce((sum, g) => sum + g.totalPrice, 0);
    const avgAmount = totalGames > 0 ? Math.round(totalAmount / totalGames) : 0;
    const maxGame = rouletteHistory.reduce((max, g) => g.totalPrice > (max?.totalPrice || 0) ? g : max, rouletteHistory[0]);

    const luckiest = sortedStats.length > 0 ? sortedStats.reduce((best, u) => u.luckIndex > best.luckIndex ? u : best) : null;
    const unluckiest = sortedStats.length > 0 ? sortedStats.reduce((worst, u) => u.luckIndex < worst.luckIndex ? u : worst) : null;
    const mostWins = sortedStats.length > 0 ? sortedStats.reduce((max, u) => u.winCount > max.winCount ? u : max) : null;
    const mostPlays = sortedStats.length > 0 ? sortedStats.reduce((max, u) => u.playCount > max.playCount ? u : max) : null;

    return { totalGames, totalAmount, avgAmount, maxGame, luckiest, unluckiest, mostWins, mostPlays };
  }, [rouletteHistory, sortedStats]);

  const streakStats = useMemo(() => {
    const streaks: { [name: string]: { currentStreak: number; maxStreak: number; streakType: 'win' | 'safe' | null } } = {};
    const sortedGames = [...rouletteHistory].sort((a, b) => {
      const dateA = a.playedAt?.toDate ? a.playedAt.toDate() : new Date(a.playedAt);
      const dateB = b.playedAt?.toDate ? b.playedAt.toDate() : new Date(b.playedAt);
      return dateA.getTime() - dateB.getTime();
    });

    sortedGames.forEach((game) => {
      game.participants.forEach((name) => {
        if (!streaks[name]) streaks[name] = { currentStreak: 0, maxStreak: 0, streakType: null };
        if (game.winner === name) {
          if (streaks[name].streakType === 'safe') streaks[name].maxStreak = Math.max(streaks[name].maxStreak, streaks[name].currentStreak);
          streaks[name].currentStreak = 1;
          streaks[name].streakType = 'win';
        } else {
          if (streaks[name].streakType === 'safe') streaks[name].currentStreak++;
          else {
            streaks[name].currentStreak = 1;
            streaks[name].streakType = 'safe';
          }
        }
      });
    });
    return streaks;
  }, [rouletteHistory]);

  const extraStats = useMemo(() => {
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const gamesByDay = [0, 0, 0, 0, 0, 0, 0];
    rouletteHistory.forEach((game) => {
      const date = game.playedAt?.toDate ? game.playedAt.toDate() : new Date(game.playedAt);
      gamesByDay[date.getDay()]++;
    });
    const mostActiveDay = gamesByDay.indexOf(Math.max(...gamesByDay));
    const avgParticipants = rouletteHistory.length > 0 ? (rouletteHistory.reduce((sum, g) => sum + g.participants.length, 0) / rouletteHistory.length).toFixed(1) : '0';

    let maxSafeStreak = { name: '', count: 0 };
    Object.entries(streakStats).forEach(([name, data]) => {
      const safeCount = data.streakType === 'safe' ? data.currentStreak : data.maxStreak;
      if (safeCount > maxSafeStreak.count) maxSafeStreak = { name, count: safeCount };
    });

    const currentSafeStreaks = Object.entries(streakStats)
        .filter(([_, data]) => data.streakType === 'safe' && data.currentStreak >= 2)
        .map(([name, data]) => ({ name, streak: data.currentStreak }))
        .sort((a, b) => b.streak - a.streak);

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0,0,0,0);
    const thisWeekGames = rouletteHistory.filter(g => {
      const d = g.playedAt?.toDate ? g.playedAt.toDate() : new Date(g.playedAt);
      return d >= weekStart;
    }).length;

    return { gamesByDay, dayNames, mostActiveDay, avgParticipants, maxSafeStreak, currentSafeStreaks, thisWeekGames };
  }, [rouletteHistory, streakStats]);

  if (!isOpen) return null;

  const allHistory = [
    ...history.map(h => ({ ...h, type: 'normal' as const })),
    ...rouletteHistory.map(h => ({ ...h, type: 'roulette' as const }))
  ].sort((a, b) => {
    const dateA = a.type === 'normal' ? (a as OrderHistory).orderedAt : (a as RouletteHistory).playedAt;
    const dateB = b.type === 'normal' ? (b as OrderHistory).orderedAt : (b as RouletteHistory).playedAt;
    const timeA = dateA?.toDate ? dateA.toDate().getTime() : new Date(dateA).getTime();
    const timeB = dateB?.toDate ? dateB.toDate().getTime() : new Date(dateB).getTime();
    return timeB - timeA;
  });

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

        <div className="bg-surface w-full max-w-md rounded-2xl shadow-2xl max-h-[85vh] flex flex-col relative z-10 animate-slide-up">
          {/* Header */}
          <div className="p-4 border-b flex justify-between items-center shrink-0">
            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
              <button
                  onClick={() => setActiveTab('list')}
                  className={`px-4 py-1.5 rounded-md text-sm font-bold transition ${activeTab === 'list' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}
              >
                주문 내역
              </button>
              <button
                  onClick={() => setActiveTab('stats')}
                  className={`px-4 py-1.5 rounded-md text-sm font-bold transition flex items-center gap-1 ${activeTab === 'stats' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}
              >
                <BarChart2 size={14} /> 통계
              </button>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X size={24} className="text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto p-4 custom-scrollbar flex-1 bg-background">
            {activeTab === 'list' ? (
                <div className="space-y-4">
                  {allHistory.length === 0 ? (
                      <div className="text-center py-10 text-text-secondary">
                        <Coffee size={48} className="mx-auto mb-3 opacity-20" />
                        <p>아직 주문 내역이 없어요</p>
                      </div>
                  ) : (
                      allHistory.map((h) => {
                        const date = h.type === 'normal' ? (h as OrderHistory).orderedAt : (h as RouletteHistory).playedAt;
                        const dateObj = date?.toDate ? date.toDate() : new Date(date);
                        const isRoulette = h.type === 'roulette';
                        const winner = isRoulette ? (h as RouletteHistory).winner : null;
                        const items = isRoulette ? (h as RouletteHistory).orderItems : (h as OrderHistory).items;
                        const isEditing = editingId === h.id;

                        return (
                            <div key={h.id} className={`border rounded-2xl p-4 bg-white shadow-sm transition-all duration-300 ${isEditing ? 'border-primary ring-1 ring-primary/20 shadow-lg scale-[1.02]' : 'border-gray-200'}`}>
                              <div className="flex justify-between items-start mb-4 pb-3 border-b border-dashed">
                                <div>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full mb-2 inline-block ${isRoulette ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'}`}>
                            {isRoulette ? '🎲 룰렛 게임' : '☕ 일반 주문'}
                          </span>
                                  <div className="text-xs text-text-secondary">{dayjs(dateObj).format('YYYY.MM.DD HH:mm')}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {isRoulette && (
                                      <div className="text-right mr-1">
                                        <div className="text-[10px] text-text-secondary">당첨자</div>
                                        <div className="font-bold text-primary text-sm">{winner}</div>
                                      </div>
                                  )}
                                  <button onClick={() => setEditingId(isEditing ? null : h.id)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isEditing ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}>
                                    {isEditing ? <Check size={16} /> : <Pencil size={14} />}
                                  </button>
                                </div>
                              </div>
                              <div className="space-y-3">
                                {items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center">
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-bold text-sm text-text-primary">{item.menuName}<span className="text-xs font-normal text-text-secondary ml-1">x {item.count}</span></span>
                                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${item.option === 'ICE' ? 'bg-blue-50 text-blue-500' : 'bg-red-50 text-red-500'}`}>{item.option === 'ONLY' ? '-' : item.option}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1 mt-1">{item.orderedBy.map((p, i) => <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-md">{p}</span>)}</div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <span className="text-sm font-bold text-text-primary">{(item.price * item.count).toLocaleString()}원</span>
                                        {isEditing && (
                                            <button onClick={() => onDeleteItem(h.id, h.type, idx)} className="w-7 h-7 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100"><Trash2 size={14} /></button>
                                        )}
                                      </div>
                                    </div>
                                ))}
                              </div>
                              {isEditing && (
                                  <button onClick={() => onAddMode(h.id, h.type)} className="w-full mt-4 py-3 bg-primary/10 text-primary rounded-xl font-bold text-sm hover:bg-primary/20 flex items-center justify-center gap-2"><Plus size={16} /> 메뉴 추가하기</button>
                              )}
                            </div>
                        );
                      })
                  )}
                </div>
            ) : (
                /* 통계 탭 내용 */
                <div className="space-y-4">
                  {/* 개요 */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white rounded-xl p-3 shadow-sm text-center border border-gray-100">
                      <p className="text-xl font-bold text-primary">{globalStats.totalGames}</p>
                      <p className="text-xs text-text-secondary">총 게임</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 shadow-sm text-center border border-gray-100">
                      <p className="text-xl font-bold text-amber-500">{(globalStats.totalAmount / 10000).toFixed(1)}만</p>
                      <p className="text-xs text-text-secondary">총 금액</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 shadow-sm text-center border border-gray-100">
                      <p className="text-xl font-bold text-blue-500">{globalStats.avgAmount.toLocaleString()}</p>
                      <p className="text-xs text-text-secondary">평균/게임</p>
                    </div>
                  </div>

                  {sortedStats.length === 0 ? (
                      <div className="text-center py-10 text-gray-400">통계 데이터가 없어요</div>
                  ) : (
                      <>
                        {/* 재미 통계 */}
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                          <h3 className="font-bold text-purple-800 mb-3 text-sm">🎲 재미 통계</h3>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            {globalStats.luckiest && <div className="bg-white/70 rounded-lg p-2"><p className="text-xs text-purple-600">🍀 가장 운 좋은</p><p className="font-bold text-purple-800">{globalStats.luckiest.name}</p><p className="text-xs text-purple-500">당첨률 {globalStats.luckiest.winRate.toFixed(1)}%</p></div>}
                            {globalStats.unluckiest && <div className="bg-white/70 rounded-lg p-2"><p className="text-xs text-pink-600">😢 가장 운 나쁜</p><p className="font-bold text-pink-800">{globalStats.unluckiest.name}</p><p className="text-xs text-pink-500">당첨률 {globalStats.unluckiest.winRate.toFixed(1)}%</p></div>}
                            {globalStats.mostWins && <div className="bg-white/70 rounded-lg p-2"><p className="text-xs text-amber-600">☕ 최다 당첨</p><p className="font-bold text-amber-800">{globalStats.mostWins.name}</p><p className="text-xs text-amber-500">{globalStats.mostWins.winCount}번 당첨</p></div>}
                            {globalStats.mostPlays && <div className="bg-white/70 rounded-lg p-2"><p className="text-xs text-blue-600">🎮 최다 참가</p><p className="font-bold text-blue-800">{globalStats.mostPlays.name}</p><p className="text-xs text-blue-500">{globalStats.mostPlays.playCount}게임 참가</p></div>}
                          </div>
                          {globalStats.maxGame && (
                              <div className="mt-3 pt-3 border-t border-purple-200">
                                <p className="text-xs text-purple-600">💰 역대 최고 금액 게임</p>
                                <p className="font-bold text-purple-800">
                                  {globalStats.maxGame.totalPrice.toLocaleString()}원
                                  <span className="text-xs font-normal text-purple-500 ml-1">
                                ({globalStats.maxGame.winner}님이 샀음)
                            </span>
                                </p>
                              </div>
                          )}
                        </div>

                        {/* 요일별 & 기타 통계 */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-4 border border-indigo-100">
                            <h3 className="font-bold text-indigo-800 mb-2 text-sm">📅 요일별 게임</h3>
                            <div className="flex justify-between items-end h-16 mb-2">
                              {extraStats.gamesByDay.map((count, idx) => (
                                  <div key={idx} className="flex flex-col items-center gap-1">
                                    <div
                                        className={`w-5 rounded-t transition-all ${idx === extraStats.mostActiveDay ? 'bg-indigo-500' : 'bg-indigo-200'}`}
                                        style={{ height: `${Math.max(4, (count / Math.max(...extraStats.gamesByDay)) * 48)}px` }}
                                    />
                                    <span className={`text-[10px] ${idx === extraStats.mostActiveDay ? 'font-bold text-indigo-600' : 'text-indigo-400'}`}>
                                {extraStats.dayNames[idx]}
                            </span>
                                  </div>
                              ))}
                            </div>
                            <p className="text-xs text-indigo-600 text-center"><span className="font-bold">{extraStats.dayNames[extraStats.mostActiveDay]}요일</span>에 가장 많이 해요</p>
                          </div>

                          <div className="bg-gradient-to-r from-cyan-50 to-teal-50 rounded-xl p-4 border border-cyan-100">
                            <h3 className="font-bold text-cyan-800 mb-2 text-sm">📈 기타 통계</h3>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between"><span className="text-cyan-600">평균 참가자</span><span className="font-bold text-cyan-800">{extraStats.avgParticipants}명</span></div>
                              <div className="flex justify-between"><span className="text-cyan-600">이번 주 게임</span><span className="font-bold text-cyan-800">{extraStats.thisWeekGames}회</span></div>
                              {extraStats.maxSafeStreak.name && (
                                  <div className="flex justify-between"><span className="text-cyan-600">최장 연속 안전</span><span className="font-bold text-cyan-800">{extraStats.maxSafeStreak.name} ({extraStats.maxSafeStreak.count}연속)</span></div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 위험 알림 */}
                        {extraStats.currentSafeStreaks.length > 0 && (
                            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-4 border border-red-100">
                              <h3 className="font-bold text-red-800 mb-3 text-sm">⚠️ 당첨 위험 알림</h3>
                              <p className="text-xs text-red-600 mb-3">연속으로 안전한 사람들! 다음 게임에서 조심하세요 👀</p>
                              <div className="flex flex-wrap gap-2">
                                {extraStats.currentSafeStreaks.map(({ name, streak }) => (
                                    <div key={name} className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${streak >= 5 ? 'bg-red-200 text-red-800' : streak >= 3 ? 'bg-orange-200 text-orange-800' : 'bg-yellow-200 text-yellow-800'}`}>
                                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ backgroundColor: getAvatarColor(name), color: getTextContrastColor() }}>{name.slice(0, 1)}</div>
                                      <span className="font-bold text-sm">{name}</span>
                                      <span className="text-xs font-bold">{streak}연속 🔥</span>
                                    </div>
                                ))}
                              </div>
                            </div>
                        )}

                        {/* 본전 계산기 */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                          <h3 className="font-bold text-green-800 mb-3 text-sm">🧮 본전 계산기</h3>
                          <div className="flex gap-2 mb-3">
                            <input type="number" value={coffeePrice} onChange={(e) => setCoffeePrice(e.target.value)} placeholder="커피 1잔 가격" className="flex-1 px-3 py-2 rounded-lg border border-green-200 text-sm focus:border-green-500 focus:outline-none"/>
                            <span className="flex items-center text-sm text-green-600">원</span>
                          </div>
                          {sortedStats.length > 0 && coffeePrice && (
                              <div className="space-y-2 max-h-48 overflow-y-auto">
                                {sortedStats.map((user) => {
                                  const price = parseInt(coffeePrice) || 4500;
                                  const deficit = -user.profit;
                                  const gamesNeeded = deficit > 0 ? Math.ceil(deficit / price) : 0;
                                  const isProfit = user.profit >= 0;
                                  const cupsProfit = Math.floor(Math.abs(user.profit) / price);
                                  return (
                                      <div key={user.name} className="flex items-center justify-between bg-white/70 rounded-lg px-3 py-2">
                                        <div className="flex items-center gap-2">
                                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: getAvatarColor(user.name), color: getTextContrastColor() }}>{user.name.slice(0, 1)}</div>
                                          <span className="font-medium text-green-800">{user.name}</span>
                                        </div>
                                        {isProfit ? <span className="text-sm text-green-600 font-bold">☕ +{cupsProfit}잔 이득!</span> : <span className="text-sm text-amber-600">☕ {gamesNeeded}번 이겨야 본전</span>}
                                      </div>
                                  );
                                })}
                              </div>
                          )}
                        </div>

                        {/* 개인별 상세 통계 */}
                        <div className="space-y-3">
                          {sortedStats.map((user, index) => {
                            const streak = streakStats[user.name];
                            return (
                                <div key={user.name} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                      <div className="relative">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" style={{ backgroundColor: getAvatarColor(user.name), color: getTextContrastColor() }}>{user.name.slice(0, 2)}</div>
                                        {index < 3 && <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-xs font-bold text-white">{index + 1}</div>}
                                      </div>
                                      <div><span className="font-bold text-text-primary">{user.name}</span><p className="text-xs text-text-secondary">{user.playCount}게임 · {user.winCount}번 당첨 · 당첨률 {user.winRate.toFixed(1)}%</p></div>
                                    </div>
                                    <div className={`text-right ${user.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      <div className="flex items-center gap-1 justify-end">{user.profit >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}<span className="font-bold">{user.profit.toLocaleString()}원</span></div>
                                      <p className="text-xs opacity-70">순이익</p>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-4 gap-2 text-sm">
                                    <div className="bg-red-50 rounded-lg p-2 text-center"><p className="text-red-600 font-bold text-xs">{user.spent.toLocaleString()}</p><p className="text-[10px] text-red-400">산 금액</p></div>
                                    <div className="bg-green-50 rounded-lg p-2 text-center"><p className="text-green-600 font-bold text-xs">{user.received.toLocaleString()}</p><p className="text-[10px] text-green-400">얻은 금액</p></div>
                                    <div className="bg-blue-50 rounded-lg p-2 text-center"><p className="text-blue-600 font-bold text-xs">{streak?.currentStreak || 0}연속</p><p className="text-[10px] text-blue-400">{streak?.streakType === 'safe' ? '안전' : streak?.streakType === 'win' ? '당첨' : '-'}</p></div>
                                    <div className="bg-purple-50 rounded-lg p-2 text-center"><p className="text-purple-600 font-bold text-xs">{user.luckIndex}</p><p className="text-[10px] text-purple-400">운 지수</p></div>
                                  </div>
                                </div>
                            );
                          })}
                        </div>
                      </>
                  )}
                </div>
            )}
          </div>
        </div>
      </div>
  );
};

export default HistoryModal;