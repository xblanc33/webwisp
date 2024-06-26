import Action from '../domain/Action.js';
import ActionType from '../domain/ActionType.js';
import CalledAction from '../domain/CalledAction.js';
import { getConfig } from '../domain/Config.js';

const RAW_ACTION_REGEX = /~~~([^]*)~~~/;

export default class CompletionParser {
    public static parseCompletion(completion: string): Completion {
        const rawAction = completion.match(RAW_ACTION_REGEX);
        if (!rawAction) {
            throw new CompletionFormatError('No action found in completion');
        }

        const action = this.parseAction(rawAction[1].trim());

        const reasoning = completion
            .split('## Action ##')
            .at(1)
            ?.split('~~~')
            .at(0)
            ?.trim();
        if (reasoning) {
            return {
                reasoning,
                action,
            };
        }

        return {
            action,
        };
    }

    private static parseAction(action: string): CalledAction {
        const lines = action.split('\n');

        if (lines.length !== 2) {
            throw new CompletionFormatError(
                'Invalid action format (not 2 lines long)'
            );
        }

        const description = lines[0].trim();
        if (
            !description ||
            !description.startsWith('$ ') ||
            description.length < 3
        ) {
            throw new CompletionFormatError(
                'Invalid action format (description not found or with invalid format)'
            );
        }

        const actionLine = lines[1].trim();
        if (!actionLine) {
            throw new CompletionFormatError(
                'Invalid action format (action line not found)'
            );
        }

        // TODO: Check if the action is valid
        const actionType = actionLine.split(' ')[0] as ActionType;
        const actionInfo = getConfig().actions[actionType];
        if (!actionInfo) {
            throw new CompletionFormatError(
                `Action ${actionType} not found in config`
            );
        }

        const args = actionLine.substring(actionType.length).trim();
        const parsedArgs = this.parseArgs(args, actionType, actionInfo);

        return {
            type: actionType,
            description,
            arguments: parsedArgs,
        };
    }

    private static parseArgs(
        args: string,
        actionType: ActionType,
        actionInfo: Action
    ): Record<string, string | number | boolean> {
        const parsedArgs: Record<string, string | number | boolean> = {};

        if (!actionInfo.arguments) {
            return parsedArgs;
        }

        let cursor = 0,
            count = 0,
            buf = '';

        const state = {
            string: {
                inside: false,
                char: '',
            },
        };

        while (cursor < args.length) {
            const char = args[cursor];

            if (char === ' ') {
                if (state.string.inside) {
                    buf += char;
                    cursor++;
                    continue;
                }

                const currentArg = actionInfo.arguments[count];

                switch (currentArg.type) {
                    case 'string':
                        if (currentArg.enum && !currentArg.enum.includes(buf)) {
                            throw new CompletionFormatError(
                                `Invalid enum value for argument ${currentArg.name}: ${buf}`
                            );
                        }
                        parsedArgs[currentArg.name] = buf;
                        break;
                    case 'number':
                        const parsedNumber = parseInt(buf);
                        if (isNaN(parsedNumber)) {
                            throw new CompletionFormatError(
                                `Invalid number format for argument ${currentArg.name}: ${buf}`
                            );
                        }
                        parsedArgs[currentArg.name] = parsedNumber;
                        break;
                    case 'boolean':
                        if (buf === 'true' || buf === '1') {
                            parsedArgs[currentArg.name] = true;
                        } else if (buf === 'false' || buf === '0') {
                            parsedArgs[currentArg.name] = false;
                        } else {
                            throw new CompletionFormatError(
                                `Invalid boolean format for argument ${currentArg.name}: ${buf}`
                            );
                        }
                        break;
                }
                buf = '';
                count++;

                if (count > actionInfo.arguments.length) {
                    throw new CompletionFormatError(
                        `Too many arguments for action ${actionType}`
                    );
                }

                cursor++;
                continue;
            }

            if (char === '"' || char === "'") {
                if (state.string.inside && state.string.char === char) {
                    state.string.inside = false;
                } else {
                    state.string.inside = true;
                    state.string.char = char;
                }
                cursor++;
                continue;
            }

            if (char === '\\') {
                if (state.string.inside) {
                    buf += args[++cursor];
                } else {
                    throw new CompletionFormatError(
                        'Invalid escape character outside of string'
                    );
                }
                cursor++;
                continue;
            }

            buf += char;
            cursor++;
        }

        // See if we're missing any required arguments
        const requiredArgs = actionInfo.arguments.filter((arg) => arg.required);
        if (requiredArgs.length > count) {
            throw new CompletionFormatError(
                `Missing required arguments for action ${actionType}`
            );
        }

        return parsedArgs;
    }
}

export type Completion = {
    reasoning?: string;
    action: CalledAction;
};

export class CompletionFormatError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'CompletionFormatError';
    }
}
