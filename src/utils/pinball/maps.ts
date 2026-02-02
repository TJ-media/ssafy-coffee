import { StageDef, MapEntity } from './types';

// 핀볼 맵 생성 함수
export function createPinballStage(participantCount: number): StageDef {
  const width = Math.max(20, participantCount * 2.5);
  const height = 80;
  const goalY = height - 5;
  const startY = 3;

  const entities: MapEntity[] = [];

  // 좌우 벽
  entities.push({
    position: { x: 0, y: 0 },
    type: 'static',
    shape: {
      type: 'polyline',
      rotation: 0,
      points: [
        [1, 0],
        [1, goalY + 5],
      ],
    },
    props: { density: 1, restitution: 0.5, angularVelocity: 0 },
  });

  entities.push({
    position: { x: 0, y: 0 },
    type: 'static',
    shape: {
      type: 'polyline',
      rotation: 0,
      points: [
        [width - 1, 0],
        [width - 1, goalY + 5],
      ],
    },
    props: { density: 1, restitution: 0.5, angularVelocity: 0 },
  });

  // 핀(못) 배열 생성
  const pinStartY = 10;
  const pinEndY = height - 25;
  const rows = 12;
  const rowHeight = (pinEndY - pinStartY) / rows;

  for (let row = 0; row < rows; row++) {
    const y = pinStartY + row * rowHeight;
    const isEvenRow = row % 2 === 0;
    const pinsInRow = isEvenRow ? Math.floor(width / 2.5) : Math.floor(width / 2.5) - 1;
    const spacing = (width - 2) / (pinsInRow + 1);

    for (let i = 0; i < pinsInRow; i++) {
      const x = isEvenRow
        ? 1 + spacing * (i + 1)
        : 1 + spacing * (i + 1) + spacing / 2;

      entities.push({
        position: { x, y },
        type: 'static',
        shape: {
          type: 'circle',
          radius: 0.3,
        },
        props: { density: 1, restitution: 0.8, angularVelocity: 0 },
      });
    }
  }

  // 회전하는 막대들
  const barY1 = 20;
  const barY2 = 40;
  const barY3 = 55;

  entities.push({
    position: { x: width / 2, y: barY1 },
    type: 'kinematic',
    shape: {
      type: 'box',
      width: width * 0.15,
      height: 0.15,
      rotation: 0,
    },
    props: { density: 1, restitution: 0.5, angularVelocity: 1.5 },
  });

  entities.push({
    position: { x: width / 4, y: barY2 },
    type: 'kinematic',
    shape: {
      type: 'box',
      width: width * 0.1,
      height: 0.12,
      rotation: 0,
    },
    props: { density: 1, restitution: 0.5, angularVelocity: -2 },
  });

  entities.push({
    position: { x: (width / 4) * 3, y: barY2 },
    type: 'kinematic',
    shape: {
      type: 'box',
      width: width * 0.1,
      height: 0.12,
      rotation: 0,
    },
    props: { density: 1, restitution: 0.5, angularVelocity: 2 },
  });

  entities.push({
    position: { x: width / 2, y: barY3 },
    type: 'kinematic',
    shape: {
      type: 'box',
      width: width * 0.12,
      height: 0.15,
      rotation: 0,
    },
    props: { density: 1, restitution: 0.5, angularVelocity: -1.8 },
  });

  // 깔때기 벽 (아래로 갈수록 좁아짐)
  const funnelStartY = height - 20;
  const funnelEndY = goalY - 2;
  const funnelTopWidth = width * 0.4;
  const funnelBottomWidth = width * 0.12;

  // 왼쪽 깔때기
  entities.push({
    position: { x: 0, y: 0 },
    type: 'static',
    shape: {
      type: 'polyline',
      rotation: 0,
      points: [
        [1, funnelStartY],
        [width / 2 - funnelBottomWidth, funnelEndY],
      ],
    },
    props: { density: 1, restitution: 0.3, angularVelocity: 0 },
  });

  // 오른쪽 깔때기
  entities.push({
    position: { x: 0, y: 0 },
    type: 'static',
    shape: {
      type: 'polyline',
      rotation: 0,
      points: [
        [width - 1, funnelStartY],
        [width / 2 + funnelBottomWidth, funnelEndY],
      ],
    },
    props: { density: 1, restitution: 0.3, angularVelocity: 0 },
  });

  // 중간 삼각형 장애물들
  const triangleY = height - 30;
  const triangleSpacing = (width - 4) / 4;

  for (let i = 1; i <= 3; i++) {
    const tx = 2 + triangleSpacing * i;
    entities.push({
      position: { x: 0, y: 0 },
      type: 'static',
      shape: {
        type: 'polyline',
        rotation: 0,
        points: [
          [tx - 1, triangleY + 2],
          [tx, triangleY - 1],
          [tx + 1, triangleY + 2],
        ],
      },
      props: { density: 1, restitution: 0.7, angularVelocity: 0 },
    });
  }

  // 바운스 범퍼 (원형)
  const bumperY = 30;
  entities.push({
    position: { x: width / 3, y: bumperY },
    type: 'static',
    shape: {
      type: 'circle',
      radius: 0.8,
    },
    props: { density: 1, restitution: 1.2, angularVelocity: 0 },
  });

  entities.push({
    position: { x: (width / 3) * 2, y: bumperY },
    type: 'static',
    shape: {
      type: 'circle',
      radius: 0.8,
    },
    props: { density: 1, restitution: 1.2, angularVelocity: 0 },
  });

  return {
    title: 'Coffee Pinball',
    entities,
    goalY,
    startY,
    width,
    height,
  };
}
