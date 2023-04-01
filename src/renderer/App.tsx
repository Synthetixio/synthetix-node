import { Box, Heading, Text } from '@chakra-ui/react';
import { MemoryRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Ipfs from './components/Ipfs';

export default function App() {
  return (
    <Router>
      <Box display="flex" flexDirection="column" minHeight="100vh">
        <Box background="blackAlpha.300" px="3" py="2" display="flex">
          <Heading size="md">Synthetix Node</Heading>
          <Box ml="auto">
            <Link to="/ipfs">IPFS</Link>
          </Box>
        </Box>
        <Box px="3" flex="1" overflowY="auto">
          <Routes>
            <Route path="/ipfs" element={<Ipfs />} />
          </Routes>
        </Box>
        <Box background="blackAlpha.300" p="1">
          <Text align="center" opacity="0.5" fontSize="sm">
            alpha version
          </Text>
        </Box>
      </Box>
    </Router>
  );
}
