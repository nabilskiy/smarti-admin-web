'use client'
import { Container, Button, Heading, Box, Flex } from '@chakra-ui/react';
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
import getSubDouments from './firebase/firestore/get-all-sub-data';
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
    const fetchedVideosResponse = await getSubDouments('categories', id);
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
    const addDataResaponse = await addData('categories', values.title, values.videoId, values.videoTitle);
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
    await fetchCategories();
    onClose();
  }


  const renderModal = () => (
    <Box>
      <>
        <Button
          colorScheme='blue'
          size='md'
          margin={1}
          onClick={createCategoryHandler}
          boxShadow='sm'
          _hover={{ boxShadow: 'md', transform: 'translateY(-1px)' }}
          _active={{ transform: 'translateY(0)' }}
        >
          New
        </Button>

        <Modal
          isOpen={isOpen}
          onClose={onClose}
          size={{ base: 'full', md: 'md' }}
        >
          <ModalOverlay bg='blackAlpha.600' backdropFilter='blur(4px)' />
          <form onSubmit={handleSubmit(onSubmit)}>
            <ModalContent borderRadius='xl' boxShadow='2xl'>
              <ModalHeader pb={2}>
                {mode === 'create' ? 'Create Category' : 'Update Category'}
              </ModalHeader>
              <ModalCloseButton top={4} right={4} />
              <ModalBody pt={2}>
                <FormControl isInvalid={errors.title} mb={4}>
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
                <FormControl isInvalid={errors.videoTitle} mb={4}>
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
                <Button colorScheme='blue' mr={3} onClick={onClose} variant='outline' _hover={{ bg: 'gray.50' }}>
                  Close
                </Button>
                <Button colorScheme='teal' isLoading={isSubmitting} type='submit' _hover={{ boxShadow: 'md' }}>
                  Save
                </Button>
              </ModalFooter>
            </ModalContent>
          </form>
        </Modal>
      </>
    </Box>
  )

  const signOutHandler = async () => {
    await signOutAndExit();
    router.push('signin');
  }

  return (
    <>
      <Container
        maxW="container.xl"
        mx="auto"
        px={{ base: 4, md: 8 }}
        py={{ base: 6, md: 10 }}
        w="100%"
      >
        <Box
          bg="white"
          borderRadius="xl"
          boxShadow="sm"
          p={{ base: 5, md: 8 }}
          mb={8}
        >
          <Flex
            direction={{ base: 'column', md: 'row' }}
            align={{ base: 'flex-start', md: 'center' }}
            justify="space-between"
            gap={4}
            mb={8}
          >
            <Heading size="lg" fontWeight="600" color="gray.800">
              Categories
            </Heading>
            <Flex
              direction={{ base: 'column', sm: 'row' }}
              align={{ base: 'stretch', sm: 'center' }}
              gap={3}
              wrap="wrap"
            >
              <Button
                colorScheme='orange'
                size='md'
                onClick={signOutHandler}
                w={{ base: '100%', sm: 'auto' }}
                boxShadow='sm'
                _hover={{ boxShadow: 'md', transform: 'translateY(-1px)' }}
                _active={{ transform: 'translateY(0)' }}
              >
                Sign Out
              </Button>
              {renderModal()}
            </Flex>
          </Flex>
          <TableContainer maxW="100%" overflowX="auto" borderRadius="lg" borderWidth="1px" borderColor="gray.100" overflow="hidden">
            <Table variant='striped' size="sm">
              <TableCaption placement="top" textAlign="left" fontWeight="500" color="gray.600" mb={2}>All Categories</TableCaption>
              <Thead bg="gray.50">
                <Tr>
                  <Th py={4}>Title</Th>
                  <Th py={4}>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {
                  categories && categories.map((category, index) =>
                    <Tr key={index} _hover={{ bg: 'gray.50' }} transition="background 0.15s">
                      <Td py={4} fontWeight="500">{category.id}</Td>
                      <Td py={4}>
                        <Flex wrap="wrap" gap={2}>
                          <Button
                            colorScheme='red'
                            size='sm'
                            onClick={() => deleteCategoryHandler(category.id)}
                            _hover={{ boxShadow: 'sm' }}
                          >
                            Delete
                          </Button>
                          <Button
                            colorScheme='teal'
                            size='sm'
                            onClick={() => router.push(`videos/${category.id}`)}
                            _hover={{ boxShadow: 'sm' }}
                          >
                            Videos
                          </Button>
                        </Flex>
                      </Td>
                    </Tr>
                  )
                }
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
      </Container>
    </>
  )
}
