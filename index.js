const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// ROBLOX VERİ HAVUZU
let havuz = { duyuru: "", mesaj: "", kickHedef: "", chatTemizle: false };

app.use(express.json());

// ROBLOX VERİ ÇEKME NOKTASI
app.get('/kontrol', (req, res) => {
    try {
        res.status(200).json(havuz);
        // Veriyi Roblox'a verdikten sonra temizle
        havuz.duyuru = ""; 
        havuz.kickHedef = ""; 
        havuz.chatTemizle = false;
    } catch (e) { console.error("Havuz hatası:", e); }
});

app.get('/', (req, res) => res.send("Sistem Başmühendisi Aktif!"));

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// KOMUT TANIMLARI
const commands = [
    new SlashCommandBuilder().setName('shutdown').setDescription('Sunucuyu günceller ve aktarır.').addStringOption(o => o.setName('sebep').setDescription('Neden?').setRequired(true)),
    new SlashCommandBuilder().setName('duyuru').setDescription('Ekrana duyuru gönderir.').addStringOption(o => o.setName('mesaj').setDescription('Mesaj içeriği?').setRequired(true)),
    new SlashCommandBuilder().setName('kick').setDescription('Oyuncuyu atar.').addStringOption(o => o.setName('oyuncu').setDescription('Kullanıcı adı?').setRequired(true)),
    new SlashCommandBuilder().setName('chat-temizle').setDescription('Sohbeti temizler.')
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.once('ready', async () => {
    try {
        console.log(`${client.user.tag} girişi yapıldı!`);
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('Komutlar senkronize edildi.');
    } catch (e) { console.error(e); }
});

// KOMUTLARI DİNLEME VE CEVAPLAMA
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    // KRİTİK: interaction.deferReply() içine hiçbir şey yazma ki mesaj GİZLİ OLMASIN.
    try {
        await interaction.deferReply(); 
    } catch (e) {
        console.error("Etkileşim başlatma hatası:", e);
        return;
    }

    const { commandName, options } = interaction;

    try {
        if (commandName === 'duyuru') {
            havuz.duyuru = "NORMAL_DUYURU";
            havuz.mesaj = options.getString('mesaj');
            await interaction.editReply(`📢 **Sistem Duyurusu Gönderildi:** ${havuz.mesaj}`);
        } 
        else if (commandName === 'shutdown') {
            havuz.duyuru = "SUNUCUYU_KAPAT_ACIL";
            havuz.mesaj = options.getString('sebep');
            await interaction.editReply(`🛑 **Shutdown Başlatıldı:** ${havuz.mesaj}`);
        } 
        else if (commandName === 'kick') {
            havuz.kickHedef = options.getString('oyuncu');
            await interaction.editReply(`👞 **${havuz.kickHedef}** sunucudan atıldı.`);
        } 
        else if (commandName === 'chat-temizle') {
            havuz.chatTemizle = true;
            await interaction.editReply(`🧹 **Sohbet temizleme komutu iletildi.**`);
        }
    } catch (err) {
        console.error("Komut işleme hatası:", err);
        try { await interaction.editReply("❌ Bir hata oluştu."); } catch(e){}
    }
});

app.listen(port, () => console.log(`Web servisi hazır.`));
client.login(process.env.TOKEN);
