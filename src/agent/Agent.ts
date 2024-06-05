import { OpenAIService } from '../services/OpenAI.service.js';
import { PlaywrightService } from '../services/Playwright.service.js';
import { Service } from '../domain/Service.js';
import { Runner } from './runner/Runner.js';
import { Logger } from '../Logger.js';

export class Agent extends Service {
    private openai!: OpenAIService;
    private pw!: PlaywrightService;

    constructor() {
        super('agent');
    }

    async initialize() {
        Logger.debug('Initializing agent');

        this.openai = new OpenAIService();
        this.pw = new PlaywrightService();

        await Promise.all([this.openai.initialize(), this.pw.initialize()]);

        Logger.debug('Agent initialized');
    }

    async destroy() {
        Logger.debug('Destroying agent');

        await Promise.all([this.openai.destroy(), this.pw.destroy()]);

        Logger.debug('Agent destroyed');
    }

    async spawn_task(target: string, task: string) {
        Logger.debug('Running agent');

        const page = await this.pw.make_page(target);

        const runner = new Runner(this, page, this.openai, this.pw, task);

        await runner.initialize();

        return runner.launch();
    }
}
