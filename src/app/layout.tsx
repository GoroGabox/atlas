import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import CommandPalette from "@/components/CommandPalette";
import CommandPaletteButton from "@/components/CommandPaletteButton";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Atlas del Producto",
  description: "Mapa vivo del software",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${geist.className} bg-gray-950 text-gray-100 min-h-screen`}>
        <nav id="main-nav" className="border-b border-gray-800 px-6 py-4 flex items-center gap-8">
          <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
            <span className="font-bold text-lg tracking-tight text-white">
              🗺️ Atlas
            </span>
          </Link>
          <Link href="/modules" className="text-sm text-gray-400 hover:text-white transition-colors">
            Módulos
          </Link>
          <Link href="/knowledge" className="text-sm text-gray-400 hover:text-white transition-colors">
            Conocimiento
          </Link>
          <Link href="/dependencies" className="text-sm text-gray-400 hover:text-white transition-colors">
            Dependencias
          </Link>
          <Link href="/entities" className="text-sm text-gray-400 hover:text-white transition-colors">
            Entidades
          </Link>
        <div className="ml-auto">
            <CommandPaletteButton />
          </div>
        </nav>
        <CommandPalette />
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}