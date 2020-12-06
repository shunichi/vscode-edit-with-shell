import * as vscode from 'vscode';
import {EXTENSION_NAME} from '../const';
import {ShellCommandService} from '../shell-command-service';
import {HistoryStore} from '../history-store';
import {Workspace} from '../adapters/workspace';
import {Editor} from '../adapters/editor';
import {ExtensionCommand} from './extension-command';

export abstract class RunCommand implements ExtensionCommand {
    constructor(private readonly shellCommandService: ShellCommandService,
                private readonly historyStore: HistoryStore,
                private readonly workspaceAdapter: Workspace,
                private readonly clipboard: typeof vscode.env.clipboard | null) {}

    protected abstract getCommandText(): Promise<string|undefined>;

    async execute(wrappedEditor: Editor) {
        const command = await this.getCommandText();
        if (!command) return;

        this.historyStore.add(command);

        if (this.shouldPassEntireText(wrappedEditor)) {
            await this.processEntireText(command, wrappedEditor);
        } else {
            await this.processSelectedTexts(command, wrappedEditor);
        }
    }

    private async processSelectedTexts(command: string, wrappedEditor: Editor): Promise<void> {
        const filePath = wrappedEditor.filePath;
        const promiseOfCommandOutputs = wrappedEditor.selectedTexts
            .map(input => this.shellCommandService.runCommand({command, input, filePath}));
        const commandOutputs = await Promise.all(promiseOfCommandOutputs);
        if (this.clipboard) {
            await this.clipboard.writeText(commandOutputs.join('\n'));
        } else {
            await wrappedEditor.replaceSelectedTextsWith(commandOutputs);
        }
    }

    private async processEntireText(command: string, wrappedEditor: Editor): Promise<void> {
        const commandOutput = await this.shellCommandService.runCommand({
            command,
            input: wrappedEditor.entireText,
            filePath: wrappedEditor.filePath
        });
        if (this.clipboard) {
            await this.clipboard.writeText(commandOutput);
        } else {
            await wrappedEditor.replaceEntireTextWith(commandOutput);
        }
    }

    private shouldPassEntireText(wrappedEditor: Editor): boolean {
        const processEntireText = this.workspaceAdapter.getConfig<boolean>(`${EXTENSION_NAME}.processEntireTextIfNoneSelected`);
        return !wrappedEditor.isTextSelected && processEntireText;
    }
}
