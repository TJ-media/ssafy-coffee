import React from 'react';
import { useAdminStore } from '../store/useAdminStore';
import { KeyRound, Loader2 } from 'lucide-react';

const PasswordChangeModal: React.FC = () => {
    const store = useAdminStore();

    if (!store.showPasswordChange) return null;

    return (
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
    );
};

export default PasswordChangeModal;
