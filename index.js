const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// --- VERİ MERKEZİ ---
let havuz = { duyuru: "", mesaj: "", ozelHedef: "", kickHedef: "", chatTemizle: false };
let sunucuDurum = { aktif: false, sonGorulme: 0, oyuncular: [] };

app.use(express.json());

// Roblox İletişim Kapısı
app.all('/kontrol', (req, res) => {
    if (req.method === 'POST') {
        sunucuDurum.aktif = true;
        sunucuDurum.sonGorulme = Date.now();
        sunucuDurum.oyuncular = req.body.oyuncular || [];
        return res.status(200).json({ status: "ok" });
    }
    // GET İsteğinde komutları gönder ve havuzu boşalt
    res.status(200).json(havuz);
    havuz.duyuru = ""; 
    havuz.ozelHedef = ""; 
    havuz.kickHedef = ""; 
    havuz.chatTemizle = false;
});

app.get('/', (req, res) => res.send("Sistem Başmühendisi Çevrimiçi!"));

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// --- KOMUT KAYIT SİSTEMİ ---
const commands = [
    new SlashCommandBuilder().setName('durum').setDescription('Sunucu aktifliğini ve oyuncu listesini gösterir.'),
    new SlashCommandBuilder().setName('duyuru').setDescription('Tüm sunucuya büyük duyuru atar.').addStringOption(o => o.setName('mesaj').setDescription('Duyuru metni').setRequired(true)),
    new SlashCommandBuilder().setName('mesaj').setDescription('Bir kişiye özel mesaj gönderir.').addStringOption(o => o.setName('oyuncu').setDescription('Username').setRequired(true)).addStringOption(o => o.setName('icerik').setDescription('Mesaj içeriği').setRequired(true)),
    new SlashCommandBuilder().setName('shutdown').setDescription('Sunucuyu günceller.').addStringOption(o => o.setName('sebep').setDescription('Neden?').setRequired(true)),
    new SlashCommandBuilder().setName('kick').setDescription('Oyuncuyu atar.').addStringOption(o => o.setName('oyuncu').setDescription('Username').setRequired(true)),
    new SlashCommandBuilder().setName('chat-temizle').setDescription('Sohbeti herkes için temizler.')
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.once('ready', async () => {
    try {
        console.log("Komutlar senkronize ediliyor...");
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log("✅ BAŞARILI: /durum dahil tüm komutlar yüklendi!");
    } catch (e) { console.error("❌ KAYIT HATASI:", e); }
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
                { name: 'Durum', value: isOnline ? "🟢 AKTİF" : "🔴 ÇEVRİMDIŞI", inline: true },
                { name: 'Oyuncu Sayısı', value: `${sunucuDurum.oyuncular.length}`, inline: true },
                { name: 'Aktif Oyuncular', value: "```" + liste + "```" }
            )
            .setTimestamp();
        await interaction.editReply({ embeds: [embed] });

    } else if (commandName === 'duyuru') {
        havuz.duyuru = "NORMAL_DUYURU";
        havuz.mesaj = options.getString('mesaj');
        await interaction.editReply(`📢 Duyuru iletildi: **${havuz.mesaj}**`);

    } else if (commandName === 'mesaj') {
        havuz.duyuru = "OZEL_MESAJ";
        havuz.ozelHedef = options.getString('oyuncu');
        havuz.mesaj = options.getString('icerik');
        await interaction.editReply(`✉️ **${havuz.ozelHedef}** için özel mesaj iletildi.`);

    } else if (commandName === 'shutdown') {
        havuz.duyuru = "SUNUCUYU_KAPAT_ACIL";
        havuz.mesaj = options.getString('sebep');
        await interaction.editReply(`🛑 Shutdown emri verildi!`);

    } else if (commandName === 'kick') {
        havuz.kickHedef = options.getString('oyuncu');
        await interaction.editReply(`👞 **${havuz.kickHedef}** atıldı.`);

    } else if (commandName === 'chat-temizle') {
        havuz.chatTemizle = true;
        await interaction.editReply(`🧹 Sohbet temizlendi.`);
    }
});

app.listen(port, () => console.log(`Servis ${port} portunda hazır.`));
client.login(process.env.TOKEN);
