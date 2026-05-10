const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// MERKEZİ VERİ DEPOSU
let veriHavuzu = {
    flash: "",
    duyuru: "",
    saat: "",
    ozelHedef: "",
    ozelMesaj: ""
};

app.use(express.json());

// ROBLOX VERİ ÇEKME NOKTASI (GET)
app.get('/kontrol', (req, res) => {
    res.json(veriHavuzu);
    
    // Tek seferlik verileri gönderdikten sonra "sıfırla"
    veriHavuzu.flash = "";
    veriHavuzu.saat = "";
    veriHavuzu.ozelHedef = "";
    veriHavuzu.ozelMesaj = "";
    // Duyuru sıfırlanmaz, yeni duyuruya kadar kalır.
});

// LOG SİSTEMİ (POST)
app.post('/log', (req, res) => {
    const { tip, oyuncu } = req.body;
    const kanal = client.channels.cache.get("LOG_KANAL_ID_BURAYA"); // BURAYA KANAL ID YAPIŞTIR
    if (kanal) {
        const renk = tip === "GIRIS" ? 0x00FF00 : 0xFF0000;
        const baslik = tip === "GIRIS" ? "📥 Giriş Yapıldı" : "📤 Çıkış Yapıldı";
        const embed = new EmbedBuilder()
            .setTitle(baslik)
            .setDescription(`**${oyuncu}** sunucuya ${tip === "GIRIS" ? "bağlandı" : "veda etti"}.`)
            .setColor(renk)
            .setTimestamp();
        kanal.send({ embeds: [embed] });
    }
    res.sendStatus(200);
});

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.on('messageCreate', async (m) => {
    if (m.author.bot || !m.content.startsWith('!')) return;

    const args = m.content.slice(1).trim().split(/ +/);
    const komut = args.shift().toLowerCase();

    if (komut === 'flash') {
        veriHavuzu.flash = args.join(' ');
        m.reply("🔥 Flash gönderildi.");
    } 
    else if (komut === 'duyuru') {
        veriHavuzu.duyuru = args.join(' ');
        m.reply("📢 Üst duyuru güncellendi.");
    }
    else if (komut === 'saat') {
        veriHavuzu.saat = args[0];
        m.reply(`⏰ Saat ${args[0]}:00 yapıldı.`);
    }
    else if (komut === 'mesaj') {
        if (args.length < 2) return m.reply("⚠️ Kullanım: !mesaj isim mesaj");
        veriHavuzu.ozelHedef = args[0];
        veriHavuzu.ozelMesaj = args.slice(1).join(' ');
        m.reply(`✉️ **${args[0]}** için mesaj sıraya alındı.`);
    }
});

app.listen(port, () => console.log("Bot Beyni Hazır."));
client.login(process.env.TOKEN);
