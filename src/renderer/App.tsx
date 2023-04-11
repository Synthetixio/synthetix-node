import { Box, Heading, Text, Image } from '@chakra-ui/react';
import { Ipfs } from './components/Ipfs';
import icon from '../../assets/icon.svg';

export default function App() {
  return (
    <Box display="flex" flexDirection="column" minHeight="100vh">
      <Box
        sx={{
          WebkitUserSelect: 'none',
          WebkitAppRegion: 'drag',
        }}
        background="whiteAlpha.100"
        px="5"
        py="3"
        display="flex"
      >
        <Image src={icon} height="16px" mt="1" mr="2" />
        <Heading size="md">Synthetix Node</Heading>
      </Box>
      <Box px="5" flex="1" overflowY="auto">
        <Ipfs />
      </Box>
      <Box background="whiteAlpha.100" p="1">
        <Text align="center" opacity="0.5" fontSize="xs">
          alpha version
        </Text>
      </Box>
    </Box>
  );
}
