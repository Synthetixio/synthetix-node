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
import kwentaIcon from './kwenta.svg';
import stakingIcon from './staking.svg';
import { useDapp } from './useDapp';

function DappButton({
  ens,
  label,
  icon,
}: {
  ens: string;
  label: string;
  icon: string;
}) {
  const { data: url } = useDapp(ens);
  return (
    <Button
      as={Link}
      href={url}
      target="_blank"
      aria-label={label}
      variant="outline"
      colorScheme="teal"
      leftIcon={<Image src={icon} alt={label} width="1em" />}
      rightIcon={url ? <ExternalLinkIcon /> : <Spinner size="xs" />}
      isDisabled={!url}
      _hover={{ textDecoration: 'none' }}
    >
      {label}
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
          <DappButton ens="kwenta.eth" label="Kwenta" icon={kwentaIcon} />
          <DappButton
            ens="staking.synthetix.eth"
            label="Staking V2"
            icon={stakingIcon}
          />
        </Stack>
      </Box>
    </Box>
  );
}
