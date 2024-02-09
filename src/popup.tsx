import { ChakraProvider } from "@chakra-ui/react";

import PopApp from "~/components/PopupApp";

function IndexPopup() {
  return (
    <ChakraProvider>
      <PopApp />
    </ChakraProvider>
  );
}

export default IndexPopup;
