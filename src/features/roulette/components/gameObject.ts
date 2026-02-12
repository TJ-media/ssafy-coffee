import { ColorTheme } from './types/ColorTheme.ts';

export interface GameObject {
  isDestroy: boolean;

  update(deltaTime: number): void;

  render(ctx: CanvasRenderingContext2D, zoom: number, theme: ColorTheme): void;
}
