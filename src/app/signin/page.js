'use client'

import React from "react";
import {
    Container, Heading,
    FormErrorMessage,
    FormLabel,
    FormControl,
    Input,
    Button,
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
        <Container margin={10} w="100%">
            <Heading>
                Sign In
            </Heading>
            <form onSubmit={handleSubmit(onSubmit)}>
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
              <Button colorScheme='teal' isLoading={isSubmitting} type='submit' m={5}>
                Signin
              </Button>
            </form>
        </Container>
    </>)
}