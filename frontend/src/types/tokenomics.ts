export interface TokenomicsData {
  tokenName: string;
  tokenCA: string;
  totalSupply: number;
  circulatingSupply: number;
  treasuryHoldings: number;
  totalDistributed: number;
  totalBuybacks: number;
  totalBurned: number;
  feeRevenueSol: number;
  lastUpdated: string;
  distributionBreakdown: {
    bounties: number;
    treasury: number;
    liquidity: number;
    community: number;
  };
}

export interface TreasuryData {
  solBalance: number;
  fndryBalance: number;
  treasuryWallet: string;
  totalPaidOutFndry: number;
  totalPaidOutSol: number;
  totalPayouts: number;
  totalBuybackAmount: number;
  totalBuybacks: number;
  lastUpdated: string;
}
