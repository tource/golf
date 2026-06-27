import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import logoImage from "../../public/logo.png";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "날려보세",
  description: "참여 신청, 방 배정 추첨, 동아리 통계",
  icons: {
    icon: logoImage.src,
    apple: logoImage.src,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
