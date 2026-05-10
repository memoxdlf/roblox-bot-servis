const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

let shutdownStatus = false;

// Roblox'un sorgu yaptığı kapı
app.get('/kontrol', (req, res) => {
    // Roblox bu JSON objesini (shutdown: true/false) okuyacak
    res.json({ shutdown: shutdownStatus });
});

app.listen(port, () => {
    console.log(`Sunucu ${port} portunda hazır.`);
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.on('ready', () => {
    console.log(`${client.user.tag} olarak giriş yapıldı!`);
});

client.on('messageCreate', async (message) => {
    // Komut kontrolü
    if (message.content === '!kapat') {
        shutdownStatus = true; // Sinyali TRUE yap
        message.reply('🚨 **EMİR ONAYLANDI:** Sunucu kapatılıyor! (30 saniye sonra sistem otomatik sıfırlanacaktır)');
        
        console.log("Kapatma emri verildi, sinyal TRUE yapıldı.");

        // 30 saniye boyunca TRUE kalsın ki Roblox mutlaka yakalasın
        setTimeout(() => {
            shutdownStatus = false;
            console.log("Sistem otomatik olarak normale döndü (FALSE).");
        }, 30000); 
    }
});

client.login(process.env.TOKEN);
