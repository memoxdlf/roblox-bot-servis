const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// VERİ DEPOSU
let veriHavuzu = {
    flash: "",
    duyuru: "",
    saat: "",
    ozelHedef: "",
    ozelMesaj: "",
    oyuncuSayisi: 0, // !durum için
    maxOyuncu: 0     // !durum için
};

app.use(express.json());

// ROBLOX BURADAN VERİ ALIR VE OYUNCU SAYISINI GÖNDERİR
app.get('/kontrol', (req, res) => {
    // Roblox'tan gelen oyuncu sayılarını kaydet
    if (req.query.p) veriHavuzu.oyuncuSayisi = req.query.p;
    if (req.query.m) veriHavuzu.maxOyuncu = req.query.m;

    res.json(veriHavuzu);
    
    // Tek seferlikleri sıfırla
    veriHavuzu.flash = "";
    veriHavuzu.saat = "";
    veriHavuzu.ozelHedef = "";
    veriHavuzu.ozelMesaj = "";
});

// LOG SİSTEMİ (Aynen Kalıyor)
app.post('/log', (req, res) => {
    const { tip, oyuncu } = req.body;
    const kanal = client.channels.cache.get("LOG_KANAL_ID_BURAYA");
    if (kanal) {
        const embed = new EmbedBuilder()
            .setTitle(tip === "GIRIS" ? "📥 Giriş" : "📤 Çıkış")
            .setDescription(`**${oyuncu}** sunucuya ${tip === "GIRIS" ? "girdi" : "çıktı"}.`)
            .setColor(tip === "GIRIS" ? 0x00FF00 : 0xFF0000);
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

    // !durum KOMUTU (TAMİR EDİLDİ)
    if (komut === 'durum') {
        const embed = new EmbedBuilder()
            .setTitle("📊 Sunucu Durumu")
            .addFields(
                { name: "👤 Oyuncu Sayısı", value: `${veriHavuzu.oyuncuSayisi} / ${veriHavuzu.maxOyuncu}`, inline: true },
                { name: "📢 Son Duyuru", value: veriHavuzu.duyuru || "Yok", inline: false }
            )
            .setColor(0x3498db);
        m.reply({ embeds: [embed] });
    }
    
    // DİĞER KOMUTLAR (!flash, !duyuru, !saat, !mesaj)
    if (komut === 'flash') veriHavuzu.flash = args.join(' ');
    if (komut === 'duyuru') veriHavuzu.duyuru = args.join(' ');
    if (komut === 'saat') veriHavuzu.saat = args[0];
    if (komut === 'mesaj') {
        veriHavuzu.ozelHedef = args[0];
        veriHavuzu.ozelMesaj = args.slice(1).join(' ');
    }
});

app.listen(port, () => console.log("Sistem Aktif"));
client.login(process.env.TOKEN);
