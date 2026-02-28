import { AuthContextProvider } from './context/auth-context';
import { Providers } from "./providers";

export const metadata = {
  title: 'SmartiTV Admin',
  description: '',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}) {
  return (
    <html lang="en">
      <body>
        <AuthContextProvider>
          <Providers>
            {children}
          </Providers>
        </AuthContextProvider>
      </body>
    </html>
  );
}