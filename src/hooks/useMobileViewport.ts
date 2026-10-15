import { useEffect } from 'react';

export function mobileViewportState(layoutHeight: number, visibleHeight: number, inputFocused: boolean) {
  return {
    height: Math.max(0, visibleHeight),
    keyboardOpen: inputFocused && layoutHeight - visibleHeight > Math.max(120, layoutHeight * 0.2),
  };
}

/** Keep touch navigation and sheets out of the phone's software keyboard. */
export function useMobileViewport() {
  useEffect(() => {
    const root = document.documentElement;
    let baseline = window.innerHeight;
    const update = () => {
      const active = document.activeElement;
      const editing = active instanceof HTMLElement && active.matches('input:not([type="checkbox"]):not([type="file"]), textarea, [contenteditable="true"]');
      baseline = editing ? Math.max(baseline, window.innerHeight) : window.innerHeight;
      const viewport = mobileViewportState(baseline, window.visualViewport?.height ?? window.innerHeight, editing);
      root.style.setProperty('--visible-height', `${viewport.height}px`);
      root.style.setProperty('--visible-top', `${window.visualViewport?.offsetTop ?? 0}px`);
      root.dataset.keyboard = viewport.keyboardOpen ? 'open' : 'closed';
    };
    update();
    window.visualViewport?.addEventListener('resize', update);
    window.visualViewport?.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    document.addEventListener('focusin', update);
    document.addEventListener('focusout', update);
    return () => {
      window.visualViewport?.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      document.removeEventListener('focusin', update);
      document.removeEventListener('focusout', update);
      delete root.dataset.keyboard;
      root.style.removeProperty('--visible-height');
      root.style.removeProperty('--visible-top');
    };
  }, []);
}
