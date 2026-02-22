import React from 'react';
import { useAdminStore } from '../store/useAdminStore';
import { formatDate, getDaysAgo } from '../utils/formatters';
import {
    Trash2,
    RefreshCw,
    Users,
    ShoppingBag,
    Calendar,
    Clock,
    Loader2,
} from 'lucide-react';

const CleanupTab: React.FC = () => {
    const store = useAdminStore();

    return (
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
    );
};

export default CleanupTab;
