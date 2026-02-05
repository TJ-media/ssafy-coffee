import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Lock, Minus, Plus, RotateCcw, ArrowLeft, UserCheck, UserX, Users, TrendingUp, TrendingDown, Trash2, PlusCircle, History, Pencil, X, Settings, Key } from 'lucide-react';
import { getAvatarColor, getTextContrastColor, getNextBusinessDay } from '../utils';
import { RouletteHistory, GroupData } from '../types';

const AdminPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [groupIdInput, setGroupIdInput] = useState('');
  const [error, setError] = useState('');
  const [marbleCounts, setMarbleCounts] = useState<{ [userName: string]: number }>({});
  const [pendingUsers, setPendingUsers] = useState<string[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<string[]>([]);
  const [rouletteHistory, setRouletteHistory] = useState<RouletteHistory[]>([]);
  const [activeTab, setActiveTab] = useState<'approval' | 'marble' | 'stats' | 'history' | 'settings'>('approval');
  const [groupId, setGroupId] = useState<string | null>(null);

  // 설정 탭 상태
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');

  // 통계 탭 상태
  const [coffeePrice, setCoffeePrice] = useState<string>('4500'); // 본전 계산용

  // 히스토리 추가/수정 폼 상태
  const [newHistoryWinner, setNewHistoryWinner] = useState('');
  const [newHistoryParticipants, setNewHistoryParticipants] = useState('');
  const [newHistoryDate, setNewHistoryDate] = useState('');
  const [editingHistoryId, setEditingHistoryId] = useState<string | null>(null);

  const navigate = useNavigate();

  // Firestore 구독
  useEffect(() => {
    if (!groupId || !isAuthenticated) return;

    const unsub = onSnapshot(doc(db, 'groups', groupId), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        setMarbleCounts(data.marbleCounts || {});
        setPendingUsers(data.pendingUsers || []);
        setApprovedUsers(data.approvedUsers || []);
        setRouletteHistory(data.rouletteHistory || []);
      }
    });
    return () => unsub();
  }, [groupId, isAuthenticated]);

  // 통계 계산
  const userStats = useMemo(() => {
    const stats: { [userName: string]: { spent: number; received: number; winCount: number; playCount: number } } = {};

    rouletteHistory.forEach((game) => {
      const winner = game.winner;

      // 참가자들 초기화
      game.participants.forEach((participant) => {
        if (!stats[participant]) {
          stats[participant] = { spent: 0, received: 0, winCount: 0, playCount: 0 };
        }
        stats[participant].playCount++;
      });

      // winner가 산 금액
      if (stats[winner]) {
        stats[winner].spent += game.totalPrice;
        stats[winner].winCount++;
      }

      // 각 참가자가 얻어먹은 금액 계산
      game.orderItems.forEach((item) => {
        const pricePerPerson = item.price; // 이미 개당 가격
        item.orderedBy.forEach((person) => {
          if (person !== winner && stats[person]) {
            stats[person].received += pricePerPerson;
          }
        });
      });
    });

    return stats;
  }, [rouletteHistory]);

  // 통계 정렬 (순이익 순) + 확장 통계
  const sortedStats = useMemo(() => {
    return Object.entries(userStats)
      .map(([name, data]) => {
        const profit = data.received - data.spent;
        const winRate = data.playCount > 0 ? (data.winCount / data.playCount) * 100 : 0;
        // 운 지수: 기대 당첨 횟수 대비 실제 당첨 횟수 (100이면 평균, 낮을수록 운 좋음)
        // 평균적으로 참가자 수가 N명이면 1/N 확률로 당첨
        // 여기서는 단순히 당첨률이 낮을수록 운이 좋은 것으로 계산
        const luckIndex = data.playCount > 0 ? Math.round((1 - winRate / 100) * 100) : 50;
        return {
          name,
          ...data,
          profit,
          winRate,
          luckIndex,
        };
      })
      .sort((a, b) => b.profit - a.profit);
  }, [userStats]);

  // 전체 통계
  const globalStats = useMemo(() => {
    const totalGames = rouletteHistory.length;
    const totalAmount = rouletteHistory.reduce((sum, g) => sum + g.totalPrice, 0);
    const avgAmount = totalGames > 0 ? Math.round(totalAmount / totalGames) : 0;
    const maxGame = rouletteHistory.reduce((max, g) => g.totalPrice > (max?.totalPrice || 0) ? g : max, rouletteHistory[0]);
    const minGame = rouletteHistory.reduce((min, g) => g.totalPrice < (min?.totalPrice || Infinity) ? g : min, rouletteHistory[0]);

    // 가장 운 좋은/나쁜 사람
    const luckiest = sortedStats.length > 0 ? sortedStats.reduce((best, u) => u.luckIndex > best.luckIndex ? u : best) : null;
    const unluckiest = sortedStats.length > 0 ? sortedStats.reduce((worst, u) => u.luckIndex < worst.luckIndex ? u : worst) : null;

    // 최다 당첨자
    const mostWins = sortedStats.length > 0 ? sortedStats.reduce((max, u) => u.winCount > max.winCount ? u : max) : null;

    // 최다 참가자
    const mostPlays = sortedStats.length > 0 ? sortedStats.reduce((max, u) => u.playCount > max.playCount ? u : max) : null;

    return {
      totalGames,
      totalAmount,
      avgAmount,
      maxGame,
      minGame,
      luckiest,
      unluckiest,
      mostWins,
      mostPlays,
    };
  }, [rouletteHistory, sortedStats]);

  // 연속 기록 계산
  const streakStats = useMemo(() => {
    const streaks: { [name: string]: { currentStreak: number; maxStreak: number; streakType: 'win' | 'safe' | null } } = {};

    // 시간순 정렬
    const sortedGames = [...rouletteHistory].sort((a, b) => {
      const dateA = a.playedAt?.toDate?.() || new Date(a.playedAt);
      const dateB = b.playedAt?.toDate?.() || new Date(b.playedAt);
      return dateA.getTime() - dateB.getTime();
    });

    sortedGames.forEach((game) => {
      game.participants.forEach((name) => {
        if (!streaks[name]) {
          streaks[name] = { currentStreak: 0, maxStreak: 0, streakType: null };
        }

        if (game.winner === name) {
          // 당첨됨 (연속 안전 끊김)
          if (streaks[name].streakType === 'safe') {
            streaks[name].maxStreak = Math.max(streaks[name].maxStreak, streaks[name].currentStreak);
          }
          streaks[name].currentStreak = 1;
          streaks[name].streakType = 'win';
        } else {
          // 안전함
          if (streaks[name].streakType === 'safe') {
            streaks[name].currentStreak++;
          } else {
            streaks[name].currentStreak = 1;
            streaks[name].streakType = 'safe';
          }
        }
      });
    });

    // 마지막 streak도 maxStreak에 반영
    Object.values(streaks).forEach((s) => {
      if (s.streakType === 'safe') {
        s.maxStreak = Math.max(s.maxStreak, s.currentStreak);
      }
    });

    return streaks;
  }, [rouletteHistory]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupIdInput.trim()) {
      setError('모임 ID를 입력해주세요');
      return;
    }

    try {
      const groupRef = doc(db, 'groups', groupIdInput.trim());
      const docSnap = await getDoc(groupRef);

      if (!docSnap.exists()) {
        setError('존재하지 않는 모임입니다');
        return;
      }

      const data = docSnap.data() as GroupData;
      const adminPw = data.adminPassword || data.password; // adminPassword가 없으면 일반 비밀번호 사용

      if (password === adminPw) {
        setGroupId(groupIdInput.trim());
        setIsAuthenticated(true);
        setError('');
      } else {
        setError('비밀번호가 틀렸어요');
      }
    } catch (e) {
      console.error('Login error:', e);
      setError('로그인 중 오류가 발생했습니다');
    }
  };

  // 사용자 승인
  const approveUser = async (userName: string) => {
    if (!groupId) return;

    try {
      const groupRef = doc(db, 'groups', groupId);
      const newPending = pendingUsers.filter(u => u !== userName);
      const newApproved = [...approvedUsers, userName];

      await updateDoc(groupRef, {
        pendingUsers: newPending,
        approvedUsers: newApproved,
      });
    } catch (e) {
      console.error('Failed to approve user:', e);
    }
  };

  // 사용자 거절
  const rejectUser = async (userName: string) => {
    if (!groupId) return;

    try {
      const groupRef = doc(db, 'groups', groupId);
      const newPending = pendingUsers.filter(u => u !== userName);

      await updateDoc(groupRef, {
        pendingUsers: newPending,
      });
    } catch (e) {
      console.error('Failed to reject user:', e);
    }
  };

  // 승인된 사용자 제거
  const removeApprovedUser = async (userName: string) => {
    if (!groupId) return;
    if (!confirm(`${userName}님의 승인을 취소할까요?`)) return;

    try {
      const groupRef = doc(db, 'groups', groupId);
      const newApproved = approvedUsers.filter(u => u !== userName);

      await updateDoc(groupRef, {
        approvedUsers: newApproved,
      });
    } catch (e) {
      console.error('Failed to remove user:', e);
    }
  };

  const updateMarbleCount = async (userName: string, newCount: number) => {
    if (!groupId) return;
    if (newCount < 1) newCount = 1;
    if (newCount > 10) newCount = 10;

    try {
      const groupRef = doc(db, 'groups', groupId);
      await updateDoc(groupRef, {
        [`marbleCounts.${userName}`]: newCount,
      });
    } catch (e) {
      console.error('Failed to update marble count:', e);
    }
  };

  const resetAllCounts = async () => {
    if (!groupId) return;
    if (!confirm('모든 사용자의 공 개수를 1개로 초기화할까요?')) return;

    try {
      const resetCounts: { [key: string]: number } = {};
      Object.keys(marbleCounts).forEach(user => {
        resetCounts[user] = 1;
      });

      const groupRef = doc(db, 'groups', groupId);
      await updateDoc(groupRef, {
        marbleCounts: resetCounts,
      });
    } catch (e) {
      console.error('Failed to reset marble counts:', e);
    }
  };

  // 히스토리 삭제
  const deleteHistory = async (historyId: string) => {
    if (!groupId) return;
    if (!confirm('이 게임 기록을 삭제할까요? 통계에도 반영됩니다.')) return;

    try {
      const newHistory = rouletteHistory.filter(h => h.id !== historyId);
      const groupRef = doc(db, 'groups', groupId);
      await updateDoc(groupRef, {
        rouletteHistory: newHistory,
      });
    } catch (e) {
      console.error('Failed to delete history:', e);
    }
  };

  // 히스토리 수정 시작
  const startEditHistory = (record: RouletteHistory) => {
    setEditingHistoryId(record.id);
    setNewHistoryWinner(record.winner);

    // 참가자 금액은 비워둠 (기존 메뉴 유지하려면 비워두면 됨)
    setNewHistoryParticipants('');

    // 날짜 변환
    const date = record.playedAt?.toDate?.() || new Date(record.playedAt);
    const dateStr = date.toISOString().slice(0, 16); // datetime-local 형식
    setNewHistoryDate(dateStr);
  };

  // 폼 초기화
  const resetForm = () => {
    setNewHistoryWinner('');
    setNewHistoryParticipants('');
    setNewHistoryDate('');
    setEditingHistoryId(null);
  };

  // 히스토리 추가/수정
  const saveHistory = async () => {
    if (!groupId) return;
    if (!newHistoryWinner.trim()) {
      alert('당첨자를 입력해주세요');
      return;
    }

    // 수정 모드에서 기존 기록 가져오기
    const existingRecord = editingHistoryId
      ? rouletteHistory.find(h => h.id === editingHistoryId)
      : null;

    // "이름:금액" 형식 파싱
    const participantEntries = newHistoryParticipants
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0)
      .map(p => {
        const [name, priceStr] = p.split(':').map(s => s.trim());
        const price = parseInt(priceStr) || 0;
        return { name, price };
      })
      .filter(p => p.name.length > 0);

    // 수정 모드에서 참가자 필드가 비어있으면 기존 데이터 유지
    const keepOriginalData = editingHistoryId && participantEntries.length === 0 && existingRecord;

    if (!keepOriginalData && participantEntries.length === 0) {
      alert('참가자를 입력해주세요 (이름:금액 형식, 쉼표로 구분)');
      return;
    }

    let participants: string[];
    let orderItems: any[];
    let totalPrice: number;

    if (keepOriginalData) {
      // 기존 데이터 유지
      participants = existingRecord.participants;
      orderItems = existingRecord.orderItems;
      totalPrice = existingRecord.totalPrice;
    } else {
      // 새 데이터로 생성
      participants = participantEntries.map(p => p.name);

      // 당첨자가 참가자에 없으면 추가
      if (!participants.includes(newHistoryWinner.trim())) {
        participants.push(newHistoryWinner.trim());
      }

      totalPrice = participantEntries.reduce((sum, p) => sum + p.price, 0);

      if (totalPrice <= 0) {
        alert('금액을 입력해주세요');
        return;
      }

      orderItems = participantEntries
        .filter(p => p.price > 0)
        .map(p => ({
          menuName: '수동 입력',
          option: 'ONLY' as const,
          price: p.price,
          count: 1,
          orderedBy: [p.name],
        }));
    }

    // 날짜 처리: 입력값이 있으면 사용, 없으면 현재 시간
    const playedAt = newHistoryDate ? new Date(newHistoryDate) : new Date();

    const newRecord: RouletteHistory = {
      id: editingHistoryId || `manual_${Date.now()}`,
      playedAt: playedAt,
      winner: newHistoryWinner.trim(),
      participants: participants,
      orderItems: orderItems,
      totalPrice: totalPrice,
      paid: existingRecord?.paid ?? true,
    };

    try {
      const groupRef = doc(db, 'groups', groupId);

      let updatedHistory;
      if (editingHistoryId) {
        // 수정 모드: 기존 항목 교체
        updatedHistory = rouletteHistory.map(h =>
          h.id === editingHistoryId ? newRecord : h
        );
      } else {
        // 추가 모드: 배열에 추가
        updatedHistory = [...rouletteHistory, newRecord];
      }

      await updateDoc(groupRef, {
        rouletteHistory: updatedHistory,
      });

      resetForm();
      alert(editingHistoryId ? '히스토리가 수정되었습니다' : '히스토리가 추가되었습니다');
    } catch (e) {
      console.error('Failed to add history:', e);
    }
  };

  // 관리자 비밀번호 변경
  const changeAdminPassword = async () => {
    if (!groupId) return;
    if (!newAdminPassword.trim()) {
      alert('새 비밀번호를 입력해주세요');
      return;
    }
    if (newAdminPassword !== confirmAdminPassword) {
      alert('비밀번호가 일치하지 않습니다');
      return;
    }
    if (newAdminPassword.length < 4) {
      alert('비밀번호는 4자리 이상이어야 합니다');
      return;
    }

    try {
      const groupRef = doc(db, 'groups', groupId);
      await updateDoc(groupRef, {
        adminPassword: newAdminPassword,
      });
      setNewAdminPassword('');
      setConfirmAdminPassword('');
      alert('관리자 비밀번호가 변경되었습니다');
    } catch (e) {
      console.error('Failed to change admin password:', e);
      alert('비밀번호 변경에 실패했습니다');
    }
  };

  // 비밀번호 입력 화면
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-surface rounded-2xl shadow-xl p-6 w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock size={32} className="text-primary" />
            </div>
            <h1 className="text-xl font-bold text-text-primary">관리자 페이지</h1>
            <p className="text-sm text-text-secondary mt-1">비밀번호를 입력하세요</p>
          </div>

          <form onSubmit={handleLogin}>
            <input
              type="text"
              value={groupIdInput}
              onChange={(e) => setGroupIdInput(e.target.value)}
              placeholder="모임 ID (예: 서울15반)"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:outline-none mb-3"
              autoFocus
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="관리자 비밀번호"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:outline-none mb-3"
            />
            {error && (
              <p className="text-red-500 text-sm mb-3">{error}</p>
            )}
            <button
              type="submit"
              className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition"
            >
              입장
            </button>
          </form>

          <button
            onClick={() => navigate('/')}
            className="w-full mt-3 py-2 text-text-secondary hover:text-text-primary transition text-sm"
          >
            ← 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const marbleUsers = Object.keys(marbleCounts);

  // 관리 화면
  return (
    <div className="min-h-screen bg-background p-4 overflow-y-auto">
      <div className="max-w-lg mx-auto pb-8">
        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => {
              setIsAuthenticated(false);
              setGroupId(null);
              setGroupIdInput('');
              setPassword('');
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft size={24} className="text-text-secondary" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-text-primary">관리자 페이지</h1>
            <p className="text-sm text-text-secondary">그룹: {groupId}</p>
          </div>
        </div>

        {/* 탭 */}
        <div className="bg-gray-100 p-1 rounded-xl flex mb-6">
          <button
            onClick={() => setActiveTab('approval')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
              activeTab === 'approval' ? 'bg-white shadow-sm text-primary' : 'text-text-secondary'
            }`}
          >
            <Users size={14} />
            승인
            {pendingUsers.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {pendingUsers.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'stats' ? 'bg-white shadow-sm text-primary' : 'text-text-secondary'
            }`}
          >
            📊 통계
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
              activeTab === 'history' ? 'bg-white shadow-sm text-primary' : 'text-text-secondary'
            }`}
          >
            <History size={14} />
            기록
          </button>
          <button
            onClick={() => setActiveTab('marble')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'marble' ? 'bg-white shadow-sm text-primary' : 'text-text-secondary'
            }`}
          >
            🎱 공
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
              activeTab === 'settings' ? 'bg-white shadow-sm text-primary' : 'text-text-secondary'
            }`}
          >
            <Settings size={14} />
            설정
          </button>
        </div>

        {activeTab === 'approval' ? (
          /* 입장 승인 탭 */
          <div className="space-y-6">
            {/* 대기 중인 사용자 */}
            <div>
              <h2 className="font-bold text-text-primary mb-3 flex items-center gap-2">
                <span className="text-amber-500">⏳</span> 승인 대기 중
              </h2>
              {pendingUsers.length === 0 ? (
                <div className="text-center py-8 text-text-secondary bg-gray-50 rounded-xl">
                  <p>대기 중인 사용자가 없어요</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingUsers.map((userName) => (
                    <div
                      key={userName}
                      className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                          style={{
                            backgroundColor: getAvatarColor(userName),
                            color: getTextContrastColor(),
                          }}
                        >
                          {userName.slice(0, 2)}
                        </div>
                        <span className="font-bold text-text-primary">{userName}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => approveUser(userName)}
                          className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition"
                          title="승인"
                        >
                          <UserCheck size={18} />
                        </button>
                        <button
                          onClick={() => rejectUser(userName)}
                          className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
                          title="거절"
                        >
                          <UserX size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 승인된 사용자 */}
            <div>
              <h2 className="font-bold text-text-primary mb-3 flex items-center gap-2">
                <span className="text-green-500">✓</span> 승인된 사용자 ({approvedUsers.length}명)
              </h2>
              {approvedUsers.length === 0 ? (
                <div className="text-center py-8 text-text-secondary bg-gray-50 rounded-xl">
                  <p>승인된 사용자가 없어요</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {approvedUsers.map((userName) => (
                    <div
                      key={userName}
                      className="flex items-center justify-between bg-surface rounded-xl p-3 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                          style={{
                            backgroundColor: getAvatarColor(userName),
                            color: getTextContrastColor(),
                          }}
                        >
                          {userName.slice(0, 2)}
                        </div>
                        <span className="font-bold text-text-primary">{userName}</span>
                      </div>
                      <button
                        onClick={() => removeApprovedUser(userName)}
                        className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                        title="승인 취소"
                      >
                        <UserX size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'stats' ? (
          /* 통계 탭 */
          <div className="space-y-4">
            {/* 전체 요약 카드 */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-surface rounded-xl p-3 shadow-sm text-center">
                <p className="text-2xl font-bold text-primary">{globalStats.totalGames}</p>
                <p className="text-xs text-text-secondary">총 게임</p>
              </div>
              <div className="bg-surface rounded-xl p-3 shadow-sm text-center">
                <p className="text-2xl font-bold text-amber-500">{(globalStats.totalAmount / 10000).toFixed(1)}만</p>
                <p className="text-xs text-text-secondary">총 금액</p>
              </div>
              <div className="bg-surface rounded-xl p-3 shadow-sm text-center">
                <p className="text-2xl font-bold text-blue-500">{globalStats.avgAmount.toLocaleString()}</p>
                <p className="text-xs text-text-secondary">평균/게임</p>
              </div>
            </div>

            {/* 재미 통계 */}
            {sortedStats.length > 0 && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                <h3 className="font-bold text-purple-800 mb-3 text-sm">🎲 재미 통계</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {globalStats.luckiest && (
                    <div className="bg-white/70 rounded-lg p-2">
                      <p className="text-xs text-purple-600">🍀 가장 운 좋은</p>
                      <p className="font-bold text-purple-800">{globalStats.luckiest.name}</p>
                      <p className="text-xs text-purple-500">당첨률 {globalStats.luckiest.winRate.toFixed(1)}%</p>
                    </div>
                  )}
                  {globalStats.unluckiest && (
                    <div className="bg-white/70 rounded-lg p-2">
                      <p className="text-xs text-pink-600">😢 가장 운 나쁜</p>
                      <p className="font-bold text-pink-800">{globalStats.unluckiest.name}</p>
                      <p className="text-xs text-pink-500">당첨률 {globalStats.unluckiest.winRate.toFixed(1)}%</p>
                    </div>
                  )}
                  {globalStats.mostWins && (
                    <div className="bg-white/70 rounded-lg p-2">
                      <p className="text-xs text-amber-600">☕ 최다 당첨</p>
                      <p className="font-bold text-amber-800">{globalStats.mostWins.name}</p>
                      <p className="text-xs text-amber-500">{globalStats.mostWins.winCount}번 당첨</p>
                    </div>
                  )}
                  {globalStats.mostPlays && (
                    <div className="bg-white/70 rounded-lg p-2">
                      <p className="text-xs text-blue-600">🎮 최다 참가</p>
                      <p className="font-bold text-blue-800">{globalStats.mostPlays.name}</p>
                      <p className="text-xs text-blue-500">{globalStats.mostPlays.playCount}게임 참가</p>
                    </div>
                  )}
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
            )}

            {/* 본전 계산기 */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
              <h3 className="font-bold text-green-800 mb-3 text-sm">🧮 본전 계산기</h3>
              <div className="flex gap-2 mb-3">
                <input
                  type="number"
                  value={coffeePrice}
                  onChange={(e) => setCoffeePrice(e.target.value)}
                  placeholder="커피 1잔 가격"
                  className="flex-1 px-3 py-2 rounded-lg border border-green-200 text-sm focus:border-green-500 focus:outline-none"
                />
                <span className="flex items-center text-sm text-green-600">원</span>
              </div>
              {sortedStats.length > 0 && coffeePrice && (
                <div className="space-y-2">
                  {sortedStats.slice(0, 5).map((user) => {
                    const price = parseInt(coffeePrice) || 4500;
                    const deficit = -user.profit; // 적자 금액
                    const gamesNeeded = deficit > 0 ? Math.ceil(deficit / price) : 0;
                    const isProfit = user.profit >= 0;

                    return (
                      <div key={user.name} className="flex items-center justify-between bg-white/70 rounded-lg px-3 py-2">
                        <span className="font-medium text-green-800">{user.name}</span>
                        {isProfit ? (
                          <span className="text-sm text-green-600 font-bold">
                            ✅ 이미 +{Math.floor(user.profit / price)}잔 이득!
                          </span>
                        ) : (
                          <span className="text-sm text-amber-600">
                            {gamesNeeded}번 더 이겨야 본전
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 개인별 상세 통계 */}
            <div>
              <h3 className="font-bold text-text-primary mb-3 text-sm">👥 개인별 상세 통계</h3>
              {sortedStats.length === 0 ? (
                <div className="text-center py-12 text-text-secondary">
                  <p>아직 게임 기록이 없어요</p>
                  <p className="text-sm mt-1">룰렛 게임을 진행하면 통계가 기록됩니다</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedStats.map((user, index) => {
                    const streak = streakStats[user.name];
                    return (
                      <div
                        key={user.name}
                        className="bg-surface rounded-xl p-4 shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                                style={{
                                  backgroundColor: getAvatarColor(user.name),
                                  color: getTextContrastColor(),
                                }}
                              >
                                {user.name.slice(0, 2)}
                              </div>
                              {index < 3 && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-xs font-bold text-white">
                                  {index + 1}
                                </div>
                              )}
                            </div>
                            <div>
                              <span className="font-bold text-text-primary">{user.name}</span>
                              <p className="text-xs text-text-secondary">
                                {user.playCount}게임 · {user.winCount}번 당첨 · 당첨률 {user.winRate.toFixed(1)}%
                              </p>
                            </div>
                          </div>
                          <div className={`text-right ${user.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            <div className="flex items-center gap-1 justify-end">
                              {user.profit >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                              <span className="font-bold">
                                {user.profit >= 0 ? '+' : ''}{user.profit.toLocaleString()}원
                              </span>
                            </div>
                            <p className="text-xs opacity-70">순이익</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2 text-sm">
                          <div className="bg-red-50 rounded-lg p-2 text-center">
                            <p className="text-red-600 font-bold text-xs">{user.spent.toLocaleString()}</p>
                            <p className="text-[10px] text-red-400">산 금액</p>
                          </div>
                          <div className="bg-green-50 rounded-lg p-2 text-center">
                            <p className="text-green-600 font-bold text-xs">{user.received.toLocaleString()}</p>
                            <p className="text-[10px] text-green-400">얻은 금액</p>
                          </div>
                          <div className="bg-blue-50 rounded-lg p-2 text-center">
                            <p className="text-blue-600 font-bold text-xs">
                              {streak?.currentStreak || 0}연속
                            </p>
                            <p className="text-[10px] text-blue-400">
                              {streak?.streakType === 'safe' ? '안전' : streak?.streakType === 'win' ? '당첨' : '-'}
                            </p>
                          </div>
                          <div className="bg-purple-50 rounded-lg p-2 text-center">
                            <p className="text-purple-600 font-bold text-xs">{user.luckIndex}</p>
                            <p className="text-[10px] text-purple-400">운 지수</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'history' ? (
          /* 히스토리 관리 탭 */
          <div className="space-y-6">
            {/* 히스토리 추가/수정 */}
            <div className={`bg-surface rounded-xl p-4 shadow-sm ${editingHistoryId ? 'ring-2 ring-amber-400' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-text-primary flex items-center gap-2">
                  {editingHistoryId ? (
                    <>
                      <Pencil size={18} className="text-amber-500" />
                      기록 수정
                    </>
                  ) : (
                    <>
                      <PlusCircle size={18} className="text-primary" />
                      기록 추가
                    </>
                  )}
                </h2>
                {editingHistoryId && (
                  <button
                    onClick={resetForm}
                    className="p-1.5 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                    title="취소"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
              <div className="space-y-3">
                <input
                  type="text"
                  value={newHistoryWinner}
                  onChange={(e) => setNewHistoryWinner(e.target.value)}
                  placeholder="당첨자 (커피 산 사람)"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-primary focus:outline-none"
                />
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">
                    {editingHistoryId
                      ? '참가자별 금액 (비워두면 기존 메뉴 유지)'
                      : '참가자별 금액 (이름:금액, 쉼표로 구분)'}
                  </label>
                  <textarea
                    value={newHistoryParticipants}
                    onChange={(e) => setNewHistoryParticipants(e.target.value)}
                    placeholder={editingHistoryId
                      ? '비워두면 기존 메뉴 유지, 수정하려면: 홍길동:4500, 김철수:5000'
                      : '예: 홍길동:4500, 김철수:5000, 이영희:4000'}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-primary focus:outline-none min-h-[80px]"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">일시 (비워두면 현재 시간)</label>
                  <input
                    type="datetime-local"
                    value={newHistoryDate}
                    onChange={(e) => setNewHistoryDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <button
                  onClick={saveHistory}
                  className={`w-full py-2 text-white rounded-lg font-bold text-sm transition ${
                    editingHistoryId
                      ? 'bg-amber-500 hover:bg-amber-600'
                      : 'bg-primary hover:bg-primary-dark'
                  }`}
                >
                  {editingHistoryId ? '수정하기' : '추가하기'}
                </button>
              </div>
            </div>

            {/* 히스토리 목록 */}
            <div>
              <h2 className="font-bold text-text-primary mb-3 flex items-center gap-2">
                <History size={18} />
                게임 기록 ({rouletteHistory.length}건)
              </h2>
              {rouletteHistory.length === 0 ? (
                <div className="text-center py-8 text-text-secondary bg-gray-50 rounded-xl">
                  <p>게임 기록이 없어요</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {[...rouletteHistory].sort((a, b) => {
                    const dateA = a.playedAt?.toDate?.() || new Date(a.playedAt);
                    const dateB = b.playedAt?.toDate?.() || new Date(b.playedAt);
                    return dateB.getTime() - dateA.getTime();
                  }).map((record) => {
                    const date = record.playedAt?.toDate?.() || new Date(record.playedAt);
                    const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;

                    return (
                      <div
                        key={record.id}
                        className="bg-surface rounded-xl p-3 shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs"
                              style={{
                                backgroundColor: getAvatarColor(record.winner),
                                color: getTextContrastColor(),
                              }}
                            >
                              {record.winner.slice(0, 2)}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-text-primary">
                                {record.winner} <span className="font-normal text-text-secondary">당첨</span>
                              </p>
                              <p className="text-xs text-text-secondary">{dateStr}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-bold text-primary mr-1">
                              {record.totalPrice.toLocaleString()}원
                            </span>
                            <button
                              onClick={() => startEditHistory(record)}
                              className="p-1.5 text-text-secondary hover:text-amber-500 hover:bg-amber-50 rounded-lg transition"
                              title="수정"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => deleteHistory(record.id)}
                              className="p-1.5 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                              title="삭제"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-text-secondary">
                          참가자: {record.participants.join(', ')}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'marble' ? (
          /* 공 개수 관리 탭 */
          <div>
            {/* 설명 */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-amber-800">
                🎱 공 개수가 많을수록 룰렛 당첨(커피 사기) 확률이 높아져요
              </p>
            </div>

            {/* 사용자 목록 */}
            {marbleUsers.length === 0 ? (
              <div className="text-center py-12 text-text-secondary">
                <p>아직 기록된 사용자가 없어요</p>
                <p className="text-sm mt-1">룰렛 게임을 한 번 진행하면 기록됩니다</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {marbleUsers.map((userName) => {
                    const count = marbleCounts[userName] || 1;
                    return (
                      <div
                        key={userName}
                        className="flex items-center justify-between bg-surface rounded-xl p-4 shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                            style={{
                              backgroundColor: getAvatarColor(userName),
                              color: getTextContrastColor(),
                            }}
                          >
                            {userName.slice(0, 2)}
                          </div>
                          <span className="font-bold text-text-primary">{userName}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateMarbleCount(userName, count - 1)}
                            disabled={count <= 1}
                            className="w-9 h-9 flex items-center justify-center bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-gray-100 rounded-lg transition"
                          >
                            <Minus size={18} />
                          </button>
                          <div className="w-14 text-center">
                            <span className="text-xl font-bold text-primary">🎱 {count}</span>
                          </div>
                          <button
                            onClick={() => updateMarbleCount(userName, count + 1)}
                            disabled={count >= 10}
                            className="w-9 h-9 flex items-center justify-center bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-gray-100 rounded-lg transition"
                          >
                            <Plus size={18} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={resetAllCounts}
                  className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-text-secondary rounded-xl font-bold transition"
                >
                  <RotateCcw size={18} />
                  전체 초기화 (모두 1개로)
                </button>
              </>
            )}
          </div>
        ) : (
          /* 설정 탭 */
          <div className="space-y-6">
            {/* 관리자 비밀번호 변경 */}
            <div className="bg-surface rounded-xl p-4 shadow-sm">
              <h2 className="font-bold text-text-primary flex items-center gap-2 mb-4">
                <Key size={18} className="text-primary" />
                관리자 비밀번호 변경
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">새 비밀번호</label>
                  <input
                    type="password"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    placeholder="새 관리자 비밀번호"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">비밀번호 확인</label>
                  <input
                    type="password"
                    value={confirmAdminPassword}
                    onChange={(e) => setConfirmAdminPassword(e.target.value)}
                    placeholder="비밀번호 다시 입력"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <button
                  onClick={changeAdminPassword}
                  disabled={!newAdminPassword || !confirmAdminPassword}
                  className="w-full py-2 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary-dark transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  비밀번호 변경
                </button>
              </div>
            </div>

            {/* 안내 */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-800">
                💡 관리자 비밀번호는 입장 비밀번호와 별도로 설정할 수 있어요.
                설정하지 않으면 입장 비밀번호로 관리자 페이지에 접근할 수 있습니다.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
