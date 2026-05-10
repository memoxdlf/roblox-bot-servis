const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// SISTEM HAFIZASI
let havuz = { 
    duyuru: "", 
    hedef: "", 
    mesaj: "", 
    kickHedef: "", 
    p: 0, 
    m: 0 
};

app.use(express.json());

// ROBLOX VERI CEKME NOKTASI
app.get('/kontrol', (req, res) => {
    if (req.query.p) havuz.p = req.query.p;
    if (req.query.m) havuz.m = req.query.m;
    
    res.json(havuz);
    
    // Verileri ilettikten sonra geçici olanları temizle
    havuz.duyuru = (havuz.duyuru === "SUNUCUYU_KAPAT_ACIL") ? "" : havuz.duyuru; 
    havuz.duyuru = ""; // Normal duyuruları da temizle ki tekrar etmesin
    havuz.hedef = "";
    havuz.mesaj = "";
    havuz.kickHedef = "";
});

const client = new Client({ 
    intents: [32768, 512, 1] 
});

client.on('messageCreate', async (m) => {
    if (m.author.bot || !m.content.startsWith('!')) return;
    const args = m.content.slice(1).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();

    try {
        if (cmd === 'duyuru') {
            const msg = args.join(' ');
            if (!msg) return m.reply("⚠️ Mesaj yaz!");
            havuz.duyuru = msg;
            m.reply(`✅ Duyuru iletildi: **${msg}**`);
        } 
        else if (cmd === 'kick') {
            if (!args[0]) return m.reply("⚠️ Oyuncu adı yaz!");
            havuz.kickHedef = args[0];
            m.reply(`👞 **${args[0]}** sunucudan atılıyor!`);
        }
        else if (cmd === 'shutdown') {
            havuz.duyuru = "SUNUCUYU_KAPAT_ACIL";
            m.reply("🛑 **SHUTDOWN:** Sunucu kapatma emri verildi.");
        }
        else if (cmd === 'mesaj') {
            if (args.length < 2) return m.reply("⚠️ Kullanım: `!mesaj [İsim] [Mesaj]`");
            havuz.hedef = args[0];
            havuz.mesaj = args.slice(1).join(' ');
            m.reply(`✉️ **${havuz.hedef}** için özel mesaj iletildi.`);
        }
        else if (cmd === 'durum') {
            const embed = new EmbedBuilder()
                .setTitle("📊 Sunucu Durumu")
                .setDescription(`👤 **Oyuncu:** ${havuz.p} / ${havuz.m}`)
                .setColor(0x00ff00)
                .setTimestamp();
            m.reply({ embeds: [embed] });
        }
    } catch (e) { console.log(e); }
});

app.listen(port, () => console.log("Bot/Server Aktif."));
client.login(process.env.TOKEN);
