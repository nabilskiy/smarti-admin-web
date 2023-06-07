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
import getDouments from './firebase/firestore/get-all-data';
import addData from './firebase/firestore/add-data';
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

export default function Categories() {
  const { user } = useAuthContext()

  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const {
    handleSubmit,
    register,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    title: null
  });
  const toast = useToast();
  const [categories, setCategories] = useState([]);

  const { isOpen, onOpen, onClose } = useDisclosure()
  const [mode, setMode] = useState('create');
  const fetchCategories = async () => {
    const fetchedCategoriesResponse = await getDouments('categories');
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
    setSelectedCategory(null);
    onOpen()
  }

  const updateCategoryHandler = (id) => {
    setMode('update');
    const category = categories.find(f => f.id === id);
    if (category) {
      setSelectedCategory(category);
      setValue('title', category.title);
      onOpen();
    } else {
      toast({
        title: 'Error',
        description: "The selected category was not found",
        status: 'error',
        duration: 9000,
        isClosable: true,
      });
    }
  }


  const onSubmit = async (values) => {
    const id = selectedCategory ? selectedCategory.id : null;
    const addDataResaponse = await addData('categories', id, values);
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
    setSelectedCategory(null);
    if (mode === 'create') {
      const newCategoryId = addDataResaponse.result.id;
      router.push(`videos/${newCategoryId}`)
    } else {
      await fetchCategories();
    }
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
                    <Td>{category.title}</Td>
                    <Td>
                      <Button colorScheme='yellow' size='sm' margin={1} onClick={() => updateCategoryHandler(category.id)}>
                        Edit
                      </Button>

                      <Button colorScheme='red' size='sm' margin={1}>
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
