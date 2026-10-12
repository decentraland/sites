/** Decompresses a gzip Blob with the browser's built-in DecompressionStream. */
const gunzipBlob = async (blob: Blob): Promise<Blob> => new Response(blob.stream().pipeThrough(new DecompressionStream('gzip'))).blob()

export { gunzipBlob }
