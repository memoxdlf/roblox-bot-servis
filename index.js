const { Client, GatewayIntentBits, EmbedBuilder, WebhookClient } = require('discord.js');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

let flashMesaj = ""; 
let sunucuSaati = ""; 
let ozelMesaj = { hedef: "", icerik: "" };
let sunucuVerisi = { oyuncuSayisi: 0, maxOyuncu: 0 };

app.use(express.json()); // Gelen verileri okumak için

// ROBLOX BURADAN VERİ ALIR VE VERİ GÖNDERİR
app.get('/kontrol', (req, res) => {
    res.json({ flash: flashMesaj, saat: sunucuSaati, ozel: ozelMesaj });
    ozelMesaj = { hedef: "", icerik: "" };
    sunucuSaati = "";
});

// ROBLOX LOG GÖNDERDİĞİNDE BURASI ÇALIŞIR
app.post('/log', (req, res) => {
    const { tip, oyuncu } = req.body;
    const kanal = client.channels.cache.get("1503137569876218121"); // Kanal ID'ni buraya yaz!

    if (kanal) {
        const embed = new EmbedBuilder()
            .setTitle(tip === "GIRIS" ? "📥 Sunucuya Katılım" : "📤 Sunucudan Ayrılma")
            .setDescription(`**${oyuncu}** isimli oyuncu sunucuya ${tip === "GIRIS" ? "bağlandı" : "veda etti"}.`)
            .setColor(tip === "GIRIS" ? 0x00ff00 : 0xff0000)
            .setTimestamp();
        
        kanal.send({ embeds: [embed] });
    }
    res.sendStatus(200);
});

app.listen(port, () => { console.log("Yönetim ve Log Sistemi Aktif."); });

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// (Eski komutların !flash, !mesaj, !durum vb. burada aynen kalabilir...)
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    // ... eski komut kodlarını buraya ekle ...
});

client.login(process.env.TOKEN);
