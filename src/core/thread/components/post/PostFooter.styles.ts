import {StyleSheet} from 'react-native';
import COLORS from '@/assets/colors'; // Adjust path if needed
import TYPOGRAPHY from '@/assets/typography'; // Adjust path if needed

export function createPostFooterStyles(
  overrideStyles?: {[key: string]: object},
  userStyleSheet?: {[key: string]: object},
): {[key: string]: any} {
  const baseStyles: {[key: string]: any} = StyleSheet.create({
    /* Footer (icon row + reply button) - Migrated from thread.styles.ts */
    footerContainer: {
      marginTop: 6,
      width: '100%',
      alignItems: 'flex-start',
      ...overrideStyles?.footerContainer,
    },
    itemIconsRow: {
      width: '100%', // Consider making this customizable
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
      gap: 16,
      ...overrideStyles?.itemIconsRow,
    },
    itemLeftIcons: {
      flexDirection: 'row',
      gap: 6,
      alignItems: 'center',
      ...overrideStyles?.itemLeftIcons,
    },
    itemRightIcons: {
      flexDirection: 'row',
      gap: 16,
      alignItems: 'center',
      ...overrideStyles?.itemRightIcons,
    },
    iconText: {
      fontSize: 12,
      color: COLORS.accessoryDarkColor,
      marginLeft: -2,
      fontFamily: TYPOGRAPHY.fontFamily,
      ...overrideStyles?.iconText,
    },
  });

  // Merge userStyleSheet if provided (using the utility function)
  const mergedStyles = mergeStyles(baseStyles, userStyleSheet);

  // Merge explicit overrideStyles last
  return mergeStyles(mergedStyles, overrideStyles);
}

// Utility function to merge style objects (can be moved to a shared utils file)
function mergeStyles(base: any, overrides?: any): any {
  if (!overrides) {
    return base;
  }

  const merged: {[key: string]: any} = {};
  Object.keys(base).forEach(key => {
    merged[key] = StyleSheet.flatten([base[key], overrides[key]]);
  });

  // Add any keys from overrides that are not in base
  Object.keys(overrides).forEach(key => {
    if (!merged[key]) {
      merged[key] = overrides[key];
    }
  });

  return merged;
} 