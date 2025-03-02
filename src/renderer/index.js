const { ChakraProvider, extendTheme } = require('@chakra-ui/react');
const { QueryClient, QueryClientProvider } = require('@tanstack/react-query');
const { ReactQueryDevtools } = require('@tanstack/react-query-devtools');
// biome-ignore lint/correctness/noUnusedVariables: React is required
const React = require('react');
const { createRoot } = require('react-dom/client');
const App = require('./App.js');
const { HashRouter } = require('react-router-dom');

const config = {
  initialColorMode: 'dark',
  useSystemColorMode: true,
};

const theme = extendTheme({
  config,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: 5000,
    },
  },
});

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <QueryClientProvider client={queryClient}>
    <ChakraProvider theme={theme}>
      <HashRouter>
        <App />
      </HashRouter>
    </ChakraProvider>
    <ReactQueryDevtools initialIsOpen={false} />
  </QueryClientProvider>
);
