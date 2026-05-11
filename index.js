const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

let havuz = { duyuru: "", mesaj: "", kickHedef: "", p: 0, m: 0, aktifOyuncular: [] };

app.use(express.json());

app.get('/kontrol', (req, res) => {
    if (req.query.p) havuz.p = req.query.p;
    if (req.query.m) havuz.m = req.query.m;
    if (req.query.users) havuz.aktifOyuncular = req.query.users.split(",");
    res.json(havuz);
    havuz.duyuru = ""; havuz.kickHedef = ""; havuz.mesaj = ""; 
});

app.get('/', (req, res) => res.send("Bot 7/24 Aktif!"));

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [
    new SlashCommandBuilder()
        .setName('shutdown')
        .setDescription('Sunucuyu güncelleyerek yeniden başlatır (Rejoin).')
        .addStringOption(opt => opt.setName('sebep').setDescription('Yeniden başlatma sebebi.').setRequired(true)),
    new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Oyuncuyu sunucudan atar.')
        .addStringOption(opt => opt.setName('oyuncu').setDescription('Oyuncu adı').setRequired(true)),
    new SlashCommandBuilder()
        .setName('duyuru')
        .setDescription('Ekrana duyuru gönderir.')
        .addStringOption(opt => opt.setName('mesaj').setDescription('Duyuru metni').setRequired(true)),
    new SlashCommandBuilder()
        .setName('durum')
        .setDescription('Aktif oyuncuları gösterir.')
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.once('ready', async () => {
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('Slash komutları hazır!');
    } catch (e) { console.error(e); }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName === 'shutdown') {
        const sebep = interaction.options.getString('sebep');
        havuz.duyuru = "SUNUCUYU_KAPAT_ACIL";
        havuz.mesaj = sebep;
        await interaction.reply(`🛑 **Sistem Güncelleniyor!** Oyuncular en yeni sürüme aktarılacak.\n**Sebep:** ${sebep}`);
    } else if (interaction.commandName === 'kick') {
        const oyuncu = interaction.options.getString('oyuncu');
        havuz.kickHedef = oyuncu;
        await interaction.reply(`👞 **${oyuncu}** sunucudan atıldı.`);
    } else if (interaction.commandName === 'duyuru') {
        havuz.duyuru = interaction.options.getString('mesaj');
        await interaction.reply(`📢 Duyuru iletildi.`);
    } else if (interaction.commandName === 'durum') {
        const embed = new EmbedBuilder().setTitle("📊 Durum").setColor(0x3498db)
            .addFields({ name: "👤 Oyuncu", value: `${havuz.p}/${havuz.m}`, inline: true });
        await interaction.reply({ embeds: [embed] });
    }
});

app.listen(port, () => console.log("Server Yayında."));
client.login(process.env.TOKEN);
