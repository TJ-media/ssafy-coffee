import React from 'react';
import { useAdminStore } from '../store/useAdminStore';
import {
    Megaphone,
    Send,
    AlertTriangle,
    Loader2,
} from 'lucide-react';

const NoticeTab: React.FC = () => {
    const store = useAdminStore();

    return (
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
    );
};

export default NoticeTab;
