const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// --- ROBLOX VERİ HAVUZU ---
let havuz = { 
    duyuru: "", 
    mesaj: "", 
    ozelHedef: "", 
    kickHedef: "", 
    chatTemizle: false 
};

app.use(express.json());

// Roblox'un veriyi çektiği kapı
app.get('/kontrol', (req, res) => {
    try {
        res.status(200).json(havuz);
        // Veri Roblox'a ulaştığı an kritik değerleri sıfırla (döngü olmasın)
        havuz.duyuru = ""; 
        havuz.ozelHedef = ""; 
        havuz.kickHedef = ""; 
        havuz.chatTemizle = false;
    } catch (e) {
        console.error("Havuz servis hatası:", e);
    }
});

app.get('/', (req, res) => res.send("Sistem Başmühendisi Aktif."));

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// --- SLASH KOMUT TANIMLARI ---
const commands = [
    new SlashCommandBuilder()
        .setName('duyuru')
        .setDescription('Tüm sunucuya büyük bir duyuru gönderir.')
        .addStringOption(o => o.setName('mesaj').setDescription('Duyuru içeriği?').setRequired(true)),
        
    new SlashCommandBuilder()
        .setName('mesaj')
        .setDescription('Sadece bir kişiye özel mesaj gönderir.')
        .addStringOption(o => o.setName('oyuncu').setDescription('Kullanıcı adı?').setRequired(true))
        .addStringOption(o => o.setName('icerik').setDescription('Mesaj içeriği?').setRequired(true)),
        
    new SlashCommandBuilder()
        .setName('shutdown')
        .setDescription('Sunucuyu günceller ve herkesi yeni servera aktarır.')
        .addStringOption(o => o.setName('sebep').setDescription('Güncelleme nedeni?').setRequired(true)),
        
    new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Bir oyuncuyu oyundan atar.')
        .addStringOption(o => o.setName('oyuncu').setDescription('Kullanıcı adı?').setRequired(true)),
        
    new SlashCommandBuilder()
        .setName('chat-temizle')
        .setDescription('Oyun içi sohbeti herkes için temizler.')
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.once('ready', async () => {
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log(`${client.user.tag} girişi yaptı ve komutlar yüklendi!`);
    } catch (e) {
        console.error("Komut yükleme hatası:", e);
    }
});

// --- KOMUT İŞLEME MANTIĞI ---
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    // "Unknown Interaction" hatasını engellemek için anında cevap başlat
    // Boş bırakıyoruz ki mesajı HERKES görebilsin (ephemeral değil).
    try {
        await interaction.deferReply(); 
    } catch (e) {
        return;
    }

    const { commandName, options } = interaction;

    try {
        if (commandName === 'duyuru') {
            havuz.duyuru = "NORMAL_DUYURU";
            havuz.mesaj = options.getString('mesaj');
            await interaction.editReply(`📢 **Sistem Duyurusu Gönderildi:** ${havuz.mesaj}`);
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
            await interaction.editReply(`🛑 **Shutdown Komutu Verildi:** ${havuz.mesaj}`);
        } 
        else if (commandName === 'kick') {
            havuz.kickHedef = options.getString('oyuncu');
            await interaction.editReply(`👞 **${havuz.kickHedef}** isimli oyuncu atıldı.`);
        } 
        else if (commandName === 'chat-temizle') {
            havuz.chatTemizle = true;
            await interaction.editReply(`🧹 **Sohbet temizleme komutu iletildi.**`);
        }
    } catch (err) {
        console.error("Komut işleme hatası:", err);
        try { await interaction.editReply("❌ İşlem sırasında teknik bir hata oluştu."); } catch(e){}
    }
});

app.listen(port, () => console.log(`Web sunucusu ${port} portunda hazır.`));
client.login(process.env.TOKEN);
