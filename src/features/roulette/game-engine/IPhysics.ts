import type { StageDef } from './data/maps.ts';
import { MapEntityState } from './types/MapEntity.type.ts';

export interface IPhysics {
  init(): Promise<void>;

  clear(): void;

  clearMarbles(): void;

  createStage(stage: StageDef): void;

  // 시드 설정 (결정론적 시뮬레이션용)
  setSeed(seed: number): void;

  createMarble(id: number, x: number, y: number): void;

  shakeMarble(id: number): void;

  removeMarble(id: number): void;

  getMarblePosition(id: number): { x: number; y: number; angle: number; };

  // 스펙테이터 모드용 위치 설정 (optional)
  setMarblePosition?(id: number, x: number, y: number, angle: number): void;

  getEntities(): MapEntityState[];

  impact(id: number): void;

  start(): void;

  step(deltaSeconds: number): void;
}
