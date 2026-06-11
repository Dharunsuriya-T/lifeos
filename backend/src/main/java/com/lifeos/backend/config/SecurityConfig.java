package com.lifeos.backend.config;

import com.lifeos.backend.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import lombok.RequiredArgsConstructor;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {

        return http
                .csrf(csrf -> csrf.disable())

                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/api/v1/health",
                                "/api/v1/auth/register",
                                "/api/v1/auth/login",
                                "/api/v1/auth/refresh",
                                "/api/v1/auth/logout",
                                "/api/v1/auth/google",
                                "/error"
                        )
                        .permitAll()

                        .anyRequest()
                        .authenticated()
                )

                .httpBasic(Customizer.withDefaults())

                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                )

                .build();
    }
}