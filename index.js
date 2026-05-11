const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// --- VERİ HAVUZU VE SUNUCU TAKİBİ ---
let havuz = { duyuru: "", mesaj: "", ozelHedef: "", kickHedef: "", chatTemizle: false };
let sunucuDurum = { aktif: false, sonGorulme: 0, oyuncular: [] };

app.use(express.json());

// Roblox hem durum raporu verir (POST) hem de komut çeker (GET)
app.all('/kontrol', (req, res) => {
    // 1. Roblox'tan gelen oyuncu listesini kaydet
    if (req.method === 'POST') {
        sunucuDurum.aktif = true;
        sunucuDurum.sonGorulme = Date.now();
        sunucuDurum.oyuncular = req.body.oyuncular || [];
        return res.status(200).json({ status: "veriler_alindi" });
    }
    
    // 2. Roblox veri çekerken havuzu gönder ve hemen sıfırla
    res.status(200).json(havuz);
    havuz.duyuru = ""; 
    havuz.ozelHedef = ""; 
    havuz.kickHedef = ""; 
    havuz.chatTemizle = false;
});

app.get('/', (req, res) => res.send("Sistem Aktif!"));

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// --- KOMUT KAYITLARI ---
const commands = [
    new SlashCommandBuilder().setName('durum').setDescription('Sunucu aktifliğini ve oyuncuları listeler.'),
    new SlashCommandBuilder().setName('duyuru').setDescription('Tüm sunucuya duyuru atar.').addStringOption(o => o.setName('mesaj').setDescription('Duyuru metni').setRequired(true)),
    new SlashCommandBuilder().setName('mesaj').setDescription('Kişiye özel mesaj gönderir.').addStringOption(o => o.setName('oyuncu').setDescription('Kullanıcı Adı').setRequired(true)).addStringOption(o => o.setName('icerik').setDescription('Mesaj içeriği').setRequired(true)),
    new SlashCommandBuilder().setName('shutdown').setDescription('Sunucuyu kapatır ve günceller.').addStringOption(o => o.setName('sebep').setDescription('Neden?').setRequired(true)),
    new SlashCommandBuilder().setName('kick').setDescription('Oyuncuyu atar.').addStringOption(o => o.setName('oyuncu').setDescription('Username').setRequired(true)),
    new SlashCommandBuilder().setName('chat-temizle').setDescription('Sohbeti temizler.')
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.once('ready', async () => {
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log(`${client.user.tag} Hazır ve Komutlar Güncel!`);
    } catch (e) { console.error(e); }
});

// --- KOMUT İŞLEME ---
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    try { await interaction.deferReply(); } catch (e) { return; }

    const { commandName, options } = interaction;

    if (commandName === 'durum') {
        const simdi = Date.now();
        const fark = (simdi - sunucuDurum.sonGorulme) / 1000;
        const isOnline = fark < 25; // 25 saniye sinyal gelmezse kapalı sayılır

        const embed = new EmbedBuilder()
            .setTitle('🎮 Oyun Sunucu Durumu')
            .setColor(isOnline ? 0x2ECC71 : 0xE74C3C)
            .addFields(
                { name: 'Durum', value: isOnline ? "🟢 Aktif" : "🔴 Kapalı", inline: true },
                { name: 'Oyuncu Sayısı', value: `${sunucuDurum.oyuncular.length} / 50`, inline: true },
                { name: 'Aktif Oyuncular', value: sunucuDurum.oyuncular.length > 0 ? "
http://googleusercontent.com/immersive_entry_chip/0

### Kurulum Hatırlatması (Son Kez):
1.  **Render Linki:** Roblox kodunun üstündeki `URL` kısmının sonuna `/kontrol` eklemeyi unutma.
2.  **Discord Komutları:** Kodu yükledikten sonra Discord'da komutlar hemen görünmezse uygulamayı kapatıp aç.
3.  **Permissions:** Roblox Studio'da **Allow HTTP Requests** ve **Enable Studio Access to API Services** seçenekleri açık olmalı.

Hayırlı olsun agam, sistemin şimdi canavar gibi çalışacak! 🚀🧱
