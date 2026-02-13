import React from 'react';
import { Users, Play, Shuffle } from 'lucide-react';
import { getAvatarColor, getTextContrastColor } from '../../../shared/utils';

interface WaitingRoomProps {
    participants: string[];
    hostName?: string;
    marbleCounts: { [userName: string]: number };
    isHost: boolean;
    onStart: () => void;
    onShuffle: () => void;
}

const WaitingRoom: React.FC<WaitingRoomProps> = ({
                                                     participants,
                                                     hostName,
                                                     marbleCounts,
                                                     isHost,
                                                     onStart,
                                                     onShuffle,
                                                 }) => {
    const getParticipantMarbleCount = (name: string): number => {
        return marbleCounts[name] || 1;
    };

    return (
        <div className="absolute inset-0 bg-black/60 rounded-xl flex flex-col items-center justify-center p-4 h-full">
            <div className="bg-gray-800/95 rounded-2xl p-6 shadow-xl max-w-[320px] w-full border border-gray-600">
                <div className="text-center mb-4">
                    <Users size={40} className="text-primary mx-auto mb-2" />
                    <h3 className="text-xl font-bold text-white">대기실</h3>
                    <p className="text-sm text-gray-400">참가자들을 확인하세요!</p>
                </div>

                {/* 참가자 목록 */}
                <div className="bg-gray-700/50 rounded-xl p-3 mb-4">
                    <p className="text-xs text-gray-400 mb-2 font-bold">
                        참가자 ({participants.length}명) · 🎱 = 당첨 확률
                    </p>
                    <div className="flex flex-wrap gap-1.5 justify-center">
                        {participants.map((name) => {
                            const marbleCount = getParticipantMarbleCount(name);
                            return (
                                <div
                                    key={name}
                                    className="flex items-center gap-1.5 px-2 py-1 bg-gray-600 rounded-full"
                                >
                                    <div
                                        className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                                        style={{
                                            backgroundColor: getAvatarColor(name),
                                            color: getTextContrastColor(),
                                        }}
                                    >
                                        {name.slice(0, 1)}
                                    </div>
                                    <span className="text-xs font-medium text-gray-200">
                    {name}
                                        {name === hostName && (
                                            <span className="ml-0.5 text-[10px] text-primary">(방장)</span>
                                        )}
                  </span>
                                    {marbleCount > 1 && (
                                        <span className="text-[10px] bg-amber-500/30 text-amber-300 px-1 rounded font-bold">
                      🎱x{marbleCount}
                    </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 시작/셔플 버튼 */}
                {isHost ? (
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={onStart}
                            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition shadow-md text-lg"
                        >
                            <Play size={20} />
                            게임 시작!
                        </button>
                        <button
                            onClick={onShuffle}
                            className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-gray-600 text-gray-200 rounded-xl font-medium hover:bg-gray-500 transition text-sm"
                        >
                            <Shuffle size={14} />
                            위치 셔플
                        </button>
                    </div>
                ) : (
                    <div className="text-center">
                        <p className="text-sm text-gray-400">
                            <span className="font-bold text-primary">{hostName}</span>님이 시작하면 게임이
                            시작돼요
                        </p>
                        <div className="mt-2 flex items-center justify-center gap-1">
                            <div
                                className="w-2 h-2 bg-primary rounded-full animate-bounce"
                                style={{ animationDelay: '0ms' }}
                            />
                            <div
                                className="w-2 h-2 bg-primary rounded-full animate-bounce"
                                style={{ animationDelay: '150ms' }}
                            />
                            <div
                                className="w-2 h-2 bg-primary rounded-full animate-bounce"
                                style={{ animationDelay: '300ms' }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WaitingRoom;