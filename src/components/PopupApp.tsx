import { EmailIcon, LockIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  Input,
  InputGroup,
  InputLeftElement,
} from "@chakra-ui/react";
import { type FC } from "react";

import "react-hook-form";

import { useForm } from "react-hook-form";

import { useBlueskyApi } from "~hooks/useBlueskyApi";

interface Inputs {
  identifier: string;
  password: string;
}

const PopupApp: FC = () => {
  const { login, profile } = useBlueskyApi();
  console.log("profile", profile);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<Inputs>();

  const isSubmitButtonDisabled = !isValid;

  const onSubmit = handleSubmit((data) => {
    console.log(data);
    login(data.identifier, data.password);
  });

  return (
    <Box padding={5} width={400}>
      <form onSubmit={onSubmit}>
        <FormControl isInvalid={!!errors.identifier}>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <EmailIcon color="gray.300" />
            </InputLeftElement>
            <Input
              placeholder="ユーザー名またはメールアドレス"
              {...register("identifier", { required: true })}
            />
          </InputGroup>
          {errors.identifier && (
            <FormErrorMessage>{errors.identifier.message}</FormErrorMessage>
          )}
        </FormControl>
        <FormControl isInvalid={!!errors.password}>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <LockIcon color="gray.300" />
            </InputLeftElement>
            <Input
              placeholder="パスワード"
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
