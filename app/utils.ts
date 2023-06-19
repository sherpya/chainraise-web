import jsSHA from 'jssha';
import { defaultSchema } from 'hast-util-sanitize';
import { visit } from 'unist-util-visit';
import { remark } from 'remark';
import { Processor } from 'unified';
import html, { Root } from 'remark-html';
import TurndownService, { Rule } from 'turndown';

import { Attachment, MarkDown } from '@/gen/app/models/markdown';

export function toMarkdown(html: string | undefined) {
    const attachments: Record<string, Attachment> = {};
    const turndownService = new TurndownService().addRule('img', {
        filter: 'img',
        replacement: (content: string, node: any, options: any) => {
            const uri: string = node.src;
            if (uri.startsWith('data')) {
                const [mime, blob] = uri.slice(5).split(';', 2);
                const parts = blob.split('base64,', 2);
                if (parts.length === 2) {
                    const attachment: Attachment = {
                        mime: mime,
                        content: Buffer.from(parts[1], 'base64')
                    };
                    const sha256 = new jsSHA('SHA-256', 'UINT8ARRAY');
                    const cid = sha256.update(attachment.content).getHash('HEX');
                    attachments[cid] = attachment;
                    node.src = `cid:${cid}`;
                }
            }

            // WFT, learn types!
            const image: Rule = options.rules.image;
            return image?.replacement?.(content, node, options) ?? '';
        }
    });
    const body = turndownService.turndown(html || '');
    const markdown: MarkDown = {
        body: new TextEncoder().encode(body),
        attachments: attachments
    };
    return MarkDown.encode(markdown).finish();
}

const schema = {
    ...defaultSchema,
    protocols: {
        src: [...(defaultSchema.protocols?.src ?? []), 'data'],
    },
};

function importImages(this: Processor, options: { attachments: MarkDown['attachments']; }) {
    return (tree: Root) => {
        visit(tree, 'image', (node) => {
            if (node.url.startsWith('cid:')) {
                const cid = node.url.slice(4);
                const attachment = options.attachments[cid];
                if (!attachment) {
                    console.log(`Missing attachment ${cid}`);
                    return;
                }
                const data = Buffer.from(attachment.content).toString('base64');
                node.url = `data:${attachment.mime};base64,${data}`;
            }
        });
    };
}

export async function toHTML(markdown: MarkDown) {
    const body = new TextDecoder().decode(markdown.body);

    const processedContent = await remark()
        .use(importImages, { attachments: markdown.attachments })
        .use(html, { sanitize: schema })
        .process(body);
    return processedContent.toString();
}
