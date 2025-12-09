let subscribers = [];

export function showToast(title, message, type = "success") {
  subscribers.forEach((fn) => fn({ title, message, type }));
}

// dipanggil dari ToastContainer
export function subscribeToast(fn) {
  subscribers.push(fn);

  return () => {
    subscribers = subscribers.filter((x) => x !== fn);
  };
}
