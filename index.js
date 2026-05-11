const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// SİSTEM HAFIZASI
let havuz = { duyuru: "", mesaj: "", kickHedef: "", chatTemizle: false };

app.use(express.json());

// ROBLOX VERİ ÇEKME NOKTASI
app.get('/kontrol', (req, res) => {
    res.json(havuz);
    // Verileri gönderdikten sonra sıfırla (Sürekli işlem yapılmasını önler)
    havuz.duyuru = ""; 
    havuz.mesaj = "";
    havuz.kickHedef = ""; 
    havuz.chatTemizle = false;
});

app.get('/', (req, res) => res.send("Sistem Başmühendisi Aktif!"));

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// KOMUT TANIMLAMALARI
const commands = [
    new SlashCommandBuilder().setName('shutdown').setDescription('Sunucuyu GÜNCELLEYEREK yeniden başlatır (Rejoin).').addStringOption(o => o.setName('sebep').setDescription('Neden?').setRequired(true)),
    new SlashCommandBuilder().setName('duyuru').setDescription('Ekrana sistem duyurusu gönderir.').addStringOption(o => o.setName('mesaj').setDescription('Duyuru Metni').setRequired(true)),
    new SlashCommandBuilder().setName('kick').setDescription('Oyuncuyu sunucudan atar.').addStringOption(o => o.setName('oyuncu').setDescription('Kullanıcı Adı').setRequired(true)),
    new SlashCommandBuilder().setName('chat-temizle').setDescription('Oyun içi sohbeti temizler.')
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

// KOMUTLARI KAYDETME (DEPLOY)
client.once('ready', async () => {
    try {
        console.log(`${client.user.tag} aktif! Komutlar yükleniyor...`);
        // Komutları global olarak yükler (Görünmesi birkaç dakika sürebilir)
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('Komutlar başarıyla Discord sunucularına yüklendi!');
    } catch (e) { console.error("Komut yükleme hatası:", e); }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    // "Unknown Interaction" hatasını çözmek için yanıtı beklemeye alıyoruz
    await interaction.deferReply(); 

    try {
        if (interaction.commandName === 'shutdown') {
            havuz.duyuru = "SUNUCUYU_KAPAT_ACIL";
            havuz.mesaj = interaction.options.getString('sebep');
            await interaction.editReply("🛑 **Shutdown** işlemi başlatıldı. Sunucu 10 saniye içinde yenilenecek.");
        } else if (interaction.commandName === 'duyuru') {
            havuz.duyuru = "NORMAL_DUYURU";
            havuz.mesaj = interaction.options.getString('mesaj');
            await interaction.editReply("📢 **Duyuru** başarıyla oyun içine gönderildi.");
        } else if (interaction.commandName === 'kick') {
            havuz.kickHedef = interaction.options.getString('oyuncu');
            await interaction.editReply(`👞 **${havuz.kickHedef}** sunucudan atıldı.`);
        } else if (interaction.commandName === 'chat-temizle') {
            havuz.chatTemizle = true;
            await interaction.editReply("🧹 Oyun içi chat temizlendi.");
        }
    } catch (error) {
        console.error(error);
        await interaction.editReply("❌ İşlem sırasında bir hata oluştu.");
    }
});

app.listen(port);
client.login(process.env.TOKEN);
