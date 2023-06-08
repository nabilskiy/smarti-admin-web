'use client';
import { Container, Button, Heading } from '@chakra-ui/react';
import { Box } from '@chakra-ui/react';
import getSubDouments from '../../firebase/firestore/get-all-sub-data';
import {
    Table,
    Thead,
    Tbody,
    Tfoot,
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
} from '@chakra-ui/react'
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
import { useEffect, useState } from 'react';
import addSubData from '../../firebase/firestore/add-sub-data';
import getDoument from '../../firebase/firestore/get-data';
import { useForm } from 'react-hook-form'
import { useToast } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import signOutAndExit from "../../firebase/auth/signout";
import { useAuthContext } from "../../context/auth-context";

export default function Videos({ params }) {
    const { user } = useAuthContext();
    const router = useRouter();
    const { isOpen, onOpen, onClose } = useDisclosure()
    const [mode, setMode] = useState('create');
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [selectedCategoty, setSelectedcategory] = useState(null);
    const [videos, setVideos] = useState(null);
    const {
        handleSubmit,
        register,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm({
        title: null,
        videoId: null
    })
    const toast = useToast();




    const fetchVideos = async () => {
        const fetchedVideosResponse = await getSubDouments('categories', params.id);
        if (fetchedVideosResponse && !fetchedVideosResponse.error) {
            console.log(fetchedVideosResponse.result)
            setVideos(fetchedVideosResponse.result);
        }
    }

    useEffect(() => {
        if (user == null) router.push("/signin")
      }, [user])
      
    useEffect(() => {
        fetchVideos();
    }, []);

    const createVideoHandler = () => {
        setMode('create');
        setSelectedVideo(null);
        onOpen()
    }

    const updateVideoHandler = (id) => {
        setMode('update');
        const video = videos.find(f => f.id === id);
        if (video) {
            setSelectedVideo(video);
            setValue('title', video.title);
            setValue('videoId', video.id);
            onOpen();
        } else {
            toast({
                title: 'Error',
                description: "The selected video was not found",
                status: 'error',
                duration: 9000,
                isClosable: true,
            });
        }
    }



    const onSubmit = async (values) => {

        const id = selectedVideo ? selectedVideo.id : null;
        const addDataResaponse = await addSubData('categories', params.id, id, values);
        if (addDataResaponse.error) {
            toast({
                title: 'Error',
                description: "Error in saving video",
                status: 'error',
                duration: 9000,
                isClosable: true,
            });
        }
        setSelectedVideo(null);
        await fetchVideos();

        onClose();
    }


    const renderModal = () => (<Box>
        <Button colorScheme='blue' size='md' margin={1} onClick={createVideoHandler}>
            New
        </Button>

        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <form onSubmit={handleSubmit(onSubmit)}>
                <ModalContent>
                    <ModalHeader>{mode === 'create' ? 'Create Video' : 'Update Video'}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <FormControl isInvalid={errors.title}>
                            <FormLabel htmlFor='title'>Title</FormLabel>
                            <Input
                                id='title'
                                placeholder='Video title'
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
                            <FormLabel htmlFor='videoId'>Link from youtube</FormLabel>
                            <Input
                                id='videoId'
                                placeholder='Video Link'
                                {...register('videoId', {
                                    required: 'Video link is required',
                                })}
                            />
                            <FormErrorMessage>
                                {errors.videoId && errors.videoId.message}
                            </FormErrorMessage>
                        </FormControl>
                    </ModalBody>
                    <ModalFooter>
                        <Button colorScheme='blue' mr={3} onClick={onClose}>
                            Close
                        </Button>
                        <Button colorScheme='teal' isLoading={isSubmitting} type='submit'>
                            Save
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </form>
        </Modal>

    </Box>);



    const signOutHandler = async () => {
        await signOutAndExit();
        router.push('signin');
    }

    return (
        <>
            <Container margin={10} w="100%">
                <Button colorScheme='orange' size='md' margin={1} onClick={signOutHandler}>
                    Sign Out
                </Button>
                <Heading>
                    Category {params.id} Video List
                </Heading>
                <Box>
                    <Button colorScheme='teal' size='sm' margin={1} onClick={() => router.push(`/`)}>
                        Back To Categories
                    </Button>
                </Box>
                {renderModal()}
                <TableContainer>
                    <Table variant='striped'>
                        <TableCaption>All Videos</TableCaption>
                        <Thead>
                            <Tr>
                                <Th>Title</Th>
                                <Th>Video Link</Th>
                                <Th>Actions</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {
                                videos && videos.map((video, index) =>
                                    <Tr key={index}>
                                        <Td>{video.title}</Td>
                                        <Td>{video.id}</Td>
                                        <Td>
                                            <Button colorScheme='yellow' size='sm' margin={1} onClick={() => updateVideoHandler(video.id)}>
                                                Edit
                                            </Button>

                                            <Button colorScheme='red' size='sm' margin={1}>
                                                Delete
                                            </Button>
                                        </Td>
                                    </Tr>
                                )
                            }
                        </Tbody>
                    </Table>
                </TableContainer>
            </Container>
        </>);
}