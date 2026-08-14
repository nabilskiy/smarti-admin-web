'use client';

import { useState } from 'react';
import { Edit2, MoreVertical, Play, Trash2 } from 'lucide-react';
import { extractYoutubeVideoId } from '@/app/utils/extractYoutubeVideoId';

export default function VideoCard({ video, viewMode = 'grid', onOpen, onEdit, onDelete }) {
  const [showMenu, setShowMenu] = useState(false);
  const { videoId } = extractYoutubeVideoId(video.id);
  const thumbnailUrl = videoId
    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    : '';

  return (
    <div
      onClick={() => onOpen(video)}
      className={`group relative cursor-pointer overflow-hidden rounded-xl border border-border bg-card transition-all duration-200 hover:border-primary hover:shadow-xl hover:shadow-primary/10 ${
        viewMode === 'list' ? 'flex h-auto flex-col sm:h-[280px] sm:flex-row' : ''
      }`}
    >
      <div
        className={`relative overflow-hidden bg-muted ${
          viewMode === 'list' ? 'h-52 w-full sm:h-full sm:w-[45%]' : 'aspect-video'
        }`}
      >
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={video.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Нет превью
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpen(video);
          }}
          className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/90 backdrop-blur-sm transition-transform hover:scale-110">
            <Play className="ml-1 h-8 w-8 fill-white text-white" />
          </div>
        </button>
      </div>

      <div className={`p-4 ${viewMode === 'list' ? 'flex w-full flex-col justify-center sm:w-[55%]' : ''}`}>
        <h3 className="mb-1 truncate text-foreground transition-colors group-hover:text-primary">
          {video.title}
        </h3>
        <p className="truncate text-sm text-muted-foreground">{video.id}</p>
      </div>

      <div className="absolute right-2 top-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="rounded-lg border border-border bg-background/90 p-2 backdrop-blur-sm transition-colors hover:bg-accent"
          >
            <MoreVertical className="h-4 w-4 text-foreground" />
          </button>
          {showMenu ? (
            <div className="absolute right-0 z-10 mt-2 w-40 overflow-hidden rounded-lg border border-border bg-popover shadow-xl">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(video);
                  setShowMenu(false);
                }}
                className="flex w-full items-center space-x-2 bg-background px-4 py-2.5 text-left text-foreground transition-colors hover:bg-accent"
              >
                <Edit2 className="h-4 w-4" />
                <span className="text-sm">Изменить</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(video);
                  setShowMenu(false);
                }}
                className="flex w-full items-center space-x-2 px-4 py-2.5 text-left text-destructive transition-colors hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
                <span className="text-sm">Удалить</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
