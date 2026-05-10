const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// SISTEM HAFIZASI (Roblox buradan veri çeker)
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
    // Roblox'tan gelen sayıları ve isimleri kaydet
    if (req.query.p) havuz.p = req.query.p;
    if (req.query.m) havuz.m = req.query.m;
    if (req.query.users) {
        havuz.aktifOyuncular = req.query.users.split(",");
    }

    // Mevcut komutları gönder
    res.json(havuz);
    
    // KRITIK: Veriyi ilettikten sonra anında temizle (Döngüyü ve çift mesajı engeller)
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
        // 1. YARDIM KOMUTU
        if (cmd === 'yardım' || cmd === 'help') {
            const yardim = new EmbedBuilder()
                .setTitle("🛠️ Kullanım Kılavuzu")
                .setColor(0x00AEFF)
                .addFields(
                    { name: "📢 !duyuru [Mesaj]", value: "Ekrana 5 saniyelik şerit indirir.", inline: false },
                    { name: "👞 !kick [İsim]", value: "Oyuncuyu oyundan atar.", inline: true },
                    { name: "🛑 !shutdown", value: "Sunucuyu kapatır.", inline: true },
                    { name: "✉️ !mesaj [İsim] [Mesaj]", value: "Kişiye özel bildirim yollar.", inline: false },
                    { name: "📊 !durum", value: "Aktif oyuncu listesini gösterir.", inline: true }
                );
            return m.reply({ embeds: [yardim] });
        }

        // 2. KICK KOMUTU (AKILLI KONTROL)
        if (cmd === 'kick') {
            const hedef = args[0];
            if (!hedef) return m.reply("⚠️ **Eksik Bilgi!** Doğru kullanım: `!kick [OyuncuAdı]`");

            const oyundaMi = havuz.aktifOyuncular.some(name => name.toLowerCase() === hedef.toLowerCase());
            if (!oyundaMi) return m.reply(`❌ **Hata:** "${hedef}" şu an oyunda aktif değil.`);

            havuz.kickHedef = hedef;
            m.reply(`👞 **${hedef}** sunucudan atılıyor!`);
        }

        // 3. DUYURU KOMUTU
        else if (cmd === 'duyuru') {
            const msg = args.join(' ');
            if (!msg) return m.reply("⚠️ **Eksik Bilgi!** Doğru kullanım: `!duyuru [Mesaj]`");
            havuz.duyuru = msg;
            m.reply(`📢 Duyuru iletildi: **${msg}**`);
        }

        // 4. SHUTDOWN KOMUTU
        else if (cmd === 'shutdown') {
            havuz.duyuru = "SUNUCUYU_KAPAT_ACIL";
            m.reply("🛑 **SHUTDOWN:** Sunucu kapatma emri verildi.");
        }

        // 5. OZEL MESAJ
        else if (cmd === 'mesaj') {
            if (!args[0] || !args[1]) return m.reply("⚠️ **Hata!** Doğru kullanım: `!mesaj [İsim] [Mesaj]`");
            havuz.hedef = args[0];
            havuz.mesaj = args.slice(1).join(' ');
            m.reply(`✉️ **${havuz.hedef}** için mesaj gönderildi.`);
        }

        // 6. DURUM KOMUTU
        else if (cmd === 'durum') {
            const durum = new EmbedBuilder()
                .setTitle("📊 Sunucu Durumu")
                .addFields(
                    { name: "👤 Oyuncu", value: `${havuz.p} / ${havuz.m}`, inline: true },
                    { name: "👥 Aktifler", value: `\`${havuz.aktifOyuncular.join(", ") || "Kimse yok"}\`` }
                )
                .setColor(0x2ECC71);
            m.reply({ embeds: [durum] });
        }
    } catch (e) { console.error(e); }
});

app.listen(port, () => console.log("Sistem Aktif!"));
client.login(process.env.TOKEN);
