"use client";

import { useEffect, useState } from "react";

function Check() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/product")
      .then((res) => {
        if (!res.ok) throw new Error("HTTP Error: " + res.status);
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <>Loading...</>;
  if (error) return <>Error: {error}</>;

  return (
    <>
      <h1 >Halo dari check</h1>
      <h2>Data Product dari php api:</h2>

      <pre>{JSON.stringify(data, null, 2)}</pre>
    </>
  );
}

export default Check;
