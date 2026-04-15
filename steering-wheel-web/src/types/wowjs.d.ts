declare module 'wow.js' {
  export interface WowOptions {
    boxClass?: string;
    animateClass?: string;
    offset?: number;
    mobile?: boolean;
    live?: boolean;
    callback?: (el: HTMLElement) => void;
    scrollContainer?: string | null;
  }

  export default class WOW {
    constructor(options?: WowOptions);
    init(): void;
    sync(): void;
    stop(): void;
  }
}
