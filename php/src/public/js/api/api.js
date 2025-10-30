export function GET(url, params = {}, callback, err) {
  const query = Object.keys(params)
    .map(
      (key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`
    )
    .join("&");

  const req_url = query ? `${url}?${query}` : url;

  const xhr = new XMLHttpRequest();
  xhr.open("GET", req_url, true);
  xhr.withCredentials = true;
  xhr.onload = function () {
    if (xhr.status === 200) {
      try {
        const data = JSON.parse(xhr.responseText);
        err(false);
        callback(data);
      } catch (parseErr) {
        console.error("JSON parse error:", parseErr);
        err(true);
      }
    } else {
      console.error("Request failed. Status:", xhr.status);
      err(true);
    }
  };

  xhr.onerror = function () {
    console.error("Network error -> " + req_url);
  };

  xhr.send();
}

export function GETMODULE(url, params = {}, callback, err) {
  const query = Object.keys(params)
    .map(
      (key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`
    )
    .join("&");

  const req_url = query ? `${url}?${query}` : url;

  const xhr = new XMLHttpRequest();
  xhr.open("GET", req_url, true);
  xhr.withCredentials = true;
  xhr.onload = function () {
    if (xhr.status === 200) {
      try {
        const data = xhr.responseText;
        err(false);
        callback(data);
      } catch (parseErr) {
        console.error("JSON parse error:", parseErr);
        err(true);
      }
    } else {
      console.error("Request failed. Status:", xhr.status);
      err(true);
    }
  };

  xhr.onerror = function () {
    console.error("Network error -> " + req_url);
  };

  xhr.send();
}

export function POST(url, params = {}, callback, err) {
  const form_param = Object.keys(params)
    .map(
      (key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`
    )
    .join("&");

  const xhr = new XMLHttpRequest();
  xhr.open("POST", url, true);
  xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  xhr.withCredentials = true;
  xhr.onload = function () {
    if (xhr.status === 200) {
      try {
        const data = JSON.parse(xhr.responseText);
        callback(data);
      } catch (parseErr) {
        console.error("JSON parse error:", parseErr);
        err(true);
      }
    } else {
      console.error("Request failed. Status:", xhr.status);
      err(true);
    }
  };

  xhr.onerror = function () {
    console.error("Network error -> " + url);
  };

  xhr.send(form_param);
}

export function PUT(url, params = {}, callback, err) {
  const form_param = Object.keys(params)
    .map(
      (key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`
    )
    .join("&");

  const xhr = new XMLHttpRequest();
  xhr.open("PUT", url, true);
  xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  xhr.withCredentials = true;
  xhr.onload = function () {
    if (xhr.status === 200) {
      try {
        const data = JSON.parse(xhr.responseText);
        err(false);
        callback(data);
      } catch (parseErr) {
        console.error("JSON parse error:", parseErr);
        err(true);
      }
    } else {
      console.error("Request failed. Status:", xhr.status);
      err(true);
    }
  };

  xhr.onerror = function () {
    console.error("Network error -> " + req_url);
  };

  xhr.send(form_param);
}

export function DELETE(url, params = {}, callback, err) {
  const query = Object.keys(params)
    .map(
      (key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`
    )
    .join("&");

  const req_url = query ? `${url}?${query}` : url;

  const xhr = new XMLHttpRequest();
  xhr.open("DELETE", req_url, true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.withCredentials = true;
  xhr.onload = function () {
    if (xhr.status === 200) {
      try {
        const data = JSON.parse(xhr.responseText);
        err(false);
        callback(data);
      } catch (parseErr) {
        console.error("JSON parse error:", parseErr);
        err(true);
      }
    } else {
      console.error("Request failed. Status:", xhr.status);
      err(true);
    }
  };

  xhr.onerror = function () {
    console.error("Network error -> " + req_url);
  };

  xhr.send();
}
