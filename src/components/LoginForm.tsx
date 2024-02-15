import { EmailIcon, LockIcon } from "@chakra-ui/icons";
import {
  Alert,
  AlertDescription,
  AlertIcon,
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
  onRequestLogin: (inputs: LoginInputs) => Promise<{ isSuccess: boolean }>;
}

const LoginForm: FC<LoginFormProps> = ({ onRequestLogin }) => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isValid, isSubmitting },
  } = useForm<LoginInputs>();

  const isSubmitButtonDisabled = !isValid;

  const onSubmit = handleSubmit(async (data) => {
    const { isSuccess } = await onRequestLogin(data);
    if (!isSuccess) {
      setError("root", {
        message:
          "ユーザー名またはメールアドレス、またはパスワードが間違っています",
      });
    }
  });

  return (
    <Box as="form" onSubmit={onSubmit} padding={4}>
      <Box display="flex" flexDirection="column" gap={4}>
        {errors.root && (
          <Alert status="error">
            <AlertIcon />
            <AlertDescription>{errors.root.message}</AlertDescription>
          </Alert>
        )}
        <FormControl isInvalid={!!errors.identifier}>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <EmailIcon color="gray.300" />
            </InputLeftElement>
            <Input
              placeholder="ユーザー名またはメールアドレス"
              autoComplete="username"
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
              autoComplete="password"
              {...register("password", { required: true })}
            />
          </InputGroup>
          {errors.password && (
            <FormErrorMessage>{errors.password.message}</FormErrorMessage>
          )}
        </FormControl>
        <Box display="flex" justifyContent="flex-end">
          <Button
            type="submit"
            isDisabled={isSubmitButtonDisabled}
            isLoading={isSubmitting}
            variant="ghost"
          >
            {`サインイン`}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default LoginForm;
