import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    sendGlobalNotice,
    fetchSystemStats,
    fetchOldGroups,
    fetchAllGroups,
    deleteGroup,
    SystemStats,
    GroupInfo,
} from '../features/admin/api/adminApi';
import Toast from '../shared/ui/Toast';
import { ToastMessage } from '../shared/types';
import {
    Megaphone,
    BarChart3,
    Trash2,
    Send,
    RefreshCw,
    ArrowLeft,
    Users,
    ShoppingBag,
    Layers,
    Activity,
    AlertTriangle,
    Calendar,
    Clock,
    Loader2,
} from 'lucide-react';

type TabType = 'notice' | 'stats' | 'cleanup';

const AdminPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabType>('notice');
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    // ─── 공지사항 탭 상태 ───
    const [noticeMessage, setNoticeMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    // ─── 통계 탭 상태 ───
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [isLoadingStats, setIsLoadingStats] = useState(false);

    // ─── 방 청소 탭 상태 ───
    const [oldGroups, setOldGroups] = useState<GroupInfo[]>([]);
    const [allGroups, setAllGroups] = useState<GroupInfo[]>([]);
    const [isLoadingGroups, setIsLoadingGroups] = useState(false);
    const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

    const addToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
        const id = `toast-${Date.now()}-${Math.random()}`;
        setToasts((prev) => [...prev, { id, message, type }]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    // ─── 통계 로드 ───
    const loadStats = useCallback(async () => {
        setIsLoadingStats(true);
        try {
            const result = await fetchSystemStats();
            setStats(result);
        } catch (err) {
            console.error('통계 로드 실패:', err);
            addToast('통계를 불러오는데 실패했습니다.', 'warning');
        } finally {
            setIsLoadingStats(false);
        }
    }, [addToast]);

    // ─── 방 청소 목록 로드 ───
    const loadOldGroups = useCallback(async () => {
        setIsLoadingGroups(true);
        try {
            const [old, all] = await Promise.all([fetchOldGroups(), fetchAllGroups()]);
            setOldGroups(old);
            setAllGroups(all);
        } catch (err) {
            console.error('그룹 목록 로드 실패:', err);
            addToast('그룹 목록을 불러오는데 실패했습니다.', 'warning');
        } finally {
            setIsLoadingGroups(false);
        }
    }, [addToast]);

    // 탭 변경 시 데이터 로드
    useEffect(() => {
        if (activeTab === 'stats') {
            loadStats();
        } else if (activeTab === 'cleanup') {
            loadOldGroups();
        }
    }, [activeTab, loadStats, loadOldGroups]);

    // ─── 공지 전송 핸들러 ───
    const handleSendNotice = async () => {
        if (!noticeMessage.trim()) {
            addToast('공지 내용을 입력해주세요.', 'warning');
            return;
        }
        setIsSending(true);
        try {
            await sendGlobalNotice(noticeMessage.trim());
            addToast('긴급 공지가 전송되었습니다!', 'success');
            setNoticeMessage('');
        } catch (err) {
            console.error('공지 전송 실패:', err);
            addToast('공지 전송에 실패했습니다.', 'warning');
        } finally {
            setIsSending(false);
        }
    };

    // ─── 그룹 삭제 핸들러 ───
    const handleDeleteGroup = async (groupId: string) => {
        if (!confirm(`정말 "${groupId}" 그룹을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return;

        setDeletingIds((prev) => new Set(prev).add(groupId));
        try {
            await deleteGroup(groupId);
            setOldGroups((prev) => prev.filter((g) => g.id !== groupId));
            setAllGroups((prev) => prev.filter((g) => g.id !== groupId));
            addToast(`"${groupId}" 그룹이 삭제되었습니다.`, 'success');
        } catch (err) {
            console.error('그룹 삭제 실패:', err);
            addToast('그룹 삭제에 실패했습니다.', 'warning');
        } finally {
            setDeletingIds((prev) => {
                const next = new Set(prev);
                next.delete(groupId);
                return next;
            });
        }
    };

    // ─── 7일 이상 된 그룹 일괄 삭제 ───
    const handleDeleteAllOld = async () => {
        if (oldGroups.length === 0) {
            addToast('삭제할 그룹이 없습니다.', 'warning');
            return;
        }
        if (!confirm(`7일 이상 된 ${oldGroups.length}개의 그룹을 모두 삭제하시겠습니까?`)) return;

        for (const group of oldGroups) {
            setDeletingIds((prev) => new Set(prev).add(group.id));
            try {
                await deleteGroup(group.id);
            } catch (err) {
                console.error(`그룹 ${group.id} 삭제 실패:`, err);
            }
        }
        addToast(`${oldGroups.length}개 그룹이 삭제되었습니다.`, 'success');
        await loadOldGroups();
        setDeletingIds(new Set());
    };

    // ─── 날짜 포맷 헬퍼 ───
    const formatDate = (createdAt: any): string => {
        if (!createdAt) return '알 수 없음';

        let date: Date;
        if (createdAt.toDate) {
            date = createdAt.toDate();
        } else if (createdAt.seconds) {
            date = new Date(createdAt.seconds * 1000);
        } else if (createdAt instanceof Date) {
            date = createdAt;
        } else if (typeof createdAt === 'string') {
            date = new Date(createdAt);
        } else {
            return '알 수 없음';
        }

        return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
    };

    // ─── 경과일 계산 ───
    const getDaysAgo = (createdAt: any): number => {
        if (!createdAt) return 0;

        let date: Date;
        if (createdAt.toDate) {
            date = createdAt.toDate();
        } else if (createdAt.seconds) {
            date = new Date(createdAt.seconds * 1000);
        } else if (createdAt instanceof Date) {
            date = createdAt;
        } else {
            return 0;
        }

        return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    };

    // ─── 금액 포맷 ───
    const formatPrice = (price: number): string => {
        return price.toLocaleString('ko-KR');
    };

    // ─── 탭 정의 ───
    const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
        { key: 'notice', label: '공지사항', icon: <Megaphone size={18} /> },
        { key: 'stats', label: '시스템 통계', icon: <BarChart3 size={18} /> },
        { key: 'cleanup', label: '방 청소', icon: <Trash2 size={18} /> },
    ];

    return (
        <div className="min-h-screen bg-background">
            <Toast toasts={toasts} removeToast={removeToast} />

            {/* ─── 헤더 ─── */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/')}
                                className="p-2 rounded-xl hover:bg-gray-100 transition text-text-secondary"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <h1 className="text-lg font-bold text-text-primary">슈퍼관리자</h1>
                                <p className="text-xs text-text-secondary">시스템 관리 대시보드</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-text-secondary bg-gray-50 px-3 py-1.5 rounded-full">
                            <Activity size={14} className="text-secondary" />
                            <span>관리자 모드</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* ─── 탭 네비게이션 ─── */}
            <div className="bg-white border-b border-gray-100 sticky top-16 z-30">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex gap-1 py-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === tab.key
                                        ? 'bg-primary text-white shadow-md shadow-primary/20'
                                        : 'text-text-secondary hover:bg-gray-100 hover:text-text-primary'
                                    }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ─── 탭 컨텐츠 ─── */}
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* ===== 공지사항 탭 ===== */}
                {activeTab === 'notice' && (
                    <div className="animate-fade-in-up">
                        <div className="bg-white rounded-2xl shadow-toss p-6 mb-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                                    <Megaphone size={22} className="text-amber-500" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-text-primary">긴급 공지 전송</h2>
                                    <p className="text-sm text-text-secondary">
                                        전송하면 현재 접속 중인 모든 그룹에 즉시 표시됩니다.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="relative">
                                    <textarea
                                        value={noticeMessage}
                                        onChange={(e) => setNoticeMessage(e.target.value)}
                                        placeholder="공지 내용을 입력하세요..."
                                        className="w-full p-4 bg-background rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition resize-none text-text-primary placeholder:text-text-secondary/50"
                                        rows={4}
                                        maxLength={200}
                                    />
                                    <span className="absolute bottom-3 right-3 text-xs text-text-secondary">
                                        {noticeMessage.length}/200
                                    </span>
                                </div>

                                <button
                                    onClick={handleSendNotice}
                                    disabled={isSending || !noticeMessage.trim()}
                                    className="w-full bg-primary text-white py-4 rounded-xl font-bold text-base hover:bg-primary-dark transition flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md shadow-primary/20"
                                >
                                    {isSending ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin" />
                                            전송 중...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={20} />
                                            긴급 공지 전송
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* 안내 카드 */}
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                            <div className="flex items-start gap-3">
                                <AlertTriangle size={20} className="text-amber-500 mt-0.5 shrink-0" />
                                <div>
                                    <h3 className="font-bold text-amber-800 text-sm mb-1">사용 시 주의사항</h3>
                                    <ul className="text-sm text-amber-700 space-y-1">
                                        <li>• 전송된 공지는 현재 접속 중인 모든 사용자에게 표시됩니다.</li>
                                        <li>• 공지는 Toast 형태로 약 3초간 표시 후 사라집니다.</li>
                                        <li>• 접속하지 않은 사용자에게는 표시되지 않습니다.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ===== 전체 시스템 통계 탭 ===== */}
                {activeTab === 'stats' && (
                    <div className="animate-fade-in-up">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                                    <BarChart3 size={22} className="text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-text-primary">전체 시스템 통계</h2>
                                    <p className="text-sm text-text-secondary">실시간 현황 대시보드</p>
                                </div>
                            </div>
                            <button
                                onClick={loadStats}
                                disabled={isLoadingStats}
                                className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200 text-sm font-medium text-text-secondary hover:bg-gray-50 transition disabled:opacity-50"
                            >
                                <RefreshCw size={16} className={isLoadingStats ? 'animate-spin' : ''} />
                                새로고침
                            </button>
                        </div>

                        {isLoadingStats && !stats ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 size={32} className="animate-spin text-primary" />
                            </div>
                        ) : stats ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* 총 그룹 수 */}
                                <div className="bg-white rounded-2xl shadow-toss p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                                            <Layers size={24} className="text-primary" />
                                        </div>
                                        <span className="text-xs font-medium text-text-secondary bg-blue-50 px-2 py-1 rounded-full">
                                            전체
                                        </span>
                                    </div>
                                    <p className="text-3xl font-extrabold text-text-primary mb-1">
                                        {stats.totalGroups}
                                        <span className="text-lg font-normal text-text-secondary ml-1">개</span>
                                    </p>
                                    <p className="text-sm text-text-secondary">생성된 총 그룹 수</p>
                                </div>

                                {/* 활성 그룹 */}
                                <div className="bg-white rounded-2xl shadow-toss p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                                            <Activity size={24} className="text-secondary" />
                                        </div>
                                        <span className="text-xs font-medium text-text-secondary bg-green-50 px-2 py-1 rounded-full">
                                            활성
                                        </span>
                                    </div>
                                    <p className="text-3xl font-extrabold text-text-primary mb-1">
                                        {stats.activeGroups}
                                        <span className="text-lg font-normal text-text-secondary ml-1">개</span>
                                    </p>
                                    <p className="text-sm text-text-secondary">장바구니에 아이템이 있는 그룹</p>
                                </div>

                                {/* 전체 참여자 */}
                                <div className="bg-white rounded-2xl shadow-toss p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                                            <Users size={24} className="text-purple-500" />
                                        </div>
                                        <span className="text-xs font-medium text-text-secondary bg-purple-50 px-2 py-1 rounded-full">
                                            참여자
                                        </span>
                                    </div>
                                    <p className="text-3xl font-extrabold text-text-primary mb-1">
                                        {stats.totalParticipants}
                                        <span className="text-lg font-normal text-text-secondary ml-1">명</span>
                                    </p>
                                    <p className="text-sm text-text-secondary">전체 승인된 사용자 수</p>
                                </div>

                                {/* 오늘 주문 금액 */}
                                <div className="bg-white rounded-2xl shadow-toss p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                                            <ShoppingBag size={24} className="text-amber-500" />
                                        </div>
                                        <span className="text-xs font-medium text-text-secondary bg-amber-50 px-2 py-1 rounded-full">
                                            오늘
                                        </span>
                                    </div>
                                    <p className="text-3xl font-extrabold text-text-primary mb-1">
                                        {formatPrice(stats.todayTotalOrderAmount)}
                                        <span className="text-lg font-normal text-text-secondary ml-1">원</span>
                                    </p>
                                    <p className="text-sm text-text-secondary">오늘 하루 전체 주문 금액</p>
                                </div>
                            </div>
                        ) : null}
                    </div>
                )}

                {/* ===== 방 청소 탭 ===== */}
                {activeTab === 'cleanup' && (
                    <div className="animate-fade-in-up">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                                    <Trash2 size={22} className="text-danger" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-text-primary">방 청소</h2>
                                    <p className="text-sm text-text-secondary">
                                        생성 후 7일이 지난 그룹을 정리합니다
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={loadOldGroups}
                                disabled={isLoadingGroups}
                                className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200 text-sm font-medium text-text-secondary hover:bg-gray-50 transition disabled:opacity-50"
                            >
                                <RefreshCw size={16} className={isLoadingGroups ? 'animate-spin' : ''} />
                                새로고침
                            </button>
                        </div>

                        {/* 요약 카드 */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-white rounded-2xl shadow-toss p-5">
                                <p className="text-sm text-text-secondary mb-1">전체 그룹</p>
                                <p className="text-2xl font-extrabold text-text-primary">{allGroups.length}개</p>
                            </div>
                            <div className="bg-white rounded-2xl shadow-toss p-5">
                                <p className="text-sm text-text-secondary mb-1">7일 이상 경과</p>
                                <p className="text-2xl font-extrabold text-danger">{oldGroups.length}개</p>
                            </div>
                        </div>

                        {isLoadingGroups ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 size={32} className="animate-spin text-primary" />
                            </div>
                        ) : oldGroups.length === 0 ? (
                            <div className="bg-white rounded-2xl shadow-toss p-10 text-center">
                                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Trash2 size={28} className="text-secondary" />
                                </div>
                                <h3 className="font-bold text-text-primary mb-2">청소 완료!</h3>
                                <p className="text-sm text-text-secondary">7일 이상 된 그룹이 없습니다.</p>
                            </div>
                        ) : (
                            <>
                                {/* 일괄 삭제 버튼 */}
                                <button
                                    onClick={handleDeleteAllOld}
                                    className="w-full mb-4 bg-danger text-white py-3 rounded-xl font-bold text-sm hover:bg-red-600 transition flex items-center justify-center gap-2 shadow-md"
                                >
                                    <Trash2 size={18} />
                                    7일 이상 된 그룹 일괄 삭제 ({oldGroups.length}개)
                                </button>

                                {/* 그룹 리스트 */}
                                <div className="space-y-3">
                                    {oldGroups.map((group) => (
                                        <div
                                            key={group.id}
                                            className="bg-white rounded-2xl shadow-toss p-5 flex items-center justify-between"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="font-bold text-text-primary truncate">{group.id}</h3>
                                                    <span className="shrink-0 px-2 py-0.5 bg-red-50 text-danger text-xs font-medium rounded-full flex items-center gap-1">
                                                        <Clock size={12} />
                                                        {getDaysAgo(group.data.createdAt)}일 전
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 text-xs text-text-secondary">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={12} />
                                                        {formatDate(group.data.createdAt)}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Users size={12} />
                                                        {group.data.approvedUsers?.length || 0}명
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <ShoppingBag size={12} />
                                                        {group.data.cart?.length || 0}개
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteGroup(group.id)}
                                                disabled={deletingIds.has(group.id)}
                                                className="shrink-0 ml-4 px-4 py-2 bg-red-50 text-danger rounded-xl text-sm font-medium hover:bg-red-100 transition disabled:opacity-50 flex items-center gap-1"
                                            >
                                                {deletingIds.has(group.id) ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : (
                                                    <Trash2 size={16} />
                                                )}
                                                삭제
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminPage;
