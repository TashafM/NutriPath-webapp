import { Inter } from "next/font/google";
import "./globals.css";

// Helvetica Neue is licensed and only installed on Apple devices; Inter is the closest free stand-in elsewhere.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

const title = "The NutriPath | A more personal path to better health";
const description =
  "Personalized nutrition support for weight management, PCOS, healthy weight gain and sustainable lifestyle changes. Begin your journey with The NutriPath.";
// Social previews need absolute image URLs; set NEXT_PUBLIC_SITE_URL to the live domain when deploying.
const ogImage = { url: "/og-image.jpg", width: 1200, height: 630, alt: "Nutritionist writing a weekly meal plan beside a bowl of fresh fruit" };

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title,
  description,
  applicationName: "The NutriPath",
  keywords: ["nutritionist", "weight management", "PCOS nutrition", "healthy weight gain", "personalized nutrition"],
  openGraph: { type: "website", siteName: "The NutriPath", title, description, images: [ogImage] },
  twitter: { card: "summary_large_image", title, description, images: [ogImage.url] },
};

export const viewport = { themeColor: "#22301b" };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
