import { AuthContextProvider } from './context/auth-context';
import { Providers } from "./providers";

export const metadata = {
  title: 'Firebase Simple App',
  description: '',
}

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