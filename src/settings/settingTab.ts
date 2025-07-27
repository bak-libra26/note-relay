// settings/settingTab.ts

import { App, PluginSettingTab, Setting } from 'obsidian';
import AutoPushSyncPlugin from '../main';

// 인증 방식 타입 정의
export type AuthType = "none" | "basic" | "token";

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
				.setValue(this.plugin.settings.server_url)
				.onChange(async (value) => {
					this.plugin.settings.server_url = value;
					await this.plugin.saveSettings();
				}));

		new Setting(serverSection)
			.setName('동기화 엔드포인트')
			.setDesc('예: /v1/post/sync')
			.addText(text => text
				.setPlaceholder('/v1/post/sync')
				.setValue(this.plugin.settings.sync_endpoint)
				.onChange(async (value) => {
					this.plugin.settings.sync_endpoint = value;
					await this.plugin.saveSettings();
				}));

		// --- 인증 방식 선택 ---
		new Setting(serverSection)
			.setName('인증 방식')
			.setDesc('서버 인증 방식을 선택하세요.')
			.addDropdown(dropdown => {
				dropdown
					.addOption('none', '없음')
					.addOption('basic', 'Basic 인증')
					.addOption('token', '인증 토큰')
					.setValue(this.plugin.settings.auth_type || 'none')
					.onChange(async (value: AuthType) => {
						this.plugin.settings.auth_type = value;
						await this.plugin.saveSettings();
						this.display(); // 인증 방식 변경 시 UI 갱신
					});
			});

		// 인증 방식에 따라 입력 필드 표시
		const authSection = serverSection.createDiv({ cls: 'setting-indent' });

		if (this.plugin.settings.auth_type === 'basic') {
			new Setting(authSection)
				.setName('Basic 아이디')
				.setDesc('Basic 인증에 사용할 아이디를 입력하세요.')
				.addText(text => text
					.setPlaceholder('아이디')
					.setValue(this.plugin.settings.basic_username || '')
					.onChange(async (value) => {
						this.plugin.settings.basic_username = value;
						await this.plugin.saveSettings();
					}));
			new Setting(authSection)
				.setName('Basic 비밀번호')
				.setDesc('Basic 인증에 사용할 비밀번호를 입력하세요.')
				.addText(text => text
					.setPlaceholder('비밀번호')
					.setValue(this.plugin.settings.basic_password || '')
					.onChange(async (value) => {
						this.plugin.settings.basic_password = value;
						await this.plugin.saveSettings();
					}));
		} else if (this.plugin.settings.auth_type === 'token') {
			new Setting(authSection)
				.setName('인증 토큰')
				.setDesc('서버 인증에 사용할 토큰 값을 입력하세요.')
				.addText(text => text
					.setPlaceholder('토큰 값')
					.setValue(this.plugin.settings.auth_token || '')
					.onChange(async (value) => {
						this.plugin.settings.auth_token = value;
						await this.plugin.saveSettings();
					}));
		}

		// --- 자동 동기화 ---
		containerEl.createEl('h2', { text: '자동 동기화' });

		const autoSyncSection = containerEl.createDiv({ cls: 'setting-indent' });
		new Setting(autoSyncSection)
			.setName('파일 수정 시 자동 동기화')
			.setDesc('파일을 수정(저장)하면 자동으로 서버에 전송합니다.')
			.addToggle(toggle =>
				toggle
					.setValue(this.plugin.settings.auto_sync_on_modify)
					.onChange(async (value) => {
						this.plugin.settings.auto_sync_on_modify = value;
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
				.setValue((this.plugin.settings.exclude_patterns ?? []).join(', '))
				.onChange(async (value) => {
					this.plugin.settings.exclude_patterns = value
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
					.setValue(this.plugin.settings.enable_file_id)
					.onChange(async (value) => {
						this.plugin.settings.enable_file_id = value;
						await this.plugin.saveSettings();
						this.display();
					})
			);

		if (this.plugin.settings.enable_file_id) {
			const indentDiv = idSection.createDiv({ cls: 'setting-indent' });
			new Setting(indentDiv)
				.setName('파일 고유 식별자 필드명')
				.setDesc('frontmatter에 저장할 식별자 필드명')
				.addText(text =>
					text
						.setPlaceholder('file_id')
						.setValue(this.plugin.settings.file_id_field_name)
						.onChange(async (value) => {
							this.plugin.settings.file_id_field_name = value;
							await this.plugin.saveSettings();
						})
				);
		}

		// 파일명 설정 그룹 추가
		const fileNameSection = containerEl.createDiv({ cls: 'setting-indent' });
		fileNameSection.createEl('h3', { text: '파일명 설정' });

		new Setting(fileNameSection)
			.setName('파일명 필드명')
			.setDesc('서버로 전송할 때 파일명을 저장할 필드명을 지정합니다.')
			.addText(text =>
				text
					.setPlaceholder('file_name')
					.setValue(this.plugin.settings.file_name_field_name || 'file_name')
					.onChange(async (value) => {
						this.plugin.settings.file_name_field_name = value;
						await this.plugin.saveSettings();
					})
			);

		// 본문 내용 설정 그룹
		const contentSection = containerEl.createDiv({ cls: 'setting-indent' });
		contentSection.createEl('h3', { text: '본문 내용 설정' });

		// 파일 본문 전송 토글
		new Setting(contentSection)
			.setName('파일 본문 전송')
			.setDesc('서버로 파일의 본문 내용을 전송할지 여부를 설정합니다.')
			.addToggle(toggle =>
				toggle
					.setValue(this.plugin.settings.send_file_content)
					.onChange(async (value) => {
						this.plugin.settings.send_file_content = value;
						await this.plugin.saveSettings();
						this.display(); // 토글 시 아래 설정 동적 렌더링
					})
			);

		// 파일 본문 전송이 켜져 있을 때만 아래 설정 표시 (한 번 더 인덴트)
		if (this.plugin.settings.send_file_content) {
			const contentIndent = contentSection.createDiv({ cls: 'setting-indent' });

			new Setting(contentIndent)
				.setName('본문 내용 필드명')
				.setDesc('본문 내용을 저장할 필드명')
				.addText(text =>
					text
						.setPlaceholder('content')
						.setValue(this.plugin.settings.file_content_field_name)
						.onChange(async (value) => {
							this.plugin.settings.file_content_field_name = value;
							await this.plugin.saveSettings();
						})
				);

			new Setting(contentIndent)
				.setName('본문에 frontmatter 포함')
				.setDesc('본문(content) 필드에 frontmatter(--- ... ---)를 포함할지 여부를 설정합니다.')
				.addToggle(toggle =>
					toggle
						.setValue(this.plugin.settings.include_front_matter_in_content)
						.onChange(async (value) => {
							this.plugin.settings.include_front_matter_in_content = value;
							await this.plugin.saveSettings();
						})
				);
		}
	}
}
