const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');
const { MONEY_UNIT } = require('../../utils/economyManager.js');
const economy = require('../../utils/economyManager.js');
const logger = require('../../utils/logger.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roll')
        .setDescription('さいころの目を当てて掛け金を5倍にしよう！')
        .addStringOption(option =>
            option.setName('bet')
                .setDescription('賭け金を指定してください。数値、"all"、"half"が使用可能です。')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('number')
                .setDescription('当てるさいころの目（1～6）を指定してください。')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(6)
        ),

    async executeSlash(interaction) {
        const userId = interaction.user.id;
        const rawBet = interaction.options.getString('bet').toLowerCase();
        const guessNumber = interaction.options.getInteger('number');
        let balance;

        try {
            balance = await economy.getBalance(userId);
        } catch (err) {
            logger.error('残高取得失敗:', err);
            return interaction.reply({ content: '残高情報の取得に失敗しました。再度お試しください。', ephemeral: true });
        }

        let bet;
        // 賭け金の解釈
        if (rawBet === 'all') {
            bet = balance;
        } else if (rawBet === 'half') {
            bet = Math.floor(balance / 2);
        } else if (!isNaN(rawBet)) {
            bet = parseInt(rawBet);
        } else {
            return interaction.reply({ content: '賭け金は数値または "all"、"half" のいずれかを指定してください。', ephemeral: true });
        }

        if (bet <= 0) {
            return interaction.reply({ content: '賭け金は1以上である必要があります。', ephemeral: true });
        }
        if (balance < bet) {
            return interaction.reply({ content: `残高が不足しています。現在の残高は ${balance}${MONEY_UNIT} です。`, ephemeral: true });
        }

        // まず賭け金を減らす
        try {
            await economy.subtractBalance(userId, bet);
        } catch (err) {
            logger.error('賭け金減算失敗:', err);
            return interaction.reply({ content: '賭け金の処理に失敗しました。再度お試しください。', ephemeral: true });
        }

        // サイコロを振る（1~6の乱数）
        const rolledNumber = rollDice();

        // 勝敗判定
        let resultText;
        let payout = 0;
        if (rolledNumber === guessNumber) {
            payout = bet * 5;
            resultText = `おめでとうございます！当たりです！あなたの勝ちです！賭け金の5倍の **${payout}${MONEY_UNIT}** を獲得しました。`;
            try {
                await economy.addBalance(userId, payout);
            } catch (err) {
                logger.error('払い戻し処理失敗:', err);
                return interaction.reply({ content: '勝利したのに払い戻し処理に失敗しました。運営に報告してください。', ephemeral: true });
            }
        } else {
            resultText = `残念！はずれです…。出た目は **${rolledNumber}** でした。賭け金の **${bet}${MONEY_UNIT}** は没収されました。`;
        }

        // 結果Embed作成
        const embed = new EmbedBuilder()
            .setTitle('🎲 ロールゲーム結果')
            .addFields(
                { name: 'あなたの賭け金', value: `${bet}${MONEY_UNIT}`, inline: true },
                { name: 'あなたの予想した目', value: `${guessNumber}`, inline: true },
                { name: '出た目', value: `${rolledNumber}`, inline: true }
            )
            .setDescription(resultText)
            .setColor(payout > 0 ? 'Green' : 'Red')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};

// ===== 補助関数 =====
function rollDice() {
    return Math.floor(Math.random() * 6) + 1;
}
