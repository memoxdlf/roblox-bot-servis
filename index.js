const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

let flashMesaj = ""; 
let sunucuSaati = ""; 
let ozelMesaj = { hedef: "", icerik: "" }; // Yeni: Kişiye özel mesaj
let sunucuVerisi = { oyuncuSayisi: 0, maxOyuncu: 0 };

app.get('/kontrol', (req, res) => {
    res.json({ 
        flash: flashMesaj,
        saat: sunucuSaati,
        ozel: ozelMesaj // Roblox bunu kontrol edecek
    });
    // Mesaj iletildikten sonra temizle ki ekranda takılı kalmasın
    ozelMesaj = { hedef: "", icerik: "" };
    sunucuSaati = "";
});

app.listen(port, () => { console.log("Yönetim Paneli Güncellendi."); });

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // !mesaj [OyuncuAdı] [Mesaj]
    if (message.content.startsWith('!mesaj ')) {
        const args = message.content.split(' ');
        if (args.length < 3) return message.reply("⚠️ **Hata:** Kullanım: `!mesaj OyuncuAdi Mesajiniz` şeklinde olmalı.");
        
        const hedefOyuncu = args[1];
        const icerik = args.slice(2).join(' ');

        ozelMesaj = { hedef: hedefOyuncu, icerik: icerik };
        message.reply(`✉️ **${hedefOyuncu}** isimli oyuncuya özel mesaj gönderildi: \n> ${icerik}`);
    }

    // !durum, !flash ve !saat komutların aynı kalıyor...
    if (message.content === '!durum') {
        message.reply(`👤 Oyuncu: ${sunucuVerisi.oyuncuSayisi} / ${sunucuVerisi.maxOyuncu}`);
    }

    if (message.content.startsWith('!flash ')) {
        flashMesaj = message.content.replace('!flash ', '').trim();
        message.reply(`⚡ Flash gönderildi.`);
        setTimeout(() => { flashMesaj = ""; }, 10000);
    }
});

client.login(process.env.TOKEN);
