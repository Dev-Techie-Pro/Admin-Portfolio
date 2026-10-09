/** Move keyboard focus to main content after client-side page boot (a11y). */
export function focusMainContent() {
  if (typeof document === 'undefined') return;
  const main =
    document.getElementById('pa-main-content')
    || document.querySelector<HTMLElement>('main')
    || document.querySelector<HTMLElement>('.pa-main');
  if (main) {
    if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
    main.focus({ preventScroll: true });
  }
}
