import './globals.css';
import { Inter, Outfit } from 'next/font/google';
import { clientScriptUrl } from '@/lib/security/client-bundle';
import { getDocumentScriptNonce, scriptNonceProps } from '@/lib/security/request-nonce';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-outfit',
  display: 'swap',
});

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Portfolio Admin',
  icons: {
    icon: [{ url: '/images/favicon.svg', type: 'image/svg+xml' }],
    shortcut: '/images/favicon.svg',
    apple: '/images/favicon.svg',
  },
  manifest: '/images/site.webmanifest',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const nonceProps = scriptNonceProps(getDocumentScriptNonce());
  const mainJs = clientScriptUrl('/js/main.js');
  const prefetchConfig = clientScriptUrl('/js/prefetch-config.js');
  const bootPrefetch = clientScriptUrl('/js/boot-prefetch.js');
  const bodyLoader = clientScriptUrl('/js/body-loader-template.js');

  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${outfit.variable}`}>
      <head>
        {process.env.NODE_ENV === 'development' && (
          <script
            suppressHydrationWarning
            dangerouslySetInnerHTML={{
              __html:
                'window.addEventListener("pageshow",function(e){if(e.persisted)window.location.reload();});',
            }}
          />
        )}
        <link rel="modulepreload" href={mainJs} />
        <script src={prefetchConfig} defer suppressHydrationWarning {...nonceProps} />
        <script src={bootPrefetch} defer suppressHydrationWarning {...nonceProps} />
        <script src={bodyLoader} defer suppressHydrationWarning {...nonceProps} />
      </head>
      <body suppressHydrationWarning>
        <script
          suppressHydrationWarning
          {...nonceProps}
          dangerouslySetInnerHTML={{
            __html: `(function(){var p=location.pathname;if(/\\/(login|forget-password|reset-password)(\\/|$)/.test(p)){document.documentElement.classList.add('pa-auth-route');}})();`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
