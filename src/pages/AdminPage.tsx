import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '../features/admin/store/useAdminStore';
import AdminMenuManager from '../features/admin/ui/AdminMenuManager';
import Toast from '../shared/ui/Toast';
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
    Shield,
    Lock,
    Eye,
    EyeOff,
    KeyRound,
    LogOut,
    ChevronDown,
    ChevronUp,
    X,
    Coffee,
} from 'lucide-react';

type TabType = 'notice' | 'stats' | 'cleanup' | 'menu';

const AdminPage = () => {
    const navigate = useNavigate();
    const store = useAdminStore();

    // ─── 세션 체크 ───
    useEffect(() => {
        store.checkSession();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ─── 탭 변경 시 데이터 로드 ───
    useEffect(() => {
        if (!store.isAuthenticated) return;
        if (store.activeTab === 'stats') {
            store.loadStats();
        } else if (store.activeTab === 'cleanup') {
            store.loadOldGroups();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [store.activeTab, store.isAuthenticated]);

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
        { key: 'menu', label: '메뉴 관리', icon: <Coffee size={18} /> },
    ];

    // ─── 세션 체크 중 로딩 ───
    if (store.isCheckingAuth) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-primary" />
            </div>
        );
    }

    // ═══════════════════════════════════════════
    // ─── 로그인 게이트 (미인증 상태) ───
    // ═══════════════════════════════════════════
    if (!store.isAuthenticated) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Toast toasts={store.toasts} removeToast={store.removeToast} />

                <div className="w-full max-w-sm">
                    {/* 로고 영역 */}
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-white rounded-2xl shadow-toss flex items-center justify-center mx-auto mb-4">
                            <Shield size={40} className="text-primary" />
                        </div>
                        <h1 className="text-2xl font-extrabold text-text-primary mb-1">슈퍼관리자</h1>
                        <p className="text-sm text-text-secondary">관리자 비밀번호를 입력해주세요</p>
                    </div>

                    {/* 로그인 카드 */}
                    <div className="bg-white rounded-2xl shadow-toss p-6">
                        <form onSubmit={store.handleLogin} className="space-y-4">
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type={store.showPassword ? 'text' : 'password'}
                                    value={store.passwordInput}
                                    onChange={(e) => store.setPasswordInput(e.target.value)}
                                    placeholder="비밀번호 입력"
                                    className={`w-full pl-11 pr-11 py-4 bg-background rounded-xl focus:outline-none focus:ring-2 transition text-text-primary ${store.loginError ? 'ring-2 ring-danger/50' : 'focus:ring-primary/50'
                                        }`}
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => store.setShowPassword(!store.showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition"
                                >
                                    {store.showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            {store.loginError && (
                                <p className="text-xs text-danger flex items-center gap-1 ml-1">
                                    <AlertTriangle size={12} />
                                    {store.loginError}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={store.isLoggingIn || !store.passwordInput.trim()}
                                className="w-full bg-primary text-white py-4 rounded-xl font-bold text-base hover:bg-primary-dark transition flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md shadow-primary/20"
                            >
                                {store.isLoggingIn ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        확인 중...
                                    </>
                                ) : (
                                    <>
                                        <KeyRound size={20} />
                                        입장하기
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* 안내 텍스트 */}
                    <p className="text-center text-xs text-text-secondary mt-4">
                        초기 비밀번호는 <span className="font-bold text-primary">0000</span> 입니다
                    </p>

                    <button
                        onClick={() => navigate('/')}
                        className="block mx-auto mt-4 text-sm text-text-secondary underline hover:text-text-primary transition"
                    >
                        메인으로 돌아가기
                    </button>
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════
    // ─── 대시보드 (인증 완료 후) ───
    // ═══════════════════════════════════════════
    return (
        <div className="min-h-screen bg-background">
            <Toast toasts={store.toasts} removeToast={store.removeToast} />

            {/* ─── 비밀번호 변경 모달 ─── */}
            {store.showPasswordChange && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm animate-fade-in-up">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                <KeyRound size={22} className="text-primary" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-text-primary">비밀번호 변경</h2>
                                <p className="text-xs text-text-secondary">슈퍼관리자 비밀번호를 변경합니다</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <input
                                type="password"
                                placeholder="현재 비밀번호"
                                value={store.currentPwInput}
                                onChange={(e) => store.setCurrentPwInput(e.target.value)}
                                className="w-full p-3 bg-background rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition text-sm"
                            />
                            <input
                                type="password"
                                placeholder="새 비밀번호 (4자리 이상)"
                                value={store.newPwInput}
                                onChange={(e) => store.setNewPwInput(e.target.value)}
                                className="w-full p-3 bg-background rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition text-sm"
                            />
                            <input
                                type="password"
                                placeholder="새 비밀번호 확인"
                                value={store.newPwConfirm}
                                onChange={(e) => store.setNewPwConfirm(e.target.value)}
                                className="w-full p-3 bg-background rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition text-sm"
                            />
                        </div>

                        <div className="flex gap-2 mt-6">
                            <button
                                onClick={store.resetPasswordChangeForm}
                                className="flex-1 py-3 rounded-xl border border-gray-200 text-text-secondary font-medium text-sm hover:bg-gray-50 transition"
                            >
                                취소
                            </button>
                            <button
                                onClick={store.handleChangePassword}
                                disabled={store.isChangingPw}
                                className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-dark transition disabled:bg-gray-300 flex items-center justify-center gap-1"
                            >
                                {store.isChangingPw ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    '변경하기'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => store.setShowPasswordChange(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-gray-100 rounded-full transition"
                                title="비밀번호 변경"
                            >
                                <KeyRound size={14} />
                                비밀번호 변경
                            </button>
                            <button
                                onClick={store.handleLogout}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-danger bg-red-50 hover:bg-red-100 rounded-full transition"
                                title="로그아웃"
                            >
                                <LogOut size={14} />
                                로그아웃

                            </button>
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
                                onClick={() => store.setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${store.activeTab === tab.key
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
                {store.activeTab === 'notice' && (
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
                                        value={store.noticeMessage}
                                        onChange={(e) => store.setNoticeMessage(e.target.value)}
                                        placeholder="공지 내용을 입력하세요..."
                                        className="w-full p-4 bg-background rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition resize-none text-text-primary placeholder:text-text-secondary/50"
                                        rows={4}
                                        maxLength={200}
                                    />
                                    <span className="absolute bottom-3 right-3 text-xs text-text-secondary">
                                        {store.noticeMessage.length}/200
                                    </span>
                                </div>

                                <button
                                    onClick={store.handleSendNotice}
                                    disabled={store.isSending || !store.noticeMessage.trim()}
                                    className="w-full bg-primary text-white py-4 rounded-xl font-bold text-base hover:bg-primary-dark transition flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md shadow-primary/20"
                                >
                                    {store.isSending ? (
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
                {store.activeTab === 'stats' && (
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
                                onClick={store.loadStats}
                                disabled={store.isLoadingStats}
                                className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200 text-sm font-medium text-text-secondary hover:bg-gray-50 transition disabled:opacity-50"
                            >
                                <RefreshCw size={16} className={store.isLoadingStats ? 'animate-spin' : ''} />
                                새로고침
                            </button>
                        </div>

                        {store.isLoadingStats && !store.stats ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 size={32} className="animate-spin text-primary" />
                            </div>
                        ) : store.stats ? (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* 총 그룹 수 (클릭 가능) */}
                                    <div
                                        onClick={() => store.setExpandedStatCard(store.expandedStatCard === 'all' ? null : 'all')}
                                        className={`bg-white rounded-2xl shadow-toss p-6 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 ${store.expandedStatCard === 'all' ? 'ring-2 ring-primary/40' : ''}`}
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                                                <Layers size={24} className="text-primary" />
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-xs font-medium text-text-secondary bg-blue-50 px-2 py-1 rounded-full">
                                                    전체
                                                </span>
                                                {store.expandedStatCard === 'all' ? (
                                                    <ChevronUp size={16} className="text-primary" />
                                                ) : (
                                                    <ChevronDown size={16} className="text-text-secondary" />
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-3xl font-extrabold text-text-primary mb-1">
                                            {store.stats.totalGroups}
                                            <span className="text-lg font-normal text-text-secondary ml-1">개</span>
                                        </p>
                                        <p className="text-sm text-text-secondary">생성된 총 그룹 수</p>
                                        <p className="text-xs text-primary mt-2">클릭하여 목록 보기</p>
                                    </div>

                                    {/* 활성 그룹 (클릭 가능) */}
                                    <div
                                        onClick={() => store.setExpandedStatCard(store.expandedStatCard === 'active' ? null : 'active')}
                                        className={`bg-white rounded-2xl shadow-toss p-6 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 ${store.expandedStatCard === 'active' ? 'ring-2 ring-secondary/40' : ''}`}
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                                                <Activity size={24} className="text-secondary" />
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-xs font-medium text-text-secondary bg-green-50 px-2 py-1 rounded-full">
                                                    활성
                                                </span>
                                                {store.expandedStatCard === 'active' ? (
                                                    <ChevronUp size={16} className="text-secondary" />
                                                ) : (
                                                    <ChevronDown size={16} className="text-text-secondary" />
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-3xl font-extrabold text-text-primary mb-1">
                                            {store.stats.activeGroups}
                                            <span className="text-lg font-normal text-text-secondary ml-1">개</span>
                                        </p>
                                        <p className="text-sm text-text-secondary">장바구니에 아이템이 있는 그룹</p>
                                        <p className="text-xs text-secondary mt-2">클릭하여 목록 보기</p>
                                    </div>

                                    {/* 전체 참여자 (클릭 가능) */}
                                    <div
                                        onClick={() => store.setExpandedStatCard(store.expandedStatCard === 'participants' ? null : 'participants')}
                                        className={`bg-white rounded-2xl shadow-toss p-6 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 ${store.expandedStatCard === 'participants' ? 'ring-2 ring-purple-400/40' : ''}`}
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                                                <Users size={24} className="text-purple-500" />
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-xs font-medium text-text-secondary bg-purple-50 px-2 py-1 rounded-full">
                                                    참여자
                                                </span>
                                                {store.expandedStatCard === 'participants' ? (
                                                    <ChevronUp size={16} className="text-purple-500" />
                                                ) : (
                                                    <ChevronDown size={16} className="text-text-secondary" />
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-3xl font-extrabold text-text-primary mb-1">
                                            {store.stats.totalParticipants}
                                            <span className="text-lg font-normal text-text-secondary ml-1">명</span>
                                        </p>
                                        <p className="text-sm text-text-secondary">전체 승인된 사용자 수</p>
                                        <p className="text-xs text-purple-500 mt-2">클릭하여 목록 보기</p>
                                    </div>

                                    {/* 오늘 주문 금액 (클릭 가능) */}
                                    <div
                                        onClick={() => store.setExpandedStatCard(store.expandedStatCard === 'orders' ? null : 'orders')}
                                        className={`bg-white rounded-2xl shadow-toss p-6 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 ${store.expandedStatCard === 'orders' ? 'ring-2 ring-amber-400/40' : ''}`}
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                                                <ShoppingBag size={24} className="text-amber-500" />
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-xs font-medium text-text-secondary bg-amber-50 px-2 py-1 rounded-full">
                                                    오늘
                                                </span>
                                                {store.expandedStatCard === 'orders' ? (
                                                    <ChevronUp size={16} className="text-amber-500" />
                                                ) : (
                                                    <ChevronDown size={16} className="text-text-secondary" />
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-3xl font-extrabold text-text-primary mb-1">
                                            {formatPrice(store.stats.todayTotalOrderAmount)}
                                            <span className="text-lg font-normal text-text-secondary ml-1">원</span>
                                        </p>
                                        <p className="text-sm text-text-secondary">오늘 하루 전체 주문 금액</p>
                                        <p className="text-xs text-amber-500 mt-2">클릭하여 그룹별 금액 보기</p>
                                    </div>
                                </div>

                                {/* ─── 확장된 목록 ─── */}
                                {store.expandedStatCard && (
                                    <div className="mt-6 animate-fade-in-up">
                                        <div className="bg-white rounded-2xl shadow-toss overflow-hidden">
                                            {/* 목록 헤더 */}
                                            <div className={`px-5 py-4 flex items-center justify-between border-b border-gray-100 ${store.expandedStatCard === 'all' ? 'bg-blue-50' :
                                                store.expandedStatCard === 'active' ? 'bg-green-50' :
                                                    store.expandedStatCard === 'participants' ? 'bg-purple-50' :
                                                        'bg-amber-50'
                                                }`}>
                                                <div className="flex items-center gap-2">
                                                    {store.expandedStatCard === 'all' ? (
                                                        <Layers size={18} className="text-primary" />
                                                    ) : store.expandedStatCard === 'active' ? (
                                                        <Activity size={18} className="text-secondary" />
                                                    ) : store.expandedStatCard === 'participants' ? (
                                                        <Users size={18} className="text-purple-500" />
                                                    ) : (
                                                        <ShoppingBag size={18} className="text-amber-500" />
                                                    )}
                                                    <h3 className="font-bold text-text-primary text-sm">
                                                        {store.expandedStatCard === 'all' ? '전체 그룹 목록' :
                                                            store.expandedStatCard === 'active' ? '활성 그룹 목록' :
                                                                store.expandedStatCard === 'participants' ? '그룹별 승인된 사용자' :
                                                                    '그룹별 오늘 주문 금액'}
                                                    </h3>
                                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${store.expandedStatCard === 'all' ? 'bg-primary/10 text-primary' :
                                                        store.expandedStatCard === 'active' ? 'bg-secondary/10 text-secondary' :
                                                            store.expandedStatCard === 'participants' ? 'bg-purple-100 text-purple-600' :
                                                                'bg-amber-100 text-amber-600'
                                                        }`}>
                                                        {store.expandedStatCard === 'all' ? `${store.stats.allGroupsList.length}개` :
                                                            store.expandedStatCard === 'active' ? `${store.stats.activeGroupsList.length}개` :
                                                                store.expandedStatCard === 'participants' ? `${store.stats.participantsGroupsList.length}개 그룹` :
                                                                    `${store.stats.todayOrderGroupsList.length}개 그룹`}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => store.setExpandedStatCard(null)}
                                                    className="p-1.5 rounded-lg hover:bg-gray-200 transition text-text-secondary"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>

                                            {/* 목록 내용 */}
                                            {(() => {
                                                // 오늘 주문 금액 탭
                                                if (store.expandedStatCard === 'orders') {
                                                    if (store.stats.todayOrderGroupsList.length === 0) {
                                                        return (
                                                            <div className="py-10 text-center">
                                                                <p className="text-sm text-text-secondary">오늘 주문이 없습니다.</p>
                                                            </div>
                                                        );
                                                    }
                                                    return (
                                                        <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
                                                            {store.stats.todayOrderGroupsList
                                                                .sort((a, b) => b.todayAmount - a.todayAmount)
                                                                .map((group) => (
                                                                    <div
                                                                        key={group.id}
                                                                        className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition"
                                                                    >
                                                                        <div className="flex-1 min-w-0">
                                                                            <h4 className="font-bold text-text-primary text-sm truncate">
                                                                                {group.id}
                                                                            </h4>
                                                                        </div>
                                                                        <span className="shrink-0 ml-3 px-3 py-1.5 bg-amber-50 text-amber-600 text-sm font-bold rounded-full">
                                                                            {formatPrice(group.todayAmount)}원
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            {/* 합계 */}
                                                            <div className="px-5 py-4 flex items-center justify-between bg-amber-50/50">
                                                                <span className="font-bold text-text-primary text-sm">합계</span>
                                                                <span className="text-amber-600 text-sm font-extrabold">
                                                                    {formatPrice(store.stats.todayTotalOrderAmount)}원
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                // 참여자 탭
                                                if (store.expandedStatCard === 'participants') {
                                                    if (store.stats.participantsGroupsList.length === 0) {
                                                        return (
                                                            <div className="py-10 text-center">
                                                                <p className="text-sm text-text-secondary">승인된 사용자가 없습니다.</p>
                                                            </div>
                                                        );
                                                    }
                                                    return (
                                                        <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
                                                            {store.stats.participantsGroupsList
                                                                .sort((a, b) => (b.data.approvedUsers?.length || 0) - (a.data.approvedUsers?.length || 0))
                                                                .map((group) => (
                                                                    <div
                                                                        key={group.id}
                                                                        className="px-5 py-4 hover:bg-gray-50 transition"
                                                                    >
                                                                        <div className="flex items-center justify-between mb-2">
                                                                            <h4 className="font-bold text-text-primary text-sm truncate">
                                                                                {group.id}
                                                                            </h4>
                                                                            <span className="shrink-0 ml-3 px-2 py-1 bg-purple-50 text-purple-600 text-xs font-bold rounded-full">
                                                                                {group.data.approvedUsers?.length || 0}명
                                                                            </span>
                                                                        </div>
                                                                        {group.data.approvedUsers && group.data.approvedUsers.length > 0 && (
                                                                            <div className="flex flex-wrap gap-1.5 mt-1">
                                                                                {group.data.approvedUsers.map((user, idx) => (
                                                                                    <span
                                                                                        key={idx}
                                                                                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50/80 text-purple-700 text-xs rounded-md"
                                                                                    >
                                                                                        <Users size={10} />
                                                                                        {typeof user === 'string' ? user : (user as any).name || (user as any).nickname || `사용자 ${idx + 1}`}
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            {/* 합계 */}
                                                            <div className="px-5 py-4 flex items-center justify-between bg-purple-50/50">
                                                                <span className="font-bold text-text-primary text-sm">전체 승인된 사용자</span>
                                                                <span className="text-purple-600 text-sm font-extrabold">
                                                                    {store.stats.totalParticipants}명
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                // 전체/활성 그룹 탭 (기존)
                                                const groups = store.expandedStatCard === 'all'
                                                    ? store.stats.allGroupsList
                                                    : store.stats.activeGroupsList;

                                                if (groups.length === 0) {
                                                    return (
                                                        <div className="py-10 text-center">
                                                            <p className="text-sm text-text-secondary">
                                                                {store.expandedStatCard === 'active'
                                                                    ? '활성 그룹이 없습니다.'
                                                                    : '그룹이 없습니다.'}
                                                            </p>
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
                                                        {groups.map((group) => (
                                                            <div
                                                                key={group.id}
                                                                className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition"
                                                            >
                                                                <div className="flex-1 min-w-0">
                                                                    <h4 className="font-bold text-text-primary text-sm truncate mb-1">
                                                                        {group.id}
                                                                    </h4>
                                                                    <div className="flex items-center gap-3 text-xs text-text-secondary">
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
                                                                {store.expandedStatCard === 'active' && (
                                                                    <span className="shrink-0 ml-3 px-2 py-1 bg-green-50 text-secondary text-xs font-medium rounded-full">
                                                                        활성
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : null}
                    </div>
                )}

                {/* ===== 방 청소 탭 ===== */}
                {store.activeTab === 'cleanup' && (
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
                                onClick={store.loadOldGroups}
                                disabled={store.isLoadingGroups}
                                className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200 text-sm font-medium text-text-secondary hover:bg-gray-50 transition disabled:opacity-50"
                            >
                                <RefreshCw size={16} className={store.isLoadingGroups ? 'animate-spin' : ''} />
                                새로고침
                            </button>
                        </div>

                        {/* 요약 카드 */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-white rounded-2xl shadow-toss p-5">
                                <p className="text-sm text-text-secondary mb-1">전체 그룹</p>
                                <p className="text-2xl font-extrabold text-text-primary">{store.allGroups.length}개</p>
                            </div>
                            <div className="bg-white rounded-2xl shadow-toss p-5">
                                <p className="text-sm text-text-secondary mb-1">7일 이상 경과</p>
                                <p className="text-2xl font-extrabold text-danger">{store.oldGroups.length}개</p>
                            </div>
                        </div>

                        {store.isLoadingGroups ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 size={32} className="animate-spin text-primary" />
                            </div>
                        ) : store.oldGroups.length === 0 ? (
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
                                    onClick={store.handleDeleteAllOld}
                                    className="w-full mb-4 bg-danger text-white py-3 rounded-xl font-bold text-sm hover:bg-red-600 transition flex items-center justify-center gap-2 shadow-md"
                                >
                                    <Trash2 size={18} />
                                    7일 이상 된 그룹 일괄 삭제 ({store.oldGroups.length}개)
                                </button>

                                {/* 그룹 리스트 */}
                                <div className="space-y-3">
                                    {store.oldGroups.map((group) => (
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
                                                onClick={() => store.handleDeleteGroup(group.id)}
                                                disabled={store.deletingIds.has(group.id)}
                                                className="shrink-0 ml-4 px-4 py-2 bg-red-50 text-danger rounded-xl text-sm font-medium hover:bg-red-100 transition disabled:opacity-50 flex items-center gap-1"
                                            >
                                                {store.deletingIds.has(group.id) ? (
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

                {/* ===== 메뉴 관리 탭 ===== */}
                {store.activeTab === 'menu' && (
                    <AdminMenuManager addToast={store.addToast} />
                )}
            </main>
        </div>
    );
};

export default AdminPage;
