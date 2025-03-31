import React from 'react';
import { NftListingData as ThreadNftListingData } from '../thread.types';
import { NftDetailsSection, NftListingData } from '../../../../modules/nft';
import styles from './SectionNftListing.style';

interface SectionNftListingProps {
  listingData?: ThreadNftListingData;
}

/**
 * Component for displaying NFT listings within threads
 * This is now a thin wrapper around the centralized NftDetailsSection
 */
export default function SectionNftListing({ listingData }: SectionNftListingProps) {
  if (!listingData) {
    return null;
  }

  // Convert the thread NftListingData to the module's NftListingData type
  // The main difference is that owner is string | null in thread types
  // and string | undefined in module types
  const convertedListingData: NftListingData = {
    ...listingData,
    owner: listingData.owner || undefined,
  };

  return (
    <NftDetailsSection 
      listingData={convertedListingData}
      containerStyle={styles.container}
    />
  );
}

