const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// VERİ HAVUZU
let havuz = { duyuru: "", mesaj: "", ozelHedef: "", kickHedef: "", chatTemizle: false };
let sunucuDurum = { aktif: false, sonGorulme: 0, oyuncular: [] };

app.use(express.json());

// ROBLOX İLETİŞİM NOKTASI (Hem POST hem GET destekli)
app.all('/kontrol', (req, res) => {
    if (req.method === 'POST') {
        sunucuDurum.aktif = true;
        sunucuDurum.sonGorulme = Date.now();
        sunucuDurum.oyuncular = req.body.oyuncular || [];
        return res.status(200).json({ status: "ok" });
    }
    // GET İsteğinde havuzu gönder ve temizle
    res.status(200).json(havuz);
    havuz.duyuru = ""; 
    havuz.ozelHedef = ""; 
    havuz.kickHedef = ""; 
    havuz.chatTemizle = false;
});

app.get('/', (req, res) => res.send("Sistem Başmühendisi Çevrimiçi!"));

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// SLASH KOMUTLARI
const commands = [
    new SlashCommandBuilder().setName('durum').setDescription('Sunucu aktifliğini ve oyuncuları gösterir.'),
    new SlashCommandBuilder().setName('duyuru').setDescription('Tüm sunucuya duyuru atar.').addStringOption(o => o.setName('mesaj').setDescription('Mesaj içeriği').setRequired(true)),
    new SlashCommandBuilder().setName('mesaj').setDescription('Birine özel mesaj gönderir.').addStringOption(o => o.setName('oyuncu').setDescription('Kullanıcı adı').setRequired(true)).addStringOption(o => o.setName('icerik').setDescription('Mesaj').setRequired(true)),
    new SlashCommandBuilder().setName('shutdown').setDescription('Sunucuyu kapatır ve günceller.').addStringOption(o => o.setName('sebep').setDescription('Neden?').setRequired(true)),
    new SlashCommandBuilder().setName('kick').setDescription('Oyuncuyu atar.').addStringOption(o => o.setName('oyuncu').setDescription('Username').setRequired(true)),
    new SlashCommandBuilder().setName('chat-temizle').setDescription('Sohbeti temizler.')
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.once('ready', async () => {
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log(`${client.user.tag} girişi yaptı, komutlar hazır!`);
    } catch (e) { console.error("Yükleme hatası:", e); }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    try { await interaction.deferReply(); } catch (e) { return; }

    const { commandName, options } = interaction;

    if (commandName === 'durum') {
        const simdi = Date.now();
        const isOnline = (simdi - sunucuDurum.sonGorulme) / 1000 < 25;
        const liste = sunucuDurum.oyuncular.length > 0 ? sunucuDurum.oyuncular.join(", ") : "Kimse yok.";

        const embed = new EmbedBuilder()
            .setTitle('🎮 Sunucu Durum Raporu')
            .setColor(isOnline ? 0x00FF00 : 0xFF0000)
            .addFields(
                { name: 'Durum', value: isOnline ? "🟢 Aktif" : "🔴 Kapalı", inline: true },
                { name: 'Oyuncu Sayısı', value: `${sunucuDurum.oyuncular.length}`, inline: true },
                { name: 'Oyundakiler', value: "```" + liste + "```" }
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
        await interaction.editReply(`✉️ **${havuz.ozelHedef}** oyuncusuna özel mesaj gönderildi.`);
    } else if (commandName === 'shutdown') {
        havuz.duyuru = "SUNUCUYU_KAPAT_ACIL";
        havuz.mesaj = options.getString('sebep');
        await interaction.editReply(`🛑 Shutdown emri verildi!`);
    } else if (commandName === 'kick') {
        havuz.kickHedef = options.getString('oyuncu');
        await interaction.editReply(`👞 **${havuz.kickHedef}** sunucudan atıldı.`);
    } else if (commandName === 'chat-temizle') {
        havuz.chatTemizle = true;
        await interaction.editReply(`🧹 Chat temizlendi.`);
    }
});

app.listen(port, () => console.log(`Web servisi ${port} portunda hazır.`));
client.login(process.env.TOKEN);
