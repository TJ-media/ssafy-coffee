import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import OrderPage from './pages/OrderPage';
import AdminPage from './pages/AdminPage';
import GlobalNoticeListener from './features/system/ui/GlobalNoticeListener';
import { useLayoutStore } from './shared/store/useLayoutStore';
import { Monitor, Smartphone } from 'lucide-react';
import './index.css';

function App() {
  const viewMode = useLayoutStore(state => state.viewMode);
  const isDesktopDevice = useLayoutStore(state => state.isDesktopDevice);
  const toggleViewMode = useLayoutStore(state => state.toggleViewMode);
  const initLayout = useLayoutStore(state => state.initLayout);

  useEffect(() => {
    const cleanup = initLayout();
    return cleanup;
  }, [initLayout]);

  const isDesktopView = viewMode === 'desktop';

  return (
    <BrowserRouter>
      {/* 모든 페이지에서 긴급 공지를 수신 */}
      <GlobalNoticeListener />

      <Routes>
        {/* AdminPage는 전체 화면 사용 */}
        <Route path="/admin" element={<AdminPage />} />

        {/* 나머지 페이지는 viewMode에 따라 레이아웃 전환 */}
        <Route path="*" element={
          <div className={`min-h-screen flex justify-center bg-background ${isDesktopView ? 'items-center py-6' : 'items-center p-4'}`}>
            <div className={`flex flex-col transition-all duration-500 ease-in-out ${isDesktopView ? 'w-full max-w-5xl' : 'w-full max-w-md'}`}>
              {/* Platform 토글 - 데스크탑에서만 wrapper 위에 표시 */}
              {isDesktopDevice && (
                <div className="flex justify-end mb-3 mr-1">
                  <div className="flex items-center bg-gray-200/80 backdrop-blur-sm rounded-full p-1 shadow-lg">
                    <button
                      onClick={() => { if (viewMode !== 'mobile') toggleViewMode(); }}
                      className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${viewMode === 'mobile'
                        ? 'bg-white shadow-md text-blue-500'
                        : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                      <Smartphone size={20} />
                    </button>
                    <button
                      onClick={() => { if (viewMode !== 'desktop') toggleViewMode(); }}
                      className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${viewMode === 'desktop'
                        ? 'bg-white shadow-md text-blue-500'
                        : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                      <Monitor size={20} />
                    </button>
                  </div>
                </div>
              )}

              <div className={`w-full bg-surface overflow-hidden relative transition-all duration-500 ease-in-out ${isDesktopView
                ? 'rounded-3xl shadow-xl h-[85vh]'
                : 'shadow-toss rounded-toss h-[800px] max-h-[90vh]'
                }`}>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/order" element={<OrderPage />} />
                </Routes>
              </div>
            </div>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;