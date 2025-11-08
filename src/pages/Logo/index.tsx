import style from "./index.module.less";
import logo from "/image/biclogo.png";
import bless from "/image/blessULoading.png";

export default function Logo() {
  // 创建一个数组，里面有10项
  const logos = Array.from({ length: 4 });

  return (
    <div className={style.binance}>
      {logos.map(() => (
        <>
          <div className={style.col4}>
            {Array.from({ length: 5 }).map(() => (
              <div className={style.item}>
                <img src={logo} />
                <span>BINANCE</span>
              </div>
            ))}
          </div>
          <div className={style.col5}>
            {Array.from({ length: 6 }).map(() => (
              <div className={style.item}>
                <img src={bless} />
                <span>BLESSU</span>
              </div>
            ))}
          </div>
        </>
      ))}
    </div>
  );
}
// export default function LogoCanvas() {
//   const canvasRef = useRef<HTMLCanvasElement>(null);

//   useEffect(() => {
//     if (!canvasRef.current) return;
//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext("2d");

//     const canvasWidth = window.innerWidth;
//     const canvasHeight = window.innerHeight;
//     canvas.width = canvasWidth;
//     canvas.height = canvasHeight;

//     // 背景
//     if (!ctx) return;
//     ctx.fillStyle = "#fdcf1b";
//     ctx.fillRect(0, 0, canvasWidth, canvasHeight);

//     const img = new Image();
//     img.src = logo;

//     img.onload = () => {
//       const rowGap = 60; // 每行之间的间距
//       const logoWidth = 200;
//       const logoHeight = (img.height / img.width) * logoWidth;
//       const startY = (canvasHeight - (8 * logoHeight + 3 * rowGap)) / 2;

//       for (let i = 0; i < 4; i++) {
//         // col4 行
//         const y4 = startY + i * 2 * (logoHeight + rowGap);
//         drawRow(ctx, img, 4, canvasWidth, y4, logoWidth, logoHeight);

//         // col5 行
//         const y5 = y4 + logoHeight + rowGap;
//         drawRow(ctx, img, 5, canvasWidth, y5, logoWidth, logoHeight);
//       }
//     };
//   }, []);

//   const drawRow = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, count: number, canvasWidth: number, y: number, logoWidth: number, logoHeight: number) => {
//     const totalWidth = count * logoWidth;
//     const spacing = (canvasWidth - totalWidth) / (count + 1);
//     for (let i = 0; i < count; i++) {
//       const x = spacing + i * (logoWidth + spacing);
//       ctx.drawImage(img, x, y, logoWidth, logoHeight);
//     }
//   };

//   return (
//     <canvas
//       ref={canvasRef}
//       style={{
//         width: "100%",
//         height: "100vh",
//         display: "block",
//       }}
//     />
//   );
// }
