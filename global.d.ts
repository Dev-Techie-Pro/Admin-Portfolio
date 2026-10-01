import type ApexChartsType from 'apexcharts';

export {};

declare global {
  interface Window {
    /** Mounted by body-loader-template before main.js loads. */
    __paEnsureBodyLoader?: (show: boolean, message?: string) => HTMLElement | null;
    /** Legacy app boot/teardown API from public/js/main.js. */
    __paBootPortfolioApp?: () => Promise<unknown>;
    __paTeardownPortfolioApp?: (options?: { keepShell?: boolean }) => void;
    /** True after the first successful client boot (subsequent boots keep shell chrome). */
    __paBooted?: boolean;
    /** Registered by boot-prefetch.js to warm API data for a route. */
    __paStartPrefetch?: (path: string) => void;
    /** Dev hook: last mounted page module instance. */
    __paDebug?: { pageModule: unknown; page: string };
    /** One-time document listeners for custom pa-select dropdowns. */
    __paSelectDocBound?: boolean;
    /** Injected by /js/vendor/apexcharts.min.js when charts are needed. */
    ApexCharts?: typeof ApexChartsType;
    /** Set by public/js/prefetch-config.js before boot-prefetch and main load. */
    __paPrefetchConfig?: {
      PAGE_KEYS: Record<string, string[]>;
      ROUTE_BY_KEY: Record<string, string>;
      resolvePage: (path: string) => string;
    };
  }
}
