/**
 * Extracts YouTube video ID from a URL or returns the value if it is already a valid ID.
 * Supported URL formats:
 * - youtube.com/watch?v=VIDEO_ID
 * - youtu.be/VIDEO_ID
 * - youtube.com/embed/VIDEO_ID
 * Also accepts a plain 11-character video ID.
 * @param {string} input - URL or video ID
 * @returns {{ videoId: string | null, error: string | null }}
 */
export function extractYoutubeVideoId(input) {
    const trimmed = typeof input === 'string' ? input.trim() : '';
    if (!trimmed) {
        return { videoId: null, error: 'Video link or URL is required.' };
    }

    const idPattern = /^[a-zA-Z0-9_-]{11}$/;
    if (idPattern.test(trimmed)) {
        return { videoId: trimmed, error: null };
    }

    const watchMatch = trimmed.match(/(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/);
    if (watchMatch) {
        return { videoId: watchMatch[1], error: null };
    }

    const shortMatch = trimmed.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (shortMatch) {
        return { videoId: shortMatch[1], error: null };
    }

    const embedMatch = trimmed.match(/(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (embedMatch) {
        return { videoId: embedMatch[1], error: null };
    }

    if (/youtube\.com|youtu\.be/i.test(trimmed)) {
        return { videoId: null, error: 'Could not find a valid video ID in this YouTube URL.' };
    }

    return { videoId: null, error: 'Please enter a valid YouTube URL or 11-character video ID.' };
}
