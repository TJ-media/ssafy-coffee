import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '../store/useAdminStore';
import {
    Megaphone,
    BarChart3,
    Trash2,
    ArrowLeft,
    KeyRound,
    LogOut,
    Coffee,
} from 'lucide-react';

type TabType = 'notice' | 'stats' | 'cleanup' | 'menu';

const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: 'notice', label: '공지사항', icon: <Megaphone size={18} /> },
    { key: 'stats', label: '시스템 통계', icon: <BarChart3 size={18} /> },
    { key: 'cleanup', label: '방 청소', icon: <Trash2 size={18} /> },
    { key: 'menu', label: '메뉴 관리', icon: <Coffee size={18} /> },
];

const AdminHeader: React.FC = () => {
    const navigate = useNavigate();
    const store = useAdminStore();

    return (
        <>
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
        </>
    );
};

export default AdminHeader;
