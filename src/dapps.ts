export type DappType = {
  id: string;
  label: string;
  icon: () => Promise<{ default: string }>;
  ens?: string;
  ipns?: string;
  qm?: string;
  bafy?: string;
  url?: string;
};

export const DAPPS: DappType[] = [
  {
    id: 'kwenta',
    label: 'Kwenta',
    icon: () => import('./kwenta.svg'),
    ens: 'kwenta.eth',
    ipns: undefined,
    qm: undefined,
    bafy: undefined,
    url: undefined,
  },
  {
    id: 'staking',
    label: 'Staking V2',
    icon: () => import('./synthetix.svg'),
    ens: 'staking.synthetix.eth',
    ipns: 'k2k4r8jvf8qlg4ytq7y3ta749vkjzms0hisd9i92ohk0lsp0yestbhy3',
    qm: undefined,
    bafy: undefined,
    url: undefined,
  },
  {
    id: 'watcher',
    label: 'Perps V2 Watcher',
    icon: () => import('./synthetix.svg'),
    ens: undefined,
    ipns: 'k2k4r8pf9z20v99lm731p2d8vp0lg6w3sics8iot60mvjyret5tzfefl',
    qm: undefined,
    bafy: undefined,
    url: undefined,
  },
];
