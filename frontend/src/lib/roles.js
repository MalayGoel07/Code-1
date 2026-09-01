export function getUserRole(user) {
  if (!user) {
    return null;
  }

  return user.user_metadata?.role || user.app_metadata?.role || null;
}

export function isPatientRole(role) {
  return role === "patient";
}

export function isCaretakerRole(role) {
  return role === "caretaker";
}
