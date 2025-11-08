import { Layout } from "antd";
const { Header, Content } = Layout;
import style from "./index.module.less";
import Lang from "@/components/Lang";
import UserInfo from "@/components/UserInfo";
import logo from "/image/logo.png";
import { eq, get } from "lodash";
import AppKitButton from "@/components/AppKitButton";

export default function layout() {
  const { setUser, token } = useUserStore();
  const { getUserInfo } = useApi();

  async function getUser() {
    try {
      const res = await getUserInfo();
      if (eq(res.code, 0)) {
        setUser(get(res, "data", {}));
      }
    } catch (error) {
      console.error(error);
    }
  }
  useEffect(() => {
    getUser();
  }, [token]);
  return (
    <Layout className={style.layout}>
      <Header className={style.header}>
        <div className={style.logo}>
          <img src={logo} />
          <p>BlessYou</p>
        </div>
        {/* <Theme /> */}
        <svg
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          p-id="13032"
          width="24"
          height="24"
          onClick={() => window.open("https://x.com/BlessYouLab")}>
          <path
            d="M778.41 96h141.142L611.2 448.427 973.952 928H689.92L467.456 637.141 212.906 928H71.68l329.813-376.96L53.504 96h291.243l201.088 265.856z m-49.535 747.52h78.208L302.25 176.043h-83.926z"
            fill="#252831"
            p-id="13033"></path>
        </svg>
        <Lang />
        {token ? <UserInfo /> : <AppKitButton />}
      </Header>
      <Content className={style.content}>
        <Outlet />
      </Content>
    </Layout>
  );
}
