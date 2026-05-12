const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const express = require('express');
const https = require('https'); 
const app = express();
const port = process.env.PORT || 3000;

// BURAYI KENDİ RENDER LİNKİNLE DEĞİŞTİR (Sonunda / olsun)
const MY_URL = "https://roblox-bot-servis.onrender.com/"; 

let havuz = { duyuru: "", mesaj: "", ozelHedef: "", kickHedef: "", chatTemizle: false };
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

app.get('/', (req, res) => res.send("Bot Aktif!"));

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent 
    ] 
});

// --- MESAJ DİNLEME (BÜYÜK/KÜÇÜK HARF FARK ETMEZ) ---
client.on('messageCreate', (message) => {
    if (message.author.bot) return;

    // Mesajı küçük harfe çevirir ve başındaki/sonundaki boşlukları siler
    const msg = message.content.toLowerCase().trim();

    if (msg === 'merhaba') {
        message.reply('Merhaba agam, hoş geldin! Sunucu emrinde. 🫡');
    } else if (msg === 'sa' || msg === 'selam' || msg === 'selamün aleyküm') {
        message.reply('Aleykümselam agam, hoş geldin!');
    } else if (msg === 'nasılsın') {
        message.reply('İyiyim agam, Roblox sunucunu bekliyorum. Sen nasılsın?');
    }
});

const commands = [
    new SlashCommandBuilder().setName('durum').setDescription('Sunucu durumunu gösterir.'),
    new SlashCommandBuilder().setName('duyuru').setDescription('Duyuru atar.').addStringOption(o => o.setName('mesaj').setDescription('İçerik').setRequired(true)),
    new SlashCommandBuilder().setName('mesaj').setDescription('Özel mesaj.').addStringOption(o => o.setName('oyuncu').setDescription('Username').setRequired(true)).addStringOption(o => o.setName('icerik').setDescription('Mesaj').setRequired(true)),
    new SlashCommandBuilder().setName('kick').setName('kick').setDescription('Atar.').addStringOption(o => o.setName('oyuncu').setDescription('Username').setRequired(true)),
    new SlashCommandBuilder().setName('chat-temizle').setDescription('Sohbeti temizler.')
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.once('ready', async () => {
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log("✅ Bot hazır! Harf duyarlılığı kapatıldı.");
    } catch (e) { console.error(e); }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    try { await interaction.deferReply(); } catch (e) { return; }

    const { commandName, options } = interaction;

    if (commandName === 'durum') {
        const isOnline = (Date.now() - sunucuDurum.sonGorulme) / 1000 < 35;
        const liste = sunucuDurum.oyuncular.length > 0 ? sunucuDurum.oyuncular.join(", ") : "Kimse yok.";
        const embed = new EmbedBuilder()
            .setTitle('📊 Sunucu Raporu')
            .setColor(isOnline ? 0x00FF00 : 0xFF0000)
            .addFields(
                { name: 'Durum', value: isOnline ? "🟢 AKTİF" : "🔴 KAPALI", inline: true },
                { name: 'Oyuncular', value: "```" + liste + "```" }
            ).setTimestamp();
        await interaction.editReply({ embeds: [embed] });
    } else if (commandName === 'duyuru') {
        havuz.duyuru = "NORMAL_DUYURU";
        havuz.mesaj = options.getString('mesaj');
        await interaction.editReply("📢 Duyuru gönderildi.");
    } else if (commandName === 'mesaj') {
        havuz.duyuru = "OZEL_MESAJ";
        havuz.ozelHedef = options.getString('oyuncu');
        havuz.mesaj = options.getString('icerik');
        await interaction.editReply(`✉️ ${havuz.ozelHedef} için mesaj iletildi.`);
    } else if (commandName === 'kick') {
        havuz.kickHedef = options.getString('oyuncu');
        await interaction.editReply(`👞 ${havuz.kickHedef} atıldı.`);
    } else if (commandName === 'chat-temizle') {
        havuz.chatTemizle = true;
        await interaction.editReply("🧹 Chat temizlendi.");
    }
});

app.listen(port, () => {
    setInterval(() => {
        https.get(MY_URL, (res) => {
            console.log("Self-Ping Başarılı.");
        }).on('error', (e) => {
            console.log("Ping hatası: " + e.message);
        });
    }, 180000); 
});

client.login(process.env.TOKEN);
