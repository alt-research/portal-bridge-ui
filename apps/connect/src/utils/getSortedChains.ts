import { ChainId, ChainName, CHAINS } from "@certusone/wormhole-sdk";

interface TopSymbolsByVolume {
  symbols: {
    tokens: {
      emitter_chain: ChainId;
      volume: string;
    }[];
  }[];
}

export const getSortedChains = async (
  chains: ChainName[],
  signal?: AbortSignal
): Promise<ChainName[]> => {
  try {
    const response: TopSymbolsByVolume = await fetch(
      "https://api.wormholescan.io/api/v1/top-symbols-by-volume?timeSpan=30d",
      { signal, cache: "default" }
    ).then((r) => r.json());

    const volumePerChain = response.symbols
      .map(({ tokens }) => tokens)
      .flat()
      .reduce(
        (total, curr) => ({
          ...total,
          [curr.emitter_chain]: Math.floor(
            (total[curr.emitter_chain] || 0) + Number(curr.volume)
          ),
        }),
        {} as Record<ChainId, number>
      );

    const getChainScore = (chainName: ChainName): number =>
      volumePerChain[CHAINS[chainName]] || 0;

    return [...chains].sort((a, b) => getChainScore(b) - getChainScore(a));
  } catch {
    return chains;
  }
};
