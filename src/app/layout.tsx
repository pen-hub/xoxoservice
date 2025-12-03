import AppContext from "@/app/context";
import "antd/dist/reset.css";

import "@/styles/globals.css";
import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";

export const metadata: Metadata = {
  title: {
    default: "XOXO - Hệ thống quản lý sửa chữa và dịch vụ",
    template: "%s | XOXO",
  },
  metadataBase: new URL("https://xoxo-olive.vercel.app"),
  description:
    "Hệ thống quản lý sửa chữa và dịch vụ toàn diện cho doanh nghiệp của bạn.",
  abstract:
    "Hệ thống quản lý sửa chữa và dịch vụ toàn diện cho doanh nghiệp của bạn.",
  creator: "Nguyễn Tuấn Anh",
  applicationName: "XOXO",
  classification: "Business",
  openGraph: {
    type: "website",
    determiner: "auto",
    locale: "vi_VN",
    title: "XOXO - Hệ thống quản lý sửa chữa và dịch vụ",
    description:
      "Hệ thống quản lý sửa chữa và dịch vụ toàn diện cho doanh nghiệp của bạn.",
    images: [
      {
        url: "https://xoxo-olive.vercel.app/logo.png",
        width: 1200,
        height: 630,
        alt: "XOXO - Hệ thống quản lý sửa chữa và dịch vụ",
        type: "svg/xml",
        secureUrl: "https://xoxo-olive.vercel.app/logo.png",
      },
    ],
    siteName: "XOXO",
    url: "https://xoxo-olive.vercel.app",
  },
  other: {
    "fb:app_id": "801337449357518",
    "google-site-verification": "google707ff5b314e716e9.html",
  },
  twitter: {
    title: "XOXO - Hệ thống quản lý sửa chữa và dịch vụ",
    description:
      "Hệ thống quản lý sửa chữa và dịch vụ toàn diện cho doanh nghiệp của bạn.",
    site: "@tuananh31j",
    creator: "@tuananh31j",
    card: "summary_large_image",
    images: [
      {
        url: "https://xoxo-olive.vercel.app/logo.png",
      },
    ],
  },
  appleWebApp: {
    title: "XOXO",
    statusBarStyle: "black-translucent",
    startupImage: [
      "https://xoxo-olive.vercel.app/logo.png",
      {
        url: "https://xoxo-olive.vercel.app/logo.png",
        media: "(prefers-color-scheme: dark)",
      },
    ],
  },
  category: "Technology",
  authors: [
    {
      name: "Nguyễn Tuấn Anh",
      url: "https://xoxo-olive.vercel.app/blog",
    },
  ],
  generator: "Next.js",
  referrer: "origin",
  publisher: "Vercel",
  manifest: "/manifest.json",

  alternates: {
    canonical: "https://xoxo-olive.vercel.app",
    types: {
      "application/rss+xml": [
        {
          title: "RSS Feed",
          url: `https://xoxo-olive.vercel.app/blog/rss.xml`,
        },
      ],
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-playfair",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const viewport: Viewport = {
  colorScheme: "normal",
  themeColor: [
    {
      media: "(prefers-color-scheme: light)",
      color: "#F9F9F9",
    },
    {
      media: "(prefers-color-scheme: dark)",
      color: "#1f1d24",
    },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  return (
    <html
      lang="vi"
      className="text-[12px] md:text-[14px] lg:text-[16px]"
      suppressHydrationWarning
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${playfair.variable}`} id="root">
        <AppContext>{children}</AppContext>
      </body>
    </html>
  );
};

export default RootLayout;
