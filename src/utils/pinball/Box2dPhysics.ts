import Box2DFactory from 'box2d-wasm';
import { MapEntity, MapEntityState, StageDef, BallState } from './types';

export class Box2dPhysics {
  private Box2D!: typeof Box2D & EmscriptenModule;
  private world!: Box2D.b2World;
  private marbleMap: { [id: number]: { body: Box2D.b2Body; name: string; color: string } } = {};
  private entities: ({ body: Box2D.b2Body } & MapEntityState)[] = [];
  private finishOrder: string[] = [];
  private goalY: number = 100;
  private isReady: boolean = false;

  async init(): Promise<void> {
    try {
      console.log('Box2D: 초기화 시작...');
      this.Box2D = await Box2DFactory({
        locateFile: (url: string) => {
          console.log('Box2D: locateFile 호출 -', url);
          // public 폴더에서 WASM 파일 로드
          if (url.endsWith('.wasm')) {
            return '/' + url;
          }
          return url;
        },
      });
      console.log('Box2D: 팩토리 로드 완료');
      const gravity = new this.Box2D.b2Vec2(0, 10);
      this.world = new this.Box2D.b2World(gravity);
      this.isReady = true;
      console.log('Box2D: 초기화 완료');
    } catch (error) {
      console.error('Box2D 초기화 실패:', error);
      throw error;
    }
  }

  getIsReady(): boolean {
    return this.isReady;
  }

  createStage(stage: StageDef): void {
    this.goalY = stage.goalY;
    this.createEntities(stage.entities);
  }

  private createEntities(entities: MapEntity[]): void {
    const bodyTypes = {
      static: this.Box2D.b2_staticBody,
      kinematic: this.Box2D.b2_kinematicBody,
    } as const;

    entities.forEach((entity) => {
      const bodyDef = new this.Box2D.b2BodyDef();
      bodyDef.set_type(bodyTypes[entity.type]);
      const body = this.world.CreateBody(bodyDef);

      const fixtureDef = new this.Box2D.b2FixtureDef();
      fixtureDef.set_density(entity.props.density);
      fixtureDef.set_restitution(entity.props.restitution);

      switch (entity.shape.type) {
        case 'box': {
          const shape = new this.Box2D.b2PolygonShape();
          shape.SetAsBox(
            entity.shape.width,
            entity.shape.height,
            new this.Box2D.b2Vec2(0, 0),
            entity.shape.rotation * (Math.PI / 180)
          );
          fixtureDef.set_shape(shape);
          body.CreateFixture(fixtureDef);
          break;
        }
        case 'polyline': {
          for (let i = 0; i < entity.shape.points.length - 1; i++) {
            const p1 = entity.shape.points[i];
            const p2 = entity.shape.points[i + 1];
            const v1 = new this.Box2D.b2Vec2(p1[0], p1[1]);
            const v2 = new this.Box2D.b2Vec2(p2[0], p2[1]);
            const edge = new this.Box2D.b2EdgeShape();
            edge.SetTwoSided(v1, v2);
            body.CreateFixture(edge, 1);
          }
          break;
        }
        case 'circle': {
          const shape = new this.Box2D.b2CircleShape();
          shape.set_m_radius(entity.shape.radius);
          fixtureDef.set_shape(shape);
          body.CreateFixture(fixtureDef);
          break;
        }
      }

      body.SetAngularVelocity(entity.props.angularVelocity);
      body.SetTransform(
        new this.Box2D.b2Vec2(entity.position.x, entity.position.y),
        0
      );

      this.entities.push({
        body,
        x: entity.position.x,
        y: entity.position.y,
        angle: 0,
        shape: entity.shape,
        life: entity.props.life ?? -1,
      });
    });
  }

  createMarble(id: number, x: number, y: number, name: string, color: string): void {
    const circleShape = new this.Box2D.b2CircleShape();
    circleShape.set_m_radius(0.3);

    const bodyDef = new this.Box2D.b2BodyDef();
    bodyDef.set_type(this.Box2D.b2_dynamicBody);
    bodyDef.set_position(new this.Box2D.b2Vec2(x, y));

    const body = this.world.CreateBody(bodyDef);
    const fixtureDef = new this.Box2D.b2FixtureDef();
    fixtureDef.set_shape(circleShape);
    fixtureDef.set_density(1);
    fixtureDef.set_restitution(0.3);
    fixtureDef.set_friction(0.1);
    body.CreateFixture(fixtureDef);
    body.SetAwake(false);
    body.SetEnabled(false);

    this.marbleMap[id] = { body, name, color };
  }

  start(): void {
    for (const key in this.marbleMap) {
      const marble = this.marbleMap[key];
      marble.body.SetAwake(true);
      marble.body.SetEnabled(true);
    }
  }

  step(deltaSeconds: number): void {
    this.world.Step(deltaSeconds, 6, 2);

    // 골인 체크
    for (const key in this.marbleMap) {
      const marble = this.marbleMap[key];
      const pos = marble.body.GetPosition();
      if (pos.y >= this.goalY && !this.finishOrder.includes(marble.name)) {
        this.finishOrder.push(marble.name);
      }
    }
  }

  getBalls(): BallState[] {
    const balls: BallState[] = [];
    for (const key in this.marbleMap) {
      const id = parseInt(key);
      const marble = this.marbleMap[id];
      const pos = marble.body.GetPosition();
      balls.push({
        id,
        name: marble.name,
        color: marble.color,
        x: pos.x,
        y: pos.y,
        angle: marble.body.GetAngle(),
        finished: this.finishOrder.includes(marble.name),
      });
    }
    return balls.sort((a, b) => b.y - a.y);
  }

  getEntities(): MapEntityState[] {
    return this.entities.map((entity) => ({
      x: entity.body.GetPosition().x,
      y: entity.body.GetPosition().y,
      angle: entity.body.GetAngle(),
      shape: entity.shape,
      life: entity.life,
    }));
  }

  getFinishOrder(): string[] {
    return [...this.finishOrder];
  }

  getWinner(): string | null {
    if (this.finishOrder.length === 0) return null;
    return this.finishOrder[this.finishOrder.length - 1];
  }

  isAllFinished(): boolean {
    return this.finishOrder.length === Object.keys(this.marbleMap).length;
  }

  clear(): void {
    // Clear entities
    this.entities.forEach((entity) => {
      this.world.DestroyBody(entity.body);
    });
    this.entities = [];

    // Clear marbles
    for (const key in this.marbleMap) {
      this.world.DestroyBody(this.marbleMap[key].body);
    }
    this.marbleMap = {};
    this.finishOrder = [];
  }

  reset(): void {
    this.clear();
  }
}
