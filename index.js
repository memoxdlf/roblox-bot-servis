const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// VERİ MERKEZİ
let havuz = { duyuru: "", mesaj: "", kickHedef: "", chatTemizle: false };

app.use(express.json());

app.get('/kontrol', (req, res) => {
    res.json(havuz);
    // Roblox veriyi aldığı an kritik komutları sıfırla
    havuz.duyuru = ""; 
    havuz.kickHedef = ""; 
    havuz.chatTemizle = false;
});

app.get('/', (req, res) => res.send("Sistem Aktif"));

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [
    new SlashCommandBuilder().setName('shutdown').setDescription('Sunucuyu günceller.').addStringOption(o => o.setName('sebep').setDescription('Neden?').setRequired(true)),
    new SlashCommandBuilder().setName('duyuru').setDescription('Ekrana duyuru gönderir.').addStringOption(o => o.setName('mesaj').setDescription('Mesaj').setRequired(true)),
    new SlashCommandBuilder().setName('kick').setDescription('Oyuncuyu atar.').addStringOption(o => o.setName('oyuncu').setDescription('Kullanıcı Adı').setRequired(true)),
    new SlashCommandBuilder().setName('chat-temizle').setDescription('Chati temizler.')
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.once('ready', async () => {
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('Komutlar yüklendi.');
    } catch (e) { console.error(e); }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    // Hata korumalı deferReply
    try {
        await interaction.deferReply({ ephemeral: true });
    } catch (e) {
        console.error("Etkileşim başlatılamadı (Zaman aşımı):", e);
        return;
    }

    const cmd = interaction.commandName;

    try {
        if (cmd === 'shutdown') {
            havuz.duyuru = "SUNUCUYU_KAPAT_ACIL";
            havuz.mesaj = interaction.options.getString('sebep');
            await interaction.editReply("🛑 Shutdown başlatıldı.");
        } else if (cmd === 'duyuru') {
            havuz.duyuru = "NORMAL_DUYURU";
            havuz.mesaj = interaction.options.getString('mesaj');
            await interaction.editReply("📢 Duyuru gönderildi.");
        } else if (cmd === 'kick') {
            havuz.kickHedef = interaction.options.getString('oyuncu');
            await interaction.editReply(`👞 ${havuz.kickHedef} atıldı.`);
        } else if (cmd === 'chat-temizle') {
            havuz.chatTemizle = true;
            await interaction.editReply("🧹 Chat temizlendi.");
        }
    } catch (error) {
        console.error("Komut işleme hatası:", error);
        // interaction.editReply hata verebileceği için pcall gibi kontrol et
        pcall(() => interaction.editReply("❌ Bir hata oluştu."));
    }
});

function pcall(fn) { try { fn(); } catch(e) {} }

app.listen(port);
client.login(process.env.TOKEN);
