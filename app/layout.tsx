import './globals.scss'

import Navbar from './components/Navbar';
import { Providers } from './providers';

export const metadata = {
  title: 'ChainRaise',
  description: 'Crowdfunding campaigns on blockchain'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  )
}
