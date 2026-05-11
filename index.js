const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, MessageFlags } = require('discord.js');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// ROBLOX'UN BEKLEDİĞİ ANAHTARLAR
let havuz = { duyuru: "", mesaj: "", kickHedef: "", chatTemizle: false };

app.use(express.json());

app.get('/kontrol', (req, res) => {
    res.json(havuz);
    // Roblox veriyi çektiği an sıfırla ki döngüye girmesin
    havuz.duyuru = ""; 
    havuz.kickHedef = ""; 
    havuz.chatTemizle = false;
});

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [
    new SlashCommandBuilder().setName('shutdown').setDescription('Sunucuyu günceller.').addStringOption(o => o.setName('sebep').setDescription('Neden?').setRequired(true)),
    new SlashCommandBuilder().setName('duyuru').setDescription('Ekrana duyuru gönderir.').addStringOption(o => o.setName('mesaj').setDescription('Metin?').setRequired(true)),
    new SlashCommandBuilder().setName('kick').setDescription('Oyuncuyu atar.').addStringOption(o => o.setName('oyuncu').setDescription('Username?').setRequired(true)),
    new SlashCommandBuilder().setName('chat-temizle').setDescription('Sohbeti temizler.')
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.once('ready', async () => {
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('Komutlar yüklendi.');
    } catch (e) { console.error(e); }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    try { await interaction.deferReply({ flags: MessageFlags.Ephemeral }); } catch (e) { return; }

    const cmd = interaction.commandName;

    if (cmd === 'duyuru') {
        havuz.duyuru = "NORMAL_DUYURU"; // Roblox bu etiketi bekliyor
        havuz.mesaj = interaction.options.getString('mesaj');
        await interaction.editReply("📢 Duyuru sisteme iletildi.");
    } else if (cmd === 'shutdown') {
        havuz.duyuru = "SUNUCUYU_KAPAT_ACIL";
        havuz.mesaj = interaction.options.getString('sebep');
        await interaction.editReply("🛑 Shutdown başlatıldı.");
    } else if (cmd === 'kick') {
        havuz.kickHedef = interaction.options.getString('oyuncu');
        await interaction.editReply(`👞 ${havuz.kickHedef} atılıyor.`);
    } else if (cmd === 'chat-temizle') {
        havuz.chatTemizle = true;
        await interaction.editReply("🧹 Chat temizleniyor.");
    }
});

app.listen(port);
client.login(process.env.TOKEN);
