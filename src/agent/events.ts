import { OpenAIService } from '../services/openai.service'
import { PlaywrightService } from '../services/playwright.service'

import { EventEmitter } from 'node:events'
import {
    FunctionToolCallFunction,
    RequiredActionFunctionToolCall,
    Run,
    RunStreamEvent,
    ToolOutput,
} from '../domain/openai'

export class RunStreamHandler extends EventEmitter {
    private readonly client: OpenAIService
    private readonly pw: PlaywrightService
    private readonly pageId: number

    public runId!: string

    private _done = false
    private _failed = false

    constructor(client: OpenAIService, pw: PlaywrightService, pageId: number) {
        super()
        this.client = client
        this.pw = pw
        this.pageId = pageId

        this.on('event', this.onEvent.bind(this))
    }

    public get done() {
        return this._done
    }
    public get failed() {
        return this._failed
    }

    async onEvent(event: RunStreamEvent) {
        try {
            this.runId = event.data.id
            switch (event.event) {
                case 'thread.run.requires_action':
                    await this.handle_actions(event.data.thread_id, event.data.id, event.data)
                    break
                case 'thread.run.failed':
                case 'thread.run.cancelled':
                    this.client.error({
                        run_id: event.data.id,
                        error: event.data.last_error,
                        incomplete_details: event.data.incomplete_details,
                    }, 'Run failed')
                    this.emit('failed', event.data)
                    this._done = true
                    this._failed = true
                    break
                case 'thread.run.completed':
                    this.client.debug({
                        run_id: event.data.id,
                    }, 'Run completed')
                    this.emit('completed', event.data)
                    this._done = true
                    break
            }
        } catch (error) {
            this.client.error({
                error: error,
                event: event,
            }, 'Error handling event')
        }
    }

    async handle_actions(threadId: string, runId: string, run: Run) {
        try {
            if (!run.required_action) {
                this.client.warn({
                    run: run,
                }, 'No required action')
                return
            }

            const outputs: ToolOutput[] =
                await Promise.all(
                    run.required_action.submit_tool_outputs.tool_calls
                        .map((tool_call: RequiredActionFunctionToolCall): Promise<ToolOutput> | ToolOutput => {
                            this.client.debug({
                                tool_call: tool_call,
                            }, 'Handling tool call')
                            switch (tool_call.function.name) {
                                case 'click':
                                    return this.handle_click(tool_call.id, tool_call.function)
                                case 'type':
                                    return this.handle_input(tool_call.id, tool_call.function)
                                default:
                                    this.client.error({
                                        run: run,
                                        tool_call: tool_call,
                                    }, 'Unknown function called')
                                    return {
                                        tool_call_id: tool_call.id,
                                        output: 'Unknown function called.',
                                    }
                            }
                        }),
                )

            await this.submit_outputs(threadId, runId, outputs)
        } catch (error) {
            this.client.error({
                error: error,
                run: run,
            }, 'Error processing actions')
        }
    }

    async submit_outputs(threadId: string, runId: string, outputs: ToolOutput[]) {
        try {
            const stream = await this.client.submit_tool_outputs(threadId, runId, outputs)

            for await (const event of stream) {
                this.emit('event', event)
            }
        } catch (error) {
            this.client.error({
                error: error,
                threadId: threadId,
                runId: runId,
                outputs: outputs,
            }, 'Error submitting tool outputs')
        }
    }

    async handle_click(id: string, func: FunctionToolCallFunction): Promise<ToolOutput> {
        const args = JSON.parse(func.arguments)

        const element = await this.pw.resolve_element(
            this.pageId,
            args.role,
            args.element,
        )

        if (element.isSome()) {
            await element.unwrap().click()
            this.client.debug({
                tool_call_id: id,
                arguments: args,
                output: 'Element clicked.',
            }, 'Element clicked')
        } else {
            this.client.debug({
                tool_call_id: id,
                arguments: args,
                output: 'The element could not be found.',
            }, 'Element not found')
        }

        return {
            tool_call_id: id,
            output: element.isNone() ? 'The element could not be found.' : 'The element was successfully clicked.',
        }
    }

    async handle_input(id: string, func: FunctionToolCallFunction): Promise<ToolOutput> {
        const args = JSON.parse(func.arguments)

        const element = await this.pw.resolve_element(
            this.pageId,
            'input',
            args.element,
        )

        if (element.isSome()) {
            await element.unwrap().fill(args.text)
            this.client.debug({
                tool_call_id: id,
                arguments: args,
                output: 'Text inputted.',
            }, 'Text inputted')
        } else {
            this.client.debug({
                tool_call_id: id,
                arguments: args,
                output: 'The element could not be found.',
            }, 'Element not found')
        }

        return {
            tool_call_id: id,
            output: element.isNone() ? 'The element could not be found.' : 'Text inputted.',
        }
    }
}