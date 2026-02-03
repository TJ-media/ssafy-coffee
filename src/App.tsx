import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import OrderPage from './pages/OrderPage';
import AdminPage from './pages/AdminPage';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* AdminPage는 전체 화면 사용 */}
        <Route path="/admin" element={<AdminPage />} />

        {/* 나머지 페이지는 모바일 컨테이너 안에서 렌더링 */}
        <Route path="*" element={
          <div className="min-h-screen flex justify-center items-center p-4 bg-background">
            <div className="w-full max-w-md bg-surface shadow-toss rounded-toss overflow-hidden h-[800px] max-h-[90vh] relative">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/order" element={<OrderPage />} />
              </Routes>
            </div>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;