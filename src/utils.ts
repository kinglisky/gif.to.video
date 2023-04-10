export async function fetchArrayBuffer(url: string) {
    const response = await fetch(url);
    return await response.arrayBuffer();
}
