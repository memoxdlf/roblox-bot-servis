const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

let shutdownStatus = false;
let sonDuyuru = ""; 
let flashMesaj = ""; 
let sunucuVerisi = { oyuncuSayisi: 0, maxOyuncu: 0 };

app.get('/kontrol', (req, res) => {
    if (req.query.players) sunucuVerisi.oyuncuSayisi = req.query.players;
    if (req.query.maxPlayers) sunucuVerisi.maxOyuncu = req.query.maxPlayers;
    res.json({ shutdown: shutdownStatus, duyuru: sonDuyuru, flash: flashMesaj });
});

app.listen(port, () => { console.log("Başmühendis Sistemi Aktif."); });

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // FLASH KOMUTU KONTROLÜ
    if (message.content.startsWith('!flash')) {
        const icerik = message.content.replace('!flash', '').trim();

        // EĞER MESAJ BOŞSA
        if (!icerik) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('⚠️ Hatalı Kullanım')
                        .setDescription('**Başmühendis Talimatı:** Lütfen gönderilecek mesajı yazın!\n\n**Örnek:** `!flash Sunucu bakıma giriyor.`')
                        .setColor(0xff0000) // Kırmızı uyarı
                ]
            });
        }

        // MESAJ DOLUYSA GÖNDER
        flashMesaj = icerik;
        message.reply(`🔥 **ACİL DURUM MESAJI YAYINLANDI:**\n> ${flashMesaj}`);
        setTimeout(() => { flashMesaj = ""; }, 10000);
    }

    // !durum KOMUTU
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
});

client.login(process.env.TOKEN);
