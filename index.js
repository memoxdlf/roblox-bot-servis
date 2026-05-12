const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const express = require('express');
const https = require('https'); 
const app = express();
const port = process.env.PORT || 3000;

// --- AYARLAR ---
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

// --- ROBLOX KONTROL ---
app.all('/kontrol', (req, res) => {
    if (req.method === 'POST') {
        sunucuDurum.aktif = true;
        sunucuDurum.sonGorulme = Date.now();
        sunucuDurum.oyuncular = req.body.oyuncular || [];
        return res.status(200).json({ status: "ok" });
    }
    
    const gonderilecekVeri = { ...havuz };
    res.status(200).json(gonderilecekVeri);
    
    // Roblox veriyi çektiğinde geçici komutları temizle
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

// --- KOMUTLAR ---
const commands = [
    new SlashCommandBuilder().setName('durum').setDescription('Sunucu raporu.'),
    new SlashCommandBuilder()
        .setName('yasakla')
        .setDescription('Kişiyi Roblox ve Discorddan yasaklar.')
        .addStringOption(o => o.setName('oyuncu').setDescription('Kullanıcı adı veya ID').setRequired(true).setAutocomplete(true)),
    new SlashCommandBuilder()
        .setName('yasak-kaldir')
        .setDescription('Yasağı kaldırır.')
        .addStringOption(o => o.setName('oyuncu').setDescription('İsim').setRequired(true)),
    new SlashCommandBuilder().setName('duyuru').setDescription('Duyuru atar.').addStringOption(o => o.setName('mesaj').setDescription('İçerik').setRequired(true)),
    new SlashCommandBuilder()
        .setName('shutdown')
        .setDescription('10 saniye geri sayım ile sunucuyu kapatır.')
        .addStringOption(o => 
            o.setName('sebep')
            .setDescription('Kapatma sebebini yazın (Zorunludur)')
            .setRequired(true) // İsteğin üzerine zorunlu yaptık
        )
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.once('ready', async () => {
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log("✅ Shutdown sistemi sebep zorunluluğu ile güncellendi!");
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
    try { await interaction.deferReply(); } catch (e) { return; }

    const { commandName, options } = interaction;

    // --- SEBEPLİ SHUTDOWN ---
    if (commandName === 'shutdown') {
        const sebep = options.getString('sebep');
        havuz.shutdownTetikle = true;
        havuz.duyuru = "SHUTDOWN";
        havuz.mesaj = sebep; // Yazdığın sebep Roblox'taki ekrana gider
        await interaction.editReply(`🚨 **SİSTEM DUYURUSU:** "${sebep}" sebebiyle 10 saniyelik geri sayım başlatıldı!`);
    }

    else if (commandName === 'yasakla') {
        const hedef = options.getString('oyuncu');
        if (!havuz.yasakliListesi.includes(hedef)) {
            havuz.yasakliListesi.push(hedef);
            havuz.kickHedef = hedef; 
        }
        try {
            const member = interaction.guild.members.cache.find(m => m.user.username === hedef || m.user.id === hedef);
            if (member) {
                await member.ban({ reason: 'Sunucudan yasaklandı.' });
                await interaction.editReply(`🚫 **${hedef}** sunucudan yasaklandı.`);
            } else {
                await interaction.guild.bans.create(hedef, { reason: 'Sunucudan yasaklandı.' }).catch(() => null);
                await interaction.editReply(`🚫 **${hedef}** sunucudan yasaklandı.`);
            }
        } catch (err) {
            await interaction.editReply(`🚫 **${hedef}** Roblox için yasaklandı ancak Discord banı başarısız.`);
        }
    }
    
    else if (commandName === 'yasak-kaldir') {
        const hedef = options.getString('oyuncu');
        const index = havuz.yasakliListesi.indexOf(hedef);
        if (index > -1) havuz.yasakliListesi.splice(index, 1);
        await interaction.editReply(`✅ **${hedef}** yasağı kaldırıldı.`);
    }
    // ... durum, duyuru vb.
});

// --- SELAMLAŞMA ---
client.on('messageCreate', (message) => {
    if (message.author.bot) return;
    const msg = message.content.toLowerCase().trim();
    if (msg === 'merhaba') message.reply('Merhaba, hoş geldin! 🫡');
    else if (msg === 'sa' || msg === 'selam') message.reply('Aleykümselam agam, hoş geldin!');
});

app.listen(port, () => {
    setInterval(() => { https.get(MY_URL, (res) => {}).on('error', (e) => {}); }, 180000); 
});

client.login(process.env.TOKEN);
