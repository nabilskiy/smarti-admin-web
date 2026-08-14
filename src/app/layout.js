import { Manrope } from 'next/font/google';
import { AuthContextProvider } from './context/auth-context';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
});

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'SmartiTV Admin',
  description: 'Админ-панель SmartiTV',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body className={manrope.className}>
        <AuthContextProvider>{children}</AuthContextProvider>
      </body>
    </html>
  );
}
