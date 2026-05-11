const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// ROBLOX VERİ HAVUZU
let havuz = { duyuru: "", mesaj: "", kickHedef: "", chatTemizle: false };

app.use(express.json());

// ROBLOX'UN VERİ ÇEKTİĞİ NOKTA
app.get('/kontrol', (req, res) => {
    try {
        res.status(200).json(havuz);
        // Veri iletildiği an kritik verileri sıfırla ki döngüye girmesin
        havuz.duyuru = ""; 
        havuz.kickHedef = ""; 
        havuz.chatTemizle = false;
    } catch (e) {
        console.error("Havuz hatası:", e);
    }
});

app.get('/', (req, res) => res.send("Sistem Başmühendisi Aktif!"));

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// KOMUTLARIN TANIMLANMASI
const commands = [
    new SlashCommandBuilder()
        .setName('shutdown')
        .setDescription('Sunucuyu günceller ve herkesi otomatik olarak yeni sunucuya aktarır.')
        .addStringOption(o => o.setName('sebep').setDescription('Shutdown nedeni?').setRequired(true)),
    
    new SlashCommandBuilder()
        .setName('duyuru')
        .setDescription('Oyun içindeki tüm oyuncuların ekranına sistem duyurusu gönderir.')
        .addStringOption(o => o.setName('mesaj').setDescription('Duyuru metni?').setRequired(true)),
        
    new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Belirtilen kullanıcıyı oyundan anında atar.')
        .addStringOption(o => o.setName('oyuncu').setDescription('Roblox Kullanıcı Adı?').setRequired(true)),
        
    new SlashCommandBuilder()
        .setName('chat-temizle')
        .setDescription('Oyun içi sohbeti herkes için temizler.')
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

// BOT HAZIR OLDUĞUNDA KOMUTLARI YÜKLE
client.once('ready', async () => {
    try {
        console.log(`${client.user.tag} girişi yapıldı!`);
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('Komutlar başarıyla senkronize edildi.');
    } catch (e) { console.error('Yükleme hatası:', e); }
});

// KOMUT İŞLEME
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    // "Unknown Interaction" hatasını engellemek için anında cevap başlatıyoruz
    // Burada flags: MessageFlags.Ephemeral KULLANMIYORUZ ki herkes görsün.
    try {
        await interaction.deferReply(); 
    } catch (e) {
        console.error("Defer hatası:", e);
        return;
    }

    const { commandName, options } = interaction;

    try {
        if (commandName === 'shutdown') {
            havuz.duyuru = "SUNUCUYU_KAPAT_ACIL";
            havuz.mesaj = options.getString('sebep');
            await interaction.editReply(`🛑 **Shutdown Başlatıldı:** ${havuz.mesaj}`);
        } 
        else if (commandName === 'duyuru') {
            havuz.duyuru = "NORMAL_DUYURU";
            havuz.mesaj = options.getString('mesaj');
            await interaction.editReply(`📢 **Sistem Duyurusu Gönderildi:** ${havuz.mesaj}`);
        } 
        else if (commandName === 'kick') {
            havuz.kickHedef = options.getString('oyuncu');
            await interaction.editReply(`👞 **${havuz.kickHedef}** sunucudan atıldı.`);
        } 
        else if (commandName === 'chat-temizle') {
            havuz.chatTemizle = true;
            await interaction.editReply(`🧹 **Sohbet temizlendi.**`);
        }
    } catch (err) {
        console.error("Komut işleme hatası:", err);
        // Hata durumunda kanala bilgi ver
        try { await interaction.editReply("❌ İşlem sırasında bir hata oluştu."); } catch(e){}
    }
});

// SERVER BAŞLAT
app.listen(port, () => console.log(`Web servisi ${port} portunda hazır.`));
client.login(process.env.TOKEN);
