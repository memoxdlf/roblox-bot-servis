const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// SİSTEM HAFIZASI (Sadece Yönetim)
let havuz = { duyuru: "", mesaj: "", kickHedef: "", chatTemizle: false };

app.use(express.json());

app.get('/kontrol', (req, res) => {
    res.json(havuz);
    // Roblox veriyi çektiği an havuzu temizle (Tekrarı ve ban hatalarını önler)
    havuz.duyuru = ""; 
    havuz.kickHedef = ""; 
    havuz.chatTemizle = false;
});

app.get('/', (req, res) => res.send("Yönetim Paneli Aktif!"));

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [
    new SlashCommandBuilder().setName('shutdown').setDescription('Sunucuyu günceller ve herkesi aktarır.').addStringOption(o => o.setName('sebep').setDescription('Neden?').setRequired(true)),
    new SlashCommandBuilder().setName('kick').setDescription('Oyuncuyu sunucudan atar.').addStringOption(o => o.setName('oyuncu').setDescription('Kullanıcı Adı').setRequired(true)),
    new SlashCommandBuilder().setName('chat-temizle').setDescription('Oyun içindeki tüm sohbeti temizler.')
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.once('ready', async () => {
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('Yönetim Botu Hazır!');
    } catch (e) { console.error(e); }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'shutdown') {
        havuz.duyuru = "SUNUCUYU_KAPAT_ACIL";
        havuz.mesaj = interaction.options.getString('sebep');
        await interaction.reply("✅ **Shutdown** işlemi başlatıldı.");
    } else if (interaction.commandName === 'kick') {
        havuz.kickHedef = interaction.options.getString('oyuncu');
        await interaction.reply(`👞 **${havuz.kickHedef}** sunucudan atıldı.`);
    } else if (interaction.commandName === 'chat-temizle') {
        havuz.chatTemizle = true;
        await interaction.reply("🧹 Chat başarıyla temizlendi.");
    }
});

app.listen(port);
client.login(process.env.TOKEN);
