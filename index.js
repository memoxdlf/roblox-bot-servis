const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

let havuz = { duyuru: "", hedef: "", mesaj: "", p: 0, m: 0 };

app.use(express.json());

app.get('/kontrol', (req, res) => {
    if (req.query.p) havuz.p = req.query.p;
    if (req.query.m) havuz.m = req.query.m;
    res.json(havuz);
    
    // Verileri gönderdikten sonra sıfırla (Sonsuz döngü koruması)
    havuz.duyuru = ""; 
    havuz.hedef = "";
    havuz.mesaj = "";
});

const client = new Client({ 
    intents: [32768, 512, 1] 
});

client.on('messageCreate', async (m) => {
    if (m.author.bot || !m.content.startsWith('!')) return;
    const args = m.content.slice(1).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();

    try {
        // SADECE DUYURU
        if (cmd === 'duyuru') {
            const msg = args.join(' ');
            if (!msg) return m.reply("⚠️ Bir duyuru metni yazın!");
            havuz.duyuru = msg;
            m.reply(`📢 **Duyuru İletildi:** ${msg}`);
        } 
        // SUNUCU KAPATMA
        else if (cmd === 'shutdown') {
            havuz.duyuru = "SUNUCUYU_KAPAT_ACIL";
            m.reply("🛑 **SHUTDOWN:** Sunucu kapatma emri gönderildi.");
        }
        // ÖZEL MESAJ
        else if (cmd === 'mesaj') {
            if (args.length < 2) return m.reply("⚠️ Kullanım: `!mesaj [İsim] [Mesaj]`");
            havuz.hedef = args[0];
            havuz.mesaj = args.slice(1).join(' ');
            m.reply(`✉️ **${havuz.hedef}** için özel mesaj iletildi.`);
        }
        // DURUM
        else if (cmd === 'durum') {
            const embed = new EmbedBuilder()
                .setTitle("📊 Sunucu Bilgisi")
                .setDescription(`👤 **Oyuncu:** ${havuz.p} / ${havuz.m}`)
                .setColor(0x3498db);
            m.reply({ embeds: [embed] });
        }
    } catch (e) { console.log("Hata:", e); }
});

app.listen(port, () => console.log("Bot Hazır."));
client.login(process.env.TOKEN);
