import generator, { Entity, Response } from 'megalodon';
import * as fs from 'fs';
import * as path from 'path';
import axios, { AxiosResponse } from 'axios';
import { CronJob } from 'cron';
import * as dotenv from 'dotenv';
dotenv.config();

const client = generator('mastodon', 'https://social.lol', process.env.MASTODON_ACCESS_TOKEN);

async function getFile(type: boolean) {
    let file: fs.PathLike;
    let response: AxiosResponse;
    let provider: string;

    if(!type) {
        const current = new Intl.DateTimeFormat('en-US', { month: 'numeric', year: 'numeric' });
        const parts = current.formatToParts();
        const monthyear = parts.map(p => p.value.replace('/', '-')).join().replaceAll(',', '');

        const bun = response = await axios({
            url: `https://dailybunny.org/api/open/GetItemsByMonth?month=${monthyear}&collectionId=592091cb890b277866d108fc`,
            method: 'GET'
        });

        response = await axios({
            url: bun.data[0].assetUrl,
            method: 'GET',
            responseType: 'stream'
        });

        file = path.resolve(__dirname, 'file.jpg');
        provider = 'The Daily Bunny';
    } else {
        const bun = await axios({
            url: 'https://api.bunnies.io/v2/loop/random/?media=mp4',
            method: 'GET'
        });

        response = await axios({
            url: bun.data.media.mp4,
            method: 'GET',
            responseType: 'stream'
        });

        file = path.resolve(__dirname, 'file.mp4');
        provider = 'Bunnies.io';
    }

    const writer = fs.createWriteStream(file);
    response!.data.pipe(writer);

    return new Promise<any>((resolve, reject) => {
        writer.on('finish', () => {resolve({file: file, provider: provider})});
        writer.on('error', reject);
    })
}

new CronJob('30 16 * * *', () => {
    getFile(Math.random() < 0.4).then((data) => {
        client.uploadMedia(fs.createReadStream(data.file)).then((res: Response<Entity.Attachment>) => {
            client.postStatus(`Here is your daily bunny provided by ${data.provider}`, { media_ids: [res.data.id] }).then(() => fs.rmSync(path.resolve(data.file)));
        }).catch((e) => console.log(e));
    });
}, null, true, 'Europe/Berlin');