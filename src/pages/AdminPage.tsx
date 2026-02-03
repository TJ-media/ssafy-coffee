import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Lock, Minus, Plus, RotateCcw, ArrowLeft, UserCheck, UserX, Users, TrendingUp, TrendingDown, Trash2, PlusCircle, History, Pencil, X } from 'lucide-react';
import { getAvatarColor, getTextContrastColor, getNextBusinessDay } from '../utils';
import { RouletteHistory } from '../types';

const ADMIN_PASSWORD = 'coffee1234'; // 관리자 비밀번호

const AdminPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [groupIdInput, setGroupIdInput] = useState('');
  const [error, setError] = useState('');
  const [marbleCounts, setMarbleCounts] = useState<{ [userName: string]: number }>({});
  const [pendingUsers, setPendingUsers] = useState<string[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<string[]>([]);
  const [rouletteHistory, setRouletteHistory] = useState<RouletteHistory[]>([]);
  const [activeTab, setActiveTab] = useState<'approval' | 'marble' | 'stats' | 'history'>('approval');
  const [groupId, setGroupId] = useState<string | null>(null);

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

  // 통계 정렬 (순이익 순)
  const sortedStats = useMemo(() => {
    return Object.entries(userStats)
      .map(([name, data]) => ({
        name,
        ...data,
        profit: data.received - data.spent,
      }))
      .sort((a, b) => b.profit - a.profit);
  }, [userStats]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupIdInput.trim()) {
      setError('모임 ID를 입력해주세요');
      return;
    }
    if (password === ADMIN_PASSWORD) {
      setGroupId(groupIdInput.trim());
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('비밀번호가 틀렸어요');
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
          <div>
            {/* 설명 */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-blue-800">
                📊 룰렛 게임 기록을 바탕으로 한 통계입니다
              </p>
            </div>

            {/* 총 게임 수 */}
            <div className="bg-surface rounded-xl p-4 shadow-sm mb-4">
              <div className="text-center">
                <p className="text-text-secondary text-sm">총 게임 수</p>
                <p className="text-3xl font-bold text-primary">{rouletteHistory.length}회</p>
              </div>
            </div>

            {/* 사용자별 통계 */}
            {sortedStats.length === 0 ? (
              <div className="text-center py-12 text-text-secondary">
                <p>아직 게임 기록이 없어요</p>
                <p className="text-sm mt-1">룰렛 게임을 진행하면 통계가 기록됩니다</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedStats.map((user, index) => (
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
                            {user.playCount}게임 / {user.winCount}번 당첨
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

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-red-50 rounded-lg p-2 text-center">
                        <p className="text-red-600 font-bold">{user.spent.toLocaleString()}원</p>
                        <p className="text-xs text-red-400">산 금액</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-2 text-center">
                        <p className="text-green-600 font-bold">{user.received.toLocaleString()}원</p>
                        <p className="text-xs text-green-400">얻어먹은 금액</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
        ) : (
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
        )}
      </div>
    </div>
  );
};

export default AdminPage;
