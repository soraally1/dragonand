import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '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',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, gameSession, playerAction, currentPlayer, isMultiplayer } = body;

    if (type === 'dungeonMasterResponse') {
      const response = await generateDungeonMasterResponse(gameSession, playerAction, isMultiplayer);
      return NextResponse.json({ response });
    } else if (type === 'playerActions') {
      const actions = await generatePlayerActions(gameSession, currentPlayer, isMultiplayer);
      return NextResponse.json({ actions });
    } else {
      return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function generateDungeonMasterResponse(gameSession: any, playerAction?: any, isMultiplayer?: boolean): Promise<string> {
  try {
    const systemPrompt = `Anda adalah seorang Dungeon Master ahli untuk Dungeons & Dragons. Anda menciptakan cerita yang imersif dan mengelola sesi permainan dengan beberapa pemain.

Peran Anda:
- Buat deskripsi yang hidup tentang lingkungan, NPC, dan situasi
- Tanggapi aksi pemain dengan konsekuensi yang sesuai
- Jaga keseimbangan dan keadilan permainan
- Buat cerita tetap menarik dan bergerak maju
- Gunakan aturan D&D 5e sebagai panduan tapi prioritaskan kesenangan dan storytelling
- **SELALU gunakan Bahasa Indonesia dalam semua narasi dan dialog**
- **Format teks dengan markdown: gunakan **tebal** untuk penekanan, *miring* untuk suasana**
- **Buat paragraf yang rapi dengan jeda baris untuk keterbacaan**
${isMultiplayer ? '- Koordinasikan beberapa pemain dan pastikan semua merasa terlibat dalam cerita' : ''}

Status permainan saat ini:
- Jumlah pemain: ${gameSession.players.length}
- Giliran ke: ${gameSession.turn}
- Pemain saat ini: ${gameSession.players[gameSession.currentPlayerIndex]?.character?.name || gameSession.players[gameSession.currentPlayerIndex]?.name || 'Tidak ada'}
- Status permainan: ${gameSession.gameState}
${isMultiplayer ? '- Ini adalah sesi multiplayer dengan kolaborasi real-time' : '- Ini adalah sesi solo atau multiplayer lokal'}

Pemain dan karakter mereka:
${gameSession.players.map((player: any, index: number) => `
${index + 1}. ${player.character.name} (${player.name}) - ${player.character.race} ${player.character.class} (Level ${player.character.level})
   Latar Belakang: ${player.character.background}
   Alignment: ${player.character.alignment}
   Stats: STR ${player.character.strength}, DEX ${player.character.dexterity}, CON ${player.character.constitution}, INT ${player.character.intelligence}, WIS ${player.character.wisdom}, CHA ${player.character.charisma}
`).join('')}

Cerita saat ini: ${gameSession.story || 'Petualangan baru dimulai...'}
Adegan saat ini: ${gameSession.currentScene || 'Memulai petualangan...'}

${playerAction ? `
Aksi pemain terakhir:
- Pemain: ${gameSession.players[gameSession.currentPlayerIndex]?.character?.name || gameSession.players[gameSession.currentPlayerIndex]?.name}
- Jenis Aksi: ${playerAction.type}
- Deskripsi: ${playerAction.description}
- Lemparan Dadu: ${playerAction.roll || 'Tidak ada lemparan'}
- Hasil: ${playerAction.result || 'Menunggu'}
` : ''}

**PENTING: SELALU gunakan Bahasa Indonesia untuk SEMUA narasi, dialog, dan deskripsi.**

Tanggapi sebagai Dungeon Master dalam Bahasa Indonesia. Buat deskripsi yang hidup, menarik, dan gerakkan cerita ke depan. Gunakan format markdown untuk penekanan (**tebal** dan *miring*). Buat paragraf yang rapi dengan jeda baris.

${isMultiplayer ? 'Karena ini multiplayer, pastikan mengakui semua pemain dan ciptakan peluang kolaborasi.' : 'Jika ini awal permainan, buat adegan pembuka yang menarik semua pemain ke dalam petualangan.'}

PANDUAN NARASI:
- **WAJIB menggunakan Bahasa Indonesia untuk semua teks**
- Gunakan **tebal** untuk nama penting, lokasi, atau penekanan
- Gunakan *miring* untuk suasana, bisikan, atau pikiran
- Buat paragraf pendek untuk keterbacaan
- Sertakan dialog NPC yang hidup dalam Bahasa Indonesia
- Akhiri dengan situasi yang membutuhkan keputusan pemain
- **JANGAN sertakan daftar pilihan atau keputusan dalam narasi** (pilihan akan disediakan secara terpisah)
- **JANGAN tulis "Keputusan kalian:" atau daftar bernomor dalam narasi**
- Fokus pada deskripsi situasi dan biarkan pemain memilih aksi dari tombol yang tersedia`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: playerAction 
            ? `Pemain ${gameSession.players[gameSession.currentPlayerIndex]?.character?.name || gameSession.players[gameSession.currentPlayerIndex]?.name} telah melakukan aksi: ${playerAction.description}. Bagaimana Anda menanggapi sebagai Dungeon Master? WAJIB gunakan Bahasa Indonesia untuk semua teks, dialog, dan narasi. Gunakan format markdown dan akhiri dengan situasi yang membutuhkan keputusan spesifik.`
            : "Mulai petualangan! Buat adegan pembuka yang memperkenalkan semua pemain ke cerita dan siapkan tantangan atau situasi pertama yang harus mereka hadapi. WAJIB gunakan Bahasa Indonesia untuk semua teks, dialog, dan narasi. Gunakan format markdown dan akhiri dengan situasi yang membutuhkan keputusan spesifik dari pemain."
        }
      ],
      model: "llama3-8b-8192",
      temperature: 0.8,
      max_tokens: 1000,
    });

    return completion.choices[0]?.message?.content || "**Dungeon Master sedang berpikir...**";
  } catch (error) {
    console.error('Error generating Dungeon Master response:', error);
    return "**Dungeon Master sementara tidak tersedia.** Silakan coba lagi."
  }
}

