const { ExternalLinkIcon } = require('@chakra-ui/icons');
const { Box, Button, Flex, Heading, Image, Link, Skeleton, Spinner } = require('@chakra-ui/react');
// biome-ignore lint/correctness/noUnusedVariables: React is required
const React = require('react');
const { useDapps } = require('./useDapps');

function DappButton({ dapp }) {
  return (
    <Button
      as={Link}
      href={dapp.url}
      target="_blank"
      aria-label={dapp.label}
      variant="outline"
      colorScheme="teal"
      leftIcon={<Image src={dapp.icon} alt={dapp.label} width="1em" />}
      rightIcon={dapp.url ? <ExternalLinkIcon /> : <Spinner size="xs" />}
      isDisabled={!dapp.url}
      _hover={{ textDecoration: 'none' }}
      flexGrow={1}
      maxWidth="36%"
    >
      {dapp.label}
    </Button>
  );
}

function Dapps() {
  const { data: dapps } = useDapps();
  return (
    <Box p="4">
      <Heading mb="3" size="sm">
        Available DApps:
      </Heading>
      <Flex gap={2} mb="2" flexWrap="wrap">
        {dapps.length > 0 ? (
          dapps.map((dapp) => <DappButton key={dapp.id} dapp={dapp} />)
        ) : (
          <Skeleton w="full" height={8} />
        )}
      </Flex>
    </Box>
  );
}

module.exports = {
  DappButton,
  Dapps,
};
