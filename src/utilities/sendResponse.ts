export function systemResponse(
    success: boolean,
    message: string,
    data: any | undefined,
    errorCode: number | undefined,
) {
    if (success) {
        return { success: true, message, data: data || null };
    } else {
        return { success: false, message, errorCode: errorCode || 100 };
    }
}
