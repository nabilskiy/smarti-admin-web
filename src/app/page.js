'use client'
import { Container, Button, Heading } from '@chakra-ui/react';
import { Box } from '@chakra-ui/react';
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
import { useEffect, useState } from 'react';
import getDocuments from './firebase/firestore/get-all-data';
import addData from './firebase/firestore/add-data';
import addSubData from './firebase/firestore/add-sub-data';
import { useForm } from 'react-hook-form'
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
import { useToast } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from "./context/auth-context";
import signOutAndExit from "./firebase/auth/signout";
import getSubDouments from './firebase/firestore/get-all-sub-data';
import deleteDocument from './firebase/firestore/delete-data';

export default function Categories() {
  const { user } = useAuthContext()

  const router = useRouter();

  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
  } = useForm({
    title: null
  });
  const toast = useToast();
  const [categories, setCategories] = useState([]);

  const { isOpen, onOpen, onClose } = useDisclosure()
  const [mode, setMode] = useState('create');
  const fetchCategories = async () => {
    const fetchedCategoriesResponse = await getDocuments('categories');
    if (fetchedCategoriesResponse && !fetchedCategoriesResponse.error) {
      setCategories(fetchedCategoriesResponse.result);
    }
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (user == null) router.push("/signin")
  }, [user])

  const createCategoryHandler = () => {
    setMode('create');
    onOpen()
  }

  const deleteCategoryHandler = async (id) => {
    const fetchedVideosResponse = await getSubDouments('categories', id, 'videos');
    if (fetchedVideosResponse && !fetchedVideosResponse.error && fetchedVideosResponse.result.length > 0) {
      toast({
        title: 'Error',
        description: "The selected category contains videos",
        status: 'error',
        duration: 9000,
        isClosable: true,
      });
      return;
    }

    const result = await deleteDocument('categories', id);
    if (!result.error) {
      toast({
        title: 'Success',
        description: "Category deleted.",
        status: 'success',
        duration: 9000,
        isClosable: true,
      });
    }
    await fetchCategories();
  }


  const onSubmit = async (values) => {

    const addDataResaponse = await addData('categories',  values.title, values.videoId, values.videoTitle);
    if (addDataResaponse.error) {
      toast({
        title: 'Error',
        description: "Error in saving category",
        status: 'error',
        duration: 9000,
        isClosable: true,
      });
      return;
    }

    // const addSubDataResaponse = await addSubData('categories', values.title, null,
    //   { title: values.videoTitle, videoId: values.videoId });
    // if (addSubDataResaponse.error) {
    //   toast({
    //     title: 'Error',
    //     description: "Error in saving video",
    //     status: 'error',
    //     duration: 9000,
    //     isClosable: true,
    //   });
    // }
    await fetchCategories();
    onClose();
  }


  const renderModal = () => (<Box>
    <>
      <Button colorScheme='blue' size='md' margin={1} onClick={createCategoryHandler}>
        New
      </Button>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalContent>
            <ModalHeader>{mode === 'create' ? 'Create Category' : 'Update Category'}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <FormControl isInvalid={errors.title}>
                <FormLabel htmlFor='ttile'>Title</FormLabel>
                <Input
                  id='title'
                  placeholder='category title'
                  {...register('title', {
                    required: 'Category Title is required',
                    minLength: { value: 4, message: 'Minimum length should be 3' },
                  })}
                />
                <FormErrorMessage>
                  {errors.title && errors.title.message}
                </FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={errors.videoTitle}>
                <FormLabel htmlFor='videoTitle'>Video Title</FormLabel>
                <Input
                  id='videoTitle'
                  placeholder='Video title'
                  {...register('videoTitle', {
                    required: 'Video title is required',
                    minLength: { value: 4, message: 'Minimum length should be 3' },
                  })}
                />
                <FormErrorMessage>
                  {errors.videoTitle && errors.videoTitle.message}
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
    </>
  </Box>)

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
          Categories
        </Heading>
        {renderModal()}
        <TableContainer>
          <Table variant='striped'>
            <TableCaption>All Categories</TableCaption>
            <Thead>
              <Tr>
                <Th>Title</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {
                categories && categories.map((category, index) =>
                  <Tr key={index}>
                    <Td>{category.id}</Td>
                    <Td>


                      <Button colorScheme='red' size='sm' margin={1} onClick={() => deleteCategoryHandler(category.id)}>
                        Delete
                      </Button>

                      <Button colorScheme='teal' size='sm' margin={1} onClick={() => router.push(`videos/${category.id}`)}>
                        Videos
                      </Button>

                    </Td>
                  </Tr>
                )
              }
            </Tbody>
          </Table>
        </TableContainer>
      </Container>
    </>
  )
}
