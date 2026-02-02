import { Marble } from './marble';
import { initialZoom, Skills, Themes, zoomThreshold } from './data/constants';
import { ParticleManager } from './particleManager';
import { StageDef, stages } from './data/maps';
import { parseName, shuffle } from './utils/utils';
import { Camera } from './camera';
import { RouletteRenderer } from './rouletteRenderer';
import { SkillEffect } from './skillEffect';
import { GameObject } from './gameObject';
import options from './options';
import { bound } from './utils/bound.decorator';
import { UIObject } from './UIObject';
import { RankRenderer } from './rankRenderer';
import { Minimap } from './minimap';
import { VideoRecorder } from './utils/videoRecorder';
import { IPhysics } from './IPhysics';
import { Box2dPhysics } from './physics-box2d';
import { MouseEventHandlerName, type MouseEventName } from './types/mouseEvents.type';
import { FastForwader } from './fastForwader';
import { ColorTheme } from './types/ColorTheme';

// 마블 위치 데이터 타입
export type MarblePosition = {
  id: number;
  name: string;
  x: number;
  y: number;
  angle: number;
  hue: number;
};

export class Roulette extends EventTarget {
  private _marbles: Marble[] = [];

  private _lastTime: number = 0;
  private _elapsed: number = 0;

  private _updateInterval = 10;
  private _timeScale = 1;
  private _speed = 1;

  private _winners: Marble[] = [];
  private _particleManager = new ParticleManager();
  private _stage: StageDef | null = null;

  private _camera: Camera = new Camera();
  private _renderer: RouletteRenderer = new RouletteRenderer();

  private _effects: GameObject[] = [];

  private _winnerRank = -1; // -1이면 options에서 가져옴
  private _totalMarbleCount = 0;
  private _goalDist: number = Infinity;
  private _isRunning: boolean = false;
  private _winner: Marble | null = null;

  private _uiObjects: UIObject[] = [];

  private _autoRecording: boolean = false;
  private _recorder!: VideoRecorder;

  private physics!: IPhysics;

  private _isReady: boolean = false;
  private fastForwarder!: FastForwader;
  private _theme: ColorTheme = Themes.dark;

  // 스펙테이터 모드 관련
  private _isSpectator: boolean = false;
  private _spectatorPositions: MarblePosition[] = [];

  get isReady() {
    return this._isReady;
  }

  constructor(canvas: HTMLCanvasElement) {
    super();
    console.log('Roulette: Constructor called');
    this._renderer.init(canvas).then(() => {
      console.log('Roulette: Renderer initialized');
      this._init().then(() => {
        console.log('Roulette: _init completed');
        this._isReady = true;
        this._update();
      });
    });
  }

  public getZoom() {
    return initialZoom * this._camera.zoom;
  }

  private addUiObject(obj: UIObject) {
    this._uiObjects.push(obj);
    if (obj.onWheel) {
      this._renderer.canvas.addEventListener('wheel', obj.onWheel);
    }
    if (obj.onMessage) {
      obj.onMessage((msg) => {
        console.log('onMessage', msg);
        this.dispatchEvent(new CustomEvent('message', { detail: msg }));
      });
    }
  }

  @bound
  private _update() {
    if (!this._lastTime) this._lastTime = Date.now();
    const currentTime = Date.now();

    this._elapsed += (currentTime - this._lastTime) * this._speed * this.fastForwarder.speed;
    if (this._elapsed > 100) {
      this._elapsed %= 100;
    }
    this._lastTime = currentTime;

    const interval = (this._updateInterval / 1000) * this._timeScale;

    // 스펙테이터 모드가 아닐 때만 물리 시뮬레이션 실행
    if (!this._isSpectator) {
      while (this._elapsed >= this._updateInterval) {
        this.physics.step(interval);
        this._updateMarbles(this._updateInterval);
        this._particleManager.update(this._updateInterval);
        this._updateEffects(this._updateInterval);
        this._elapsed -= this._updateInterval;
        this._uiObjects.forEach((obj) => obj.update(this._updateInterval));
      }
    } else {
      // 스펙테이터 모드: 파티클과 이펙트만 업데이트
      while (this._elapsed >= this._updateInterval) {
        this._particleManager.update(this._updateInterval);
        this._updateEffects(this._updateInterval);
        this._elapsed -= this._updateInterval;
        this._uiObjects.forEach((obj) => obj.update(this._updateInterval));
      }
    }

    if (this._marbles.length > 1) {
      this._marbles.sort((a, b) => b.y - a.y);
    }

    if (this._stage) {
      this._camera.update({
        marbles: this._marbles,
        stage: this._stage,
        needToZoom: this._goalDist < zoomThreshold,
        targetIndex:
          this._winners.length > 0
            ? this._winnerRank - this._winners.length
            : 0,
      });
    }

    this._render();
    window.requestAnimationFrame(this._update);
  }

