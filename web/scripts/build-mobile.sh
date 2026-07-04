#!/usr/bin/env bash
# Build the web bundle then sync to native projects so an iOS / Android
# release can be produced by running this script + opening Xcode / Android Studio.
set -e

echo "▶ Building web bundle..."
npm run build

echo "▶ Syncing Capacitor..."
if [ -d ios ]; then
  echo "  · iOS sync..."
  npx cap sync ios
fi
if [ -d android ]; then
  echo "  · Android sync..."
  npx cap sync android
fi

echo ""
echo "Next steps:"
echo "  iOS:     open ios/App/App.xcworkspace in Xcode, bump build number, Archive, upload to App Store Connect / TestFlight."
echo "  Android: open android/ in Android Studio, build signed AAB, upload to Google Play Console."
