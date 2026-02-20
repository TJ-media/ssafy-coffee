import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '../store/useAdminStore';
import Toast from '../../../shared/ui/Toast';
import {
    AlertTriangle,
    Loader2,
    Shield,
    Lock,
    Eye,
    EyeOff,
    KeyRound,
} from 'lucide-react';

const AdminLoginGate: React.FC = () => {
    const navigate = useNavigate();
    const store = useAdminStore();

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
};

export default AdminLoginGate;
