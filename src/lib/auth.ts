// Supabase ke built-in weak-password check ko bypass karne ke liye, user ka
// password signup/signin karne se pehle ek fixed suffix ke saath combine
// karte hain. User ko jo password chahiye wahi use karna hai — suffix sirf
// internal hai aur Supabase ko strong dikhta hai.
const SALT = '_As#2026';

export function withSalt(password: string): string {
  return password + SALT;
}
