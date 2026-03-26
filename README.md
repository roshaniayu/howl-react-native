# Howl: Sleep Audio & Reflection Application

This repository contains the source code for _Howl_, an Android-only ambient sound and reflection mobile application, created by **Roshani Ayu Pranasti (G2504973A)**. This individual project is part of the IN6222 Mobile & Ubiquitous Applications Development, Wee Kim Wee School of Communication and Information, Nanyang Technological University, 2026.

## Application Definition

Howl is an ambient sound and reflection application designed specifically to aid individuals experiencing sleep disorders, anxiety, or insomnia. The app facilitates a smooth transition to sleep by providing auditory accompaniment, acting as a soothing distraction from racing internal thoughts or disruptive surrounding noises.

The application integrates customizable sleep timers, dynamic visual ambiences, and a secure digital diary. By combining timed instrumental soundscapes with daily reflection logging, Howl offers users a comforting and consistent nighttime routine within a single mobile experience.

### Key Features
- **Timed Audio Playback**: Looping, soothing instrumental sounds powered by a customizable sleep timer to softly send users into a slumber.
- **Dynamic Themes & Visual Ambience**: Selectable environments that simultaneously update the auditory profile and trigger relaxing, continuous background animations.
- **Comprehensive Sleep Tracking**: Automated session completion tracking that logs daily sound engagement and calculates total listening duration to monitor sleep ritual consistency.
- **Secure Digital Diary & Calendar**: A private space for users to write daily reflections and upload photos, featuring an organized reflection history accessible via intuitive weekly calendar navigation.
- **Cloud Infrastructure & Authentication**: Secure Google Sign-In integration paired with robust Firebase-based data storage to protect user sessions and synchronize private journal entries.

## Installation

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)
- Android Studio (latest stable) with Android SDK installed
- Java JDK 17 or higher
- A connected Android device or Android emulator
- Firebase project configured for Android (Auth + Firestore)

### Android Project Setup
1. Clone and enter the repository:
   ```bash
   git clone <your-repo-url>
   cd howl-react-native
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Firebase for Android:
   Add your Firebase Android config file in both paths:
   - `google-services.json`
   - `android/app/google-services.json`

4. Ensure Google Sign-In and Firebase Auth are enabled in your Firebase project.

## Build and Run

### Android (Development)
1. Start an emulator from Android Studio, or connect a physical Android device.

2. Build and run on Android:
   ```bash
   npx expo run:android
   ```

3. Optional clean prebuild step (use this when native Android setup is out of sync):
   ```bash
   npx expo prebuild --clean --platform android
   ```

4. For Metro bundler only:
   ```bash
   npx expo start
   ```

## Environment Links

- **Android App (Emulator/Device)**: Installed via `npx expo run:android`
- **Firebase Console**: https://console.firebase.google.com/

## Tech Stack

### Mobile Frontend
- React Native with TypeScript
- Expo (Expo Router)
- React Native Calendars
- Expo AV, Expo Image, Expo Image Picker

### Backend Services
- Firebase Authentication
- Cloud Firestore
- Google Sign-In for React Native

## Platform Scope

This project is currently supported for **Android only**.

- iOS build flow is not maintained for this submission.
- Web build is not part of the target deliverable.
