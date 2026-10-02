package com.seichi.backend.service;

import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.seichi.backend.dto.response.AdminUserResponse;
import com.seichi.backend.dto.response.PageResponse;
import com.seichi.backend.entity.User;
import com.seichi.backend.exception.NotFoundException;
import com.seichi.backend.repository.UserRepository;

@Service
public class AdminUserService {

    private final UserRepository userRepository;

    public AdminUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminUserResponse> list(Pageable pageable) {
        return PageResponse.of(userRepository.findAll(pageable), AdminUserResponse::of);
    }

    /**
     * ロック解除。failed_attempts=0, is_locked=false, locked_at=NULL。
     */
    @Transactional
    public AdminUserResponse unlock(Long id) {
        User user = findUser(id);
        user.setFailedAttempts(0);
        user.setLocked(false);
        user.setLockedAt(null);
        return AdminUserResponse.of(userRepository.save(user));
    }

    @Transactional
    public AdminUserResponse updateEnabled(Long id, boolean enabled) {
        User user = findUser(id);
        user.setEnabled(enabled);
        return AdminUserResponse.of(userRepository.save(user));
    }

    private User findUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("ユーザーが見つかりません。"));
    }
}
