import {ThreadPost} from '../components/thread/thread.types';

export const allposts: ThreadPost[] = [
  // ====== Example Post 1: Simple text-only ======
  {
    id: 'post-1',
    user: {
      id: 'user-1',
      username: 'Alice',
      handle: '@aliceSmith',
      avatar: require('../assets/images/User.png'),
      verified: true,
    },
    createdAt: '2025-01-01T10:00:00Z',
    parentId: undefined,
    sections: [
      {
        id: 'section-1',
        type: 'TEXT_ONLY',
        text: 'Hello world, this is my first post in our custom thread!',
      },
    ],
    replies: [],
    reactionCount: 10,
    retweetCount: 2,
    quoteCount: 1,
  },

  // ====== Example Post 2: Text + Image ======
  {
    id: 'post-2',
    user: {
      id: 'user-2',
      username: 'Bob',
      handle: '@bob123',
      avatar: require('../assets/images/User2.png'),
    },
    createdAt: '2025-01-01T11:00:00Z',
    parentId: undefined,
    sections: [
      {
        id: 'section-2',
        type: 'TEXT_IMAGE',
        text: 'Check out this amazing photo from my trip!',
        imageUrl: require('../assets/images/User2Post.png'),
      },
    ],
    replies: [],
    reactionCount: 25,
    retweetCount: 1,
    quoteCount: 3,
  },

  // ====== Example Post 3: Text + TradeCard (Updated for two tokens) ======
  {
    id: 'post-3',
    user: {
      id: 'user-3',
      username: 'Charlie',
      handle: '@charlieBrown',
      avatar: require('../assets/images/User3.png'),
      verified: true,
    },
    createdAt: '2025-01-01T12:00:00Z',
    parentId: undefined,
    sections: [
      {
        id: 'section-3',
        type: 'TEXT_TRADE',
        text: 'Look at this $SEND and $SOL swap opportunity!',
        tradeData: {
          token1Avatar: require('../assets/images/Smiley.png'),
          token1Name: 'SEND Coin',
          token1PriceUsd: '$0.02',
          token2Avatar: require('../assets/images/reaction-user-1.png'),
          token2Name: 'SOL',
          token2PriceUsd: '$20.00',
          token2PriceSol: '1 SOL',
        },
      },
    ],
    replies: [],
    reactionCount: 100,
    retweetCount: 20,
    quoteCount: 5,
  },

  // ====== Example Post 4: Text + Video ======
  {
    id: 'post-4',
    user: {
      id: 'user-4',
      username: 'Dora',
      handle: '@doraTheExplorer',
      avatar: require('../assets/images/User2.png'),
    },
    createdAt: '2025-01-01T13:00:00Z',
    parentId: undefined,
    sections: [
      {
        id: 'section-4',
        type: 'TEXT_VIDEO',
        text: 'Here is a quick snippet from my new tutorial video!',
        videoUrl: 'https://example.com/my-video.mp4',
      },
    ],
    replies: [],
    reactionCount: 42,
    retweetCount: 10,
    quoteCount: 2,
  },

  // ====== Example Post 5: Poll ======
  {
    id: 'post-5',
    user: {
      id: 'user-5',
      username: 'Elena',
      handle: '@elenaPolls',
      avatar: require('../assets/images/User.png'),
    },
    createdAt: '2025-01-01T14:00:00Z',
    parentId: undefined,
    sections: [
      {
        id: 'section-5',
        type: 'POLL',
        pollData: {
          question: 'Which coin do you think will pump next?',
          options: ['BTC', 'ETH', 'SOL', 'SEND'],
          votes: [10, 20, 5, 0],
        },
      },
    ],
    replies: [],
    reactionCount: 12,
    retweetCount: 2,
    quoteCount: 0,
  },
];
