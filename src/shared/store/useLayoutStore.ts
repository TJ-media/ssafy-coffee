import { create } from 'zustand';

interface LayoutState {
    viewMode: 'mobile' | 'desktop';
    isDesktopDevice: boolean;
    setViewMode: (mode: 'mobile' | 'desktop') => void;
    toggleViewMode: () => void;
    initLayout: () => (() => void);
}

export const useLayoutStore = create<LayoutState>((set, get) => ({
    viewMode: window.innerWidth >= 768 ? 'desktop' : 'mobile',
    isDesktopDevice: window.innerWidth >= 768,

    setViewMode: (mode) => set({ viewMode: mode }),

    toggleViewMode: () => {
        const { viewMode, isDesktopDevice } = get();
        if (!isDesktopDevice) return; // 모바일 기기에서는 토글 불가
        set({ viewMode: viewMode === 'desktop' ? 'mobile' : 'desktop' });
    },

    initLayout: () => {
        const handleResize = () => {
            const isDesktop = window.innerWidth >= 768;
            set((state) => ({
                isDesktopDevice: isDesktop,
                // 모바일로 줄어들면 자동으로 모바일 모드로 전환
                viewMode: isDesktop ? state.viewMode : 'mobile',
            }));
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // 초기 설정

        return () => window.removeEventListener('resize', handleResize);
    },
}));
