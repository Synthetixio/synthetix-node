import {
  Box,
  Button,
  Heading,
  Image,
  Link,
  Spinner,
  Stack,
} from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { useDapp } from './useDapp';
import { DAPPS, DappType } from '../../dapps';
import { useQuery } from '@tanstack/react-query';

function DappButton({ dapp }: { dapp: DappType }) {
  const { data: url } = useDapp(dapp.id);
  const { data: src } = useQuery({
    queryKey: ['icon', dapp.id],
    queryFn: async () => {
      const { default: icon } = await dapp.icon();
      return icon;
    },
    initialData: () => '',
    placeholderData: '',
  });
  return (
    <Button
      as={Link}
      href={url}
      target="_blank"
      aria-label={dapp.label}
      variant="outline"
      colorScheme="teal"
      leftIcon={<Image src={src} alt={dapp.label} width="1em" />}
      rightIcon={url ? <ExternalLinkIcon /> : <Spinner size="xs" />}
      isDisabled={!url}
      _hover={{ textDecoration: 'none' }}
    >
      {dapp.label}
    </Button>
  );
}

export function Dapps() {
  return (
    <Box pt="4" px="4" pb="4">
      <Box flex="1" p="0">
        <Heading mb="3" size="sm">
          Available DApps:
        </Heading>
        <Stack direction="row" spacing={6} justifyContent="start" mb="2">
          {DAPPS.map((dapp) => (
            <DappButton key={dapp.id} dapp={dapp} />
          ))}
        </Stack>
      </Box>
    </Box>
  );
}
