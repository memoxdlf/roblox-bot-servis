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
    
    // Verileri paketle
    const veri = { ...havuz };
    
    // Roblox bilgiyi çektiği anda geçici komutları temizle
    res.status(200).json(veri);
    
    havuz.duyuru = ""; 
    havuz.ozelHedef = ""; 
    havuz.kickHedef = ""; 
    havuz.chatTemizle = false;
    havuz.shutdownTetikle = false; 
});

app.get('/', (req, res) => res.send("Başbuğ Nöbette! Sistem Düzenlendi."));

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
    new SlashCommandBuilder().setName('durum').setDescription('Sunucu durumunu gösterir.'),
    new SlashCommandBuilder()
        .setName('yasakla')
        .setDescription('Hem Roblox hem Discord ban atar.')
        .addStringOption(o => o.setName('oyuncu').setDescription('Username seçin').setRequired(true).setAutocomplete(true)),
    new SlashCommandBuilder()
        .setName('yasak-kaldir')
        .setDescription('Yasağı kaldırır.')
        .addStringOption(o => o.setName('oyuncu').setDescription('İsim').setRequired(true)),
    new SlashCommandBuilder().setName('duyuru').setDescription('Duyuru gönderir.').addStringOption(o => o.setName('mesaj').setDescription('İçerik').setRequired(true)),
    new SlashCommandBuilder().setName('kick').setDescription('Oyundan atar.').addStringOption(o => o.setName('oyuncu').setDescription('Username').setRequired(true)),
    new SlashCommandBuilder().setName('chat-temizle').setDescription('Sohbeti temizler.'),
    new SlashCommandBuilder().setName('shutdown').setDescription('Orijinal 10 saniye geri sayımlı shutdown!') 
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.once('ready', async () => {
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log("✅ Sistem Başbuğ için yeniden kalibre edildi!");
    } catch (e) { console.error(e); }
});

// --- ETKİLEŞİMLER ---
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

    // --- ORİJİNAL SHUTDOWN ---
    if (commandName === 'shutdown') {
        havuz.shutdownTetikle = true;
        havuz.duyuru = "SHUTDOWN";
        havuz.mesaj = "Geliştiriciler tarafından 'Shutdown' atıldı";
        await interaction.editReply("🚨 **SİSTEM DUYURUSU:** 10 saniyelik geri sayımlı Shutdown başlatıldı! Kimse kaçamaz.");
    }

    else if (commandName === 'yasakla') {
        const hedefIsim = options.getString('oyuncu');
        
        // Roblox listesine ekle
        if (!havuz.yasakliListesi.includes(hedefIsim)) {
            havuz.yasakliListesi.push(hedefIsim);
            havuz.kickHedef = hedefIsim; 
        }

        // Discord ban denemesi
        try {
            const member = interaction.guild.members.cache.find(m => m.user.username === hedefIsim);
            if (member && member.bannable) {
                await member.ban({ reason: 'Başbuğ emri.' });
                await interaction.editReply(`🚫 **${hedefIsim}** paketlendi (Roblox + Discord).`);
            } else {
                await interaction.editReply(`🚫 **${hedefIsim}** Roblox'tan yasaklandı. (Discord için bot rolünü en üste taşıyın!)`);
            }
        } catch (err) {
            await interaction.editReply(`🚫 **${hedefIsim}** sadece Roblox'tan yasaklandı.`);
        }
    } 
    
    // Diğer komutlar (Durum, Duyuru, Kick, Temizle) aynen duruyor
    else if (commandName === 'yasak-kaldir') {
        const hedef = options.getString('oyuncu');
        const index = havuz.yasakliListesi.indexOf(hedef);
        if (index > -1) havuz.yasakliListesi.splice(index, 1);
        await interaction.editReply(`✅ **${hedef}** yasağı kalktı.`);
    }
    else if (commandName === 'durum') {
        const isOnline = (Date.now() - sunucuDurum.sonGorulme) / 1000 < 35;
        const liste = sunucuDurum.oyuncular.length > 0 ? sunucuDurum.oyuncular.join(", ") : "Kimse yok.";
        const embed = new EmbedBuilder().setTitle('📊 Durum').setColor(isOnline ? 0x00FF00 : 0xFF0000).addFields({ name: 'Oyundakiler', value: "```" + liste + "```" });
        await interaction.editReply({ embeds: [embed] });
    }
    else if (commandName === 'duyuru') {
        havuz.duyuru = "NORMAL_DUYURU";
        havuz.mesaj = options.getString('mesaj');
        await interaction.editReply("📢 Duyuru Roblox'a uçtu.");
    }
    else if (commandName === 'kick') {
        havuz.kickHedef = options.getString('oyuncu');
        await interaction.editReply(`👞 **${havuz.kickHedef}** atıldı.`);
    }
    else if (commandName === 'chat-temizle') {
        havuz.chatTemizle = true;
        await interaction.editReply("🧹 Temizlik yapıldı.");
    }
});

// --- CHAT ETKİLEŞİMLERİ ---
client.on('messageCreate', (message) => {
    if (message.author.bot) return;
    const msg = message.content.toLowerCase().trim();
    if (msg === 'stannis') message.reply('Yüce Başbuğ Stannis! Mekanın tek sahibi, sözü üstüne söz söylenmez. 🫡🦅');
    if (msg === 'merhaba') message.reply('Merhaba, hoş geldin! 🫡');
    else if (msg === 'sa' || msg === 'selam') message.reply('Aleykümselam agam, hoş geldin!');
});

app.listen(port, () => {
    setInterval(() => { https.get(MY_URL, (res) => {}).on('error', (e) => {}); }, 180000); 
});

client.login(process.env.TOKEN);
