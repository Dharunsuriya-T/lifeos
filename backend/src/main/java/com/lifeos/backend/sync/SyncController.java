package com.lifeos.backend.sync;

import com.lifeos.backend.sync.dto.SyncRequest;
import com.lifeos.backend.sync.dto.SyncResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/sync")
@RequiredArgsConstructor
public class SyncController {

    private final SyncService syncService;

    @PostMapping
    public SyncResponse sync(@RequestBody SyncRequest request) {
        return syncService.sync(request);
    }
}
