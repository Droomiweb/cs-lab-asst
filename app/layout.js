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
      {/* --- MODIFIED: Changed background color --- */}
      <body className={`${inter.className} bg-gray-100`}>
        <Providers>
          <Navbar /> 
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}