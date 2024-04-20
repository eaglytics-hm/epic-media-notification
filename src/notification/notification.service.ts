import { BigQuery, type BigQueryTimestamp } from '@google-cloud/bigquery';
import { IncomingWebhook } from '@slack/webhook';
import type { RichTextSection } from '@slack/types';

import { getLogger } from '../logging.service';

const logger = getLogger(__filename);

const bigqueryClient = new BigQuery();
const webhookClient = new IncomingWebhook(process.env.SLACK_WEBHOOK_URL!);

export const getData = async () => {
    const getBatchedAt = async () => {
        type BatchedAt = { batched_at: BigQueryTimestamp };
        const { batched_at } = await bigqueryClient
            .query(`call EpicMedia.Notification(false)`)
            .then(([rows]) => <BatchedAt[]>rows)
            .then(([rows]) => rows);
        return batched_at;
    };
    const getHashrate = async () => {
        type Hashrate = {
            worker_id: number;
            company_name: string;
            worker_status: string;
            stage: string;
        };
        return await bigqueryClient.query(`call EpicMedia.Notification(true)`).then(([rows]) => <Hashrate[]>rows);
    };

    return await Promise.all([getBatchedAt(), getHashrate()] as const);
};

export const notificationService = async () => {
    const [batchedAt, rows] = await getData();
    logger.debug(`${rows.length} Rows`);

    const batchedAtBlock: RichTextSection = {
        type: 'rich_text_section',
        elements: [{ type: 'text', text: `Batched at: ${batchedAt.value}`, style: { bold: true } }],
    };

    if (rows.length === 0) {
        return await webhookClient.send({
            blocks: [
                {
                    type: 'rich_text',
                    elements: [
                        batchedAtBlock,
                        { type: 'rich_text_section', elements: [{ type: 'text', text: 'All workers are active' }] },
                    ],
                },
            ],
        });
    }

    return await webhookClient.send({
        blocks: [
            {
                type: 'rich_text',
                elements: [
                    batchedAtBlock,
                    { type: 'rich_text_section', elements: [{ type: 'text', text: 'There are unactive workers' }] },
                    {
                        type: 'rich_text_list',
                        style: 'bullet',
                        elements: rows.map((row) => ({
                            type: 'rich_text_section',
                            elements: [
                                { type: 'text', text: row.company_name, style: { bold: true } },
                                { type: 'text', text: ' ' },
                                { type: 'text', text: row.worker_id.toString(), style: { code: true } },
                                { type: 'text', text: ' ' },
                                { type: 'text', text: row.stage, style: { code: true } },
                            ],
                        })),
                    },
                ],
            },
        ],
    });
};
