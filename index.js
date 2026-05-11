const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// MERKEZİ VERİ HAVUZU
let havuz = {
    duyuruTipi: "", // "NORMAL" veya "SHUTDOWN"
    mesaj: "",
    kickHedef: "",
    chatTemizle: false,
    sonGuncelleme: Date.now()
};

app.use(express.json());

// ROBLOX VERİ ÇEKME NOKTASI
app.get('/kontrol', (req, res) => {
    try {
        res.status(200).json(havuz);
        
        // Veri aktarıldıktan sonra kritik komutları sıfırla
        if (havuz.duyuruTipi !== "") {
            havuz.duyuruTipi = "";
            havuz.mesaj = "";
        }
        havuz.kickHedef = "";
        havuz.chatTemizle = false;
    } catch (err) {
        console.error("Veri servisi hatası:", err);
        res.status(500).send("İç Sunucu Hatası");
    }
});

app.get('/', (req, res) => res.send(`Sistem Başmühendisi Aktif. Son Senkronizasyon: ${new Date(havuz.sonGuncelleme).toLocaleTimeString()}`));

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [
    new SlashCommandBuilder()
        .setName('shutdown')
        .setDescription('Sunucuyu günceller ve herkesi otomatik olarak yeni sunucuya aktarır.')
        .addStringOption(opt => opt.setName('sebep').setDescription('Shutdown nedeni nedir?').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    new SlashCommandBuilder()
        .setName('duyuru')
        .setDescription('Oyun içindeki tüm oyuncuların ekranına büyük bir duyuru gönderir.')
        .addStringOption(opt => opt.setName('mesaj').setDescription('Duyuru metni').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
        
    new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Belirtilen kullanıcıyı oyundan anında atar.')
        .addStringOption(opt => opt.setName('oyuncu').setDescription('Roblox Kullanıcı Adı').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
        
    new SlashCommandBuilder()
        .setName('chat-temizle')
        .setDescription('Oyun içi sohbet geçmişini herkes için temizler.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.once('ready', async () => {
    try {
        console.log(`${client.user.tag} girişi yapıldı!`);
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('Tüm yönetim komutları başarıyla senkronize edildi.');
    } catch (e) { console.error('Komut yükleme hatası:', e); }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    // Discord'un 3 saniye kuralını aşmak için yanıtı beklemeye alıyoruz
    await interaction.deferReply({ ephemeral: true });

    try {
        const cmd = interaction.commandName;
        havuz.sonGuncelleme = Date.now();

        if (cmd === 'shutdown') {
            havuz.duyuruTipi = "SHUTDOWN";
            havuz.mesaj = interaction.options.getString('sebep');
            await interaction.editReply(`🛑 **Shutdown Başlatıldı:** ${havuz.mesaj}`);
        } 
        else if (cmd === 'duyuru') {
            havuz.duyuruTipi = "NORMAL";
            havuz.mesaj = interaction.options.getString('mesaj');
            await interaction.editReply(`📢 **Duyuru Gönderildi:** ${havuz.mesaj}`);
        } 
        else if (cmd === 'kick') {
            havuz.kickHedef = interaction.options.getString('oyuncu');
            await interaction.editReply(`👞 **Kullanıcı Atıldı:** ${havuz.kickHedef}`);
        } 
        else if (cmd === 'chat-temizle') {
            havuz.chatTemizle = true;
            await interaction.editReply(`🧹 **Sohbet temizleme komutu gönderildi.**`);
        }
    } catch (err) {
        console.error("Komut işleme hatası:", err);
        await interaction.editReply("❌ İşlem sırasında teknik bir sorun oluştu.");
    }
});

app.listen(port, () => console.log(`Web servisi ${port} portunda hazır.`));
client.login(process.env.TOKEN);
