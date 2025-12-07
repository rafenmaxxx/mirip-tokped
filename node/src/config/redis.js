import { createClient } from "redis";

const redis = createClient({
  socket: {
    host: process.env.REDIS_HOST || "redis",
    port: process.env.REDIS_PORT || 6379,
  },
});

redis.on("error", (err) => console.error("Redis Error:", err));
redis.on("connect", () => console.log("Redis connected"));

await redis.connect();

export function phpUnserialize(str) {
  let offset = 0;

  function read() {
    const type = str[offset];
    offset += 2; // lewati "x:"

    if (type === "N") {
      offset++; // skip ";"
      return null;
    }

    if (type === "i") {
      const end = str.indexOf(";", offset);
      const val = parseInt(str.substring(offset, end));
      offset = end + 1;
      return val;
    }

    if (type === "s") {
      const lenEnd = str.indexOf(":", offset);
      const len = parseInt(str.substring(offset, lenEnd));
      offset = lenEnd + 2; // skip :"
      const val = str.substring(offset, offset + len);
      offset += len + 2; // skip ";
      return val;
    }

    if (type === "a") {
      const lenEnd = str.indexOf(":", offset);
      const length = parseInt(str.substring(offset, lenEnd));
      offset = lenEnd + 2; // skip :{

      const obj = {};
      for (let i = 0; i < length; i++) {
        const key = read();
        const value = read();
        obj[key] = value;
      }

      offset++; // skip "}"
      return obj;
    }

    throw new Error("Unknown PHP serialized type: " + type);
  }

  return read();
}

export default redis;
