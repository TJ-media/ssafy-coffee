import { Trophy, RotateCcw } from 'lucide-react';
import { getAvatarColor } from '../../utils';

interface PinballResultProps {
  winner: string;
  finishOrder: string[];
  onReset: () => void;
}

const PinballResult = ({ winner, finishOrder, onReset }: PinballResultProps) => {
  return (
    <div className="text-center py-6 pinball-result-enter">
      {/* 당첨자 발표 */}
      <div className="mb-6">
        <div className="text-6xl mb-4 animate-bounce">
          <Trophy className="inline-block text-yellow-500" size={64} />
        </div>
        <p className="text-gray-500 text-sm mb-2">오늘의 커피 당첨자</p>
        <div className="flex items-center justify-center gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg"
            style={{ backgroundColor: getAvatarColor(winner) }}
          >
            {winner.slice(0, 2)}
          </div>
          <span className="text-2xl font-bold text-gray-800">{winner}</span>
        </div>
      </div>

      {/* 도착 순서 */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        <p className="text-xs text-gray-500 mb-3">도착 순서</p>
        <div className="flex justify-center gap-2 flex-wrap">
          {finishOrder.map((name, index) => (
            <div
              key={name}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm ${
                index === finishOrder.length - 1
                  ? 'bg-red-100 text-red-600 font-bold'
                  : 'bg-white text-gray-600'
              }`}
            >
              <span className="font-mono text-xs text-gray-400">
                {index + 1}.
              </span>
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                style={{ backgroundColor: getAvatarColor(name) }}
              >
                {name.slice(0, 1)}
              </div>
              <span>{name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 다시하기 버튼 */}
      <button
        onClick={onReset}
        className="flex items-center justify-center gap-2 mx-auto px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition"
      >
        <RotateCcw size={18} />
        다시 하기
      </button>
    </div>
  );
};

export default PinballResult;
