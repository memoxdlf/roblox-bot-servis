const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

let shutdownStatus = false;

// Roblox buraya baktığında ARTIK "yok" GÖRMEYECEK
app.get('/kontrol', (req, res) => {
    res.json({ shutdown: shutdownStatus });
});

app.listen(port, () => { console.log("Sistem hazır."); });

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.on('messageCreate', async (message) => {
    if (message.content === '!kapat') {
        shutdownStatus = true;
        message.reply('🚨 **EMİR ALINDI!** Sunucu kapatılıyor...');
        setTimeout(() => { shutdownStatus = false; }, 30000); 
    }
});

client.login(process.env.TOKEN);
