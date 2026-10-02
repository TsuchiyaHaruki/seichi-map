package com.seichi.backend.support;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.http.Cookie;

/**
 * 本番と同じCSRF・Cookieフローを再現するテスト用クライアント。
 * 1インスタンス = 1ブラウザセッション(Cookieを保持し、状態変更時はX-XSRF-TOKENを付与)。
 */
public class ApiTestClient {

    private final MockMvc mockMvc;
    private final ObjectMapper objectMapper;
    private final Map<String, Cookie> cookieJar = new LinkedHashMap<>();

    public ApiTestClient(MockMvc mockMvc, ObjectMapper objectMapper) {
        this.mockMvc = mockMvc;
        this.objectMapper = objectMapper;
    }

    public MvcResult get(String path) throws Exception {
        return exchange(MockMvcRequestBuilders.get(path), false, null);
    }

    public MvcResult post(String path, String jsonBody) throws Exception {
        return exchange(MockMvcRequestBuilders.post(path), true, jsonBody);
    }

    public MvcResult put(String path, String jsonBody) throws Exception {
        return exchange(MockMvcRequestBuilders.put(path), true, jsonBody);
    }

    public MvcResult patch(String path, String jsonBody) throws Exception {
        return exchange(MockMvcRequestBuilders.patch(path), true, jsonBody);
    }

    public MvcResult delete(String path) throws Exception {
        return exchange(MockMvcRequestBuilders.delete(path), true, null);
    }

    /** multipart/form-data での送信(画像アップロード用) */
    public MvcResult upload(String path,
                            String partName,
                            String fileName,
                            String contentType,
                            byte[] content) throws Exception {
        MockMultipartFile part = new MockMultipartFile(partName, fileName, contentType, content);
        return exchange(MockMvcRequestBuilders.multipart(path).file(part), true, null);
    }

    public JsonNode json(MvcResult result) throws Exception {
        String content = result.getResponse().getContentAsString();
        return objectMapper.readTree(content);
    }

    private MvcResult exchange(MockHttpServletRequestBuilder builder,
                              boolean mutating,
                              String jsonBody) throws Exception {
        // 状態変更時は先にCSRFトークンを取得(Cookieジャーが更新される)。
        if (mutating) {
            builder.header("X-XSRF-TOKEN", ensureCsrfToken());
        }
        // Cookieはここで一度だけ付与する(二重付与すると回転前後のトークンが混在する)。
        List<Cookie> cookies = new ArrayList<>(cookieJar.values());
        if (!cookies.isEmpty()) {
            builder.cookie(cookies.toArray(new Cookie[0]));
        }
        if (jsonBody != null) {
            builder.contentType(MediaType.APPLICATION_JSON).content(jsonBody);
        }
        MvcResult result = mockMvc.perform(builder).andReturn();
        storeCookies(result);
        return result;
    }

    /** GET /auth/csrf でトークンを取得し、XSRF-TOKEN Cookieを保存する。 */
    private String ensureCsrfToken() throws Exception {
        MockHttpServletRequestBuilder builder = MockMvcRequestBuilders.get("/api/v1/auth/csrf");
        List<Cookie> cookies = new ArrayList<>(cookieJar.values());
        if (!cookies.isEmpty()) {
            builder.cookie(cookies.toArray(new Cookie[0]));
        }
        MvcResult result = mockMvc.perform(builder).andReturn();
        storeCookies(result);
        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        return body.get("token").asText();
    }

    private void storeCookies(MvcResult result) {
        Cookie[] responseCookies = result.getResponse().getCookies();
        if (responseCookies == null) {
            return;
        }
        // 同一レスポンス内で同名の削除(maxAge=0)と再設定が両方来る場合(CSRFトークン回転)は、
        // 再設定を優先する。順序に依存しないよう、有効なものを後勝ちで反映してから削除を適用する。
        for (Cookie cookie : responseCookies) {
            if (cookie.getMaxAge() != 0) {
                cookieJar.put(cookie.getName(), cookie);
            }
        }
        for (Cookie cookie : responseCookies) {
            boolean replaced = false;
            for (Cookie other : responseCookies) {
                if (other.getName().equals(cookie.getName()) && other.getMaxAge() != 0) {
                    replaced = true;
                    break;
                }
            }
            if (cookie.getMaxAge() == 0 && !replaced) {
                cookieJar.remove(cookie.getName());
            }
        }
    }
}
