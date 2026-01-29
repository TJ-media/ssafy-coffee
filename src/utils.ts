// 20가지 파스텔 톤 색상 팔레트
const PASTEL_PALETTE = [
  '#FFB3BA', // 벚꽃 분홍
  '#FFDFBA', // 살구
  '#FFFFBA', // 레몬 크림
  '#BAFFC9', // 민트
  '#BAE1FF', // 하늘
  '#E2F0CB', // 라임
  '#B5EAD7', // 옥색
  '#C7CEEA', // 라벤더 블루
  '#F0E68C', // 카키
  '#FFD1DC', // 파우더 핑크
  '#E6E6FA', // 라벤더
  '#D8BFD8', // 엉겅퀴
  '#FF9999', // 연한 빨강
  '#FFCC99', // 연한 오렌지
  '#99FF99', // 연한 초록
  '#99CCFF', // 연한 파랑
  '#CC99FF', // 연한 보라
  '#FFB6C1', // 라이트 핑크
  '#ADD8E6', // 라이트 블루
  '#F08080'  // 라이트 코랄
];

// 이름을 입력받아 20가지 색상 중 하나를 고정적으로 반환
export const getAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  // 음수 처리 후 20으로 나눈 나머지 사용
  const index = Math.abs(hash) % PASTEL_PALETTE.length;
  return PASTEL_PALETTE[index];
};

// 배경색이 밝으므로 글자색은 어두운 색으로 반환 (가독성 위해)
export const getTextContrastColor = () => {
  return '#374151'; // gray-700
};