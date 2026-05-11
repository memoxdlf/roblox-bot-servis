const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// ROBLOX VERİ HAVUZU
let havuz = { 
    duyuru: "", 
    mesaj: "", 
    ozelHedef: "", // Özel mesaj gidecek kişi
    kickHedef: "", 
    chatTemizle: false 
};

app.use(express.json());

app.get('/kontrol', (req, res) => {
    try {
        res.status(200).json(havuz);
        // Veriyi Roblox çektiği an sıfırla
        havuz.duyuru = ""; 
        havuz.ozelHedef = ""; 
        havuz.kickHedef = ""; 
        havuz.chatTemizle = false;
    } catch (e) { console.error("Havuz hatası:", e); }
});

app.get('/', (req, res) => res.send("Sistem Başmühendisi Aktif!"));

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// KOMUT TANIMLARI
const commands = [
    new SlashCommandBuilder().setName('shutdown').setDescription('Sunucuyu günceller.').addStringOption(o => o.setName('sebep').setDescription('Neden?').setRequired(true)),
    new SlashCommandBuilder().setName('duyuru').setDescription('Tüm sunucuya duyuru atar.').addStringOption(o => o.setName('mesaj').setDescription('Mesaj?').setRequired(true)),
    new SlashCommandBuilder().setName('mesaj').setDescription('Sadece bir kişiye özel mesaj gönderir.').addStringOption(o => o.setName('oyuncu').setDescription('Kullanıcı adı?').setRequired(true)).addStringOption(o => o.setName('icerik').setDescription('Mesaj içeriği?').setRequired(true)),
    new SlashCommandBuilder().setName('kick').setDescription('Oyuncuyu atar.').addStringOption(o => o.setName('oyuncu').setDescription('Kullanıcı adı?').setRequired(true)),
    new SlashCommandBuilder().setName('chat-temizle').setDescription('Sohbeti temizler.')
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.once('ready', async () => {
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('Komutlar senkronize edildi.');
    } catch (e) { console.error(e); }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    // Mesajın herkes tarafından görülmesi için deferReply() boş bırakıldı
    try { await interaction.deferReply(); } catch (e) { return; }

    const { commandName, options } = interaction;

    try {
        if (commandName === 'duyuru') {
            havuz.duyuru = "NORMAL_DUYURU";
            havuz.mesaj = options.getString('mesaj');
            await interaction.editReply(`📢 **Genel Duyuru Gönderildi:** ${havuz.mesaj}`);
        } 
        else if (commandName === 'mesaj') {
            havuz.duyuru = "OZEL_MESAJ";
            havuz.ozelHedef = options.getString('oyuncu');
            havuz.mesaj = options.getString('icerik');
            await interaction.editReply(`✉️ **${havuz.ozelHedef}** isimli oyuncuya özel mesaj iletildi.`);
        }
        else if (commandName === 'shutdown') {
            havuz.duyuru = "SUNUCUYU_KAPAT_ACIL";
            havuz.mesaj = options.getString('sebep');
            await interaction.editReply(`🛑 **Shutdown Başlatıldı.**`);
        } 
        else if (commandName === 'kick') {
            havuz.kickHedef = options.getString('oyuncu');
            await interaction.editReply(`👞 **${havuz.kickHedef}** atıldı.`);
        } 
        else if (commandName === 'chat-temizle') {
            havuz.chatTemizle = true;
            await interaction.editReply(`🧹 **Chat temizlendi.**`);
        }
    } catch (err) {
        console.error("Komut hatası:", err);
    }
});

app.listen(port);
client.login(process.env.TOKEN);
