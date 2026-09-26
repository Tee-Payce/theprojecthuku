# The Project Huku

The Project Huku is an offline-first poultry batch tracker built with Expo and React Native. It records poultry batches, feed purchases, mortality, expenses, clients, and sales in a local SQLite database.

## Features

- Create and monitor 42-day poultry batches
- Track surviving birds, mortality, feed costs, expenses, revenue, and profit
- Record sales per bird or per kilogram
- Manage clients and client purchase history
- View batch timelines and vaccination/feed schedules
- Attach receipt images through the receipt utility

## Development
Install dependencies and start Expo:

```bash
npm install
npm start
```

Useful commands:

```bash
npm run android
npm run ios
npm run web
npm run lint
```

The app uses Expo Router. Routes live in `app/`, while SQLite queries live in `database/`.

For online features, copy `.env.example` to `.env` and set the Supabase project URL and anonymous key. Apply the SQL migration in `supabase/migrations/001_phase1_foundation.sql` to the Supabase project before using authentication or projects.

Follow [PHASE_1_EXTERNAL_SETUP_GUIDE.md](PHASE_1_EXTERNAL_SETUP_GUIDE.md) for the complete Supabase setup, authentication test, project test, and Row Level Security verification.

## Storage
Data is stored locally in the SQLite database `poultry_tracker.db`. The database is initialized when the root layout mounts. Batches own their feed, mortality, expenses, and sales records; sales also reference clients.

Feed quantities and prices are currently stored in fields named `quantityKg` and `pricePerKg`. Keep those values in kilograms and price per kilogram when entering feed until the UI terminology is aligned with the farm's preferred unit.

Existing installations created before foreign-key enforcement may need their local database reset before the new relationship constraints are applied. Do not reset a production database without exporting the data first.

## Build and deployment
See [DEPLOYMENT.md](DEPLOYMENT.md), [iOS_DEPLOYMENT.md](iOS_DEPLOYMENT.md), and [INSTALL_WITHOUT_APPSTORE.md](INSTALL_WITHOUT_APPSTORE.md) for platform-specific build instructions.

Receipt capture uses the device camera or photo library and stores files under the app's document directory. Notification scheduling currently provides reminder calculations and compatibility stubs; it does not yet create native scheduled notifications.
# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
