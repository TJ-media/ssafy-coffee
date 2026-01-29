import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import OrderPage from './pages/OrderPage';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex justify-center items-center p-4 bg-background">
        <div className="w-full max-w-md bg-surface shadow-toss rounded-toss overflow-hidden h-[800px] max-h-[90vh] relative">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/order" element={<OrderPage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;