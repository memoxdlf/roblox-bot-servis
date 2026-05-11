const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// VERİ HAVUZU
let havuz = { 
    duyuru: "", 
    mesaj: "", 
    ozelHedef: "", 
    kickHedef: "", 
    chatTemizle: false 
};

app.use(express.json());

app.get('/kontrol', (req, res) => {
    res.status(200).json(havuz);
    // Roblox okuyunca temizle
    havuz.duyuru = ""; 
    havuz.ozelHedef = ""; 
    havuz.kickHedef = ""; 
    havuz.chatTemizle = false;
});

app.get('/', (req, res) => res.send("Bot Aktif!"));

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// KOMUTLARI TANIMLA
const commands = [
    new SlashCommandBuilder()
        .setName('mesaj')
        .setDescription('Bir kişiye özel mesaj gönderir.')
        .addStringOption(o => o.setName('oyuncu').setDescription('Kullanıcı adı').setRequired(true))
        .addStringOption(o => o.setName('icerik').setDescription('Mesajın ne?').setRequired(true)),
    new SlashCommandBuilder()
        .setName('duyuru')
        .setDescription('Tüm sunucuya duyuru atar.')
        .addStringOption(o => o.setName('mesaj').setDescription('Mesajın ne?').setRequired(true)),
    new SlashCommandBuilder().setName('shutdown').setDescription('Sunucuyu günceller.').addStringOption(o => o.setName('sebep').setDescription('Neden?').setRequired(true)),
    new SlashCommandBuilder().setName('kick').setDescription('Oyuncuyu atar.').addStringOption(o => o.setName('oyuncu').setDescription('Kullanıcı adı').setRequired(true)),
    new SlashCommandBuilder().setName('chat-temizle').setDescription('Sohbeti temizler.')
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.once('ready', async () => {
    try {
        // Komutları Discord'a kaydet (Listede çıkması için şart)
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('Komutlar yüklendi ve mesaj komutu eklendi!');
    } catch (e) { console.error(e); }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    // "Unknown interaction" hatasını önlemek için anında cevap başlat
    try { await interaction.deferReply(); } catch (e) { return; }

    const { commandName, options } = interaction;

    if (commandName === 'mesaj') {
        havuz.duyuru = "OZEL_MESAJ";
        havuz.ozelHedef = options.getString('oyuncu');
        havuz.mesaj = options.getString('icerik');
        await interaction.editReply(`✉️ **${havuz.ozelHedef}** oyuncusuna mesaj gönderildi.`);
    } else if (commandName === 'duyuru') {
        havuz.duyuru = "NORMAL_DUYURU";
        havuz.mesaj = options.getString('mesaj');
        await interaction.editReply(`📢 Duyuru iletildi: ${havuz.mesaj}`);
    } else if (commandName === 'shutdown') {
        havuz.duyuru = "SUNUCUYU_KAPAT_ACIL";
        havuz.mesaj = options.getString('sebep');
        await interaction.editReply(`🛑 Shutdown başlatıldı.`);
    } else if (commandName === 'kick') {
        havuz.kickHedef = options.getString('oyuncu');
        await interaction.editReply(`👞 ${havuz.kickHedef} atıldı.`);
    } else if (commandName === 'chat-temizle') {
        havuz.chatTemizle = true;
        await interaction.editReply(`🧹 Chat temizlendi.`);
    }
});

app.listen(port);
client.login(process.env.TOKEN);
