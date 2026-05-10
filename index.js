const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

let havuz = { duyuru: "", hedef: "", mesaj: "", kickHedef: "", p: 0, m: 0, aktifOyuncular: [] };

app.use(express.json());

app.get('/kontrol', (req, res) => {
    if (req.query.p) havuz.p = req.query.p;
    if (req.query.m) havuz.m = req.query.m;
    if (req.query.users) havuz.aktifOyuncular = req.query.users.split(",");

    res.json(havuz);
    
    // Verileri gönderdikten sonra anında sıfırla
    havuz.duyuru = ""; 
    havuz.hedef = "";
    havuz.mesaj = "";
    havuz.kickHedef = "";
});

const client = new Client({ 
    intents: [32768, 512, 1] 
});

client.on('messageCreate', async (m) => {
    if (m.author.bot || !m.content.startsWith('!')) return;
    const args = m.content.slice(1).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();

    try {
        // YENİ: !YARDIM KOMUTU
        if (cmd === 'yardım' || cmd === 'help') {
            const yardimEmbed = new EmbedBuilder()
                .setTitle("🛠️ Sistem Kullanım Kılavuzu")
                .setDescription("Aşağıdaki komutları kullanarak sunucuyu yönetebilirsiniz:")
                .addFields(
                    { name: "📢 !duyuru [Mesaj]", value: "Ekrana 5 saniyelik duyuru atar.", inline: false },
                    { name: "👞 !kick [İsim]", value: "Oyuncuyu sunucudan atar.", inline: true },
                    { name: "🛑 !shutdown", value: "Sunucuyu kapatır.", inline: true },
                    { name: "✉️ !mesaj [İsim] [Mesaj]", value: "Kişiye özel bildirim gönderir.", inline: false },
                    { name: "📊 !durum", value: "Oyuncu listesini ve sayısını gösterir.", inline: true }
                )
                .setColor(0xFFA500)
                .setFooter({ text: "Sistem Başmühendisi" });
            
            return m.reply({ embeds: [yardimEmbed] });
        }

        // KICK KOMUTU
        if (cmd === 'kick') {
            const hedef = args[0];
            if (!hedef) return m.reply("⚠️ Doğru kullanım: `!kick [OyuncuAdı]`");
            
            const oyundaMi = havuz.aktifOyuncular.some(name => name.toLowerCase() === hedef.toLowerCase());
            if (!oyundaMi) return m.reply(`❌ **${hedef}** şu an oyunda değil.`);

            havuz.kickHedef = hedef;
            m.reply(`👞 **${hedef}** sunucudan atılıyor!`);
        }

        // DUYURU KOMUTU
        else if (cmd === 'duyuru') {
            const msg = args.join(' ');
            if (!msg) return m.reply("⚠️ Doğru kullanım: `!duyuru [Mesaj]`");
            havuz.duyuru = msg;
            m.reply(`📢 Duyuru iletildi: **${msg}**`);
        }

        // SHUTDOWN
        else if (cmd === 'shutdown') {
            havuz.duyuru = "SUNUCUYU_KAPAT_ACIL";
            m.reply("🛑 Sunucu kapatma emri verildi.");
        }

        // DURUM
        else if (cmd === 'durum') {
            m.reply(`📊 **Durum:** ${havuz.p}/${havuz.m}\n👥 **Aktifler:** \`${havuz.aktifOyuncular.join(", ") || "Kimse yok"}\``);
        }
        
    } catch (e) { console.log("Hata oluştu:", e); }
});

app.listen(port, () => console.log("Bot Hazır."));
client.login(process.env.TOKEN);
