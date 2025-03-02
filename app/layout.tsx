import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import ThemeToggler from "@/components/ThemeToggler";
import { FileStructureLoader } from '@/components/FileStructureLoader';
import Sidebar from '@/components/Sidebar';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'File Manager',
  description: 'A modern, minimal file management system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-earth-50 text-earth-900`}>
        <div className="flex h-screen">
          <FileStructureLoader />
          <main className="flex-1 p-0 overflow-x-hidden relative">
            <div className="absolute bottom-4 right-4">
              <ThemeToggler />
            </div>
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
