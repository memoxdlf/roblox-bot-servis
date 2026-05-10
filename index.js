const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const app = express();

// Verileri başlangıçta tanımlıyoruz (undefined hatasını önler)
let veri = { flash: "", duyuru: "Henüz duyuru yok.", hedef: "", mesaj: "" };

app.use(express.json());

app.get('/kontrol', (req, res) => {
    try {
        res.json(veri);
        // Gönderilen geçici verileri temizle ama duyuruyu tut
        veri.flash = ""; 
        veri.hedef = ""; 
        veri.mesaj = "";
    } catch (err) {
        console.error("Veri gönderme hatası:", err);
        res.status(500).send("Hata");
    }
});

const client = new Client({ intents: [32768, 512, 1] });

client.on('messageCreate', async (m) => {
    if (m.author.bot || !m.content.startsWith('!')) return;
    const args = m.content.slice(1).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();

    try {
        if (cmd === 'flash') {
            veri.flash = args.join(' ');
            m.reply("⚡ Flash iletildi.");
        } else if (cmd === 'duyuru') {
            veri.duyuru = args.join(' ');
            m.reply("📢 Duyuru güncellendi.");
        } else if (cmd === 'mesaj') {
            if (args.length < 2) return m.reply("⚠️ Kullanım: !mesaj isim mesaj");
            veri.hedef = args[0];
            veri.mesaj = args.slice(1).join(' ');
            m.reply(`✉️ **${args[0]}** için mesaj sıraya alındı.`);
        }
    } catch (e) {
        console.log("Komut işleme hatası:", e);
    }
});

app.listen(process.env.PORT || 3000, () => console.log("Bot Zırhlı Modda Aktif."));
client.login(process.env.TOKEN);
