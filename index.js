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
    m: 0,
    aktifOyuncular: [] 
};

app.use(express.json());

// ROBLOX VERI CEKME NOKTASI
app.get('/kontrol', (req, res) => {
    if (req.query.p) havuz.p = req.query.p;
    if (req.query.m) havuz.m = req.query.m;
    if (req.query.users) {
        havuz.aktifOyuncular = req.query.users.split(",");
    }

    res.json(havuz);
    
    // Verileri ilettikten sonra temizle
    havuz.duyuru = ""; 
    havuz.hedef = "";
    havuz.mesaj = "";
    havuz.kickHedef = "";
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
        // 1. KICK KOMUTU (OYUNCU KONTROLLÜ)
        if (cmd === 'kick') {
            const hedefIsim = args[0];
            if (!hedefIsim) {
                return m.reply("⚠️ **Hata:** Atılacak oyuncunun adını yazmalısın!\nDoğrusu: `!kick [OyuncuAdı]`");
            }

            const oyundaMi = havuz.aktifOyuncular.some(name => name.toLowerCase() === hedefIsim.toLowerCase());
            
            if (!oyundaMi) {
                return m.reply(`❌ **Hata:** "${hedefIsim}" adlı oyuncu şu an oyunda aktif değil.`);
            }

            havuz.kickHedef = hedefIsim;
            m.reply(`👞 **${hedefIsim}** bulundu ve sunucudan atılıyor!`);
        }

        // 2. DUYURU KOMUTU
        else if (cmd === 'duyuru') {
            const msg = args.join(' ');
            if (!msg) return m.reply("⚠️ **Hata:** Duyuru metni yazmalısın!\nDoğrusu: `!duyuru [Mesaj]`");
            havuz.duyuru = msg;
            m.reply(`📢 **Duyuru İletildi:** ${msg}`);
        }

        // 3. SHUTDOWN KOMUTU
        else if (cmd === 'shutdown') {
            havuz.duyuru = "SUNUCUYU_KAPAT_ACIL";
            m.reply("🛑 **SHUTDOWN:** Sunucu kapatma emri verildi.");
        }

        // 4. OZEL MESAJ KOMUTU
        else if (cmd === 'mesaj') {
            if (!args[0] || !args[1]) {
                return m.reply("⚠️ **Hata:** Eksik bilgi!\nDoğrusu: `!mesaj [OyuncuAdı] [Mesaj]`");
            }
            havuz.hedef = args[0];
            havuz.mesaj = args.slice(1).join(' ');
            m.reply(`✉️ **${havuz.hedef}** oyuncusuna özel mesaj iletildi.`);
        }

        // 5. DURUM KOMUTU
        else if (cmd === 'durum') {
            const embed = new EmbedBuilder()
                .setTitle("📊 Sunucu Durumu")
                .addFields(
                    { name: "👤 Oyuncu", value: `${havuz.p} / ${havuz.m}`, inline: true },
                    { name: "👥 Aktifler", value: `\`${havuz.aktifOyuncular.join(", ") || "Kimse yok"}\`` }
                )
                .setColor(0x3498db);
            m.reply({ embeds: [embed] });
        }
    } catch (e) { console.log(e); }
});

app.listen(port, () => console.log("Sistem Hazır."));
client.login(process.env.TOKEN);
