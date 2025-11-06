const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const logger = require('../../utils/logger');
const { addMessageId } = require('../../utils/jsonStore');

function createPingEmbed(ping, username) {
    const isError = ping === -1;
    const displayPing = isError ? '接続中 || 接続エラー' : `${ping}ms`;
    const color = isError || ping > 3000 ? 0xFF0000 : 0x00BFFF; // 3秒以上は赤

    return new EmbedBuilder()
        .setTitle('Pong! Bot 応答速度')
        .setDescription(`**WebSocket Ping:** \`${displayPing}\``)
        .setColor(color)
        .setFooter({ text: `Requested by ${username}` })
        .setTimestamp();
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Botの応答速度を確認します'),

    async executeSlash(interaction, client) {
        const username = interaction.user.tag;
        const placeholderEmbed = new EmbedBuilder()
            .setTitle('Pong!')
            .setColor(0x00BFFF)
            .setFooter({ text: `Requested by ${username}` })
            .setTimestamp();

        try {
            // まず計測中メッセージを送信
            const sentMsg = await interaction.reply({ embeds: [placeholderEmbed], fetchReply: true });
            await sentMsg.react('🗑️');
            await addMessageId(sentMsg.id);

            const startTime = Date.now();
            // WebSocket ping取得
            const ping = client.ws.ping;
            const endTime = Date.now();
            const totalPing = endTime - startTime;

            // 計測結果でEmbedを作成して編集
            const embed = createPingEmbed(totalPing, username);
            await sentMsg.edit({ embeds: [embed] });

            logger.info(`SlashCommand /ping 実行: ${username} | Ping=${totalPing}ms`);
        } catch (err) {
            logger.error(`SlashCommand /ping エラー: ${err.message}`, err);
            const errorEmbed = new EmbedBuilder()
                .setTitle('⚠️ エラー発生')
                .setDescription('コマンドの実行中にエラーが発生しました。')
                .setColor(0xFF0000)
                .setTimestamp();
            await interaction.editReply({ embeds: [errorEmbed] }).catch(() => {
                interaction.reply({ content: '❌ エラーが発生しました。', ephemeral: true });
            });
        }
    },

    async executeMessage(message, client) {
        const username = message.author.tag;
        const placeholderEmbed = new EmbedBuilder()
            .setTitle('Pong!')
            .setColor(0x00BFFF)
            .setFooter({ text: `Requested by ${username}` })
            .setTimestamp();

        try {
            const sentMsg = await message.reply({ embeds: [placeholderEmbed] });
            await sentMsg.react('🗑️');
            await addMessageId(sentMsg.id);

            const startTime = Date.now();
            const ping = client.ws.ping;
            const endTime = Date.now();
            const totalPing = endTime - startTime;

            const embed = createPingEmbed(totalPing, username);
            await sentMsg.edit({ embeds: [embed] });

            logger.info(`PrefixCommand ping 実行: ${username} | Ping=${totalPing}ms`);
        } catch (err) {
            logger.error(`PrefixCommand ping エラー: ${err.message}`, err);
            const errorEmbed = new EmbedBuilder()
                .setTitle('⚠️ エラー発生')
                .setDescription('コマンドの実行中にエラーが発生しました。')
                .setColor(0xFF0000)
                .setTimestamp();
            await message.reply({ embeds: [errorEmbed] });
        }
    }
};
