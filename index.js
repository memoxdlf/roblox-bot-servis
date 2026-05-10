const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

let shutdownStatus = false;
let sonDuyuru = ""; // Duyuruyu burada saklayacağız

app.get('/kontrol', (req, res) => {
    res.json({ 
        shutdown: shutdownStatus,
        duyuru: sonDuyuru 
    });
});

app.listen(port, () => { console.log("Bot ve Duyuru Sistemi Hazır."); });

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // KAPATMA KOMUTU
    if (message.content === '!kapat') {
        shutdownStatus = true;
        message.reply('🚨 **EMİR ALINDI:** Sunucu kapatılıyor...');
        setTimeout(() => { shutdownStatus = false; }, 30000);
    }

    // DUYURU KOMUTU
    if (message.content.startsWith('!duyuru ')) {
        const mesaj = message.content.replace('!duyuru ', '');
        sonDuyuru = mesaj; // İnternetteki ilan tahtasına mesajı yazdı
        message.reply(`📢 **DUYURU YAYINLANDI:**\n> ${mesaj}`);

        // Duyuruyu 1 dakika sonra sistemden siler (Ekranda sürekli kalmasın diye)
        setTimeout(() => { sonDuyuru = ""; }, 60000);
    }
});

client.login(process.env.TOKEN);
