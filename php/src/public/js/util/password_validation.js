export function ValidatePassword(pass) {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

  return regex.test(pass);
}
