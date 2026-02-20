import { useEffect } from 'react';
import { useAdminStore } from '../features/admin/store/useAdminStore';
import AdminLoginGate from '../features/admin/ui/AdminLoginGate';
import AdminHeader from '../features/admin/ui/AdminHeader';
import PasswordChangeModal from '../features/admin/ui/PasswordChangeModal';
import NoticeTab from '../features/admin/ui/NoticeTab';
import StatsTab from '../features/admin/ui/StatsTab';
import CleanupTab from '../features/admin/ui/CleanupTab';
import AdminMenuManager from '../features/admin/ui/AdminMenuManager';
import Toast from '../shared/ui/Toast';
import { Loader2 } from 'lucide-react';

const AdminPage = () => {
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

    // ─── 세션 체크 중 로딩 ───
    if (store.isCheckingAuth) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-primary" />
            </div>
        );
    }

    // ─── 미인증 → 로그인 게이트 ───
    if (!store.isAuthenticated) {
        return <AdminLoginGate />;
    }

    // ─── 대시보드 (인증 완료) ───
    return (
        <div className="min-h-screen bg-background">
            <Toast toasts={store.toasts} removeToast={store.removeToast} />
            <PasswordChangeModal />
            <AdminHeader />

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {store.activeTab === 'notice' && <NoticeTab />}
                {store.activeTab === 'stats' && <StatsTab />}
                {store.activeTab === 'cleanup' && <CleanupTab />}
                {store.activeTab === 'menu' && <AdminMenuManager addToast={store.addToast} />}
            </main>
        </div>
    );
};

export default AdminPage;
