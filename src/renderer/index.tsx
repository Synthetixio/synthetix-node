import { createRoot } from 'react-dom/client';
import {
  ChakraProvider,
  extendTheme,
  type ThemeConfig,
} from '@chakra-ui/react';
import App from './App';

const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};
const theme = extendTheme({ config });

const container = document.getElementById('root')!;
const root = createRoot(container);
root.render(
  <ChakraProvider theme={theme}>
    <App />
  </ChakraProvider>
);
