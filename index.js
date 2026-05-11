const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// SİSTEM HAFIZASI
let havuz = { duyuru: "", mesaj: "", kickHedef: "", chatTemizle: false };

app.use(express.json());

app.get('/kontrol', (req, res) => {
    res.json(havuz);
    // Veriyi Roblox çektiği an sıfırla
    havuz.duyuru = ""; 
    havuz.mesaj = "";
    havuz.kickHedef = ""; 
    havuz.chatTemizle = false;
});

app.get('/', (req, res) => res.send("Sistem Başmühendisi Aktif!"));

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// KOMUTLAR (Ekran görüntülerindeki tüm komutlar dahil)
const commands = [
    new SlashCommandBuilder().setName('shutdown').setDescription('Sunucuyu GÜNCELLEYEREK yeniden başlatır (Rejoin).').addStringOption(o => o.setName('sebep').setDescription('Neden?').setRequired(true)),
    new SlashCommandBuilder().setName('duyuru').setDescription('Ekrana sistem duyurusu gönderir.').addStringOption(o => o.setName('mesaj').setDescription('Duyuru Metni').setRequired(true)),
    new SlashCommandBuilder().setName('kick').setDescription('Oyuncuyu sunucudan atar.').addStringOption(o => o.setName('oyuncu').setDescription('Kullanıcı Adı').setRequired(true)),
    new SlashCommandBuilder().setName('chat-temizle').setDescription('Oyun içindeki tüm sohbeti temizler.')
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.once('ready', async () => {
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('Komutlar yüklendi!');
    } catch (e) { console.error(e); }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    await interaction.deferReply(); // 3 saniye zaman aşımı hatasını önler

    if (interaction.commandName === 'shutdown') {
        havuz.duyuru = "SUNUCUYU_KAPAT_ACIL";
        havuz.mesaj = interaction.options.getString('sebep');
        await interaction.editReply("🛑 **Shutdown** işlemi başlatıldı.");
    } else if (interaction.commandName === 'duyuru') {
        havuz.duyuru = "NORMAL_DUYURU";
        havuz.mesaj = interaction.options.getString('mesaj');
        await interaction.editReply("📢 **Duyuru** başarıyla gönderildi.");
    } else if (interaction.commandName === 'kick') {
        havuz.kickHedef = interaction.options.getString('oyuncu');
        await interaction.editReply(`👞 **${havuz.kickHedef}** sunucudan atıldı.`);
    } else if (interaction.commandName === 'chat-temizle') {
        havuz.chatTemizle = true;
        await interaction.editReply("🧹 Chat temizlendi.");
    }
});

app.listen(port);
client.login(process.env.TOKEN);
