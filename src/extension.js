const vscode = require('vscode');

function activate(context) {
	let controller = new InlineSpaces();
	context.subscriptions.push(controller);
}
exports.activate = activate;

class InlineSpaces {

	constructor() {
		this.subscriptions = [];
		this.disposable    = vscode.Disposable;
		this.editor        = vscode.window.activeTextEditor;
		this.config        = {
			"regex"   : new RegExp('[^\t]\t'),
			"tabSize" : this.editor.options.tabSize || vscode.workspace.getConfiguration('editor').tabSize || 4
		};

		vscode.workspace.onDidSaveTextDocument(this.onDocumentSaved, this, this.subscriptions);
		vscode.workspace.onDidChangeConfiguration(this.init, this, this.subscriptions);

		let disposable = vscode.commands.registerCommand('extension.vscode-inline-spacify', () => { this.inlineSpacify() });
		this.subscriptions.push(disposable);
		this.disposable = vscode.Disposable.from.apply(this.disposable, this.subscriptions);

		this.init();
	}

	init() {}

	onDocumentSaved() {
		this.inlineSpacify();
	}

	inlineSpacify() {
		if (!vscode.window.activeTextEditor) {
			return;
		}

		const doc = vscode.window.activeTextEditor.document;

		if (doc.lineCount === 0){
			return;
		}

		this.editor.edit(editBuilder => {
			let line = vscode.TextLine;
			for(let i = 0; i < doc.lineCount; i++) {
				line = doc.lineAt(i);
				if (line.text.length === 0){
					continue;
				}

				if (line.text.match(this.config.regex)) {
					editBuilder.replace(
						new vscode.Range(
							new vscode.Position(line.lineNumber, 0),
							new vscode.Position(line.lineNumber, line.text.length)
						),
						this.fixLine(line.text)
					);
				};
			};

		}).then(() => doc.save());
	}

	dispose() {
		this.disposable.dispose();
	}

	fixLine(text) {
		let add = this.config.tabSize;

		text = text.replace(this.config.regex, (match) => {
			let index  = text.indexOf(match),
				tabs   = this.numberOfTabs(text),
				spaces = '';

			index = ( ( tabs * this.config.tabSize ) - tabs ) + index + 1

			for (let j = 0; j < this.config.tabSize; j++) {
				if ( ( index + j ) % this.config.tabSize == 0 ) {
					add = (0 === j) ? this.config.tabSize : j;
					break;
				}
			}

			for (let k = 0; k < add; k++) {
				spaces += ' ';
			}

			return match.replace(/\t/g, spaces);
		});

		if (text.match(this.config.regex)) {
			text = this.fixLine(text);
		}

		return text;
	}

	numberOfTabs(text) {
		let count = 0,
			index = 0;
		while (text.charAt(index++) === "\t") {
			count++;
		}
		return count;
	}
}