const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// SISTEM HAFIZASI
let havuz = { duyuru: "", hedef: "", mesaj: "", p: 0, m: 0 };

app.use(express.json());

// ROBLOX VERI CEKME NOKTASI
app.get('/kontrol', (req, res) => {
    // Oyuncu sayılarını güncelle
    if (req.query.p) havuz.p = req.query.p;
    if (req.query.m) havuz.m = req.query.m;
    
    // Veriyi Roblox'a gönder
    res.json(havuz);
    
    // KRITIK: Veriyi gönderdikten sonra havuzu temizle ki Roblox sürekli aynı şeyi okumasın
    havuz.duyuru = ""; 
    havuz.hedef = "";
    havuz.mesaj = "";
});

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent
    ] 
});

client.on('messageCreate', async (m) => {
    if (m.author.bot || !m.content.startsWith('!')) return;
    const args = m.content.slice(1).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();

    try {
        if (cmd === 'duyuru' || cmd === 'flash') {
            const msg = args.join(' ');
            if (!msg) return m.reply("⚠️ Mesaj yazmalısın!");
            havuz.duyuru = msg;
            m.reply(`📢 **Duyuru Gönderildi:** ${msg}`);
        } 
        else if (cmd === 'shutdown') {
            havuz.duyuru = "SUNUCUYU_KAPAT_ACIL";
            m.reply("🛑 **SHUTDOWN:** Sunucu kapatma emri iletildi!");
        }
        else if (cmd === 'mesaj') {
            if (args.length < 2) return m.reply("⚠️ Kullanım: `!mesaj [İsim] [Mesaj]`");
            havuz.hedef = args[0];
            havuz.mesaj = args.slice(1).join(' ');
            m.reply(`✉️ **${havuz.hedef}** için özel mesaj gönderildi.`);
        }
        else if (cmd === 'durum') {
            const embed = new EmbedBuilder()
                .setTitle("📊 Sunucu Durumu")
                .addFields(
                    { name: "👤 Oyuncu", value: `${havuz.p} / ${havuz.m}`, inline: true }
                )
                .setColor(0x00FF00);
            m.reply({ embeds: [embed] });
        }
    } catch (e) { console.log(e); }
});

app.listen(port, () => console.log("Render Sunucusu Aktif."));
client.login(process.env.TOKEN);
