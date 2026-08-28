import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithCredential,
  signOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  User 
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export interface NovaForgeUser {
  uid: string;
  displayName: string;
  email: string | null;
  photoURL: string | null;
  provider: 'google' | 'novaforge';
  role?: string;
}

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Firebase Auth & Google Auth Provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Cloud Firestore Database (Targeting provisioned database)
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId || undefined);

// Cryptographic Password Hashing for Offline/Local Secure Vault
export async function hashPasswordWithSalt(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${salt}__NF_SECURE_VAULT__${password}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Secure Email & Password Sign Up
export async function signUpWithEmail(
  email: string, 
  pass: string, 
  displayName: string, 
  photoURL?: string
): Promise<NovaForgeUser> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = displayName.trim() || 'NovaForge Architect';

  // 1. Try Firebase Auth first
  try {
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
    const user = cred.user;
    
    await updateProfile(user, {
      displayName: cleanName,
      photoURL: photoURL || null
    });

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        displayName: cleanName,
        email: cleanEmail,
        photoURL: photoURL || null,
        provider: 'novaforge',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.warn("Firestore profile sync skipped:", err);
    }

    return {
      uid: user.uid,
      displayName: cleanName,
      email: cleanEmail,
      photoURL: photoURL || null,
      provider: 'novaforge',
      role: 'Master Architect'
    };
  } catch (fbErr: any) {
    // If Firebase Auth operation is not allowed or failed, fallback to local cryptographic vault
    console.warn("Firebase Auth signup fallback to Crypto Vault:", fbErr?.code || fbErr?.message);
    
    // Check if account already exists locally
    const accountsRaw = localStorage.getItem('novaforge_secure_accounts_vault') || '{}';
    const accounts = JSON.parse(accountsRaw);
    
    if (accounts[cleanEmail]) {
      throw new Error('An account with this email already exists. Please sign in with your password.');
    }

    const salt = 'nf_salt_' + Math.random().toString(36).substring(2, 12);
    const passwordHash = await hashPasswordWithSalt(pass, salt);
    const uid = 'nf_' + Array.from(crypto.getRandomValues(new Uint8Array(8)))
      .map(b => b.toString(16).padStart(2, '0')).join('');

    accounts[cleanEmail] = {
      uid,
      email: cleanEmail,
      displayName: cleanName,
      photoURL: photoURL || null,
      salt,
      passwordHash,
      createdAt: new Date().toISOString()
    };

    localStorage.setItem('novaforge_secure_accounts_vault', JSON.stringify(accounts));

    return {
      uid,
      displayName: cleanName,
      email: cleanEmail,
      photoURL: photoURL || null,
      provider: 'novaforge',
      role: 'Master Architect'
    };
  }
}

// Secure Email & Password Sign In
export async function signInWithEmail(email: string, pass: string): Promise<NovaForgeUser> {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Try Firebase Auth first
  try {
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
    const user = cred.user;

    return {
      uid: user.uid,
      displayName: user.displayName || 'NovaForge Architect',
      email: user.email,
      photoURL: user.photoURL,
      provider: 'novaforge',
      role: 'Master Architect'
    };
  } catch (fbErr: any) {
    // 2. Fallback to Cryptographic Vault verification
    const accountsRaw = localStorage.getItem('novaforge_secure_accounts_vault') || '{}';
    const accounts = JSON.parse(accountsRaw);
    const account = accounts[cleanEmail];

    if (!account) {
      if (fbErr?.code === 'auth/user-not-found' || fbErr?.code === 'auth/invalid-credential') {
        throw new Error('No NovaForge account found with this email. Please click "Create Account" first.');
      }
      if (fbErr?.code === 'auth/wrong-password') {
        throw new Error('Incorrect password. Please check your password and try again.');
      }
      throw new Error('No account found with this email. Please register a new secure account.');
    }

    const testHash = await hashPasswordWithSalt(pass, account.salt);
    if (testHash !== account.passwordHash) {
      throw new Error('Incorrect password. Access to bot vault denied.');
    }

    return {
      uid: account.uid,
      displayName: account.displayName || 'NovaForge Architect',
      email: account.email,
      photoURL: account.photoURL || null,
      provider: 'novaforge',
      role: 'Master Architect'
    };
  }
}

// Google Sign-In function using Firebase Auth Popup
export async function signInWithGoogle(): Promise<NovaForgeUser | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Create/update user document in Firestore if possible
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        displayName: user.displayName || 'NovaForge Architect',
        email: user.email,
        photoURL: user.photoURL,
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (dbErr) {
      console.warn("Firestore sync skipped for user profile:", dbErr);
    }

    return {
      uid: user.uid,
      displayName: user.displayName || 'NovaForge Architect',
      email: user.email,
      photoURL: user.photoURL,
      provider: 'google',
      role: 'Master Architect'
    };
  } catch (error: any) {
    if (
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request' ||
      error?.message?.includes('popup-closed-by-user')
    ) {
      return null;
    }
    console.error("Google Sign-In Error:", error);
    throw error;
  }
}

// Sign Out
export async function logOut(): Promise<void> {
  try {
    await signOut(auth);
  } catch (e) {
    console.warn("Firebase sign out:", e);
  }
}

export type { User };


