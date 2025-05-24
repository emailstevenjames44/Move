import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { MainLayout } from '@/components/main-layout'; // Adjust path if needed


const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Moving Quote Generator",
  description: "Get accurate moving quotes by taking photos of your furniture",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Load TensorFlow.js and COCO-SSD model scripts directly in the HTML */}
        <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.20.0/dist/tf.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.2/dist/coco-ssd.min.js"></script>
      </head>
      <body className={inter.className}>
        <ThemeProvider
            attribute="class"
            defaultTheme="system" // Changed to system as per example
            enableSystem
            disableTransitionOnChange
        >
          <MainLayout>
            {children}
          </MainLayout>
        </ThemeProvider>
      </body>
    </html>
  )
}
