let subscribers = [];

export function showToast(title, message) {
  subscribers.forEach((fn) => fn({ title, message }));
}

// dipanggil dari ToastContainer
export function subscribeToast(fn) {
  subscribers.push(fn);

  return () => {
    subscribers = subscribers.filter((x) => x !== fn);
  };
}
