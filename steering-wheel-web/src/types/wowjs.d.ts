declare module 'wow.js' {
  export interface WowOptions {
    boxClass?: string;
    animateClass?: string;
    offset?: number;
    mobile?: boolean;
    live?: boolean;
    callback?: (_el: HTMLElement) => void;
    scrollContainer?: string | null;
  }

  export default class WOW {
    constructor(_options?: WowOptions);
    init(): void;
    sync(): void;
    stop(): void;
  }
}
