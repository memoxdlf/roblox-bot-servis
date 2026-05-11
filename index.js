const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// VERİ HAVUZU VE DURUM TAKİBİ
let havuz = { duyuru: "", mesaj: "", ozelHedef: "", kickHedef: "", chatTemizle: false };
let sunucuDurum = { aktif: false, sonGorulme: 0, oyuncular: [] };

app.use(express.json());

// Roblox hem veri çeker hem de kendi durumunu post eder
app.all('/kontrol', (req, res) => {
    // Roblox'tan gelen oyuncu listesini ve aktiflik bilgisini kaydet
    if (req.method === 'POST') {
        sunucuDurum.aktif = true;
        sunucuDurum.sonGorulme = Date.now();
        sunucuDurum.oyuncular = req.body.oyuncular || [];
        return res.status(200).json({ status: "alindi" });
    }
    
    // Roblox veri çekerken (GET) havuzu gönder
    res.status(200).json(havuz);
    havuz.duyuru = ""; havuz.ozelHedef = ""; havuz.kickHedef = ""; havuz.chatTemizle = false;
});

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [
    new SlashCommandBuilder().setName('durum').setDescription('Oyun aktifliğini ve oyuncu listesini gösterir.'),
    new SlashCommandBuilder().setName('duyuru').setDescription('Duyuru atar.').addStringOption(o => o.setName('mesaj').setRequired(true).setDescription('Mesaj')),
    new SlashCommandBuilder().setName('mesaj').setDescription('Özel mesaj.').addStringOption(o => o.setName('oyuncu').setRequired(true).setDescription('Kişi')).addStringOption(o => o.setName('icerik').setRequired(true).setDescription('İçerik')),
    new SlashCommandBuilder().setName('kick').setDescription('Atar.').addStringOption(o => o.setName('oyuncu').setRequired(true).setDescription('Kişi')),
    new SlashCommandBuilder().setName('shutdown').setDescription('Kapatır.').addStringOption(o => o.setName('sebep').setRequired(true).setDescription('Neden')),
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.once('ready', async () => {
    try { await rest.put(Routes.applicationCommands(client.user.id), { body: commands }); } catch (e) {}
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    await interaction.deferReply();

    if (interaction.commandName === 'durum') {
        const simdi = Date.now();
        const fark = (simdi - sunucuDurum.sonGorulme) / 1000;
        
        // Son 10 saniye içinde sinyal gelmişse AKTİF sayılır
        const isOnline = fark < 15; 
        const statusColor = isOnline ? 0x00FF00 : 0xFF0000;
        const statusText = isOnline ? "🟢 AKTİF" : "🔴 ÇEVRİMDIŞI";

        const embed = new EmbedBuilder()
            .setTitle('🎮 Oyun Sunucu Durumu')
            .setColor(statusColor)
            .addFields(
                { name: 'Sunucu Durumu', value: statusText, inline: true },
                { name: 'Oyuncu Sayısı', value: `${sunucuDurum.oyuncular.length} Kişi`, inline: true },
                { name: 'Oyundakiler', value: sunucuDurum.oyuncular.length > 0 ? sunucuDurum.oyuncular.join('\n') : 'Kimse yok.' }
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    } else if (interaction.commandName === 'duyuru') {
        havuz.duyuru = "NORMAL_DUYURU";
        havuz.mesaj = interaction.options.getString('mesaj');
        await interaction.editReply("📢 Duyuru gönderildi.");
    }
    // ... (diğer komutlar aynı kalacak)
});

app.listen(port);
client.login(process.env.TOKEN);
