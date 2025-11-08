import style from "./index.module.less";

export const useBGAD = () => {
  const { isMobile } = useDevice();
  const { getAdBg } = useApi();
  const [ad, setAd] = useState<any[]>([]);

  const getAdBgData = useCallback(async () => {
    const res = await getAdBg();
    if (res.code === 0) {
      setAd(res.data);
    }
  }, [getAdBg]);
  // 广告背景墙
  useEffect(() => {
    getAdBgData();
  }, []);
  // 当前显示哪一份
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);

  const config = useMemo(
    () => ({
      col4: isMobile ? 2 : 5,
      col5: isMobile ? 3 : 6,
      forCount: isMobile ? 18 : 8,
      fillCount: 44,
    }),
    [isMobile],
  );
  const logosDataToShow = useMemo(() => {
    const result: any[][] = [];
    let index = 0;
    for (let i = 0; i < config.forCount; i++) {
      const count = i % 2 === 0 ? config.col4 : config.col5;
      result.push(ad.slice(index, index + count));
      index += count;
    }
    return result;
  }, [ad, config]);
  // 手机端时，切成 3 份
  const chunkedData = useMemo(() => {
    if (!isMobile) return [logosDataToShow];
    const chunkSize = Math.ceil(logosDataToShow.length / 3);
    const chunks = [];
    for (let i = 0; i < 3; i++) {
      chunks.push(logosDataToShow.slice(i * chunkSize, (i + 1) * chunkSize));
    }
    return chunks;
  }, [logosDataToShow, isMobile]);
  const itemClassName = (item: any[]) => {
    if (item.length === config.col4) {
      return style.col4;
    }
    return style.col5;
  };
  useEffect(() => {
    if (!isMobile) return;

    const interval = setInterval(() => {
      setCurrentChunkIndex(prev => (prev + 1) % 3);
    }, 10000); // 10 秒

    return () => clearInterval(interval);
  }, [isMobile]);
  // 当前要展示的部分
  const currentLogos = useMemo(() => (isMobile ? chunkedData[currentChunkIndex] : logosDataToShow), [isMobile, chunkedData, currentChunkIndex, logosDataToShow]);

  return {
    currentChunkIndex,
    currentLogos,
    itemClassName,
  };
};
