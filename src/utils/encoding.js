export function decodeJsonPayload(payload) {
    const binary = atob(payload);
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));

    return JSON.parse(new TextDecoder().decode(bytes));
}
