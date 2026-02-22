import React from 'react';
import { useAdminStore } from '../store/useAdminStore';
import { formatDate, formatPrice } from '../utils/formatters';
import {
    BarChart3,
    RefreshCw,
    Users,
    ShoppingBag,
    Layers,
    Activity,
    Loader2,
    Calendar,
    ChevronDown,
    ChevronUp,
    X,
} from 'lucide-react';

const StatsTab: React.FC = () => {
    const store = useAdminStore();

    return (
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
    );
};

export default StatsTab;
