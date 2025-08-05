# Firebase Setup Guide

## 1. Firebase Console Setup

1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Pilih project Anda atau buat project baru
3. Aktifkan Authentication:
   - Buka Authentication > Sign-in method
   - Aktifkan Email/Password provider

## 2. Firestore Database Setup

1. Buka Firestore Database
2. Buat database baru (pilih mode production atau test)
3. Pilih lokasi database (pilih yang terdekat)

## 3. Firestore Rules

Copy dan paste rules berikut ke Firestore Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Characters collection - users can read/write their own character
    match /characters/{characterId} {
      allow read, write: if request.auth != null && request.auth.uid == characterId;
    }
    
    // Default deny all
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## 4. Environment Variables

Buat file `.env.local` di root project dengan konfigurasi Firebase Anda:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## 5. Testing

1. Jalankan aplikasi: `npm run dev`
2. Register user baru
3. Buat karakter
4. Cek di Firebase Console apakah data tersimpan

## Troubleshooting

### Error: "Missing or insufficient permissions"
- Pastikan Firestore Rules sudah diupdate
- Pastikan user sudah login
- Cek apakah collection dan document path benar

### Error: "Firebase not initialized"
- Pastikan environment variables sudah benar
- Restart development server setelah mengubah .env.local 