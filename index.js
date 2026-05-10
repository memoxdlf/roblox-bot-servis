const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

let shutdownStatus = false;
let sonDuyuru = ""; 
let flashMesaj = ""; // Yeni: Ekran ortası mesajı
let sunucuVerisi = { oyuncuSayisi: 0, maxOyuncu: 0 };

app.get('/kontrol', (req, res) => {
    if (req.query.players) sunucuVerisi.oyuncuSayisi = req.query.players;
    if (req.query.maxPlayers) sunucuVerisi.maxOyuncu = req.query.maxPlayers;
    
    res.json({ 
        shutdown: shutdownStatus,
        duyuru: sonDuyuru,
        flash: flashMesaj // Roblox bunu okuyacak
    });
});

app.listen(port, () => { console.log("Başmühendis Flash Sistemi Hazır."); });

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // FLASH KOMUTU (!flash MESAJ)
    if (message.content.startsWith('!flash ')) {
        flashMesaj = message.content.replace('!flash ', '');
        message.reply(`🔥 **ACİL DURUM MESAJI GÖNDERİLDİ:**\n> ${flashMesaj}`);
        
        // 10 saniye sonra sistemden temizle (ekranda takılı kalmasın)
        setTimeout(() => { flashMesaj = ""; }, 10000);
    }

    // DİĞER KOMUTLAR (Durum, Duyuru, Kapat)
    if (message.content === '!durum') {
        const embed = new EmbedBuilder()
            .setTitle('🏗️ BAŞMÜHENDİS SAHA RAPORU')
            .setColor(0xffa500)
            .addFields(
                { name: '👤 Oyuncu', value: `${sunucuVerisi.oyuncuSayisi} / ${sunucuVerisi.maxOyuncu}`, inline: true },
                { name: '🌐 Durum', value: '🟢 Aktif', inline: true }
            );
        message.reply({ embeds: [embed] });
    }

    if (message.content.startsWith('!duyuru ')) {
        sonDuyuru = message.content.replace('!duyuru ', '');
        message.reply(`📢 Duyuru yayınlandı!`);
        setTimeout(() => { sonDuyuru = ""; }, 30000);
    }

    if (message.content === '!kapat') {
        shutdownStatus = true;
        message.reply('🚨 Sunucu kapatılıyor...');
        setTimeout(() => { shutdownStatus = false; }, 20000);
    }
});

client.login(process.env.TOKEN);
