import { App, PluginSettingTab, Setting } from 'obsidian';
import AutoPushSyncPlugin from '../main';

export class AutoPushSyncSettingTab extends PluginSettingTab {
	plugin: AutoPushSyncPlugin;

	constructor(app: App, plugin: AutoPushSyncPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// --- 동기화 서버 설정 ---
		containerEl.createEl('h2', { text: '동기화 서버 설정' });

		const serverSection = containerEl.createDiv({ cls: 'setting-indent' });
		new Setting(serverSection)
			.setName('서버 주소')
			.setDesc('예: http://localhost:5035')
			.addText(text => text
				.setPlaceholder('http://localhost:5035')
				.setValue(this.plugin.settings.serverUrl)
				.onChange(async (value) => {
					this.plugin.settings.serverUrl = value;
					await this.plugin.saveSettings();
				}));

		new Setting(serverSection)
			.setName('동기화 엔드포인트')
			.setDesc('예: /v1/post/sync')
			.addText(text => text
				.setPlaceholder('/v1/post/sync')
				.setValue(this.plugin.settings.syncEndpoint)
				.onChange(async (value) => {
					this.plugin.settings.syncEndpoint = value;
					await this.plugin.saveSettings();
				}));

		new Setting(serverSection)
			.setName('Sync Password')
			.setDesc('서버 인증용 비밀번호(시크릿 키)를 입력하세요.')
			.addText(text => text
				.setPlaceholder('Enter your sync password')
				.setValue(this.plugin.settings.syncPassword)
				.onChange(async (value) => {
					this.plugin.settings.syncPassword = value;
					await this.plugin.saveSettings();
				}));

		// --- 자동 동기화 ---
		containerEl.createEl('h2', { text: '자동 동기화' });

		const autoSyncSection = containerEl.createDiv({ cls: 'setting-indent' });
		new Setting(autoSyncSection)
			.setName('파일 수정 시 자동 동기화')
			.setDesc('파일을 수정(저장)하면 자동으로 서버에 전송합니다.')
			.addToggle(toggle =>
				toggle
					.setValue(this.plugin.settings.autoSyncOnModify)
					.onChange(async (value) => {
						this.plugin.settings.autoSyncOnModify = value;
						await this.plugin.saveSettings();
						this.display();
					})
			);

		// --- 동기화 예외 ---
		containerEl.createEl('h2', { text: '동기화 예외' });

		const excludeSection = containerEl.createDiv({ cls: 'setting-indent' });
		new Setting(excludeSection)
			.setName('동기화 예외 파일/폴더')
			.setDesc('쉼표(,)로 구분하여 입력. 예: templates/**, *.bak, assets/*.png')
			.addTextArea(text => text
				.setPlaceholder('예: templates/**, *.bak, assets/*.png')
				.setValue((this.plugin.settings.excludePatterns ?? []).join(', '))
				.onChange(async (value) => {
					this.plugin.settings.excludePatterns = value
						.split(',')
						.map(s => s.trim())
						.filter(Boolean);
					await this.plugin.saveSettings();
				})
			);

		// --- 파일 설정 ---
		containerEl.createEl('h2', { text: '파일 설정' });

		// 식별자 설정 그룹
		const idSection = containerEl.createDiv({ cls: 'setting-indent' });
		idSection.createEl('h3', { text: '식별자 설정' });

		new Setting(idSection)
			.setName('파일 고유 식별자 사용')
			.setDesc('각 파일에 고유한 식별자를 자동으로 부여합니다. 이 식별자는 파일을 서버와 동기화할 때 파일을 구분하는 데 사용됩니다.\n' +
				'식별자는 frontmatter에 지정한 필드명으로 저장되며, 이미 식별자가 있으면 덮어쓰지 않습니다.')
			.addToggle(toggle =>
				toggle
					.setValue(this.plugin.settings.enableFileId)
					.onChange(async (value) => {
						this.plugin.settings.enableFileId = value;
						await this.plugin.saveSettings();
						this.display();
					})
			);

		if (this.plugin.settings.enableFileId) {
			const indentDiv = idSection.createDiv({ cls: 'setting-indent' });
			new Setting(indentDiv)
				.setName('파일 고유 식별자 필드명')
				.setDesc('frontmatter에 저장할 식별자 필드명')
				.addText(text =>
					text
						.setPlaceholder('fileId')
						.setValue(this.plugin.settings.fileIdFieldName)
						.onChange(async (value) => {
							this.plugin.settings.fileIdFieldName = value;
							await this.plugin.saveSettings();
						})
				);
		}

		// 본문 내용 설정 그룹
		const contentSection = containerEl.createDiv({ cls: 'setting-indent' });
		contentSection.createEl('h3', { text: '본문 내용 설정' });

		// 파일 본문 전송 토글
		new Setting(contentSection)
			.setName('파일 본문 전송')
			.setDesc('서버로 파일의 본문 내용을 전송할지 여부를 설정합니다.')
			.addToggle(toggle =>
				toggle
					.setValue(this.plugin.settings.sendFileContent)
					.onChange(async (value) => {
						this.plugin.settings.sendFileContent = value;
						await this.plugin.saveSettings();
						this.display(); // 토글 시 아래 설정 동적 렌더링
					})
			);

		// 파일 본문 전송이 켜져 있을 때만 아래 설정 표시 (한 번 더 인덴트)
		if (this.plugin.settings.sendFileContent) {
			const contentIndent = contentSection.createDiv({ cls: 'setting-indent' });

			new Setting(contentIndent)
				.setName('본문 내용 필드명')
				.setDesc('본문 내용을 저장할 필드명')
				.addText(text =>
					text
						.setPlaceholder('content')
						.setValue(this.plugin.settings.contentFieldName)
						.onChange(async (value) => {
							this.plugin.settings.contentFieldName = value;
							await this.plugin.saveSettings();
						})
				);

			new Setting(contentIndent)
				.setName('본문에 frontmatter 포함')
				.setDesc('본문(content) 필드에 frontmatter(--- ... ---)를 포함할지 여부를 설정합니다.')
				.addToggle(toggle =>
					toggle
						.setValue(this.plugin.settings.includeFrontMatterInContent)
						.onChange(async (value) => {
							this.plugin.settings.includeFrontMatterInContent = value;
							await this.plugin.saveSettings();
						})
				);
		}
	}
}
