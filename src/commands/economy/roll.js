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
    .setDescription('さいころの目や奇数・偶数を当てて掛け金を増やそう！')
    .addStringOption(option =>
        option.setName('bet')
            .setDescription('賭け金を指定してください。数値、"all"、"half"が使用可能です。')
            .setRequired(true)
    )
    .addStringOption(option =>
        option.setName('guess')
            .setDescription('当てる目か "odd"（奇数）、"even"（偶数）を選択してください。')
            .setRequired(true)
            .addChoices(
                { name: '1', value: '1' },
                { name: '2', value: '2' },
                { name: '3', value: '3' },
                { name: '4', value: '4' },
                { name: '5', value: '5' },
                { name: '6', value: '6' },
                { name: 'odd (奇数)', value: 'odd' },
                { name: 'even (偶数)', value: 'even' }
            )
    ),


    async executeSlash(interaction) {
        const userId = interaction.user.id;
        const rawBet = interaction.options.getString('bet').toLowerCase();
        const rawGuess = interaction.options.getString('guess').toLowerCase();

        let balance;
        try {
            balance = await economy.getBalance(userId);
        } catch (err) {
            logger.error('残高取得失敗:', err);
            return interaction.reply({ content: '残高情報の取得に失敗しました。再度お試しください。', ephemeral: true });
        }

        // 賭け金の解釈
        let bet;
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

        // guessの妥当性チェック
        const validNumbers = ['1', '2', '3', '4', '5', '6'];
        const validOptions = ['odd', 'even'];
        if (!validNumbers.includes(rawGuess) && !validOptions.includes(rawGuess)) {
            return interaction.reply({ content: '予想は 1～6 の数字か "odd"（奇数）または "even"（偶数）で指定してください。', ephemeral: true });
        }

        // 賭け金減算
        try {
            await economy.subtractBalance(userId, bet);
        } catch (err) {
            logger.error('賭け金減算失敗:', err);
            return interaction.reply({ content: '賭け金の処理に失敗しました。再度お試しください。', ephemeral: true });
        }

        // サイコロ振る
        const rolledNumber = rollDice();

        // 勝敗判定
        let resultText;
        let payout = 0;

        if (validNumbers.includes(rawGuess)) {
            // 数値指定：当たりなら5倍
            const guessNumber = parseInt(rawGuess);
            if (rolledNumber === guessNumber) {
                payout = bet * 5;
                resultText = `おめでとうございます！目がピッタリ当たりました！賭け金の5倍の **${payout}${MONEY_UNIT}** を獲得しました。`;
            } else {
                resultText = `残念！はずれです。出た目は **${rolledNumber}** でした。賭け金の **${bet}${MONEY_UNIT}** は没収されました。`;
            }
        } else if (rawGuess === 'odd') {
            // 奇数指定：当たりなら2倍
            if (rolledNumber % 2 === 1) {
                payout = bet * 2;
                resultText = `おめでとうございます！奇数が出ました！賭け金の2倍の **${payout}${MONEY_UNIT}** を獲得しました。`;
            } else {
                resultText = `残念！偶数が出てしまいました。出た目は **${rolledNumber}** でした。賭け金の **${bet}${MONEY_UNIT}** は没収されました。`;
            }
        } else if (rawGuess === 'even') {
            // 偶数指定：当たりなら2倍
            if (rolledNumber % 2 === 0) {
                payout = bet * 2;
                resultText = `おめでとうございます！偶数が出ました！賭け金の2倍の **${payout}${MONEY_UNIT}** を獲得しました。`;
            } else {
                resultText = `残念！奇数が出てしまいました。出た目は **${rolledNumber}** でした。賭け金の **${bet}${MONEY_UNIT}** は没収されました。`;
            }
        }

        // 払い戻し
        if (payout > 0) {
            try {
                await economy.addBalance(userId, payout);
            } catch (err) {
                logger.error('払い戻し処理失敗:', err);
                return interaction.reply({ content: '勝利したのに払い戻し処理に失敗しました。運営に報告してください。', ephemeral: true });
            }
        }

        // 結果Embed
        const embed = new EmbedBuilder()
            .setTitle('🎲 ロールゲーム結果')
            .addFields(
                { name: 'あなたの賭け金', value: `${bet}${MONEY_UNIT}`, inline: true },
                { name: 'あなたの予想', value: rawGuess, inline: true },
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
