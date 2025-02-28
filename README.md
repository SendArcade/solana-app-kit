<div align="center">

# Solana Social Starter

A modern React Native social application built on the Solana blockchain, providing a complete starter kit for building decentralized social experiences.

![Solana Social Starter](https://i.imgur.com/sEzRiij.png)

</div>

## Features

- **Blockchain Integration**: Built on Solana for fast, low-cost transactions
- **Wallet Management**: Multiple wallet connection options including embedded wallets
- **Social Features**: Feed, profiles, messaging via Dialect Blinks
- **Authentication**: Multiple auth options with Privy integration
- **Cryptocurrency Tracking**: View and track coin details and performance
- **Modern UI**: Beautiful, responsive interface with tab-based navigation

## Tech Stack

- **React Native**: Cross-platform mobile development
- **Expo**: Simplified React Native development and deployment
- **Solana**: Fast, secure, and censorship-resistant blockchain
- **Dialect**: Decentralized messaging via Blinks
- **Privy**: Authentication and wallet management
- **Redux**: State management with Redux Toolkit
- **React Navigation**: Tab and stack-based navigation

## Prerequisites

- Node.js >= 18
- Yarn or npm
- iOS: XCode and CocoaPods
- Android: Android Studio and Android SDK
- [Expo CLI](https://docs.expo.dev/get-started/installation/)

## Getting Started

### Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/yourusername/solana-social-starter.git
   cd solana-social-starter
   ```

2. Install dependencies:
   ```sh
   yarn install
   # or
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   PRIVY_APP_ID=your_privy_app_id
   PRIVY_CLIENT_ID=your_privy_client_id
   ```

### Running the App

#### Start Metro Bundler

```sh
yarn start
# or
npm start
```

#### iOS

For iOS, you need to install CocoaPods dependencies first:

```sh
# Install Ruby bundler (first time only)
bundle install

# Install CocoaPods dependencies
bundle exec pod install
```

Then run the app:

```sh
yarn ios
# or
npm run ios
```

#### Android

```sh
yarn android
# or
npm run android
```

## Project Structure

```
solana-social-starter/
├── src/
│   ├── assets/         # Images, icons, and other static assets
│   ├── components/     # Reusable UI components
│   ├── hooks/          # Custom React hooks
│   ├── navigation/     # Navigation configuration
│   ├── screens/        # App screens
│   ├── services/       # API and service integrations
│   ├── state/          # Redux store and slices
│   ├── types/          # TypeScript type definitions
│   └── utils/          # Utility functions
├── App.tsx             # Main application component
├── index.js            # Entry point
└── package.json        # Dependencies and scripts
```

## Key Screens

- **Intro Screen**: Onboarding for new users
- **Login Screen**: Authentication options
- **Home Screen**: Dashboard with key information
- **Feed Screen**: Social activity feed
- **Profile Screen**: User profile and settings
- **Coin Detail**: Cryptocurrency information and charts
- **Blink Screen**: Messaging via Dialect Blinks
- **Embedded Wallet**: Wallet management interface

## Wallet Integration

This starter supports multiple wallet connection methods:

- Embedded wallets via Privy
- External wallet connections
- Dynamic wallet integration

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Solana](https://solana.com/)
- [Dialect](https://dialect.to/)
- [Privy](https://privy.io/)
- [React Native](https://reactnative.dev/)
- [Expo](https://expo.dev/)

---

Built with ❤️ for the Solana ecosystem by Send Arcade
