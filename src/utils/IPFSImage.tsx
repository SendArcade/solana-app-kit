import React, { useState, useEffect, useRef } from 'react';
import { Image, Platform, ImageProps } from 'react-native';
import { DEFAULT_IMAGES } from '../config/constants';

/**
 * A React component that handles IPFS images with fallback gateways for Android
 * 
 * @param props Standard Image props plus optional defaultSource
 * @returns An Image component with enhanced IPFS handling
 */
export const IPFSAwareImage = ({
    source,
    style,
    defaultSource = DEFAULT_IMAGES.user,
    ...props
}: ImageProps & { defaultSource?: any }) => {
    const [currentSource, setCurrentSource] = useState(source);
    const [loadError, setLoadError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const attemptedRef = useRef(false);
    const mountedRef = useRef(true);

    // Reset load error when source changes
    useEffect(() => {
        setCurrentSource(source);
        setLoadError(false);
        attemptedRef.current = false;

        return () => {
            mountedRef.current = false;
        };
    }, [source]);

    // Extra safety check for source format
    useEffect(() => {
        // Handle case where source is directly a string instead of {uri: string}
        if (typeof source === 'string') {
            console.warn('IPFSAwareImage received string source instead of object, fixing');
            setCurrentSource(getValidImageSource(source));
        }
    }, [source]);

    // On Android, try fallback gateways if the image fails to load
    const handleError = (e: any) => {
        // Skip if component unmounted
        if (!mountedRef.current) return;

        // Type checking for the currentSource
        const isValidSource =
            currentSource &&
            typeof currentSource === 'object' &&
            'uri' in currentSource &&
            typeof currentSource.uri === 'string';

        // Prevent multiple rapid retries that cause flickering
        if (Platform.OS === 'android' &&
            !loadError &&
            !isLoading &&
            !attemptedRef.current &&
            isValidSource) {

            // Type safety check for TypeScript
            const sourceUri = (currentSource as { uri: string }).uri;

            console.log('Image failed to load, using default image:', sourceUri);

            // Mark that we've attempted to handle this error
            attemptedRef.current = true;
            setIsLoading(true);

            // Use a slight delay to prevent flickering
            setTimeout(() => {
                if (!mountedRef.current) return;
                setCurrentSource(defaultSource);
                setLoadError(true);
                setIsLoading(false);
            }, 50);
        } else if (props.onError) {
            // Pass error to parent handler if provided
            props.onError(e);
        }
    };

    const handleLoadStart = () => {
        if (!mountedRef.current) return;
        if (props.onLoadStart) {
            props.onLoadStart();
        }
    };

    const handleLoadEnd = () => {
        if (!mountedRef.current) return;
        if (props.onLoadEnd) {
            props.onLoadEnd();
        }
    };

    return (
        <Image
            source={currentSource}
            style={style}
            defaultSource={defaultSource}
            onError={handleError}
            onLoadStart={handleLoadStart}
            onLoadEnd={handleLoadEnd}
            // Add additional props to improve loading on Android
            fadeDuration={Platform.OS === 'android' ? 0 : undefined}
            {...props}
        />
    );
};

/**
 * Convert a URL or string to a valid image source object with platform-specific handling
 * 
 * @param imageUrl URL string or image source object
 * @returns A properly formatted image source object
 */
export const getValidImageSource = (imageUrl: string | any) => {
    if (!imageUrl) return DEFAULT_IMAGES.user;

    // If it's already an object (like required assets), return as is
    if (typeof imageUrl !== 'string') {
        return imageUrl;
    }

    // First, standardize the URL format with our comprehensive fixer
    const fixedUrl = fixAllImageUrls(imageUrl);

    // Specific handling for Android IPFS URLs 
    if (Platform.OS === 'android') {
        let ipfsHash = '';

        // Check for IPFS patterns
        // Case 1: ipfs://Qm...
        if (fixedUrl.startsWith('ipfs://')) {
            ipfsHash = fixedUrl.replace('ipfs://', '');
        }
        // Case 2: https://ipfs.io/ipfs/Qm...
        else if (fixedUrl.includes('/ipfs/')) {
            const parts = fixedUrl.split('/ipfs/');
            if (parts.length > 1) {
                ipfsHash = parts[1];
            }
        }
        // Case 3: Direct Qm... hash
        else if (fixedUrl.startsWith('Qm') && fixedUrl.length > 30) {
            ipfsHash = fixedUrl;
        }

        // If we identified an IPFS hash, use Pinata gateway directly for Android
        if (ipfsHash) {
            // Go directly to Pinata instead of trying Cloudflare first
            return {
                uri: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
                headers: {
                    'Cache-Control': 'max-age=31536000',
                    'Pragma': 'no-cache'
                }
            };
        }
    }

    // Add caching and other platform-specific options for Android
    if (Platform.OS === 'android') {
        return {
            uri: fixedUrl,
            headers: {
                'Cache-Control': 'max-age=31536000'
            }
        };
    }

    // Default handling for other platforms
    return { uri: fixedUrl };
};

/**
 * Fix various IPFS URL formats to standard HTTPS URLs
 * 
 * @param url URL string to fix
 * @returns Properly formatted URL string
 */
export const fixIPFSUrl = (url: string): string => {
    if (!url) return '';

    // Handle IPFS URLs
    if (url.startsWith('ipfs://')) {
        return Platform.OS === 'android'
            ? url.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')
            : url.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }

    // Handle Arweave URLs
    if (url.startsWith('ar://')) {
        return url.replace('ar://', 'https://arweave.net/');
    }

    // Handle relative Arweave paths
    if (url.startsWith('/')) {
        return `https://arweave.net${url}`;
    }

    // Add https:// prefix if needed
    if (!url.startsWith('http') && !url.startsWith('data:')) {
        return `https://${url}`;
    }

    return url;
};

/**
 * A more comprehensive image URL fixing function that combines all the different fixImageUrl 
 * implementations found across the app
 * 
 * @param url Any image URL to process
 * @returns A properly formatted URL string
 */
export const fixAllImageUrls = (url: string | null | undefined): string => {
    if (!url) return '';

    // Remove extra quotes that might be present
    if (url.startsWith('"') && url.endsWith('"')) {
        url = url.slice(1, -1);
    }

    // Handle IPFS URLs - Use Pinata directly for Android
    if (url.startsWith('ipfs://')) {
        return Platform.OS === 'android'
            ? url.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')
            : url.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }

    // Convert ipfs.io URLs to Pinata on Android for consistency
    if (Platform.OS === 'android' && url.includes('ipfs.io/ipfs/')) {
        const ipfsHash = url.split('/ipfs/')[1];
        if (ipfsHash) {
            return `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
        }
    }

    // Handle Arweave URLs
    if (url.startsWith('ar://')) {
        return url.replace('ar://', 'https://arweave.net/');
    }

    // Handle relative Arweave paths
    if (url.startsWith('/')) {
        return `https://arweave.net${url}`;
    }

    // Try to fix other common URL issues

    // Fix URLs without protocol
    if (!url.startsWith('http') && !url.startsWith('data:')) {
        return `https://${url}`;
    }

    // Fix encoding issues with spaces, etc.
    if (url.includes(' ')) {
        return encodeURI(url);
    }

    return url;
};

/**
 * Utility to generate a unique key for IPFS images, especially on Android
 * where we need to force refreshes more often due to caching issues.
 * 
 * @param baseKey Base key string (usually some identifier like user.id)
 * @returns A unique key that can be used in the key prop of an Image component
 */
export const getImageKey = (baseKey: string): string => {
    return Platform.OS === 'android'
        ? `img-${baseKey}-${Date.now()}`
        : `img-${baseKey}`;
}; 