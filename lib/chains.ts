export const chains = {
  ethereum: { label: "Ethereum", network: "eth-mainnet", nftNetwork: "eth-mainnet", openSeaNetwork: "ethereum", short: "ETH", color: "#8b93ff", explorer: "https://etherscan.io" },
  robinhood: { label: "Robinhood", network: "robinhood-mainnet", nftNetwork: "robinhood-mainnet", openSeaNetwork: "robinhood", short: "RH", color: "#62e7e2", explorer: "https://robinhoodchain.blockscout.com" },
  base: { label: "Base", network: "base-mainnet", nftNetwork: "base-mainnet", openSeaNetwork: "base", short: "BASE", color: "#4b8bff", explorer: "https://basescan.org" },
  arbitrum: { label: "Arbitrum", network: "arb-mainnet", nftNetwork: "arb-mainnet", openSeaNetwork: "arbitrum", short: "ARB", color: "#8fa8ff", explorer: "https://arbiscan.io" },
  ink: { label: "Ink", network: "ink-mainnet", nftNetwork: "ink-mainnet", openSeaNetwork: "ink", short: "INK", color: "#9d7bff", explorer: "https://explorer.inkonchain.com" },
} as const;

export type ChainId = keyof typeof chains;

export function alchemyUrl(chain: ChainId, key: string) {
  return `https://${chains[chain].network}.g.alchemy.com/v2/${key}`;
}

export function alchemyNftUrl(chain: ChainId, key: string, contract: string) {
  return `https://${chains[chain].nftNetwork}.g.alchemy.com/nft/v3/${key}/getOwnersForContract?contractAddress=${contract}&withTokenBalances=true`;
}

export function isAddress(value: string) { return /^0x[a-fA-F0-9]{40}$/.test(value); }
