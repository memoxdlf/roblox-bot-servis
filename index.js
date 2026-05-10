const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// SISTEM HAFIZASI
let havuz = { duyuru: "", hedef: "", mesaj: "", kickHedef: "", p: 0, m: 0 };

app.use(express.json());

// ROBLOX VERI CEKME NOKTASI
app.get('/kontrol', (req, res) => {
    if (req.query.p) havuz.p = req.query.p;
    if (req.query.m) havuz.m = req.query.m;
    res.json(havuz);
    
    // Verileri ilettikten sonra temizle
    havuz.duyuru = ""; 
    havuz.hedef = "";
    havuz.mesaj = "";
    havuz.kickHedef = "";
});

const client = new Client({ intents: [32768, 512, 1] });

client.on('messageCreate', async (m) => {
    if (m.author.bot || !m.content.startsWith('!')) return;
    const args = m.content.slice(1).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();

    try {
        // DUYURU KOMUTU
        if (cmd === 'duyuru') {
            const msg = args.join(' ');
            if (!msg) return m.reply("⚠️ **Hatalı Kullanım!** Doğrusu: `!duyuru [Mesaj]`");
            havuz.duyuru = msg;
            m.reply(`✅ Duyuru iletildi: **${msg}**`);
        } 
        
        // KICK KOMUTU (KONTROLLÜ)
        else if (cmd === 'kick') {
            if (!args[0]) {
                return m.reply("⚠️ **Eksik Bilgi!** Kimi atmak istiyorsun?\nDoğru Kullanım: `!kick [OyuncuAdı]`");
            }
            havuz.kickHedef = args[0];
            m.reply(`👞 **${args[0]}** sunucudan atılıyor!`);
        }

        // SHUTDOWN
        else if (cmd === 'shutdown') {
            havuz.duyuru = "SUNUCUYU_KAPAT_ACIL";
            m.reply("🛑 **SHUTDOWN:** Sunucu kapatma emri verildi.");
        }

        // ÖZEL MESAJ (KONTROLLÜ)
        else if (cmd === 'mesaj') {
            if (!args[0] || !args[1]) {
                return m.reply("⚠️ **Hatalı Kullanım!**\nDoğru Kullanım: `!mesaj [OyuncuAdı] [Mesaj]`");
            }
            havuz.hedef = args[0];
            havuz.mesaj = args.slice(1).join(' ');
            m.reply(`✉️ **${havuz.hedef}** oyuncusuna özel mesajın iletildi.`);
        }

        // DURUM
        else if (cmd === 'durum') {
            m.reply(`📊 **Sunucu Durumu:**\n👤 Oyuncu: ${havuz.p}/${havuz.m}`);
        }
    } catch (e) { console.log(e); }
});

app.listen(port, () => console.log("Bot/Server Hazır."));
client.login(process.env.TOKEN);
