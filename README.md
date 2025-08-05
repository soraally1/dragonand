# Dungeon & Dragons - AI Game

Website game Dungeon & Dragons dengan AI sebagai Dungeon Master, dibangun menggunakan Next.js, TypeScript, Tailwind CSS, dan Firebase.

## Fitur

- ✅ **Sistem Autentikasi**: Login/Register dengan Firebase Authentication
- ✅ **Pembuatan Karakter D&D**: Lengkap dengan ras, kelas, ability scores, background, dan alignment
- ✅ **Dice Roller Interaktif**: Animasi roll 4d6 drop lowest yang menarik
- ✅ **UI/UX Modern**: Design system yang konsisten dengan komponen reusable
- ✅ **Dark Mode Support**: Tema gelap yang nyaman di mata
- ✅ **Responsive Design**: Optimal di desktop, tablet, dan mobile
- ✅ **Data Persistence**: Penyimpanan data user dan karakter di Firestore
- ✅ **Error Handling**: Pesan error yang informatif dan user-friendly
- ✅ **AI Dungeon Master**: Menggunakan Groq AI untuk Dungeon Master yang cerdas
- ✅ **Multiplayer Support**: Bermain solo atau dengan 2-5 pemain
- ✅ **Game Area**: Area permainan dengan sistem giliran
- ✅ **Turn-Based Gameplay**: Sistem giliran yang adil dan terstruktur

## Teknologi yang Digunakan

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Firebase (Authentication, Firestore)
- **UI Components**: Lucide React, Custom Design System
- **Styling**: Tailwind CSS dengan dark mode support
- **State Management**: React Context API
- **Form Handling**: Custom validation dengan error handling

## Setup dan Instalasi

### 1. Clone Repository

```bash
git clone <repository-url>
cd dragonand
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Firebase

1. Buat project baru di [Firebase Console](https://console.firebase.google.com/)
2. Aktifkan Authentication dengan Email/Password
3. Buat database Firestore
4. Dapatkan konfigurasi Firebase dari Project Settings

### 4. Firestore Rules

Copy dan paste rules berikut ke Firestore Rules di Firebase Console:

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

### 5. Environment Variables

Buat file `.env.local` di root project dan isi dengan konfigurasi Firebase:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 6. Jalankan Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

## Troubleshooting

### Error: "Missing or insufficient permissions"
1. Pastikan Firestore Rules sudah diupdate sesuai langkah 4
2. Pastikan user sudah login
3. Restart development server setelah mengubah konfigurasi

### Error: "Firebase not initialized"
1. Pastikan environment variables sudah benar
2. Restart development server setelah mengubah .env.local
3. Cek console browser untuk error detail

### Data tidak tersimpan
1. Cek Firestore Rules di Firebase Console
2. Pastikan Authentication sudah diaktifkan
3. Cek console browser untuk error detail

## Struktur Project

```
src/
├── app/                    # Next.js App Router
│   ├── auth/              # Halaman autentikasi
│   ├── character/         # Halaman pembuatan karakter
│   ├── game/              # Halaman game utama
│   └── layout.tsx         # Layout utama dengan AuthProvider
├── components/
│   ├── auth/              # Komponen autentikasi
│   │   ├── AuthProvider.tsx
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   └── character/         # Komponen pembuatan karakter
│       └── CharacterCreation.tsx
└── lib/
    └── firebase.ts        # Konfigurasi Firebase
```

## Fitur Pembuatan Karakter

### 🎯 Langkah 1: Informasi Dasar
- Nama karakter dengan validasi
- 9 ras D&D (Human, Elf, Dwarf, Halfling, Dragonborn, Tiefling, Half-Elf, Half-Orc, Gnome)
- 12 kelas (Fighter, Wizard, Cleric, Rogue, Ranger, Paladin, Barbarian, Bard, Druid, Monk, Sorcerer, Warlock)

### 🎲 Langkah 2: Ability Scores
- **Dice Roller Interaktif**: Animasi roll 4d6 drop lowest yang menarik
- 6 ability scores dengan emoji: STR 💪, DEX 🏃, CON ❤️, INT 🧠, WIS 👁️, CHA ✨
- Kalkulasi modifier otomatis dengan warna indikator
- Visual feedback untuk setiap roll

### 👑 Langkah 3: Latar Belakang & Alignment
- 11 background (Acolyte, Criminal, Folk Hero, Noble, Sage, Soldier, Urchin, dll.)
- 9 alignment (Lawful Good, Neutral Good, Chaotic Good, dll.)
- Ringkasan karakter yang lengkap dan informatif

## Deployment

### Vercel (Recommended)

1. Push code ke GitHub
2. Connect repository ke Vercel
3. Set environment variables di Vercel dashboard
4. Deploy

### Manual Build

```bash
npm run build
npm start
```

## Contributing

1. Fork repository
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## Roadmap

- [ ] AI Dungeon Master integration
- [ ] Combat system
- [ ] Inventory management
- [ ] Spell casting system
- [ ] Multiplayer support
- [ ] Campaign management
- [ ] Character progression
- [ ] Dice rolling animations

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

Jika ada pertanyaan atau masalah, silakan buat issue di repository ini.
