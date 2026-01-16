# Renumber

Renumber is a mobile app concept for building a personal number memorization system. It focuses on mapping numbers to tags, practicing recall with timed tests, and tracking success over time.

## Run on iPhone (Expo Go)

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the Expo dev server:
   ```bash
   npm run start
   ```
   or:
   ```bash
   npm run ios
   ```
3. Install **Expo Go** from the App Store on your iPhone.
4. Scan the QR code shown by the Expo dev server to load the app on your device.

## Notes

- The app uses a simple local SQLite-backed store to keep mappings and practice results on-device.
- Practice unlocks after mapping the 10 single digits in the Number Map.
