import { BrowserRouter, Route, Routes } from "react-router-dom";
// 懒加载
const Home = lazy(() => import("@/pages/Home"));
import Layout from "@/layout";
const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Layout />}>
          <Route
            index
            element={<Home />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
export default Router;
