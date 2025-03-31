import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Link from 'next/link';
import "./globals.css";
import Providers from './providers';

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "FlavorFinder",
  description: "A recipe and restaurant finder",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={poppins.className}>
        <Providers>
          <nav className="bg-purple-800 p-4">
            <div className="max-w-4xl mx-auto flex gap-6">
              <Link href="/" className="text-white hover:text-purple-200">
                Recipes
              </Link>
              <Link
                href="/restaurants"
                className="text-white hover:text-purple-200"
              >
                Restaurants
              </Link>
            </div>
          </nav>
          {children}
        </Providers>
      </body>
    </html>
  );
}