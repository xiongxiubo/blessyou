import { useState, useEffect } from "react";

export function useDevice() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const mobile = /android|iphone|ipad|ipod|windows phone|mobile/i.test(userAgent);
      setIsMobile(mobile);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice); // 屏幕旋转或尺寸变化时重新检测

    return () => {
      window.removeEventListener("resize", checkDevice);
    };
  }, []);

  return { isMobile };
}
