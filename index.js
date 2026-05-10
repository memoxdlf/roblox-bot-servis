console.log("--- SİSTEM BAŞLATILIYOR ---");

const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const app = express();

// Botun ayarları
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent
    ] 
});

let shutdownEmri = "yok"; 

// 1. ADIM: Bot Hazır Olduğunda Yaz
client.on('ready', () => {
    console.log(`✅ BAŞARILI: Discord Botu '${client.user.tag}' olarak giriş yaptı!`);
});

// 2. ADIM: Discord Komut Dinleyici
client.on('messageCreate', (message) => {
    if (message.content.startsWith('!kapat')) {
        const sebep = message.content.split(' ').slice(1).join(' ') || "Sebep belirtilmedi";
        shutdownEmri = sebep;
        console.log(`📢 EMİR GELDİ: Sunucu şu sebeple kapatılıyor: ${sebep}`);
        message.reply(`🚨 **SİSTEM MESAJI:** Sunucu kapatma emri alındı!\nSebep: ${sebep}`);
    }
});

// 3. ADIM: Roblox Kapısı (Express)
app.get('/kontrol', (req, res) => {
    res.send(shutdownEmri);
    if (shutdownEmri !== "yok") {
        console.log("🔗 BİLGİ: Roblox emri sorguladı ve emri aldı.");
        shutdownEmri = "yok"; 
    }
});

// 4. ADIM: Sunucuyu Başlat
app.listen(3000, () => {
    console.log('✅ BAŞARILI: Roblox kapısı 3000 portunda açıldı!');
});

// 5. ADIM: Discord'a Bağlan
// DİKKAT: Alttaki tırnak içine Tokenini yapıştır ve kaydetmeyi unutma!
client.login(process.env.TOKEN);

// Hata ayıklama (Eğer token yanlışsa burası çalışır)
process.on('unhandledRejection', error => {
    console.error('❌ HATA: Bot giriş yapamadı. Token yanlış olabilir veya internet yok:', error);
});