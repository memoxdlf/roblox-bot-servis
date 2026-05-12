const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const express = require('express');
const https = require('https'); 
const app = express();
const port = process.env.PORT || 3000;

// --- KRİTİK AYAR: Render URL'nizi buraya yapıştırın ---
const MY_URL = "https://roblox-bot-servis.onrender.com/"; 

let havuz = { 
    duyuru: "", 
    mesaj: "", 
    ozelHedef: "", 
    kickHedef: "", 
    chatTemizle: false,
    yasakliListesi: [], 
    shutdownTetikle: false 
};

let sunucuDurum = { aktif: false, sonGorulme: 0, oyuncular: [] };

app.use(express.json());

// --- ROBLOX VERİ ÇEKME NOKTASI ---
app.all('/kontrol', (req, res) => {
    if (req.method === 'POST') {
        sunucuDurum.aktif = true;
        sunucuDurum.sonGorulme = Date.now();
        sunucuDurum.oyuncular = req.body.oyuncular || [];
        return res.status(200).json({ status: "ok" });
    }
    
    // Veriyi Roblox'a servis et
    res.status(200).json(havuz);
    
    // SHUTDOWN tetiklendiyse Roblox'un kaçırmaması için 5 saniye bekleyip temizle
    if (havuz.shutdownTetikle) {
        setTimeout(() => {
            havuz.shutdownTetikle = false;
            havuz.duyuru = "";
            havuz.mesaj = "";
        }, 5000); 
    } else {
        // Diğer tek seferlik komutları anında temizle
        havuz.duyuru = ""; 
        havuz.ozelHedef = ""; 
        havuz.kickHedef = ""; 
        havuz.chatTemizle = false;
    }
});

app.get('/', (req, res) => res.send("Sistem Başmühendisi Nöbette! Bağlantı Bekleniyor..."));

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildBans
    ] 
});

// --- KOMUT TANIMLAMALARI ---
const commands = [
    new SlashCommandBuilder().setName('durum').setDescription('Sunucu bağlantısını kontrol eder.'),
    new SlashCommandBuilder()
        .setName('yasakla')
        .setDescription('Kişiyi Roblox ve Discorddan yasaklar.')
        .addStringOption(o => o.setName('oyuncu').setDescription('Kullanıcı adı veya ID').setRequired(true).setAutocomplete(true)),
    new SlashCommandBuilder()
        .setName('yasak-kaldir')
        .setDescription('Yasağı kaldırır.')
        .addStringOption(o => o.setName('oyuncu').setDescription('İsim').setRequired(true)),
    new SlashCommandBuilder()
        .setName('duyuru')
        .setDescription('Duyuru atar.')
        .addStringOption(o => o.setName('mesaj').setDescription('İçerik').setRequired(true)),
    new SlashCommandBuilder()
        .setName('shutdown')
        .setDescription('10 saniye geri sayım ile kapatır.')
        .addStringOption(o => o.setName('sebep').setDescription('Kapatma sebebi (Zorunludur)').setRequired(true))
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.once('ready', async () => {
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log("✅ Discord Botu ve Komutlar Hazır!");
    } catch (e) { console.error(e); }
});

// --- ETKİLEŞİMLER ---
client.on('interactionCreate', async interaction => {
    // Otomatik İsim Tamamlama
    if (interaction.isAutocomplete()) {
        const focusedValue = interaction.options.getFocused().toLowerCase();
        const members = await interaction.guild.members.fetch({ limit: 50 }).catch(() => null);
        if (!members) return;
        const filtered = members
            .filter(m => m.user.username.toLowerCase().includes(focusedValue))
            .map(m => ({ name: m.user.username, value: m.user.username }))
            .slice(0, 25);
        await interaction.respond(filtered).catch(() => null);
    }

    if (!interaction.isChatInputCommand()) return;
    
    // Tıkanmayı önlemek için deferReply
    await interaction.deferReply().catch(() => null);

    const { commandName, options } = interaction;

    try {
        // --- SEBEPLİ SHUTDOWN ---
        if (commandName === 'shutdown') {
            const sebep = options.getString('sebep');
            havuz.shutdownTetikle = true;
            havuz.duyuru = "SHUTDOWN";
            havuz.mesaj = sebep;
            await interaction.editReply(`🚨 **SİSTEM:** "${sebep}" sebebiyle shutdown başlatıldı!`);
        }

        // --- YASAKLAMA SİSTEMİ ---
        else if (commandName === 'yasakla') {
            const hedef = options.getString('oyuncu');
            
            if (!havuz.yasakliListesi.includes(hedef)) {
                havuz.yasakliListesi.push(hedef);
                havuz.kickHedef = hedef; 
            }
            
            const member = interaction.guild.members.cache.find(m => m.user.username === hedef || m.user.id === hedef);
            if (member && member.bannable) {
                await member.ban({ reason: 'Sunucudan yasaklandı.' });
                await interaction.editReply(`🚫 **${hedef}** sunucudan yasaklandı.`);
            } else {
                await interaction.guild.bans.create(hedef, { reason: 'Sunucudan yasaklandı.' }).catch(() => null);
                await interaction.editReply(`🚫 **${hedef}** sunucudan yasaklandı.`);
            }
        }
        
        else if (commandName === 'durum') {
            const isOnline = (Date.now() - sunucuDurum.sonGorulme) / 1000 < 45;
            await interaction.editReply(isOnline ? "🟢 Roblox Sunucusu Bağlı ve Dinliyor." : "🔴 Roblox Bağlantısı Yok.");
        }

        else if (commandName === 'duyuru') {
            havuz.duyuru = "NORMAL_DUYURU";
            havuz.mesaj = options.getString('mesaj');
            await interaction.editReply("📢 Duyuru Roblox'a iletildi.");
        }
        
        else if (commandName === 'yasak-kaldir') {
            const hedef = options.getString('oyuncu');
            havuz.yasakliListesi = havuz.yasakliListesi.filter(n => n !== hedef);
            await interaction.editReply(`✅ **${hedef}** yasağı kaldırıldı.`);
        }
    } catch (err) {
        console.error(err);
        await interaction.editReply("❌ Bir hata oluştu, yetkileri kontrol edin.");
    }
});

// --- SELAMLAŞMA ---
client.on('messageCreate', (message) => {
    if (message.author.bot) return;
    const msg = message.content.toLowerCase().trim();
    if (msg === 'merhaba') message.reply('Merhaba, hoş geldin! 🫡');
    else if (msg === 'sa' || msg === 'selam') message.reply('Aleykümselam agam!');
});

// --- RENDER'I UYANIK TUTMA ---
app.listen(port, () => {
    setInterval(() => {
        https.get(MY_URL, (res) => {}).on('error', (e) => {});
    }, 60000); 
});

client.login(process.env.TOKEN);
