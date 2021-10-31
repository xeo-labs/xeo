import { AppProps } from 'next/app';
import Head from 'next/head';
import './styles.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ApolloWrapper } from 'components/Wrappers/ApolloWrapper';
import { IntlWrapper } from 'components/Wrappers/IntlWrapper';
import { SyncContextProvider } from 'context/SyncContext';

function CustomApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Xeo</title>
      </Head>
      <div className="app">
        <IntlWrapper>
          <ApolloWrapper>
            <SyncContextProvider>
              <main>
                <Component {...pageProps} />
              </main>
            </SyncContextProvider>
          </ApolloWrapper>
          <ToastContainer autoClose={3000} />
        </IntlWrapper>
      </div>
    </>
  );
}

export default CustomApp;
