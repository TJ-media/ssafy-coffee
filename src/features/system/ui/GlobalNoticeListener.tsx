import { useEffect, useState, useRef } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase';
import Toast from '../../../shared/ui/Toast';
import { ToastMessage } from '../../../shared/types';

/**
 * 전역 긴급 공지 리스너
 * - Firestore `system/notice` 문서를 실시간 구독
 * - 관리자가 공지를 전송하면 모든 접속 중인 화면에 Toast를 표시합니다.
 */
const GlobalNoticeListener = () => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const lastSentAtRef = useRef<number | null>(null);

    useEffect(() => {
        const noticeRef = doc(db, 'system', 'notice');

        const unsub = onSnapshot(noticeRef, (docSnap) => {
            if (!docSnap.exists()) return;

            const data = docSnap.data();
            if (!data || !data.message || !data.sentAt) return;

            // sentAt을 밀리초 타임스탬프로 변환
            let sentAtMs: number;
            if (data.sentAt.toMillis) {
                sentAtMs = data.sentAt.toMillis();
            } else if (data.sentAt.seconds) {
                sentAtMs = data.sentAt.seconds * 1000;
            } else {
                sentAtMs = Date.now();
            }

            // 같은 공지가 중복 표시되지 않도록 체크
            if (lastSentAtRef.current !== null && sentAtMs <= lastSentAtRef.current) return;

            // 너무 오래된 공지는 무시 (15초 이상 지난 것)
            if (Date.now() - sentAtMs > 15000) {
                lastSentAtRef.current = sentAtMs;
                return;
            }

            lastSentAtRef.current = sentAtMs;

            const newToast: ToastMessage = {
                id: `notice-${sentAtMs}`,
                message: `📢 긴급 공지: ${data.message}`,
                type: 'warning',
            };

            setToasts((prev) => [...prev, newToast]);
        });

        return () => unsub();
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    if (toasts.length === 0) return null;

    return <Toast toasts={toasts} removeToast={removeToast} />;
};

export default GlobalNoticeListener;
