const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

let havuz = { duyuru: "", mesaj: "", kickHedef: "", chatTemizle: false };

app.use(express.json());

app.get('/kontrol', (req, res) => {
    res.json(havuz);
    havuz.duyuru = ""; 
    havuz.kickHedef = ""; 
    havuz.chatTemizle = false;
});

app.get('/', (req, res) => res.send("Sistem Başmühendisi Merkezi Aktif."));

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [
    new SlashCommandBuilder().setName('shutdown').setDescription('Sunucuyu günceller ve Rejoin atar.').addStringOption(o => o.setName('sebep').setDescription('Sebep?').setRequired(true)),
    new SlashCommandBuilder().setName('duyuru').setDescription('Ekrana büyük duyuru gönderir.').addStringOption(o => o.setName('mesaj').setDescription('Metin?').setRequired(true)),
    new SlashCommandBuilder().setName('kick').setDescription('Oyuncuyu sunucudan atar.').addStringOption(o => o.setName('oyuncu').setDescription('Username?').setRequired(true)),
    new SlashCommandBuilder().setName('chat-temizle').setDescription('Sohbeti herkes için temizler.')
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.once('ready', async () => {
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('Komutlar başarıyla senkronize edildi.');
    } catch (e) { console.error("Yükleme hatası:", e); }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    // Loglardaki hatayı ve uyarıyı çözen yeni deferReply yapısı
    try {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    } catch (e) { return; }

    const cmd = interaction.commandName;

    try {
        if (cmd === 'shutdown') {
            havuz.duyuru = "SHUTDOWN_MODU";
            havuz.mesaj = interaction.options.getString('sebep');
            await interaction.editReply("🛑 **Shutdown** işlemi havuzuna eklendi.");
        } else if (cmd === 'duyuru') {
            havuz.duyuru = "NORMAL_DUYURU";
            havuz.mesaj = interaction.options.getString('mesaj');
            await interaction.editReply("📢 **Duyuru** başarıyla oyuna gönderildi.");
        } else if (cmd === 'kick') {
            havuz.kickHedef = interaction.options.getString('oyuncu');
            await interaction.editReply(`👞 **${havuz.kickHedef}** için kick komutu gönderildi.`);
        } else if (cmd === 'chat-temizle') {
            havuz.chatTemizle = true;
            await interaction.editReply("🧹 **Chat** temizleme komutu gönderildi.");
        }
    } catch (error) {
        console.error("İşlem hatası:", error);
    }
});

app.listen(port);
client.login(process.env.TOKEN);
