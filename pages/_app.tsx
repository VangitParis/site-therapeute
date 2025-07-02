// pages/_app.tsx
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

import '../styles/globals.css';
import '../styles/siteBuilder.css';
import type { AppProps } from 'next/app';
import Layout from '../components/Layout';

export default function App({ Component, pageProps }: AppProps) {
  // PATCH si un composant tente de lire .getInitialProps
  if ((Component as any).getInitialProps) {
    delete (Component as any).getInitialProps;
  }
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
