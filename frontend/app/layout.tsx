import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Study Mog — Stay Locked In",
  description: "Multiplayer Pomodoro accountability. Stay locked in. Catch your friends slacking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
