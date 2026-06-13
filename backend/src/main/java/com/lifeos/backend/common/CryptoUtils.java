package com.lifeos.backend.common;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.security.Key;
import java.util.Base64;

public class CryptoUtils {
    private static final String ALGORITHM = "AES/ECB/PKCS5Padding";
    private static byte[] keyBytes = "LifeOSSecretKey12".getBytes(); // 16 bytes default key

    public static void setSecretKey(String key) {
        if (key != null && (key.length() == 16 || key.length() == 24 || key.length() == 32)) {
            keyBytes = key.getBytes();
        }
    }

    public static String encrypt(String value) {
        if (value == null) {
            return null;
        }
        try {
            Key key = new SecretKeySpec(keyBytes, "AES");
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, key);
            return Base64.getEncoder().encodeToString(cipher.doFinal(value.getBytes()));
        } catch (Exception e) {
            throw new RuntimeException("Encryption failed", e);
        }
    }

    public static String decrypt(String encryptedValue) {
        if (encryptedValue == null) {
            return null;
        }
        try {
            Key key = new SecretKeySpec(keyBytes, "AES");
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, key);
            return new String(cipher.doFinal(Base64.getDecoder().decode(encryptedValue)));
        } catch (Exception e) {
            // Fallback for pre-existing plain text entries in the database to prevent crashes.
            return encryptedValue;
        }
    }
}
