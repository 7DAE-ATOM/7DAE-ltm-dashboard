import type { Metadata } from "next";
import Header from "@/components/Header";
import Providers from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Airbus Test Bench Catalog",
  description: "Visual catalog of Airbus test benches",
};

const themeInitScript = `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

/* Catalogue grid density, applied before the first paint for the same reason
 * as the theme above: the grid template reads `--cat-cols`, so resolving it
 * after hydration would paint five columns and then jump.
 *
 * The allowed-value lists below are duplicated from `COLUMN_OPTIONS` /
 * `ROW_OPTIONS` in `lib/catalogueDensity.ts` and must be kept in sync by
 * hand — this runs as a raw string before any module is loaded, so it cannot
 * import them. */
const densityInitScript = `(function(){var c=5,r=5;try{var s=JSON.parse(localStorage.getItem('catalogue-density'));if(s){if([3,5,8].indexOf(s.columns)>=0)c=s.columns;if(s.rows==='all'||(Number.isInteger(s.rows)&&s.rows>=1&&s.rows<=10))r=s.rows;}}catch(e){}var d=document.documentElement;d.setAttribute('data-cat-cols',String(c));d.setAttribute('data-cat-rows',String(r));d.style.setProperty('--cat-cols',String(c));})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      data-cat-cols="5"
      data-cat-rows="5"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script dangerouslySetInnerHTML={{ __html: densityInitScript }} />
      </head>
      <body className="theme-industrial-premium">
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
