import enJSON from "@/locales/en.json";
import zhJSON from "@/locales/zh-CN.json";
import { useReactAt } from "i18n-auto-extractor/react";

export const useLang = () => {
  const lang = [
    { label: "简体中文", key: "zh-cn", json: zhJSON },
    { label: "English", key: "en", json: enJSON },
  ];
  const { setCurrentLang } = useReactAt();
  const { currentLang, setCurrentLang: putCurrentLang } = useConfigStore();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setLang = (code: "zh-cn" | "en") => {
    putCurrentLang(code);
    const data = lang.find(item => item.key === code);
    if (data) {
      setCurrentLang(data.key, data.json);
    }
  };
  // 初始化语言
  function initLang() {
    const langItem = lang.find(item => item.key === currentLang);
    if (langItem) {
      setCurrentLang(langItem.key, langItem.json);
    }
  }
  return {
    lang,
    currentLang,
    setLang,
    initLang,
  };
};
