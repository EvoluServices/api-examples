export const regexName = /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/;

export function isNameValid(name: string): boolean {
    return name.trim().length > 0 && regexName.test(name);
}
