export type Action = {
    description: string;
    arguments?: {
        name: string;
        type: 'string' | 'number' | 'boolean';
        enum?: string[];
        required?: boolean;
    }[];
};

export default Action;
