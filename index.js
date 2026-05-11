const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
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
    aktifOyuncular: [] 
};

app.use(express.json());

// ROBLOX VERI CEKME NOKTASI
app.get('/kontrol', (req, res) => {
    if (req.query.p) havuz.p = req.query.p;
    if (req.query.m) havuz.m = req.query.m;
    if (req.query.users) havuz.aktifOyuncular = req.query.users.split(",");

    res.json(havuz);
    
    // Verileri aktardıktan sonra temizle (döngüye girmemesi için)
    havuz.duyuru = ""; 
    havuz.kickHedef = ""; 
    havuz.hedef = ""; 
    havuz.mesaj = ""; 
});

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// SLASH KOMUT TANIMLARI
const commands = [
    new SlashCommandBuilder()
        .setName('shutdown')
        .setDescription('Sunucuyu geri sayımla kapatır.')
        .addStringOption(opt => opt.setName('sebep').setDescription('Kapatma sebebini yazın.').setRequired(true)),
    new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Oyuncuyu sunucudan atar.')
        .addStringOption(opt => opt.setName('oyuncu').setDescription('Oyuncu adı').setRequired(true)),
    new SlashCommandBuilder()
        .setName('duyuru')
        .setDescription('Sunucuya duyuru gönderir.')
        .addStringOption(opt => opt.setName('mesaj').setDescription('Duyuru metni').setRequired(true)),
    new SlashCommandBuilder()
        .setName('durum')
        .setDescription('Sunucu anlık durumunu gösterir.')
].map(command => command.toJSON());

// KOMUTLARI KAYDET
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.once('ready', async () => {
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('Slash komutları sisteme yüklendi!');
    } catch (e) { console.error(e); }
});

// KOMUT ETKİLEŞİMLERİ
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'shutdown') {
        const sebep = interaction.options.getString('sebep');
        havuz.duyuru = "SUNUCUYU_KAPAT_ACIL";
        havuz.mesaj = sebep; // Sebebi Roblox'a iletmek için mesaj kutusuna koyduk
        await interaction.reply(`🛑 **Shutdown başlatıldı!**\n**Sebep:** ${sebep}`);
    }

    else if (interaction.commandName === 'kick') {
        const oyuncu = interaction.options.getString('oyuncu');
        const oyundaMi = havuz.aktifOyuncular.some(n => n.toLowerCase() === oyuncu.toLowerCase());
        
        if (!oyundaMi) return interaction.reply({ content: `❌ **${oyuncu}** şu an oyunda değil!`, ephemeral: true });
        
        havuz.kickHedef = oyuncu;
        await interaction.reply(`👞 **${oyuncu}** sunucudan atılıyor.`);
    }

    else if (interaction.commandName === 'duyuru') {
        const msg = interaction.options.getString('mesaj');
        havuz.duyuru = msg;
        await interaction.reply(`📢 Duyuru iletildi: *${msg}*`);
    }

    else if (interaction.commandName === 'durum') {
        const embed = new EmbedBuilder()
            .setTitle("📊 Sunucu Durumu")
            .setColor(0x2ecc71)
            .addFields(
                { name: "👤 Oyuncu Sayısı", value: `${havuz.p}/${havuz.m}`, inline: true },
                { name: "👥 Aktif Listesi", value: `\`${havuz.aktifOyuncular.join(", ") || "Kimse yok"}\`` }
            );
        await interaction.reply({ embeds: [embed] });
    }
});

app.listen(port, () => console.log("Modern Bot Aktif."));
client.login(process.env.TOKEN);
