import { Box, Heading, Text, Image } from '@chakra-ui/react';
import { Ipfs } from './Ipfs';
import { Dapps } from './DApps';
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
        <Image src={icon} height="26px" mr="2" />
        <Heading size="md">Synthetix Node</Heading>
      </Box>
      <Box px="5" flex="1" overflowY="auto">
        <Ipfs />
      </Box>
      <Box p="1">
        <Dapps />
      </Box>
      <Box background="whiteAlpha.100" p="1">
        <Text align="center" opacity="0.5" fontSize="xs">
          alpha version
        </Text>
      </Box>
    </Box>
  );
}
