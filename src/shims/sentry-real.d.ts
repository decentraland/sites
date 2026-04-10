/* eslint-disable import/group-exports */
/* eslint-disable @typescript-eslint/no-explicit-any */
export declare function captureException(exception: any, hint?: any): void
export declare function captureMessage(message: string, level?: any): void
export declare function init(options?: any): void
export declare function setUser(user: any): void
export declare function setTag(key: string, value: string): void
export declare function setExtra(key: string, extra: any): void
export declare function addBreadcrumb(breadcrumb: any): void
export declare function withScope(callback: (scope: any) => void): void
