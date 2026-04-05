/**
 * Pulls in Vue Language Service helper types so the TS program used by the IDE
 * knows `__VLS_*` symbols referenced from generated SFC template code.
 * @see https://github.com/vuejs/language-tools
 */
/* eslint-disable @typescript-eslint/triple-slash-reference -- subpath not exposed as package import */
/// <reference path="../node_modules/@vue/language-core/types/template-helpers.d.ts" />

export {};

declare global {
  /** Some tooling still names the intrinsic tag namespace this way (alias of `__VLS_intrinsics`). */
  const __VLS_intrinsicElements: Record<string, any>;
  function __VLS_elementAsFunctionalComponent(..._args: any[]): any;
  function __VLS_pickFunctionalComponentCtx(..._args: any[]): any;
}
