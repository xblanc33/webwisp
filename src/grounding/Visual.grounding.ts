import { ElementHandle } from 'playwright';
import fs from 'node:fs';
import * as path from 'node:path';

import { getConfig } from '../domain/Config.js';
import { Grounding } from '../domain/Grounding.js';

import { Logger } from '../Logger.js';

export class VisualGrounding extends Grounding {
    public async initialize(): Promise<void> {
        const SoMScript = fs.readFileSync('lib/SoM/dist/SoM.min.js', 'utf8');
        await this.page.addScriptTag({
            content: `(function() { ${SoMScript} })()`,
        });
    }

    public async getScreenshot(): Promise<string> {
        try {
            const isDefined = await this.page.evaluate(
                'typeof window.SoM !== "undefined"'
            );
            if (!isDefined) {
                await this.initialize();
            }

            await this.page.evaluate('window.SoM.display()');

            const config = getConfig();
            const imgPath = path.join(
                config.browser.screenshotsDir,
                `${new Date().toISOString()}.png`
            );
            await this.page.screenshot({
                path: imgPath,
            });

            // Workaround to make sure image is valid (buffer-only ends up being invalid in some cases)
            let img = fs.readFileSync(imgPath);
            return `data:image/png;base64,${img.toString('base64')}`;
        } catch (e) {
            Logger.error(`Failed to take screenshot: ${e}`);
            return '';
        }
    }

    public resolve(id: number): Promise<ElementHandle | null> {
        Logger.debug(`Resolving SoM ${id}`);
        return this.page.$(`[data-SoM="${id}"]`);
    }
}
