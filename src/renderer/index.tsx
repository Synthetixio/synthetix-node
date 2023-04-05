import { createRoot } from 'react-dom/client';
import {
  ChakraProvider,
  extendTheme,
  type ThemeConfig,
} from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};
const theme = extendTheme({ config });

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: 5000,
      refetchOnWindowFocus: true,
    },
  },
});

const container = document.getElementById('root')!;
const root = createRoot(container);
root.render(
  <QueryClientProvider client={queryClient}>
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
    <ReactQueryDevtools initialIsOpen={false} />
  </QueryClientProvider>
);
