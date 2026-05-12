const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const express = require('express');
const https = require('https'); 
const app = express();
const port = process.env.PORT || 3000;

const MY_URL = "https://roblox-bot-servis.onrender.com/"; 

let havuz = { 
    duyuru: "", 
    mesaj: "", 
    ozelHedef: "", 
    kickHedef: "", 
    chatTemizle: false,
    yasakliListesi: [] 
};

let sunucuDurum = { aktif: false, sonGorulme: 0, oyuncular: [] };

app.use(express.json());

app.all('/kontrol', (req, res) => {
    if (req.method === 'POST') {
        sunucuDurum.aktif = true;
        sunucuDurum.sonGorulme = Date.now();
        sunucuDurum.oyuncular = req.body.oyuncular || [];
        return res.status(200).json({ status: "ok" });
    }
    res.status(200).json(havuz);
    havuz.duyuru = ""; havuz.ozelHedef = ""; havuz.kickHedef = ""; havuz.chatTemizle = false;
});

app.get('/', (req, res) => res.send("Bot ve Gelişmiş Yasaklama Sistemi Aktif!"));

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers // Üyeleri listelemek için bu şart!
    ] 
});

// --- KOMUT TANIMLAMALARI ---
const commands = [
    new SlashCommandBuilder().setName('durum').setDescription('Sunucu durumunu gösterir.'),
    new SlashCommandBuilder()
        .setName('yasakla')
        .setDescription('Oyuncuyu sunucudan yasaklar.')
        .addStringOption(o => 
            o.setName('oyuncu')
            .setDescription('Kullanıcı adını yazın veya seçin')
            .setRequired(true)
            .setAutocomplete(true) // Otomatik tamamlama açıldı!
        ),
    new SlashCommandBuilder()
        .setName('yasak-kaldir')
        .setDescription('Oyuncunun yasağını kaldırır.')
        .addStringOption(o => 
            o.setName('oyuncu')
            .setDescription('Yasağı kalkacak ismi yazın')
            .setRequired(true)
        ),
    new SlashCommandBuilder().setName('duyuru').setDescription('Duyuru atar.').addStringOption(o => o.setName('mesaj').setDescription('İçerik').setRequired(true)),
    new SlashCommandBuilder().setName('kick').setDescription('Atar.').addStringOption(o => o.setName('oyuncu').setDescription('Username').setRequired(true)),
    new SlashCommandBuilder().setName('chat-temizle').setDescription('Sohbeti temizler.')
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.once('ready', async () => {
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log("✅ Gelişmiş Komutlar Yüklendi!");
    } catch (e) { console.error(e); }
});

// --- ETKİLEŞİMLER (Interaction) ---
client.on('interactionCreate', async interaction => {
    
    // 1. OTOMATİK TAMAMLAMA MANTIĞI
    if (interaction.isAutocomplete()) {
        if (interaction.commandName === 'yasakla') {
            const focusedValue = interaction.options.getFocused().toLowerCase();
            
            // Sunucudaki üyeleri çek (İlk 25 kişiyi filtrele)
            const members = await interaction.guild.members.fetch({ limit: 100 });
            const filtered = members
                .filter(m => m.user.username.toLowerCase().includes(focusedValue))
                .map(m => ({ name: m.user.username, value: m.user.username }))
                .slice(0, 25);

            await interaction.respond(filtered);
        }
    }

    // 2. NORMAL KOMUT MANTIĞI
    if (!interaction.isChatInputCommand()) return;
    try { await interaction.deferReply(); } catch (e) { return; }

    const { commandName, options } = interaction;

    if (commandName === 'yasakla') {
        const hedef = options.getString('oyuncu');
        if (!havuz.yasakliListesi.includes(hedef)) {
            havuz.yasakliListesi.push(hedef);
            havuz.kickHedef = hedef; 
            await interaction.editReply(`🚫 **${hedef}** kara listeye alındı.`);
        } else {
            await interaction.editReply(`⚠️ ${hedef} zaten yasaklı.`);
        }
    } 
    
    else if (commandName === 'yasak-kaldir') {
        const hedef = options.getString('oyuncu');
        const index = havuz.yasakliListesi.indexOf(hedef);
        if (index > -1) {
            havuz.yasakliListesi.splice(index, 1);
            await interaction.editReply(`✅ **${hedef}** yasağı kaldırıldı.`);
        } else {
            await interaction.editReply(`⚠️ Bu isim listede yok.`);
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
                { name: 'Yasaklılar', value: String(havuz.yasakliListesi.length), inline: true },
                { name: 'Oyundakiler', value: "```" + liste + "```" }
            );
        await interaction.editReply({ embeds: [embed] });
    }
    // (Diğer komutlar duyuru, kick vs. buraya eklenebilir)
});

// --- STANNIS VE DİĞER MESAJLAR ---
client.on('messageCreate', (message) => {
    if (message.author.bot) return;
    const msg = message.content.toLowerCase().trim();
    if (msg === 'stannis') {
        message.reply('Yüce Başbuğ Stannis! Mekanın tek sahibi, sözü üstüne söz söylenmez. 🫡🦅');
    }
    if (msg === 'merhaba') message.reply('Merhaba, hoş geldin! 🫡');
});

app.listen(port, () => {
    setInterval(() => {
        https.get(MY_URL, (res) => {}).on('error', (e) => {});
    }, 180000); 
});

client.login(process.env.TOKEN);
