'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Grid3x3, List, Plus, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import Modal from '@/app/components/ui/Modal';
import DeleteConfirmModal from '@/app/components/DeleteConfirmModal';
import VideoCard from '@/app/components/VideoCard';
import YoutubePlayer from '@/app/components/YoutubePlayer';
import getSubDouments from '@/app/firebase/firestore/get-all-sub-data';
import addSubData from '@/app/firebase/firestore/add-sub-data';
import updateVideoField from '@/app/firebase/firestore/update-video-field';
import deleteVideoField from '@/app/firebase/firestore/delete-video-field';
import { extractYoutubeVideoId } from '@/app/utils/extractYoutubeVideoId';

export default function VideosPage({ params }) {
  const router = useRouter();
  const categoryId = params?.id != null ? decodeURIComponent(String(params.id)) : undefined;
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [mode, setMode] = useState('create');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [videoToDelete, setVideoToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    handleSubmit,
    register,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { title: '', videoId: '' },
  });

  const watchedVideoId = watch('videoId');
  const previewExtract = extractYoutubeVideoId(watchedVideoId || '');
  const previewVideoId = previewExtract.error ? null : previewExtract.videoId;

  const fetchVideos = async () => {
    if (!categoryId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const res = await getSubDouments('categories', categoryId);
    if (res.error) {
      setPageError('Не удалось загрузить видео');
      setVideos([]);
    } else {
      setPageError('');
      setVideos(res.result ?? []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchVideos();
  }, [categoryId]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsLargeScreen(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const effectiveViewMode = isLargeScreen ? viewMode : 'grid';

  const displayVideos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return videos;
    return videos.filter(
      (video) =>
        video.title?.toLowerCase().includes(q) || video.id?.toLowerCase().includes(q)
    );
  }, [videos, searchQuery]);

  const openCreate = () => {
    setMode('create');
    setSelectedVideo(null);
    reset({ title: '', videoId: '' });
    setFormOpen(true);
  };

  const openEdit = (video) => {
    setMode('update');
    setSelectedVideo(video);
    setValue('title', video.title);
    setValue('videoId', video.id);
    setFormOpen(true);
  };

  const onSubmit = async (values) => {
    const title = values.title?.trim();
    const { videoId: extractedId, error: extractError } = extractYoutubeVideoId(values.videoId);
    if (!title || extractError) {
      setPageError(extractError || 'Заполните название и ссылку');
      return;
    }

    let res;
    if (selectedVideo) {
      res = await updateVideoField('categories', categoryId, selectedVideo.id, extractedId, title);
    } else {
      res = await addSubData('categories', categoryId, null, title, extractedId);
    }

    if (res.error) {
      setPageError(res.error.message || 'Не удалось сохранить видео');
      return;
    }
    setFormOpen(false);
    setSelectedVideo(null);
    setPageError('');
    await fetchVideos();
  };

  const onConfirmDelete = async () => {
    if (!videoToDelete || !categoryId) return;
    setIsDeleting(true);
    const res = await deleteVideoField('categories', categoryId, videoToDelete.id);
    setIsDeleting(false);
    if (res.error) {
      setPageError('Не удалось удалить видео');
      return;
    }
    setVideoToDelete(null);
    await fetchVideos();
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            type="button"
            onClick={() => router.push('/categories')}
            className="mb-2 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            К категориям
          </button>
          <h1 className="mb-2 text-foreground">Видео</h1>
          <p className="text-muted-foreground">Категория {categoryId ?? '…'}</p>
        </div>
        <Button onClick={openCreate} size="lg" className="w-full sm:w-auto">
          <Plus className="mr-2 h-5 w-5" />
          Добавить видео
        </Button>
      </div>

      {pageError && !formOpen ? <p className="text-sm text-destructive">{pageError}</p> : null}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-md lg:flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Поиск видео..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="hidden items-center self-end rounded-lg bg-secondary p-1 lg:flex">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`rounded p-2 transition-colors ${
              viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
            }`}
            aria-label="Сетка"
          >
            <Grid3x3 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`rounded p-2 transition-colors ${
              viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
            }`}
            aria-label="Список"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-muted-foreground">Загрузка видео...</div>
      ) : displayVideos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
            <Search className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-foreground">Нет видео</h3>
          <p className="mb-6 text-muted-foreground">
            {searchQuery ? 'Ничего не найдено по запросу' : 'В этой категории пока нет роликов'}
          </p>
          {!searchQuery ? (
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Добавить видео
            </Button>
          ) : null}
        </div>
      ) : (
        <div
          className={
            effectiveViewMode === 'grid'
              ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6'
              : 'space-y-4'
          }
        >
          {displayVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              viewMode={effectiveViewMode}
              onOpen={setPlayingVideo}
              onEdit={openEdit}
              onDelete={setVideoToDelete}
            />
          ))}
        </div>
      )}

      <Modal
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setSelectedVideo(null);
        }}
        title={mode === 'create' ? 'Новое видео' : 'Изменить видео'}
        className="max-w-lg"
        footer={
          <>
            <Button variant="ghost" className="w-full sm:w-auto" onClick={() => setFormOpen(false)}>
              Отмена
            </Button>
            <Button type="submit" form="video-form" className="w-full sm:w-auto" disabled={isSubmitting}>
              {isSubmitting ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </>
        }
      >
        <form id="video-form" className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          {pageError && formOpen ? <p className="text-sm text-destructive">{pageError}</p> : null}
          <div className="space-y-2">
            <label htmlFor="video-title">Название</label>
            <Input
              id="video-title"
              placeholder="Название ролика"
              error={Boolean(errors.title)}
              {...register('title', {
                required: 'Название обязательно',
                minLength: { value: 3, message: 'Минимум 3 символа' },
              })}
            />
            {errors.title ? <p className="text-sm text-destructive">{errors.title.message}</p> : null}
          </div>
          <div className="space-y-2">
            <label htmlFor="video-link">Ссылка YouTube или ID</label>
            <Input
              id="video-link"
              placeholder="youtube.com/watch?v=... или 11-символьный ID"
              error={Boolean(errors.videoId)}
              {...register('videoId', { required: 'Ссылка обязательна' })}
            />
            {errors.videoId ? <p className="text-sm text-destructive">{errors.videoId.message}</p> : null}
            {watchedVideoId && previewExtract.error ? (
              <p className="text-sm text-destructive">{previewExtract.error}</p>
            ) : null}
          </div>
          {previewVideoId ? (
            <div>
              <p className="mb-2 text-xs text-muted-foreground">Превью</p>
              <YoutubePlayer videoId={previewVideoId} title={watch('title')} />
            </div>
          ) : null}
        </form>
      </Modal>

      <Modal
        open={Boolean(playingVideo)}
        onOpenChange={(open) => {
          if (!open) setPlayingVideo(null);
        }}
        title={playingVideo?.title || 'Просмотр'}
        className="max-w-3xl"
      >
        {playingVideo ? (
          <YoutubePlayer
            videoId={extractYoutubeVideoId(playingVideo.id).videoId}
            title={playingVideo.title}
          />
        ) : null}
      </Modal>

      <DeleteConfirmModal
        isOpen={Boolean(videoToDelete)}
        onClose={() => setVideoToDelete(null)}
        onConfirm={onConfirmDelete}
        isLoading={isDeleting}
        title="Удалить видео?"
        description={
          videoToDelete
            ? `Ролик «${videoToDelete.title}» будет удалён из категории. Это нельзя отменить.`
            : 'Это действие нельзя отменить.'
        }
      />
    </div>
  );
}
