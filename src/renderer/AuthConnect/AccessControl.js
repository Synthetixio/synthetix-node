const React = require('react');
const { usePermissions } = require('./usePermissions');
const { useSubmitApplicationMutation } = require('./useSubmitApplicationMutation');
const { useWithdrawApplicationMutation } = require('./useWithdrawApplicationMutation');
const { Skeleton, Button, Box, Stack, Heading, VStack } = require('@chakra-ui/react');

function AccessControl() {
  const permissions = usePermissions();
  const submitApplicationMutation = useSubmitApplicationMutation();
  const withdrawApplicationMutation = useWithdrawApplicationMutation();

  const isLoading =
    permissions.isFetching ||
    submitApplicationMutation.isPending ||
    withdrawApplicationMutation.isPending;

  let content;
  switch (true) {
    case isLoading:
      content = (
        <Skeleton
          height="20px"
          width="100%"
          bg="gray.600"
          startColor="gray.500"
          endColor="gray.700"
        />
      );
      break;
    case permissions.data.isPending:
      content = (
        <VStack spacing={4} align="start">
          <Heading size="md">Please wait for approval</Heading>
          <Button
            colorScheme="teal"
            variant="outline"
            onClick={() => withdrawApplicationMutation.mutate()}
          >
            Renounce assigned role
          </Button>
        </VStack>
      );
      break;
    default:
      content = (
        <VStack spacing={4} align="start">
          <Heading size="md">Access Control</Heading>
          <Button
            colorScheme="teal"
            variant="outline"
            onClick={() => submitApplicationMutation.mutate()}
          >
            Apply for whitelist
          </Button>
        </VStack>
      );
  }

  return (
    <Stack spacing={6} padding={5} boxShadow="md" borderRadius="md">
      <Box>{content}</Box>
    </Stack>
  );
}

module.exports = { AccessControl };
