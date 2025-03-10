const {ChakraProvider, extendTheme} = require('@chakra-ui/react');
const {QueryClient, QueryClientProvider} = require('@tanstack/react-query');
const {ReactQueryDevtools} = require('@tanstack/react-query-devtools');
const {createRoot} = require('react-dom/client');
// biome-ignore lint/correctness/noUnusedVariables: React is required
const React = require('react');
const App = require('./App.js');

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
      <App/>
    </ChakraProvider>
    <ReactQueryDevtools initialIsOpen={false}/>
  </QueryClientProvider>
);
