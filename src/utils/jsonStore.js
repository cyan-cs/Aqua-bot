const fs = require('fs/promises');
const path = require('path');
const filePath = path.resolve(__dirname, '../data/delMessage.json');

async function readMessageIds() {
    try {
        await fs.access(filePath).catch(async () => {
            await fs.writeFile(filePath, JSON.stringify([]), 'utf-8');
        });

        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        console.error('[ERROR] JSON 読み込み失敗:', err?.stack || err?.message || String(err));
        return [];
    }
}

async function writeMessageIds(ids) {
    try {
        await fs.writeFile(filePath, JSON.stringify(ids, null, 2), 'utf-8');
    } catch (err) {
        console.error('[ERROR] JSON 書き込み失敗:', err?.stack || err?.message || String(err));
    }
}

async function addMessageId(id) {
    const ids = await readMessageIds();
    if (!ids.includes(id)) {
        ids.push(id);
        await writeMessageIds(ids);
        console.debug(`[DEBUG] JSON に ID 追加: ${id}`);
    }
}

async function removeMessageId(id) {
    const ids = await readMessageIds();
    const updated = ids.filter(mid => mid !== id);
    await writeMessageIds(updated);
    console.debug(`[DEBUG] JSON から ID 削除: ${id}`);
}

module.exports = {
    readMessageIds,
    writeMessageIds,
    addMessageId,
    removeMessageId,
};
