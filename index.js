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

// ROBLOX VERİ ÇEKME NOKTASI (POLLING)
app.get('/kontrol', (req, res) => {
    // İstatistikleri güncelle
    if (req.query.p) havuz.p = req.query.p;
    if (req.query.m) havuz.m = req.query.m;
    if (req.query.users) havuz.aktifOyuncular = req.query.users.split(",");

    // Verileri Roblox'a gönder
    res.json(havuz);
    
    // KRİTİK: Gönderilen tek seferlik verileri sıfırla (Sürekli kicklenme veya para eklenmesini önler)
    havuz.duyuru = ""; 
    havuz.kickHedef = ""; 
    havuz.paraHedef = null;
    havuz.paraMiktar = null;
    havuz.chatTemizle = false;
});

app.get('/', (req, res) => res.send("Sistem Başmühendisi Aktif!"));

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// KOMUT TANIMLAMALARI
const commands = [
    new SlashCommandBuilder().setName('shutdown').setDescription('Sunucuyu güncelleyerek yeniden başlatır.').addStringOption(o => o.setName('sebep').setDescription('Neden?').setRequired(true)),
    new SlashCommandBuilder().setName('kick').setDescription('Oyuncuyu sunucudan atar.').addStringOption(o => o.setName('oyuncu').setDescription('Kullanıcı Adı').setRequired(true)),
    new SlashCommandBuilder().setName('para-ver').setDescription('Oyuncuya nakit gönderir.').addStringOption(o => o.setName('oyuncu').setDescription('Kullanıcı Adı').setRequired(true)).addIntegerOption(o => o.setName('miktar').setDescription('Miktar').setRequired(true)),
    new SlashCommandBuilder().setName('duyuru').setDescription('Ekrana sistem duyurusu gönderir.').addStringOption(o => o.setName('mesaj').setDescription('Duyuru metni').setRequired(true)),
    new SlashCommandBuilder().setName('chat-temizle').setDescription('Oyun içindeki tüm sohbeti temizler.'),
    new SlashCommandBuilder().setName('durum').setDescription('Sunucudaki aktif oyuncu sayısını gösterir.')
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
        await interaction.reply("🛑 Shutdown ve Rejoin işlemi başlatıldı.");
    } else if (interaction.commandName === 'para-ver') {
        havuz.paraHedef = interaction.options.getString('oyuncu');
        havuz.paraMiktar = interaction.options.getInteger('miktar');
        await interaction.reply(`💸 **${havuz.paraHedef}** isimli oyuncuya **${havuz.paraMiktar} TL** gönderiliyor.`);
    } else if (interaction.commandName === 'chat-temizle') {
        havuz.chatTemizle = true;
        await interaction.reply("🧹 Oyun içi sohbet başarıyla temizlendi.");
    } else if (interaction.commandName === 'kick') {
        havuz.kickHedef = interaction.options.getString('oyuncu');
        await interaction.reply(`👞 **${havuz.kickHedef}** sunucudan uzaklaştırıldı.`);
    } else if (interaction.commandName === 'duyuru') {
        havuz.duyuru = interaction.options.getString('mesaj');
        await interaction.reply("📢 Duyuru yapıldı.");
    } else if (interaction.commandName === 'durum') {
        await interaction.reply(`📊 **Aktif Oyuncu:** ${havuz.p} / ${havuz.m}`);
    }
});

app.listen(port);
client.login(process.env.TOKEN);
