import reactToastifyStyle from "data-text:react-toastify/dist/ReactToastify.css";
import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo";
import { useEffect, type FC } from "react";
import { toast, ToastContainer } from "react-toastify";

export const config: PlasmoCSConfig = {
  matches: ["https://twitter.com/*"],
};

window.addEventListener("load", () => {
  console.log("content script loaded 🦋");
});

const ContentScriptUi: FC = () => {
  const notify = () =>
    toast(() => <div>{"送信完了 🦋"}</div>, {
      autoClose: 2000,
      position: "bottom-right",

      type: "success",
      theme: "colored",
    });

  useEffect(() => {
    notify();
  }, []);

  return (
    <>
      <ToastContainer />
    </>
  );
};

export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style");
  style.textContent = `
  ${reactToastifyStyle.replace(":root", ":host")}
  :host {
    --toastify-color-success: rgb(0, 112, 255);
  }
  `;
  return style;
};

export default ContentScriptUi;
