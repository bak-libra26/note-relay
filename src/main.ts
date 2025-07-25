import { Plugin, TFile, Notice } from "obsidian";
import { v4 as uuidv4 } from "uuid";
import { AutoPushSyncSettingTab } from "./settings/settingTab";
import { AutoPushSyncSettings, DEFAULT_SETTINGS } from "./types";
import {minimatch} from "minimatch";

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
		const patterns = this.settings.excludePatterns ?? [];
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

		const { enableFileId, fileIdFieldName, contentFieldName: fileContentFieldName, serverUrl, syncEndpoint, syncPassword } = this.settings;
		if (!enableFileId || !fileIdFieldName) {
			new Notice("파일 식별자 기능이 비활성화되어 있습니다.");
			return;
		}

		// 1. 파일에서 식별자 조회(없으면 uuid 생성 및 추가)
		let fileId = await this.getOrCreateFileId(file, fileIdFieldName);

		// Obsidian API로 frontmatter 읽기
		const fileCache = this.app.metadataCache.getFileCache(file);
		const frontmatter = fileCache?.frontmatter || {};

		// 본문 추출 (frontmatter 영역 제외)
		const content = await this.app.vault.read(file);
		let body = content;

		if (this.settings.includeFrontMatterInContent) {
			body = content; // frontmatter 포함 전체 본문
		} else {
			const fileCache = this.app.metadataCache.getFileCache(file);
			if (fileCache?.frontmatterPosition) {
				const end = fileCache.frontmatterPosition.end.offset;
				body = content.substring(end).trim();
			} else {
				body = content;
			}
		}

		// 절대 경로 구하기 (데스크탑 환경 한정)
		let fileAbsolutePath: string | undefined = undefined;
		try {
			const vaultPath = (this.app.vault.adapter as any).basePath as string;
			fileAbsolutePath = require('path').join(vaultPath, file.path);
		} catch (e) {
			// 모바일/웹 등에서는 지원 안 됨
			fileAbsolutePath = undefined;
		}

		const jsonObj: Record<string, any> = {
			[fileIdFieldName]: fileId,
			'filePath': file.path,
			'fileAbsolutePath': fileAbsolutePath,
			'fileName': file.name,
			...(frontmatter || {}),
			metadata: {
				'fileIdFieldName': fileIdFieldName,
				'fileContentFieldName': fileContentFieldName,
				'includeFrontMatterInContent': this.settings.includeFrontMatterInContent,
				'sendFileContent': this.settings.sendFileContent
			}
		};

		console.log(JSON.stringify(jsonObj));

		let finalId = fileId;
		if (serverUrl && syncEndpoint) {
			let url = serverUrl.endsWith("/") ? serverUrl.slice(0, -1) : serverUrl;
			url += syncEndpoint.startsWith("/") ? syncEndpoint : "/" + syncEndpoint;

			try {
				const response = await fetch(url, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(jsonObj),
				});
				if (response.ok) {
					const respData = await response.json();
					if (respData && respData[fileIdFieldName]) {
						finalId = respData[fileIdFieldName];
						// 서버에서 받은 식별키가 다르면 파일에 반영
						if (finalId !== fileId) {
							await this.setFileId(file, fileIdFieldName, finalId);
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
