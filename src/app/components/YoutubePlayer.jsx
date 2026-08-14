'use client';

export default function YoutubePlayer({ videoId, title }) {
  if (!videoId) return null;

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        title={title || 'YouTube video'}
        className="absolute inset-0 h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
