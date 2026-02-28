'use client';
import { Container, Button, Heading, Box, Flex, Spinner, Text, Stack, useBreakpointValue, Image } from '@chakra-ui/react';
import {
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableCaption,
    TableContainer,
} from '@chakra-ui/react';
import {
    FormErrorMessage,
    FormLabel,
    FormControl,
    Input,
} from '@chakra-ui/react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
} from '@chakra-ui/react';
import {
    AlertDialog,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogOverlay,
} from '@chakra-ui/react';
import { useEffect, useState, useRef } from 'react';
import getSubDouments from '../../firebase/firestore/get-all-sub-data';
import addSubData from '../../firebase/firestore/add-sub-data';
import updateVideoField from '../../firebase/firestore/update-video-field';
import deleteVideoField from '../../firebase/firestore/delete-video-field';
import { useForm } from 'react-hook-form';
import { useToast } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import signOutAndExit from "../../firebase/auth/signout";
import { useAuthContext } from "../../context/auth-context";
import { extractYoutubeVideoId } from '../../utils/extractYoutubeVideoId';

export default function Videos({ params }) {
    const { user } = useAuthContext();
    const router = useRouter();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const {
        isOpen: isDeleteOpen,
        onOpen: onDeleteOpen,
        onClose: onDeleteClose,
    } = useDisclosure();
    const cancelDeleteRef = useRef(null);
    const [mode, setMode] = useState('create');
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [videos, setVideos] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [videoToDelete, setVideoToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const {
        handleSubmit,
        register,
        setValue,
        watch,
        formState: { errors, isSubmitting },
    } = useForm({
        title: null,
        videoId: null
    });
    const toast = useToast();
    const [previewVideoId, setPreviewVideoId] = useState(null);
    const [previewError, setPreviewError] = useState(false);
    const watchedVideoId = watch('videoId');

    const categoryId = params?.id != null ? decodeURIComponent(String(params.id)) : undefined;

    const fetchVideos = async () => {
        if (!categoryId) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const res = await getSubDouments('categories', categoryId);
            if (res.error) {
                toast({
                    title: 'Error',
                    description: 'Failed to load videos.',
                    status: 'error',
                    duration: 5000,
                    isClosable: true,
                });
                setVideos([]);
            } else {
                setVideos(res.result ?? []);
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user == null) router.push("/signin");
    }, [user]);

    useEffect(() => {
        fetchVideos();
    }, [categoryId]);

    useEffect(() => {
        if (!watchedVideoId || typeof watchedVideoId !== 'string') {
            setPreviewVideoId(null);
            setPreviewError(false);
            return;
        }
        const { videoId, error } = extractYoutubeVideoId(watchedVideoId);
        setPreviewVideoId(error ? null : videoId);
        setPreviewError(false);
    }, [watchedVideoId]);

    const createVideoHandler = () => {
        setMode('create');
        setSelectedVideo(null);
        onOpen()
    }

    const updateVideoHandler = (id) => {
        setMode('update');
        const video = videos.find((f) => f.id === id);
        if (video) {
            setSelectedVideo(video);
            setValue('title', video.title);
            setValue('videoId', video.id);
            onOpen();
        } else {
            toast({
                title: 'Error',
                description: 'The selected video was not found',
                status: 'error',
                duration: 9000,
                isClosable: true,
            });
        }
    };

    const onSubmit = async (values) => {
        const title = values.title?.trim();
        const rawVideoInput = values.videoId?.trim();
        if (!title || !rawVideoInput) {
            toast({
                title: 'Error',
                description: 'Title and Video link are required.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        const { videoId: extractedId, error: extractError } = extractYoutubeVideoId(rawVideoInput);
        if (extractError) {
            toast({
                title: 'Invalid video link',
                description: extractError,
                status: 'error',
                duration: 7000,
                isClosable: true,
            });
            return;
        }

        let res;
        if (selectedVideo) {
            res = await updateVideoField(
                'categories',
                categoryId,
                selectedVideo.id,
                extractedId,
                title
            );
        } else {
            res = await addSubData('categories', categoryId, null, title, extractedId);
        }

        if (res.error) {
            toast({
                title: 'Error',
                description: res.error.message || 'Error in saving video.',
                status: 'error',
                duration: 9000,
                isClosable: true,
            });
            return;
        }
        toast({
            title: 'Success',
            description: mode === 'create' ? 'Video added.' : 'Video updated.',
            status: 'success',
            duration: 5000,
            isClosable: true,
        });
        setSelectedVideo(null);
        handleModalClose();
        await fetchVideos();
    };

    const deleteVideoHandler = (video) => {
        setVideoToDelete(video);
        onDeleteOpen();
    };

    const onConfirmDelete = async () => {
        if (!videoToDelete || !categoryId) {
            onDeleteClose();
            setVideoToDelete(null);
            return;
        }
        setIsDeleting(true);
        const res = await deleteVideoField('categories', categoryId, videoToDelete.id);
        setIsDeleting(false);
        if (res.error) {
            toast({
                title: 'Error',
                description: 'Failed to delete video.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } else {
            toast({
                title: 'Success',
                description: 'Video deleted.',
                status: 'success',
                duration: 5000,
                isClosable: true,
            });
            await fetchVideos();
        }
        onDeleteClose();
        setVideoToDelete(null);
    };

    const onCancelDelete = () => {
        onDeleteClose();
        setVideoToDelete(null);
    };

    const handleModalClose = () => {
        setPreviewVideoId(null);
        setPreviewError(false);
        onClose();
    };

    const renderModal = () => (
        <Box w={{ base: '100%', sm: 'auto' }}>
            <Button
                colorScheme='blue'
                size='md'
                margin={1}
                onClick={createVideoHandler}
                w={{ base: '100%', sm: 'auto' }}
                minH={{ base: '44px', md: '40px' }}
                boxShadow='sm'
                _hover={{ boxShadow: 'md', transform: 'translateY(-1px)' }}
                _active={{ transform: 'translateY(0)' }}
            >
                New
            </Button>

            <Modal
                isOpen={isOpen}
                onClose={handleModalClose}
                size={{ base: 'full', md: 'md' }}
            >
                <ModalOverlay bg='blackAlpha.600' backdropFilter='blur(4px)' />
                <form onSubmit={handleSubmit(onSubmit)}>
                    <ModalContent borderRadius={{ base: 'none', md: 'xl' }} boxShadow='2xl' mx={{ base: 0, md: 4 }}>
                        <ModalHeader pb={2} fontSize={{ base: 'lg', md: 'xl' }}>{mode === 'create' ? 'Create Video' : 'Update Video'}</ModalHeader>
                        <ModalCloseButton top={4} right={4} size="lg" />
                        <ModalBody pt={2} px={{ base: 4, md: 6 }} pb={6}>
                            <FormControl isInvalid={errors.title} mb={4}>
                                <FormLabel htmlFor='title' fontSize={{ base: 'sm', md: 'md' }}>Title</FormLabel>
                                <Input
                                    id='title'
                                    placeholder='Video title'
                                    size={{ base: 'md', md: 'md' }}
                                    {...register('title', {
                                        required: 'Video title is required',
                                        minLength: { value: 4, message: 'Minimum length should be 3' },
                                    })}
                                />
                                <FormErrorMessage>
                                    {errors.title && errors.title.message}
                                </FormErrorMessage>
                            </FormControl>
                            <FormControl isInvalid={errors.videoId}>
                                <FormLabel htmlFor='videoId' fontSize={{ base: 'sm', md: 'md' }}>YouTube URL or video ID</FormLabel>
                                <Input
                                    id='videoId'
                                    placeholder='Paste YouTube link or video ID (e.g. youtube.com/watch?v=... or youtu.be/...)'
                                    size={{ base: 'md', md: 'md' }}
                                    {...register('videoId', {
                                        required: 'Video link or URL is required',
                                    })}
                                />
                                <FormErrorMessage>
                                    {errors.videoId && errors.videoId.message}
                                </FormErrorMessage>
                            </FormControl>
                            {previewVideoId && (
                                <Box mt={4}>
                                    <Text fontSize="xs" color="gray.500" mb={2}>Preview</Text>
                                    <Box
                                        borderRadius="lg"
                                        overflow="hidden"
                                        borderWidth="1px"
                                        borderColor="gray.200"
                                        bg="gray.50"
                                        w="100%"
                                        maxW="320px"
                                    >
                                        {!previewError ? (
                                            <Image
                                                src={`https://img.youtube.com/vi/${previewVideoId}/maxresdefault.jpg`}
                                                alt="Video thumbnail"
                                                w="100%"
                                                onError={() => setPreviewError(true)}
                                            />
                                        ) : (
                                            <Flex h="120px" align="center" justify="center" bg="gray.100">
                                                <Text fontSize="sm" color="gray.500">Preview unavailable</Text>
                                            </Flex>
                                        )}
                                    </Box>
                                </Box>
                            )}
                        </ModalBody>
                        <ModalFooter px={{ base: 4, md: 6 }} pb={{ base: 6, md: 4 }} gap={2} flexWrap="wrap">
                            <Button colorScheme='blue' onClick={handleModalClose} variant='outline' _hover={{ bg: 'gray.50' }} minH={{ base: '44px', md: '40px' }} flex={{ base: '1', md: 'none' }}>
                                Close
                            </Button>
                            <Button colorScheme='teal' isLoading={isSubmitting} type='submit' _hover={{ boxShadow: 'md' }} minH={{ base: '44px', md: '40px' }} flex={{ base: '1', md: 'none' }}>
                                Save
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </form>
            </Modal>

        </Box>
    );

    const signOutHandler = async () => {
        await signOutAndExit();
        router.push('signin');
    }

    const showTable = useBreakpointValue({ base: false, md: true });

    return (
        <>
            <Container
                maxW="container.xl"
                mx="auto"
                px={{ base: 3, sm: 4, md: 8 }}
                py={{ base: 4, sm: 6, md: 10 }}
                w="100%"
                minW="0"
            >
                <Box
                    bg="white"
                    borderRadius={{ base: 'lg', md: 'xl' }}
                    boxShadow="sm"
                    p={{ base: 4, sm: 5, md: 8 }}
                    mb={{ base: 6, md: 8 }}
                >
                    <Flex
                        direction={{ base: 'column', md: 'row' }}
                        align={{ base: 'flex-start', md: 'center' }}
                        justify="space-between"
                        gap={{ base: 3, md: 4 }}
                        mb={{ base: 6, md: 8 }}
                    >
                        <Heading size={{ base: 'md', sm: 'lg' }} fontWeight="600" color="gray.800" fontSize={{ base: 'xl', sm: '2xl' }}>
                            Category {categoryId ?? '…'} Video List
                        </Heading>
                        <Flex
                            direction={{ base: 'column', sm: 'row' }}
                            align={{ base: 'stretch', sm: 'center' }}
                            gap={{ base: 2, sm: 3 }}
                            wrap="wrap"
                            w={{ base: '100%', sm: 'auto' }}
                        >
                            <Button
                                colorScheme='orange'
                                size={{ base: 'md', md: 'md' }}
                                onClick={signOutHandler}
                                w={{ base: '100%', sm: 'auto' }}
                                minH={{ base: '44px', md: '40px' }}
                                boxShadow='sm'
                                _hover={{ boxShadow: 'md', transform: 'translateY(-1px)' }}
                                _active={{ transform: 'translateY(0)' }}
                            >
                                Sign Out
                            </Button>
                            <Button
                                colorScheme='teal'
                                size={{ base: 'md', md: 'sm' }}
                                onClick={() => router.push(`/`)}
                                w={{ base: '100%', sm: 'auto' }}
                                minH={{ base: '44px', md: '32px' }}
                                _hover={{ boxShadow: 'sm' }}
                            >
                                Back To Categories
                            </Button>
                            {renderModal()}
                        </Flex>
                    </Flex>
                    {isLoading ? (
                        <Flex justify="center" align="center" py={{ base: 12, md: 16 }} flexDirection="column" gap={4}>
                            <Spinner size={{ base: 'lg', md: 'xl' }} color="blue.500" thickness="3px" />
                            <Text color="gray.500" fontSize={{ base: 'xs', sm: 'sm' }}>Loading videos...</Text>
                        </Flex>
                    ) : showTable ? (
                        <TableContainer maxW="100%" overflowX="auto" borderRadius="lg" borderWidth="1px" borderColor="gray.100" overflow="hidden" minW="0">
                            <Table variant='striped' size="sm">
                                <TableCaption placement="top" textAlign="left" fontWeight="500" color="gray.600" mb={2} fontSize={{ base: 'sm', md: 'md' }}>All Videos</TableCaption>
                                <Thead bg="gray.50">
                                    <Tr>
                                        <Th py={{ base: 3, md: 4 }} fontSize={{ base: 'xs', sm: 'sm' }}>Title</Th>
                                        <Th py={{ base: 3, md: 4 }} fontSize={{ base: 'xs', sm: 'sm' }}>Video Link</Th>
                                        <Th py={{ base: 3, md: 4 }} fontSize={{ base: 'xs', sm: 'sm' }}>Actions</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {videos && videos.length > 0 ? (
                                        videos.map((video, index) => (
                                            <Tr key={video.id ?? index} _hover={{ bg: 'gray.50' }} transition="background 0.15s">
                                                <Td py={{ base: 3, md: 4 }} fontWeight="500" fontSize={{ base: 'sm', md: 'md' }} wordBreak="break-word" maxW={{ base: '120px', sm: '200px', md: 'none' }}>{video.title}</Td>
                                                <Td py={{ base: 3, md: 4 }} fontSize={{ base: 'xs', sm: 'sm' }} wordBreak="break-all" maxW={{ base: '100px', sm: '140px', md: 'none' }}>{video.id}</Td>
                                                <Td py={{ base: 3, md: 4 }}>
                                                    <Flex wrap="wrap" gap={{ base: 2, md: 2 }}>
                                                        <Button
                                                            colorScheme='yellow'
                                                            size={{ base: 'md', md: 'sm' }}
                                                            minH={{ base: '44px', md: '32px' }}
                                                            minW={{ base: '64px', md: 'auto' }}
                                                            onClick={() => updateVideoHandler(video.id)}
                                                            _hover={{ boxShadow: 'sm' }}
                                                        >
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            colorScheme='red'
                                                            size={{ base: 'md', md: 'sm' }}
                                                            minH={{ base: '44px', md: '32px' }}
                                                            minW={{ base: '64px', md: 'auto' }}
                                                            onClick={() => deleteVideoHandler(video)}
                                                            _hover={{ boxShadow: 'sm' }}
                                                        >
                                                            Delete
                                                        </Button>
                                                    </Flex>
                                                </Td>
                                            </Tr>
                                        ))
                                    ) : (
                                        <Tr>
                                            <Td colSpan={3} textAlign="center" py={12}>
                                                <Box py={4}>
                                                    <Text color="gray.500" mb={4} fontSize={{ base: 'sm', md: 'md' }}>
                                                        No videos in this category.
                                                    </Text>
                                                    <Button colorScheme="blue" size={{ base: 'md', md: 'sm' }} minH={{ base: '44px', md: '32px' }} onClick={createVideoHandler} _hover={{ boxShadow: 'md' }}>
                                                        Add video
                                                    </Button>
                                                </Box>
                                            </Td>
                                        </Tr>
                                    )}
                                </Tbody>
                            </Table>
                        </TableContainer>
                    ) : (
                        <>
                            <Text fontWeight="500" color="gray.600" mb={3} fontSize={{ base: 'sm', sm: 'md' }}>All Videos</Text>
                            {videos && videos.length > 0 ? (
                                <Stack spacing={{ base: 3, sm: 4 }} minW="0">
                                    {videos.map((video, index) => (
                                        <Box
                                            key={video.id ?? index}
                                            p={{ base: 4, sm: 5 }}
                                            borderRadius="lg"
                                            borderWidth="1px"
                                            borderColor="gray.100"
                                            bg="gray.50"
                                            _hover={{ bg: 'gray.100' }}
                                            transition="background 0.15s"
                                        >
                                            <Text fontWeight="600" fontSize={{ base: 'sm', sm: 'md' }} color="gray.800" mb={1} wordBreak="break-word">
                                                {video.title}
                                            </Text>
                                            <Text fontSize="xs" color="gray.500" mb={3} wordBreak="break-all" noOfLines={2}>
                                                {video.id}
                                            </Text>
                                            <Flex wrap="wrap" gap={2}>
                                                <Button
                                                    colorScheme='yellow'
                                                    size="md"
                                                    minH="44px"
                                                    minW="72px"
                                                    onClick={() => updateVideoHandler(video.id)}
                                                    _hover={{ boxShadow: 'sm' }}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    colorScheme='red'
                                                    size="md"
                                                    minH="44px"
                                                    minW="72px"
                                                    onClick={() => deleteVideoHandler(video)}
                                                    _hover={{ boxShadow: 'sm' }}
                                                >
                                                    Delete
                                                </Button>
                                            </Flex>
                                        </Box>
                                    ))}
                                </Stack>
                            ) : (
                                <Box py={8} textAlign="center">
                                    <Text color="gray.500" mb={4} fontSize={{ base: 'sm', md: 'md' }}>
                                        No videos in this category.
                                    </Text>
                                    <Button colorScheme="blue" size="md" minH="44px" onClick={createVideoHandler} _hover={{ boxShadow: 'md' }}>
                                        Add video
                                    </Button>
                                </Box>
                            )}
                        </>
                    )}

                    <AlertDialog
                        isOpen={isDeleteOpen}
                        leastDestructiveRef={cancelDeleteRef}
                        onClose={onCancelDelete}
                    >
                        <AlertDialogOverlay bg='blackAlpha.600' backdropFilter='blur(4px)' />
                        <AlertDialogContent borderRadius={{ base: 'lg', md: 'xl' }} boxShadow='2xl' mx={{ base: 4, md: 0 }}>
                            <AlertDialogHeader fontSize={{ base: 'md', md: 'lg' }} fontWeight="600" pr={12}>
                                Delete video?
                            </AlertDialogHeader>
                            <AlertDialogBody fontSize={{ base: 'sm', md: 'md' }}>
                                {videoToDelete ? (
                                    <>This will remove &quot;{videoToDelete.title}&quot; from this category. This action cannot be undone.</>
                                ) : (
                                    <>This action cannot be undone.</>
                                )}
                            </AlertDialogBody>
                            <AlertDialogFooter borderTopWidth="1px" borderColor="gray.100" pt={4} gap={2} flexWrap="wrap">
                                <Button ref={cancelDeleteRef} onClick={onCancelDelete} variant="outline" _hover={{ bg: 'gray.50' }} minH={{ base: '44px', md: '40px' }} flex={{ base: '1', md: 'none' }}>
                                    Cancel
                                </Button>
                                <Button
                                    colorScheme="red"
                                    onClick={onConfirmDelete}
                                    isLoading={isDeleting}
                                    ml={{ base: 0, md: 3 }}
                                    _hover={{ boxShadow: 'md' }}
                                    minH={{ base: '44px', md: '40px' }}
                                    flex={{ base: '1', md: 'none' }}
                                >
                                    Delete
                                </Button>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </Box>
            </Container>
        </>
    );
}