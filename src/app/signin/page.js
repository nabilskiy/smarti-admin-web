'use client'

import React from "react";
import {
    Container, Heading,
    FormErrorMessage,
    FormLabel,
    FormControl,
    Input,
    Button,
    Stack,
} from "@chakra-ui/react";
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form'
import { useToast } from '@chakra-ui/react';
import signIn from "../firebase/auth/signin";

export default function Signin() {
    const router = useRouter();
    const toast = useToast();
    const {
        handleSubmit,
        register,
        formState: { errors, isSubmitting },
    } = useForm({
        email: null,
        password: null
    });

    const onSubmit = async (values) => {
        const {email,password} = values;
        const { result, error } = await signIn(email, password);

        if (error) {
            toast({
                title: 'Error',
                description: "Invalid credentials",
                status: 'error',
                duration: 9000,
                isClosable: true,
            });
           return;
        }
        return router.push("/");
    }

    return (<>
        <Container
            maxW="sm"
            mx="auto"
            px={{ base: 4, md: 0 }}
            py={{ base: 8, md: 16 }}
            w="100%"
        >
            <Heading mb={6}>
                Sign In
            </Heading>
            <form onSubmit={handleSubmit(onSubmit)}>
                <Stack spacing={4}>
                    <FormControl isInvalid={errors.email}>
                        <FormLabel htmlFor='email'>Email</FormLabel>
                        <Input
                            id='email'
                            placeholder='email'
                            {...register('email', {
                                required: 'Email is required',
                            })}
                        />
                        <FormErrorMessage>
                            {errors.email && errors.email.message}
                        </FormErrorMessage>
                    </FormControl>
                    <FormControl isInvalid={errors.password}>
                        <FormLabel htmlFor='password'>Password</FormLabel>
                        <Input
                            id='password'
                            type="password"
                            placeholder='password'
                            {...register('password', {
                                required: 'Password is required',
                            })}
                        />
                        <FormErrorMessage>
                            {errors.password && errors.password.message}
                        </FormErrorMessage>
                    </FormControl>
                    <Button
                        colorScheme='teal'
                        isLoading={isSubmitting}
                        type='submit'
                        w={{ base: '100%', md: 'auto' }}
                        alignSelf={{ base: 'stretch', md: 'flex-start' }}
                        mt={2}
                    >
                        Signin
                    </Button>
                </Stack>
            </form>
        </Container>
    </>)
}