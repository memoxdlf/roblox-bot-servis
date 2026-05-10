const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

let havuz = { duyuru: "", hedef: "", mesaj: "", p: 0, m: 0 };

app.use(express.json());

app.get('/kontrol', (req, res) => {
    if (req.query.p) havuz.p = req.query.p;
    if (req.query.m) havuz.m = req.query.m;
    res.json(havuz);
    
    havuz.hedef = "";
    havuz.mesaj = "";
    // Shutdown komutu okunduktan sonra temizlenir
    if (havuz.duyuru === "SUNUCUYU_KAPAT_ACIL") {
        havuz.duyuru = "";
    }
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
        if (cmd === 'duyuru' || cmd === 'flash') {
            const mesaj = args.join(' ');
            if (!mesaj) return m.reply("⚠️ Mesaj yazmalısın!");
            havuz.duyuru = mesaj;
            m.reply(`✅ **${cmd.toUpperCase()}** Gönderildi: \`${mesaj}\``);
        } 

        // İSİM DEĞİŞTİ: !kapat -> !shutdown
        else if (cmd === 'shutdown') {
            havuz.duyuru = "SUNUCUYU_KAPAT_ACIL";
            m.reply("🛑 **SHUTDOWN:** Sunucu kapatma emri gönderildi, herkes kickleniyor!");
        }

        else if (cmd === 'mesaj') {
            if (args.length < 2) return m.reply("⚠️ Kullanım: `!mesaj [İsim] [Mesaj]`");
            havuz.hedef = args[0];
            havuz.mesaj = args.slice(1).join(' ');
            m.reply(`✉️ **${havuz.hedef}** için özel mesaj iletildi.`);
        }

        else if (cmd === 'durum') {
            const embed = new EmbedBuilder()
                .setTitle("📊 Sunucu Durumu")
                .addFields(
                    { name: "👤 Oyuncu", value: `**${havuz.p} / ${havuz.m}**`, inline: true },
                    { name: "📢 Son Duyuru", value: `\`${havuz.duyuru || "Yok"}\``, inline: false }
                )
                .setColor(0x2f3136);
            m.reply({ embeds: [embed] });
        }
    } catch (err) {
        console.error(err);
    }
});

app.listen(port, () => console.log("Sistem Aktif."));
client.login(process.env.TOKEN);
