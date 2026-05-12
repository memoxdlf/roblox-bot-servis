const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const express = require('express');
const https = require('https'); 
const app = express();
const port = process.env.PORT || 3000;

// --- KRİTİK AYAR: Buraya Render URL'ni doğru yazdığından emin ol ---
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

// --- ROBLOX BURADAN VERİ ÇEKER ---
app.all('/kontrol', (req, res) => {
    if (req.method === 'POST') {
        sunucuDurum.aktif = true;
        sunucuDurum.sonGorulme = Date.now();
        sunucuDurum.oyuncular = req.body.oyuncular || [];
        return res.status(200).json({ status: "ok" });
    }
    
    // Roblox'a veriyi gönder
    res.status(200).json(havuz);
    
    // Veri gönderildikten sonra TEK SEFERLİK komutları hemen sıfırla
    // Yasaklı listesi ASLA sıfırlanmaz.
    havuz.duyuru = ""; 
    havuz.ozelHedef = ""; 
    havuz.kickHedef = ""; 
    havuz.chatTemizle = false;
    havuz.shutdownTetikle = false; 
});

app.get('/', (req, res) => res.send("Sistem Aktif! Roblox Bağlantısı Bekleniyor..."));

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildBans
    ] 
});

// --- KOMUTLAR ---
const commands = [
    new SlashCommandBuilder().setName('durum').setDescription('Sunucu durumunu kontrol eder.'),
    new SlashCommandBuilder()
        .setName('yasakla')
        .setDescription('Kişiyi Roblox ve Discorddan yasaklar.')
        .addStringOption(o => o.setName('oyuncu').setDescription('Kullanıcı adı veya ID').setRequired(true).setAutocomplete(true)),
    new SlashCommandBuilder()
        .setName('yasak-kaldir')
        .setDescription('Yasağı kaldırır.')
        .addStringOption(o => o.setName('oyuncu').setDescription('İsim').setRequired(true)),
    new SlashCommandBuilder().setName('duyuru').setDescription('Duyuru atar.').addStringOption(o => o.setName('mesaj').setDescription('Mesaj içeriği').setRequired(true)),
    new SlashCommandBuilder()
        .setName('shutdown')
        .setDescription('10 saniye geri sayımlı kapatma.')
        .addStringOption(o => o.setName('sebep').setDescription('Kapatma sebebi').setRequired(true))
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.once('ready', async () => {
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log("✅ Discord Botu Hazır!");
    } catch (e) { console.error(e); }
});

client.on('interactionCreate', async interaction => {
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
    
    // "Düşünüyor..." hatasını engellemek için anında yanıt veriyoruz
    try { await interaction.deferReply(); } catch (e) { return; }

    const { commandName, options } = interaction;

    if (commandName === 'shutdown') {
        const sebep = options.getString('sebep');
        havuz.shutdownTetikle = true;
        havuz.duyuru = "SHUTDOWN";
        havuz.mesaj = sebep;
        await interaction.editReply(`🚨 **SİSTEM:** "${sebep}" sebebiyle shutdown başlatıldı!`);
    }

    else if (commandName === 'yasakla') {
        const hedef = options.getString('oyuncu');
        havuz.yasakliListesi.push(hedef);
        havuz.kickHedef = hedef; 
        
        try {
            const member = interaction.guild.members.cache.find(m => m.user.username === hedef || m.user.id === hedef);
            if (member) await member.ban({ reason: 'Sunucudan yasaklandı.' });
            await interaction.editReply(`🚫 **${hedef}** sunucudan yasaklandı.`);
        } catch (err) {
            await interaction.editReply(`🚫 **${hedef}** Roblox için yasaklandı ancak Discord banı başarısız.`);
        }
    }
    
    else if (commandName === 'durum') {
        const isOnline = (Date.now() - sunucuDurum.sonGorulme) / 1000 < 45;
        await interaction.editReply(isOnline ? "🟢 Roblox Sunucusu Bağlı ve Dinliyor." : "🔴 Roblox Sunucusu Çevrimdışı (Bağlantı Yok).");
    }
    
    else if (commandName === 'yasak-kaldir') {
        const hedef = options.getString('oyuncu');
        havuz.yasakliListesi = havuz.yasakliListesi.filter(n => n !== hedef);
        await interaction.editReply(`✅ **${hedef}** yasağı kaldırıldı.`);
    }
});

// --- RENDER'I UYANIK TUTMA ---
app.listen(port, () => {
    setInterval(() => {
        https.get(MY_URL, (res) => {}).on('error', (e) => {});
    }, 60000); // 1 dakikada bir "ping" atar
});

client.login(process.env.TOKEN);