async function generatePlayerActions(gameSession: any, currentPlayer: any, isMultiplayer?: boolean): Promise<string[]> {
  try {
    const systemPrompt = `Anda adalah asisten yang menyarankan aksi SPESIFIK untuk pemain D&D berdasarkan situasi cerita saat ini.

**KONTEKS PERMAINAN:**
Pemain: ${currentPlayer.character.name} (${currentPlayer.name}) - ${currentPlayer.character.race} ${currentPlayer.character.class}
Adegan: ${gameSession.currentScene || 'Memulai petualangan'}
Cerita: ${gameSession.story || 'Petualangan baru dimulai'}
${isMultiplayer ? `Pemain lain: ${gameSession.players.filter((p: any) => p.id !== currentPlayer.id).map((p: any) => p.character.name).join(', ')}` : ''}

**ATURAN PENTING:**
- **LANGSUNG berikan 4-6 aksi tanpa teks pengantar**
- **JANGAN tulis "Berikut adalah" atau "Saran aksi" atau teks penjelasan**
- **HANYA tulis aksi-aksi dalam format list sederhana**
- Gunakan Bahasa Indonesia
- Aksi harus SPESIFIK dan terkait langsung dengan situasi cerita
- Sesuaikan dengan kelas karakter dan situasi saat ini

**FORMAT YANG BENAR:**
Bicara dengan prajurit tentang ancaman
Jelajahi pasar untuk mencari petunjuk
Periksa senjata di toko pandai besi
Cari informasi di tavern

**JANGAN GUNAKAN:**
- "Berikut adalah saran aksi..."
- "Pilihan yang tersedia:"
- Teks pengantar apapun`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Analisis cerita saat ini dan berikan 4-6 aksi SPESIFIK untuk ${currentPlayer.character.name}. 

CERITA SAAT INI: ${gameSession.story || 'Petualangan dimulai'}

TUGAS ANDA:
1. Baca cerita dengan teliti
2. Identifikasi NPC, lokasi, objek, atau situasi spesifik yang disebutkan
3. Buat aksi yang LANGSUNG berkaitan dengan elemen-elemen tersebut
4. JANGAN gunakan teks pengantar apapun
5. Tulis dalam format: [Kata kerja] [objek/lokasi spesifik] [tujuan]

Contoh yang BENAR berdasarkan cerita:
- Jika ada pedagang → "Tanya pedagang tentang barang yang hilang"
- Jika ada sungai → "Selidiki tepi Sungai Pendrof"
- Jika ada hutan → "Masuki Hutan Gelap untuk mencari jejak"

LANGSUNG tulis 4-6 aksi tanpa penjelasan:`
        }
      ],
      model: "llama3-8b-8192",
      temperature: 0.7,
      max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content || "";
    
    // Clean up the response by removing any introductory text and extracting only actions
    const lines = response.split('\n').filter((line: string) => line.trim().length > 0);
    const cleanActions: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      // Skip introductory text, headers, or explanatory lines
      if (trimmed.toLowerCase().includes('berikut adalah') ||
          trimmed.toLowerCase().includes('saran aksi') ||
          trimmed.toLowerCase().includes('pilihan yang') ||
          trimmed.toLowerCase().includes('opsi yang') ||
          trimmed.includes(':') && trimmed.length < 50 ||
          trimmed.match(/^\d+\./)) {
        continue;
      }
      
      // Clean numbered lists and bullet points
      let cleanAction = trimmed
        .replace(/^\d+\.\s*/, '') // Remove "1. "
        .replace(/^[-*]\s*/, '') // Remove "- " or "* "
        .replace(/^"|"$/g, '') // Remove quotes
        .trim();
      
      if (cleanAction.length > 10 && cleanActions.length < 6) {
        cleanActions.push(cleanAction);
      }
    }
    
    return cleanActions.length > 0 ? cleanActions : [
      "Jelajahi area sekitar untuk mencari petunjuk",
      "Bicara dengan penduduk setempat",
      "Periksa jejak atau tanda-tanda aneh",
      "Cari informasi di tempat berkumpul"
    ];
  } catch (error) {
    console.error('Error generating player actions:', error);
    return [
      "Jelajahi area sekitar",
      "Bicara dengan NPC terdekat",
      "Cari petunjuk atau barang berguna",
      "Bersiap untuk pertarungan",
      "Gunakan sihir atau kemampuan khusus",
      "Pindah ke lokasi yang berbeda"
    ];
  }
} 