import WOW, { type WowOptions } from 'wow.js';
import 'animate.css';

export type WowController = {
  init: () => void;
  sync: () => void;
  stop: () => void;
};

const DEFAULT_WOW_OPTIONS: WowOptions = {
  boxClass: 'wow',
  animateClass: 'animate__animated',
  offset: 48,
  mobile: true,
  live: true,
};

export const createWowController = (options?: WowOptions): WowController => {
  let wowInstance: InstanceType<typeof WOW> | null = null;

  const init = (): void => {
    if (typeof window === 'undefined') return;
    if (wowInstance) return;
    wowInstance = new WOW({
      ...DEFAULT_WOW_OPTIONS,
      ...options,
    });
    wowInstance.init();
  };

  const sync = (): void => {
    wowInstance?.sync();
  };

  const stop = (): void => {
    wowInstance?.stop();
    wowInstance = null;
  };

  return {
    init,
    sync,
    stop,
  };
};
