import { RenderParameters } from './rouletteRenderer.ts';
import { Rect } from './types/rect.type.ts';
import { MouseEventArgs, UIObject } from './UIObject.ts';
import ffImg from '../../../assets/images/ff.svg';

export class FastForwader implements UIObject {
  private bound: Rect = {
    x: 0,
    y: 0,
    w: 0,
    h: 0,
  };
  private icon: HTMLImageElement;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.icon = new Image();
    // 👇 [중요] 이미지 경로 수정 (상대 경로가 맞아야 에러가 안 남)
    this.icon.src = ffImg;

    this.attachEvents();
  }

  private isEnabled: boolean = false;

  public get speed(): number {
    return this.isEnabled ? 4 : 1;
  }

  // 이벤트 핸들러 (사용하지 않는 변수는 _ prefix)
  private onInputDown = (_e: Event) => {
    this.isEnabled = true;
  };

  private onInputUp = (_e: Event) => {
    this.isEnabled = false;
  };

  private attachEvents() {
    this.canvas.addEventListener('touchstart', this.onInputDown, { passive: true });
    this.canvas.addEventListener('mousedown', this.onInputDown);
    window.addEventListener('touchend', this.onInputUp);
    window.addEventListener('mouseup', this.onInputUp);
  }

  // 리스너 제거
  public destroy() {
    this.canvas.removeEventListener('touchstart', this.onInputDown);
    this.canvas.removeEventListener('mousedown', this.onInputDown);
    window.removeEventListener('touchend', this.onInputUp);
    window.removeEventListener('mouseup', this.onInputUp);
  }

  update(_deltaTime: number): void { }

  render(ctx: CanvasRenderingContext2D, _params: RenderParameters, width: number, height: number): void {
    this.bound.w = width / 2;
    this.bound.h = height / 2;
    this.bound.x = this.bound.w / 2;
    this.bound.y = this.bound.h / 2;

    const centerX = this.bound.x + this.bound.w / 2;
    const centerY = this.bound.y + this.bound.h / 2;

    if (this.isEnabled) {
      try {
        ctx.save();
        ctx.strokeStyle = 'white';
        ctx.globalAlpha = 0.5;
        // 이미지가 로드되지 않았어도 에러가 나지 않도록 처리
        if (this.icon.complete && this.icon.naturalWidth !== 0) {
          ctx.drawImage(this.icon, centerX - 100, centerY - 100, 200, 200);
        }
        ctx.restore();
      } catch (e) {
        console.error("FastForwarder Render Error:", e);
      }
    }
  }

  getBoundingBox(): Rect | null {
    return this.bound;
  }

  onMouseDown?(_e?: MouseEventArgs): void { }
  onMouseUp?(_e?: MouseEventArgs): void { }
}