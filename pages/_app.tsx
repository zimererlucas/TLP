/**
 * _app.tsx - Configuração global da aplicação Next.js
 * Substitui a configuração global do PHP original
 */

import type { AppProps } from 'next/app';
import Head from 'next/head';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Biblioteca Escolar - Sistema de Gestão</title>
        
        {/* Bootstrap CSS */}
        <link 
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" 
          rel="stylesheet" 
        />
        
        {/* Font Awesome para ícones */}
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" 
        />
      </Head>
      
      <Component {...pageProps} />
      
      {/* Bootstrap JS */}
      <script 
        src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"
        async
      />
    </>
  );
}
