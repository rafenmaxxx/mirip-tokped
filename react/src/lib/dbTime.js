export const getDbNow = async () => {
  try {
    const res = await fetch("http://localhost:80/node/api/time");
    const data = await res.json();

    return data.data.timestamp * 1000;
  } catch {
    console.log("error get DBNow ");
    return Date.now();
  }
};
