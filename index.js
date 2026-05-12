const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const express = require('express');
const https = require('https'); // 7/24 uyanık tutmak için gerekli
const app = express();
const port = process.env.PORT || 3000;

// --- AYARLAR ---
const MY_URL = "https://roblox-bot-servis.onrender.com/"; // BURAYI KENDİ RENDER LİNKİNLE DEĞİŞTİR!

// VERİ HAVUZU
let havuz = { duyuru: "", mesaj: "", ozelHedef: "", kickHedef: "", chatTemizle: false };
let sunucuDurum = { aktif: false, sonGorulme: 0, oyuncular: [] };

app.use(express.json());

// --- ROBLOX İLETİŞİM NOKTASI ---
app.all('/kontrol', (req, res) => {
    if (req.method === 'POST') {
        sunucuDurum.aktif = true;
        sunucuDurum.sonGorulme = Date.now();
        sunucuDurum.oyuncular = req.body.oyuncular || [];
        return res.status(200).json({ status: "ok" });
    }
    // GET İsteğinde komutları gönder ve hemen sıfırla
    res.status(200).json(havuz);
    havuz.duyuru = ""; 
    havuz.ozelHedef = ""; 
    havuz.kickHedef = ""; 
    havuz.chatTemizle = false;
});

app.get('/', (req, res) => res.send("Sistem Başmühendisi Çevrimiçi ve 7/24 Aktif!"));

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// --- KOMUT KAYITLARI ---
const commands = [
    new SlashCommandBuilder().setName('durum').setDescription('Sunucu aktifliğini ve oyuncu listesini gösterir.'),
    new SlashCommandBuilder().setName('duyuru').setDescription('Tüm sunucuya duyuru atar.').addStringOption(o => o.setName('mesaj').setDescription('Mesaj içeriği').setRequired(true)),
    new SlashCommandBuilder().setName('mesaj').setDescription('Bir kişiye özel mesaj gönderir.').addStringOption(o => o.setName('oyuncu').setDescription('Username').setRequired(true)).addStringOption(o => o.setName('icerik').setDescription('Mesaj içeriği').setRequired(true)),
    new SlashCommandBuilder().setName('shutdown').setDescription('Sunucuyu kapatır ve günceller.').addStringOption(o => o.setName('sebep').setDescription('Neden?').setRequired(true)),
    new SlashCommandBuilder().setName('kick').setDescription('Oyuncuyu atar.').addStringOption(o => o.setName('oyuncu').setDescription('Kişi').setRequired(true)),
    new SlashCommandBuilder().setName('chat-temizle').setDescription('Sohbeti herkes için temizler.')
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.once('ready', async () => {
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log(`✅ BAŞARILI: ${client.user.tag} girişi yaptı ve komutlar yüklendi!`);
    } catch (e) { console.error("Kayıt Hatası:", e); }
});

// --- KOMUT YÖNETİMİ ---
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    try { await interaction.deferReply(); } catch (e) { return; }

    const { commandName, options } = interaction;

    if (commandName === 'durum') {
        const isOnline = (Date.now() - sunucuDurum.sonGorulme) / 1000 < 30;
        const liste = sunucuDurum.oyuncular.length > 0 ? sunucuDurum.oyuncular.join(", ") : "Kimse yok.";

        const embed = new EmbedBuilder()
            .setTitle('🎮 Sunucu Durum Raporu')
            .setColor(isOnline ? 0x00FF00 : 0xFF0000)
            .addFields(
                { name: 'Durum', value: isOnline ? "🟢 Aktif" : "🔴 Kapalı", inline: true },
                { name: 'Oyuncu Sayısı', value: `${sunucuDurum.oyuncular.length}`, inline: true },
                { name: 'Aktif Oyuncular', value: "```" + liste + "```" }
            )
            .setTimestamp();
        await interaction.editReply({ embeds: [embed] });

    } else if (commandName === 'duyuru') {
        havuz.duyuru = "NORMAL_DUYURU";
        havuz.mesaj = options.getString('mesaj');
        await interaction.editReply("📢 Duyuru Roblox sunucusuna iletildi.");

    } else if (commandName === 'mesaj') {
        havuz.duyuru = "OZEL_MESAJ";
        havuz.ozelHedef = options.getString('oyuncu');
        havuz.mesaj = options.getString('icerik');
        await interaction.editReply(`✉️ **${havuz.ozelHedef}** için özel mesaj sıraya alındı.`);

    } else if (commandName === 'shutdown') {
        havuz.duyuru = "SUNUCUYU_KAPAT_ACIL";
        havuz.mesaj = options.getString('sebep');
        await interaction.editReply(`🛑 Shutdown emri verildi! Sebep: ${havuz.mesaj}`);

    } else if (commandName === 'kick') {
        havuz.kickHedef = options.getString('oyuncu');
        await interaction.editReply(`👞 **${havuz.kickHedef}** sunucudan atılıyor.`);

    } else if (commandName === 'chat-temizle') {
        havuz.chatTemizle = true;
        await interaction.editReply(`🧹 Sohbet temizleme komutu iletildi.`);
    }
});

// --- 7/24 UYANIK TUTMA SİSTEMİ (SELF-PING) ---
app.listen(port, () => {
    console.log(`Web servisi ${port} portunda hazır.`);
    
    // Her 5 dakikada bir kendi adresine "tık" atar
    setInterval(() => {
        https.get(MY_URL, (res) => {
            console.log("Self-Ping: Bot uyanık tutuldu.");
        }).on('error', (e) => {
            console.error("Ping Hatası:", e.message);
        });
    }, 300000); // 300.000 ms = 5 dakika
});

client.login(process.env.TOKEN);
