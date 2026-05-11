const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// SİSTEM HAFIZASI
let havuz = { 
    duyuru: "", 
    mesaj: "", 
    kickHedef: "", 
    paraHedef: null, 
    paraMiktar: null,
    chatTemizle: false,
    p: 0, m: 0, aktifOyuncular: [] 
};

app.use(express.json());

// ROBLOX VERİ ÇEKME NOKTASI
app.get('/kontrol', (req, res) => {
    if (req.query.p) havuz.p = req.query.p;
    if (req.query.m) havuz.m = req.query.m;
    if (req.query.users) havuz.aktifOyuncular = req.query.users.split(",");

    res.json(havuz);
    
    // VERİ GÖNDERİLDİKTEN SONRA SIFIRLA (KRİTİK)
    havuz.duyuru = ""; 
    havuz.kickHedef = ""; 
    havuz.paraHedef = null;
    havuz.paraMiktar = null;
    havuz.chatTemizle = false;
});

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [
    new SlashCommandBuilder().setName('shutdown').setDescription('Sunucuyu güncelleyerek yeniden başlatır.').addStringOption(o => o.setName('sebep').setDescription('Neden?').setRequired(true)),
    new SlashCommandBuilder().setName('kick').setDescription('Oyuncuyu sunucudan atar.').addStringOption(o => o.setName('oyuncu').setDescription('Adı').setRequired(true)),
    new SlashCommandBuilder().setName('para-ver').setDescription('Oyuncuya nakit verir.').addStringOption(o => o.setName('oyuncu').setDescription('Adı').setRequired(true)).addIntegerOption(o => o.setName('miktar').setDescription('Miktar').setRequired(true)),
    new SlashCommandBuilder().setName('duyuru').setDescription('Ekrana yazı gönderir.').addStringOption(o => o.setName('mesaj').setDescription('Yazı').setRequired(true)),
    new SlashCommandBuilder().setName('chat-temizle').setDescription('Oyun chatini temizler.'),
    new SlashCommandBuilder().setName('durum').setDescription('Aktif oyuncu sayısı.')
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.once('ready', async () => {
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('Komutlar başarıyla yüklendi!');
    } catch (e) { console.error(e); }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'shutdown') {
        havuz.duyuru = "SUNUCUYU_KAPAT_ACIL";
        havuz.mesaj = interaction.options.getString('sebep');
        await interaction.reply("🛑 Sunucu kapatma ve rejoin işlemi başlatıldı.");
    } else if (interaction.commandName === 'para-ver') {
        havuz.paraHedef = interaction.options.getString('oyuncu');
        havuz.paraMiktar = interaction.options.getInteger('miktar');
        await interaction.reply(`💸 **${havuz.paraHedef}** oyuncusuna **${havuz.paraMiktar} TL** aktarılıyor.`);
    } else if (interaction.commandName === 'chat-temizle') {
        havuz.chatTemizle = true;
        await interaction.reply("🧹 Oyun içi sohbet temizlendi.");
    } else if (interaction.commandName === 'kick') {
        havuz.kickHedef = interaction.options.getString('oyuncu');
        await interaction.reply(`👞 **${havuz.kickHedef}** sunucudan uzaklaştırıldı.`);
    } else if (interaction.commandName === 'duyuru') {
        havuz.duyuru = interaction.options.getString('mesaj');
        await interaction.reply("📢 Ekran duyurusu gönderildi.");
    } else if (interaction.commandName === 'durum') {
        await interaction.reply(`📊 **Aktif Oyuncu:** ${havuz.p} / ${havuz.m}`);
    }
});

app.listen(port);
client.login(process.env.TOKEN);
