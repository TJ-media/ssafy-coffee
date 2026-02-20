import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import {
    X, Users, History, Settings, Key, Lock, Minus, Plus, RotateCcw,
    Pencil, Trash2, PlusCircle, UserCheck, UserX, ChevronDown
} from 'lucide-react';
import { getAvatarColor, getTextContrastColor } from '../../../shared/utils';
import { RouletteHistory, GroupData } from '../../../shared/types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    groupId: string;
}

const SettingsModal = ({ isOpen, onClose, groupId }: Props) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // Data State
    const [marbleCounts, setMarbleCounts] = useState<{ [userName: string]: number }>({});
    const [pendingUsers, setPendingUsers] = useState<string[]>([]);
    const [approvedUsers, setApprovedUsers] = useState<string[]>([]);
    const [rouletteHistory, setRouletteHistory] = useState<RouletteHistory[]>([]);

    const [activeTab, setActiveTab] = useState<'approval' | 'marble' | 'history' | 'settings'>('approval');

    // Settings State
    const [newAdminPassword, setNewAdminPassword] = useState('');
    const [confirmAdminPassword, setConfirmAdminPassword] = useState('');

    // History Edit State
    const [newHistoryWinner, setNewHistoryWinner] = useState('');
    const [newHistoryParticipants, setNewHistoryParticipants] = useState('');
    const [newHistoryDate, setNewHistoryDate] = useState('');
    const [editingHistoryId, setEditingHistoryId] = useState<string | null>(null);

    // Marble Sort State
    type MarbleSortMode = 'name-asc' | 'name-desc' | 'count-asc' | 'count-desc';
    const [marbleSortMode, setMarbleSortMode] = useState<MarbleSortMode>('name-asc');
    const [marbleSortOpen, setMarbleSortOpen] = useState(false);

    // Marble Input State (빈칸 허용을 위한 로컬 상태)
    const [marbleInputValues, setMarbleInputValues] = useState<{ [userName: string]: string }>({});
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // 초기화
    useEffect(() => {
        if (!isOpen) {
            setIsAuthenticated(false);
            setPassword('');
            setError('');
            setActiveTab('approval');
        }
    }, [isOpen]);

    // 데이터 구독
    useEffect(() => {
        if (!isOpen || !groupId || !isAuthenticated) return;

        const unsub = onSnapshot(doc(db, 'groups', groupId), (docSnapshot) => {
            if (docSnapshot.exists()) {
                const data = docSnapshot.data();
                const mc = data.marbleCounts || {};
                setMarbleCounts(mc);
                // Firestore에서 받은 값으로 inputValues 동기화 (현재 포커스 중이 아닌 것만)
                setMarbleInputValues(prev => {
                    const next: { [k: string]: string } = {};
                    Object.keys(mc).forEach(u => {
                        next[u] = prev[u] !== undefined && document.activeElement?.getAttribute('data-marble-user') === u
                            ? prev[u]
                            : String(mc[u] ?? 0);
                    });
                    return next;
                });
                setPendingUsers(data.pendingUsers || []);
                setApprovedUsers(data.approvedUsers || []);
                setRouletteHistory(data.rouletteHistory || []);
            }
        });
        return () => unsub();
    }, [isOpen, groupId, isAuthenticated]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password.trim()) return;

        try {
            const docRef = doc(db, 'groups', groupId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data() as GroupData;
                const adminPw = data.adminPassword || data.password;

                if (password === adminPw) {
                    setIsAuthenticated(true);
                    setError('');
                } else {
                    setError('비밀번호가 일치하지 않습니다.');
                }
            }
        } catch (e) {
            console.error(e);
            setError('오류가 발생했습니다.');
        }
    };

    const approveUser = async (userName: string) => {
        if (!groupId) return;
        try {
            const newPending = pendingUsers.filter(u => u !== userName);
            const newApproved = [...approvedUsers, userName];
            await updateDoc(doc(db, 'groups', groupId), { pendingUsers: newPending, approvedUsers: newApproved });
        } catch (e) { console.error(e); }
    };

    const rejectUser = async (userName: string) => {
        if (!groupId) return;
        try {
            const newPending = pendingUsers.filter(u => u !== userName);
            await updateDoc(doc(db, 'groups', groupId), { pendingUsers: newPending });
        } catch (e) { console.error(e); }
    };

    const removeApprovedUser = async (userName: string) => {
        if (!groupId || !confirm(`${userName}님의 승인을 취소할까요?`)) return;
        try {
            const newApproved = approvedUsers.filter(u => u !== userName);
            await updateDoc(doc(db, 'groups', groupId), { approvedUsers: newApproved });
        } catch (e) { console.error(e); }
    };

    const updateMarbleCount = async (userName: string, newCount: number) => {
        if (!groupId) return;
        if (newCount < 0) newCount = 0;
        if (newCount > 50) newCount = 50;

        try {
            await updateDoc(doc(db, 'groups', groupId), { [`marbleCounts.${userName}`]: newCount });
        } catch (e) { console.error(e); }
    };

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 2000);
    };

    const resetAllCounts = async () => {
        if (!groupId || !confirm('모든 사용자의 공 개수를 1개로 초기화할까요?')) return;
        try {
            const resetCounts: { [key: string]: number } = {};
            Object.keys(marbleCounts).forEach(user => { resetCounts[user] = 1; });
            await updateDoc(doc(db, 'groups', groupId), { marbleCounts: resetCounts });
        } catch (e) { console.error(e); }
    };

    const deleteHistory = async (historyId: string) => {
        if (!groupId || !confirm('이 게임 기록을 삭제할까요?')) return;
        try {
            const newHistory = rouletteHistory.filter(h => h.id !== historyId);
            await updateDoc(doc(db, 'groups', groupId), { rouletteHistory: newHistory });
        } catch (e) { console.error(e); }
    };

    const startEditHistory = (record: RouletteHistory) => {
        setEditingHistoryId(record.id);
        setNewHistoryWinner(record.winner);
        setNewHistoryParticipants('');
        const date = record.playedAt?.toDate?.() || new Date(record.playedAt);
        setNewHistoryDate(date.toISOString().slice(0, 16));
    };

    const resetHistoryForm = () => {
        setNewHistoryWinner('');
        setNewHistoryParticipants('');
        setNewHistoryDate('');
        setEditingHistoryId(null);
    };

    const saveHistory = async () => {
        if (!groupId) return;
        if (!newHistoryWinner.trim()) { alert('당첨자를 입력해주세요'); return; }

        const existingRecord = editingHistoryId ? rouletteHistory.find(h => h.id === editingHistoryId) : null;
        const participantEntries = newHistoryParticipants.split(',').map(p => p.trim()).filter(p => p.length > 0).map(p => {
            const [name, priceStr] = p.split(':').map(s => s.trim());
            return { name, price: parseInt(priceStr) || 0 };
        }).filter(p => p.name.length > 0);

        const keepOriginalData = editingHistoryId && participantEntries.length === 0 && existingRecord;
        if (!keepOriginalData && participantEntries.length === 0) { alert('참가자를 입력해주세요'); return; }

        let participants: string[], orderItems: any[], totalPrice: number;

        if (keepOriginalData) {
            participants = existingRecord.participants;
            orderItems = existingRecord.orderItems;
            totalPrice = existingRecord.totalPrice;
        } else {
            participants = participantEntries.map(p => p.name);
            if (!participants.includes(newHistoryWinner.trim())) participants.push(newHistoryWinner.trim());
            totalPrice = participantEntries.reduce((sum, p) => sum + p.price, 0);
            if (totalPrice <= 0) { alert('금액을 입력해주세요'); return; }
            orderItems = participantEntries.filter(p => p.price > 0).map(p => ({
                menuName: '수동 입력', option: 'ONLY' as const, price: p.price, count: 1, orderedBy: [p.name],
            }));
        }

        const playedAt = newHistoryDate ? new Date(newHistoryDate) : new Date();
        const newRecord: RouletteHistory = {
            id: editingHistoryId || `manual_${Date.now()}`,
            playedAt,
            winner: newHistoryWinner.trim(),
            participants,
            orderItems,
            totalPrice,
            paid: existingRecord?.paid ?? true,
        };

        try {
            let updatedHistory;
            if (editingHistoryId) updatedHistory = rouletteHistory.map(h => h.id === editingHistoryId ? newRecord : h);
            else updatedHistory = [...rouletteHistory, newRecord];

            await updateDoc(doc(db, 'groups', groupId), { rouletteHistory: updatedHistory });
            resetHistoryForm();
            alert(editingHistoryId ? '수정되었습니다' : '추가되었습니다');
        } catch (e) { console.error(e); }
    };

    const changeAdminPassword = async () => {
        if (!groupId) return;
        if (!newAdminPassword.trim() || newAdminPassword !== confirmAdminPassword || newAdminPassword.length < 4) {
            alert('비밀번호를 확인해주세요 (4자리 이상)'); return;
        }
        try {
            await updateDoc(doc(db, 'groups', groupId), { adminPassword: newAdminPassword });
            setNewAdminPassword(''); setConfirmAdminPassword('');
            alert('관리자 비밀번호가 변경되었습니다');
        } catch (e) { console.error(e); }
    };

    if (!isOpen) return null;

    const marbleUsers = Object.keys(marbleCounts);
    const sortedMarbleUsers = [...marbleUsers].sort((a, b) => {
        switch (marbleSortMode) {
            case 'name-asc': return a.localeCompare(b, 'ko');
            case 'name-desc': return b.localeCompare(a, 'ko');
            case 'count-asc': return (marbleCounts[a] ?? 0) - (marbleCounts[b] ?? 0);
            case 'count-desc': return (marbleCounts[b] ?? 0) - (marbleCounts[a] ?? 0);
            default: return 0;
        }
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="bg-surface w-full max-w-lg rounded-2xl shadow-2xl max-h-[85vh] flex flex-col relative z-10 animate-slide-up overflow-hidden">

                {/* Toast */}
                {toastMessage && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-xl shadow-lg animate-slide-up">
                        {toastMessage}
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white shrink-0">
                    <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                        <Settings size={20} className="text-primary" />
                        설정 (방장 전용)
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition"><X size={20} className="text-gray-400" /></button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 bg-background">
                    {!isAuthenticated ? (
                        <div className="flex flex-col items-center justify-center py-10">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                <Lock size={32} className="text-primary" />
                            </div>
                            <p className="text-text-primary font-bold mb-4">방장 비밀번호를 입력하세요</p>
                            <form onSubmit={handleLogin} className="w-full max-w-xs">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="비밀번호"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:outline-none mb-3"
                                    autoFocus
                                />
                                {error && <p className="text-red-500 text-sm mb-3 text-center">{error}</p>}
                                <button type="submit" className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition">확인</button>
                            </form>
                        </div>
                    ) : (
                        <>
                            {/* Tabs */}
                            <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
                                {[
                                    { id: 'approval', label: '승인', icon: Users, count: pendingUsers.length },
                                    { id: 'marble', label: '공', icon: Settings },
                                    { id: 'history', label: '기록', icon: History },
                                    { id: 'settings', label: '비밀번호', icon: Key }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${activeTab === tab.id ? 'bg-white shadow-sm text-primary' : 'text-text-secondary'
                                            }`}
                                    >
                                        <tab.icon size={14} />
                                        {tab.label}
                                        {tab.count !== undefined && tab.count > 0 && (
                                            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">{tab.count}</span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Tab Content */}
                            <div className="space-y-4">
                                {activeTab === 'approval' && (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="font-bold text-sm mb-2 text-amber-600 flex items-center gap-2">
                                                <span className="text-lg">⏳</span> 승인 대기 ({pendingUsers.length})
                                            </h3>
                                            {pendingUsers.length === 0 ? <p className="text-xs text-gray-400">대기자가 없습니다.</p> :
                                                pendingUsers.map(u => (
                                                    <div key={u} className="flex justify-between items-center bg-amber-50 p-3 rounded-xl mb-2 shadow-sm border border-amber-200">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm"
                                                                style={{ backgroundColor: getAvatarColor(u), color: getTextContrastColor() }}>
                                                                {u.slice(0, 2)}
                                                            </div>
                                                            <span className="font-bold text-sm text-text-primary">{u}</span>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button onClick={() => approveUser(u)} className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition shadow-sm" title="승인"><UserCheck size={18} /></button>
                                                            <button onClick={() => rejectUser(u)} className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition shadow-sm" title="거절"><UserX size={18} /></button>
                                                        </div>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm mb-2 text-green-600 flex items-center gap-2">
                                                <span className="text-lg">✓</span> 승인됨 ({approvedUsers.length})
                                            </h3>
                                            {approvedUsers.map(u => (
                                                <div key={u} className="flex justify-between items-center bg-white p-3 rounded-xl mb-2 shadow-sm border border-gray-100">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm"
                                                            style={{ backgroundColor: getAvatarColor(u), color: getTextContrastColor() }}>
                                                            {u.slice(0, 2)}
                                                        </div>
                                                        <span className="font-bold text-sm text-text-primary">{u}</span>
                                                    </div>
                                                    <button onClick={() => removeApprovedUser(u)} className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded-lg transition" title="승인 취소"><UserX size={18} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'marble' && (
                                    <div className="space-y-3">
                                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-2">
                                            <p className="text-xs text-amber-800">🎱 공 개수가 많을수록 룰렛 당첨(커피 사기) 확률이 높아져요 (최대 50개)</p>
                                        </div>
                                        {/* 정렬 Dropdown */}
                                        <div className="flex items-center justify-end mb-2">
                                            <div className="relative">
                                                <button
                                                    onClick={() => setMarbleSortOpen(prev => !prev)}
                                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition border bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200 hover:text-gray-800"
                                                >
                                                    정렬: {marbleSortMode === 'name-asc' ? '이름 ⬆️' : marbleSortMode === 'name-desc' ? '이름 ⬇️' : marbleSortMode === 'count-asc' ? '공 개수 ⬆️' : '공 개수 ⬇️'}
                                                    <ChevronDown size={14} className={`transition-transform ${marbleSortOpen ? 'rotate-180' : ''}`} />
                                                </button>
                                                {marbleSortOpen && (
                                                    <>
                                                        <div className="fixed inset-0 z-40" onClick={() => setMarbleSortOpen(false)} />
                                                        <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden w-full">
                                                            {[
                                                                { mode: 'name-asc' as MarbleSortMode, label: '이름 오름차순' },
                                                                { mode: 'name-desc' as MarbleSortMode, label: '이름 내림차순' },
                                                                { mode: 'count-asc' as MarbleSortMode, label: '공 개수 오름차순' },
                                                                { mode: 'count-desc' as MarbleSortMode, label: '공 개수 내림차순' },
                                                            ].map(opt => (
                                                                <button
                                                                    key={opt.mode}
                                                                    onClick={() => { setMarbleSortMode(opt.mode); setMarbleSortOpen(false); }}
                                                                    className={`w-full text-left px-3 py-2.5 text-xs font-medium transition whitespace-nowrap ${marbleSortMode === opt.mode
                                                                        ? 'bg-primary/10 text-primary font-bold'
                                                                        : 'text-text-primary hover:bg-gray-50'
                                                                        }`}
                                                                >
                                                                    {opt.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        {sortedMarbleUsers.length === 0 ? <div className="text-center py-8 text-gray-400">사용자가 없습니다</div> :
                                            sortedMarbleUsers.map(u => {
                                                const count = marbleCounts[u] ?? 0;
                                                const inputVal = marbleInputValues[u] ?? String(count);
                                                return (
                                                    <div key={u} className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shadow-inner shrink-0"
                                                                style={{ backgroundColor: getAvatarColor(u), color: getTextContrastColor() }}>
                                                                {u.slice(0, 3)}
                                                            </div>
                                                            <span className="font-bold text-sm text-text-primary">{u}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button onClick={() => updateMarbleCount(u, count - 1)} disabled={count <= 0} className="w-9 h-9 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-30 transition"><Minus size={18} /></button>
                                                            <div className="w-20 text-center">
                                                                <span className="text-lg font-bold text-primary">🎱</span>
                                                                <input
                                                                    type="number"
                                                                    min={0}
                                                                    max={50}
                                                                    data-marble-user={u}
                                                                    value={inputVal}
                                                                    onChange={(e) => {
                                                                        const raw = e.target.value;
                                                                        setMarbleInputValues(prev => ({ ...prev, [u]: raw }));
                                                                        const val = parseInt(raw);
                                                                        if (!isNaN(val)) updateMarbleCount(u, val);
                                                                    }}
                                                                    onBlur={(e) => {
                                                                        const raw = e.target.value.trim();
                                                                        if (raw === '') {
                                                                            showToast('공 개수를 입력하세요!');
                                                                            updateMarbleCount(u, 0);
                                                                            setMarbleInputValues(prev => ({ ...prev, [u]: '0' }));
                                                                        } else {
                                                                            const val = parseInt(raw);
                                                                            const clamped = isNaN(val) ? 0 : Math.max(0, Math.min(50, val));
                                                                            updateMarbleCount(u, clamped);
                                                                            setMarbleInputValues(prev => ({ ...prev, [u]: String(clamped) }));
                                                                        }
                                                                    }}
                                                                    className="w-10 text-center text-xl font-bold text-primary bg-transparent border-b-2 border-primary/30 focus:border-primary focus:outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                                />
                                                            </div>
                                                            <button onClick={() => updateMarbleCount(u, count + 1)} disabled={count >= 50} className="w-9 h-9 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-30 transition"><Plus size={18} /></button>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        }
                                        <button onClick={resetAllCounts} className="w-full py-3 mt-4 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-gray-600 text-sm transition"><RotateCcw size={16} /> 전체 초기화 (모두 1개로)</button>
                                    </div>
                                )}

                                {activeTab === 'history' && (
                                    <div className="space-y-4">
                                        <div className={`bg-white p-4 rounded-xl shadow-sm border ${editingHistoryId ? 'border-amber-400 ring-1 ring-amber-400' : 'border-gray-200'}`}>
                                            <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-text-primary">
                                                {editingHistoryId ? <><Pencil size={16} className="text-amber-500" />기록 수정</> : <><PlusCircle size={16} className="text-primary" />기록 추가</>}
                                                {editingHistoryId && <button onClick={resetHistoryForm} className="ml-auto text-xs text-gray-400 underline">취소</button>}
                                            </h3>
                                            <div className="space-y-3">
                                                <input type="text" placeholder="당첨자 (커피 산 사람)" value={newHistoryWinner} onChange={e => setNewHistoryWinner(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-primary focus:outline-none" />
                                                <textarea placeholder={editingHistoryId ? "비워두면 기존 메뉴 유지" : "참가자:금액 (예: 홍길동:4500, 김철수:5000)"} value={newHistoryParticipants} onChange={e => setNewHistoryParticipants(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm h-20 focus:border-primary focus:outline-none" />
                                                <input type="datetime-local" value={newHistoryDate} onChange={e => setNewHistoryDate(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-primary focus:outline-none" />
                                                <button onClick={saveHistory} className={`w-full py-2.5 text-white rounded-lg font-bold text-sm transition ${editingHistoryId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary hover:bg-primary-dark'}`}>
                                                    {editingHistoryId ? '수정 완료' : '추가하기'}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <h3 className="font-bold text-text-primary text-sm flex items-center gap-2 mb-2"><History size={16} /> 최근 기록 ({rouletteHistory.length})</h3>
                                            {rouletteHistory.sort((a, b) => (b.playedAt?.toDate ? b.playedAt.toDate() : new Date(b.playedAt)).getTime() - (a.playedAt?.toDate ? a.playedAt.toDate() : new Date(a.playedAt)).getTime()).map(h => {
                                                const date = h.playedAt?.toDate ? h.playedAt.toDate() : new Date(h.playedAt);
                                                const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
                                                return (
                                                    <div key={h.id} className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-sm" style={{ backgroundColor: getAvatarColor(h.winner), color: getTextContrastColor() }}>
                                                                {h.winner.slice(0, 2)}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-sm text-text-primary">{h.winner} <span className="font-normal text-text-secondary">당첨</span></p>
                                                                <p className="text-xs text-text-secondary">{dateStr}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-bold text-primary">{h.totalPrice.toLocaleString()}원</span>
                                                            <button onClick={() => startEditHistory(h)} className="p-1.5 text-text-secondary hover:text-amber-500 hover:bg-amber-50 rounded-lg transition"><Pencil size={16} /></button>
                                                            <button onClick={() => deleteHistory(h.id)} className="p-1.5 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 size={16} /></button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'settings' && (
                                    <div className="space-y-6">
                                        <div className="bg-surface rounded-xl p-4 shadow-sm border border-gray-100">
                                            <h3 className="font-bold text-text-primary flex items-center gap-2 mb-4">
                                                <Key size={18} className="text-primary" /> 설정(방장 전용) 비밀번호 변경
                                            </h3>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="text-xs text-text-secondary mb-1 block">새 비밀번호</label>
                                                    <input type="password" placeholder="4자리 이상 입력" value={newAdminPassword} onChange={e => setNewAdminPassword(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-primary focus:outline-none" />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-text-secondary mb-1 block">비밀번호 확인</label>
                                                    <input type="password" placeholder="한 번 더 입력" value={confirmAdminPassword} onChange={e => setConfirmAdminPassword(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-primary focus:outline-none" />
                                                </div>
                                                <button onClick={changeAdminPassword} disabled={!newAdminPassword || !confirmAdminPassword} className="w-full py-2.5 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary-dark transition disabled:bg-gray-300">변경하기</button>
                                            </div>
                                        </div>
                                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                            <p className="text-sm text-blue-800 leading-relaxed">
                                                💡 <b>Tip:</b> 설정(방장 전용) 비밀번호는 방 입장 비밀번호와 다르게 설정할 수 있습니다. 설정하지 않으면 입장 비밀번호로 방 설정 기능을 사용할 수 있습니다.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;