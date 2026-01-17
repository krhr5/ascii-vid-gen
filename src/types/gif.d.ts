declare module 'gif.js' {
  interface GIFOptions {
    workers?: number;
    quality?: number;
    width?: number;
    height?: number;
    workerScript?: string;
    transparent?: number;
    background?: string;
    repeat?: number;
    dither?: boolean | string;
  }

  interface FrameOptions {
    delay?: number;
    copy?: boolean;
    dispose?: number;
  }

  class GIF {
    constructor(options?: GIFOptions);
    addFrame(
      element: HTMLImageElement | HTMLCanvasElement | CanvasRenderingContext2D | ImageData,
      options?: FrameOptions
    ): void;
    on(event: 'finished', callback: (blob: Blob) => void): void;
    on(event: 'progress', callback: (progress: number) => void): void;
    on(event: 'start', callback: () => void): void;
    on(event: 'abort', callback: () => void): void;
    render(): void;
    abort(): void;
  }

  export default GIF;
}
