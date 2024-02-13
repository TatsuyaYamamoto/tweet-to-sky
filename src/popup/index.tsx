import { ChakraProvider } from "@chakra-ui/react";

import PopApp from "~components/PopupApp";

function PopupIndex() {
  return (
    <ChakraProvider>
      <PopApp />
    </ChakraProvider>
  );
}

export default PopupIndex;
