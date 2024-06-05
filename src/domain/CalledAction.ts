import ActionType from "./ActionType.js";
import CalledActionStatus from "./CalledActionStatus.js";

export type CalledAction = {
    type: ActionType
    description: string
    arguments: Record<string, string | number | boolean>
    status?: CalledActionStatus
}