import React from 'react';
import { PageLayout } from '../components/layout/PageLayout';
import { TokenomicsPage as TokenomicsContent } from '../components/tokenomics/TokenomicsPage';

export function TokenomicsPage() {
  return (
    <PageLayout>
      <TokenomicsContent />
    </PageLayout>
  );
}

export default TokenomicsPage;
