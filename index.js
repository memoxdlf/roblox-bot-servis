const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const express = require('express');
const https = require('https'); 
const app = express();
const port = process.env.PORT || 3000;

// --- KRİTİK: Render URL'niz ---
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

// --- ROBLOX İLETİŞİM KANALI ---
app.all('/kontrol', (req, res) => {
    if (req.method === 'POST') {
        sunucuDurum.aktif = true;
        sunucuDurum.sonGorulme = Date.now();
        sunucuDurum.oyuncular = req.body.oyuncular || [];
        return res.status(200).json({ status: "ok" });
    }
    
    // Veriyi Roblox'a servis et
    res.status(200).json(havuz);
    
    // Geçici komutları temizle (Yasaklılar kalır)
    havuz.duyuru = ""; 
    havuz.ozelHedef = ""; 
    havuz.kickHedef = ""; 
    havuz.chatTemizle = false;
    havuz.shutdownTetikle = false; 
});

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildBans
    ] 
});

const commands = [
    new SlashCommandBuilder().setName('durum').setDescription('Bağlantıyı kontrol eder.'),
    new SlashCommandBuilder()
        .setName('yasakla')
        .setDescription('Discord ve Roblox banı atar.')
        .addStringOption(o => o.setName('oyuncu').setDescription('İsim veya ID').setRequired(true).setAutocomplete(true)),
    new SlashCommandBuilder()
        .setName('yasak-kaldir')
        .setDescription('Yasağı temizler.')
        .addStringOption(o => o.setName('oyuncu').setDescription('İsim').setRequired(true)),
    new SlashCommandBuilder().setName('duyuru').setDescription('Mesaj gönderir.').addStringOption(o => o.setName('mesaj').setDescription('İçerik').setRequired(true)),
    new SlashCommandBuilder()
        .setName('shutdown')
        .setDescription('Sebep belirterek kapatır.')
        .addStringOption(o => o.setName('sebep').setDescription('Neden kapatılıyor?').setRequired(true))
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.once('ready', async () => {
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log("✅ Sistem Başmühendisi Nöbette!");
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
    
    // Tıkanmayı önlemek için hemen "defer" yapıyoruz
    await interaction.deferReply().catch(() => null);

    const { commandName, options } = interaction;

    try {
        if (commandName === 'shutdown') {
            const sebep = options.getString('sebep');
            havuz.shutdownTetikle = true;
            havuz.duyuru = "SHUTDOWN";
            havuz.mesaj = sebep;
            await interaction.editReply(`🚨 **SİSTEM:** "${sebep}" sebebiyle shutdown başlatıldı!`);
        }

        else if (commandName === 'yasakla') {
            const hedef = options.getString('oyuncu');
            if (!havuz.yasakliListesi.includes(hedef)) {
                havuz.yasakliListesi.push(hedef);
                havuz.kickHedef = hedef; 
            }
            
            // Discord Ban Denemesi
            const member = interaction.guild.members.cache.find(m => m.user.username === hedef || m.user.id === hedef);
            if (member && member.bannable) {
                await member.ban({ reason: 'Yasaklandı.' });
                await interaction.editReply(`🚫 **${hedef}** sunucudan yasaklandı.`);
            } else {
                await interaction.guild.bans.create(hedef).catch(() => null);
                await interaction.editReply(`🚫 **${hedef}** Roblox listesine alındı.`);
            }
        }
        
        else if (commandName === 'durum') {
            const isOnline = (Date.now() - sunucuDurum.sonGorulme) / 1000 < 45;
            await interaction.editReply(isOnline ? "🟢 Roblox Sunucusu Aktif." : "🔴 Roblox Bağlantısı Yok.");
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
        await interaction.editReply("❌ İşlem sırasında bir hata oluştu.");
    }
});

// --- RENDER'I AYAKTA TUTMA VE SELAMLAŞMA ---
client.on('messageCreate', (message) => {
    if (message.author.bot) return;
    const msg = message.content.toLowerCase().trim();
    if (msg === 'merhaba') message.reply('Merhaba, hoş geldin! 🫡');
    else if (msg === 'sa' || msg === 'selam') message.reply('Aleykümselam agam!');
});

app.listen(port, () => {
    setInterval(() => { https.get(MY_URL, (res) => {}).on('error', (e) => {}); }, 60000); 
});

client.login(process.env.TOKEN);
