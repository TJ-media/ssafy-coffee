import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// 1. 로딩 화면(스플래시) 숨기는 함수
const hideSplashScreen = () => {
    const splash = document.getElementById('splash-screen');
    if (splash) {
        // 'hidden-splash' 클래스를 추가하여 CSS 트랜지션(0.5초 사라짐) 시작
        splash.classList.add('hidden-splash');

        // CSS 트랜지션 시간(0.5초)이 끝난 후 DOM에서 완전히 제거
        setTimeout(() => {
            splash.remove();
        }, 500);
    }
};

// 2. Root 요소 가져오기
const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error('Failed to find the root element');
}

// 3. 앱 렌더링
createRoot(rootElement).render(
    <StrictMode>
        <App />
    </StrictMode>
);

// 4. 렌더링 직후 -> 최소 1초 대기 후 -> 숨기기 시작
requestAnimationFrame(() => {
    // 👇 최소 1초(1000ms) 동안 로딩 화면을 유지한 후 숨김 함수 실행
    setTimeout(() => {
        hideSplashScreen();
    }, 1200);
});