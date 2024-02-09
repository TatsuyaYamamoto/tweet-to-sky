import { EmailIcon, LockIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  InputGroup,
  InputLeftElement,
} from "@chakra-ui/react";
import { type FC } from "react";

import "react-hook-form";

import { useForm } from "react-hook-form";

interface Inputs {
  email: string;
  password: string;
}

const PopupApp: FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<Inputs>();

  const isSubmitButtonDisabled = !isValid;

  const onSubmit = handleSubmit((data) => {
    console.log(data);
  });

  return (
    <Box padding={5} width={200}>
      <form onSubmit={onSubmit}>
        <FormControl isInvalid={!!errors.email}>
          <FormLabel>メールアドレス</FormLabel>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <EmailIcon color="gray.300" />
            </InputLeftElement>
            <Input
              placeholder="メールアドレスを入力してください"
              {...register("email", { required: true })}
            />
          </InputGroup>
          {errors.email && (
            <FormErrorMessage>{errors.email.message}</FormErrorMessage>
          )}
        </FormControl>
        <FormControl isInvalid={!!errors.password}>
          <FormLabel>パスワード</FormLabel>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <LockIcon color="gray.300" />
            </InputLeftElement>
            <Input
              placeholder="パスワードを入力してください"
              type="password"
              {...register("password", { required: true })}
            />
          </InputGroup>
          {errors.password && (
            <FormErrorMessage>{errors.password.message}</FormErrorMessage>
          )}
        </FormControl>
        <Button type="submit" isDisabled={isSubmitButtonDisabled}>
          {`ログイン`}
        </Button>
      </form>
    </Box>
  );
};

export default PopupApp;
