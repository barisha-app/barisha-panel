// api/get.php.js
// Eski Xtream formatı isteyen uygulamalar için /get.php proxy'si
import handler from "./get";
export const config = { runtime: "edge" };
export default handler;
