const React = require('react');
const { Skeleton, Box, Heading, Text } = require('@chakra-ui/react');

function WalletsList({ title, data, isFetching, isError }) {
  if (isFetching) {
    return <Skeleton height="5" />;
  }

  if (isError) {
    return (
      <Text color="red.500" fontSize="md" mt={2}>
        Error fetching wallets
      </Text>
    );
  }

  return (
    <Box bg="gray.700" p={4} borderRadius="md" boxShadow="sm" mt={4}>
      <Heading as="h4" size="md" color="gray.200" mb={3}>
        {title}:
      </Heading>
      <Box as="ol" pl={4} ml={2}>
        {data?.length > 0 ? (
          data.map(({ id }) => (
            <Box
              as="li"
              key={id}
              mb={2}
              color="gray.300"
              _last={{ mb: 0 }}
              overflow="hidden"
              whiteSpace="nowrap"
              textOverflow="ellipsis"
            >
              <Text>{id}</Text>
            </Box>
          ))
        ) : (
          <Text fontSize="lg" color="gray.400" textAlign="center">
            No wallets
          </Text>
        )}
      </Box>
    </Box>
  );
}

module.exports = { WalletsList };
