const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// SISTEM HAFIZASI
let havuz = { 
    duyuru: "", 
    hedef: "", 
    mesaj: "", 
    kickHedef: "", 
    p: 0, 
    m: 0,
    aktifOyuncular: [] // Roblox'taki isimleri burada tutacağız
};

app.use(express.json());

app.get('/kontrol', (req, res) => {
    if (req.query.p) havuz.p = req.query.p;
    if (req.query.m) havuz.m = req.query.m;
    
    // Roblox her istekte oyuncu listesini (virgülle ayırarak) bota göndersin
    if (req.query.users) {
        havuz.aktifOyuncular = req.query.users.split(",");
    }

    res.json(havuz);
    
    havuz.duyuru = ""; 
    havuz.hedef = "";
    havuz.mesaj = "";
    havuz.kickHedef = "";
});

const client = new Client({ intents: [32768, 512, 1] });

client.on('messageCreate', async (m) => {
    if (m.author.bot || !m.content.startsWith('!')) return;
    const args = m.content.slice(1).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();

    try {
        if (cmd === 'kick') {
            const hedefIsim = args[0];
            if (!hedefIsim) {
                return m.reply("⚠️ **Hata:** Atılacak oyuncunun adını yazmalısın!\nDoğrusu: `!kick [OyuncuAdı]`");
            }

            // OYUNCU KONTROLÜ
            const oyundaMi = havuz.aktifOyuncular.some(name => name.toLowerCase() === hedefIsim.toLowerCase());
            
            if (!oyundaMi) {
                return m.reply(`❌ **Hata:** "${hedefIsim}" adlı oyuncu şu an oyunda aktif değil.`);
            }

            havuz.kickHedef = hedefIsim;
            m.reply(`👞 **${hedefIsim}** bulundu ve sunucudan atılıyor!`);
        }
        
        // Diğer komutlar (Duyuru, Shutdown, Durum vs.) aynı kalıyor...
        else if (cmd === 'duyuru') {
            havuz.duyuru = args.join(' ');
            m.reply("📢 Duyuru iletildi.");
        }
        else if (cmd === 'shutdown') {
            havuz.duyuru = "SUNUCUYU_KAPAT_ACIL";
            m.reply("🛑 Sunucu kapatılıyor.");
        }
        else if (cmd === 'durum') {
            m.reply(`📊 Oyuncu: ${havuz.p}/${havuz.m}\n👥 Aktif: ${havuz.aktifOyuncular.join(", ") || "Kimse yok"}`);
        }
    } catch (e) { console.log(e); }
});

app.listen(port, () => console.log("Bot/Server Aktif."));
client.login(process.env.TOKEN);
