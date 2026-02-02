// Vector 타입
export interface VectorLike {
  x: number;
  y: number;
}

// Entity Shape 타입
export type EntityShapeTypes = 'box' | 'circle' | 'polyline';

export interface EntityShapeBase {
  type: EntityShapeTypes;
  color?: string;
}

export interface EntityBoxShape extends EntityShapeBase {
  type: 'box';
  width: number;
  height: number;
  rotation: number;
}

export interface EntityCircleShape extends EntityShapeBase {
  type: 'circle';
  radius: number;
}

export interface EntityPolylineShape extends EntityShapeBase {
  type: 'polyline';
  rotation: number;
  points: [number, number][];
}

export type EntityShape = EntityBoxShape | EntityCircleShape | EntityPolylineShape;

// Entity Physical Props
export type EntityPhysicalProps = {
  density: number;
  restitution: number;
  angularVelocity: number;
  life?: number;
};

// Map Entity
export interface MapEntity {
  position: VectorLike;
  type: 'static' | 'kinematic';
  shape: EntityShape;
  props: EntityPhysicalProps;
}

export interface MapEntityState {
  x: number;
  y: number;
  angle: number;
  shape: EntityShape;
  life: number;
}

// Stage Definition
export interface StageDef {
  title: string;
  entities: MapEntity[];
  goalY: number;
  startY: number;
  width: number;
  height: number;
}

// Ball State
export interface BallState {
  id: number;
  name: string;
  color: string;
  x: number;
  y: number;
  angle: number;
  finished: boolean;
}