  private _updateMarbles(deltaTime: number) {
    if (!this._stage) return;

    for (let i = 0; i < this._marbles.length; i++) {
      const marble = this._marbles[i];
      marble.update(deltaTime);
      if (marble.skill === Skills.Impact) {
        this._effects.push(new SkillEffect(marble.x, marble.y));
        this.physics.impact(marble.id);
      }
      if (marble.y > this._stage.goalY) {
        this._winners.push(marble);
        if (this._isRunning && this._winners.length === this._winnerRank + 1) {
          this.dispatchEvent(
            new CustomEvent('goal', { detail: { winner: marble.name } }),
          );
          this._winner = marble;
          this._isRunning = false;
          this._particleManager.shot(
            this._renderer.width,
            this._renderer.height,
          );
          setTimeout(() => {
            this._recorder.stop();
          }, 1000);
        } else if (
          this._isRunning &&
          this._winnerRank === this._winners.length &&
          this._winnerRank === this._totalMarbleCount - 1
        ) {
          this.dispatchEvent(
            new CustomEvent('goal', {
              detail: { winner: this._marbles[i + 1].name },
            }),
          );
          this._winner = this._marbles[i + 1];
          this._isRunning = false;
          this._particleManager.shot(
            this._renderer.width,
            this._renderer.height,
          );
          setTimeout(() => {
            this._recorder.stop();
          }, 1000);
        }
        setTimeout(() => {
          this.physics.removeMarble(marble.id);
        }, 500);
      }
    }

    const targetIndex = this._winnerRank - this._winners.length;
    const topY = this._marbles[targetIndex] ? this._marbles[targetIndex].y : 0;
    this._goalDist = Math.abs(this._stage.zoomY - topY);
    this._timeScale = this._calcTimeScale();

    this._marbles = this._marbles.filter(
      (marble) => marble.y <= this._stage!.goalY,
    );
  }

  private _calcTimeScale(): number {
    if (!this._stage) return 1;
    const targetIndex = this._winnerRank - this._winners.length;
    if (
      this._winners.length < this._winnerRank + 1 &&
      this._goalDist < zoomThreshold
    ) {
      if (
        this._marbles[targetIndex].y >
        this._stage.zoomY - zoomThreshold * 1.2 &&
        (this._marbles[targetIndex - 1] || this._marbles[targetIndex + 1])
      ) {
        return Math.max(0.2, this._goalDist / zoomThreshold);
      }
    }
    return 1;
  }

  private _updateEffects(deltaTime: number) {
    this._effects.forEach((effect) => effect.update(deltaTime));
    this._effects = this._effects.filter((effect) => !effect.isDestroy);
  }

  private _render() {
    if (!this._stage) return;
    const renderParams = {
      camera: this._camera,
      stage: this._stage,
      entities: this.physics.getEntities(),
      marbles: this._marbles,
      winners: this._winners,
      particleManager: this._particleManager,
      effects: this._effects,
      winnerRank: this._winnerRank,
      winner: this._winner,
      size: { x: this._renderer.width, y: this._renderer.height },
      theme: this._theme,
    };
    this._renderer.render(renderParams, this._uiObjects);
  }

  private async _init() {
    console.log('Roulette: _init method called');
    this._recorder = new VideoRecorder(this._renderer.canvas);

    this.physics = new Box2dPhysics();
    await this.physics.init();
    console.log('Roulette: Physics initialized');

    this.addUiObject(new RankRenderer());
    this.attachEvent();
    const minimap = new Minimap();
    minimap.onViewportChange((pos) => {
      if (pos) {
        this._camera.setPosition(pos, false);
        this._camera.lock(true);
      } else {
        this._camera.lock(false);
      }
    });
    this.addUiObject(minimap);
    this.fastForwarder = new FastForwader();
    this.addUiObject(this.fastForwarder);
    this._stage = stages[0];
    this._loadMap();
    console.log('Roulette: Map loaded');
  }

  @bound
  private mouseHandler(eventName: MouseEventName, e: MouseEvent) {
    const handlerName = `on${eventName}` as MouseEventHandlerName;

    const sizeFactor = this._renderer.sizeFactor;
    const pos = { x: e.offsetX * sizeFactor, y: e.offsetY * sizeFactor };
    this._uiObjects.forEach((obj) => {
      if (!obj[handlerName]) return;
      const bounds = obj.getBoundingBox();
      if (!bounds) {
        obj[handlerName]({ ...pos, button: e.button });
      } else if (
        bounds &&
        pos.x >= bounds.x &&
        pos.y >= bounds.y &&
        pos.x <= bounds.x + bounds.w &&
        pos.y <= bounds.y + bounds.h
      ) {
        obj[handlerName]({ x: pos.x - bounds.x, y: pos.y - bounds.y, button: e.button });
      } else {
        obj[handlerName](undefined);
      }
    });
  }

  private attachEvent() {
    ['MouseMove', 'MouseUp', 'MouseDown', 'DblClick'].forEach(
      (ev) => {
        // @ts-ignore
        this._renderer.canvas.addEventListener(ev.toLowerCase().replace('mouse', 'pointer'), this.mouseHandler.bind(this, ev));
      },
    );
    this._renderer.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }

