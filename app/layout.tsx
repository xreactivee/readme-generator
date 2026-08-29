import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  colorScheme: "dark light",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://xrs-readme-generator.vercel.app"),
  title: {
    default: "GitHub Readme Stats Generator | Dynamic GitHub Stats",
    template: "%s | GitHub Readme Stats Generator",
  },
  description: "Elevate your GitHub README with dynamic, beautiful, and real-time statistics powered by Next.js and Puppeteer. Generate custom cards, language stats, and more.",
  applicationName: "GitHub Readme Stats",
  generator: "Next.js",
  keywords: [
    "GitHub",
    "Readme",
    "Stats",
    "Generator",
    "Next.js",
    "Puppeteer",
    "Developer Tools",
    "Open Source",
    "Profile Readme",
    "Widgets",
    "Dynamic SVG",
  ],
  authors: [{ name: "xReactive", url: "https://xreactive.xyz" }],
  creator: "xReactive",
  publisher: "xReactive",
  category: "Developer Tools",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
    languages: {
      "en-US": "/en-US",
      "tr-TR": "/tr-TR",
    },
  },
  openGraph: {
    type: "website",
    url: "https://xrs-readme-generator.vercel.app",
    title: "GitHub Readme Stats Generator",
    description: "Elevate your GitHub README with dynamic, beautiful, and real-time statistics.",
    siteName: "GitHub Readme Stats Generator",
    locale: "en_US",
    alternateLocale: ["tr_TR"],
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "GitHub Readme Stats Generator Preview",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GitHub Readme Stats Generator",
    description: "Elevate your GitHub README with dynamic, beautiful, and real-time statistics.",
    creator: "@xreactive_",
    site: "@xreactive_",
    images: ["/og-image.png"],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "GitHub Stats",
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}