// AutoPushSyncPlugin.ts

import { Plugin, TFile, Notice } from "obsidian";
import { v4 as uuidv4 } from "uuid";
import { AutoPushSyncSettingTab } from "./settings/settingTab";
import { AutoPushSyncSettings, DEFAULT_SETTINGS } from "./types";
import { minimatch } from "minimatch";

export default class AutoPushSyncPlugin extends Plugin {
	settings: AutoPushSyncSettings;

	async onload(): Promise<void> {
		await this.loadSettings();
		this.addSettingTab(new AutoPushSyncSettingTab(this.app, this));

		this.addCommand({
			id: "sync-file-uuid",
			name: "파일 식별자(UUID) 서버와 동기화 및 출력",
			callback: this.handleSyncFileUuid,
			hotkeys: [{ modifiers: ["Mod", "Shift"], key: "U" }],
		});
	}

	private isExcludedByGlob(file: TFile): boolean {
		const patterns = this.settings.exclude_patterns ?? [];
		return patterns.some(pattern => minimatch(file.path, pattern));
	}

	private handleSyncFileUuid = async (): Promise<void> => {
		const file = this.app.workspace.getActiveFile();
		if (!file) {
			new Notice("현재 열려 있는 파일이 없습니다.");
			return;
		}

		// === glob 예외 적용 ===
		if (this.isExcludedByGlob(file)) {
			new Notice("이 파일은 동기화 예외 패턴에 포함되어 전송되지 않습니다.");
			return;
		}

		const {
			enable_file_id,
			file_id_field_name,
			file_name_field_name,
			file_content_field_name,
			server_url,
			sync_endpoint,
			sync_password,
			include_front_matter_in_content,
			send_file_content,
			auth_type,
			basic_username,
			basic_password,
			auth_token
		} = this.settings;

		if (!enable_file_id || !file_id_field_name) {
			new Notice("파일 식별자 기능이 비활성화되어 있습니다.");
			return;
		}

		// 1. 파일에서 식별자 조회(없으면 uuid 생성 및 추가)
		let fileId = await this.getOrCreateFileId(file, file_id_field_name);

		// Obsidian API로 frontmatter 읽기
		const fileCache = this.app.metadataCache.getFileCache(file);
		const frontmatter = fileCache?.frontmatter || {};

		// 본문 추출 (frontmatter 영역 제외)
		const content = await this.app.vault.read(file);
		let body = content;

		if (include_front_matter_in_content) {
			body = content;
		} else {
			// 캐시 방식 우선, 실패 시 정규식 백업
			const fileCache = this.app.metadataCache.getFileCache(file);
			if (fileCache?.frontmatterPosition) {
				const end = fileCache.frontmatterPosition.end.offset;
				let bodyStart = end;
				if (content[end] === '\n') bodyStart = end + 1;
				body = content.substring(bodyStart).trim();
			} else {
				body = content.replace(/^---\n[\s\S]*?\n---\n?/, '').trim();
			}
		}

		// 절대 경로 구하기 (데스크탑 환경 한정)
		let file_absolute_path: string | undefined = undefined;
		try {
			const vaultPath = (this.app.vault.adapter as any).basePath as string;
			file_absolute_path = require('path').join(vaultPath, file.path);
		} catch (e) {
			// 모바일/웹 등에서는 지원 안 됨
			file_absolute_path = undefined;
		}

		const jsonObj: Record<string, any> = {
			[file_id_field_name]: fileId,
			'file_absolute_path': file_absolute_path,
			[file_name_field_name]: file.name,
			[file_content_field_name]: body,
			...(frontmatter || {}),
			metadata: {
				'file_id_field_name': file_id_field_name,
				'file_name_field_name': file_name_field_name,
				'file_content_field_name': file_content_field_name,
				'include_front_matter_in_content': include_front_matter_in_content,
				'send_file_content': send_file_content
			}
		};

		console.log(JSON.stringify(jsonObj));

		let finalId = fileId;
		if (server_url && sync_endpoint) {
			let url = server_url.endsWith("/") ? server_url.slice(0, -1) : server_url;
			url += sync_endpoint.startsWith("/") ? sync_endpoint : "/" + sync_endpoint;

			// 인증 헤더 구성
			const headers: Record<string, string> = { "Content-Type": "application/json" };
			if (auth_type === "basic" && basic_username && basic_password) {
				const encoded = btoa(`${basic_username}:${basic_password}`);
				headers["Authorization"] = `Basic ${encoded}`;
			} else if (auth_type === "token" && auth_token) {
				headers["Authorization"] = `Bearer ${auth_token}`;
			}

			try {
				const response = await fetch(url, {
					method: "POST",
					headers,
					body: JSON.stringify(jsonObj),
				});

				console.log(`response :${response}`);
				if (response.ok) {
					const respData = await response.json();
					if (respData && respData[file_id_field_name]) {
						finalId = respData[file_id_field_name];
						// 서버에서 받은 식별키가 다르면 파일에 반영
						if (finalId !== fileId) {
							await this.setFileId(file, file_id_field_name, finalId);
							new Notice(`서버에서 받은 식별키(${finalId})를 파일에 저장했습니다.`);
						} else {
							new Notice(`파일 식별자(UUID): ${finalId}`);
						}
					} else {
						new Notice(`파일 식별자(UUID): ${finalId} (서버 응답에 식별키 없음, 생성한 값 사용)`);
					}
				} else {
					new Notice(`서버 응답 오류: ${response.status} (생성한 식별키 사용)`);
				}
			} catch (err) {
				console.error(err);
				new Notice("서버 요청 중 오류가 발생했습니다. (생성한 식별키 사용)");
			}
		} else {
			new Notice(`파일 식별자(UUID): ${finalId}`);
		}
		console.log(`[AutoPushSyncPlugin] ${file.path}의 식별자: ${finalId}`);
	};

	private async getOrCreateFileId(file: TFile, fieldName: string): Promise<string> {
		const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
		if (frontmatter && frontmatter[fieldName]) {
			return frontmatter[fieldName];
		}
		const fileId = uuidv4();
		await this.setFileId(file, fieldName, fileId);
		return fileId;
	}

	private async setFileId(file: TFile, fieldName: string, value: string): Promise<void> {
		const content = await this.app.vault.read(file);
		const fmRegex = /^---\n([\s\S]*?)\n---\n?/;
		const match = content.match(fmRegex);

		let newFm: string;
		if (match) {
			const fmLines = match[1]
				.split('\n')
				.filter(line => !line.startsWith(fieldName + ':'));
			fmLines.push(`${fieldName}: ${value}`);
			newFm = `---\n${fmLines.join('\n')}\n---\n`;
			const newContent = content.replace(fmRegex, newFm);
			await this.app.vault.modify(file, newContent);
		} else {
			newFm = `---\n${fieldName}: ${value}\n---\n`;
			await this.app.vault.modify(file, newFm + content);
		}
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