  private _loadMap() {
    if (!this._stage) {
      throw new Error('No map has been selected');
    }

    this.physics.createStage(this._stage);
    this._camera.initializePosition();
  }

  public clearMarbles() {
    this.physics.clearMarbles();
    this._winner = null;
    this._winners = [];
    this._marbles = [];
  }

  public start() {
    this._isRunning = true;
    // setWinningRank로 미리 설정하지 않았으면 (-1) options에서 가져옴
    if (this._winnerRank < 0) {
      this._winnerRank = options.winningRank;
    }
    if (this._winnerRank >= this._marbles.length) {
      this._winnerRank = this._marbles.length - 1;
    }
    this._camera.startFollowingMarbles();

    if (this._autoRecording) {
      this._recorder.start().then(() => {
        this.physics.start();
        this._marbles.forEach((marble) => (marble.isActive = true));
      });
    } else {
      this.physics.start();
      this._marbles.forEach((marble) => (marble.isActive = true));
    }
  }

  public setSpeed(value: number) {
    if (value <= 0) {
      throw new Error('Speed multiplier must larger than 0');
    }
    this._speed = value;
  }

  public setTheme(themeName: keyof typeof Themes) {
    this._theme = Themes[themeName];
  }

  public getSpeed() {
    return this._speed;
  }

  public setWinningRank(rank: number) {
    this._winnerRank = rank;
  }

  public setAutoRecording(value: boolean) {
    this._autoRecording = value;
  }

  public setMarbles(names: string[], seed?: number) {
    this.reset();
    const arr = names.slice();

    let maxWeight = -Infinity;
    let minWeight = Infinity;

    const members = arr
      .map((nameString) => {
        const result = parseName(nameString);
        if (!result) return null;
        const { name, weight, count } = result;
        if (weight > maxWeight) maxWeight = weight;
        if (weight < minWeight) minWeight = weight;
        return { name, weight, count };
      })
      .filter((member) => !!member);

    const gap = maxWeight - minWeight;

    let totalCount = 0;
    members.forEach((member) => {
      if (member) {
        member.weight = 0.1 + (gap ? (member.weight - minWeight) / gap : 0);
        totalCount += member.count;
      }
    });

    // 시드를 사용하여 동일한 순서 보장
    const orders = shuffle(
      Array(totalCount)
        .fill(0)
        .map((_, i) => i),
      seed,
    );
    members.forEach((member) => {
      if (member) {
        for (let j = 0; j < member.count; j++) {
          const order = orders.pop() || 0;
          this._marbles.push(
            new Marble(
              this.physics,
              order,
              totalCount,
              member.name,
              member.weight,
            ),
          );
        }
      }
    });
    this._totalMarbleCount = totalCount;
  }

  private _clearMap() {
    this.physics.clear();
    this._marbles = [];
  }

  public reset() {
    this.clearMarbles();
    this._clearMap();
    this._loadMap();
    this._goalDist = Infinity;
    this._winnerRank = -1; // 다음 게임을 위해 초기화
  }

  public getCount() {
    return this._marbles.length;
  }

  public getMaps() {
    return stages.map((stage, index) => {
      return {
        index,
        title: stage.title,
      };
    });
  }

  public setMap(index: number) {
    if (index < 0 || index > stages.length - 1) {
      throw new Error('Incorrect map number');
    }
    const names = this._marbles.map((marble) => marble.name);
    this._stage = stages[index];
    this.setMarbles(names);
    this._camera.initializePosition();
  }

  // 스펙테이터 모드 설정
  public setSpectatorMode(isSpectator: boolean) {
    this._isSpectator = isSpectator;
  }

  public isSpectatorMode() {
    return this._isSpectator;
  }

  // 호스트가 마블 위치 가져오기
  public getMarblePositions(): MarblePosition[] {
    return this._marbles.map((marble) => ({
      id: marble.id,
      name: marble.name,
      x: marble.x,
      y: marble.y,
      angle: marble.angle,
      hue: marble.hue,
    }));
  }

  // 스펙테이터가 마블 위치 설정
  public setMarblePositions(positions: MarblePosition[]) {
    if (!this._isSpectator) return;

    this._spectatorPositions = positions;

    // 마블 배열 업데이트 (렌더링용)
    positions.forEach((pos) => {
      const marble = this._marbles.find((m) => m.id === pos.id);
      if (marble) {
        // 물리 엔진 위치 직접 설정 (spectator용)
        this.physics.setMarblePosition?.(pos.id, pos.x, pos.y, pos.angle);
      }
    });
  }

  // 승자 설정 (스펙테이터용)
  public setWinner(winnerName: string) {
    const winner = this._marbles.find((m) => m.name === winnerName);
    if (winner) {
      this._winner = winner;
      this._isRunning = false;
      this._particleManager.shot(
        this._renderer.width,
        this._renderer.height,
      );
    }
  }

  // 게임 실행 상태 확인
  public isRunning() {
    return this._isRunning;
  }
}
