const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const express = require('express');
const app = express();

// Sistem hafızası
let havuz = { duyuru: "", hedef: "", mesaj: "", p: 0, m: 0 };

app.use(express.json());

// Roblox buradan veri çeker
app.get('/kontrol', (req, res) => {
    if (req.query.p) havuz.p = req.query.p;
    if (req.query.m) havuz.m = req.query.m;
    res.json(havuz);
    // Tek seferlik verileri gönderdikten sonra temizle
    havuz.hedef = "";
    havuz.mesaj = "";
    // !flash veya !duyuru kullanıldıysa Roblox'un okuması için kısa süre tutulur
});

const client = new Client({ intents: [32768, 512, 1] });

client.on('messageCreate', async (m) => {
    if (m.author.bot || !m.content.startsWith('!')) return;
    const args = m.content.slice(1).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();

    if (cmd === 'duyuru' || cmd === 'flash') {
        havuz.duyuru = args.join(' ');
        m.reply(`⚡ **İşlem Tamam:** "${havuz.duyuru}" mesajı gönderildi.`);
    } 
    else if (cmd === 'kapat') {
        havuz.duyuru = "KAPAT_KOMUTU"; // Roblox bunu görünce paneli anında kapatacak
        m.reply("🚫 Ekrandaki tüm duyurular kapatıldı.");
    }
    else if (cmd === 'mesaj') {
        if (args.length < 2) return m.reply("⚠️ Kullanım: !mesaj [OyuncuAdı] [Mesaj]");
        havuz.hedef = args[0];
        havuz.mesaj = args.slice(1).join(' ');
        m.reply(`✉️ **${havuz.hedef}** için özel mesaj iletildi.`);
    }
    else if (cmd === 'durum') {
        const embed = new EmbedBuilder()
            .setTitle("📊 Sunucu Durumu")
            .addFields(
                { name: "👤 Oyuncu Sayısı", value: `${havuz.p} / ${havuz.m}`, inline: true },
                { name: "📢 Son Duyuru", value: havuz.duyuru || "Yok", inline: false }
            )
            .setColor(0x00AEFF);
        m.reply({ embeds: [embed] });
    }
});

app.listen(process.env.PORT || 3000);
client.login(process.env.TOKEN);
