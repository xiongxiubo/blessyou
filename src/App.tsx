import "@ant-design/v5-patch-for-react-19";
import { ConfigProvider, theme, App as AntdApp } from "antd";
import Router from "./router";
const savedDarkMode = localStorage.getItem("darkMode") === "true";
import "./style/index.less";
import "./style/theme.less";

export default function App() {
  return (
    <ConfigProvider
      theme={{
        algorithm: savedDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}>
      <AntdApp>
        <Router />
      </AntdApp>
    </ConfigProvider>
  );
}
