import React from 'react';
import { getTextContrastColor } from '../../../shared/utils';

// FlyingItem 인터페이스도 여기서 관리하거나 shared/types로 옮겨도 됨
export interface FlyingItem {
    id: number;
    startX: number;
    startY: number;
    targetX: number;
    targetY: number;
    color: string;
}

interface Props {
    items: FlyingItem[];
}

const FlyingBall: React.FC<Props> = ({ items }) => {
    return (
        <>
            <style>{`
        @keyframes flyToCart {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) scale(0.2); opacity: 0; }
        }
        .flying-ball {
          animation: flyToCart 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
            {items.map(item => (
                <div
                    key={item.id}
                    className="fixed w-8 h-8 rounded-full shadow-md z-50 pointer-events-none flying-ball flex items-center justify-center text-[10px] font-bold text-white border-2 border-white"
                    style={{
                        backgroundColor: item.color,
                        left: item.startX - 16,
                        top: item.startY - 16,
                        //@ts-ignore
                        '--tx': `${item.targetX - item.startX}px`,
                        //@ts-ignore
                        '--ty': `${item.targetY - item.startY}px`,
                        color: getTextContrastColor()
                    }}
                >+1</div>
            ))}
        </>
    );
};

export default FlyingBall;