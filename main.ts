import { App, Plugin, PluginSettingTab, Setting, Notice } from 'obsidian';

interface AutoPushSyncSettings {
	serverUrl: string;
	syncPassword: string; // apiKey → syncPassword로 변경
	autoSync: boolean;
	syncInterval: number;
}

const DEFAULT_SETTINGS: AutoPushSyncSettings = {
	serverUrl: '',
	syncPassword: '',
	autoSync: true,
	syncInterval: 10,
};


export default class AutoPushSyncPlugin extends Plugin {
	settings: AutoPushSyncSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new AutoPushSyncSettingTab(this.app, this));

		// 플러그인 활성화 시 동기화 타이머 등록
		if (this.settings.autoSync) {
			this.registerInterval(
				window.setInterval(() => {
					this.syncWithServer();
				}, this.settings.syncInterval * 60 * 1000)
			);
		}
	}

	async syncWithServer() {
		new Notice('동기화 테스트: syncWithServer()가 실행되었습니다!');
		// 실제 동기화 로직 대신 알림만 띄움
	}


	onunload() {}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class AutoPushSyncSettingTab extends PluginSettingTab {
	plugin: AutoPushSyncPlugin;

	constructor(app: App, plugin: AutoPushSyncPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('Server URL')
			.setDesc('Enter the URL of your remote sync backend server.')
			.addText(text => text
				.setPlaceholder('https://your-server.com/api')
				.setValue(this.plugin.settings.serverUrl)
				.onChange(async (value) => {
					this.plugin.settings.serverUrl = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Sync Password')
			.setDesc('Enter a password to authenticate with your sync server. This acts as your secret key for secure synchronization.')
			.addText(text => text
				.setPlaceholder('Enter your sync password')
				.setValue(this.plugin.settings.syncPassword)
				.onChange(async (value) => {
					this.plugin.settings.syncPassword = value;
					await this.plugin.saveSettings();
				}));


		new Setting(containerEl)
			.setName('Sync Interval (minutes)')
			.setDesc('Set how often to sync automatically (in minutes).')
			.addText(text => text
				.setPlaceholder('10')
				.setValue(this.plugin.settings.syncInterval.toString())
				.onChange(async (value) => {
					const num = Number(value);
					if (!isNaN(num) && num > 0) {
						this.plugin.settings.syncInterval = num;
						await this.plugin.saveSettings();
					}
				}));
	}
}
