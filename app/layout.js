import './globals.css';
import { Inter } from 'next/font/google';
import Providers from './providers';
import Navbar from './components/Navbar'; // Import the Navbar

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'FileShare App',
  description: 'Securely share images and code.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-sky-50`}>
        <Providers>
          <Navbar /> {/* Add the Navbar here */}
          <main>{children}</main> {/* Page content will be rendered here */}
        </Providers>
      </body>
    </html>
  );
}