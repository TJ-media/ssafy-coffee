import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Lock, Minus, Plus, RotateCcw, ArrowLeft } from 'lucide-react';
import { getAvatarColor, getTextContrastColor } from '../utils';

const ADMIN_PASSWORD = 'coffee1234'; // 관리자 비밀번호

const AdminPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [marbleCounts, setMarbleCounts] = useState<{ [userName: string]: number }>({});

  const navigate = useNavigate();
  const groupId = localStorage.getItem('ssafy_groupId');

  // Firestore 구독
  useEffect(() => {
    if (!groupId || !isAuthenticated) return;

    const unsub = onSnapshot(doc(db, 'groups', groupId), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        setMarbleCounts(data.marbleCounts || {});
      }
    });
    return () => unsub();
  }, [groupId, isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('비밀번호가 틀렸어요');
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
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:outline-none mb-3"
              autoFocus
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
            onClick={() => navigate('/order')}
            className="w-full mt-3 py-2 text-text-secondary hover:text-text-primary transition text-sm"
          >
            ← 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const users = Object.keys(marbleCounts);

  // 관리 화면
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto">
        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/order')}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft size={24} className="text-text-secondary" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-text-primary">공 개수 관리</h1>
            <p className="text-sm text-text-secondary">그룹: {groupId}</p>
          </div>
        </div>

        {/* 설명 */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-amber-800">
            🎱 공 개수가 많을수록 룰렛 당첨(커피 사기) 확률이 높아져요
          </p>
        </div>

        {/* 사용자 목록 */}
        {users.length === 0 ? (
          <div className="text-center py-12 text-text-secondary">
            <p>아직 기록된 사용자가 없어요</p>
            <p className="text-sm mt-1">룰렛 게임을 한 번 진행하면 기록됩니다</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {users.map((userName) => {
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
    </div>
  );
};

export default AdminPage;
