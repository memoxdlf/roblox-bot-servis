const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
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
    shutdownTetikle: false // O meşhur 10 saniyelik geri sayımı başlatan anahtar
};

let sunucuDurum = { aktif: false, sonGorulme: 0, oyuncular: [] };

app.use(express.json());

// --- ROBLOX KONTROL NOKTASI ---
app.all('/kontrol', (req, res) => {
    if (req.method === 'POST') {
        sunucuDurum.aktif = true;
        sunucuDurum.sonGorulme = Date.now();
        sunucuDurum.oyuncular = req.body.oyuncular || [];
        return res.status(200).json({ status: "ok" });
    }
    
    // Verileri Roblox'a gönder
    res.status(200).json(havuz);
    
    // Tek seferlik komutları temizle (Yasaklı listesi her zaman kalır!)
    havuz.duyuru = ""; 
    havuz.ozelHedef = ""; 
    havuz.kickHedef = ""; 
    havuz.chatTemizle = false;
    havuz.shutdownTetikle = false; 
});

app.get('/', (req, res) => res.send("Başbuğ Nöbette! Sistem ve Shutdown Hazır."));

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers 
    ] 
});

// --- KOMUTLARI TANIMLA ---
const commands = [
    new SlashCommandBuilder().setName('durum').setDescription('Sunucu durumunu gösterir.'),
    new SlashCommandBuilder()
        .setName('yasakla')
        .setDescription('Oyuncuyu kara listeye alır.')
        .addStringOption(o => o.setName('oyuncu').setDescription('Kullanıcı adını seçin/yazın').setRequired(true).setAutocomplete(true)),
    new SlashCommandBuilder()
        .setName('yasak-kaldir')
        .setDescription('Oyuncunun yasağını kaldırır.')
        .addStringOption(o => o.setName('oyuncu').setDescription('Yasağı kalkacak ismi yazın').setRequired(true)),
    new SlashCommandBuilder().setName('duyuru').setDescription('Oyuna duyuru gönderir.').addStringOption(o => o.setName('mesaj').setDescription('Duyuru içeriği').setRequired(true)),
    new SlashCommandBuilder().setName('kick').setDescription('Birini oyundan atar.').addStringOption(o => o.setName('oyuncu').setDescription('Username').setRequired(true)),
    new SlashCommandBuilder().setName('chat-temizle').setDescription('Roblox sohbetini temizler.'),
    new SlashCommandBuilder().setName('shutdown').setDescription('10 saniye geri sayım ile herkesi oyundan atar!') 
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.once('ready', async () => {
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log("✅ Sistem Başmühendisi Görevinin Başında!");
    } catch (e) { console.error(e); }
});

// --- ETKİLEŞİMLER ---
client.on('interactionCreate', async interaction => {
    
    // İsim Tamamlama (Yasakla için)
    if (interaction.isAutocomplete()) {
        try {
            const focusedValue = interaction.options.getFocused().toLowerCase();
            const members = await interaction.guild.members.fetch({ limit: 50 }).catch(() => null);
            if (!members) return;
            const filtered = members
                .filter(m => m.user.username.toLowerCase().includes(focusedValue))
                .map(m => ({ name: m.user.username, value: m.user.username }))
                .slice(0, 25);
            await interaction.respond(filtered);
        } catch (e) { console.error(e); }
    }

    if (!interaction.isChatInputCommand()) return;
    try { await interaction.deferReply(); } catch (e) { return; }

    const { commandName, options } = interaction;

    // --- EFSANE SHUTDOWN SİSTEMİ ---
    if (commandName === 'shutdown') {
        havuz.shutdownTetikle = true;
        havuz.duyuru = "SHUTDOWN";
        havuz.mesaj = "Geliştiriciler tarafından 'Shutdown' atıldı"; // Resimdeki mesajın aynısı
        await interaction.editReply("🚨 **SİSTEM DUYURUSU:** 10 saniyelik geri sayım başlatıldı, herkes atılıyor!");
    }

    else if (commandName === 'yasakla') {
        const hedef = options.getString('oyuncu');
        if (!havuz.yasakliListesi.includes(hedef)) {
            havuz.yasakliListesi.push(hedef);
            havuz.kickHedef = hedef; 
            await interaction.editReply(`🚫 **${hedef}** Başbuğ emriyle yasaklandı.`);
        } else {
            await interaction.editReply(`⚠️ Bu oyuncu zaten yasaklı.`);
        }
    } 
    
    else if (commandName === 'yasak-kaldir') {
        const hedef = options.getString('oyuncu');
        const index = havuz.yasakliListesi.indexOf(hedef);
        if (index > -1) {
            havuz.yasakliListesi.splice(index, 1);
            await interaction.editReply(`✅ **${hedef}** yasağı kaldırıldı.`);
        } else {
            await interaction.editReply(`⚠️ Liste temiz, bu isim yok.`);
        }
    }
    
    else if (commandName === 'durum') {
        const isOnline = (Date.now() - sunucuDurum.sonGorulme) / 1000 < 35;
        const liste = sunucuDurum.oyuncular.length > 0 ? sunucuDurum.oyuncular.join(", ") : "Kimse yok.";
        const embed = new EmbedBuilder()
            .setTitle('📊 Sunucu Raporu')
            .setColor(isOnline ? 0x00FF00 : 0xFF0000)
            .addFields(
                { name: 'Durum', value: isOnline ? "🟢 AKTİF" : "🔴 KAPALI", inline: true },
                { name: 'Oyundakiler', value: "```" + liste + "```" }
            );
        await interaction.editReply({ embeds: [embed] });
    }
    else if (commandName === 'duyuru') {
        havuz.duyuru = "NORMAL_DUYURU";
        havuz.mesaj = options.getString('mesaj');
        await interaction.editReply("📢 Duyuru iletildi.");
    }
    else if (commandName === 'kick') {
        havuz.kickHedef = options.getString('oyuncu');
        await interaction.editReply(`👞 **${havuz.kickHedef}** atıldı.`);
    }
    else if (commandName === 'chat-temizle') {
        havuz.chatTemizle = true;
        await interaction.editReply("🧹 Sohbet temizlendi.");
    }
});

// --- NOSTALJİK CHAT (STANNIS & SELAM) ---
client.on('messageCreate', (message) => {
    if (message.author.bot) return;
    const msg = message.content.toLowerCase().trim();

    if (msg === 'stannis') {
        return message.reply('Yüce Başbuğ Stannis! Mekanın tek sahibi, sözü üstüne söz söylenmez. 🫡🦅');
    }
    if (msg === 'merhaba') {
        message.reply('Merhaba, hoş geldin! 🫡');
    } else if (msg === 'sa' || msg === 'selam' || msg === 'selamün aleyküm') {
        message.reply('Aleykümselam agam, hoş geldin!');
    }
});

app.listen(port, () => {
    setInterval(() => {
        https.get(MY_URL, (res) => {}).on('error', (e) => {});
    }, 180000); 
});

client.login(process.env.TOKEN);
