package com.lifeos.backend.config;

import com.lifeos.backend.common.CryptoUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import jakarta.annotation.PostConstruct;

@Configuration
public class EncryptionConfig {

    @Value("${lifeos.encryption.key:LifeOSSecretKey12}")
    private String encryptionKey;

    @PostConstruct
    public void init() {
        CryptoUtils.setSecretKey(encryptionKey);
    }
}
