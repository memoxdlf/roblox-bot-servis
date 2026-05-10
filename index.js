const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// SİSTEMİN KALBİ (Veri Havuzu)
let havuz = { flash: "", duyuru: "", saat: "", hedef: "", mesaj: "", p: 0, m: 0 };

app.use(express.json());

// ROBLOX BURADAN VERİ ALIR VE GÖNDERİR
app.get('/kontrol', (req, res) => {
    if (req.query.p) havuz.p = req.query.p;
    if (req.query.m) havuz.m = req.query.m;
    res.json(havuz);
    // Tek seferlikleri gönderince sıfırla
    havuz.flash = ""; havuz.saat = ""; havuz.hedef = ""; havuz.mesaj = "";
});

// LOG SİSTEMİ (GİRİŞ-ÇIKIŞ)
app.post('/log', (req, res) => {
    const { tip, oyuncu } = req.body;
    const kanal = client.channels.cache.get("LOG_KANAL_ID_BURAYA"); // BURAYA ID YAZ
    if (kanal) {
        const embed = new EmbedBuilder()
            .setTitle(tip === "GIRIS" ? "📥 Giriş" : "📤 Çıkış")
            .setDescription(`**${oyuncu}** sunucuya ${tip === "GIRIS" ? "bağlandı" : "veda etti"}.`)
            .setColor(tip === "GIRIS" ? 0x00FF00 : 0xFF0000);
        kanal.send({ embeds: [embed] });
    }
    res.sendStatus(200);
});

const client = new Client({ intents: [1, 512, 32768] }); // Temel yetkiler

client.on('messageCreate', async (msg) => {
    if (msg.author.bot || !msg.content.startsWith('!')) return;
    const args = msg.content.slice(1).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();

    if (cmd === 'flash') { havuz.flash = args.join(' '); msg.reply("🔥 Flash gitti."); }
    else if (cmd === 'duyuru') { havuz.duyuru = args.join(' '); msg.reply("📢 Duyuru güncellendi."); }
    else if (cmd === 'saat') { havuz.saat = args[0]; msg.reply("⏰ Saat ayarlandı."); }
    else if (cmd === 'durum') {
        const embed = new EmbedBuilder()
            .setTitle("📊 Sunucu")
            .setDescription(`Oyuncu: ${havuz.p}/${havuz.m}\nDuyuru: ${havuz.duyuru || "Yok"}`)
            .setColor(0x00AEFF);
        msg.reply({ embeds: [embed] });
    }
    else if (cmd === 'mesaj') {
        havuz.hedef = args[0]; havuz.mesaj = args.slice(1).join(' ');
        msg.reply(`✉️ ${args[0]} için mesaj sıraya alındı.`);
    }
});

app.listen(port);
client.login(process.env.TOKEN);
