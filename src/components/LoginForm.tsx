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


import { useForm } from "react-hook-form";

export interface LoginInputs {
  identifier: string;
  password: string;
}

interface LoginFormProps {
  onRequestLogin: (inputs: LoginInputs) => void;
}

const LoginForm: FC<LoginFormProps> = ({ onRequestLogin }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginInputs>();

  const isSubmitButtonDisabled = !isValid;

  const onSubmit = handleSubmit((data) => {
    onRequestLogin(data);
  });

  return (
    <Box as="form" onSubmit={onSubmit}>
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
    </Box>
  );
};

export default LoginForm;
