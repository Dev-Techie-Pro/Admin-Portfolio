import type ApexChartsType from 'apexcharts';

export {};

declare global {
  interface Window {
    /** Mounted by body-loader-template before main.js loads. */
    __paEnsureBodyLoader?: (show: boolean, message?: string) => HTMLElement | null;
    /** Legacy app boot/teardown API from public/js/main.js. */
    __paBootPortfolioApp?: () => Promise<unknown>;
    __paTeardownPortfolioApp?: (options?: { keepShell?: boolean }) => void;
    /** Injected by /js/vendor/apexcharts.min.js when charts are needed. */
    ApexCharts?: typeof ApexChartsType;
  }
}
