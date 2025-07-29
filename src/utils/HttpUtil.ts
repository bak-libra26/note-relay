// utils/HttpUtil.ts

import { AUTH_TYPE, AuthType } from "../constants";

/**
 * Interface for HTTP authentication options.
 */
export interface AuthOptions {
	auth_type: AuthType;
	basic_username?: string;
	basic_password?: string;
	auth_token?: string;
}

/**
 * HttpUtil provides static utility methods for HTTP operations such as
 * authentication header creation, relay URL building, file upload, etc.
 */
export class HttpUtil {
	/**
	 * Returns HTTP headers for authentication based on the provided options.
	 * @param options - Authentication options.
	 * @returns A record of HTTP headers.
	 */
	static getHeaders(options: AuthOptions): Record<string, string> {
		switch (options.auth_type) {
			case AUTH_TYPE.BASIC:
				return HttpUtil.getBasicAuthHeaders(options);
			case AUTH_TYPE.TOKEN:
				return HttpUtil.getTokenAuthHeaders(options);
			case AUTH_TYPE.NONE:
			default:
				return {};
		}
	}

	/**
	 * Returns HTTP headers for Basic authentication.
	 * @param options - Authentication options.
	 * @returns A record of HTTP headers.
	 */
	private static getBasicAuthHeaders(options: AuthOptions): Record<string, string> {
		const { basic_username, basic_password } = options;
		if (basic_username && basic_password) {
			const encoded = btoa(`${basic_username}:${basic_password}`);
			return { Authorization: `Basic ${encoded}` };
		}
		return {};
	}

	/**
	 * Returns HTTP headers for Token authentication.
	 * @param options - Authentication options.
	 * @returns A record of HTTP headers.
	 */
	private static getTokenAuthHeaders(options: AuthOptions): Record<string, string> {
		const { auth_token } = options;
		if (auth_token) {
			return { Authorization: `Bearer ${auth_token}` };
		}
		return {};
	}

	/**
	 * Builds a relay URL for file upload, ensuring proper formatting.
	 * @param serverUrl - The base server URL.
	 * @param syncEndpoint - The sync endpoint path.
	 * @param fileId - The file identifier to append.
	 * @returns The full relay URL.
	 */
	static buildRelayUrl(serverUrl: string, syncEndpoint: string, fileId: string): string {
		const url = serverUrl.replace(/\/$/, "");
		let endpoint = syncEndpoint.startsWith("/") ? syncEndpoint : "/" + syncEndpoint;
		if (!endpoint.endsWith("/")) endpoint += "/";
		return url + endpoint + encodeURIComponent(fileId);
	}

	/**
	 * Creates a FormData object for file upload.
	 * @param fileArrayBuffer - The file content as an ArrayBuffer.
	 * @param fileName - The name of the file.
	 * @returns A FormData object containing the file.
	 */
	static createFileFormData(fileArrayBuffer: ArrayBuffer, fileName: string): FormData {
		const formData = new FormData();
		const fileBlob = new Blob([fileArrayBuffer], { type: "text/markdown" });
		formData.append("note", fileBlob, fileName);
		return formData;
	}

	/**
	 * Uploads a file to the specified URL using a POST request.
	 * @param url - The upload URL.
	 * @param formData - The FormData object containing the file.
	 * @param headers - Additional HTTP headers.
	 * @returns The fetch Response object.
	 */
	static async uploadFile(
		url: string,
		formData: FormData,
		headers: Record<string, string>
	): Promise<Response> {
		return fetch(url, {
			method: "POST",
			headers,
			body: formData,
		});
	}
}
