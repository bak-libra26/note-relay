// constants.ts
export const AUTH_TYPE = {
	NONE: "none",
	BASIC: "basic",
	TOKEN: "token"
} as const;

export type AuthType = typeof AUTH_TYPE[keyof typeof AUTH_TYPE];
