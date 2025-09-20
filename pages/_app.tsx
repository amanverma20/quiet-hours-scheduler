import type { AppProps } from 'next/app';
import { AuthProvider } from '../components/AuthProvider';
import '../pages/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}