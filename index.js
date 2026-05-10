const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const axios = require('axios'); // Kendi kendini dürtmek için gerekli
const app = express();
const port = process.env.PORT || 3000;

let shutdownStatus = false;
let sonDuyuru = ""; 

// ROBLOX BURAYI SORGULAYACAK
app.get('/kontrol', (req, res) => {
    res.json({ 
        shutdown: shutdownStatus,
        duyuru: sonDuyuru 
    });
});

app.listen(port, () => { 
    console.log(`Sunucu ${port} portunda ve Başmühendis emrinde!`); 
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent
    ]
});

client.on('ready', () => {
    console.log(`${client.user.tag} aktif ve göreve hazır!`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // SUNUCU KAPATMA KOMUTU
    if (message.content === '!kapat') {
        shutdownStatus = true;
        message.reply('🚨 **BAŞMÜHENDİS TALİMATI:** Sunucu kapatılıyor...');
        console.log("Kapatma sinyali gönderildi.");
        
        // 30 saniye sonra sistemi normale döndürür
        setTimeout(() => { 
            shutdownStatus = false; 
            console.log("Sistem normale döndü.");
        }, 30000);
    }

    // DUYURU SİSTEMİ
    if (message.content.startsWith('!duyuru ')) {
        sonDuyuru = message.content.replace('!duyuru ', '');
        message.reply(`📢 **DUYURU YAYINLANDI:**\n> ${sonDuyuru}`);
        
        // Duyuruyu 45 saniye sonra sistemden siler (Ekranda kalıcı olmasın diye)
        setTimeout(() => { sonDuyuru = ""; }, 45000);
    }
});

// --- KENDİ KENDİNİ UYANDIRMA SİSTEMİ (Anti-Sleep) ---
// Render'ın botu uyutmaması için her 5 dakikada bir kendi linkine ping atar.
setInterval(() => {
    axios.get(`https://roblox-bot-servis.onrender.com/kontrol`)
        .then(() => console.log("Kendi kendimi dürttüm, uyanığım!"))
        .catch(() => console.log("Uyandırma servisi beklemede..."));
}, 300000); // 5 dakika (300.000 ms)

client.login(process.env.TOKEN);
