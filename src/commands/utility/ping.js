const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const logger = require('../../utils/logger');
const { addMessageId } = require('../../utils/jsonStore'); // 追加

function createPingEmbed(ping, username) {
    const isError = ping === -1;
    const displayPing = isError ? '接続中 || 接続エラー' : `${ping}ms`;

    const embed = new EmbedBuilder()
        .setTitle('Pong!')
        .setDescription(`**WebSocket Ping:** \`${displayPing}\``)
        .setColor(isError ? 0xFF0000 : 0x00BFFF)
        .setTimestamp()
        .setFooter({ text: `Requested by ${username}` });

    return embed;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Botの応答速度を確認します'),

    async executeSlash(interaction, client) {
        const ping = client.ws.ping;
        const username = interaction.user.tag;

        try {
            const embed = createPingEmbed(ping, username);
            const sentMsg = await interaction.reply({ embeds: [embed], fetchReply: true });

            await sentMsg.react('🗑️'); // 🗑️ リアクション
            await addMessageId(sentMsg.id); // delMessage.json にID保存

            logger.info(`SlashCommand /ping 実行: ${username} | Ping=${ping}ms`);
        } catch (err) {
            logger.error(`SlashCommand /ping エラー: ${err.message}`);
            await interaction.reply({ content: '❌ エラーが発生しました。', ephemeral: true });
        }
    },

    async executeMessage(message, client) {
        const ping = client.ws.ping;
        const username = message.author.tag;

        try {
            const embed = createPingEmbed(ping, username);
            const sentMsg = await message.reply({ embeds: [embed] });

            await sentMsg.react('🗑️');
            await addMessageId(sentMsg.id);

            logger.info(`PrefixCommand ping 実行: ${username} | Ping=${ping}ms`);
        } catch (err) {
            logger.error(`PrefixCommand ping エラー: ${err.message}`);
            await message.reply('❌ エラーが発生しました。');
        }
    }
};
