import { ElementHandle, Page } from 'playwright';

export abstract class Grounding {
    constructor(protected readonly page: Page) {}

    async initialize(): Promise<void> {
        return Promise.resolve();
    }

    abstract resolve(...args: any[]): Promise<ElementHandle | null>;
}
