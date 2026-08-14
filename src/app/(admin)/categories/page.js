'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FolderOpen, Plus, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import { Card, CardContent } from '@/app/components/ui/Card';
import Modal from '@/app/components/ui/Modal';
import DeleteConfirmModal from '@/app/components/DeleteConfirmModal';
import getDocuments from '@/app/firebase/firestore/get-all-data';
import addData from '@/app/firebase/firestore/add-data';
import deleteDocument from '@/app/firebase/firestore/delete-data';
import { extractYoutubeVideoId } from '@/app/utils/extractYoutubeVideoId';

function countVideos(category) {
  return Object.keys(category).filter((key) => key !== 'id').length;
}

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    handleSubmit,
    register,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { title: '', videoTitle: '', videoId: '' },
  });

  const previewTitle = watch('title');

  const fetchCategories = async () => {
    setIsLoading(true);
    setError('');
    const response = await getDocuments('categories');
    if (response.error) {
      setError('Не удалось загрузить категории');
      setCategories([]);
    } else {
      setCategories(response.result ?? []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAddModal = () => {
    reset({ title: '', videoTitle: '', videoId: '' });
    setError('');
    setModalOpen(true);
  };

  const onSubmit = async (values) => {
    const { videoId, error: extractError } = extractYoutubeVideoId(values.videoId);
    if (extractError) {
      setError(extractError);
      return;
    }

    const response = await addData('categories', values.title.trim(), videoId, values.videoTitle.trim());
    if (response.error) {
      setError('Не удалось сохранить категорию');
      return;
    }
    setModalOpen(false);
    await fetchCategories();
  };

  const linkedCount = useMemo(
    () => (categoryToDelete ? countVideos(categoryToDelete) : 0),
    [categoryToDelete]
  );

  const handleDelete = async () => {
    if (!categoryToDelete || linkedCount > 0) return;
    setIsDeleting(true);
    const result = await deleteDocument('categories', categoryToDelete.id);
    setIsDeleting(false);
    if (result.error) {
      setError('Не удалось удалить категорию');
      return;
    }
    setDeleteModalOpen(false);
    setCategoryToDelete(null);
    await fetchCategories();
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-2 text-foreground">Категории</h1>
          <p className="text-muted-foreground">Организуйте видео по категориям</p>
        </div>
        <Button onClick={openAddModal} size="lg" className="w-full sm:w-auto">
          <Plus className="mr-2 h-5 w-5" />
          Добавить категорию
        </Button>
      </div>

      {error && !modalOpen ? <p className="text-sm text-destructive">{error}</p> : null}

      {isLoading ? (
        <div className="py-16 text-center text-muted-foreground">Загрузка категорий...</div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
            <FolderOpen className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-foreground">Пока нет категорий</h3>
          <p className="mb-6 text-muted-foreground">Создайте первую категорию, чтобы добавить видео</p>
          <Button onClick={openAddModal}>
            <Plus className="mr-2 h-4 w-4" />
            Добавить категорию
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3 2xl:grid-cols-4">
          {categories.map((category) => (
            <Card
              key={category.id}
              className="group cursor-pointer transition-all duration-200 hover:shadow-xl hover:shadow-primary/5"
              onClick={() => router.push(`/videos/${encodeURIComponent(category.id)}`)}
            >
              <CardContent className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                    <FolderOpen className="h-6 w-6 text-primary" />
                  </div>
                  <button
                    type="button"
                    className="rounded-lg p-2 text-destructive opacity-100 transition-opacity hover:bg-destructive/10 sm:opacity-0 sm:group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCategoryToDelete(category);
                      setDeleteModalOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <h3 className="mb-1 text-sm leading-relaxed">{category.id}</h3>
                <p className="text-sm text-muted-foreground">{countVideos(category)} видео</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Новая категория"
        footer={
          <>
            <Button variant="ghost" className="w-full sm:w-auto" onClick={() => setModalOpen(false)}>
              Отмена
            </Button>
            <Button
              type="submit"
              form="create-category-form"
              className="w-full sm:w-auto"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Сохранение...' : 'Добавить категорию'}
            </Button>
          </>
        }
      >
        <form id="create-category-form" className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          {error && modalOpen ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="space-y-2">
            <label htmlFor="title">Название</label>
            <Input
              id="title"
              placeholder="Например, Дети"
              error={Boolean(errors.title)}
              {...register('title', {
                required: 'Название обязательно',
                minLength: { value: 3, message: 'Минимум 3 символа' },
              })}
            />
            {errors.title ? <p className="text-sm text-destructive">{errors.title.message}</p> : null}
          </div>
          <div className="space-y-2">
            <label htmlFor="videoTitle">Название первого видео</label>
            <Input
              id="videoTitle"
              placeholder="Название ролика"
              error={Boolean(errors.videoTitle)}
              {...register('videoTitle', {
                required: 'Название видео обязательно',
                minLength: { value: 3, message: 'Минимум 3 символа' },
              })}
            />
            {errors.videoTitle ? (
              <p className="text-sm text-destructive">{errors.videoTitle.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <label htmlFor="videoId">Ссылка YouTube</label>
            <Input
              id="videoId"
              placeholder="https://youtube.com/watch?v=..."
              error={Boolean(errors.videoId)}
              {...register('videoId', { required: 'Ссылка обязательна' })}
            />
            {errors.videoId ? <p className="text-sm text-destructive">{errors.videoId.message}</p> : null}
          </div>
          <div className="rounded-lg border border-border bg-accent/30 p-4">
            <p className="mb-3 text-sm text-muted-foreground">Превью</p>
            <div className="flex items-center space-x-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                <FolderOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p>{previewTitle?.trim() || 'Название категории'}</p>
                <p className="text-sm text-muted-foreground">1 видео</p>
              </div>
            </div>
          </div>
        </form>
      </Modal>

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setCategoryToDelete(null);
        }}
        onConfirm={handleDelete}
        confirmDisabled={linkedCount > 0}
        isLoading={isDeleting}
        title="Удалить категорию?"
        description={
          linkedCount > 0
            ? 'В этой категории есть видео. Сначала удалите их.'
            : `Категория «${categoryToDelete?.id ?? ''}» будет удалена.`
        }
      />
    </div>
  );
}
