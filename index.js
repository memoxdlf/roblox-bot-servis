const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

let shutdownStatus = false;
let sonDuyuru = ""; 
let sunucuVerisi = { oyuncuSayisi: 0, maxOyuncu: 0 };

// ROBLOX VERİLERİ BURAYA GELECEK
app.get('/kontrol', (req, res) => {
    if (req.query.players) sunucuVerisi.oyuncuSayisi = req.query.players;
    if (req.query.maxPlayers) sunucuVerisi.maxOyuncu = req.query.maxPlayers;
    
    res.json({ 
        shutdown: shutdownStatus,
        duyuru: sonDuyuru 
    });
});

app.listen(port, () => { 
    console.log("Başmühendis Sistemi Sorunsuz Başlatıldı."); 
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent
    ]
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // DURUM KOMUTU
    if (message.content === '!durum') {
        const durumEmbed = new EmbedBuilder()
            .setTitle('🏗️ BAŞMÜHENDİS SAHA RAPORU')
            .setColor(0xffa500)
            .addFields(
                { name: '👤 Aktif Oyuncu', value: `${sunucuVerisi.oyuncuSayisi} / ${sunucuVerisi.maxOyuncu}`, inline: true },
                { name: '🌐 Sunucu Durumu', value: '🟢 Aktif', inline: true }
            )
            .setTimestamp();

        message.reply({ embeds: [durumEmbed] });
    }

    // DUYURU KOMUTU
    if (message.content.startsWith('!duyuru ')) {
        sonDuyuru = message.content.replace('!duyuru ', '');
        message.reply(`📢 **Duyuru Yayınlandı:** ${sonDuyuru}`);
        setTimeout(() => { sonDuyuru = ""; }, 45000);
    }

    // KAPATMA KOMUTU
    if (message.content === '!kapat') {
        shutdownStatus = true;
        message.reply('🚨 Sunucu kapatılıyor...');
        setTimeout(() => { shutdownStatus = false; }, 20000);
    }
});

client.login(process.env.TOKEN);
