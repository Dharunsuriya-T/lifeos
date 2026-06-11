package com.lifeos.backend.user.dto;

import jakarta.validation.constraints.NotBlank;

public record GoogleLoginRequest(

        @NotBlank
        String idToken

) {}