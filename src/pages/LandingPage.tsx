import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, onSnapshot } from 'firebase/firestore';
import { GroupData } from '../types';
import { Coffee, CheckCircle, AlertCircle, Clock, Loader2 } from 'lucide-react';
import { CAFE_LIST } from '../menuData';

const LandingPage = () => {
  const [isJoin, setIsJoin] = useState<boolean>(true);
  const [groupId, setGroupId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [adminPassword, setAdminPassword] = useState<string>(''); // 관리자 비밀번호
  const [userName, setUserName] = useState<string>('');

  // 에러 및 상태 메시지
  const [idMsg, setIdMsg] = useState<{type: 'error'|'success'|'', text: string}>({type: '', text: ''});
  const [pwMsg, setPwMsg] = useState<{type: 'error'|'success'|'', text: string}>({type: '', text: ''});

  // 카페 선택 모드
  const [step, setStep] = useState<'input' | 'cafe_select' | 'waiting_approval'>('input');

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // URL 파라미터에서 group 감지
  useEffect(() => {
    const groupParam = searchParams.get('group');
    if (groupParam) {
      setGroupId(groupParam);
      setIsJoin(true); // 참여하기 모드로 전환
    }
  }, [searchParams]);

  // 승인 대기 중일 때 실시간 감시
  useEffect(() => {
    if (step !== 'waiting_approval' || !groupId || !userName) return;

    const unsub = onSnapshot(doc(db, 'groups', groupId), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data() as GroupData;
        const approved = data.approvedUsers || [];
        const pending = data.pendingUsers || [];

        if (approved.includes(userName)) {
          // 승인됨! 입장
          saveToLocal();
          navigate('/order');
        } else if (!pending.includes(userName)) {
          // 거절됨 (대기 목록에서 사라짐)
          setStep('input');
          alert('입장이 거절되었습니다.');
        }
      }
    });

    return () => unsub();
  }, [step, groupId, userName, navigate]);

  // 1. 모임 ID 실시간 검사 (Debounce 적용)
  useEffect(() => {
    const checkId = async () => {
      if (!groupId) {
        setIdMsg({type: '', text: ''});
        return;
      }

      try {
        const docRef = doc(db, 'groups', groupId);
        const docSnap = await getDoc(docRef);

        if (isJoin) {
          // 참여 모드: 존재해야 성공
          if (!docSnap.exists()) {
            setIdMsg({type: 'error', text: '존재하지 않는 모임입니다!'});
          } else {
            setIdMsg({type: 'success', text: '입장 가능한 모임입니다.'});
          }
        } else {
          // 생성 모드: 존재하면 실패
          if (docSnap.exists()) {
            setIdMsg({type: 'error', text: '이미 존재하는 모임입니다!'});
          } else {
            setIdMsg({type: 'success', text: '사용 가능한 ID입니다.'});
          }
        }
      } catch (e) {
        console.error(e);
      }
    };

    const timer = setTimeout(checkId, 500); // 0.5초 딜레이
    return () => clearTimeout(timer);
  }, [groupId, isJoin]);

  // 2. 비밀번호 실시간 검사 (참여하기 모드일 때만)
  useEffect(() => {
    const checkPw = async () => {
      if (!isJoin || !groupId || !password || idMsg.type === 'error') {
        setPwMsg({type: '', text: ''});
        return;
      }

      const docRef = doc(db, 'groups', groupId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as GroupData;
        if (data.password !== password) {
          setPwMsg({type: 'error', text: '틀린 비밀번호입니다!'});
        } else {
          setPwMsg({type: 'success', text: '비밀번호 확인 완료'});
        }
      }
    };

    const timer = setTimeout(checkPw, 500);
    return () => clearTimeout(timer);
  }, [password, groupId, isJoin, idMsg.type]);


  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupId || !password || !userName) return alert('모든 정보를 입력해주세요.');
    if (idMsg.type === 'error' || pwMsg.type === 'error') return alert('입력 정보를 확인해주세요.');

    if (isJoin) {
      // 참여하기: 승인 여부 확인
      const docRef = doc(db, 'groups', groupId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as GroupData;
        const approved = data.approvedUsers || [];
        const pending = data.pendingUsers || [];

        if (approved.includes(userName)) {
          // 이미 승인된 사용자 → 바로 입장
          saveToLocal();
          navigate('/order');
        } else if (pending.includes(userName)) {
          // 이미 대기 중 → 대기 화면
          setStep('waiting_approval');
        } else {
          // 새 사용자 → 대기 목록에 추가
          await updateDoc(docRef, {
            pendingUsers: arrayUnion(userName)
          });
          setStep('waiting_approval');
        }
      }
    } else {
      // 만들기는 카페 선택 단계로 이동
      setStep('cafe_select');
    }
  };

  const createGroup = async (cafeId: string) => {
    const groupRef = doc(db, 'groups', groupId);
    const newGroup: GroupData = {
      password,
      adminPassword: adminPassword || password, // 관리자 비밀번호 (미입력 시 일반 비밀번호 사용)
      createdAt: new Date(),
      cart: [],
      selectedCafe: cafeId,
      approvedUsers: [userName], // 생성자는 자동 승인
      pendingUsers: []
    };
    await setDoc(groupRef, newGroup);
    saveToLocal();
    navigate('/order');
  };

  const saveToLocal = () => {
    localStorage.setItem('ssafy_groupId', groupId);
    localStorage.setItem('ssafy_userName', userName);
  };

  // 모드 전환 시 리셋
  const toggleMode = (join: boolean) => {
    setIsJoin(join);
    setStep('input');
    setIdMsg({type:'', text:''});
    setPwMsg({type:'', text:''});
    setGroupId('');
    setPassword('');
    setAdminPassword('');
  };

  // 대기 취소
  const cancelWaiting = async () => {
    if (!groupId || !userName) return;

    const docRef = doc(db, 'groups', groupId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as GroupData;
      const pending = (data.pendingUsers || []).filter(u => u !== userName);
      await updateDoc(docRef, { pendingUsers: pending });
    }

    setStep('input');
  };

  return (
    <div className="p-6 flex flex-col h-full overflow-y-auto custom-scrollbar">
      <div className="mt-10 mb-8 text-center shrink-0">
        <Coffee size={48} className="text-primary mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-text-primary mb-2">오늘의 커피 내기</h1>
        <p className="text-text-secondary">싸피 친구들과 함께해요</p>
      </div>

      {step === 'waiting_approval' ? (
        /* 승인 대기 화면 */
        <div className="flex-1 flex flex-col items-center justify-center animate-fade-in-up">
          <div className="bg-amber-50 rounded-full p-6 mb-6">
            <Loader2 size={48} className="text-amber-500 animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-text-primary mb-2">승인 대기 중</h2>
          <p className="text-text-secondary text-center mb-2">
            <span className="font-bold text-primary">{userName}</span>님의 입장을
          </p>
          <p className="text-text-secondary text-center mb-6">
            관리자가 승인할 때까지 기다려주세요
          </p>
          <div className="flex items-center gap-2 text-sm text-text-secondary bg-gray-100 px-4 py-2 rounded-full">
            <Clock size={16} />
            <span>승인되면 자동으로 입장됩니다</span>
          </div>
          <button
            onClick={cancelWaiting}
            className="mt-8 text-text-secondary underline text-sm"
          >
            대기 취소
          </button>
        </div>
      ) : (
        <>
          {/* 탭 버튼 */}
          <div className="bg-background p-1.5 rounded-xl flex mb-6 shrink-0">
            <button
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${isJoin ? 'bg-surface shadow-sm text-primary' : 'text-text-secondary'}`}
              onClick={() => toggleMode(true)}
            >참여하기</button>
            <button
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${!isJoin ? 'bg-surface shadow-sm text-primary' : 'text-text-secondary'}`}
              onClick={() => toggleMode(false)}
            >새로 만들기</button>
          </div>

          {step === 'input' ? (
            <form onSubmit={handleInitialSubmit} className="space-y-4 shrink-0">
              {/* 모임 ID 입력 */}
              <div className="relative">
                <input
                  type="text" placeholder="모임 ID (예: 서울_1반)"
                  className={`w-full p-4 bg-background rounded-xl focus:outline-none focus:ring-2 transition ${idMsg.type === 'error' ? 'ring-2 ring-danger/50' : 'focus:ring-primary/50'}`}
                  value={groupId} onChange={(e) => setGroupId(e.target.value)}
                />
                {idMsg.text && (
                  <p className={`text-xs mt-1 ml-1 flex items-center gap-1 ${idMsg.type === 'error' ? 'text-danger' : 'text-secondary'}`}>
                    {idMsg.type === 'error' ? <AlertCircle size={12}/> : <CheckCircle size={12}/>}
                    {idMsg.text}
                  </p>
                )}
              </div>

              {/* 비밀번호 입력 */}
              <div className="relative">
                <input
                  type="password" placeholder="비밀번호 4자리"
                  className={`w-full p-4 bg-background rounded-xl focus:outline-none focus:ring-2 transition ${pwMsg.type === 'error' ? 'ring-2 ring-danger/50' : 'focus:ring-primary/50'}`}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                />
                {pwMsg.text && (
                  <p className={`text-xs mt-1 ml-1 flex items-center gap-1 ${pwMsg.type === 'error' ? 'text-danger' : 'text-secondary'}`}>
                    {pwMsg.type === 'error' ? <AlertCircle size={12}/> : <CheckCircle size={12}/>}
                    {pwMsg.text}
                  </p>
                )}
              </div>

              {/* 관리자 비밀번호 (새로 만들기 모드에서만) */}
              {!isJoin && (
                <div className="relative">
                  <input
                    type="password"
                    placeholder="관리자 비밀번호 (선택)"
                    className="w-full p-4 bg-background rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                  />
                  <p className="text-xs mt-1 ml-1 text-text-secondary">
                    미입력 시 입장 비밀번호로 설정됩니다
                  </p>
                </div>
              )}

              <input
                type="text" placeholder="내 이름 (예: 김싸피)"
                className="w-full p-4 bg-background rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                value={userName} onChange={(e) => setUserName(e.target.value)}
              />

              <button
                type="submit"
                disabled={idMsg.type === 'error' || pwMsg.type === 'error' || !groupId || !password}
                className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-primary-dark transition mt-4 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isJoin ? '입장하기' : '카페 선택하기'}
              </button>
            </form>
          ) : (
            /* 카페 선택 화면 (새로 만들기 일 때만 등장) */
            <div className="animate-fade-in-up">
              <h3 className="text-lg font-bold mb-4 text-center">오늘 주문할 카페는?</h3>
              <div className="grid grid-cols-2 gap-4 pb-10">
                {CAFE_LIST.map(cafe => (
                  <button
                    key={cafe.id}
                    onClick={() => createGroup(cafe.id)}
                    className="bg-surface p-4 rounded-2xl shadow-toss hover:ring-2 hover:ring-primary transition flex flex-col items-center gap-2"
                  >
                    <div className="text-4xl">{cafe.img}</div>
                    <span className="font-bold text-text-primary">{cafe.name}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep('input')}
                className="w-full text-text-secondary py-3 text-sm underline"
              >
                뒤로 가기
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LandingPage;
