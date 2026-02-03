import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Lock, Minus, Plus, RotateCcw, ArrowLeft, UserCheck, UserX, Users } from 'lucide-react';
import { getAvatarColor, getTextContrastColor } from '../utils';

const ADMIN_PASSWORD = 'coffee1234'; // 관리자 비밀번호

const AdminPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [groupIdInput, setGroupIdInput] = useState('');
  const [error, setError] = useState('');
  const [marbleCounts, setMarbleCounts] = useState<{ [userName: string]: number }>({});
  const [pendingUsers, setPendingUsers] = useState<string[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'approval' | 'marble'>('approval');
  const [groupId, setGroupId] = useState<string | null>(null);

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
      }
    });
    return () => unsub();
  }, [groupId, isAuthenticated]);

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
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto">
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
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'approval' ? 'bg-white shadow-sm text-primary' : 'text-text-secondary'
            }`}
          >
            <Users size={16} />
            입장 승인
            {pendingUsers.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {pendingUsers.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('marble')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${
              activeTab === 'marble' ? 'bg-white shadow-sm text-primary' : 'text-text-secondary'
            }`}
          >
            🎱 공 개수
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
