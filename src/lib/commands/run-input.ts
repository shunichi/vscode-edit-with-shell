import * as vscode from 'vscode';
import {ShellCommandService} from '../shell-command-service';
import {CommandReader} from '../command-reader';
import {HistoryStore} from '../history-store';
import {Workspace} from '../adapters/workspace';
import {RunCommand} from './run';

export class RunInputCommand extends RunCommand {
    constructor(shellCommandService: ShellCommandService,
                private readonly commandReader: CommandReader,
                historyStore: HistoryStore,
                workspaceAdapter: Workspace,
                clipboard: typeof vscode.env.clipboard | null) {
        super(shellCommandService, historyStore, workspaceAdapter, clipboard);
    }

    protected getCommandText(): Promise<string|undefined> {
        return this.commandReader.read();
    }
}
