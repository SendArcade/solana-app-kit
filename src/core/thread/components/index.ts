// src/components/thread/index.ts
import Thread from './Thread';
import ThreadItem from './ThreadItem';
import ThreadAncestors from './ThreadAncestors';
import ThreadComposer from './ThreadComposer';
import ThreadEditModal from './ThreadEditModal';
import EditPostModal from './EditPostModal';
import NftListingModal from './NftListingModal';
import PostBody from './post/PostBody';
import PostCTA from './post/PostCTA';
import PostFooter from './post/PostFooter';
import PostHeader from './post/PostHeader';

// Named exports
export { Thread } from './Thread';
export { ThreadItem } from './ThreadItem';
export { ThreadAncestors } from './ThreadAncestors';
export { ThreadComposer } from './ThreadComposer';
export { ThreadEditModal } from './ThreadEditModal';
export { EditPostModal } from './EditPostModal';
export { NftListingModal } from './NftListingModal';

// Re-export post components for easier access
export { PostBody } from './post/PostBody';
export { PostCTA } from './post/PostCTA';
export { PostFooter } from './post/PostFooter';
export { PostHeader } from './post/PostHeader';

// Default exports to maintain backward compatibility
export {
  Thread,
  ThreadItem,
  ThreadAncestors,
  ThreadComposer,
  ThreadEditModal,
  EditPostModal,
  NftListingModal,
  PostBody,
  PostCTA,
  PostFooter,
  PostHeader,
};

// Re-export style utilities
export * from './thread.theme';
export * from './thread.styles';

// Note: We don't re-export thread.types.ts or thread.utils.ts because
// those have been moved to their respective directories
