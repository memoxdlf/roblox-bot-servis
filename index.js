const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

let flashMesaj = ""; 
let sunucuSaati = ""; 
let sunucuVerisi = { oyuncuSayisi: 0, maxOyuncu: 0 };

app.get('/kontrol', (req, res) => {
    res.json({ 
        flash: flashMesaj,
        saat: sunucuSaati
    });
    sunucuSaati = ""; // Saat bir kez iletildikten sonra sıfırlanır
});

app.listen(port, () => { console.log("Yönetim Paneli Başlatıldı."); });

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // !durum - Sunucu Raporu
    if (message.content === '!durum') {
        const embed = new EmbedBuilder()
            .setTitle('📊 SUNUCU ANALİZ RAPORU')
            .setColor(0x2b2d31)
            .addFields(
                { name: '👤 Aktif Oyuncu', value: `${sunucuVerisi.oyuncuSayisi} / ${sunucuVerisi.maxOyuncu}`, inline: true },
                { name: '🌐 Erişim', value: '🟢 Uzaktan Bağlantı Aktif', inline: true }
            );
        message.reply({ embeds: [embed] });
    }

    // !saat [0-24] - Zaman Kontrolü
    if (message.content.startsWith('!saat ')) {
        sunucuSaati = message.content.replace('!saat ', '').trim();
        message.reply(`⏰ Oyun saati **${sunucuSaati}:00** olarak güncellendi.`);
    }

    // !flash [mesaj] - Modern Ekran Bildirimi
    if (message.content.startsWith('!flash ')) {
        flashMesaj = message.content.replace('!flash ', '').trim();
        if (!flashMesaj) return message.reply("⚠️ Lütfen bir mesaj içeriği girin!");
        
        message.reply(`⚡ **FLASH BİLDİRİM GÖNDERİLDİ:**\n> ${flashMesaj}`);
        setTimeout(() => { flashMesaj = ""; }, 10000);
    }
});

client.login(process.env.TOKEN);
